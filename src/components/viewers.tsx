import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
    getProjectCalls, getAxes, getStatuses, getPartners,
    getMembersFull, getFormations, getTimeEntries, getProjectPartners,
    getFinancialAgreements, getExpanses, getProjectExpanses, getProjects
} from '@/lib/api'
import type { Project, ProjectCall, Axis, Status, Partner, Formation, TimeEntry, MemberFull, ActionCardFull, ProjectPartner, FinancialAgreement, Expanse, ProjectExpanse } from '@/lib/types'
import type { ProjectFull, ProjectCallFull, ProjectPartnerFull } from '@/views/Projects'
import { FALLBACK_PARTNER } from '@/lib/constants'
import { computeFinancials, NO_FINANCIALS } from '@/lib/utils'
import type { ActionCardData } from '@/views/actions/ActionCard'

const ProjectDetailSheetLazy = lazy(() =>
    import('@/views/Projects').then(m => ({ default: m.ProjectDetailSheet }))
)
const ActionCardDetailSheetLazy = lazy(() =>
    import('@/views/actions/ActionCard').then(m => ({ default: m.ActionCardDetailSheet }))
)

// --- ProjectViewerSheet ---

type ProjectRefData = {
    projectFull:     ProjectFull
    projectCalls:    ProjectCallFull[]
    axes:            Axis[]
    statuses:        Status[]
    partners:        Partner[]
    projectPartners: ProjectPartnerFull[]
    members:         MemberFull[]
    formations:      Formation[]
    times:           TimeEntry[]
    projects:        Project[]
    // Toute la répartition, pas seulement celle de ce projet : la modale doit voir les
    // parts des autres projets, sinon elle les écraserait en enregistrant.
    allocations:     ProjectExpanse[]
    // Entrées du calcul des finances. Le résultat n'est plus stocké : il se recalcule
    // quand la répartition change.
    rawPartners:     ProjectPartner[]
    agreements:      FinancialAgreement[]
    expanses:        Expanse[]
}

export function ProjectViewerSheet({ project, open, onClose, onUpdated }: {project: Project; open: boolean; onClose: () => void; onUpdated?: (p: Project) => void }) {
    const [refData, setRefData] = useState<ProjectRefData | null>(null)

    useEffect(() => {
        if (!open) return
        setRefData(null)
        Promise.all([
            getProjectCalls(),
            getAxes(),
            getStatuses(),
            getPartners(),
            getMembersFull(),
            getFormations(),
            getTimeEntries(),
            getProjectPartners(),
            getFinancialAgreements(),
            getExpanses(),
            getProjectExpanses(),
            getProjects(),
        ]).then(([calls, axes, statuses, partners, members, formations, times, pp, agrs, exp, pe, projs]) => {
            const axisMap = new Map((axes as Axis[]).map(a => [a.id, a]))
            const fullCalls: ProjectCallFull[] = (calls as ProjectCall[]).map(c => ({
                ...c,
                axis: axisMap.get(c.axis_id) ?? { id: 0, name: 'Inconnu', description: '' },
            }))
            const callMap = new Map(fullCalls.map(c => [c.id, c]))
            const projectFull: ProjectFull = {
                ...project,
                projectCall: callMap.get(project.project_call_id) ?? {
                    id: 0, axis_id: 0, title: 'Inconnu', description: '',
                    start_date: '', end_date: '', status_id: 0, budget: 0,
                    axis: { id: 0, name: 'Inconnu', description: '' },
                },
            }
            const partnerMap = new Map((partners as Partner[]).map(p => [p.id, p]))
            const projectPartners: ProjectPartnerFull[] = (pp as ProjectPartner[])
                .filter(p => p.project_id === project.id)
                .map(p => ({ ...p, partner: partnerMap.get(p.partner_id) ?? FALLBACK_PARTNER }))

            setRefData({
                projectFull,
                projectCalls: fullCalls,
                axes: axes as Axis[],
                statuses: statuses as Status[],
                partners: partners as Partner[],
                projectPartners,
                members: members as MemberFull[],
                formations: formations as Formation[],
                times: times as TimeEntry[],
                projects: projs as Project[],
                allocations: pe as ProjectExpanse[],
                rawPartners: (pp as ProjectPartner[]).filter(p => p.project_id === project.id),
                agreements: (agrs as FinancialAgreement[]).filter(a => a.project_id === project.id),
                expanses: exp as Expanse[],
            })
        })
    }, [open, project.id])

    // Même arithmétique que la liste des projets, sur un seul projet. Recalculé quand la
    // répartition change. Toutes les dépenses sont passées : computeFinancials n'y lit que
    // celles qu'une part référence, et une dépense répartie n'a plus forcément de project_id.
    const finances = useMemo(() => {
        if (!refData) return NO_FINANCIALS
        return computeFinancials(
            [project],
            refData.rawPartners,
            refData.agreements,
            refData.expanses,
            refData.allocations.filter(a => a.project_id === project.id),
        ).get(project.id) ?? NO_FINANCIALS
    }, [refData, project])

    if (!refData) return null

    return (
        <Suspense fallback={null}>
            <ProjectDetailSheetLazy
                open={open}
                project={refData.projectFull}
                projects={refData.projects}
                allocations={refData.allocations}
                onAllocationChange={(expanseId, rows) =>
                    setRefData(prev => prev && ({
                        ...prev,
                        allocations: [...prev.allocations.filter(a => a.expanse_id !== expanseId), ...rows],
                    }))
                }
                onClose={onClose}
                onUpdated={p => {
                    setRefData(prev => prev ? { ...prev, projectFull: { ...prev.projectFull, ...p } } : null)
                    onUpdated?.(p)
                }}
                onDeleted={() => {}}
                onAgreementAdded={() => {}}
                onAgreementUpdated={() => {}}
                onAgreementDeleted={() => {}}
                partners={refData.partners}
                cardProjectPartners={refData.projectPartners}
                onChangeProjectPartners={(_projectId, list) =>
                    setRefData(prev => prev ? { ...prev, projectPartners: list } : null)
                }
                projectCalls={refData.projectCalls}
                axes={refData.axes}
                statuses={refData.statuses}
                members={refData.members}
                projectTimes={refData.times.filter(t => t.project_id === project.id)}
                axis={refData.axes}
                allFormations={refData.formations}
                finances={finances}
            />
        </Suspense>
    )
}

// --- ActionCardViewerSheet ---

function toActionCardData(card: ActionCardFull): ActionCardData {
    return {
        id: card.id,
        title: card.title,
        description: card.description,
        status: card.status,
        category: {
            id: card.category.id,
            title: card.category.title,
            color: card.category.color,
            parent: card.category.parent
                ? { id: card.category.parent.id, title: card.category.parent.title, color: card.category.parent.color }
                : undefined,
        },
        owner: card.owner
            ? { id: card.owner.id, first_name: card.owner.first_name, last_name: card.owner.last_name, position: card.owner.position }
            : undefined,
        start_date: card.start_date,
        end_date: card.end_date,
        full_address: card.full_address,
        lat: card.lat,
        lon: card.lon,
    }
}

export function ActionCardViewerSheet({ card, open, onClose, onUpdated }: { card: ActionCardFull; open: boolean; onClose: () => void; onUpdated?: (c: ActionCardFull) => void }) {
    return (
        <Suspense fallback={null}>
            <ActionCardDetailSheetLazy
                card={toActionCardData(card)}
                open={open}
                onClose={onClose}
                onUpdated={c => onUpdated?.(c as unknown as ActionCardFull)}
                onDeleted={() => {}}
            />
        </Suspense>
    )
}
