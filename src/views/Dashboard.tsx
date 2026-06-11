import { useState, useEffect } from 'react'
import {
    getProgram, getProjects, getStatuses, getPartners, getMembers,
    getFinancialAgreements, getAllProjectMembers, getActionCardsFull
} from '@/lib/api'
import { type Program, type Project, type Status, type Partner, type Member, type FinancialAgreement, type ProjectMember, type ActionCardFull } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Users, Briefcase, Building2, TrendingUp, Clock } from 'lucide-react'
import {ProjectViewerSheet, ActionCardViewerSheet} from '../components/viewers'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// --- Helpers ---

function fmt(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + ' k€'
    return n.toLocaleString('fr-FR') + ' €'
}

function daysFromNow(dateStr: string): number {
    const d = new Date(dateStr)
    const now = new Date()
    return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function progressPercent(start: string, end: string): number {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const now = Date.now()
    if (now <= s) return 0
    if (now >= e) return 100
    return Math.round(((now - s) / (e - s)) * 100)
}

// --- Sous-composants ---

function KpiCard({ icon, label, value, sub, accent }: {
    icon: React.ReactNode
    label: string
    value: string | number
    sub?: string
    accent?: string
}) {
    return (
        <div className="flex flex-col gap-2 p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                <span className="text-muted-foreground">{icon}</span>
            </div>
            <span className="text-2xl font-semibold tabular-nums" style={accent ? { color: accent } : {}}>{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
    )
}

function ProgressBar({ value, color = '#6366f1', bg = '#e5e7eb' }: { value: number; color?: string; bg?: string }) {
    return (
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: bg }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} />
        </div>
    )
}

function AlertCard({ project, statusLabel, daysLeft, memberCount, grant, onOpen }: {
    project:     Project
    statusLabel: string
    daysLeft:    number
    memberCount: number
    grant:       number
    onOpen:      (p: Project) => void
}) {
    const overdue = daysLeft < 0
    return (
        <div
            onClick={() => onOpen(project)}
            className="cursor-pointer rounded-xl border bg-card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow mt-2"
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-sm leading-tight">{project.title}</span>
                <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {overdue ? `${Math.abs(daysLeft)}j de retard` : `dans ${daysLeft}j`}
                </span>
            </div>
            {project.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="px-1.5 py-0.5 rounded bg-muted">{statusLabel}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {memberCount}</span>
                {grant > 0 && <span className="flex items-center gap-1"><TrendingUp size={11} /> {fmt(grant)}</span>}
                {project.end_date && <span className="flex items-center gap-1 ml-auto"><Clock size={11} /> {new Date(project.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
            </div>
        </div>
    )
}

function ActionAlert({ card, daysLeft, onOpen }: {
    card:    ActionCardFull
    daysLeft: number
    onOpen:  (c: ActionCardFull) => void
}) {
    const overdue = daysLeft < 0
    return (
        <div
            onClick={() => onOpen(card)}
            className="cursor-pointer rounded-xl border bg-card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow mt-2"
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-sm leading-tight">{card.title}</span>
                <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {overdue ? `${Math.abs(daysLeft)}j de retard` : `dans ${daysLeft}j`}
                </span>
            </div>
            {card.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="px-1.5 py-0.5 rounded bg-muted">{card.status.label}</span>
                {card.owner && (
                    <span className="flex items-center gap-1">
                        <Users size={11} /> {card.owner.first_name} {card.owner.last_name}
                    </span>
                )}
                {card.end_date && (
                    <span className="flex items-center gap-1 ml-auto">
                        <Clock size={11} /> {new Date(card.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                )}
            </div>
        </div>
    )
}

// --- Vue principale ---

export default function Dashboard() {
    const [loading, setLoading] = useState(true)

    const [program,        setProgram]        = useState<Program | null>(null)
    const [projects,       setProjects]       = useState<Project[]>([])
    const [actionCards,    setActionCards]    = useState<ActionCardFull[]>([])
    const [openProject, setOpenProject]       = useState<Project | null>(null)
    const [openCard, setOpenCard]         = useState<ActionCardFull | null>(null)
    const [staffModal, setStaffModal]         = useState<{ member: import('@/lib/types').Member; assignments: { project: import('@/lib/types').Project; role: string }[] } | null>(null)
    const [statuses,       setStatuses]       = useState<Status[]>([])
    const [partners,       setPartners]       = useState<Partner[]>([])
    const [members,        setMembers]        = useState<Member[]>([])
    const [agreements,     setAgreements]     = useState<FinancialAgreement[]>([])
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])

    useEffect(() => {
        Promise.all([
            getProgram(),
            getProjects(),
            getStatuses(),
            getPartners(),
            getMembers(),
            getFinancialAgreements(),
            getAllProjectMembers(),
            getActionCardsFull(),
        ]).then(([prog, proj, stat, part, memb, agr, pm, ac]) => {
            setProgram((prog as Program[])[0] ?? null)
            setProjects(proj as Project[])
            setStatuses(stat as Status[])
            setPartners(part as Partner[])
            setMembers(memb as Member[])
            setAgreements(agr as FinancialAgreement[])
            setProjectMembers(pm as ProjectMember[])
            setActionCards(ac as ActionCardFull[])
        }).finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="m-5 flex flex-col gap-6">
                <Skeleton className="h-28 w-full rounded-xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1,2].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
                </div>
            </div>
        )
    }

    // ── Calculs ──

    const projectStatusMap = new Map(statuses.filter(s => s.context === 'project').map(s => [s.id, s]))
    const activeStatuses   = ['En cours', 'En attente', 'Suspendu']
    const activeProjects   = projects.filter(p => activeStatuses.includes(projectStatusMap.get(p.status_id)?.label ?? ''))
    const totalGrant       = agreements.reduce((s, a) => s + a.grant, 0)
    const totalBudget      = projects.reduce((s, p) => s + p.budget, 0)

    // Répartition par statut
    const statusGroups = statuses
        .filter(s => s.context === 'project')
        .map(s => ({ label: s.label, count: projects.filter(p => p.status_id === s.id).length }))
        .filter(g => g.count > 0)
        .sort((a, b) => b.count - a.count)
    const maxStatusCount = Math.max(...statusGroups.map(g => g.count), 1)


    // Top partenaires par subvention
    const grantByPartner = new Map<number, number>()
    agreements.forEach(a => {
        grantByPartner.set(a.partner_id, (grantByPartner.get(a.partner_id) ?? 0) + a.grant)
    })
    const topPartners = [...grantByPartner.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, grant]) => ({ partner: partners.find(p => p.id === id), grant }))
        .filter(r => r.partner)
    // Taux de financement moyen
    const ratedAgreements = agreements.filter(a => a.budget > 0 && a.grant > 0)
    const avgRate = ratedAgreements.length > 0
        ? Math.round(ratedAgreements.reduce((s, a) => s + (a.grant / a.budget) * 100, 0) / ratedAgreements.length)
        : null

    // ── Alertes ──

    // Projets se terminant dans < 60 jours
    const endingSoon = projects.filter(p => {
        if (!p.end_date) return false
        const d = daysFromNow(p.end_date)
        const label = projectStatusMap.get(p.status_id)?.label ?? ''
        return d >= 0 && d <= 60 && activeStatuses.includes(label)
    })

    console.log(endingSoon)
    console.log('statuses:', statuses.filter(s => s.context === 'project').map(s => s.label))
    console.log('project end_dates:', projects.map(p => p.end_date))
    console.log('endingSoon:', endingSoon)

    // Projets dont la date de fin est dépassée mais encore actifs
    const overdueProjects = projects.filter(p => {
        if (!p.end_date) return false
        const label = projectStatusMap.get(p.status_id)?.label ?? ''
        return daysFromNow(p.end_date) < 0 && activeStatuses.includes(label)
    })

    const activeActionStatuses = ['En cours', 'Planifié', 'À traiter']

    // Actions se terminant dans < 14 jours
    const actionEndingSoon = actionCards.filter(ac => {
        if (!ac.end_date) return false
        const d = daysFromNow(ac.end_date)
        return d >= 0 && d <= 14 && activeActionStatuses.includes(ac.status.label)
    })

    // Actions dont la date de fin est dépassée mais encore actives
    const overdueActionCards = actionCards.filter(ac => {
        if (!ac.end_date) return false
        return daysFromNow(ac.end_date) < 0 && activeActionStatuses.includes(ac.status.label)
    })

    // Conventions non signées
    const unsignedAgreements = agreements
        .filter(a => !a.signed_date)
        .map(a => {
            const project = projects.find(p => p.id === a.project_id)
            return `"${a.title}"${project ? ` (${project.title})` : ''}`
        })

    // Projets sans membres assignés
    const projectsWithoutMembers = projects
        .filter(p => {
            const label = projectStatusMap.get(p.status_id)?.label ?? ''
            return activeStatuses.includes(label) && !projectMembers.some(pm => pm.project_id === p.id)
        })
        .map(p => `"${p.title}"`)

    const hasAlerts = endingSoon.length + overdueProjects.length + actionEndingSoon.length + overdueActionCards.length + unsignedAgreements.length + projectsWithoutMembers.length > 0

    // ── Membres staff & leurs projets ──
    const staffMembers = members.filter(m => m.is_staff)
    const staffWithProjects = staffMembers.map(m => {
        const assignments = projectMembers
            .filter(pm => pm.member_id === m.id)
            .map(pm => ({ project: projects.find(p => p.id === pm.project_id)!, role: pm.role }))
            .filter(a => a.project != null)
        return { member: m, assignments }
    })

    // ── Programme ──
    const progPercent = program ? progressPercent(program.start_date, program.end_date) : 0
    const progDaysLeft = program ? daysFromNow(program.end_date) : null
    const progYearsLeft = progDaysLeft !== null ? (progDaysLeft / 365).toFixed(1) : null

    const STATUS_COLORS: Record<string, string> = {
        'En cours':   '#d1fae5',
        'Terminé':    '#f3f4f6',
        'Suspendu':   '#fef9c3',
        'En attente': '#dbeafe',
        'Planifié':   '#fef9c3',
    }

    return (
        <>
        <div className="m-5 flex flex-col gap-6 pb-10">

            {/* ── En-tête Programme ── */}
            {program && (
                <div className="flex flex-col gap-3 p-5 rounded-xl border bg-card">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Programme</span>
                            <h1 className="text-xl font-semibold">{program.name}</h1>
                            {program.description && <p className="text-sm text-muted-foreground mt-0.5">{program.description}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <span className="text-xs text-muted-foreground">
                                {new Date(program.start_date).getFullYear()} — {new Date(program.end_date).getFullYear()}
                            </span>
                            <span className="text-xs font-medium">
                                {progPercent}% écoulé
                                {progYearsLeft && parseFloat(progYearsLeft) > 0
                                    ? ` · ${progYearsLeft} ans restants`
                                    : ' · Programme terminé'}
                            </span>
                            {progDaysLeft !== null && progDaysLeft <= 365 && progDaysLeft > 0 && (
                                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                    <AlertTriangle size={11} /> Moins d'un an restant
                                </span>
                            )}
                        </div>
                    </div>
                    <ProgressBar value={progPercent} color="black" />
                    {program.budget > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Budget programme :</span>
                            <span className="text-xs font-semibold">{fmt(program.budget)}</span>
                            {totalGrant > 0 && (
                                <>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="text-xs text-muted-foreground">Subventions engagées :</span>
                                    <span className="text-xs text-muted-foreground">{fmt(totalGrant)}</span>
                                    <span className="text-xs text-muted-foreground">({Math.round((totalGrant / program.budget) * 100)} %)</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    icon={<Briefcase size={16} />}
                    label="Projets actifs"
                    value={activeProjects.length}
                    sub={`${projects.length} au total`}
                />
                <KpiCard
                    icon={<Building2 size={16} />}
                    label="Partenaires"
                    value={partners.length}
                    sub={`dont ${partners.filter(p => p.consortium).length} faisant partie du consortium`}
                />
                <KpiCard
                    icon={<TrendingUp size={16} />}
                    label="Subventions engagées"
                    value={fmt(totalGrant)}
                    sub={program?.budget ? `${Math.round((totalGrant / program.budget) * 100)} % du budget programme` : `sur ${fmt(totalBudget)} projets`}
                />
                <KpiCard
                    icon={<Users size={16} />}
                    label="Membres"
                    value={members.length}
                    sub={`${members.filter(m => m.is_staff).length} staff`}
                />
            </div>

            {/* ── Graphiques ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Répartition par statut */}
                <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card">
                    <p className="text-sm font-medium">Projets par statut</p>
                    <div className="flex flex-col gap-3">
                        {statusGroups.length === 0
                            ? <p className="text-xs text-muted-foreground italic">Aucun projet</p>
                            : statusGroups.map(g => (
                                <div key={g.label} className="flex items-center gap-3">
                                    <span className="text-xs w-28 shrink-0 text-muted-foreground">{g.label}</span>
                                    <div className="flex-1 h-5 rounded-full overflow-hidden bg-muted relative">
                                        <div
                                            className="h-full rounded-full flex items-center pl-2 transition-all"
                                            style={{
                                                width: `${Math.max(8, (g.count / maxStatusCount) * 100)}%`,
                                                backgroundColor: STATUS_COLORS[g.label] ?? '#e5e7eb',
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium tabular-nums w-6 text-right">{g.count}</span>
                                </div>
                            ))
                        }
                    </div>
                    {avgRate !== null && (
                        <div className="pt-2 border-t mt-1 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Taux de financement moyen</span>
                            <span className="text-xs font-semibold text-green-700">{avgRate} %</span>
                        </div>
                    )}
                </div>

                {/* Top partenaires — camembert */}
                <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card">
                    <p className="text-sm font-medium">Top partenaires par subvention</p>
                    {topPartners.length === 0
                        ? <p className="text-xs text-muted-foreground italic">Aucune convention enregistrée</p>
                        : (() => {
                            const total = topPartners.reduce((s, r) => s + r.grant, 0)
                            const R = 54, C = 2 * Math.PI * R
                            let offset = 0
                            return (
                                <div className="flex items-center gap-6">
                                    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0 -rotate-90">
                                        {topPartners.map(({ partner, grant }) => {
                                            const pct   = grant / total
                                            const dash  = pct * C
                                            const gap   = C - dash
                                            const seg   = offset
                                            offset += dash
                                            return (
                                                <circle
                                                    key={partner!.id}
                                                    cx="70" cy="70" r={R}
                                                    fill="none"
                                                    stroke={partner!.color || '#e5e7eb'}
                                                    strokeWidth="22"
                                                    strokeDasharray={`${dash} ${gap}`}
                                                    strokeDashoffset={-seg}
                                                />
                                            )
                                        })}
                                    </svg>
                                    <div className="flex flex-col gap-2 min-w-0">
                                        {topPartners.map(({ partner, grant }) => (
                                            <div key={partner!.id} className="flex items-center gap-2 min-w-0">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: partner!.color || '#e5e7eb' }} />
                                                <span className="text-xs text-muted-foreground truncate">{partner!.name}</span>
                                                <span className="text-xs font-medium tabular-nums ml-auto pl-2 text-green-700 shrink-0">{fmt(grant)}</span>
                                            </div>
                                        ))}
                                        <div className="pt-1 border-t mt-1 text-xs text-muted-foreground">
                                            Total : <span className="font-semibold text-foreground">{fmt(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()
                    }
                </div>
            </div>

            {staffWithProjects.length > 0 && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                        <Users size={15} />
                        Équipe
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {staffWithProjects.map(({ member, assignments }) => {
                            const activeCount = assignments.filter(a => activeStatuses.includes(projectStatusMap.get(a.project.status_id)?.label ?? '')).length
                            const roleBreakdown = ['Responsable', 'Co-responsable', 'Contributeur'].map(r => ({
                                role: r,
                                count: assignments.filter(a => a.role === r).length,
                            })).filter(r => r.count > 0)
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => setStaffModal({ member, assignments })}
                                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-left hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-2.5">
                                        {member.profile_image
                                            ? <img src={member.profile_image} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                            : <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                                                {member.first_name[0]}{member.last_name[0]}
                                              </div>
                                        }
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{member.first_name} {member.last_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{member.position || member.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Briefcase size={11} />
                                            <span className="font-medium text-foreground">{assignments.length}</span> projet{assignments.length > 1 ? 's' : ''}
                                        </span>
                                        {activeCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                                                {activeCount} actif{activeCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    {roleBreakdown.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {roleBreakdown.map(({ role, count }) => (
                                                <span key={role} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                    {role} ({count})
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Alertes ── */}
            {hasAlerts && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle size={15} className="text-amber-500" />
                        Points d'attention
                    </p>
                    <div className="grid grid-cols-4 md:grid-cols-4 gap-3">
                        {endingSoon.length > 0 && (
                            <>  
                            <div>
                                 <p className='text-xs text-gray-500 mb-2'>Projets se terminant bientôt</p>
                                 <Separator />
                                    {endingSoon.map(p => (
                                        <AlertCard
                                            key={p.id}
                                            project={p}
                                            statusLabel={projectStatusMap.get(p.status_id)?.label ?? ''}
                                            daysLeft={daysFromNow(p.end_date)}
                                            memberCount={projectMembers.filter(pm => pm.project_id === p.id).length}
                                            grant={agreements.filter(a => a.project_id === p.id).reduce((s, a) => s + a.grant, 0)}
                                            onOpen={p => setOpenProject(p)}
                                        />
                                    ))}

                            </div>
                               
                            </>
                        )}

                        {overdueProjects.length > 0 && (
                            <>
                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Projets en retard</p>
                                 <Separator />
                                {overdueProjects.map(p => (
                                    <AlertCard
                                        key={p.id}
                                        project={p}
                                        statusLabel={projectStatusMap.get(p.status_id)?.label ?? ''}
                                        daysLeft={daysFromNow(p.end_date)}
                                        memberCount={projectMembers.filter(pm => pm.project_id === p.id).length}
                                        grant={agreements.filter(a => a.project_id === p.id).reduce((s, a) => s + a.grant, 0)}
                                        onOpen={p => setOpenProject(p)}
                                    />
                                ))}
                            </div>
                            </>
                        )}

                        {actionEndingSoon.length > 0 && (
                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Actions se terminant bientôt</p>
                                <Separator />
                                {actionEndingSoon.map(a => (
                                    <ActionAlert
                                        key={a.id}
                                        card={a}
                                        daysLeft={daysFromNow(a.end_date)}
                                        onOpen={a => setOpenCard(a)}
                                    />
                                ))}
                            </div>
                        )}

                        {overdueActionCards.length > 0 && (
                            <div>
                                <p className='text-xs text-gray-500 mb-2'>Actions en retard</p>
                                <Separator />
                                {overdueActionCards.map(a => (
                                    <ActionAlert
                                        key={a.id}
                                        card={a}
                                        daysLeft={daysFromNow(a.end_date)}
                                        onOpen={a => setOpenCard(a)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}


            {!hasAlerts && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm">
                    <span>✓</span>
                    <span>Aucune alerte — tout est en ordre.</span>
                </div>
            )}     

        </div>

        {openProject && (
            <ProjectViewerSheet
                project={openProject}
                open={!!openProject}
                onClose={() => setOpenProject(null)}
            />
        )}

        {openCard && (
            <ActionCardViewerSheet
                card={openCard}
                open={!!openCard}
                onClose={() => setOpenCard(null)}
            />
        )}

        <Dialog open={!!staffModal} onOpenChange={open => { if (!open) setStaffModal(null) }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {staffModal && (
                            <>
                                {staffModal.member.profile_image
                                    ? <img src={staffModal.member.profile_image} className="w-8 h-8 rounded-full object-cover" />
                                    : <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                        {staffModal.member.first_name[0]}{staffModal.member.last_name[0]}
                                      </div>
                                }
                                <span>{staffModal.member.first_name} {staffModal.member.last_name}</span>
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>
                {staffModal && (
                    <div className="flex flex-col gap-2 mt-1">
                        {staffModal.assignments.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">Aucun projet assigné.</p>
                        )}
                        {staffModal.assignments.map(({ project, role }) => {
                            const statusLabel = projectStatusMap.get(project.status_id)?.label ?? ''
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => { setStaffModal(null); setOpenProject(project) }}
                                    className="flex items-start gap-3 rounded-lg border bg-card p-3 text-left hover:shadow-sm transition-shadow"
                                >
                                    <span
                                        className="mt-1 w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: STATUS_COLORS[statusLabel] ?? '#e5e7eb' }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{project.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                            <span className="px-1.5 py-0.5 rounded bg-muted">{statusLabel}</span>
                                            <span>{role}</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>

        </>
    )
}
