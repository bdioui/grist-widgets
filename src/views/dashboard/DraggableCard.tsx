import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import ActionCard, { type ActionCardData } from './ActionCard'

type Props = { card: ActionCardData }

export default function DraggableCard({ card }: Props) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: card.id,
    })

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform) }}
            className={`touch-none transition-opacity ${isDragging ? 'opacity-40' : ''}`}
            {...listeners}
            {...attributes}
        >
            <ActionCard {...card} />
        </div>
    )
}
