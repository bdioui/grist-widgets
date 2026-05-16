import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { X, Plus, Pencil, Check } from 'lucide-react'
import {
    getMemberActionCardsByCard, getProjectActionCardsByCard, getToDoListsWithItemsByCard,
    getStatuses, getCategories, getMembers, getProjects, getPartners,
    updateActionCard, updateToDoItem, addToDoItemToList, addToDoListToCard,
    addMemberToCard, removeMemberFromCard, addProjectToCard, removeProjectFromCard,
} from '@/lib/api'
import type { Status, Category, Member, Partner, Project, ToDoList, ToDoItem, MemberActionCard, ProjectActionCard } from '@/lib/types'

// --- Types exportés (utilisés par Categories, DraggableCard, etc.) ---

export type { Status as StatusData, Category as CategoryData }

export type Owner = {
    id: number
    first_name: string
    last_name: string
    position?: string
}

export type ActionCardData = {
    id: number
    title: string
    description?: string
    status: Pick<Status, 'id' | 'label' | 'context'>
    category: {
        id: number
        title: string
        color?: string | null
        parent?: { id: number; title: string; color?: string | null }
    }
    owner?: Owner
    start_date?: string
    end_date?: string
}

// --- Helpers ---

const STATUS_COLORS: Record<string, string> = {
    'En cours':  '#d1fae5',
    'Planifié':  '#fef9c3',
    'Terminé':   '#f3f4f6',
    'Annulé':    '#fee2e2',
    'À traiter': '#ffedd5',
}

const ROLES = ['Responsable', 'Contributeur', 'Observateur']

function formatDate(date?: string) {
    if (!date) return null
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// --- Sous-composant : ligne d'un todo item ---

type TodoItemRowProps = {
    item: ToDoItem
    onToggle: (item: ToDoItem) => void
    onDelete: (item: ToDoItem) => void
}

function TodoItemRow({ item, onToggle, onDelete }: TodoItemRowProps) {
    const done = item.status_id === 9
    return (
        <li className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted group">
            <Checkbox
                checked={done}
                onCheckedChange={() => onToggle(item)}
                id={`todo-${item.id}`}
            />
            <label
                htmlFor={`todo-${item.id}`}
                className={`flex-1 text-sm cursor-pointer ${done ? 'line-through text-muted-foreground' : ''}`}
            >
                {item.content}
            </label>
            <button
                onClick={() => onDelete(item)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            >
                <X size={12} />
            </button>
        </li>
    )
}

// --- Sous-composant : section todo list ---

type TodoSectionProps = {
    list: ToDoList & { items: ToDoItem[] }
    onToggle: (listId: number, item: ToDoItem) => void
    onDeleteItem: (listId: number, item: ToDoItem) => void
    onAddItem: (listId: number, content: string) => void
}

function TodoSection({ list, onToggle, onDeleteItem, onAddItem }: TodoSectionProps) {
    const [input, setInput] = useState('')
    const done = list.items.filter(i => i.status_id === 9).length

    function submit() {
        if (!input.trim()) return
        onAddItem(list.id, input.trim())
        setInput('')
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium">{list.title}</span>
                <span className="text-xs text-muted-foreground">{done}/{list.items.length}</span>
            </div>
            <ul className="flex flex-col gap-0.5">
                {list.items.map(item => (
                    <TodoItemRow
                        key={item.id}
                        item={item}
                        onToggle={item => onToggle(list.id, item)}
                        onDelete={item => onDeleteItem(list.id, item)}
                    />
                ))}
            </ul>
            <div className="flex gap-2 mt-1">
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="Nouvelle tâche..."
                    className="h-7 text-xs"
                />
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={submit} disabled={!input.trim()}>
                    <Plus size={12} />
                </Button>
            </div>
        </div>
    )
}

// --- Composant recherche membre avec suggestions ---

type MemberSearchInputProps = {
    members: Member[]
    partners: Partner[]
    onSelect: (member: Member) => void
}

function MemberSearchInput({ members, partners, onSelect }: MemberSearchInputProps) {
    const [query, setQuery]   = useState('')
    const [open, setOpen]     = useState(false)
    const partnerMap = new Map(partners.map(p => [p.id, p]))

    const filtered = query.trim().length === 0 ? members : members.filter(m => {
        const full = `${m.first_name} ${m.last_name}`.toLowerCase()
        const partner = partnerMap.get(m.partner_id)?.name.toLowerCase() ?? ''
        return full.includes(query.toLowerCase()) || partner.includes(query.toLowerCase())
    })

    function select(m: Member) {
        onSelect(m)
        setQuery('')
        setOpen(false)
    }

    return (
        <div className="relative flex-1">
            <Input
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Rechercher un membre..."
                className="h-8 text-xs"
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filtered.map(m => {
                            const partner = partnerMap.get(m.partner_id)
                            return (
                                <li
                                    key={m.id}
                                    onMouseDown={() => select(m)}
                                    className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-muted"
                                >
                                    <span>{m.first_name} {m.last_name}</span>
                                    {partner && (
                                        <span
                                            className="shrink-0 text-xs px-1.5 py-0.5 rounded-full border border-border"
                                            style={partner.color ? { backgroundColor: partner.color } : {}}
                                        >
                                            {partner.name}
                                        </span>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}

// --- Sheet de détail / édition ---

type DetailSheetProps = {
    card: ActionCardData
    open: boolean
    onClose: () => void
    onUpdated: (patch: Partial<ActionCardData>) => void
}

type MemberLink = MemberActionCard & { member: Member }
type ProjectLink = ProjectActionCard & { project: Project }

function ActionCardDetailSheet({ card, open, onClose, onUpdated }: DetailSheetProps) {
    const [loading, setLoading] = useState(true)

    // Données associées
    const [memberLinks, setMemberLinks] = useState<MemberLink[]>([])
    const [projectLinks, setProjectLinks] = useState<ProjectLink[]>([])
    const [todoLists, setTodoLists] = useState<(ToDoList & { items: ToDoItem[] })[]>([])

    // Données de référence pour les selects
    const [allStatuses,   setAllStatuses]   = useState<Status[]>([])
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const [allMembers,    setAllMembers]    = useState<Member[]>([])
    const [allPartners,   setAllPartners]   = useState<Partner[]>([])
    const [allProjects,   setAllProjects]   = useState<Project[]>([])

    // Edits en cours
    const [editing, setEditing] = useState(false)
    const [draft, setDraft]     = useState<ActionCardData>(card)

    // Ajout membres
    const [memberToAdd, setMemberToAdd] = useState(0)
    const [roleToAdd, setRoleToAdd]     = useState(ROLES[1])

    // Ajout projet
    const [projectToAdd, setProjectToAdd] = useState('')

    // Ajout to-do list
    const [newListTitle, setNewListTitle] = useState('')
    const [showNewList, setShowNewList]   = useState(false)

    useEffect(() => {
        if (!open) return
        setDraft(card)
        setEditing(false)
        setLoading(true)
        Promise.all([
            getMemberActionCardsByCard(card.id),
            getProjectActionCardsByCard(card.id),
            getToDoListsWithItemsByCard(card.id),
            getStatuses(),
            getCategories(),
            getMembers(),
            getPartners(),
            getProjects(),
        ]).then(([ml, pl, tl, s, c, m, pt, p]) => {
            setMemberLinks(ml as MemberLink[])
            setProjectLinks(pl as ProjectLink[])
            setTodoLists(tl)
            setAllStatuses(s.filter(st => st.context === 'action_card'))
            setAllCategories(c)
            setAllMembers(m)
            setAllPartners(pt)
            setAllProjects(p)
        }).finally(() => setLoading(false))
    }, [open, card.id])

    function setDraftField<K extends keyof ActionCardData>(key: K, value: ActionCardData[K]) {
        setDraft(prev => ({ ...prev, [key]: value }))
    }

    async function saveEdit() {
        const patch: Parameters<typeof updateActionCard>[1] = {
            title:       draft.title,
            description: draft.description ?? '',
            start_date:  draft.start_date ?? '',
            end_date:    draft.end_date ?? '',
            status_id:   draft.status.id,
            category_id: draft.category.id,
        }
        await updateActionCard(card.id, patch)

        // Reconstruire les champs enrichis pour onUpdated
        const newStatus = allStatuses.find(s => s.id === draft.status.id) ?? draft.status
        const rawCat    = allCategories.find(c => c.id === draft.category.id)
        const parentCat = rawCat?.parent_category_id
            ? allCategories.find(c => c.id === rawCat.parent_category_id)
            : undefined
        const newCategory = rawCat
            ? { id: rawCat.id, title: rawCat.title, parent: parentCat ? { id: parentCat.id, title: parentCat.title } : undefined }
            : draft.category

        onUpdated({ ...draft, status: newStatus, category: newCategory })
        setEditing(false)
    }

    function cancelEdit() {
        setDraft(card)
        setEditing(false)
    }

    // --- Todos ---

    function toggleTodo(listId: number, item: ToDoItem) {
        const newStatusId = item.status_id === 9 ? 8 : 9
        updateToDoItem(item.id, { status_id: newStatusId })
        setTodoLists(prev => prev.map(l =>
            l.id !== listId ? l : {
                ...l,
                items: l.items.map(i => i.id === item.id ? { ...i, status_id: newStatusId } : i),
            }
        ))
    }

    function deleteTodoItem(listId: number, item: ToDoItem) {
        updateToDoItem(item.id, { status_id: item.status_id })
        setTodoLists(prev => prev.map(l =>
            l.id !== listId ? l : { ...l, items: l.items.filter(i => i.id !== item.id) }
        ))
    }

    async function addTodoItem(listId: number, content: string) {
        const newItem = await addToDoItemToList(listId, content)
        setTodoLists(prev => prev.map(l =>
            l.id !== listId ? l : { ...l, items: [...l.items, newItem] }
        ))
    }

    async function addList() {
        if (!newListTitle.trim()) return
        const newList = await addToDoListToCard(card.id, newListTitle.trim())
        setTodoLists(prev => [...prev, newList])
        setNewListTitle('')
        setShowNewList(false)
    }

    // --- Membres ---

    async function handleAddMemberById(memberId: number) {
        if (!memberId) return
        const link = await addMemberToCard(card.id, memberId, roleToAdd)
        setMemberLinks(prev => [...prev, link as MemberLink])
        setMemberToAdd(0)
    }

    async function handleRemoveMember(linkId: number) {
        await removeMemberFromCard(linkId)
        setMemberLinks(prev => prev.filter(l => l.id !== linkId))
    }

    // --- Projets ---

    async function handleAddProject() {
        const id = Number(projectToAdd)
        if (!id) return
        const link = await addProjectToCard(card.id, id)
        setProjectLinks(prev => [...prev, link as ProjectLink])
        setProjectToAdd('')
    }

    async function handleRemoveProject(linkId: number) {
        await removeProjectFromCard(linkId)
        setProjectLinks(prev => prev.filter(l => l.id !== linkId))
    }

    const statusColor = STATUS_COLORS[card.status.label] ?? '#f3f4f6'

    const parentCategories = allCategories.filter(c => !c.parent_category_id)

    // Membres et projets non encore liés
    const linkedMemberIds  = memberLinks.map(l => l.member_id)
    const linkedProjectIds = projectLinks.map(l => l.project_id)
    const availableMembers  = allMembers.filter(m => !linkedMemberIds.includes(m.id))
    const availableProjects = allProjects.filter(p => !linkedProjectIds.includes(p.id))

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[580px] overflow-y-auto flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <SheetTitle className="flex-1 min-w-0 text-base truncate">
                        {editing ? (
                            <Input
                                value={draft.title}
                                onChange={e => setDraftField('title', e.target.value)}
                                className="w-full h-8 text-sm font-semibold"
                            />
                        ) : card.title}
                    </SheetTitle>
                    <div className="flex items-center gap-2 shrink-0">
                        {editing ? (
                            <>
                                <Button className="rounded-md"size="sm" variant="outline" onClick={cancelEdit}>Annuler</Button>
                                <Button className="rounded-md" size="sm" onClick={saveEdit}><Check size={13} className="mr-1" />Enregistrer</Button>
                            </>
                        ) : (
                            <Button className="rounded-md" size="sm" variant="outline" onClick={() => setEditing(true)}>
                                <Pencil size={13} className="mr-2" />Modifier
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                {loading ? (
                    <div className="flex flex-col gap-3 p-6">
                        {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

                        {/* Statut + catégorie */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" style={{ backgroundColor: statusColor }}>
                                {card.status.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {card.category.parent ? `${card.category.parent.title} › ${card.category.title}` : card.category.title}
                            </span>
                        </div>

                        {/* Champs éditables */}
                        {editing ? (
                            <section className="flex flex-col gap-3">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Général</p>

                                <div className="flex flex-col gap-1.5">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={draft.description ?? ''}
                                        onChange={e => setDraftField('description', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label>Date de début</Label>
                                        <Input type="date" value={draft.start_date ?? ''} onChange={e => setDraftField('start_date', e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label>Date de fin</Label>
                                        <Input type="date" value={draft.end_date ?? ''} onChange={e => setDraftField('end_date', e.target.value)} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label>Statut</Label>
                                    <Select
                                        value={String(draft.status.id)}
                                        onValueChange={v => {
                                            const s = allStatuses.find(s => s.id === Number(v))
                                            if (s) setDraftField('status', s)
                                        }}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allStatuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label>Catégorie</Label>
                                    <Select
                                        value={String(draft.category.id)}
                                        onValueChange={v => {
                                            const raw = allCategories.find(c => c.id === Number(v))
                                            if (!raw) return
                                            const parent = raw.parent_category_id
                                                ? allCategories.find(c => c.id === raw.parent_category_id)
                                                : undefined
                                            setDraftField('category', {
                                                id: raw.id,
                                                title: raw.title,
                                                parent: parent ? { id: parent.id, title: parent.title } : undefined,
                                            })
                                        }}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {parentCategories.map(parent => {
                                                const children = allCategories.filter(c => c.parent_category_id === parent.id)
                                                return (
                                                    <div key={parent.id}>
                                                        <SelectItem value={String(parent.id)} className="font-medium">{parent.title}</SelectItem>
                                                        {children.map(c => (
                                                            <SelectItem key={c.id} value={String(c.id)} className="pl-6 text-muted-foreground">{c.title}</SelectItem>
                                                        ))}
                                                    </div>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </section>
                        ) : (
                            /* Vue lecture */
                            <section className="flex flex-col gap-2 text-sm">
                                {card.description && (
                                    <p className="text-muted-foreground leading-relaxed">{card.description}</p>
                                )}
                                {(card.start_date || card.end_date) && (
                                    <p className="text-xs text-muted-foreground">
                                        {card.start_date && <span>Début : {formatDate(card.start_date)}</span>}
                                        {card.start_date && card.end_date && <span className="mx-2">·</span>}
                                        {card.end_date   && <span>Fin : {formatDate(card.end_date)}</span>}
                                    </p>
                                )}
                                {card.owner && (
                                    <p className="text-xs text-muted-foreground">
                                        Responsable : <span className="font-medium text-foreground">{card.owner.first_name} {card.owner.last_name}</span>
                                        {card.owner.position ? ` — ${card.owner.position}` : ''}
                                    </p>
                                )}
                            </section>
                        )}

                        <Separator />

                        {/* To-do lists */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To-do </p>
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowNewList(v => !v)}>
                                    <Plus size={11} />Nouvelle liste
                                </Button>
                            </div>

                            {showNewList && (
                                <div className="flex gap-2">
                                    <Input
                                        value={newListTitle}
                                        onChange={e => setNewListTitle(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addList()}
                                        placeholder="Titre de la liste..."
                                        className="h-8 text-xs"
                                    />
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={addList} disabled={!newListTitle.trim()}>
                                        <Plus size={12} />
                                    </Button>
                                </div>
                            )}

                            {todoLists.length > 0 ? (
                                <div className="flex flex-col gap-5">
                                    {todoLists.map(list => (
                                        <TodoSection
                                            key={list.id}
                                            list={list}
                                            onToggle={toggleTodo}
                                            onDeleteItem={deleteTodoItem}
                                            onAddItem={addTodoItem}
                                        />
                                    ))}
                                </div>
                            ) : (
                                !showNewList && (
                                    <p className="text-xs text-muted-foreground italic">Aucune liste de tâches</p>
                                )
                            )}
                        </section>

                        <Separator />

                        {/* Participants */}
                        <section className="flex flex-col gap-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</p>

                            {memberLinks.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    {memberLinks.map(l => {
                                        const partner = allPartners.find(p => p.id === l.member.partner_id)
                                        return (
                                            <div key={l.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted group">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm">{l.member.first_name} {l.member.last_name}</span>
                                                        <span className="text-xs text-muted-foreground">{l.role}</span>
                                                    </div>
                                                    {partner && (
                                                        <span
                                                            className="shrink-0 text-xs px-1.5 py-0.5 rounded-full border border-border"
                                                            style={partner.color ? { backgroundColor: partner.color } : {}}
                                                        >
                                                            {partner.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMember(l.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive ml-2"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {availableMembers.length > 0 && (
                                <div className="flex gap-2">
                                    <MemberSearchInput
                                        members={availableMembers}
                                        partners={allPartners}
                                        onSelect={m => handleAddMemberById(m.id)}
                                    />
                                    <Select value={roleToAdd} onValueChange={setRoleToAdd}>
                                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </section>

                        <Separator />

                        {/* Projets liés */}
                        <section className="flex flex-col gap-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projets liés</p>

                            {projectLinks.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    {projectLinks.map(l => (
                                        <div key={l.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted group">
                                            <span className="text-sm">{l.project.title}</span>
                                            <button
                                                onClick={() => handleRemoveProject(l.id)}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {availableProjects.length > 0 && (
                                <div className="flex gap-2">
                                    <Select value={projectToAdd} onValueChange={setProjectToAdd}>
                                        <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Lier un projet" /></SelectTrigger>
                                        <SelectContent>
                                            {availableProjects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleAddProject} disabled={!projectToAdd}>
                                        <Plus size={13} />
                                    </Button>
                                </div>
                            )}
                        </section>

                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

// --- Composant principal carte ---

export default function ActionCard(props: ActionCardData) {
    const { title, status, category, owner, start_date, end_date } = props
    const [open, setOpen]     = useState(false)
    const [data, setData]     = useState<ActionCardData>(props)

    // Synchroniser si les props changent (drag & drop change la catégorie)
    useEffect(() => { setData(props) }, [props])

    const statusColor = STATUS_COLORS[data.status.label] ?? '#f3f4f6'

    return (
        <>
            <Card
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 focus:outline-none"
                onClick={() => setOpen(true)}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-snug">{title}</CardTitle>
                        <Badge variant="secondary" className="shrink-0 text-xs rounded-xl" style={{ backgroundColor: statusColor }}>
                            {status.label}
                        </Badge>
                    </div>
                    <CardDescription className="text-xs">
                        {category.parent ? `${category.parent.title} › ${category.title}` : category.title}
                    </CardDescription>
                </CardHeader>

                {(owner || start_date || end_date) && (
                    <CardContent className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                        {owner && <span>{owner.first_name} {owner.last_name}</span>}
                        {(start_date || end_date) && (
                            <span className="ml-auto">
                                {formatDate(start_date)}{end_date ? ` → ${formatDate(end_date)}` : ''}
                            </span>
                        )}
                    </CardContent>
                )}
            </Card>

            <ActionCardDetailSheet
                card={data}
                open={open}
                onClose={() => setOpen(false)}
                onUpdated={patch => setData(prev => ({ ...prev, ...patch }))}
            />
        </>
    )
}
