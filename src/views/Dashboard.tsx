import { useState, useEffect } from 'react'
import {
    getProgram, getProjects, getStatuses, getPartners, getMembers,
    getFinancialAgreements, getAxes, getAllProjectMembers,
} from '@/lib/api'
import type { Program, Project, Status, Partner, Member, FinancialAgreement, Axis, ProjectMember } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, CalendarClock, Users, Briefcase, Building2, TrendingUp, Clock } from 'lucide-react'

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

function AlertBadge({ items, label, icon }: { items: string[]; label: string; icon: React.ReactNode }) {
    if (items.length === 0) return null
    return (
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
                {icon}
                <span>{label} ({items.length})</span>
            </div>
            <ul className="flex flex-col gap-1">
                {items.slice(0, 5).map((item, i) => (
                    <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                    </li>
                ))}
                {items.length > 5 && <li className="text-xs text-amber-600 italic">...et {items.length - 5} autre{items.length - 5 > 1 ? 's' : ''}</li>}
            </ul>
        </div>
    )
}

// --- Vue principale ---

export default function Dashboard() {
    const [loading, setLoading] = useState(true)

    const [program,        setProgram]        = useState<Program | null>(null)
    const [projects,       setProjects]       = useState<Project[]>([])
    const [statuses,       setStatuses]       = useState<Status[]>([])
    const [partners,       setPartners]       = useState<Partner[]>([])
    const [members,        setMembers]        = useState<Member[]>([])
    const [agreements,     setAgreements]     = useState<FinancialAgreement[]>([])
    const [axes,           setAxes]           = useState<Axis[]>([])
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])

    useEffect(() => {
        Promise.all([
            getProgram(),
            getProjects(),
            getStatuses(),
            getPartners(),
            getMembers(),
            getFinancialAgreements(),
            getAxes(),
            getAllProjectMembers(),
        ]).then(([prog, proj, stat, part, memb, agr, ax, pm]) => {
            setProgram((prog as Program[])[0] ?? null)
            setProjects(proj as Project[])
            setStatuses(stat as Status[])
            setPartners(part as Partner[])
            setMembers(memb as Member[])
            setAgreements(agr as FinancialAgreement[])
            setAxes(ax as Axis[])
            setProjectMembers(pm as ProjectMember[])
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

    // Répartition par axe
    const axisMap = new Map(axes.map(a => [a.id, a]))
    const axisGroups = axes.map(ax => ({
        name: ax.name,
        count: projects.filter(p => {
            // Les projets n'ont pas d'axis_id direct — on remonte via les conventions
            return agreements.some(a => a.project_id === p.id && a.axis_id === ax.id)
        }).length,
    })).filter(g => g.count > 0).sort((a, b) => b.count - a.count)

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
    const maxPartnerGrant = Math.max(...topPartners.map(r => r.grant), 1)

    // Taux de financement moyen
    const ratedAgreements = agreements.filter(a => a.budget > 0 && a.grant > 0)
    const avgRate = ratedAgreements.length > 0
        ? Math.round(ratedAgreements.reduce((s, a) => s + (a.grant / a.budget) * 100, 0) / ratedAgreements.length)
        : null

    // ── Alertes ──

    const today = new Date()

    // Projets se terminant dans < 60 jours
    const endingSoon = projects.filter(p => {
        if (!p.end_date) return false
        const d = daysFromNow(p.end_date)
        const label = projectStatusMap.get(p.status_id)?.label ?? ''
        return d >= 0 && d <= 60 && activeStatuses.includes(label)
    }).map(p => `"${p.title}" — dans ${daysFromNow(p.end_date)} jour${daysFromNow(p.end_date) > 1 ? 's' : ''}`)

    // Projets dont la date de fin est dépassée mais encore actifs
    const overdueProjects = projects.filter(p => {
        if (!p.end_date) return false
        const label = projectStatusMap.get(p.status_id)?.label ?? ''
        return daysFromNow(p.end_date) < 0 && activeStatuses.includes(label)
    }).map(p => `"${p.title}" — dépassé de ${Math.abs(daysFromNow(p.end_date))} jours`)

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

    const hasAlerts = endingSoon.length + overdueProjects.length + unsignedAgreements.length + projectsWithoutMembers.length > 0

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
                    <ProgressBar value={progPercent} color="#6366f1" />
                    {program.budget > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Budget programme :</span>
                            <span className="text-xs font-semibold">{fmt(program.budget)}</span>
                            {totalGrant > 0 && (
                                <>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="text-xs text-muted-foreground">Subventions engagées :</span>
                                    <span className="text-xs font-semibold text-green-700">{fmt(totalGrant)}</span>
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
                    sub={`dont ${partners.filter(p => p.consortium).length} consortium`}
                />
                <KpiCard
                    icon={<TrendingUp size={16} />}
                    label="Subventions engagées"
                    value={fmt(totalGrant)}
                    sub={program?.budget ? `${Math.round((totalGrant / program.budget) * 100)} % du budget programme` : `sur ${fmt(totalBudget)} projets`}
                    accent="#15803d"
                />
                <KpiCard
                    icon={<Users size={16} />}
                    label="Membres"
                    value={members.length}
                    sub={`${members.filter(m => m.is_staff).length} staff`}
                />
            </div>

            {/* ── Graphiques ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

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

                {/* Top partenaires */}
                <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card">
                    <p className="text-sm font-medium">Top partenaires par subvention</p>
                    {topPartners.length === 0
                        ? <p className="text-xs text-muted-foreground italic">Aucune convention enregistrée</p>
                        : (
                            <div className="flex flex-col gap-3">
                                {topPartners.map(({ partner, grant }) => (
                                    <div key={partner!.id} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 w-32 shrink-0 min-w-0">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: partner!.color || '#e5e7eb' }} />
                                            <span className="text-xs text-muted-foreground truncate">{partner!.name}</span>
                                        </div>
                                        <div className="flex-1 h-5 rounded-full overflow-hidden bg-muted">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.max(4, (grant / maxPartnerGrant) * 100)}%`,
                                                    backgroundColor: partner!.color || '#e5e7eb',
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium tabular-nums w-16 text-right text-green-700">{fmt(grant)}</span>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>
            </div>

            {/* ── Alertes ── */}
            {hasAlerts && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle size={15} className="text-amber-500" />
                        Points d'attention
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AlertBadge
                            items={endingSoon}
                            label="Projets se terminant bientôt"
                            icon={<CalendarClock size={14} />}
                        />
                        <AlertBadge
                            items={overdueProjects}
                            label="Projets en retard"
                            icon={<Clock size={14} />}
                        />
                        <AlertBadge
                            items={unsignedAgreements}
                            label="Conventions non signées"
                            icon={<AlertTriangle size={14} />}
                        />
                        <AlertBadge
                            items={projectsWithoutMembers}
                            label="Projets sans membres assignés"
                            icon={<Users size={14} />}
                        />
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
    )
}
