import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
    DropdownMenuCheckboxItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, SlidersHorizontal, Pencil, Trash2, Check, X, ListChecks, Copy } from 'lucide-react'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import {
    getProjectCalls, getProjects, getAxes, getStatuses, getPartners, getFinancialAgreements,
    addProjectCall, updateProjectCall, deleteProjectCall,
    addProject, updateProject, deleteProject,
    getAgreementsByProject, addAgreement, updateAgreement, deleteAgreement,
} from '@/lib/api'
import type { ProjectCall, Project, FinancialAgreement, Axis, Status, Partner } from '@/lib/types'

// --- Couleurs de statut ---

const PROJECT_STATUS_COLORS: Record<string, string> = {
    'En cours':   '#d1fae5',
    'Terminé':    '#f3f4f6',
    'Suspendu':   '#fef9c3',
    'En attente': '#dbeafe',
}

const AGREEMENT_STATUS_COLORS: Record<string, string> = {
    'En préparation': '#dbeafe',
    'Active':         '#d1fae5',
    'Soldée':         '#f3f4f6',
    'Annulée':        '#fee2e2',
}

// --- Types enrichis ---

type ProjectCallFull = ProjectCall & { axis: Axis }
type ProjectFull     = Project     & { projectCall: ProjectCallFull }
type AgreementFull   = FinancialAgreement & { partner: Partner }

// --- Helpers ---

function fmt(n: number) {
    return n.toLocaleString('fr-FR') + ' €'
}

function formatDate(d?: string) {
    if (!d) return null
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function financingRate(budget: number, grant: number) {
    if (!budget) return null
    return Math.round((grant / budget) * 100)
}

// --- ProjectCard ---

type ProjectCardProps = {
    project: ProjectFull
    agreements: AgreementFull[]
    statuses: Status[]
    onClick: () => void
    selectOn: boolean
    selected: boolean
    onToggle: () => void
    onDelete: (id: number) => void
    onEdit: () => void
    selectedProjects: ProjectFull[]
    onSelectMultiple: () => void
}

function ProjectCard({ project, agreements, statuses, onClick, selectOn, selected, onToggle, onDelete, onEdit, selectedProjects, onSelectMultiple }: ProjectCardProps) {
    const rate    = financingRate(project.budget, project.grant)
    const partners = [...new Map(agreements.map(a => [a.partner_id, a.partner])).values()]
    const status  = statuses.find(s => s.id === project.status_id)

    const [copied,      setCopied]      = useState(false)
    const [confirming,  setConfirming]  = useState(false)
    const [deleting,    setDeleting]    = useState(false)

    function copyTitle() {
        navigator.clipboard.writeText(project.title)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function copyTitles() {
        navigator.clipboard.writeText(selectedProjects.map(p => p.title).join('\n'))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteProject(project.id)
            onDelete(project.id)
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    async function handleDeleteMultiple() {
        setDeleting(true)
        try {
            await Promise.all(selectedProjects.map(p => deleteProject(p.id)))
            selectedProjects.forEach(p => onDelete(p.id))
            setConfirming(false)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <ContextMenu onOpenChange={open => { if (!open) setConfirming(false) }}>
            <ContextMenuTrigger>
        <div
            onClick={selectOn ? onToggle : onClick}
            className={`bg-white border border-border rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 ${selected ? 'ring-2 ring-foreground shadow-none' : 'hover:shadow-md'}`}
        >
            {/* Titre + taux */}
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-snug">{project.title}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                    {status && (
                        <Badge variant="secondary" className="text-xs rounded-full text-black"
                            style={{ backgroundColor: PROJECT_STATUS_COLORS[status.label] ?? '#f3f4f6' }}>
                            {status.label}
                        </Badge>
                    )}
                    {rate !== null && (
                        <Badge variant="secondary" className="text-xs rounded-full">
                            {rate} %
                        </Badge>
                    )}
                </div>
            </div>

            {/* Budget / subvention */}
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {project.budget > 0 && (
                    <div className="flex justify-between">
                        <span>Budget</span>
                        <span className="font-medium text-foreground">{fmt(project.budget)}</span>
                    </div>
                )}
                {project.grant > 0 && (
                    <div className="flex justify-between">
                        <span>Subvention</span>
                        <span className="font-medium text-foreground">{fmt(project.grant)}</span>
                    </div>
                )}
            </div>

            {/* Conventions + badges partenaires */}
            {agreements.length > 0 && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                    <div className="flex items-center gap-1 min-w-0 flex-wrap">
                        {partners.slice(0, 2).map(p => (
                            <span
                                key={p.id}
                                className="text-xs px-1.5 py-0.5 rounded-full border border-border shrink-0 truncate max-w-[90px]"
                                style={p.color ? { backgroundColor: p.color } : {}}
                            >
                                {p.name}
                            </span>
                        ))}
                        {partners.length > 2 && (
                            <span className="text-xs text-muted-foreground shrink-0">
                                +{partners.length - 2} de plus
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {agreements.length} conv.
                    </span>
                </div>
            )}
        </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                {selectedProjects.length > 1 ? (
                    <>
                        <ContextMenuItem onClick={copyTitles}>
                            <Copy size={13} className="mr-2" />
                            {copied ? 'Copié !' : `Copier les titres (${selectedProjects.length})`}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        {confirming ? (
                            <div className="px-2 py-1.5 flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Supprimer {selectedProjects.length} projets ?</span>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 text-xs flex-1 rounded-md" onClick={() => setConfirming(false)}>Annuler</Button>
                                    <Button size="sm" variant="destructive" className="h-6 text-xs flex-1 rounded-md" onClick={handleDeleteMultiple} disabled={deleting}>Confirmer</Button>
                                </div>
                            </div>
                        ) : (
                            <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirming(true)}>
                                <Trash2 size={13} className="mr-2" /> Supprimer ({selectedProjects.length})
                            </ContextMenuItem>
                        )}
                    </>
                ) : (
                    <>
                        <ContextMenuItem onClick={copyTitle}>
                            <Copy size={13} className="mr-2" />
                            {copied ? 'Copié !' : 'Copier le titre'}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={onEdit}>
                            <Pencil size={13} className="mr-2" /> Modifier
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        {confirming ? (
                            <div className="px-2 py-1.5 flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Supprimer ce projet ?</span>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 text-xs flex-1 rounded-md" onClick={() => setConfirming(false)}>Annuler</Button>
                                    <Button size="sm" variant="destructive" className="h-6 text-xs flex-1 rounded-md" onClick={handleDelete} disabled={deleting}>Confirmer</Button>
                                </div>
                            </div>
                        ) : (
                            <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirming(true)}>
                                <Trash2 size={13} className="mr-2" /> Supprimer
                            </ContextMenuItem>
                        )}
                    </>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onSelectMultiple}>
                    <ListChecks size={13} className="mr-2" /> Sélection multiple
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

// --- Sheet Appel à projet ---

type ProjectCallSheetProps = {
    open: boolean
    onClose: () => void
    onSaved: (pc: ProjectCall) => void
    onDeleted?: (id: number) => void
    axes: Axis[]
    statuses: Status[]
    editCall?: ProjectCall
}

function ProjectCallSheet({ open, onClose, onSaved, onDeleted, axes, statuses, editCall }: ProjectCallSheetProps) {
    const [title,       setTitle]       = useState('')
    const [description, setDescription] = useState('')
    const [axisId,      setAxisId]      = useState<number>(0)
    const [statusId,    setStatusId]    = useState<number>(0)
    const [startDate,   setStartDate]   = useState('')
    const [endDate,     setEndDate]     = useState('')
    const [submitting,  setSubmitting]  = useState(false)
    const [deleting,    setDeleting]    = useState(false)
    const [confirming,  setConfirming]  = useState(false)
    const [error,       setError]       = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        if (editCall) {
            setTitle(editCall.title)
            setDescription(editCall.description)
            setAxisId(editCall.axis_id)
            setStatusId(editCall.status_id)
            setStartDate(editCall.start_date)
            setEndDate(editCall.end_date)
        } else {
            setTitle(''); setDescription(''); setAxisId(axes[0]?.id ?? 0)
            setStatusId(statuses[0]?.id ?? 0); setStartDate(''); setEndDate('')
        }
        setError(null)
        setConfirming(false)
    }, [open])

    async function handleSubmit() {
        if (!title.trim() || !axisId) { setError('Titre et axe sont obligatoires.'); return }
        setSubmitting(true)
        try {
            const fields = { title, description, axis_id: axisId, status_id: statusId, start_date: startDate, end_date: endDate }
            if (editCall) {
                await updateProjectCall(editCall.id, fields)
                onSaved({ ...editCall, ...fields })
            } else {
                const pc = await addProjectCall(fields)
                onSaved(pc)
            }
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDeleteCall() {
        if (!editCall) return
        setDeleting(true)
        try {
            await deleteProjectCall(editCall.id)
            onDeleted?.(editCall.id)
            onClose()
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    const aapStatuses = statuses.filter(s => s.context === 'project_call')

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) { setConfirming(false); onClose() } }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[440px] flex flex-col gap-0 p-0 rounded-md">
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <SheetTitle>{editCall ? 'Modifier l\'appel à projet' : 'Nouvel appel à projet'}</SheetTitle>
                    {editCall && onDeleted && (
                        confirming ? (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-destructive">Supprimer ?</span>
                                <Button variant="destructive" size="sm" className="h-7 ml-1" onClick={handleDeleteCall} disabled={deleting}>
                                    {deleting ? '...' : 'Confirmer'}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7" onClick={() => setConfirming(false)}>Annuler</Button>
                            </div>
                        ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => setConfirming(true)}>
                                <Trash2 size={14} />
                            </Button>
                        )
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Titre *</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de l'appel à projet" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Description</Label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Description..." />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Axe *</Label>
                        <Select value={axisId ? String(axisId) : ''} onValueChange={v => setAxisId(Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Choisir un axe" /></SelectTrigger>
                            <SelectContent>
                                {axes.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {aapStatuses.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <Label>Statut</Label>
                            <Select value={statusId ? String(statusId) : ''} onValueChange={v => setStatusId(Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                                <SelectContent>
                                    {aapStatuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label>Date de début</Label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label>Date de fin</Label>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t flex flex-col gap-2">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose} disabled={submitting} className="rounded-md">Annuler</Button>
                        <Button onClick={handleSubmit} disabled={submitting} className="rounded-md">
                            {submitting ? 'Enregistrement...' : editCall ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

// --- Sheet Nouveau projet ---

type ProjectSheetProps = {
    open: boolean
    onClose: () => void
    onSaved: (p: Project) => void
    projectCalls: ProjectCall[]
    statuses: Status[]
    defaultCallId?: number
}

function ProjectSheet({ open, onClose, onSaved, projectCalls, statuses, defaultCallId }: ProjectSheetProps) {
    const projectStatuses = statuses.filter(s => s.context === 'project')

    const [title,       setTitle]       = useState('')
    const [description, setDescription] = useState('')
    const [budget,      setBudget]      = useState('')
    const [grant,       setGrant]       = useState('')
    const [callId,      setCallId]      = useState<number>(0)
    const [statusId,    setStatusId]    = useState<number>(0)
    const [submitting,  setSubmitting]  = useState(false)
    const [error,       setError]       = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        setTitle(''); setDescription(''); setBudget(''); setGrant('')
        setCallId(defaultCallId ?? projectCalls[0]?.id ?? 0)
        setStatusId(projectStatuses[0]?.id ?? 0)
        setError(null)
    }, [open])

    async function handleSubmit() {
        if (!title.trim() || !callId) { setError('Titre et appel à projet sont obligatoires.'); return }
        setSubmitting(true)
        try {
            const p = await addProject({ title, description, budget: Number(budget) || 0, grant: Number(grant) || 0, project_call_id: callId, status_id: statusId })
            onSaved(p)
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[440px] flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Nouveau projet</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Titre *</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du projet" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Description</Label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Description du projet..." />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label>Appel à projet *</Label>
                            <Select value={callId ? String(callId) : ''} onValueChange={v => setCallId(Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Choisir un AAP" /></SelectTrigger>
                                <SelectContent>
                                    {projectCalls.map(pc => <SelectItem key={pc.id} value={String(pc.id)}>{pc.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {projectStatuses.length > 0 && (
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Statut</Label>
                                <Select value={statusId ? String(statusId) : ''} onValueChange={v => setStatusId(Number(v))}>
                                    <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                                    <SelectContent>
                                        {projectStatuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label>Budget total (€)</Label>
                            <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" />
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label>Subvention (€)</Label>
                            <Input type="number" value={grant} onChange={e => setGrant(e.target.value)} placeholder="0" />
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t flex flex-col gap-2">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose} disabled={submitting} className="rounded-md">Annuler</Button>
                        <Button onClick={handleSubmit} disabled={submitting} className="rounded-md">
                            {submitting ? 'Création...' : 'Créer'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

// --- Ligne convention ---

type AgreementRowProps = {
    agreement: AgreementFull
    statuses: Status[]
    onEdit: (a: AgreementFull) => void
    onDelete: (id: number) => void
}

function AgreementRow({ agreement: a, statuses, onEdit, onDelete }: AgreementRowProps) {
    const rate   = financingRate(a.budget, a.grant)
    const status = statuses.find(s => s.id === a.status_id)
    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/40 group cursor-pointer hover:bg-muted/70 transition-colors">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{a.title}</span>
                            {status && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full border border-border shrink-0 text-black"
                                    style={{ backgroundColor: AGREEMENT_STATUS_COLORS[status.label] ?? '#f3f4f6' }}>
                                    {status.label}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span
                                className="px-1.5 py-0.5 rounded-full border border-border shrink-0"
                                style={a.partner.color ? { backgroundColor: a.partner.color } : {}}
                            >
                                {a.partner.name}
                            </span>
                            {a.budget > 0 && <span>{fmt(a.budget)}</span>}
                            {rate !== null && <span className="font-medium text-foreground">{rate} %</span>}
                            {a.signed_date && <span>{formatDate(a.signed_date)}</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                        <div
                            className="h-7 w-7 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground"
                            onClick={e => { e.stopPropagation(); onEdit(a) }}
                        >
                            <Pencil size={13} />
                        </div>
                        <div
                            className="h-7 w-7 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-destructive"
                            onClick={e => { e.stopPropagation(); onDelete(a.id) }}
                        >
                            <Trash2 size={13} />
                        </div>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-4 flex flex-col gap-3">
                {/* En-tête */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{a.title}</span>
                    {a.description && (
                        <span className="text-xs text-muted-foreground leading-relaxed">{a.description}</span>
                    )}
                </div>

                <Separator />

                {/* Détails */}
                <div className="flex flex-col gap-2 text-xs">
                    {status && (
                        <div className="flex items-center gap-2">
                            <span className="w-28 shrink-0 text-muted-foreground">Statut</span>
                            <span className="px-1.5 py-0.5 rounded-full border border-border text-black"
                                style={{ backgroundColor: AGREEMENT_STATUS_COLORS[status.label] ?? '#f3f4f6' }}>
                                {status.label}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="w-28 shrink-0 text-muted-foreground">Partenaire</span>
                        <span
                            className="px-1.5 py-0.5 rounded-full border border-border"
                            style={a.partner.color ? { backgroundColor: a.partner.color } : {}}
                        >
                            {a.partner.name}
                        </span>
                    </div>
                    {a.budget > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="w-28 shrink-0 text-muted-foreground">Budget</span>
                            <span>{fmt(a.budget)}</span>
                        </div>
                    )}
                    {a.grant > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="w-28 shrink-0 text-muted-foreground">Subvention</span>
                            <span>{fmt(a.grant)}</span>
                        </div>
                    )}
                    {rate !== null && (
                        <div className="flex items-center gap-2">
                            <span className="w-28 shrink-0 text-muted-foreground">Taux financ.</span>
                            <Badge variant="secondary" className="rounded-full text-xs">{rate} %</Badge>
                        </div>
                    )}
                    {a.signed_date && (
                        <div className="flex items-center gap-2">
                            <span className="w-28 shrink-0 text-muted-foreground">Signé le</span>
                            <span>{formatDate(a.signed_date)}</span>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

// --- Formulaire convention inline ---

type AgreementFormProps = {
    partners: Partner[]
    statuses: Status[]
    projectId: number
    initial?: AgreementFull
    onSaved: (a: AgreementFull) => void
    onCancel: () => void
}

function AgreementForm({ partners, statuses, projectId, initial, onSaved, onCancel }: AgreementFormProps) {
    const agreementStatuses = statuses.filter(s => s.context === 'financial_agreement')
    const defaultStatusId   = agreementStatuses[0]?.id ?? 14

    const [title,      setTitle]      = useState(initial?.title      ?? '')
    const [description,setDescription]= useState(initial?.description ?? '')
    const [partnerId,  setPartnerId]  = useState<number>(initial?.partner_id ?? partners[0]?.id ?? 0)
    const [statusId,   setStatusId]   = useState<number>(initial?.status_id ?? defaultStatusId)
    const [budget,     setBudget]     = useState(initial?.budget ? String(initial.budget) : '')
    const [grant,      setGrant]      = useState(initial?.grant  ? String(initial.grant)  : '')
    const [signedDate, setSignedDate] = useState(initial?.signed_date ?? '')
    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState<string | null>(null)

    async function handleSubmit() {
        if (!title.trim() || !partnerId) { setError('Titre et partenaire sont obligatoires.'); return }
        setSubmitting(true)
        try {
            const fields = {
                title, description, partner_id: partnerId, project_id: projectId,
                status_id: statusId,
                budget: Number(budget) || 0, grant: Number(grant) || 0, signed_date: signedDate,
            }
            const partner = partners.find(p => p.id === partnerId)!
            if (initial) {
                await updateAgreement(initial.id, fields)
                onSaved({ ...initial, ...fields, partner })
            } else {
                const a = await addAgreement(fields)
                onSaved({ ...a, partner })
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Titre *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de la convention" className="h-8 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Description..." className="text-xs" />
            </div>
            <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                    <Label className="text-xs">Partenaire *</Label>
                    <Select value={partnerId ? String(partnerId) : ''} onValueChange={v => setPartnerId(Number(v))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Partenaire" /></SelectTrigger>
                        <SelectContent>
                            {partners.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                    <Label className="text-xs">Statut</Label>
                    <Select value={statusId ? String(statusId) : ''} onValueChange={v => setStatusId(Number(v))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
                        <SelectContent>
                            {agreementStatuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                    <Label className="text-xs">Budget (€)</Label>
                    <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                    <Label className="text-xs">Subvention (€)</Label>
                    <Input type="number" value={grant} onChange={e => setGrant(e.target.value)} placeholder="0" className="h-8 text-xs" />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Date de signature</Label>
                <Input type="date" value={signedDate} onChange={e => setSignedDate(e.target.value)} className="h-8 text-xs" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting} className="rounded-md">Annuler</Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting} className="rounded-md">
                    <Check size={13} className="mr-1" />
                    {submitting ? 'Enregistrement...' : initial ? 'Enregistrer' : 'Ajouter'}
                </Button>
            </div>
        </div>
    )
}

// --- Sheet détail projet ---

type ProjectDetailSheetProps = {
    project: ProjectFull | null
    open: boolean
    onClose: () => void
    onUpdated: (p: Project) => void
    onDeleted: (id: number) => void
    onAgreementAdded: (a: FinancialAgreement) => void
    onAgreementDeleted: (id: number) => void
    partners: Partner[]
    projectCalls: ProjectCall[]
    axes: Axis[]
    statuses: Status[]
}

function ProjectDetailSheet({ project, open, onClose, onUpdated, onDeleted, onAgreementAdded, onAgreementDeleted, partners, projectCalls, statuses }: ProjectDetailSheetProps) {
    const [agreements,   setAgreements]   = useState<AgreementFull[]>([])
    const [loading,      setLoading]      = useState(false)
    const [editing,      setEditing]      = useState(false)
    const [draft,        setDraft]        = useState<Project | null>(null)
    const [showAddForm,  setShowAddForm]  = useState(false)
    const [editingAgreement, setEditingAgreement] = useState<AgreementFull | null>(null)
    const [saving,       setSaving]       = useState(false)
    const [confirming,   setConfirming]   = useState(false)
    const [deleting,     setDeleting]     = useState(false)

    useEffect(() => {
        if (!open || !project) return
        setDraft({ ...project })
        setEditing(false)
        setShowAddForm(false)
        setEditingAgreement(null)
        setConfirming(false)
        setLoading(true)
        getAgreementsByProject(project.id)
            .then(setAgreements)
            .finally(() => setLoading(false))
    }, [open, project?.id])

    async function saveProject() {
        if (!draft || !project) return
        setSaving(true)
        try {
            await updateProject(project.id, { title: draft.title, description: draft.description, budget: draft.budget, grant: draft.grant, project_call_id: draft.project_call_id, status_id: draft.status_id })
            onUpdated(draft)
            setEditing(false)
        } finally {
            setSaving(false)
        }
    }

    function handleAgreementSaved(a: AgreementFull) {
        if (editingAgreement) {
            setAgreements(prev => prev.map(x => x.id === a.id ? a : x))
            setEditingAgreement(null)
        } else {
            setAgreements(prev => [...prev, a])
            setShowAddForm(false)
            onAgreementAdded(a)
        }
    }

    async function handleDeleteAgreement(id: number) {
        await deleteAgreement(id)
        setAgreements(prev => prev.filter(a => a.id !== id))
        onAgreementDeleted(id)
    }

    async function handleDeleteProject() {
        if (!project) return
        setDeleting(true)
        try {
            await deleteProject(project.id)
            onDeleted(project.id)
            onClose()
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    if (!project) return null

    const totalBudget = agreements.reduce((s, a) => s + a.budget, 0)
    const totalGrant  = agreements.reduce((s, a) => s + a.grant, 0)

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[520px] flex flex-col gap-0 p-0 overflow-y-auto">
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <SheetTitle className="flex-1 min-w-0 truncate">
                        {editing && draft ? (
                            <Input
                                value={draft.title}
                                onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
                                className="h-8 text-sm font-semibold"
                            />
                        ) : project.title}
                    </SheetTitle>
                    <div className="flex items-center gap-2 shrink-0">
                        {confirming ? (
                            <>
                                <span className="text-xs text-destructive">Supprimer ?</span>
                                <Button size="sm" variant="destructive" className="rounded-md h-7" onClick={handleDeleteProject} disabled={deleting}>
                                    {deleting ? '...' : 'Confirmer'}
                                </Button>
                                <Button size="sm" variant="ghost" className="rounded-md h-7" onClick={() => setConfirming(false)}>Annuler</Button>
                            </>
                        ) : editing ? (
                            <>
                                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft({ ...project }) }} className="rounded-md">
                                    <X size={13} className="mr-1" />Annuler
                                </Button>
                                <Button size="sm" onClick={saveProject} disabled={saving} className="rounded-md">
                                    <Check size={13} className="mr-1" />{saving ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button size="sm" variant="outline" className="rounded-md" onClick={() => setEditing(true)}>
                                    <Pencil size={13} className="mr-1" />Modifier
                                </Button>
                                <Button size="sm" variant="ghost" className="rounded-md text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
                                    <Trash2 size={13} />
                                </Button>
                            </>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

                    {/* Infos projet */}
                    <section className="flex flex-col gap-3">
                        {editing && draft ? (
                            <>
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label>Statut</Label>
                                        <Select value={String(draft.status_id)} onValueChange={v => setDraft(d => d ? { ...d, status_id: Number(v) } : d)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {statuses.filter(s => s.context === 'project').map(s => (
                                                    <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label>Appel à projet</Label>
                                        <Select value={String(draft.project_call_id)} onValueChange={v => setDraft(d => d ? { ...d, project_call_id: Number(v) } : d)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {projectCalls.map(pc => <SelectItem key={pc.id} value={String(pc.id)}>{pc.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Description</Label>
                                    <Textarea value={draft.description ?? ''} onChange={e => setDraft(d => d ? { ...d, description: e.target.value } : d)} rows={3} placeholder="Description du projet..." />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label>Budget total (€)</Label>
                                        <Input type="number" value={draft.budget} onChange={e => setDraft(d => d ? { ...d, budget: Number(e.target.value) } : d)} />
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label>Subvention (€)</Label>
                                        <Input type="number" value={draft.grant} onChange={e => setDraft(d => d ? { ...d, grant: Number(e.target.value) } : d)} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3 text-sm">
                                {(() => {
                                    const s = statuses.find(s => s.id === project.status_id)
                                    return s ? (
                                        <div className="flex items-center gap-2">
                                            <span className="w-32 shrink-0 text-xs text-muted-foreground">Statut</span>
                                            <Badge variant="secondary" className="rounded-full text-xs text-black"
                                                style={{ backgroundColor: PROJECT_STATUS_COLORS[s.label] ?? '#f3f4f6' }}>
                                                {s.label}
                                            </Badge>
                                        </div>
                                    ) : null
                                })()}
                                <div className="flex items-center gap-2">
                                    <span className="w-32 shrink-0 text-xs text-muted-foreground">Appel à projet</span>
                                    <span>{project.projectCall.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-32 shrink-0 text-xs text-muted-foreground">Axe</span>
                                    <span>{project.projectCall.axis.name}</span>
                                </div>
                                {project.budget > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-32 shrink-0 text-xs text-muted-foreground">Budget total</span>
                                        <span>{fmt(project.budget)}</span>
                                    </div>
                                )}
                                {project.grant > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-32 shrink-0 text-xs text-muted-foreground">Subvention</span>
                                        <span>{fmt(project.grant)}</span>
                                    </div>
                                )}
                                {project.budget > 0 && project.grant > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-32 shrink-0 text-xs text-muted-foreground">Taux de financ.</span>
                                        <Badge variant="secondary" className="rounded-full">
                                            {financingRate(project.budget, project.grant)} %
                                        </Badge>
                                    </div>
                                )}
                                <Separator></Separator>
                                 
                                 {project.description && ( 
                                    <>
                                     <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                                     <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                                    </>
                                   
                                )}
                            </div>
                        )}
                    </section>

                    <Separator />

                    {/* Conventions */}
                    <section className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conventions</p>
                            {!showAddForm && !editingAgreement && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowAddForm(true)}>
                                    <Plus size={11} />Ajouter
                                </Button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex flex-col gap-2">
                                {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {agreements.map(a =>
                                    editingAgreement?.id === a.id ? (
                                        <AgreementForm
                                            key={a.id}
                                            partners={partners}
                                            statuses={statuses}
                                            projectId={project.id}
                                            initial={a}
                                            onSaved={handleAgreementSaved}
                                            onCancel={() => setEditingAgreement(null)}
                                        />
                                    ) : (
                                        <AgreementRow
                                            key={a.id}
                                            agreement={a}
                                            statuses={statuses}
                                            onEdit={setEditingAgreement}
                                            onDelete={handleDeleteAgreement}
                                        />
                                    )
                                )}

                                {showAddForm && (
                                    <AgreementForm
                                        partners={partners}
                                        statuses={statuses}
                                        projectId={project.id}
                                        onSaved={handleAgreementSaved}
                                        onCancel={() => setShowAddForm(false)}
                                    />
                                )}

                                {agreements.length === 0 && !showAddForm && (
                                    <p className="text-xs text-muted-foreground italic">Aucune convention</p>
                                )}
                            </div>
                        )}

                        {/* Totaux conventions */}
                        {agreements.length > 1 && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-1 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Total budget conventions</span>
                                        <span className="font-medium text-foreground">{fmt(totalBudget)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Total subventions</span>
                                        <span className="font-medium text-foreground">{fmt(totalGrant)}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// --- Composant principal ---

export default function Projects() {
    const [projects,      setProjects]      = useState<ProjectFull[]>([])
    const [projectCalls,  setProjectCalls]  = useState<ProjectCallFull[]>([])
    const [axes,          setAxes]          = useState<Axis[]>([])
    const [statuses,      setStatuses]      = useState<Status[]>([])
    const [partners,      setPartners]      = useState<Partner[]>([])
    const [allAgreements, setAllAgreements] = useState<FinancialAgreement[]>([])
    const [loading,       setLoading]       = useState(true)

    const [search,            setSearch]            = useState('')
    const [selectedAxisIds,   setSelectedAxisIds]   = useState<number[]>([])
    const [selectedCallIds,   setSelectedCallIds]   = useState<number[]>([])

    const [callSheetOpen,    setCallSheetOpen]    = useState(false)
    const [projectSheetOpen, setProjectSheetOpen] = useState(false)
    const [detailOpen,       setDetailOpen]       = useState(false)
    const [selectedProject,  setSelectedProject]  = useState<ProjectFull | null>(null)
    const [editingCall,      setEditingCall]      = useState<ProjectCall | undefined>()
    const [defaultCallId,    setDefaultCallId]    = useState<number | undefined>()

    const [multipleSelect,           setMultipleSelect]           = useState(false)
    const [selectedProjects,         setSelectedProjects]         = useState<ProjectFull[]>([])
    const [confirmingDeleteProjects, setConfirmingDeleteProjects] = useState(false)

    useEffect(() => {
        Promise.all([getProjectCalls(), getProjects(), getAxes(), getStatuses(), getPartners(), getFinancialAgreements()])
            .then(([pcs, ps, axs, sts, pts, agrs]) => {
                const axisMap = new Map((axs as Axis[]).map(a => [a.id, a]))

                const fullCalls: ProjectCallFull[] = (pcs as ProjectCall[]).map(pc => ({
                    ...pc,
                    axis: axisMap.get(pc.axis_id) ?? { id: 0, name: 'Inconnu', description: '' },
                }))

                const callMap = new Map(fullCalls.map(pc => [pc.id, pc]))
                const fullProjects: ProjectFull[] = (ps as Project[]).map(p => ({
                    ...p,
                    projectCall: callMap.get(p.project_call_id) ?? { id: 0, axis_id: 0, title: 'Inconnu', description: '', start_date: '', end_date: '', status_id: 0, axis: { id: 0, name: 'Inconnu', description: '' } },
                }))

                setAxes(axs as Axis[])
                setStatuses(sts as Status[])
                setPartners(pts as Partner[])
                setProjectCalls(fullCalls)
                setProjects(fullProjects)
                setAllAgreements(agrs as FinancialAgreement[])
            })
            .finally(() => setLoading(false))
    }, [])

    // Conventions enrichies par projet (pour les ProjectCards)
    const partnerMap = new Map(partners.map(p => [p.id, p]))
    const agreementsByProject = allAgreements.reduce<Map<number, AgreementFull[]>>((acc, a) => {
        const partner = partnerMap.get(a.partner_id)
        if (!partner) return acc
        const list = acc.get(a.project_id) ?? []
        acc.set(a.project_id, [...list, { ...a, partner }])
        return acc
    }, new Map())

    // Filtres
    const filteredCalls = projectCalls.filter(pc => {
        if (selectedAxisIds.length > 0 && !selectedAxisIds.includes(pc.axis_id)) return false
        if (selectedCallIds.length > 0 && !selectedCallIds.includes(pc.id)) return false
        return true
    })

    const filteredProjects = projects.filter(p => {
        if (!filteredCalls.find(pc => pc.id === p.project_call_id)) return false
        if (search.trim() && !p.title.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    function handleProjectCreated(p: Project) {
        const call = projectCalls.find(pc => pc.id === p.project_call_id)!
        setProjects(prev => [...prev, { ...p, projectCall: call }])
        setProjectSheetOpen(false)
    }

    function handleCallCreated(pc: ProjectCall) {
        const axis = axes.find(a => a.id === pc.axis_id) ?? { id: 0, name: 'Inconnu', description: '' }
        const full: ProjectCallFull = { ...pc, axis }
        setProjectCalls(prev => {
            const existing = prev.find(p => p.id === pc.id)
            if (existing) return prev.map(p => p.id === pc.id ? full : p)
            return [...prev, full]
        })
        setCallSheetOpen(false)
        setEditingCall(undefined)
    }

    function handleProjectUpdated(p: Project) {
        const call = projectCalls.find(pc => pc.id === p.project_call_id)!
        setProjects(prev => prev.map(x => x.id === p.id ? { ...p, projectCall: call } : x))
        setSelectedProject(prev => prev ? { ...p, projectCall: call } : null)
    }

    function handleProjectDeleted(id: number) {
        setProjects(prev => prev.filter(p => p.id !== id))
        setSelectedProject(null)
        setDetailOpen(false)
    }

    function handleCallDeleted(id: number) {
        setProjectCalls(prev => prev.filter(pc => pc.id !== id))
        // retire aussi les projets liés à cet AAP
        setProjects(prev => prev.filter(p => p.project_call_id !== id))
    }

    function toggleProject(p: ProjectFull) {
        setSelectedProjects(prev =>
            prev.find(x => x.id === p.id)
                ? prev.filter(x => x.id !== p.id)
                : [...prev, p]
        )
    }

    async function handleDeleteSelectedProjects() {
        await Promise.all(selectedProjects.map(p => deleteProject(p.id)))
        setProjects(prev => prev.filter(p => !selectedProjects.find(sp => sp.id === p.id)))
        setSelectedProjects([])
        setMultipleSelect(false)
        setConfirmingDeleteProjects(false)
    }

    function copyProjectTitlesGroup() {
        navigator.clipboard.writeText(selectedProjects.map(p => p.title).join('\n'))
    }

    function handleAgreementAdded(a: FinancialAgreement) {
        setAllAgreements(prev => [...prev, a])
    }

    function handleAgreementDeleted(id: number) {
        setAllAgreements(prev => prev.filter(a => a.id !== id))
    }

    // Stats globales
    const activeAxisIds = [...new Set(filteredCalls.map(pc => pc.axis_id))]
    const activeAxes    = axes.filter(a => activeAxisIds.includes(a.id))

    return (
        <div className="flex flex-col h-full">

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-6 py-3 border-b  shrink-0">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un projet..."
                        className="pl-8 h-8 text-sm"
                    />
                </div>

                {/* Filtre axes */}
                {(() => {
                    const active = selectedAxisIds.length
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 rounded-md">
                                    <SlidersHorizontal size={14} />
                                    Axes
                                    {active > 0 && <span className="text-muted-foreground text-xs">{active}/{axes.length}</span>}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                {axes.map(a => (
                                    <DropdownMenuCheckboxItem
                                        key={a.id}
                                        checked={selectedAxisIds.includes(a.id)}
                                        onCheckedChange={() => setSelectedAxisIds(prev =>
                                            prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id]
                                        )}
                                    >
                                        {a.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                {active > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => setSelectedAxisIds([])}>
                                            Tout effacer
                                        </DropdownMenuCheckboxItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                })()}

                {/* Filtre AAP */}
                {(() => {
                    const active = selectedCallIds.length
                    const visibleCalls = selectedAxisIds.length > 0
                        ? projectCalls.filter(pc => selectedAxisIds.includes(pc.axis_id))
                        : projectCalls
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 rounded-md">
                                    <SlidersHorizontal size={14} />
                                    AAP
                                    {active > 0 && <span className="text-muted-foreground text-xs">{active}/{projectCalls.length}</span>}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64">
                                {visibleCalls.map(pc => (
                                    <DropdownMenuCheckboxItem
                                        key={pc.id}
                                        checked={selectedCallIds.includes(pc.id)}
                                        onCheckedChange={() => setSelectedCallIds(prev =>
                                            prev.includes(pc.id) ? prev.filter(x => x !== pc.id) : [...prev, pc.id]
                                        )}
                                    >
                                        {pc.title}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                {active > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => setSelectedCallIds([])}>
                                            Tout effacer
                                        </DropdownMenuCheckboxItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                })()}

                <div className="ml-auto flex items-center gap-2">
                    {multipleSelect ? (
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-md" onClick={() => { setMultipleSelect(false); setSelectedProjects([]) }}>
                            <X size={14} /> Terminer
                        </Button>
                    ) : (
                        <Button size="sm" className="gap-1.5 rounded-md bg-transparent border border-border text-foreground hover:bg-muted" onClick={() => setMultipleSelect(true)}>
                            <ListChecks size={14} /> Sélection multiple
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-md" onClick={() => { setEditingCall(undefined); setCallSheetOpen(true) }}>
                        <Plus size={14} />Nouvel AAP
                    </Button>
                    <Button size="sm" className="gap-1.5 rounded-md" onClick={() => { setDefaultCallId(undefined); setProjectSheetOpen(true) }}>
                        <Plus size={14} />Nouveau projet
                    </Button>
                </div>
            </div>

            {/* Colonnes par axe → AAP */}
            {loading ? (
                <div className="flex gap-4 p-6 overflow-x-auto">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-72 shrink-0 flex flex-col gap-3">
                            <Skeleton className="h-8 w-40 rounded-lg" />
                            {[1, 2].map(j => <Skeleton key={j} className="h-28 w-full rounded-xl" />)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-0 h-full min-w-max">
                        {activeAxes.map((axis, axisIdx) => {
                            const calls = filteredCalls.filter(pc => pc.axis_id === axis.id)
                            if (calls.length === 0) return null
                            return (
                                <div key={axis.id} className={`flex flex-col h-full border-r ${axisIdx === 0 ? 'border-l' : ''}`}>
                                    {/* Header axe */}
                                    <div className="px-4 py-2 bg-muted/50 border-b">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{axis.name}</span>
                                    </div>

                                    {/* Colonnes AAP */}
                                    <div className="flex flex-row h-full overflow-x-auto">
                                        {calls.map(pc => {
                                            console.log("Calls :", calls)
                                            const pcProjects = filteredProjects.filter(p => p.project_call_id === pc.id)
                                            const pcStatus = statuses.find(s => s.id === pc.status_id)
                                            const pcColor = pcStatus?.label === "Terminé" ? "#f3f4f6" : "#d1fae5"
                                            return (
                                                <div key={pc.id} className="w-72 shrink-0 flex flex-col h-full border-r last:border-r-0">
                                                    {/* Header AAP */}
                                                    <div className="px-4 py-3 border-b flex items-center justify-between gap-2 bg-background">
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium truncate">{pc.title}</span>
                                                            {(pc.start_date || pc.end_date) && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDate(pc.start_date)}{pc.end_date ? ` → ${formatDate(pc.end_date)}` : ''}
                                                                </span>
                                                            )}
                                                            {pcStatus && <Badge className="rounded-md mt-1 text-xs text-black" style={{backgroundColor:pcColor}}>{pcStatus.label}</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className="text-xs text-muted-foreground">{pcProjects.length} projet{pcProjects.length > 1 ? 's' : ''}</span>
                                                            <Button
                                                                variant="ghost" size="icon" className="h-6 w-6 rounded-md"
                                                                onClick={() => { setEditingCall(pc); setCallSheetOpen(true) }}
                                                            >
                                                                <Pencil size={11} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost" size="icon" className="h-6 w-6 rounded-md"
                                                                onClick={() => { setDefaultCallId(pc.id); setProjectSheetOpen(true) }}
                                                            >
                                                                <Plus size={11} />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Cartes projets */}
                                                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                                                        {pcProjects.map(p => (
                                                            <ProjectCard
                                                                key={p.id}
                                                                project={p}
                                                                agreements={agreementsByProject.get(p.id) ?? []}
                                                                statuses={statuses}
                                                                onClick={() => { setSelectedProject(p); setDetailOpen(true) }}
                                                                selectOn={multipleSelect}
                                                                selected={!!selectedProjects.find(sp => sp.id === p.id)}
                                                                onToggle={() => toggleProject(p)}
                                                                onDelete={id => {
                                                                    setProjects(prev => prev.filter(x => x.id !== id))
                                                                    setSelectedProjects(prev => prev.filter(x => x.id !== id))
                                                                }}
                                                                onEdit={() => { setSelectedProject(p); setProjectSheetOpen(true) }}
                                                                selectedProjects={selectedProjects}
                                                                onSelectMultiple={() => { setMultipleSelect(true); toggleProject(p) }}
                                                            />
                                                        ))}
                                                        {pcProjects.length === 0 && (
                                                            <p className="text-xs text-muted-foreground italic px-1">Aucun projet</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}

                        {filteredCalls.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                                Aucun appel à projet correspondant aux filtres
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating selection bar */}
            {multipleSelect && selectedProjects.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-full bg-foreground text-background shadow-xl">
                    {confirmingDeleteProjects ? (
                        <>
                            <span className="text-sm px-2">Supprimer {selectedProjects.length} projet{selectedProjects.length > 1 ? 's' : ''} ?</span>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => setConfirmingDeleteProjects(false)}>Annuler</Button>
                            <Button variant="ghost" size="sm" className="h-7 rounded-full text-red-400 hover:text-red-300 hover:bg-white/10" onClick={handleDeleteSelectedProjects}>Confirmer</Button>
                        </>
                    ) : (
                        <>
                            <span className="text-sm font-medium px-2">{selectedProjects.length} sélectionné{selectedProjects.length > 1 ? 's' : ''}</span>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={copyProjectTitlesGroup}>
                                <Copy size={13} /> Copier les titres
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-red-400 hover:text-red-300 hover:bg-white/10" onClick={() => setConfirmingDeleteProjects(true)}>
                                <Trash2 size={13} /> Supprimer
                            </Button>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => { setMultipleSelect(false); setSelectedProjects([]) }}>
                                <X size={13} />
                            </Button>
                        </>
                    )}
                </div>
            )}

            {/* Sheets */}
            <ProjectCallSheet
                open={callSheetOpen}
                onClose={() => { setCallSheetOpen(false); setEditingCall(undefined) }}
                onSaved={handleCallCreated}
                onDeleted={handleCallDeleted}
                axes={axes}
                statuses={statuses}
                editCall={editingCall}
            />

            <ProjectSheet
                open={projectSheetOpen}
                onClose={() => setProjectSheetOpen(false)}
                onSaved={handleProjectCreated}
                projectCalls={projectCalls}
                statuses={statuses}
                defaultCallId={defaultCallId}
            />

            <ProjectDetailSheet
                open={detailOpen}
                project={selectedProject}
                onClose={() => { setDetailOpen(false); setSelectedProject(null) }}
                onUpdated={handleProjectUpdated}
                onDeleted={handleProjectDeleted}
                onAgreementAdded={handleAgreementAdded}
                onAgreementDeleted={handleAgreementDeleted}
                partners={partners}
                projectCalls={projectCalls}
                axes={axes}
                statuses={statuses}
            />
        </div>
    )
}
