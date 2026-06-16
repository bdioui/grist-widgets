import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { X, Plus, Pencil, Check, Trash2, Copy, CheckIcon, ListChecks, Trash, FileDown, File, Folder, Users, MessageCircle, Eye, EyeClosed, Calendar } from 'lucide-react'
import { exportToCsv } from '@/lib/utils'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import {
    getMemberActionCardsByCard, getProjectActionCardsByCard, getToDoListsWithItemsByCard,
    getStatuses, getCategories, getMembers, getProjects, getPartners, getFinancialAgreements,
    updateActionCard, updateToDoItem, addToDoItemToList, addToDoListToCard, deleteToDoList,
    addMemberToCard, removeMemberFromCard, updateMemberRole, addProjectToCard, removeProjectFromCard,
    getAgreementActionCardsByCard, addAgreementToCard, removeAgreementFromCard,
    deleteActionCard,
    getCommentsFull, createComment, updateComment, deleteComment,
    addMember,
} from '@/lib/api'
import type { Status, Category, Member, Partner, Project, ToDoList, ToDoItem, MemberActionCard, ProjectActionCard, AgreementActionCard, FinancialAgreement, CommentFull } from '@/lib/types'
import { useCurrentUser } from '@/lib/userContext'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SearchInput from '@/components/SearchInput'

const MEMBER_STATUSES = [
    'Enseignant-chercheur', 'Chercheur', 'Ingénieur', 'Doctorant',
    'Post-doc', 'BIATSS', 'Autre',
]

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

const ROLES = ['Responsable', 'Contributeur', 'Observateur', 'Prospect']

function formatDate(date?: string) {
    if (!date) return null
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// --- Sous-composant : ligne d'un todo item ---

type TodoItemRowProps = {
    item: ToDoItem
    onToggle: (item: ToDoItem) => void
    onDelete: (item: ToDoItem) => void
    onDueDateChange: (item: ToDoItem, due_date: string) => void
}

function TodoItemRow({ item, onToggle, onDelete, onDueDateChange }: TodoItemRowProps) {
    const [editingDate, setEditingDate] = useState(false)
    const done = item.status_id === 9
    const today = new Date().toISOString().slice(0, 10)
    const isOverdue = item.due_date && !done && item.due_date < today
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
            {item.due_date || editingDate ? (
                <input
                    type="date"
                    autoFocus={editingDate && !item.due_date}
                    value={item.due_date ?? ''}
                    onChange={e => { onDueDateChange(item, e.target.value); setEditingDate(false) }}
                    onBlur={() => setEditingDate(false)}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs border-none bg-transparent outline-none w-28 cursor-pointer ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
                />
            ) : (
                <button
                    onClick={e => { e.stopPropagation(); setEditingDate(true) }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                >
                    <Calendar size={12} />
                </button>
            )}
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
    onAddItem: (listId: number, content: string, due_date?: string) => void
    onDeleteList: (listId: number) => void
    onDueDateChange: (listId: number, item: ToDoItem, due_date: string) => void
}

function TodoSection({ list, onToggle, onDeleteItem, onAddItem, onDeleteList, onDueDateChange }: TodoSectionProps) {
    const [input, setInput] = useState('')
    const [dueDate, setDueDate] = useState('')
    const done = list.items.filter(i => i.status_id === 9).length

    function submit() {
        if (!input.trim()) return
        onAddItem(list.id, input.trim(), dueDate || undefined)
        setInput('')
        setDueDate('')
    }

    return (
        <div className="flex flex-col gap-1 group/list">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium">{list.title}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{done}/{list.items.length}</span>
                    <button
                        onClick={() => onDeleteList(list.id)}
                        className="opacity-0 group-hover/list:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
            <ul className="flex flex-col gap-0.5">
                {list.items.slice().sort((a, b) => {
                    if (!a.due_date && !b.due_date) return 0
                    if (!a.due_date) return 1
                    if (!b.due_date) return -1
                    return a.due_date.localeCompare(b.due_date)
                }).map(item => (
                    <TodoItemRow
                        key={item.id}
                        item={item}
                        onToggle={item => onToggle(list.id, item)}
                        onDelete={item => onDeleteItem(list.id, item)}
                        onDueDateChange={(item, due_date) => onDueDateChange(list.id, item, due_date)}
                    />
                ))}
            </ul>
            <div className="flex gap-2 mt-1">
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="Nouvelle tâche..."
                    className="h-7 text-xs flex-1"
                />
                <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="h-7 text-xs border border-input rounded-md px-2 bg-background text-muted-foreground w-32"
                />
                <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={submit} disabled={!input.trim()}>
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

// --- Composant recherche convention avec suggestions ---

type AgreementSearchInputProps = {
    agreements: FinancialAgreement[]
    partners:   Partner[]
    projects:   Project[]
    onSelect:   (agreement: FinancialAgreement) => void
}

function AgreementSearchInput({ agreements, partners, projects, onSelect }: AgreementSearchInputProps) {
    const [query, setQuery] = useState('')
    const [open, setOpen]   = useState(false)

    const partnerMap = new Map(partners.map(p => [p.id, p]))
    const projectMap = new Map(projects.map(p => [p.id, p]))

    const filtered = query.trim().length === 0 ? agreements : agreements.filter(a => {
        const partnerName = partnerMap.get(a.partner_id)?.name.toLowerCase() ?? ''
        const projectTitle = projectMap.get(a.project_id)?.title.toLowerCase() ?? ''
        return (
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            partnerName.includes(query.toLowerCase()) ||
            projectTitle.includes(query.toLowerCase())
        )
    })

    function select(a: FinancialAgreement) {
        onSelect(a)
        setQuery('')
        setOpen(false)
    }

    return (
        <div className="relative">
            <Input
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Rechercher une convention..."
                className="h-8 text-xs"
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
                    <ul className="max-h-56 overflow-y-auto py-1">
                        {filtered.map(a => {
                            const partner = partnerMap.get(a.partner_id)
                            const project = projectMap.get(a.project_id)
                            return (
                                <li
                                    key={a.id}
                                    onMouseDown={() => select(a)}
                                    className="flex flex-col gap-0.5 px-3 py-2 cursor-pointer hover:bg-muted"
                                >
                                    <span className="text-sm font-medium">{a.title}</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {project && (
                                            <span className="text-xs text-muted-foreground">{project.title}</span>
                                        )}
                                        {partner && (
                                            <span
                                                className="text-xs px-1.5 py-0.5 rounded-full border border-border"
                                                style={partner.color ? { backgroundColor: partner.color } : {}}
                                            >
                                                {partner.name}
                                            </span>
                                        )}
                                        {a.signed_date && (
                                            <span className="text-xs text-muted-foreground">signé le {formatDate(a.signed_date)}</span>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}

// --- Comment Card ---

function CommentCard({ comment, onComment, onDelete, onEdit, isOwner }: {
    comment: CommentFull
    onComment: () => void
    onDelete: () => void
    onEdit: () => void
    isOwner: boolean
}) {
    return (
        <Card className="w-full mt-2 group">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                            <AvatarImage src={comment.owner.profile_image} />
                            <AvatarFallback className="text-xs">
                                {comment.owner.first_name[0]}{comment.owner.last_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        {comment.owner.first_name} {comment.owner.last_name}
                    </div>
                    

                    <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-text-foreground" onClick={onComment}>
                            <MessageCircle size={14} />
                        </Button>
                        {isOwner && (
                            <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}>
                                <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
                                <Trash2 size={14} />
                            </Button>
                            </>
                        )}
                        
                       
                    </div>
                </CardTitle>
                <CardDescription className="text-xs">
                    {new Date(comment.timestamp).toLocaleString('fr-FR')}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
                <p className="text-sm">{comment.content}</p>
            </CardContent>
        </Card>
    )
}

// --- Sheet de détail / édition ---

type DetailSheetProps = {
    card: ActionCardData
    open: boolean
    onClose: () => void
    onUpdated: (patch: Partial<ActionCardData>) => void
    onDeleted?: (id: number) => void
}

// --- Formulaire création rapide membre (dans le sheet détail) ---

function MemberQuickCreateForm({ partners, role, onSaved, onCancel }: {
    partners: Partner[]
    role: string
    onSaved: (member: Member) => void
    onCancel: () => void
}) {
    const [firstName,  setFirstName]  = useState('')
    const [lastName,   setLastName]   = useState('')
    const [email,      setEmail]      = useState('')
    const [position,   setPosition]   = useState('')
    const [statusVal,  setStatusVal]  = useState(MEMBER_STATUSES[0])
    const [partnerId,  setPartnerId]  = useState<number>(partners[0]?.id ?? 0)
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit() {
        if (!firstName.trim() || !lastName.trim()) return
        setSubmitting(true)
        try {
            const member = await addMember({
                first_name: firstName, last_name: lastName,
                email, position, status: statusVal,
                partner_id: partnerId, lab_id: 0,
                tel: '', genre: '', profile_image: '', is_staff: false,
            })
            onSaved(member)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">
                Nouveau contact · rôle : <span className="text-foreground">{role}</span>
            </p>
            <div className="flex gap-2">
                <Input value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Prénom *" className="h-8 text-xs flex-1" autoFocus />
                <Input value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Nom *" className="h-8 text-xs flex-1" />
            </div>
            <div className="flex gap-2">
                <Input value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Email" className="h-8 text-xs flex-1" type="email" />
                <Input value={position} onChange={e => setPosition(e.target.value)}
                    placeholder="Fonction" className="h-8 text-xs flex-1" />
            </div>
            <div className="flex gap-2">
                <Select value={statusVal} onValueChange={setStatusVal}>
                    <SelectTrigger className="h-8 text-xs w-40 shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper">
                        {MEMBER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="flex-1 min-w-0">
                    <SearchInput
                        data={partners}
                        onSelect={p => setPartnerId(p.id)}
                        getLabel={p => p.name}
                        placeholder="Partenaire..."
                        value={partners.find(p => p.id === partnerId)?.name}
                    />
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>Annuler</Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || !firstName.trim() || !lastName.trim()}>
                    <Check size={12} className="mr-1" />{submitting ? '...' : 'Créer et ajouter'}
                </Button>
            </div>
        </div>
    )
}

type MemberLink    = MemberActionCard    & { member: Member }
type ProjectLink   = ProjectActionCard   & { project: Project }
type AgreementLink = AgreementActionCard & { agreement: FinancialAgreement }

export function ActionCardDetailSheet({ card, open, onClose, onUpdated, onDeleted }: DetailSheetProps) {
    const [loading, setLoading] = useState(true)

    // Données associées
    const [memberLinks,    setMemberLinks]    = useState<MemberLink[]>([])
    const [projectLinks,   setProjectLinks]   = useState<ProjectLink[]>([])
    const [agreementLinks, setAgreementLinks] = useState<AgreementLink[]>([])
    const [todoLists, setTodoLists] = useState<(ToDoList & { items: ToDoItem[] })[]>([])

    // Données de référence pour les selects
    const [allStatuses,   setAllStatuses]   = useState<Status[]>([])
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const [allMembers,    setAllMembers]    = useState<Member[]>([])
    const [allPartners,   setAllPartners]   = useState<Partner[]>([])
    const [allProjects,   setAllProjects]   = useState<Project[]>([])
    const [allAgreements, setAllAgreements] = useState<FinancialAgreement[]>([])

    // Edits en cours
    const [editing, setEditing] = useState(false)
    const [draft, setDraft]     = useState<ActionCardData>(card)

    // Suppression
    const [confirming, setConfirming] = useState(false)
    const [deleting,   setDeleting]   = useState(false)


    // Ajout membres
    const [roleToAdd, setRoleToAdd] = useState(ROLES[1])
    const [selectedLinks, setSelectedLinks] = useState<MemberLink[]>([])
    const [copiedEmails, setCopiedEmails] = useState(false)

    // Ajout projet
    const [projectToAdd, setProjectToAdd] = useState('')

    // Ajout to-do list
    const [newListTitle, setNewListTitle] = useState('')
    const [showNewList, setShowNewList]   = useState(false)


    // Togglers des section
    const [toDoExtended, setToDoExtended] = useState(true)
    const [membersExtended,  setMembersExtended]  = useState(true)
    const [showCreateMember, setShowCreateMember] = useState(false)
    const [projectsExtended, setProjectsExtended] = useState(true)
    const [agreementsExtended, setAgreementsExtended] = useState(true)
    const [commentsExtended, setCommentsExtended] = useState(true)


    // Commentaires
    const currentUser = useCurrentUser()
    const [comments,        setComments]        = useState<CommentFull[]>([])
    const [newComment,      setNewComment]       = useState('')
    const [replyingTo,      setReplyingTo]       = useState<number | null>(null)
    const [replyContent,    setReplyContent]     = useState('')
    const [editingComment,  setEditingComment]   = useState<number | null>(null)
    const [editContent,     setEditContent]      = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)

    async function handleAddComment() {
        if (!newComment.trim() || !currentUser) return
        setSubmittingComment(true)
        const created = await createComment({
            owner_id: currentUser.id,
            action_card_id: card.id,
            content: newComment.trim(),
            timestamp: new Date().toISOString(),
        })
        const newFull: CommentFull = { ...created, owner: currentUser, replies: [] }
        setComments(prev => [newFull, ...prev])
        setNewComment('')
        setSubmittingComment(false)
    }

    async function handleReply(parentId: number) {
        if (!replyContent.trim() || !currentUser) return
        setSubmittingComment(true)
        const created = await createComment({
            owner_id: currentUser.id,
            action_card_id: card.id,
            parent_comment_id: parentId,
            content: replyContent.trim(),
            timestamp: new Date().toISOString(),
        })
        const newReply: CommentFull = { ...created, owner: currentUser, replies: [] }
        setComments(prev => prev.map(c =>
            c.id === parentId ? { ...c, replies: [...(c.replies ?? []), newReply] } : c
        ))
        setReplyingTo(null)
        setReplyContent('')
        setSubmittingComment(false)
    }

    async function handleEditComment(id: number) {
        if (!editContent.trim()) return
        await updateComment(id, { content: editContent.trim() })
        setComments(prev => prev.map(c => {
            if (c.id === id) return { ...c, content: editContent.trim() }
            return { ...c, replies: c.replies?.map(r => r.id === id ? { ...r, content: editContent.trim() } : r) }
        }))
        setEditingComment(null)
        setEditContent('')
    }

    async function handleDeleteComment(id: number) {
        await deleteComment(id)
        setComments(prev =>
            prev.filter(c => c.id !== id)
                .map(c => ({ ...c, replies: c.replies?.filter(r => r.id !== id) }))
        )
    }

    // Visibilité des sections de Sheet 
    const [showTodo, setShowTodo] = useState(false)
    const [showMembers, setShowMembers] = useState(false)
    const [showAgreements, setShowAgreements] = useState(false)
    const [showProjects, setShowProjects] = useState(false)
    
    useEffect(() => {
        if (!open) return
        setDraft(card)
        setEditing(false)
        setConfirming(false)
        setLoading(true)
        Promise.all([
            getMemberActionCardsByCard(card.id),
            getProjectActionCardsByCard(card.id),
            getAgreementActionCardsByCard(card.id),
            getToDoListsWithItemsByCard(card.id),
            getStatuses(),
            getCategories(),
            getMembers(),
            getPartners(),
            getProjects(),
            getFinancialAgreements(),
            getCommentsFull(card.id),
        ]).then(([ml, pl, al, tl, s, c, m, pt, p, agr, comments]) => {
            setMemberLinks(ml as MemberLink[])
            setProjectLinks(pl as ProjectLink[])
            setAgreementLinks(al as AgreementLink[])
            setTodoLists(tl)
            setAllStatuses(s.filter(st => st.context === 'action_card'))
            setAllCategories(c)
            setAllMembers(m)
            setAllPartners(pt)
            setAllProjects(p)
            setAllAgreements(agr)
            setComments(comments)
            // Visibilité initiale selon le contenu chargé
            setShowTodo(tl.length > 0)
            setShowMembers(ml.length > 0)
            setShowAgreements(al.length > 0)
            setShowProjects(pl.length > 0)
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

    function updateDueDate(listId: number, item: ToDoItem, due_date: string) {
        updateToDoItem(item.id, { due_date })
        setTodoLists(prev => prev.map(l =>
            l.id !== listId ? l : { ...l, items: l.items.map(i => i.id === item.id ? { ...i, due_date } : i) }
        ))
    }

    async function addTodoItem(listId: number, content: string, due_date?: string) {
        const newItem = await addToDoItemToList(listId, content, due_date)
        setTodoLists(prev => prev.map(l =>
            l.id !== listId ? l : { ...l, items: [...l.items, newItem] }
        ))
    }

    async function deleteList(listId: number) {
        await deleteToDoList(listId)
        setTodoLists(prev => prev.filter(l => l.id !== listId))
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
    }

    async function handleRemoveMember(linkId: number) {
        await removeMemberFromCard(linkId)
        setMemberLinks(prev => prev.filter(l => l.id !== linkId))
    }

    async function handleRoleChange(linkId: number, role: string) {
        await updateMemberRole(linkId, role)
        setMemberLinks(prev => prev.map(l => l.id === linkId ? { ...l, role } : l))
    }

    function toggleSelectLink(l: MemberLink) {
        setSelectedLinks(prev => prev.some(s => s.id === l.id) ? prev.filter(s => s.id !== l.id) : [...prev, l])
    }

    function toggleSelectAllLinks() {
        setSelectedLinks(prev => prev.length === memberLinks.length ? [] : [...memberLinks])
    }

    async function handleRemoveSelected() {
        await Promise.all(selectedLinks.map(l => removeMemberFromCard(l.id)))
        setMemberLinks(prev => prev.filter(l => !selectedLinks.some(s => s.id === l.id)))
        setSelectedLinks([])
    }

    function copyMemberEmails() {
        const emails = selectedLinks.map(l => l.member.email).filter(e => !!e).join(', ')
        navigator.clipboard.writeText(emails)
        setCopiedEmails(true)
        setTimeout(() => setCopiedEmails(false), 2000)
    }

    function exportMembersCsv() {
        const headers = ['Prénom', 'Nom', 'Rôle', 'Email', 'Téléphone', 'Partenaire']
        const rows = selectedLinks.map(l => {
            const partner = allPartners.find(p => p.id === l.member.partner_id)
            return [l.member.first_name, l.member.last_name, l.role, l.member.email ?? '', l.member.tel ?? '', partner?.name ?? '']
        })
        exportToCsv(`participants_${card.title}.csv`, headers, rows)
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

    // --- Conventions ---

    async function handleAddAgreement(agreement: FinancialAgreement) {
        const link = await addAgreementToCard(card.id, agreement.id)
        setAgreementLinks(prev => [...prev, link as AgreementLink])
    }

    async function handleRemoveAgreement(linkId: number) {
        await removeAgreementFromCard(linkId)
        setAgreementLinks(prev => prev.filter(l => l.id !== linkId))
    }

    const statusColor = STATUS_COLORS[draft.status.label] ?? '#f3f4f6'

    const parentCategories = allCategories.filter(c => !c.parent_category_id)

    // Membres, projets et conventions non encore liés
    const linkedMemberIds     = memberLinks.map(l => l.member_id)
    const linkedProjectIds    = projectLinks.map(l => l.project_id)
    const linkedAgreementIds  = agreementLinks.map(l => l.financial_agreement_id)
    const availableMembers    = allMembers.filter(m => !linkedMemberIds.includes(m.id))
    const availableProjects   = allProjects.filter(p => !linkedProjectIds.includes(p.id))
    // Si des projets sont liés → on filtre les conventions à ces projets uniquement
    const availableAgreements = allAgreements
        .filter(a => !linkedAgreementIds.includes(a.id))
        .filter(a => linkedProjectIds.length === 0 || linkedProjectIds.includes(a.project_id))

    // Maps pour l'enrichissement dans les popovers
    const partnerMap = new Map(allPartners.map(p => [p.id, p]))
    const projectMap = new Map(allProjects.map(p => [p.id, p]))

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteActionCard(card.id)
            onDeleted?.(card.id)
            onClose()
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) { setConfirming(false); onClose() } }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[580px] flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <SheetTitle className="flex-1 min-w-0 text-base truncate">
                        {editing ? (
                            <Input
                                value={draft.title}
                                onChange={e => setDraftField('title', e.target.value)}
                                className="w-full h-8 text-sm font-semibold"
                            />
                        ) : draft.title}
                    </SheetTitle>
                    <div className="flex items-center gap-2 shrink-0">
                        {confirming ? (
                            <>
                                <span className="text-xs text-destructive">Supprimer ?</span>
                                <Button className="rounded-md h-7" size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? '...' : 'Confirmer'}
                                </Button>
                                <Button className="rounded-md h-7" size="sm" variant="ghost" onClick={() => setConfirming(false)}>Annuler</Button>
                            </>
                        ) : editing ? (
                            <>
                                <Button className="rounded-md" size="sm" variant="outline" onClick={cancelEdit}>Annuler</Button>
                                <Button className="rounded-md" size="sm" onClick={saveEdit}><Check size={13} className="mr-1" />Enregistrer</Button>
                            </>
                        ) : (
                            <>
                                <Button className="rounded-md" size="sm" variant="outline" onClick={() => setEditing(true)}>
                                    <Pencil size={13} className="mr-2" />Modifier
                                </Button>
                                <Button className="rounded-md" size="sm" variant="ghost" onClick={() => setConfirming(true)}>
                                    <Trash2 size={13} className="text-destructive" />
                                </Button>
                            </>
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
                        <div className="flex flex-wrap items-center gap-2 rounded-xl">
                            <Badge variant="secondary" className="rounded-xl" style={{ backgroundColor: statusColor }}>
                                {draft.status.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {draft.category.parent ? `${draft.category.parent.title} › ${draft.category.title}` : draft.category.title}
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
                        {(!showTodo || !showMembers || !showProjects || !showAgreements) && (
                            <>
                            <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline"><Plus /> Section</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {!showTodo && (
                                            <>
                                                <DropdownMenuItem onClick={() => setShowTodo(true)}>
                                                <ListChecks />
                                                To do
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        {!showMembers && (
                                            <>
                                            <DropdownMenuItem onClick={() => setShowMembers(true)}>
                                            <Users />
                                            Participants
                                            </DropdownMenuItem>
                                            </>
                                        )}

                                        {!showProjects && (
                                            <>
                                            <DropdownMenuItem onClick={() => setShowProjects(true)}>
                                                <Folder />
                                                Projets
                                            </DropdownMenuItem>
                                            </>
                                        )}
                                        
                                        {!showAgreements && (
                                            <DropdownMenuItem onClick={() => setShowAgreements(true)}>
                                            <File />
                                            Conventions
                                            </DropdownMenuItem>
                                        )}
                                        
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            </>
                        )}
                        

                        {/* To-do lists */}
                        { showTodo && (
                            <>
                            <section className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className='flex row items-center'>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To-do </p>
                                        {toDoExtended ? (
                                             <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={()=> setToDoExtended(false)}><Eye/></Button>
                                        ) : 
                                             <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setToDoExtended(true)}><EyeClosed/></Button>
                                        }
                                       
                                    </div>
                                    
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
                                    toDoExtended && (
                                        
                                        <div className="flex flex-col gap-5">
                                            {todoLists.map(list => (
                                                <TodoSection
                                                    key={list.id}
                                                    list={list}
                                                    onToggle={toggleTodo}
                                                    onDeleteItem={deleteTodoItem}
                                                    onAddItem={addTodoItem}
                                                    onDeleteList={deleteList}
                                                    onDueDateChange={updateDueDate}
                                                />
                                            ))}
                                        </div>
                                    )
                                    
                                ) : (
                                    !showNewList && (
                                        <p className="text-xs text-muted-foreground italic">Aucune liste de tâches</p>
                                    )
                                )}
                            </section>
                            <Separator />
                            </>
                        )}
                        

                        {/* Participants */}
                        { showMembers && (
                            <>
                            <section className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className='flex row items-center'>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</p>
                                        {membersExtended ? (
                                            <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setMembersExtended(false)}><Eye /></Button>
                                        ) : (
                                            <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setMembersExtended(true)}><EyeClosed /></Button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {membersExtended && selectedLinks.length > 0 && (
                                            <>
                                                <span className="text-xs text-muted-foreground mr-1">{selectedLinks.length} sélectionné{selectedLinks.length > 1 ? 's' : ''}</span>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="outline" className="rounded-md" size="sm" onClick={copyMemberEmails}>
                                                            {copiedEmails ? <CheckIcon size={13} /> : <Copy size={13} />}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Copier email{selectedLinks.length > 1 ? 's' : ''}</p></TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="outline" className="rounded-md" size="sm" onClick={exportMembersCsv}>
                                                            <FileDown size={13} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Exporter en CSV</p></TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="outline" className="rounded-md" size="sm" onClick={handleRemoveSelected}>
                                                            <Trash size={13} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Retirer</p></TooltipContent>
                                                </Tooltip>
                                            </>
                                        )}
                                        {membersExtended && !showCreateMember && (
                                            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"
                                                onClick={() => setShowCreateMember(true)}>
                                                <Plus size={11} />Nouveau contact
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {membersExtended && memberLinks.length > 0 && (
                                    <div>
                                        <Table className="text-xs">
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="h-7 w-6 px-2">
                                                        <Checkbox
                                                            checked={selectedLinks.length > 0 && selectedLinks.length < memberLinks.length ? 'indeterminate' : selectedLinks.length === memberLinks.length && memberLinks.length > 0}
                                                            onCheckedChange={toggleSelectAllLinks}
                                                            className="h-3.5 w-3.5"
                                                        />
                                                    </TableHead>
                                                    <TableHead className="h-7 px-2 text-xs font-normal text-muted-foreground">Nom</TableHead>
                                                    <TableHead className="h-7 px-2 text-xs font-normal text-muted-foreground">Rôle</TableHead>
                                                    <TableHead className="h-7 px-2 text-xs font-normal text-muted-foreground">Partenaire</TableHead>
                                                    <TableHead className="h-7 w-6 px-2" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {memberLinks.map(l => {
                                                    const partner = allPartners.find(p => p.id === l.member.partner_id)
                                                    const isSelected = selectedLinks.some(s => s.id === l.id)
                                                    return (
                                                        <Popover key={l.id}>
                                                            <TableRow className={`group ${isSelected ? 'bg-muted' : ''}`}>
                                                                <TableCell className="px-2 py-1.5">
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onCheckedChange={() => toggleSelectLink(l)}
                                                                        className="h-3.5 w-3.5"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="px-2 py-1.5 whitespace-nowrap">
                                                                    <PopoverTrigger asChild>
                                                                        <button className="text-left hover:underline underline-offset-2">
                                                                            {l.member.first_name} {l.member.last_name}
                                                                        </button>
                                                                    </PopoverTrigger>
                                                                </TableCell>
                                                                <TableCell className="px-0 py-1.5">
                                                                    <Select value={l.role} onValueChange={role => handleRoleChange(l.id, role)}>
                                                                        <SelectTrigger className="h-5 text-xs w-28 border-none p-0 shadow-none text-muted-foreground hover:text-foreground" onClick={e => e.stopPropagation()}>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell className="px-2 py-1.5">
                                                                    {partner && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span
                                                                                    className="text-xs px-2 py-0.5 rounded-full border border-border truncate inline-block max-w-[100px]"
                                                                                    style={partner.color ? { backgroundColor: partner.color } : {}}
                                                                                >
                                                                                    {partner.name}
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>{partner.name}</TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="px-2 py-1.5">
                                                                    <button
                                                                        onClick={() => handleRemoveMember(l.id)}
                                                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                                                    >
                                                                        <X size={13} />
                                                                    </button>
                                                                </TableCell>
                                                            </TableRow>
                                                            <PopoverContent align="start" className="w-72 p-4 flex flex-col gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-9 w-9 shrink-0">
                                                                        <AvatarImage src={l.member.profile_image} />
                                                                        <AvatarFallback className="text-sm bg-muted">
                                                                            {l.member.first_name[0]}{l.member.last_name[0]}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-medium">{l.member.first_name} {l.member.last_name}</span>
                                                                        <span className="text-xs text-muted-foreground truncate">{l.member.position}</span>
                                                                    </div>
                                                                </div>
                                                                <Separator />
                                                                <div className="flex flex-col gap-2 text-xs">
                                                                    {l.member.status && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-20 shrink-0 text-muted-foreground">Statut</span>
                                                                            <span>{l.member.status}</span>
                                                                        </div>
                                                                    )}
                                                                    {l.member.email && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-20 shrink-0 text-muted-foreground">Email</span>
                                                                            <a href={`mailto:${l.member.email}`} className="truncate text-blue-600 hover:underline">{l.member.email}</a>
                                                                        </div>
                                                                    )}
                                                                    {l.member.tel && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-20 shrink-0 text-muted-foreground">Téléphone</span>
                                                                            <a href={`tel:${l.member.tel}`} className="hover:underline">{l.member.tel}</a>
                                                                        </div>
                                                                    )}
                                                                    {partner && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-20 shrink-0 text-muted-foreground">Partenaire</span>
                                                                            <span className="px-1.5 py-0.5 rounded-full border border-border" style={partner.color ? { backgroundColor: partner.color } : {}}>
                                                                                {partner.name}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {membersExtended && showCreateMember && (
                                    <MemberQuickCreateForm
                                        partners={allPartners}
                                        role={roleToAdd}
                                        onSaved={async member => {
                                            setAllMembers(prev => [...prev, member])
                                            await handleAddMemberById(member.id)
                                            setShowCreateMember(false)
                                        }}
                                        onCancel={() => setShowCreateMember(false)}
                                    />
                                )}

                                {membersExtended && !showCreateMember && availableMembers.length > 0 && (
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
                            </>
                        )}
                        

                        

                        {/* Projets liés */}
                        { showProjects && (
                            <>
                            <section className="flex flex-col gap-3">
                                <div className='flex row items-center'>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projets liés</p>
                                    {projectsExtended ? (
                                        <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setProjectsExtended(false)}><Eye /></Button>
                                    ) : (
                                        <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setProjectsExtended(true)}><EyeClosed /></Button>
                                    )}
                                </div>

                                {projectsExtended && projectLinks.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                        {projectLinks.map(l => (
                                            <Popover key={l.id}>
                                                <PopoverTrigger asChild>
                                                    <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted group cursor-pointer">
                                                        <span className="text-sm">{l.project.title}</span>
                                                        <div
                                                            onClick={e => { e.stopPropagation(); handleRemoveProject(l.id) }}
                                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive cursor-pointer"
                                                        >
                                                            <X size={13} />
                                                        </div>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent align="start" className="w-72 p-4 flex flex-col gap-3">
                                                    {/* En-tête */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-medium">{l.project.title}</span>
                                                    </div>

                                                    <Separator />

                                                    {/* Détails financiers */}
                                                    <div className="flex flex-col gap-2 text-xs">
                                                        {l.project.budget > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-24 shrink-0 text-muted-foreground">Budget total</span>
                                                                <span>{l.project.budget.toLocaleString('fr-FR')} €</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        ))}
                                    </div>
                                )}

                                {projectsExtended && availableProjects.length > 0 && (
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
                            <Separator />
                            </>
                        )}
                       

                        

                        {/* Conventions liées */}
                        { showAgreements && (
                                <>
                                <section className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className='flex row items-center'>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conventions liées</p>
                                            {agreementsExtended ? (
                                                <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setAgreementsExtended(false)}><Eye /></Button>
                                            ) : (
                                                <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setAgreementsExtended(true)}><EyeClosed /></Button>
                                            )}
                                        </div>
                                    </div>

                                    {agreementsExtended && agreementLinks.length > 0 && (
                                        <div className="flex flex-col gap-1">
                                            {agreementLinks.map(l => {
                                                const agrPartner = partnerMap.get(l.agreement.partner_id)
                                                const agrProject = projectMap.get(l.agreement.project_id)
                                                return (
                                                    <Popover key={l.id}>
                                                        <PopoverTrigger asChild>
                                                            <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted group cursor-pointer">
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-sm truncate">{l.agreement.title}</span>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        {agrProject && (
                                                                            <span className="text-xs text-muted-foreground truncate">{agrProject.title}</span>
                                                                        )}
                                                                        {agrProject && agrPartner && (
                                                                            <span className="text-xs text-muted-foreground">·</span>
                                                                        )}
                                                                        {agrPartner && (
                                                                            <span
                                                                                className="shrink-0 text-xs px-1.5 py-0.5 rounded-full border border-border"
                                                                                style={agrPartner.color ? { backgroundColor: agrPartner.color } : {}}
                                                                            >
                                                                                {agrPartner.name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    onClick={e => { e.stopPropagation(); handleRemoveAgreement(l.id) }}
                                                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive cursor-pointer ml-2 shrink-0"
                                                                >
                                                                    <X size={13} />
                                                                </div>
                                                            </div>
                                                        </PopoverTrigger>
                                                        <PopoverContent align="start" className="w-80 p-4 flex flex-col gap-3">
                                                            {/* En-tête */}
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-sm font-medium">{l.agreement.title}</span>
                                                                {l.agreement.description && (
                                                                    <span className="text-xs text-muted-foreground">{l.agreement.description}</span>
                                                                )}
                                                            </div>

                                                            <Separator />

                                                            <div className="flex flex-col gap-2 text-xs">
                                                                {agrProject && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-28 shrink-0 text-muted-foreground">Projet</span>
                                                                        <span>{agrProject.title}</span>
                                                                    </div>
                                                                )}
                                                                {agrPartner && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-28 shrink-0 text-muted-foreground">Partenaire</span>
                                                                        <span
                                                                            className="px-1.5 py-0.5 rounded-full border border-border"
                                                                            style={agrPartner.color ? { backgroundColor: agrPartner.color } : {}}
                                                                        >
                                                                            {agrPartner.name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {l.agreement.signed_date && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-28 shrink-0 text-muted-foreground">Date de signature</span>
                                                                        <span>{formatDate(l.agreement.signed_date)}</span>
                                                                    </div>
                                                                )}
                                                                {l.agreement.budget > 0 && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-28 shrink-0 text-muted-foreground">Budget</span>
                                                                        <span>{l.agreement.budget.toLocaleString('fr-FR')} €</span>
                                                                    </div>
                                                                )}
                                                                {l.agreement.grant > 0 && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-28 shrink-0 text-muted-foreground">Subvention</span>
                                                                        <span>{l.agreement.grant.toLocaleString('fr-FR')} €</span>
                                                                    </div>
                                                                )}
                                                                {l.agreement.budget > 0 && l.agreement.grant > 0 && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-28 shrink-0 text-muted-foreground">Taux financ.</span>
                                                                        <span>{Math.round((l.agreement.grant / l.agreement.budget) * 100)} %</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {agreementsExtended && availableAgreements.length > 0 && (
                                        <AgreementSearchInput
                                            agreements={availableAgreements}
                                            partners={allPartners}
                                            projects={allProjects}
                                            onSelect={handleAddAgreement}
                                        />
                                    )}

                                    {agreementsExtended && availableAgreements.length === 0 && agreementLinks.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">
                                            {linkedProjectIds.length > 0
                                                ? 'Toutes les conventions des projets liés ont été rattachées'
                                                : 'Aucune convention disponible'}
                                        </p>
                                    )}
                                </section>
                                <Separator/>
                                </>
                        )}


                        

                        <section className="flex flex-col gap-3">
                            <div className='flex row items-center'>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Commentaires</p>
                                {commentsExtended ? (
                                    <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setCommentsExtended(false)}><Eye /></Button>
                                ) : (
                                    <Button variant="outline" size="xs" className="ml-2 rounded-md" onClick={() => setCommentsExtended(true)}><EyeClosed /></Button>
                                )}
                            </div>
                            {/* Nouveau commentaire */}
                            {commentsExtended && <div className="flex gap-2 mt-1">
                                <Textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Ajouter un commentaire..."
                                    className="text-sm min-h-[60px]"
                                />
                                <Button
                                    size="sm"
                                    disabled={!newComment.trim() || submittingComment}
                                    onClick={handleAddComment}
                                    className='rounded-md'
                                >
                                    <Check size={13} />
                                </Button>
                            </div>}

                            {commentsExtended && <div className="flex flex-col gap-2">
                                {comments.map(comment => {
                                    console.log('currentUser email:', currentUser?.email)
                                    console.log('comment owner email:', comment.owner.email)
                                    return (
                                    <div key={comment.id}>
                                        {editingComment === comment.id ? (
                                            <div className="flex gap-2">
                                                <Textarea
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    className="text-sm min-h-[60px]"
                                                />
                                                <div className="flex flex-col gap-1">
                                                    <Button size="sm" className='rounded-md' onClick={() => handleEditComment(comment.id)}>
                                                        <Check size={13} />
                                                    </Button>
                                                    <Button size="sm" className='rounded-md' variant="ghost" onClick={() => setEditingComment(null)}>
                                                        <X size={13} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <CommentCard
                                                comment={comment}
                                                onDelete={() => handleDeleteComment(comment.id)}
                                                onEdit={() => { setEditingComment(comment.id); setEditContent(comment.content) }}
                                                onComment={() => { setReplyingTo(comment.id); setReplyContent('') }}
                                                isOwner={currentUser?.email === comment.owner.email}
                                            />
                                        )}

                                        {replyingTo === comment.id && (
                                            <div className="ml-[60px] flex gap-2 mt-1">
                                                <Textarea
                                                    value={replyContent}
                                                    onChange={e => setReplyContent(e.target.value)}
                                                    placeholder="Votre réponse..."
                                                    className="text-sm min-h-[60px]"
                                                />
                                                <div className="flex flex-col gap-1">
                                                    <Button size="sm" className='rounded-md'  disabled={submittingComment} onClick={() => handleReply(comment.id)}>
                                                        <Check size={13} />
                                                    </Button>
                                                    <Button size="sm" className='rounded-md'  variant="ghost" onClick={() => setReplyingTo(null)}>
                                                        <X size={13} />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="ml-[60px]">
                                            {comment.replies?.map(reply => (
                                                <div key={reply.id}>
                                                    {editingComment === reply.id ? (
                                                        <div className="flex gap-2">
                                                            <Textarea
                                                                value={editContent}
                                                                onChange={e => setEditContent(e.target.value)}
                                                                className="text-sm min-h-[60px]"
                                                            />
                                                            <div className="flex flex-col gap-1">
                                                                <Button size="sm" onClick={() => handleEditComment(reply.id)}>
                                                                    <Check size={13} />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>
                                                                    <X size={13} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <CommentCard
                                                            comment={reply}
                                                            onDelete={() => handleDeleteComment(reply.id)}
                                                            onEdit={() => { setEditingComment(reply.id); setEditContent(reply.content) }}
                                                            onComment={() => { setReplyingTo(comment.id); setReplyContent('') }}
                                                            isOwner={currentUser?.email === reply.owner.email}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    )
                                }
                                )}
                            </div>}
                        </section>

                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

// --- Composant principal carte ---

export default function ActionCard(props: ActionCardData & {
    onDeleted?: (id: number) => void
    onUpdated?: (patch: Partial<ActionCardData>) => void
    selectOn?: boolean
    selected?: boolean
    onToggle?: () => void
    onSelectMultiple?: () => void
    onSelectAll?: () => void
    selectedCards?: ActionCardData[]
}) {
    const { onDeleted, onUpdated: onUpdatedProp, selectOn, selected, onToggle, onSelectMultiple: _onSelectMultiple, onSelectAll, selectedCards = [] } = props
    const [open, setOpen]         = useState(false)
    const [data, setData]         = useState<ActionCardData>(props)
    const [copied, setCopied]     = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => { setData(props) }, [props])

    const { title, status, category, owner, start_date, end_date } = data
    const statusColor = STATUS_COLORS[data.status.label] ?? '#f3f4f6'

    function copyTitle() {
        navigator.clipboard.writeText(data.title)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function copyTitles() {
        navigator.clipboard.writeText(selectedCards.map(c => c.title).join('\n'))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteActionCard(data.id)
            onDeleted?.(data.id)
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    async function handleDeleteMultiple() {
        setDeleting(true)
        try {
            await Promise.all(selectedCards.map(c => deleteActionCard(c.id)))
            selectedCards.forEach(c => onDeleted?.(c.id))
            setConfirming(false)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
        <ContextMenu onOpenChange={open => { if (!open) setConfirming(false) }}>
            <ContextMenuTrigger>
            <Card
                className={`cursor-pointer transition-all duration-200 focus:outline-none ${selected ? 'ring-2 ring-foreground shadow-none' : 'hover:shadow-md'}`}
                onClick={selectOn ? onToggle : () => setOpen(true)}
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
            </ContextMenuTrigger>

            <ContextMenuContent className="w-52">
                {selectedCards.length > 1 ? (
                    <>  <ContextMenuItem onClick={onSelectAll}>
                    <ListChecks size={13} className="mr-2" /> Tout sélectionner
                </ContextMenuItem>
                <Separator />
                        <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyTitles}>
                            {copied ? <CheckIcon size={13} className="mr-2" /> : <Copy size={13} className="mr-2" />}
                            {copied ? 'Copié !' : `Copier les titres (${selectedCards.length})`}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => exportToCsv(
                            'cartes.csv',
                            ['Titre', 'Statut', 'Catégorie', 'Responsable', 'Date début', 'Date fin'],
                            selectedCards.map(c => [
                                c.title, c.status.label,
                                c.category.parent ? `${c.category.parent.title} › ${c.category.title}` : c.category.title,
                                c.owner ? `${c.owner.first_name} ${c.owner.last_name}` : '',
                                c.start_date ?? '', c.end_date ?? '',
                            ])
                        )}>
                            <FileDown size={13} className="mr-2" /> Exporter en CSV
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        {confirming ? (
                            <ContextMenuItem onSelect={e => e.preventDefault()} className="flex gap-2 p-1">
                                <Button size="sm" variant="ghost" className="h-6 text-xs flex-1 rounded-md" onClick={() => setConfirming(false)}>Annuler</Button>
                                <Button size="sm" variant="destructive" className="h-6 text-xs flex-1 rounded-md" onClick={handleDeleteMultiple} disabled={deleting}>
                                    {deleting ? '...' : 'Confirmer'}
                                </Button>
                            </ContextMenuItem>
                        ) : (
                            <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()} onClick={() => setConfirming(true)}>
                                <Trash size={13} className="mr-2" /> Supprimer ({selectedCards.length})
                            </ContextMenuItem>
                        )}
                    </>
                ) : (
                    <>
                        <ContextMenuItem onClick={() => setOpen(true)}>
                            <Pencil size={13} className="mr-2" /> Éditer
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyTitle}>
                            {copied ? <CheckIcon size={13} className="mr-2" /> : <Copy size={13} className="mr-2" />}
                            {copied ? 'Copié !' : 'Copier le titre'}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        {confirming ? (
                            <ContextMenuItem onSelect={e => e.preventDefault()} className="flex gap-2 p-1">
                                <Button size="sm" variant="ghost" className="h-6 text-xs flex-1 rounded-md" onClick={() => setConfirming(false)}>Annuler</Button>
                                <Button size="sm" variant="destructive" className="h-6 text-xs flex-1 rounded-md" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? '...' : 'Confirmer'}
                                </Button>
                            </ContextMenuItem>
                        ) : (
                            <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()} onClick={() => setConfirming(true)}>
                                <Trash size={13} className="mr-2" /> Supprimer
                            </ContextMenuItem>
                        )}
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>

        <ActionCardDetailSheet
            card={data}
            open={open}
            onClose={() => setOpen(false)}
            onUpdated={patch => {
                setData(prev => ({ ...prev, ...patch }))
                onUpdatedProp?.(patch)
            }}
            onDeleted={onDeleted}
        />
        </>
    )
}
