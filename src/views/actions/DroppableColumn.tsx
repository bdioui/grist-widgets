import { useDroppable } from '@dnd-kit/core'

type Props = {
    id: string
    children: React.ReactNode
    isOver: boolean
    className?: string
}

export default function DroppableColumn({ id, children, isOver, className }: Props) {
    const { setNodeRef } = useDroppable({ id })

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col gap-2 min-h-16 rounded-lg transition-colors duration-150 ${className} ${
                isOver ? 'bg-accent/50 ring-1 ring-border' : ''
            }`}
        >
            {children}
        </div>
    )
}
