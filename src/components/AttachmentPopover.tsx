import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { addToDoListToCard } from '@/lib/api'
import type { ActionCardFull, Project, ToDoList } from '@/lib/types'

type Props = {
    actions: ActionCardFull[]
    lists: ToDoList[]
    value: { projectTitle: string | null; actionTitle: string; listTitle: string } | null
    onSelect: (listId: number) => void
    onListCreated: (list: ToDoList) => void
    actionToProjects: Map<number, Project[]>
}

export default function AttachmentPopover({ actions, lists, value, onSelect, onListCreated, actionToProjects }: Props) {
    const [open, setOpen] = useState(false)
    const [level, setLevel] = useState<'action' | 'list'>('action')
    const [selectedAction, setSelectedAction] = useState<ActionCardFull | null>(null)
    const [search, setSearch] = useState('')
    const [creatingList, setCreatingList] = useState(false)
    const [newListName, setNewListName] = useState('')
    const [saving, setSaving] = useState(false)

    const filteredActions = actions.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase())
    )

    // Grouper les actions par projet (première association)
    const actionGroups = useMemo(() => {
        const groups = new Map<string, { projectId: number | null; actions: ActionCardFull[] }>()
        for (const a of filteredActions) {
            const projs = actionToProjects.get(a.id)
            const key = projs?.[0]?.title ?? ''
            const projectId = projs?.[0]?.id ?? null
            if (!groups.has(key)) groups.set(key, { projectId, actions: [] })
            groups.get(key)!.actions.push(a)
        }
        return [...groups.entries()]
            .sort(([ka], [kb]) => {
                if (!ka) return 1
                if (!kb) return -1
                return ka.localeCompare(kb, 'fr')
            })
    }, [filteredActions, actionToProjects])

    const actionLists = selectedAction
        ? lists.filter(l => l.action_card_id === selectedAction.id)
        : []

    const filteredLists = actionLists.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase())
    )

    function reset() {
        setLevel('action')
        setSelectedAction(null)
        setSearch('')
        setCreatingList(false)
        setNewListName('')
        setSaving(false)
    }

    function handleOpenChange(o: boolean) {
        setOpen(o)
        if (!o) reset()
    }

    function selectAction(action: ActionCardFull) {
        setSelectedAction(action)
        setLevel('list')
        setSearch('')
    }

    function selectList(list: ToDoList) {
        onSelect(list.id)
        setOpen(false)
        reset()
    }

    async function commitNewList() {
        if (!selectedAction || !newListName.trim() || saving) return
        setSaving(true)
        const newList = await addToDoListToCard(selectedAction.id, newListName.trim())
        onListCreated(newList)
        onSelect(newList.id)
        setOpen(false)
        reset()
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                {value ? (
                    <button className="flex items-center gap-0.5 w-full overflow-hidden rounded-full bg-violet-100 hover:bg-violet-200 transition-colors px-1 py-0.5 text-[11px]">
                        {value.projectTitle && (
                            <>
                                <span className="shrink-0 px-1.5 text-violet-400 font-normal truncate max-w-[150px]">{value.projectTitle}</span>
                                <ChevronRight size={9} className="shrink-0 text-violet-300" />
                            </>
                        )}
                        <span className="flex-1 min-w-0 px-1.5 text-violet-500 font-normal truncate">{value.actionTitle}</span>
                        <ChevronRight size={10} className="shrink-0 text-violet-400" />
                        <span className="flex-1 min-w-0 px-1.5 text-violet-900 font-semibold truncate">{value.listTitle}</span>
                    </button>
                ) : (
                    <button className="text-[11px] px-2 py-0.5 rounded-full text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                        Rattacher…
                    </button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2 flex flex-col gap-1" align="start">
                {/* En-tête niveau liste */}
                {level === 'list' && selectedAction && (
                    <div className="flex items-center gap-1 pb-1 border-b border-border">
                        <button
                            onClick={() => { setLevel('action'); setSearch(''); setCreatingList(false) }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs font-medium truncate flex-1">{selectedAction.title}</span>
                    </div>
                )}

                {/* Champ de recherche */}
                {!creatingList && !saving && (
                    <input
                        autoFocus
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={level === 'action' ? 'Rechercher une action…' : 'Rechercher une liste…'}
                        className="w-full text-xs border border-border rounded-md px-2 py-1 outline-none bg-background"
                    />
                )}

                {/* Niveau 1 : actions groupées par projet */}
                {level === 'action' && (
                    <ul className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
                        {actionGroups.length === 0 && (
                            <li className="text-xs text-muted-foreground px-2 py-1">Aucune action</li>
                        )}
                        {actionGroups.map(([projectTitle, group]) => (
                            <li key={projectTitle || '__none__'}>
                                {projectTitle && (
                                    <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        {projectTitle}
                                    </div>
                                )}
                                <ul className="flex flex-col gap-0.5">
                                    {group.actions.map(a => (
                                        <li key={a.id}>
                                            <button
                                                onClick={() => selectAction(a)}
                                                className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors ${projectTitle ? 'pl-4' : ''}`}
                                            >
                                                {a.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Niveau 2 : listes */}
                {level === 'list' && !saving && (
                    <>
                        {creatingList ? (
                            <input
                                autoFocus
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitNewList()
                                    if (e.key === 'Escape') { setCreatingList(false); setNewListName('') }
                                }}
                                placeholder="Nom de la liste…"
                                className="w-full text-xs border border-border rounded-md px-2 py-1 outline-none bg-background"
                            />
                        ) : (
                            <ul className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
                                {filteredLists.length === 0 && (
                                    <li className="text-xs text-muted-foreground px-2 py-1">Aucune liste</li>
                                )}
                                {filteredLists.map(l => (
                                    <li key={l.id}>
                                        <button
                                            onClick={() => selectList(l)}
                                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors"
                                        >
                                            {l.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!creatingList && (
                            <button
                                onClick={() => { setCreatingList(true); setSearch('') }}
                                className="w-full text-left text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-t border-border mt-1 pt-1"
                            >
                                + Nouvelle liste
                            </button>
                        )}
                    </>
                )}

                {saving && (
                    <span className="text-xs text-muted-foreground px-2 py-1">Création…</span>
                )}
            </PopoverContent>
        </Popover>
    )
}
