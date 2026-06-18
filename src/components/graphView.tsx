import { useState, useEffect } from "react"
import type { Partner, ProjectPartner } from "@/lib/types"
import { getProjectPartners, getPartners } from "@/lib/api"

type Node = { id: number; name: string; color: string }
type Edge = { source: number; target: number; weight: number }


function buildGraph(partners: Partner[], projectPartners: ProjectPartner[]) {
    const nodes: Node[] = partners.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
    }))

    const edgeMap = new Map<string, Edge>()

    // Groupe les partenaires par projet
    const byProject = new Map<number, number[]>()
    for (const pp of projectPartners) {
        const list = byProject.get(pp.project_id) ?? [] // si l'id existe déja tu renvois r
        list.push(pp.partner_id) // sinon tu push l'id du partenaire dans la liste
        byProject.set(pp.project_id, list) // tu obtiens une map avec les projetsId et la liste des partenaires qui y snt référencés
    }

    // Pour chaque projet, génère toutes les paires
    for (const [, partnerIds] of byProject) {
        for (let i = 0; i < partnerIds.length; i++) {
            for (let j = i + 1; j < partnerIds.length; j++) {
                const a = Math.min(partnerIds[i], partnerIds[j])
                const b = Math.max(partnerIds[i], partnerIds[j])
                const key = `${a}-${b}`
                const existing = edgeMap.get(key)
                if (existing) {
                    existing.weight++
                } else {
                    edgeMap.set(key, { source: a, target: b, weight: 1 })
                }
            }
        }
    }

    return { nodes, edges: Array.from(edgeMap.values()) }
}

export default function Graph({} : {}) {
    const [graph, setGraph] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null)

    useEffect(() => {
        Promise.all([getPartners(), getProjectPartners()])
            .then(([p, pp]) => setGraph(buildGraph(p, pp)))
    }, [])

    return (
        <canvas data-nodes={graph?.nodes.length} data-edges={graph?.edges.length} />
    )
}