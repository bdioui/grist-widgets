import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {ProjectCard, type ProjectCardProps} from '../Projects'

export default function DraggableProject(props: ProjectCardProps) {
    const { project, selectOn } = props
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: project.id,
        disabled: selectOn,
    })

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform) }}
            className={`transition-opacity ${selectOn ? '' : 'touch-none'} ${isDragging ? 'opacity-40' : ''}`}
            {...(selectOn ? {} : { ...listeners, ...attributes })}
        >
            <ProjectCard {...props} />
        </div>
    )
}