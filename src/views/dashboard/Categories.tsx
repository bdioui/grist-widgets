import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import ActionCard, { type ActionCardData } from './ActionCard'
import DraggableCard from './DraggableCard'
import DroppableColumn from './DroppableColumn'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { SlidersHorizontal, Plus } from 'lucide-react'
import { getActionCardsFull, updateActionCard } from '@/lib/api'
import type { ActionCardFull } from '@/lib/types'
import ActionCardSheet from './ActionCardSheet'

// --- Mapping API → ActionCardData ---

function toCardData(card: ActionCardFull): ActionCardData {
    return {
        id:          card.id,
        title:       card.title,
        description: card.description || undefined,
        color:       card.color || undefined,
        status: {
            id:      card.status.id,
            label:   card.status.label,
            context: card.status.context,
        },
        category: {
            id:     card.category.id,
            title:  card.category.title,
            parent: card.category.parent
                ? { id: card.category.parent.id, title: card.category.parent.title }
                : undefined,
        },
        owner: {
            id:         card.owner.id,
            first_name: card.owner.first_name,
            last_name:  card.owner.last_name,
            position:   card.owner.position,
        },
        start_date: card.start_date || undefined,
        end_date:   card.end_date   || undefined,
    }
}

// --- Structure de colonnes ---

type ChildCategory = { id: number; title: string }

type ColumnGroup = {
    id: number
    title: string
    children: ChildCategory[]
}

function buildColumnGroups(cards: ActionCardData[]): ColumnGroup[] {
    const groups = new Map<number, ColumnGroup>()

    for (const card of cards) {
        const { category } = card
        if (category.parent) {
            if (!groups.has(category.parent.id)) {
                groups.set(category.parent.id, { id: category.parent.id, title: category.parent.title, children: [] })
            }
            const group = groups.get(category.parent.id)!
            if (!group.children.some(c => c.id === category.id)) {
                group.children.push({ id: category.id, title: category.title })
            }
        } else {
            if (!groups.has(category.id)) {
                groups.set(category.id, { id: category.id, title: category.title, children: [{ id: category.id, title: category.title }] })
            }
        }
    }

    return Array.from(groups.values())
}

// --- Composant ---

export default function Categories() {
    const [cards, setCards]               = useState<ActionCardData[]>([])
    const [loading, setLoading]           = useState(true)
    const [error, setError]               = useState<string | null>(null)
    const [visibleIds, setVisibleIds]     = useState<number[]>([])
    const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([])
    const [activeCard, setActiveCard]     = useState<ActionCardData | null>(null)
    const [overId, setOverId]             = useState<string | null>(null)
    const [sheetOpen, setSheetOpen]       = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    useEffect(() => {
        getActionCardsFull()
            .then(data => {
                const mapped = data.map(toCardData)
                const groups = buildColumnGroups(mapped)
                const allIds = mapped.map(c => c.category.id)

                setCards(mapped)
                setColumnGroups(groups)
                setVisibleIds([...new Set(allIds)])
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    function toggleChild(id: number) {
        setVisibleIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        )
    }

    function toggleGroup(group: ColumnGroup) {
        const childIds = group.children.map(c => c.id)
        const allChecked = childIds.every(id => visibleIds.includes(id))
        setVisibleIds(prev =>
            allChecked
                ? prev.filter(id => !childIds.includes(id))
                : [...new Set([...prev, ...childIds])]
        )
    }

    function groupCheckedState(group: ColumnGroup): boolean | 'indeterminate' {
        const childIds = group.children.map(c => c.id)
        const checkedCount = childIds.filter(id => visibleIds.includes(id)).length
        if (checkedCount === 0) return false
        if (checkedCount === childIds.length) return true
        return 'indeterminate'
    }

    function onDragStart({ active }: DragStartEvent) {
        setActiveCard(cards.find(c => c.id === active.id) ?? null)
    }

    function onDragOver({ over }: { over: { id: string | number } | null }) {
        setOverId(over ? String(over.id) : null)
    }

    function onDragEnd({ active, over }: DragEndEvent) {
        setActiveCard(null)
        setOverId(null)

        if (!over) return

        // L'ID de la droppable est "col-{categoryId}"
        const targetCategoryId = Number(String(over.id).replace('col-', ''))
        const card = cards.find(c => c.id === active.id)
        if (!card || card.category.id === targetCategoryId) return

        // Retrouver la catégorie cible depuis les groupes existants
        let targetCategory: ActionCardData['category'] | undefined
        for (const group of columnGroups) {
            const child = group.children.find(c => c.id === targetCategoryId)
            if (child) {
                targetCategory = {
                    id: child.id,
                    title: child.title,
                    parent: group.children.length > 1
                        ? { id: group.id, title: group.title }
                        : undefined,
                }
                break
            }
        }

        if (!targetCategory) return

        // Mise à jour optimiste : on met à jour le state immédiatement
        setCards(prev => prev.map(c =>
            c.id === active.id ? { ...c, category: targetCategory! } : c
        ))

        // Persistance en base
        updateActionCard(Number(active.id), { category_id: targetCategoryId })
            .catch(() => {
                // En cas d'échec, on annule la mise à jour optimiste
                setCards(prev => prev.map(c =>
                    c.id === active.id ? { ...c, category: card.category } : c
                ))
            })
    }

    const visibleGroups = columnGroups
        .map(group => ({
            ...group,
            children: group.children.filter(c => visibleIds.includes(c.id)),
        }))
        .filter(group => group.children.length > 0)

    if (error) {
        return <p className="mt-6 text-sm text-destructive">Erreur : {error}</p>
    }

    if (loading) {
        return (
            <div className="mt-6 flex gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col gap-3 w-[260px]">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <>
        <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
        <div className="mt-4 flex flex-col gap-4">

            {/* Barre d'actions */}
            <div className="flex items-center justify-between gap-2">

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 rounded-md">
                            <SlidersHorizontal size={14} />
                            Catégories
                            <span className="text-xs text-muted-foreground">
                                {visibleGroups.length}/{columnGroups.length}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        {columnGroups.map((group, i) => {
                            const state = groupCheckedState(group)
                            const hasChildren = group.children.length > 1
                            return (
                                <div key={group.id}>
                                    {i > 0 && <DropdownMenuSeparator />}
                                    <DropdownMenuCheckboxItem
                                        checked={state === true}
                                        className={hasChildren ? 'font-medium' : ''}
                                        onCheckedChange={() => toggleGroup(group)}
                                    >
                                        {group.title}
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {cards.filter(c => group.children.some(ch => ch.id === c.category.id)).length}
                                        </span>
                                    </DropdownMenuCheckboxItem>
                                    {hasChildren && group.children.map(child => (
                                        <DropdownMenuCheckboxItem
                                            key={child.id}
                                            checked={visibleIds.includes(child.id)}
                                            className="pl-7 text-muted-foreground"
                                            onCheckedChange={() => toggleChild(child.id)}
                                        >
                                            {child.title}
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {cards.filter(c => c.category.id === child.id).length}
                                            </span>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </div>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" className="gap-2 rounded-md" onClick={() => setSheetOpen(true)}>
                    <Plus size={14} />
                    Nouvelle carte
                </Button>
            </div>

            {/* Colonnes */}
            <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4" style={{ minWidth: `${visibleGroups.length * 280}px` }}>
                    {visibleGroups.map(group => {
                        const totalCards = cards.filter(c =>
                            group.children.some(ch => ch.id === c.category.id)
                        ).length
                        return (
                            <div key={group.id} className="flex flex-col gap-3 w-[260px] shrink-0">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-sm font-medium text-gray-700">{group.title}</span>
                                    <span className="text-xs text-muted-foreground bg-gray-100 rounded-full px-2 py-0.5">
                                        {totalCards}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {group.children.map((child, i) => {
                                        const childCards = cards.filter(c => c.category.id === child.id)
                                        return (
                                            <div key={child.id} className="flex flex-col gap-2">
                                                <div className={`flex items-center gap-2 ${i > 0 ? 'mt-1' : ''}`}>
                                                    <span className={`text-xs text-muted-foreground ${group.children.length <= 1 ? 'invisible' : ''}`}>
                                                        {child.title}
                                                    </span>
                                                    <div className="flex-1 h-px bg-gray-100" />
                                                </div>
                                                <DroppableColumn
                                                    id={`col-${child.id}`}
                                                    isOver={overId === `col-${child.id}`}
                                                >
                                                    {childCards.map(card => (
                                                        <DraggableCard key={card.id} card={card} />
                                                    ))}
                                                </DroppableColumn>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>

        {/* Carte fantôme affichée sous le curseur pendant le drag */}
        <DragOverlay dropAnimation={null}>
            {activeCard && (
                <div className="rotate-1 scale-105 shadow-xl opacity-95 w-[260px]">
                    <ActionCard {...activeCard} />
                </div>
            )}
        </DragOverlay>

        </DndContext>

        <ActionCardSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            onCreated={newCard => {
                setCards(prev => [...prev, newCard])
                setColumnGroups(buildColumnGroups([...cards, newCard]))
                setVisibleIds(prev => [...new Set([...prev, newCard.category.id])])
            }}
        />
        </>
    )
}
