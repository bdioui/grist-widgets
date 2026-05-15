import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import {
    getStatuses, getCategories, getMembers, getProjects, getAxes,
    createActionCardFull, type ActionCardCreateForm,
} from '@/lib/api'
import type { Status, Category, Member, Project, Axis } from '@/lib/types'
import type { ActionCardData } from './ActionCard'

type Props = {
    open: boolean
    onClose: () => void
    onCreated: (card: ActionCardData) => void
}

const ROLES = ['Responsable', 'Contributeur', 'Observateur']

const COLOR_PALETTE = [
    '#dbeafe', '#d1fae5', '#fce7f3', '#ede9fe',
    '#ffedd5', '#fef9c3', '#e0f2fe', '#fef2f2',
]

const EMPTY_FORM: ActionCardCreateForm = {
    title: '', description: '', color: '#dbeafe',
    start_date: '', end_date: '',
    status_id: 0, category_id: 0, axis_id: null,
    owner_id: 0,
    members: [],
    project_id: null,
    todo_title: '', todo_items: [],
}

export default function ActionCardSheet({ open, onClose, onCreated }: Props) {
    const [form, setForm]       = useState<ActionCardCreateForm>(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    // Données de référence
    const [statuses,   setStatuses]   = useState<Status[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [members,    setMembers]    = useState<Member[]>([])
    const [projects,   setProjects]   = useState<Project[]>([])
    const [axes,       setAxes]       = useState<Axis[]>([])

    // État pour l'ajout de participants
    const [memberToAdd, setMemberToAdd] = useState<string>('')
    const [roleToAdd,   setRoleToAdd]   = useState<string>(ROLES[1])

    // État pour l'ajout de tâches
    const [todoInput, setTodoInput] = useState('')

    useEffect(() => {
        if (!open) return
        Promise.all([getStatuses(), getCategories(), getMembers(), getProjects(), getAxes()])
            .then(([s, c, m, p, a]) => {
                setStatuses(s.filter(s => s.context === 'action_card'))
                setCategories(c)
                setMembers(m)
                setProjects(p)
                setAxes(a)
                setForm(f => ({
                    ...f,
                    status_id:   s.find(s => s.context === 'action_card')?.id ?? 0,
                    category_id: c[0]?.id ?? 0,
                    owner_id:    m[0]?.id ?? 0,
                }))
            })
    }, [open])

    function set<K extends keyof ActionCardCreateForm>(key: K, value: ActionCardCreateForm[K]) {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    function addMember() {
        const id = Number(memberToAdd)
        if (!id || form.members.some(m => m.member_id === id)) return
        set('members', [...form.members, { member_id: id, role: roleToAdd }])
        setMemberToAdd('')
    }

    function removeMember(memberId: number) {
        set('members', form.members.filter(m => m.member_id !== memberId))
    }

    function addTodoItem() {
        if (!todoInput.trim()) return
        set('todo_items', [...form.todo_items, todoInput.trim()])
        setTodoInput('')
    }

    function removeTodoItem(i: number) {
        set('todo_items', form.todo_items.filter((_, idx) => idx !== i))
    }

    async function handleSubmit() {
        if (!form.title.trim() || !form.category_id || !form.status_id || !form.owner_id) {
            setError('Titre, catégorie, statut et responsable sont obligatoires.')
            return
        }
        setError(null)
        setSubmitting(true)
        try {
            const full = await createActionCardFull(form)
            onCreated({
                id:          full.id,
                title:       full.title,
                description: full.description || undefined,
                color:       full.color || undefined,
                status:      full.status,
                category: {
                    id:     full.category.id,
                    title:  full.category.title,
                    parent: full.category.parent
                        ? { id: full.category.parent.id, title: full.category.parent.title }
                        : undefined,
                },
                owner: {
                    id:         full.owner.id,
                    first_name: full.owner.first_name,
                    last_name:  full.owner.last_name,
                    position:   full.owner.position,
                },
                start_date: full.start_date || undefined,
                end_date:   full.end_date   || undefined,
            })
            setForm(EMPTY_FORM)
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue')
        } finally {
            setSubmitting(false)
        }
    }

    // Catégories parentes pour les groupes
    const parentIds = new Set(categories.filter(c => c.parent_category_id).map(c => c.parent_category_id!))
    const categoryGroups = categories.filter(c => parentIds.has(c.id) || !c.parent_category_id)

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
            <SheetContent side="right" className="!w-[580px] overflow-y-auto flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Nouvelle action card</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">

                    {/* Général */}
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Général</p>

                        <div className="flex flex-col gap-1.5">
                            <Label>Titre *</Label>
                            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titre de l'action" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description..." rows={3} />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Date de début</Label>
                                <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Date de fin</Label>
                                <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Couleur</Label>
                            <div className="flex gap-2">
                                {COLOR_PALETTE.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => set('color', c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Classification */}
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Classification</p>

                        <div className="flex flex-col gap-1.5">
                            <Label>Statut *</Label>
                            <Select value={String(form.status_id)} onValueChange={v => set('status_id', Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                                <SelectContent>
                                    {statuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Catégorie *</Label>
                            <Select value={String(form.category_id)} onValueChange={v => set('category_id', Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                                <SelectContent>
                                    {categoryGroups.map(parent => {
                                        const children = categories.filter(c => c.parent_category_id === parent.id)
                                        return children.length > 0 ? (
                                            <div key={parent.id}>
                                                <p className="px-2 py-1 text-xs text-muted-foreground">{parent.title}</p>
                                                {children.map(c => <SelectItem key={c.id} value={String(c.id)} className="pl-5">{c.title}</SelectItem>)}
                                            </div>
                                        ) : (
                                            <SelectItem key={parent.id} value={String(parent.id)}>{parent.title}</SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Axe</Label>
                            <Select value={form.axis_id ? String(form.axis_id) : 'none'} onValueChange={v => set('axis_id', v === 'none' ? null : Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Axe (optionnel)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {axes.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </section>

                    <Separator />

                    {/* Personnes */}
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Personnes</p>

                        <div className="flex flex-col gap-1.5">
                            <Label>Responsable *</Label>
                            <Select value={String(form.owner_id)} onValueChange={v => set('owner_id', Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Responsable" /></SelectTrigger>
                                <SelectContent>
                                    {members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.first_name} {m.last_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Participants</Label>
                            <div className="flex gap-2">
                                <Select value={memberToAdd} onValueChange={setMemberToAdd}>
                                    <SelectTrigger className="flex-1"><SelectValue placeholder="Membre" /></SelectTrigger>
                                    <SelectContent>
                                        {members
                                            .filter(m => m.id !== form.owner_id && !form.members.some(fm => fm.member_id === m.id))
                                            .map(m => <SelectItem key={m.id} value={String(m.id)}>{m.first_name} {m.last_name}</SelectItem>)
                                        }
                                    </SelectContent>
                                </Select>
                                <Select value={roleToAdd} onValueChange={setRoleToAdd}>
                                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" onClick={addMember} disabled={!memberToAdd}>
                                    <Plus size={14} />
                                </Button>
                            </div>
                            {form.members.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {form.members.map(fm => {
                                        const m = members.find(m => m.id === fm.member_id)
                                        return m ? (
                                            <Badge key={fm.member_id} variant="secondary" className="gap-1.5">
                                                {m.first_name} {m.last_name} · {fm.role}
                                                <button onClick={() => removeMember(fm.member_id)}><X size={10} /></button>
                                            </Badge>
                                        ) : null
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    <Separator />

                    {/* Projet */}
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projet</p>

                        <div className="flex flex-col gap-1.5">
                            <Label>Lier à un projet</Label>
                            <Select value={form.project_id ? String(form.project_id) : 'none'} onValueChange={v => set('project_id', v === 'none' ? null : Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Projet (optionnel)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </section>

                    <Separator />

                    {/* To-do */}
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To-do list</p>

                        <div className="flex flex-col gap-1.5">
                            <Label>Titre de la liste</Label>
                            <Input value={form.todo_title} onChange={e => set('todo_title', e.target.value)} placeholder="ex: Préparation logistique" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Tâches</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={todoInput}
                                    onChange={e => setTodoInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addTodoItem()}
                                    placeholder="Ajouter une tâche..."
                                />
                                <Button variant="outline" size="icon" onClick={addTodoItem} disabled={!todoInput.trim()}>
                                    <Plus size={14} />
                                </Button>
                            </div>
                            {form.todo_items.length > 0 && (
                                <ul className="flex flex-col gap-1 mt-1">
                                    {form.todo_items.map((item, i) => (
                                        <li key={i} className="flex items-center justify-between text-sm px-2 py-1 rounded bg-muted">
                                            <span>{item}</span>
                                            <button onClick={() => removeTodoItem(i)} className="text-muted-foreground hover:text-foreground">
                                                <X size={12} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>

                <SheetFooter className="px-6 py-4 border-t flex flex-col gap-2">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose} disabled={submitting}>Annuler</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Création...' : 'Créer'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
