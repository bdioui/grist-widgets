import React, { useCallback, useState } from 'react'
import { Gantt, type Task as GanttTask, ViewMode as GanttViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'

type Props = {
    tasks: GanttTask[]
    viewMode: GanttViewMode
    viewDate: Date
    onDateChange: (task: GanttTask) => Promise<boolean>
    onToggleExpand: (task: GanttTask) => void
    onOpenProject: (projectId: number) => void
    onOpenAction: (actionId: number) => void
}

const COLUMN_WIDTH: Record<string, number> = {
    [GanttViewMode.Month]: 80,
    [GanttViewMode.Week]: 60,
    [GanttViewMode.Day]: 60,
}

const ROW_HEIGHT = 40

type GanttTarget =
    | { kind: 'bar'; task: GanttTask }
    | { kind: 'empty'; row: number; date: Date }

// Définis hors du composant : la lib les traite comme des composants React, et
// une nouvelle fonction à chaque rendu les démonterait puis remonterait.
function TaskListHeader({ headerHeight }: { headerHeight: number }) {
    return (
        <div style={{ height: headerHeight, backgroundColor: '#f8fafc', borderBottom: '#e2e8f0 1px solid', borderTop: '#e2e8f0 1px solid', borderLeft: '#e2e8f0 1px solid', boxSizing: 'border-box' }} />
    )
}

function TaskListTable({ tasks, rowHeight, onExpanderClick }: { tasks: GanttTask[]; rowHeight: number; onExpanderClick: (task: GanttTask) => void }) {
    return (
        <div style={{ display: 'table', borderLeft: '#e2e8f0 1px solid', backgroundColor: '#f8fafc', borderBottom: '#e2e8f0 1px solid' }}>
            {tasks.map(t => (
                <div key={t.id} className="gantt-task-row" style={{ display: 'table-row', height: rowHeight, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'table-cell', width: 40, backgroundColor: '#f8fafc', borderRight: '#e2e8f0 1px solid', verticalAlign: 'middle', textAlign: 'center' }}>
                        {t.hideChildren !== undefined && (
                            <span
                                onClick={() => onExpanderClick(t)}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: rowHeight }}
                            >
                                {t.hideChildren ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

const NoTooltip = () => null

// Origine de l'axe, calculée comme le fait la lib : la date de début la plus
// ancienne des tâches visibles, reculée d'une étape puis alignée. Ce n'est pas
// `viewDate`, qui indique seulement où faire défiler l'écran au chargement.
function chartStart(tasks: GanttTask[], viewMode: GanttViewMode): Date | null {
    if (tasks.length === 0) return null
    let min = tasks[0].start
    for (const t of tasks) if (t.start < min) min = t.start

    switch (viewMode) {
        case GanttViewMode.Month: {
            // Reculer d'un mois en gardant le jour, PUIS ramener au 1er : la lib fait
            // ainsi. Un début au 31 mars passe par le « 31 février » (3 mars) et
            // donne le 1er mars, pas le 1er février. Ne pas « corriger ».
            const d = new Date(min.getFullYear(), min.getMonth() - 1, min.getDate())
            return new Date(d.getFullYear(), d.getMonth(), 1)
        }
        case GanttViewMode.Week: {
            const d = new Date(min.getFullYear(), min.getMonth(), min.getDate())
            const day = d.getDay()
            d.setDate(d.getDate() - day + (day === 0 ? -6 : 1) - 7)   // lundi, moins 7 jours
            return d
        }
        case GanttViewMode.Day:
            return new Date(min.getFullYear(), min.getMonth(), min.getDate() - 1)
        default:
            return null
    }
}

function computeTarget(e: React.MouseEvent<HTMLElement>, tasks: GanttTask[], viewMode: GanttViewMode): GanttTarget | null {
    const svg = (e.target as Element).closest('svg')
    if (!svg || !svg.querySelector('g.bar')) return null
    const rect = svg.getBoundingClientRect()
    const xposition = e.clientX - rect.left
    const yposition = e.clientY - rect.top

    const row = Math.floor(yposition / ROW_HEIGHT)
    const task = tasks[row]
    if (!task) return null
    if ((e.target as Element).closest('.bar')) return { kind: 'bar', task }

    const start = chartStart(tasks, viewMode)
    if (!start) return null
    const columnWidth = COLUMN_WIDTH[viewMode]
    const i = Math.floor(xposition / columnWidth)

    const y = start.getFullYear(), m = start.getMonth(), d = start.getDate()
    let colStart: Date, colEnd: Date
    switch (viewMode) {
        case GanttViewMode.Month:
            colStart = new Date(y, m + i, 1)
            colEnd   = new Date(y, m + i + 1, 1)
            break
        case GanttViewMode.Week:
            colStart = new Date(y, m, d + 7 * i)
            colEnd   = new Date(y, m, d + 7 * (i + 1))
            break
        case GanttViewMode.Day:
            colStart = new Date(y, m, d + i)
            colEnd   = new Date(y, m, d + i + 1)
            break

        default: return null
    }
    
    const frac = (xposition % columnWidth) / columnWidth
    const raw  = new Date(colStart.getTime() + frac * (colEnd.getTime() - colStart.getTime()))
    const date = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate())   // arrondi au jour

    return { kind: 'empty', row, date }
}

function ProjectsGantt({ tasks, viewMode, viewDate, onDateChange, onToggleExpand, onOpenProject, onOpenAction }: Props) {

    // Ids : `p-<projet>`, `ms-<projet>-<jalon>`, `t-<projet>-<action>`
    const handleDoubleClick = useCallback((task: GanttTask) => {
        const parts = task.id.split('-')
        if (task.type === 'task') onOpenAction(Number(parts[2]))
        else onOpenProject(Number(parts[1]))
    }, [onOpenProject, onOpenAction])
    
    const [target, setTarget] = useState<GanttTarget | null>(null)

    return (
        <div className="gantt-dark-labels">
            <style>{`
                .gantt-dark-labels text { fill: #1e293b !important; }
                .gantt-dark-labels ._2RbVy { opacity: 1; }
                .gantt-dark-labels ._1KJ6x polygon { display: none; }
                .gantt-dark-labels ._2dZTy { fill: #ffffff; }
                .gantt-dark-labels ._2dZTy:nth-child(even) { fill: oklch(98.7% 0.002 197.1); }
                .gantt-dark-labels ._3rUKi { stroke: oklch(96.3% 0.002 197.1); }
                .gantt-dark-labels ._RuwuK { stroke: oklch(96.3% 0.002 197.1); }
                .gantt-dark-labels ._35nLX { fill: #f8fafc; stroke: #e2e8f0; stroke-width: 1; }
                .gantt-dark-labels ._2q1Kt { fill: #0f172a; font-weight: 600; }
                .gantt-dark-labels ._9w8d5 { fill: #64748b; font-size: 11px; }
                .gantt-dark-labels ._1rLuZ { stroke: #e2e8f0; }
            `}</style>
            <ContextMenu onOpenChange={open => { if (!open) setTarget(null) }}>
                <ContextMenuTrigger asChild> 
                    <div
                        onMouseDownCapture={e => { if (e.button === 2 || e.ctrlKey) e.stopPropagation() }}
                        onContextMenu={e => {
                        const t = computeTarget(e, tasks, viewMode)
                        if (!t) e.preventDefault()   // en-tête, liste de gauche, sous les lignes : pas de menu
                        setTarget(t)
                    }}>
                    <Gantt
                        tasks={tasks}
                        viewMode={viewMode}
                        viewDate={viewDate}
                        locale="fr"
                        listCellWidth="40px"
                        columnWidth={COLUMN_WIDTH[viewMode] ?? 60}
                        rowHeight={ROW_HEIGHT}
                        fontSize="12px"
                        headerHeight={50}
                        todayColor="oklch(98.4% 0.014 180.72)"
                        barCornerRadius={5}
                        onDateChange={onDateChange}
                        onExpanderClick={onToggleExpand}
                        TaskListHeader={TaskListHeader}
                        TaskListTable={TaskListTable}
                        TooltipContent={NoTooltip}
                        onDoubleClick={handleDoubleClick}
                    />
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {target?.kind === 'bar' && (
                        <ContextMenuItem>Bar {target.task.name}</ContextMenuItem>
                    )}
                    {target?.kind === 'empty' && (
                        <ContextMenuItem>Empty {target.date.toLocaleDateString('fr-FR')}</ContextMenuItem>
                    )}
                   
                </ContextMenuContent>
            </ContextMenu>
            
        </div>
    )
}

export default React.memo(ProjectsGantt)
