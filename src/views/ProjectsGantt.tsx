import React, { useCallback } from 'react'
import { Gantt, type Task as GanttTask, ViewMode as GanttViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { ChevronDown, ChevronRight } from 'lucide-react'

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

function ProjectsGantt({ tasks, viewMode, viewDate, onDateChange, onToggleExpand, onOpenProject, onOpenAction }: Props) {
    // Ids : `p-<projet>`, `ms-<projet>-<jalon>`, `t-<projet>-<action>`
    const handleDoubleClick = useCallback((task: GanttTask) => {
        const parts = task.id.split('-')
        if (task.type === 'task') onOpenAction(Number(parts[2]))
        else onOpenProject(Number(parts[1]))
    }, [onOpenProject, onOpenAction])

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
            <Gantt
                tasks={tasks}
                viewMode={viewMode}
                viewDate={viewDate}
                locale="fr"
                listCellWidth="40px"
                columnWidth={COLUMN_WIDTH[viewMode] ?? 60}
                rowHeight={40}
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
    )
}

export default React.memo(ProjectsGantt)
