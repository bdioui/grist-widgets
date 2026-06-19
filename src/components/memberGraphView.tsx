import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import type { Member, Partner, Project, ProjectMember } from "@/lib/types"
import { getMembers, getPartners, getProjects, getAllProjectMembers } from "@/lib/api"
import SearchInput from "@/components/SearchInput"

type Node    = { id: number; name: string; color: string; sub: string; partnerName: string }
type Edge    = { source: number; target: number; weight: number; projects: string[] }
type SimNode = Node & { x: number; y: number; vx: number; vy: number }

const REPULSION  = 4000
const SPRING     = 0.003
const TARGET_LEN = 160
const DAMPING    = 0.85
const GRAVITY    = 0.02
const MAX_LABEL  = 11

function trunc(name: string) {
    return name.length > MAX_LABEL ? name.slice(0, MAX_LABEL - 1) + '…' : name
}

function buildGraph(members: Member[], partners: Partner[], projects: Project[], projectMembers: ProjectMember[]) {
    const partnerColor = new Map<number, string>(partners.map(p => [p.id, p.color]))
    const partnerName  = new Map<number, string>(partners.map(p => [p.id, p.name]))
    const projectById  = new Map<number, string>(projects.map(p => [p.id, p.title]))

    const byProject = new Map<number, number[]>()
    for (const pm of projectMembers) {
        const list = byProject.get(pm.project_id) ?? []
        list.push(pm.member_id)
        byProject.set(pm.project_id, list)
    }

    const edgeMap = new Map<string, Edge>()
    for (const [projectId, memberIds] of byProject) {
        const projectName = projectById.get(projectId) ?? `Projet ${projectId}`
        for (let i = 0; i < memberIds.length; i++) {
            for (let j = i + 1; j < memberIds.length; j++) {
                const a   = Math.min(memberIds[i], memberIds[j])
                const b   = Math.max(memberIds[i], memberIds[j])
                const key = `${a}-${b}`
                const ex  = edgeMap.get(key)
                if (ex) { ex.weight++; ex.projects.push(projectName) }
                else edgeMap.set(key, { source: a, target: b, weight: 1, projects: [projectName] })
            }
        }
    }

    const allEdges = Array.from(edgeMap.values())

    // Seuls les membres existants dans la table Members
    const memberIds = new Set(members.map(m => m.id))
    const edges = allEdges.filter(e => memberIds.has(e.source) && memberIds.has(e.target))

    // Exclure les membres sans aucune connexion
    const connectedIds = new Set<number>()
    for (const e of edges) { connectedIds.add(e.source); connectedIds.add(e.target) }

    const nodes: Node[] = members
        .filter(m => connectedIds.has(m.id))
        .map(m => ({
            id:          m.id,
            name:        `${m.first_name} ${m.last_name}`,
            color:       partnerColor.get(m.partner_id) ?? '#94a3b8',
            sub:         m.position ?? m.status ?? '',
            partnerName: partnerName.get(m.partner_id) ?? '',
        }))

    return { nodes, edges }
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({
    nodes, edges, hoveredId, selectedId, onHover, onSelect, onFilter,
}: {
    nodes: Node[]
    edges: Edge[]
    hoveredId:  number | null
    selectedId: number | null
    onHover:  (id: number | null) => void
    onSelect: (id: number | null) => void
    onFilter: (ids: Set<number> | null) => void
}) {
    const [search,    setSearch]    = useState('')
    const [orgFilter, setOrgFilter] = useState<string | null>(null)
    const [minLinks,  setMinLinks]  = useState(1)

    const adjacency = useMemo(() => {
        const map = new Map<number, Set<number>>()
        for (const edge of edges) {
            if (!map.has(edge.source)) map.set(edge.source, new Set())
            if (!map.has(edge.target)) map.set(edge.target, new Set())
            map.get(edge.source)!.add(edge.target)
            map.get(edge.target)!.add(edge.source)
        }
        return map
    }, [edges])

    const sorted = useMemo(() =>
        [...nodes].sort((a, b) => (adjacency.get(b.id)?.size ?? 0) - (adjacency.get(a.id)?.size ?? 0)),
        [nodes, adjacency]
    )

    const maxLinks = useMemo(() =>
        Math.max(...nodes.map(n => adjacency.get(n.id)?.size ?? 0), 1),
        [nodes, adjacency]
    )

    const orgs = useMemo(() => {
        const seen = new Map<string, string>()
        for (const n of nodes) if (n.partnerName && !seen.has(n.partnerName)) seen.set(n.partnerName, n.color)
        return Array.from(seen.entries()).map(([name, color], i) => ({ id: i + 1, name, color }))
    }, [nodes])

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        return sorted.filter(n => {
            const links = adjacency.get(n.id)?.size ?? 0
            return (q === '' || n.name.toLowerCase().includes(q)) &&
                (orgFilter === null || n.partnerName === orgFilter) &&
                links >= minLinks
        })
    }, [sorted, search, orgFilter, minLinks, adjacency])

    useEffect(() => {
        const isDefault = search === '' && orgFilter === null && minLinks <= 1
        onFilter(isDefault ? null : new Set(filtered.map(n => n.id)))
    }, [filtered, search, orgFilter, minLinks, onFilter])

    const selectedNeighbors = useMemo(() => {
        if (selectedId === null) return null
        return Array.from(adjacency.get(selectedId) ?? []).flatMap(nid => {
            const nb   = nodes.find(n => n.id === nid)
            if (!nb) return []
            const a    = Math.min(selectedId, nid)
            const b    = Math.max(selectedId, nid)
            const edge = edges.find(e => e.source === a && e.target === b)
            return [{ node: nb, projects: edge?.projects ?? [] }]
        })
    }, [selectedId, adjacency, nodes, edges])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex flex-col gap-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Membres · {filtered.length}{filtered.length < nodes.length ? `/${nodes.length}` : ''}
                </p>
                <div className="flex items-center gap-1">
                    <SearchInput
                        data={sorted}
                        getLabel={n => n.name}
                        onSelect={n => { setSearch(n.name); onSelect(n.id) }}
                        value={search}
                        placeholder="Rechercher…"
                        renderItem={n => (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: n.color }} />
                                <span className="flex flex-col leading-tight">
                                    <span>{n.name}</span>
                                    {n.partnerName && <span className="text-[10px] text-gray-400">{n.partnerName}</span>}
                                </span>
                            </span>
                        )}
                    />
                    {search !== '' && (
                        <button
                            onClick={() => { setSearch(''); onSelect(null) }}
                            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Effacer"
                        >
                            ×
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <SearchInput
                        data={orgs}
                        getLabel={o => o.name}
                        onSelect={o => setOrgFilter(prev => prev === o.name ? null : o.name)}
                        value={orgFilter ?? ''}
                        placeholder="Établissement…"
                        renderItem={o => (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: o.color }} />
                                <span>{o.name}</span>
                            </span>
                        )}
                        dropdownClassName="text-xs"
                    />
                    {orgFilter !== null && (
                        <button
                            onClick={() => setOrgFilter(null)}
                            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Effacer le filtre"
                        >
                            ×
                        </button>
                    )}
                </div>
                <div className="flex gap-1 flex-wrap">
                    {[1, 2, 3, 5, 10].map(n => (
                        <button
                            key={n}
                            onClick={() => setMinLinks(n)}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                                minLinks === n ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {n === 1 ? '1+ lien' : `${n}+ liens`}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filtered.map(node => {
                    const links    = adjacency.get(node.id)?.size ?? 0
                    const isHov    = hoveredId  === node.id
                    const isSel    = selectedId === node.id
                    const isDimmed = selectedId !== null && !isSel && !(adjacency.get(selectedId)?.has(node.id))

                    return (
                        <div key={node.id}>
                            <button
                                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                                    isSel ? 'bg-indigo-50' : isHov ? 'bg-gray-50' : ''
                                } ${isDimmed ? 'opacity-30' : ''}`}
                                onMouseEnter={() => onHover(node.id)}
                                onMouseLeave={() => onHover(null)}
                                onClick={() => onSelect(isSel ? null : node.id)}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ background: node.color }}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className={`text-xs truncate ${isSel ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                        {node.name}
                                    </span>
                                    <span className="text-[9px] text-gray-400 truncate">{node.partnerName}</span>
                                </div>
                                <span className={`text-[10px] shrink-0 ${isSel ? 'text-indigo-500 font-semibold' : 'text-gray-400'}`}>
                                    {links}
                                </span>
                                <div className="w-10 shrink-0">
                                    <div
                                        className="h-1 rounded-full"
                                        style={{
                                            width:      `${(links / maxLinks) * 100}%`,
                                            background: isSel ? node.color : '#d1d5db',
                                        }}
                                    />
                                </div>
                            </button>

                            {isSel && selectedNeighbors && (
                                <div className="bg-indigo-50 border-t border-indigo-100 px-3 py-2 flex flex-col gap-2">
                                    <p className="text-[10px] font-semibold text-indigo-500">
                                        {selectedNeighbors.length} collègue{selectedNeighbors.length > 1 ? 's' : ''}
                                        {' · '}
                                        {new Set(selectedNeighbors.flatMap(n => n.projects)).size} projet{new Set(selectedNeighbors.flatMap(n => n.projects)).size > 1 ? 's' : ''} en commun
                                    </p>
                                    {selectedNeighbors.map(({ node: nb, projects }) => (
                                        <div key={nb.id} className="flex items-start gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                                                style={{ background: nb.color }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium text-gray-600 leading-tight truncate">{nb.name}</p>
                                                <div className="flex flex-wrap gap-0.5 mt-0.5">
                                                    {projects.map((p, i) => (
                                                        <span key={i} className="text-[8px] bg-white text-gray-400 border border-gray-200 rounded px-1 py-px leading-tight">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MemberGraph() {
    const canvasRef    = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const tooltipRef   = useRef<HTMLDivElement>(null)
    const hoveredRef   = useRef<number | null>(null)
    const selectedRef  = useRef<number | null>(null)
    const filterIdsRef = useRef<Set<number> | null>(null)
    const transformRef = useRef({ x: 0, y: 0, scale: 1 })
    const [graph, setGraph]           = useState<{ nodes: Node[]; edges: Edge[] } | null>(null)
    const [hoveredId, setHoveredId]   = useState<number | null>(null)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    useEffect(() => {
        Promise.all([getMembers(), getPartners(), getProjects(), getAllProjectMembers()])
            .then(([m, p, proj, pm]) => setGraph(buildGraph(m, p, proj, pm)))
    }, [])

    const handleHover  = useCallback((id: number | null) => { hoveredRef.current = id;  setHoveredId(id)  }, [])
    const handleSelect = useCallback((id: number | null) => { selectedRef.current = id; setSelectedId(id) }, [])
    const handleFilter = useCallback((ids: Set<number> | null) => { filterIdsRef.current = ids }, [])

    useEffect(() => {
        if (!canvasRef.current || !graph || !containerRef.current || !tooltipRef.current) return
        const canvas    = canvasRef.current    as HTMLCanvasElement
        const container = containerRef.current as HTMLDivElement
        const tooltip   = tooltipRef.current   as HTMLDivElement
        const g         = graph as NonNullable<typeof graph>
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        if (!ctx) return

        const W = canvas.parentElement?.offsetWidth ?? 500
        const H = 420
        canvas.width  = W
        canvas.height = H
        const cx = W / 2, cy = H / 2

        const simNodes: SimNode[] = g.nodes.map((node, i) => {
            const angle = (2 * Math.PI * i) / g.nodes.length - Math.PI / 2
            const r = Math.min(cx, cy) * 0.6
            return { ...node, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0 }
        })

        const nodeById  = new Map<number, SimNode>(simNodes.map(n => [n.id, n]))
        const adjacency = new Map<number, Set<number>>()
        for (const edge of g.edges) {
            if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set())
            if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set())
            adjacency.get(edge.source)!.add(edge.target)
            adjacency.get(edge.target)!.add(edge.source)
        }

        let dragging:    SimNode | null = null
        let isPanning  = false
        let mouseDownScreen = { x: 0, y: 0 }
        let panOrigin       = { x: 0, y: 0 }

        function screenPos(e: MouseEvent) {
            const rect = canvas.getBoundingClientRect()
            return {
                x: (e.clientX - rect.left) * (W / rect.width),
                y: (e.clientY - rect.top)  * (H / rect.height),
            }
        }

        function toWorld(sx: number, sy: number) {
            const { x: tx, y: ty, scale } = transformRef.current
            return { x: (sx - tx) / scale, y: (sy - ty) / scale }
        }

        function onMouseDown(e: MouseEvent) {
            const s = screenPos(e)
            mouseDownScreen = s
            const w = toWorld(s.x, s.y)
            dragging = simNodes.find(n => Math.hypot(n.x - w.x, n.y - w.y) < 12) ?? null
            if (dragging) { canvas.style.cursor = 'grabbing'; return }
            isPanning  = true
            panOrigin  = { x: transformRef.current.x, y: transformRef.current.y }
            canvas.style.cursor = 'move'
        }

        function onMouseMove(e: MouseEvent) {
            const s = screenPos(e)
            const w = toWorld(s.x, s.y)

            if (dragging) {
                dragging.x = w.x; dragging.y = w.y
                dragging.vx = 0;  dragging.vy = 0
                tooltip.style.display = 'none'
                return
            }
            if (isPanning) {
                transformRef.current.x = panOrigin.x + (s.x - mouseDownScreen.x)
                transformRef.current.y = panOrigin.y + (s.y - mouseDownScreen.y)
                return
            }

            const hovered = simNodes.find(n => Math.hypot(n.x - w.x, n.y - w.y) < 12)
            canvas.style.cursor = hovered ? 'grab' : 'default'
            const newId = hovered?.id ?? null
            if (newId !== hoveredRef.current) handleHover(newId)

            if (hovered) {
                const cRect = container.getBoundingClientRect()
                tooltip.innerHTML = `<span style="font-weight:600">${hovered.name}</span><span style="color:#9ca3af;margin-left:6px;font-weight:400">${hovered.partnerName}</span>`
                tooltip.style.display = 'block'
                const left = Math.min(e.clientX - cRect.left + 12, cRect.width - 160)
                tooltip.style.left = `${left}px`
                tooltip.style.top  = `${e.clientY - cRect.top - 32}px`
            } else {
                tooltip.style.display = 'none'
            }
        }

        function onMouseUp(e: MouseEvent) {
            const s = screenPos(e)
            const moved = Math.hypot(s.x - mouseDownScreen.x, s.y - mouseDownScreen.y)
            if (!isPanning && moved < 4) {
                const w = toWorld(s.x, s.y)
                const clicked = simNodes.find(n => Math.hypot(n.x - w.x, n.y - w.y) < 12)
                const newSel  = clicked ? (selectedRef.current === clicked.id ? null : clicked.id) : null
                handleSelect(newSel)
            }
            dragging  = null
            isPanning = false
            canvas.style.cursor = 'default'
        }

        function onMouseLeave() {
            dragging  = null
            isPanning = false
            handleHover(null)
            tooltip.style.display = 'none'
            canvas.style.cursor = 'default'
        }

        function onWheel(e: WheelEvent) {
            e.preventDefault()
            const s     = screenPos(e)
            const delta = e.deltaY > 0 ? 0.85 : 1.18
            const t     = transformRef.current
            const newScale = Math.max(0.15, Math.min(8, t.scale * delta))
            t.x = s.x - (s.x - t.x) * (newScale / t.scale)
            t.y = s.y - (s.y - t.y) * (newScale / t.scale)
            t.scale = newScale
        }

        canvas.addEventListener('mousedown',  onMouseDown)
        canvas.addEventListener('mousemove',  onMouseMove)
        canvas.addEventListener('mouseup',    onMouseUp)
        canvas.addEventListener('mouseleave', onMouseLeave)
        canvas.addEventListener('wheel',      onWheel, { passive: false })

        function tick() {
            for (let i = 0; i < simNodes.length; i++) {
                for (let j = i + 1; j < simNodes.length; j++) {
                    const A = simNodes[i], B = simNodes[j]
                    const dx = B.x - A.x, dy = B.y - A.y
                    const dist  = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
                    const force = REPULSION / (dist * dist)
                    const fx = force * dx / dist, fy = force * dy / dist
                    A.vx -= fx; A.vy -= fy; B.vx += fx; B.vy += fy
                }
            }
            for (const edge of g.edges) {
                const A = nodeById.get(edge.source), B = nodeById.get(edge.target)
                if (!A || !B) continue
                const dx = B.x - A.x, dy = B.y - A.y
                const dist  = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
                const force = (dist - TARGET_LEN) * SPRING * edge.weight
                const fx = force * dx / dist, fy = force * dy / dist
                A.vx += fx; A.vy += fy; B.vx -= fx; B.vy -= fy
            }
            for (const n of simNodes) {
                n.vx += (cx - n.x) * GRAVITY
                n.vy += (cy - n.y) * GRAVITY
            }
            for (const n of simNodes) {
                if (n === dragging) continue
                n.vx *= DAMPING; n.vy *= DAMPING
                n.x  += n.vx;    n.y  += n.vy
            }
        }

        function draw(showLabels = true) {
            ctx.clearRect(0, 0, W, H)
            const { x: tx, y: ty, scale } = transformRef.current
            ctx.save()
            ctx.translate(tx, ty)
            ctx.scale(scale, scale)
            const selId      = selectedRef.current
            const activeIds  = filterIdsRef.current
            const selNeighbors = selId !== null ? (adjacency.get(selId) ?? new Set<number>()) : null

            for (const edge of g.edges) {
                const A = nodeById.get(edge.source), B = nodeById.get(edge.target)
                if (!A || !B) continue
                const aFiltered   = activeIds !== null && (!activeIds.has(edge.source) || !activeIds.has(edge.target))
                const isConnected = selId !== null && (edge.source === selId || edge.target === selId)
                ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y)
                if (aFiltered) {
                    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.03)'
                } else if (selId !== null && !isConnected) {
                    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.04)'
                } else if (selId !== null) {
                    const selNode = nodeById.get(selId)
                    const op = Math.min(0.3 + edge.weight * 0.2, 0.9)
                    ctx.lineWidth = 2
                    ctx.strokeStyle = (selNode?.color ?? '#6366f1') + Math.round(op * 255).toString(16).padStart(2, '0')
                } else {
                    ctx.lineWidth = 1.5
                    ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.08 + edge.weight * 0.12, 0.7)})`
                }
                ctx.stroke()
            }

            for (const n of simNodes) {
                const isSelected  = n.id === selId
                const isHovered   = n.id === hoveredRef.current
                const isNeighbor  = selNeighbors?.has(n.id) ?? false
                const isFiltered  = activeIds !== null && !activeIds.has(n.id)
                const isDimmed    = isFiltered || (selId !== null && !isSelected && !isNeighbor)
                const radius      = isSelected ? 8 : 5

                ctx.globalAlpha = isDimmed ? 0.12 : 1
                if (isSelected) {
                    ctx.beginPath()
                    ctx.arc(n.x, n.y, radius + 5, 0, 2 * Math.PI)
                    ctx.fillStyle = n.color + '33'
                    ctx.fill()
                } else if (isHovered) {
                    ctx.beginPath()
                    ctx.arc(n.x, n.y, radius + 4, 0, 2 * Math.PI)
                    ctx.fillStyle = 'rgba(0,0,0,0.07)'
                    ctx.fill()
                }
                ctx.beginPath()
                ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI)
                ctx.fillStyle = n.color; ctx.fill()
                ctx.strokeStyle = '#fff'; ctx.lineWidth = isSelected ? 2.5 : 2; ctx.stroke()
                ctx.fillStyle = isDimmed ? '#bbb' : '#222'
                ctx.font      = isSelected ? 'bold 11px sans-serif' : '10px sans-serif'
                ctx.textAlign = 'center'
                if (showLabels || isSelected || isHovered) ctx.fillText(trunc(n.name), n.x, n.y + (isSelected ? 28 : 22))
                ctx.globalAlpha = 1
            }
            ctx.restore()
        }

        let rafId: number
        let frame = 0
        const SIM_FRAMES = 200
        const SHOW_LABELS = simNodes.length <= 150
        function loop() {
            if (frame < SIM_FRAMES) { tick(); frame++ }
            draw(SHOW_LABELS)
            rafId = requestAnimationFrame(loop)
        }
        rafId = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(rafId)
            canvas.removeEventListener('mousedown',  onMouseDown)
            canvas.removeEventListener('mousemove',  onMouseMove)
            canvas.removeEventListener('mouseup',    onMouseUp)
            canvas.removeEventListener('mouseleave', onMouseLeave)
            canvas.removeEventListener('wheel',      onWheel)
        }
    }, [graph, handleHover, handleSelect])

    return (
        <div ref={containerRef} className="flex rounded-lg border border-gray-100 overflow-hidden" style={{ height: 420, position: 'relative' }}>
            <div
                ref={tooltipRef}
                style={{
                    display: 'none', position: 'absolute', pointerEvents: 'none',
                    background: '#1f2937', color: '#fff', borderRadius: 6,
                    padding: '4px 9px', fontSize: 11, fontWeight: 500,
                    whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                }}
            />
            <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {([
                    { label: '+', title: 'Zoom avant',  action: () => { const t = transformRef.current; const s = Math.min(8, t.scale * 1.25); t.x = (t.x - 250) * (s / t.scale) + 250; t.y = (t.y - 210) * (s / t.scale) + 210; t.scale = s } },
                    { label: '−', title: 'Zoom arrière', action: () => { const t = transformRef.current; const s = Math.max(0.15, t.scale * 0.8); t.x = (t.x - 250) * (s / t.scale) + 250; t.y = (t.y - 210) * (s / t.scale) + 210; t.scale = s } },
                    { label: '⌖', title: 'Réinitialiser', action: () => { transformRef.current = { x: 0, y: 0, scale: 1 } } },
                ] as const).map(btn => (
                    <button key={btn.label} title={btn.title} onClick={btn.action}
                        style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.92)', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 16, lineHeight: 1, color: '#374151', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                        {btn.label}
                    </button>
                ))}
            </div>
            <div className="shrink-0 border-r border-gray-100 bg-gray-50/40 overflow-hidden" style={{ width: 210 }}>
                {graph
                    ? <Sidebar
                        nodes={graph.nodes}
                        edges={graph.edges}
                        hoveredId={hoveredId}
                        selectedId={selectedId}
                        onHover={handleHover}
                        onSelect={handleSelect}
                        onFilter={handleFilter}
                      />
                    : <div className="flex items-center justify-center h-full text-xs text-gray-300">Chargement…</div>
                }
            </div>
            <div className="flex-1 min-w-0">
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
        </div>
    )
}
