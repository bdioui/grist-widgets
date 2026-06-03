import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
    DropdownMenuCheckboxItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, SlidersHorizontal, Pencil, Trash2, Check, X, ListChecks, Copy, FileDown, CheckIcon, Trash, Eye, EyeClosed, Maximize2, Minimize2 } from 'lucide-react'
import { exportToCsv } from '@/lib/utils'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import { ActionCardDetailSheet } from '@/views/dashboard/ActionCard'
import type { ActionCardData } from '@/views/dashboard/ActionCard'
import { PartnerDetailSheet } from '@/views/Partners'
import type { PartnerCardFull } from '@/lib/types'
import {
    getProjectCalls, getProjects, getAxes, getStatuses, getPartners, getFinancialAgreements,
    addProjectCall, updateProjectCall, deleteProjectCall,
    addProject, updateProject, deleteProject,
    getAgreementsByProject, addAgreement, updateAgreement, deleteAgreement,
    getProjectMembers, addProjectMember, removeProjectMember,
    getMembers,
    getKpis, getKpiEntries, addKpiEntry, updateKpiEntry, deleteKpiEntry,
    getProjectPartners, addProjectPartner, removeProjectPartner, updateProjectPartner,
    getProjectMilestones, addProjectMilestone, updateProjectMilestone, deleteProjectMilestone,
    getActionCardsByProject, linkActionCardToProject, removeProjectFromCard,
    getActionCardsFull, createActionCardFull, updateProjectMember, getCategories,
    addMember, addPartner
} from '@/lib/api'
import { type ProjectCall, type Project, type FinancialAgreement, type Axis, type Status, type Partner, type Member, type ProjectMember, type Kpi, type KpiEntry, type ProjectPartner, type ProjectMilestone, type ActionCardFull, type Category } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import SearchInput from '@/components/SearchInput'

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

const ROLES = [
    'Lead',
    'Equipe',
    'Partenaire',
    'Observateur'
]

const ROLE_ORDER = ['Lead', 'Equipe', 'Partenaire', 'Observateur']

const PARTNER_ROLES = ['Associé', 'Bénéficiaire', 'Cofinanceur', 'Sous-traitant']

const PARTNER_TYPES = [
    'Université et grandes écoles', 'Entreprise privée', 'Association',
    'Établissement public', 'Administration', 'Collectivité', 'Fondation', 'Autre',
]

const MEMBER_STATUSES = [
    'Enseignant-chercheur', 'Chercheur', 'Ingénieur', 'Doctorant',
    'Post-doc', 'BIATSS', 'Autre',
]

const PALETTE = [
    { label: 'Lavande',     hexa: '#D8CFEE' },
    { label: 'Rose',        hexa: '#EEC5EF' },
    { label: 'Fuchsia',     hexa: '#F4B8D1' },
    { label: 'Corail',      hexa: '#F4C5B8' },
    { label: 'Pêche',       hexa: '#F9DEC9' },
    { label: 'Jaune',       hexa: '#EDD803' },
    { label: 'Jaune pâle',  hexa: '#F7F0A0' },
    { label: 'Vert tendre', hexa: '#C8EABF' },
    { label: 'Vert sauge',  hexa: '#B8D9C5' },
    { label: 'Menthe',      hexa: '#B8EAE0' },
    { label: 'Bleu ciel',   hexa: '#BFD9F4' },
    { label: 'Bleu',        hexa: '#C5D2EF' },
    { label: 'Bleu nuit',   hexa: '#B8C8E8' },
    { label: 'Gris',        hexa: '#E7E8E2' },
    { label: 'Gris chaud',  hexa: '#E2DDD8' },
    { label: 'Beige',       hexa: '#EDE5D0' },
    { label: 'Sable',       hexa: '#E8DFC0' },
    { label: 'Terracotta',  hexa: '#E8C4A8' },
]


// --- Types enrichis ---

type ProjectCallFull    = ProjectCall & { axis: Axis }
type ProjectFull        = Project     & { projectCall: ProjectCallFull }
type AgreementFull      = FinancialAgreement & { partner: Partner }
type ProjectPartnerFull = ProjectPartner & { partner: Partner }

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

function projectProgress(start_date: string, end_date: string): number | null {
    if (!start_date || !end_date) return null
    const start = new Date(start_date).getTime()
    const end   = new Date(end_date).getTime()
    const now   = Date.now()
    if (end <= start) return null
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
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
    onSelectAll: () => void
}

function ProjectCard({ project, agreements, statuses, onClick, selectOn, selected, onToggle, onDelete, onEdit, selectedProjects, onSelectMultiple: _onSelectMultiple, onSelectAll }: ProjectCardProps) {
    const totalGrant = agreements.reduce((s, a) => s + a.grant, 0)
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
                {totalGrant > 0 && (
                    <div className="flex justify-between">
                        <span>Subvention</span>
                        <span className="font-medium text-foreground">{fmt(totalGrant)}</span>
                    </div>
                )}
            </div>

            {/* Progression temporelle */}
            {(() => {
                const progress = projectProgress(project.start_date, project.end_date)
                if (progress === null) return null
                return (
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                    </div>
                )
            })()}

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
                        <ContextMenuItem onClick={onSelectAll}>
                            <ListChecks size={13} className="mr-2" /> Tout sélectionner
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyTitles}>
                            {copied ? <CheckIcon size={13} className="mr-2" /> : <Copy size={13} className="mr-2" />}
                            {copied ? 'Copié !' : `Copier les titres (${selectedProjects.length})`}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => exportToCsv(
                            'projets.csv',
                            ['Titre', 'Appel à projets', 'Axe', 'Budget (€)'],
                            selectedProjects.map(p => [
                                p.title, p.projectCall.title, p.projectCall.axis.name, p.budget,
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
                                <Trash2 size={13} className="mr-2" /> Supprimer ({selectedProjects.length})
                            </ContextMenuItem>
                        )}
                    </>
                ) : (
                    <>
                        <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyTitle}>
                            {copied ? <CheckIcon size={13} className="mr-2" /> : <Copy size={13} className="mr-2" />}
                            {copied ? 'Copié !' : 'Copier le titre'}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={onEdit}>
                            <Pencil size={13} className="mr-2" /> Modifier
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
                                <Trash2 size={13} className="mr-2" /> Supprimer
                            </ContextMenuItem>
                        )}
                    </>
                )}
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
                    <SheetTitle>{editCall ? 'Modifier le dispositif' : 'Nouveau dispositif'}</SheetTitle>
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
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du dispositif" />
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

function ProjectSheet({ open, onClose, onSaved, projectCalls, statuses, defaultCallId}: ProjectSheetProps) {
    const projectStatuses = statuses.filter(s => s.context === 'project')

    const [title,       setTitle]       = useState('')
    const [description, setDescription] = useState('')
    const [budget,      setBudget]      = useState('')
    const [callId,      setCallId]      = useState<number>(0)
    const [statusId,    setStatusId]    = useState<number>(0)
    const [submitting,  setSubmitting]  = useState(false)
    const [error,       setError]       = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        setTitle(''); setDescription(''); setBudget('')
        setCallId(defaultCallId ?? projectCalls[0]?.id ?? 0)
        setStatusId(projectStatuses[0]?.id ?? 0)
        setError(null)
    }, [open])

    async function handleSubmit() {
        if (!title.trim() || !callId) { setError('Titre et dispositif sont obligatoires.'); return }
        setSubmitting(true)
        try {
            const p = await addProject({ title, description, budget: Number(budget) || 0, project_call_id: callId, status_id: statusId, start_date: '', end_date: '' })
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
                            <Label>Dispositif *</Label>
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
                    <div className="flex flex-col gap-1.5">
                        <Label>Budget total (€)</Label>
                        <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" />
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

// --- Dialog détail convention ---

type AgreementDetailProps = {
    open: boolean
    onClose: () => void
    agreement: AgreementFull | null
    partners: Partner[]
    statuses: Status[]
    projectId: number
    onSaved: (a: AgreementFull) => void
    onDeleted: (id: number) => void
}

function AgreementDetailDialog({ open, onClose, agreement, partners, statuses, projectId, onSaved, onDeleted: _onDeleted }: AgreementDetailProps) {
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        if (!open) setEditing(false)
    }, [open])

    if (!agreement) return null

    const status = statuses.find(s => s.id === agreement.status_id)
    const rate   = financingRate(agreement.budget, agreement.grant)

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
            <DialogContent showCloseButton={false} style={{ maxWidth: '600px' }}>
                <DialogHeader>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-base font-semibold leading-snug">{agreement.title}</DialogTitle>
                            <div className="flex items-center gap-2">
                                <span
                                    className="text-xs px-1.5 py-0.5 rounded-full border border-border"
                                    style={agreement.partner.color ? { backgroundColor: agreement.partner.color } : {}}
                                >
                                    {agreement.partner.name}
                                </span>
                                {status && (
                                    <span
                                        className="text-xs px-1.5 py-0.5 rounded-full border border-border text-black"
                                        style={{ backgroundColor: AGREEMENT_STATUS_COLORS[status.label] ?? '#f3f4f6' }}
                                    >
                                        {status.label}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(e => !e)}>
                                {editing ? <X size={13} /> : <Pencil size={13} />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
                                <X size={13} />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-2">
                    {!editing && (
                        <div className="flex flex-col gap-3">
                            {agreement.description && (
                                <p className="text-sm text-muted-foreground">{agreement.description}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {agreement.budget > 0 && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground">Budget</span>
                                        <span className="font-medium text-foreground">{fmt(agreement.budget)}</span>
                                    </div>
                                )}
                                {agreement.grant > 0 && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground">Subvention</span>
                                        <span className="font-medium text-foreground">{fmt(agreement.grant)}</span>
                                    </div>
                                )}
                                {rate !== null && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground">Taux financé</span>
                                        <span className="font-medium text-foreground">{rate} %</span>
                                    </div>
                                )}
                                {agreement.signed_date && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground">Date de signature</span>
                                        <span className="font-medium text-foreground">{formatDate(agreement.signed_date)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {editing && (
                        <AgreementForm
                            partners={partners}
                            statuses={statuses}
                            projectId={projectId}
                            initial={agreement}
                            onSaved={a => { onSaved(a); setEditing(false) }}
                            onCancel={() => setEditing(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

type AgreementRowProps = {
    agreement: AgreementFull
    statuses: Status[]
    onEdit: (a: AgreementFull) => void
    onDelete: (id: number) => void
    onOpen: (a: AgreementFull) => void
}


function AgreementRow({ agreement: a, statuses, onEdit, onDelete, onOpen }: AgreementRowProps) {
    const rate   = financingRate(a.budget, a.grant)
    const status = statuses.find(s => s.id === a.status_id)
    return (
                <div onClick={() => onOpen(a)} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/40 group cursor-pointer hover:bg-muted/70 transition-colors">
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

                    <SearchInput
                        data={partners}
                        onSelect={p => setPartnerId(p.id)}
                        getLabel={p => p.name}
                        placeholder="Rechercher un partenaire..."
                        value={partners.find(p => p.id === partnerId)?.name}
                    />
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
// --- Formulaire ajout partenaire projet ---

type ProjectPartnerFormProps = {
    partners: Partner[]
    initial?: ProjectPartnerFull
    onSaved: (partnerId: number, role: string, amount: number | null, label: string | null) => Promise<void>
    onCancel: () => void
}

function ProjectPartnerForm({ partners, initial, onSaved, onCancel }: ProjectPartnerFormProps) {
    const [partnerId,   setPartnerId]   = useState<number>(initial?.partner_id ?? partners[0]?.id ?? 0)
    const [role,        setRole]        = useState(initial?.role ?? PARTNER_ROLES[0])
    const [amount,      setAmount]      = useState(initial?.amount != null ? String(initial.amount) : '')
    const [label,       setLabel]       = useState(initial?.label ?? '')
    const [submitting,  setSubmitting]  = useState(false)

    async function handleSubmit() {
        if (!partnerId) return
        setSubmitting(true)
        try {
            await onSaved(partnerId, role, amount ? Number(amount) : null, label || null)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex gap-2">
                <div className="flex-1">
                    <SearchInput
                        data={partners}
                        onSelect={p => setPartnerId(p.id)}
                        getLabel={p => p.name}
                        placeholder="Partenaire..."
                        value={partners.find(p => p.id === partnerId)?.name}
                    />
                </div>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PARTNER_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2">
                <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Montant (€) — optionnel"
                    className="h-8 text-xs flex-1"
                />
                {amount && (
                    <Input
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        placeholder="Nature (ex: Apport en nature)"
                        className="h-8 text-xs flex-1"
                    />
                )}
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting} className="rounded-md">Annuler</Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || !partnerId} className="rounded-md">
                    <Check size={13} className="mr-1" />{submitting ? '...' : 'Ajouter'}
                </Button>
            </div>
        </div>
    )
}

// --- Milestone components ---

const MILESTONE_STATUS_COLORS: Record<string, string> = {
    'A faire':    '#dbeafe',
    'En cours':   '#d1fae5',
    'Terminé':    '#f3f4f6',
}

type MilestoneRowProps = {
    milestone: ProjectMilestone
    statuses: Status[]
    onEdit: () => void
    onDelete: () => void
}

function MilestoneRow({ milestone: m, statuses, onEdit, onDelete }: MilestoneRowProps) {
    const status = statuses.find(s => s.id === m.status_id)
    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/40 group">
            <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{m.title}</span>
                    {status && (
                        <span
                            className="shrink-0 text-xs px-1.5 py-0.5 rounded-full border border-border text-black"
                            style={{ backgroundColor: MILESTONE_STATUS_COLORS[status.label] ?? '#f3f4f6' }}
                        >
                            {status.label}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {m.due_date && <span>{formatDate(m.due_date)}</span>}
                    {m.description && <span className="truncate">{m.description}</span>}
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                <div
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={onEdit}
                >
                    <Pencil size={13} />
                </div>
                <div
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={onDelete}
                >
                    <Trash2 size={13} />
                </div>
            </div>
        </div>
    )
}

type MilestoneFormProps = {
    statuses: Status[]
    initial?: ProjectMilestone
    onSaved: (fields: Omit<ProjectMilestone, 'id' | 'project_id'>) => Promise<void>
    onCancel: () => void
}

function MilestoneForm({ statuses, initial, onSaved, onCancel }: MilestoneFormProps) {
    const milestoneStatuses = statuses.filter(s => s.context === 'action_card')
    const [title,       setTitle]       = useState(initial?.title ?? '')
    const [description, setDescription] = useState(initial?.description ?? '')
    const [dueDate,     setDueDate]     = useState(initial?.due_date ?? '')
    const [statusId,    setStatusId]    = useState<number>(initial?.status_id ?? milestoneStatuses[0]?.id ?? 0)
    const [submitting,  setSubmitting]  = useState(false)

    async function handleSubmit() {
        if (!title.trim()) return
        setSubmitting(true)
        try {
            await onSaved({ title, description, due_date: dueDate, status_id: statusId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex gap-2">
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titre du jalon *"
                    className="h-8 text-xs flex-1"
                />
                <Select value={statusId ? String(statusId) : ''} onValueChange={v => setStatusId(Number(v))}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
                    <SelectContent>
                        {milestoneStatuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2">
                <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    className="h-8 text-xs flex-1"
                />
                <Input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="h-8 text-xs w-36"
                />
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting} className="rounded-md">Annuler</Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || !title.trim()} className="rounded-md">
                    <Check size={13} className="mr-1" />{submitting ? '...' : initial ? 'Enregistrer' : 'Ajouter'}
                </Button>
            </div>
        </div>
    )
}

// --- Formulaire création rapide fiche action ---

type ActionCardQuickCreateFormProps = {
    projectId: number
    statuses: Status[]
    members: Member[]
    partners: Partner[]
    onSaved: (card: ActionCardFull & { linkId: number }) => void
    onCancel: () => void
}

function ActionCardQuickCreateForm({ projectId, statuses, members, partners, onSaved, onCancel }: ActionCardQuickCreateFormProps) {
    const [categories,  setCategories]  = useState<Category[]>([])
    const [title,       setTitle]       = useState('')
    const [categoryId,  setCategoryId]  = useState<number>(0)
    const [statusId,    setStatusId]    = useState<number>(0)
    const [endDate,     setEndDate]     = useState('')
    const [ownerId,     setOwnerId]     = useState<number>(members[0]?.id ?? 0)
    const [submitting,  setSubmitting]  = useState(false)

    const actionStatuses = statuses.filter(s => s.context === 'action_card')
    const partnerMap = new Map(partners.map(p => [p.id, p]))

    useEffect(() => {
        getCategories().then(cats => {
            setCategories(cats)
            if (cats.length > 0) setCategoryId(cats[0].id)
        })
        if (actionStatuses.length > 0) setStatusId(actionStatuses[0].id)
    }, [])

    async function handleSubmit() {
        if (!title.trim() || !categoryId || !ownerId) return
        setSubmitting(true)
        try {
            const card = await createActionCardFull({
                title, description: '', start_date: '', end_date: endDate,
                status_id: statusId, category_id: categoryId, axis_id: null,
                owner_id: ownerId, members: [], project_id: null,
                todo_title: '', todo_items: [],
            })
            const linkId = await linkActionCardToProject(projectId, card.id)
            onSaved({ ...card, linkId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Titre de la fiche *"
                className="h-8 text-xs"
                autoFocus
            />
            <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                    <SearchInput
                        data={categories}
                        onSelect={c => setCategoryId(c.id)}
                        getLabel={c => c.title}
                        placeholder="Catégorie..."
                        value={categories.find(c => c.id === categoryId)?.title}
                    />
                </div>
                <Select value={statusId ? String(statusId) : ''} onValueChange={v => setStatusId(Number(v))}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
                    <SelectContent>
                        {actionStatuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                    <SearchInput
                        data={members}
                        onSelect={m => setOwnerId(m.id)}
                        getLabel={m => `${m.first_name} ${m.last_name}`}
                        placeholder="Responsable..."
                        value={(() => { const m = members.find(m => m.id === ownerId); return m ? `${m.first_name} ${m.last_name}` : undefined })()}
                        renderItem={m => {
                            const p = partnerMap.get(m.partner_id)
                            return (
                                <div className="flex items-center justify-between gap-2 w-full">
                                    <span>{m.first_name} {m.last_name}</span>
                                    {p && <span className="text-xs text-muted-foreground shrink-0">{p.name}</span>}
                                </div>
                            )
                        }}
                    />
                </div>
                <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="h-8 text-xs w-36 shrink-0"
                />
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting} className="rounded-md">Annuler</Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || !title.trim()} className="rounded-md">
                    <Check size={13} className="mr-1" />{submitting ? '...' : 'Créer'}
                </Button>
            </div>
        </div>
    )
}

// --- Formulaire création rapide membre ---

type MemberQuickCreateFormProps = {
    partners: Partner[]
    projectRole: string
    onSaved: (member: Member) => void
    onCancel: () => void
}

function MemberQuickCreateForm({ partners, projectRole, onSaved, onCancel }: MemberQuickCreateFormProps) {
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
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {MEMBER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <SearchInput
                    data={partners}
                    onSelect={p => setPartnerId(p.id)}
                    getLabel={p => p.name}
                    placeholder="Partenaire..."
                    value={partners.find(p => p.id === partnerId)?.name}
                />
            </div>
            <p className="text-xs text-muted-foreground">Rôle projet : <span className="font-medium text-foreground">{projectRole}</span></p>
            {(!firstName.trim() || !lastName.trim()) && (
                <p className="text-xs text-destructive">Prénom et nom sont obligatoires.</p>
            )}
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting} className="rounded-md">Annuler</Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || !firstName.trim() || !lastName.trim()} className="rounded-md">
                    <Check size={13} className="mr-1" />{submitting ? '...' : 'Créer et ajouter'}
                </Button>
            </div>
        </div>
    )
}

// --- Formulaire création rapide partenaire ---

type PartnerQuickCreateFormProps = {
    projectRole: string
    onSaved: (partner: Partner) => void
    onCancel: () => void
}

function PartnerQuickCreateForm({ projectRole: _projectRole, onSaved, onCancel }: PartnerQuickCreateFormProps) {
    const [name,       setName]       = useState('')
    const [type,       setType]       = useState(PARTNER_TYPES[0])
    const [color,      setColor]      = useState('#E7E8E2')
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit() {
        if (!name.trim()) return
        setSubmitting(true)
        try {
            const partner = await addPartner({
                name, type, color,
                description: '', logo: '', status_id: 0, consortium: false,
            })
            onSaved(partner)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex gap-2">
                <Input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Nom du partenaire *" className="h-8 text-xs flex-1" autoFocus />
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-8 text-xs w-44 shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PARTNER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {PALETTE.map(c => (
                    <button key={c.hexa} title={c.label} type="button" onClick={() => setColor(c.hexa)}
                        className="w-5 h-5 rounded-full border-2 transition-all"
                        style={{ backgroundColor: c.hexa, borderColor: color === c.hexa ? '#000' : 'transparent' }}
                    />
                ))}
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting} className="rounded-md">Annuler</Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || !name.trim()} className="rounded-md">
                    <Check size={13} className="mr-1" />{submitting ? '...' : 'Créer et ajouter'}
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
    members: Member[]
    onMemberAdd?: (projectId: number, memberId: number) => void
    onMemberRemove?: (id: number) => void
    onOpen?: (id: number) => void
    onMemberCreated?: (m: Member) => void
    onPartnerCreated?: (p: Partner) => void
}

function ProjectDetailSheet({ project, open, onClose, onUpdated, onDeleted, onAgreementAdded, onAgreementDeleted, partners, projectCalls, statuses, members, onMemberRemove, onOpen: _onOpen, onMemberCreated, onPartnerCreated }: ProjectDetailSheetProps) {
    const [agreements,   setAgreements]   = useState<AgreementFull[]>([])
    const [kpis, setKpis] = useState<Kpi[]>([])
    const [kpiEntries, setKpiEntries] = useState<KpiEntry[]>([])
    const [loading,      setLoading]      = useState(false)
    const [editing,      setEditing]      = useState(false)
    const [draft,        setDraft]        = useState<Project | null>(null)
    const [showAddForm,  setShowAddForm]  = useState(false)
    const [editingAgreement, setEditingAgreement] = useState<AgreementFull | null>(null)
    const [saving,       setSaving]       = useState(false)
    const [confirming,   setConfirming]   = useState(false)
    const [deleting,     setDeleting]     = useState(false)
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
    const [selectedMembers, setSelectedMembers] = useState<ProjectMember[]>([])
    const [copied, setCopied] = useState(false)
    const [roleToAdd, setRoleToAdd] = useState<string>(ROLES[1])
    const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null)
    const pendingMemberIds = useRef(new Set<number>())
    const [selectedAgreement, setSelectedAgreement] = useState<AgreementFull | null>()
    const [projectPartners,  setProjectPartners]  = useState<ProjectPartnerFull[]>([])
    const [showAddPartner,   setShowAddPartner]   = useState(false)
    const [showDescription,  setShowDescription]  = useState(true)
    const [showParticipants, setShowParticipants] = useState(true)
    const [showConventions,  setShowConventions]  = useState(true)
    const [showIndicateurs,  setShowIndicateurs]  = useState(true)
    const [showPartenaires,  setShowPartenaires]  = useState(true)
    const [showJalons,       setShowJalons]       = useState(true)
    const [showActionCards,  setShowActionCards]  = useState(true)
    const [actionCards,      setActionCards]      = useState<(ActionCardFull & { linkId: number })[]>([])
    const [showLinkCard,       setShowLinkCard]       = useState(false)
    const [showCreateCard,     setShowCreateCard]     = useState(false)
    const [allActionCards,     setAllActionCards]     = useState<ActionCardFull[]>([])
    const [selectedActionCard, setSelectedActionCard] = useState<(ActionCardFull & { linkId: number }) | null>(null)
    const [selectedPartner,    setSelectedPartner]    = useState<PartnerCardFull | null>(null)
    const [editingRolePmId,  setEditingRolePmId]  = useState<number | null>(null)
    const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null)
    const [showCreateMember, setShowCreateMember] = useState(false)
    const [showCreatePartner, setShowCreatePartner] = useState(false)
    const [expanded,         setExpanded]         = useState(true)
    const [milestones,       setMilestones]       = useState<ProjectMilestone[]>([])
    const [showAddMilestone, setShowAddMilestone] = useState(false)
    const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null)

    useEffect(() => {
        if (!open || !project) return
        setDraft({ ...project })
        setEditing(false)
        setShowAddForm(false)
        setEditingAgreement(null)
        setConfirming(false)
        setSelectedMembers([])
        setExpanded(false)
        setShowAddMilestone(false)
        setEditingMilestone(null)
        setShowLinkCard(false)
        setShowCreateCard(false)
        setEditingRolePmId(null)
        setEditingPartnerId(null)
        setShowCreateMember(false)
        setShowCreatePartner(false)
        setSelectedPartner(null)
        setLoading(true)
        Promise.all([
            getAgreementsByProject(project.id),
            getProjectMembers(project.id),
            getKpis(),
            getKpiEntries(project.id),
            getProjectPartners(),
            getProjectMilestones(project.id),
            getActionCardsByProject(project.id),
        ])
            .then(([agreements, members, kpis, kpiEntries, pp, ms, acs]) => {
                setAgreements(agreements as AgreementFull[])
                setProjectMembers(members)
                setKpis(kpis)
                setKpiEntries(kpiEntries)
                const partnerMap = new Map(partners.map(p => [p.id, p]))
                const fullPartners = (pp as ProjectPartner[])
                    .filter(p => p.project_id === project.id)
                    .map(p => ({ ...p, partner: partnerMap.get(p.partner_id) ?? { id: 0, name: '?', description: '', color: '', logo: '', status_id: 0, type: '', consortium: false } }))
                setProjectPartners(fullPartners)
                setMilestones(ms as ProjectMilestone[])
                setActionCards(acs as (ActionCardFull & { linkId: number })[])
            })
            .finally(() => setLoading(false))
    }, [open, project?.id ?? 0])

    useEffect(() => {
        if (showLinkCard && allActionCards.length === 0) {
            getActionCardsFull().then(setAllActionCards)
        }
    }, [showLinkCard])

    function copyEmails() {
        const emails = selectedMembers
            .map(pm => members.find(m => m.id === pm.member_id)?.email ?? '')
            .filter(e => e.length > 0)
            .join(', ')

        navigator.clipboard.writeText(emails)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function exportMembersCsv() {
        const headers = ['Prénom', 'Nom', 'Rôle', 'Email', 'Téléphone', 'Partenaire']
        const rows = selectedMembers.map(pm => {
            const m = members.find(m => m.id === pm.member_id)
            const p = partners.find(p => p.id === m?.partner_id)
            return [m?.first_name ?? '', m?.last_name ?? '', pm.role, m?.email ?? '', m?.tel ?? '', p?.name ?? '']
        })
        exportToCsv(`participants_${project?.title ?? 'projet'}.csv`, headers, rows)
    }

    async function removeMembers() {
        for (const m of selectedMembers) {
            await handleRemoveMember(m.id)
        }
        setSelectedMembers([])
    }

    function toggleSelect(pm: ProjectMember) {
        setSelectedMembers(prev =>
            prev.find(m => m.id === pm.id)
            ? prev.filter(m => m.id !== pm.id)
            : [...prev, pm]
        )
    }

    function toggleSelectAll() {
        setSelectedMembers(prev =>
            prev.length === projectMembers.length ? [] : [...projectMembers]
        )
    }

    async function saveProject() {
        if (!draft || !project) return
        setSaving(true)
        try {
            await updateProject(project.id, { title: draft.title, description: draft.description, budget: draft.budget, project_call_id: draft.project_call_id, status_id: draft.status_id, start_date: draft.start_date, end_date: draft.end_date })
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

    async function handleAddMember(memberId: number) {
        if (!project) return
        if (pendingMemberIds.current.has(memberId)) return
        pendingMemberIds.current.add(memberId)
        try {
            const link = await addProjectMember(project.id, memberId, roleToAdd)
            setProjectMembers(prev =>
                prev.some(pm => pm.member_id === memberId) ? prev : [...prev, link]
            )
        } finally {
            pendingMemberIds.current.delete(memberId)
        }
    }

    async function handleRemoveMember(linkId: number) {
        await removeProjectMember(linkId)
        setProjectMembers(prev => prev.filter(pm => pm.id !== linkId))
        onMemberRemove?.(linkId)
    }

    async function handleUnlinkCard(linkId: number) {
        await removeProjectFromCard(linkId)
        setActionCards(prev => prev.filter(c => c.linkId !== linkId))
    }

    async function handleRoleChange(pmId: number, role: string) {
        await updateProjectMember(pmId, role)
        setProjectMembers(prev => prev.map(pm => pm.id === pmId ? { ...pm, role } : pm))
        setEditingRolePmId(null)
    }

    if (!project) return null

    const linkedMemberIds = projectMembers.map(pm => pm.member_id)
    const availableMembers = members.filter(m => !linkedMemberIds.includes(m.id))

    const totalBudget = agreements.reduce((s, a) => s + a.budget, 0)
    const totalGrant  = agreements.reduce((s, a) => s + a.grant, 0)

    return (
        <>
        <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
            <SheetContent side="right" showCloseButton={false} className={`${expanded ? '!w-screen' : '!w-[520px]'} flex flex-col gap-0 p-0 overflow-y-auto transition-all duration-300`}>
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
                                <Button size="sm" variant="outline" className="rounded-md" onClick={() => setExpanded(v => !v)}>
                                    {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                                </Button>
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

                <div className={`flex-1 overflow-y-auto px-6 py-5 ${expanded ? 'grid grid-cols-3 gap-5 items-start content-start' : 'flex flex-col gap-6'}`}>

                    {/* Infos projet */}
                    <section className={`flex flex-col gap-3 ${expanded ? 'bg-white border border-border rounded-xl p-4' : ''}`}>
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
                                        <Label>Dispositif</Label>
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
                                <div className="flex flex-col gap-1.5">
                                    <Label>Budget total (€)</Label>
                                    <Input type="number" value={draft.budget} onChange={e => setDraft(d => d ? { ...d, budget: Number(e.target.value) } : d)} />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label>Date de début</Label>
                                        <Input type="date" value={draft.start_date ?? ''} onChange={e => setDraft(d => d ? { ...d, start_date: e.target.value } : d)} />
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <Label>Date de fin</Label>
                                        <Input type="date" value={draft.end_date ?? ''} onChange={e => setDraft(d => d ? { ...d, end_date: e.target.value } : d)} />
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
                                    <span className="w-32 shrink-0 text-xs text-muted-foreground">Dispositif</span>
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
                                {totalGrant > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-32 shrink-0 text-xs text-muted-foreground">Subvention</span>
                                        <span>{fmt(totalGrant)}</span>
                                    </div>
                                )}
                                {(() => {
                                    const cofinancement = projectPartners
                                        .filter(pp => pp.amount !== null)
                                        .reduce((s, pp) => s + (pp.amount ?? 0), 0)
                                    const autofinancement = project.budget - totalGrant - cofinancement
                                    return (
                                        <>
                                            {cofinancement > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-32 shrink-0 text-xs text-muted-foreground">Cofinancement</span>
                                                    <span>{fmt(cofinancement)}</span>
                                                </div>
                                            )}
                                            {project.budget > 0 && totalGrant > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-32 shrink-0 text-xs text-muted-foreground">Taux de financ.</span>
                                                    <Badge variant="secondary" className="rounded-full">
                                                        {financingRate(project.budget, totalGrant + cofinancement)} %
                                                    </Badge>
                                                </div>
                                            )}
                                            {project.budget > 0 && autofinancement > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-32 shrink-0 text-xs text-muted-foreground">Autofinancement</span>
                                                    <span>{fmt(autofinancement)}</span>
                                                </div>
                                            )}
                                        </>
                                    )
                                })()}
                                {(() => {
                                    const progress = projectProgress(project.start_date, project.end_date)
                                    if (progress === null) return null
                                    return (
                                        <>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 shrink-0 text-xs text-muted-foreground">Dates du projet
                                                
                                            </div>

                                            <div className="flex flex-col gap-1 pt-1">
                                            <div className="flex justify-between text-xs text-muted-foreground gap-1.5">
                                                <span>{formatDate(project.start_date)} → {formatDate(project.end_date)}</span>
                                                <span> ({progress} %)</span>
                                            </div>
                                            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                                            </div>
                                        </div>

                                        </div>
                                        
                                        </>
                                    )
                                })()}
                                <Separator></Separator>
                                 
                                 {project.description && (
                                    <>
                                     <div className="flex items-center gap-2">
                                         <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                                         <Button variant="outline" size="xs" className="rounded-md" onClick={() => setShowDescription(v => !v)}>
                                             {showDescription ? <Eye size={12} /> : <EyeClosed size={12} />}
                                         </Button>
                                     </div>
                                     {showDescription && <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>}
                                    </>
                                )}
                            </div>
                        )}
                    </section>

                    {!expanded && <Separator />}

                    {/* Participants */}
                    <section className={`flex flex-col gap-3 ${expanded ? 'bg-white border border-border rounded-xl p-4' : ''}`}>
                        <div className="flex items-center justify-between group/header">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</p>
                                <Button variant="outline" size="xs" className="rounded-md" onClick={() => setShowParticipants(v => !v)}>
                                    {showParticipants ? <Eye size={12} /> : <EyeClosed size={12} />}
                                </Button>
                            </div>
                            {showParticipants && selectedMembers.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">{selectedMembers.length} sélectionné{selectedMembers.length > 1 ? 's' : ''}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 px-2 h-8 rounded-md border border-input bg-background hover:bg-accent cursor-pointer"
                                                onClick={toggleSelectAll}>
                                                <Checkbox
                                                    checked={selectedMembers.length === projectMembers.length}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="pointer-events-none"
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Tout sélectionner</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" className="rounded-md" size="sm" onClick={copyEmails}>
                                                {copied ? <CheckIcon size={13} /> : <Copy size={13} />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Copier email{selectedMembers.length > 1 ? 's' : ''}</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" className="rounded-md" size="sm" onClick={exportMembersCsv}>
                                                <FileDown size={13} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Exporter en csv</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" className="rounded-md" size="sm" onClick={removeMembers}>
                                                <Trash size={13} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Supprimer</p></TooltipContent>
                                    </Tooltip>
                                </div>
                            )}
                        </div>

                        {showParticipants && projectMembers.length > 0 && (
                            <div className="flex flex-col gap-1">
                                {projectMembers.slice().sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)).map(pm => {
                                    const member = members.find(m => m.id === pm.member_id)
                                    if (!member) return null
                                    const partner = partners.find(p => p.id === member.partner_id)
                                    return (
                                        <div key={pm.id} onClick={() => toggleSelect(pm)} className={selectedMembers.some(m => m.id === pm.id) ? 'flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted group cursor-pointer bg-gray-100' : 'flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted group cursor-pointer'}>
                                            <div className='flex items-center gap-2 min-w-0'>
                                                <div className='flex flex-col'>
                                                     <span className="text-sm">{member.first_name} {member.last_name} </span>
                                                     {editingRolePmId === pm.id ? (
                                                         <Select value={pm.role} onValueChange={role => handleRoleChange(pm.id, role)}>
                                                             <SelectTrigger className="h-5 text-xs w-28 border-none p-0 shadow-none" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                                                             <SelectContent>
                                                                 {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                             </SelectContent>
                                                         </Select>
                                                     ) : (
                                                         <span className='text-xs text-gray-400 cursor-pointer hover:text-foreground' onClick={e => { e.stopPropagation(); setEditingRolePmId(pm.id) }}>{pm.role}</span>
                                                     )}
                                                </div>

                                                {partner && (
                                                    <span
                                                        className="shrink-0 text-[10px] px-1.5 py-0.2 rounded-full border border-border"
                                                        style={partner.color ? { backgroundColor: partner.color } : {}}
                                                    >
                                                        {partner.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                onClick={e => { e.stopPropagation(); handleRemoveMember(pm.id) }}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive ml-2 cursor-pointer"
                                            >
                                                <X size={13} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {showParticipants && (
                            <div className="flex flex-col gap-2 mt-1">
                                <div className="flex gap-2">
                                    <MemberSearchInput
                                        members={availableMembers}
                                        partners={partners}
                                        onSelect={m => handleAddMember(m.id)}
                                    />
                                    <Select value={roleToAdd} onValueChange={setRoleToAdd}>
                                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {!showCreateMember && (
                                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 shrink-0 rounded-md" onClick={() => setShowCreateMember(true)}>
                                            <Plus size={11} />Nouveau
                                        </Button>
                                    )}
                                </div>
                                {showCreateMember && (
                                    <MemberQuickCreateForm
                                        partners={partners}
                                        projectRole={roleToAdd}
                                        onSaved={async member => {
                                            onMemberCreated?.(member)
                                            await handleAddMember(member.id)
                                            setShowCreateMember(false)
                                        }}
                                        onCancel={() => setShowCreateMember(false)}
                                    />
                                )}
                            </div>
                        )}

                        {showParticipants && projectMembers.length === 0 && !showCreateMember && (
                            <p className="text-xs text-muted-foreground italic">Aucun participant</p>
                        )}
                    </section>
                    {!expanded && <Separator />}

                    {/* Conventions */}
                    <section className={`flex flex-col gap-3 ${expanded ? 'bg-white border border-border rounded-xl p-4' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conventions</p>
                                <Button variant="outline" size="xs" className="rounded-md" onClick={() => setShowConventions(v => !v)}>
                                    {showConventions ? <Eye size={12} /> : <EyeClosed size={12} />}
                                </Button>
                            </div>
                            {showConventions && !showAddForm && !editingAgreement && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowAddForm(true)}>
                                    <Plus size={11} />Ajouter
                                </Button>
                            )}
                        </div>

                        {showConventions && (loading ? (
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
                                            onOpen={() => setSelectedAgreement(a)}
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
                        ))}

                        {/* Totaux conventions */}
                        {showConventions && agreements.length > 1 && (
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

                    {!expanded && <Separator />}

                    {/* KPIs */}

                    <section className={`flex flex-col gap-3 ${expanded ? 'bg-white border border-border rounded-xl p-4' : ''}`}>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Indicateurs</p>
                            <Button variant="outline" size="xs" className="rounded-md" onClick={() => setShowIndicateurs(v => !v)}>
                                {showIndicateurs ? <Eye size={12} /> : <EyeClosed size={12} />}
                            </Button>
                        </div>

                        {showIndicateurs && kpis.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">Aucun indicateur défini</p>
                        )}

                        {showIndicateurs && (
                            <SearchInput
                                data={kpis}
                                onSelect={(kpi) => {
                                    setSelectedKpi(kpi);
                                }}
                                getLabel={kpi => kpi.label}
                                placeholder="Rechercher un indicateur..."
                                value={selectedKpi?.label}
                            />
                        )}

                        {showIndicateurs && kpis.map(kpi => {
                            const entries = kpiEntries
                                .filter(e => e.kpi_id === kpi.id)
                                .sort((a, b) => a.year.localeCompare(b.year))
                            const latest = entries.at(-1)
                            const total = entries.reduce((sum, e) => sum + e.value, 0)

                            if (!total) return null  // ← cache les KPIs sans saisie

                            return (
                                <div key={kpi.id} onClick={() => setSelectedKpi(kpi)} className="flex flex-col gap-1.5 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium">{kpi.label}</span>
                                        {latest && (
                                            <span className="text-sm font-semibold tabular-nums shrink-0">
                                                {total} <span className="text-xs font-normal text-muted-foreground">{kpi.unit}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </section>

                    {!expanded && <Separator />}

                    {/* Partenaires */}
                    <section className={`flex flex-col gap-3 ${expanded ? 'bg-white border border-border rounded-xl p-4' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Partenaires</p>
                                <Button variant="outline" size="xs" className="rounded-md" onClick={() => setShowPartenaires(v => !v)}>
                                    {showPartenaires ? <Eye size={12} /> : <EyeClosed size={12} />}
                                </Button>
                            </div>
                            {showPartenaires && !showAddPartner && !showCreatePartner && (
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowAddPartner(true)}>
                                        <Plus size={11} />Lier
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowCreatePartner(true)}>
                                        <Plus size={11} />Nouveau
                                    </Button>
                                </div>
                            )}
                        </div>

                        {showPartenaires && (
                            <div className="flex flex-col gap-2">
                                {projectPartners.length === 0 && !showAddPartner && !showCreatePartner && (
                                    <p className="text-xs text-muted-foreground italic">Aucun partenaire</p>
                                )}
                                {showAddPartner && (
                                    <ProjectPartnerForm
                                        partners={partners.filter(p => !projectPartners.some(pp => pp.partner_id === p.id))}
                                        onSaved={async (partnerId, role, amount, label) => {
                                            const pp = await addProjectPartner(project.id, partnerId, role, amount, label)
                                            const partner = partners.find(p => p.id === partnerId)!
                                            setProjectPartners(prev => [...prev, { ...pp, partner }])
                                            setShowAddPartner(false)
                                        }}
                                        onCancel={() => setShowAddPartner(false)}
                                    />
                                )}
                                {showCreatePartner && (
                                    <PartnerQuickCreateForm
                                        projectRole={PARTNER_ROLES[0]}
                                        onSaved={async partner => {
                                            onPartnerCreated?.(partner)
                                            const pp = await addProjectPartner(project.id, partner.id, PARTNER_ROLES[0], null, null)
                                            setProjectPartners(prev => [...prev, { ...pp, partner }])
                                            setShowCreatePartner(false)
                                        }}
                                        onCancel={() => setShowCreatePartner(false)}
                                    />
                                )}
                                {projectPartners.map(pp => (
                                    editingPartnerId === pp.id ? (
                                        <ProjectPartnerForm
                                            key={pp.id}
                                            partners={partners}
                                            initial={pp}
                                            onSaved={async (partnerId, role, amount, label) => {
                                                await updateProjectPartner(pp.id, { partner_id: partnerId, role, amount: amount ?? null, label: label ?? null })
                                                const partner = partners.find(p => p.id === partnerId)!
                                                setProjectPartners(prev => prev.map(x => x.id === pp.id ? { ...x, partner_id: partnerId, role, amount, label, partner } : x))
                                                setEditingPartnerId(null)
                                            }}
                                            onCancel={() => setEditingPartnerId(null)}
                                        />
                                    ) : (
                                        <div key={pp.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/40 group cursor-pointer hover:bg-muted/70" onClick={() => {
                                            const partnerMembers = members.filter(m => m.partner_id === pp.partner_id)
                                            const partnerAgreements = agreements.filter(a => a.partner_id === pp.partner_id)
                                            setSelectedPartner({ ...pp.partner, members: partnerMembers, agreements: partnerAgreements, projects: project ? [project] : [] })
                                        }}>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="shrink-0 text-xs px-1.5 py-0.5 rounded-full border border-border"
                                                    style={pp.partner.color ? { backgroundColor: pp.partner.color } : {}}
                                                >
                                                    {pp.partner.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{pp.role}</span>
                                                {pp.amount !== null && (
                                                    <span className="text-xs font-medium text-foreground">
                                                        {pp.amount.toLocaleString('fr-FR')} €
                                                        {pp.label && <span className="font-normal text-muted-foreground ml-1">· {pp.label}</span>}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                                                <div className="h-5 w-5 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground"
                                                    onClick={e => { e.stopPropagation(); setEditingPartnerId(pp.id) }}>
                                                    <Pencil size={11} />
                                                </div>
                                                <div
                                                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-destructive"
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        removeProjectPartner(pp.id)
                                                        setProjectPartners(prev => prev.filter(x => x.id !== pp.id))
                                                    }}
                                                >
                                                    <X size={11} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </section>

                    {!expanded && <Separator />}

                    {/* Fiches action */}
                    <section className={`flex flex-col gap-3 ${expanded ? 'bg-white border border-border rounded-xl p-4' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fiches action</p>
                                <Button variant="outline" size="xs" className="rounded-md" onClick={() => setShowActionCards(v => !v)}>
                                    {showActionCards ? <Eye size={12} /> : <EyeClosed size={12} />}
                                </Button>
                            </div>
                            {showActionCards && !showLinkCard && !showCreateCard && (
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowLinkCard(true)}>
                                        <Plus size={11} />Lier
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowCreateCard(true)}>
                                        <Plus size={11} />Créer
                                    </Button>
                                </div>
                            )}
                        </div>

                        {showActionCards && (
                            <div className="flex flex-col gap-2">
                                {actionCards.length === 0 && !showLinkCard && !showCreateCard && (
                                    <p className="text-xs text-muted-foreground italic">Aucune fiche action liée</p>
                                )}

                                {showLinkCard && (
                                    <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
                                        <p className="text-xs text-muted-foreground">Lier une fiche existante</p>
                                        <SearchInput
                                            data={allActionCards.filter(c => !actionCards.some(ac => ac.id === c.id))}
                                            onSelect={async card => {
                                                const linkId = await linkActionCardToProject(project.id, card.id)
                                                setActionCards(prev => [...prev, { ...card, linkId }])
                                                setShowLinkCard(false)
                                            }}
                                            getLabel={c => c.title}
                                            placeholder="Rechercher une fiche..."
                                            renderItem={card => (
                                                <div className="flex items-center justify-between gap-2 w-full">
                                                    <span className="truncate">{card.title}</span>
                                                    <span className="text-xs text-muted-foreground shrink-0">{card.category.title}</span>
                                                </div>
                                            )}
                                        />
                                        <div className="flex justify-end">
                                            <Button variant="outline" size="sm" className="rounded-md" onClick={() => setShowLinkCard(false)}>Annuler</Button>
                                        </div>
                                    </div>
                                )}

                                {showCreateCard && (
                                    <ActionCardQuickCreateForm
                                        projectId={project.id}
                                        statuses={statuses}
                                        members={members}
                                        partners={partners}
                                        onSaved={card => {
                                            setActionCards(prev => [...prev, card])
                                            setShowCreateCard(false)
                                        }}
                                        onCancel={() => setShowCreateCard(false)}
                                    />
                                )}

                                {actionCards.map(card => {
                                    const categoryColor = card.category.parent?.color ?? card.category.color ?? null
                                    return (
                                        <div
                                            key={card.id}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/40 group cursor-pointer hover:bg-muted/70 transition-colors"
                                            onClick={() => setSelectedActionCard(card)}
                                        >
                                            {categoryColor && (
                                                <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: categoryColor }} />
                                            )}
                                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                <span className="text-sm font-medium truncate">{card.title}</span>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{card.category.parent ? `${card.category.parent.title} · ` : ''}{card.category.title}</span>
                                                    {card.end_date && <span>→ {formatDate(card.end_date)}</span>}
                                                </div>
                                            </div>
                                            <span
                                                className="shrink-0 text-xs px-1.5 py-0.5 rounded-full border border-border text-black"
                                                style={{ backgroundColor: PROJECT_STATUS_COLORS[card.status.label] ?? '#f3f4f6' }}
                                            >
                                                {card.status.label}
                                            </span>
                                            <div
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                                                onClick={e => { e.stopPropagation(); handleUnlinkCard(card.linkId) }}
                                            >
                                                <X size={13} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    {!expanded && <Separator />}

                    {/* Jalons */}
                    <section className={`flex flex-col gap-3 ${expanded ? 'bg-white border border-border rounded-xl p-4' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jalons</p>
                                <Button variant="outline" size="xs" className="rounded-md" onClick={() => setShowJalons(v => !v)}>
                                    {showJalons ? <Eye size={12} /> : <EyeClosed size={12} />}
                                </Button>
                            </div>
                            {showJalons && !showAddMilestone && !editingMilestone && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowAddMilestone(true)}>
                                    <Plus size={11} />Ajouter
                                </Button>
                            )}
                        </div>

                        {showJalons && (
                            <div className="flex flex-col gap-2">
                                {milestones.length === 0 && !showAddMilestone && (
                                    <p className="text-xs text-muted-foreground italic">Aucun jalon</p>
                                )}

                                {milestones
                                    .slice()
                                    .sort((a, b) => a.due_date.localeCompare(b.due_date))
                                    .map(m =>
                                        editingMilestone?.id === m.id ? (
                                            <MilestoneForm
                                                key={m.id}
                                                statuses={statuses}
                                                initial={m}
                                                onSaved={async (fields) => {
                                                    await updateProjectMilestone(m.id, fields)
                                                    setMilestones(prev => prev.map(x => x.id === m.id ? { ...m, ...fields } : x))
                                                    setEditingMilestone(null)
                                                }}
                                                onCancel={() => setEditingMilestone(null)}
                                            />
                                        ) : (
                                            <MilestoneRow
                                                key={m.id}
                                                milestone={m}
                                                statuses={statuses}
                                                onEdit={() => setEditingMilestone(m)}
                                                onDelete={async () => {
                                                    await deleteProjectMilestone(m.id)
                                                    setMilestones(prev => prev.filter(x => x.id !== m.id))
                                                }}
                                            />
                                        )
                                    )}

                                {showAddMilestone && (
                                    <MilestoneForm
                                        statuses={statuses}
                                        onSaved={async (fields) => {
                                            const ms = await addProjectMilestone(project.id, fields)
                                            setMilestones(prev => [...prev, ms])
                                            setShowAddMilestone(false)
                                        }}
                                        onCancel={() => setShowAddMilestone(false)}
                                    />
                                )}
                            </div>
                        )}
                    </section>

                </div>
            </SheetContent>
        </Sheet>

        {/* Dialog détail convention */}
        <AgreementDetailDialog
            open={!!selectedAgreement}
            onClose={() => setSelectedAgreement(null)}
            agreement={selectedAgreement ?? null}
            partners={partners}
            statuses={statuses}
            projectId={project?.id ?? 0}
            onSaved={a => setAgreements(prev => prev.map(x => x.id === a.id ? a : x))}
            onDeleted={id => { setAgreements(prev => prev.filter(x => x.id !== id)); setSelectedAgreement(null) }}
        />

        {/* Dialog détail KPI */}
        <Dialog open={!!selectedKpi} onOpenChange={open => { if (!open) setSelectedKpi(null) }}>
            <DialogContent style={{ maxWidth: '550px' }}>
                {selectedKpi && (
                    <KpiEntryDialog
                        kpi={selectedKpi}
                        projectId={project?.id ?? 0}
                        entries={kpiEntries.filter(e => e.kpi_id === selectedKpi.id)}
                        currentUserId={0}
                        onEntryAdded={entry => setKpiEntries(prev => [...prev, entry])}
                        onEntryUpdated={entry => setKpiEntries(prev => prev.map(e => e.id === entry.id ? entry : e))}
                        onEntryDeleted={id => setKpiEntries(prev => prev.filter(e => e.id !== id))}
                    />
                )}
            </DialogContent>
        </Dialog>

        {/* Sheet détail ActionCard */}
        {selectedActionCard && (
            <ActionCardDetailSheet
                card={toActionCardData(selectedActionCard)}
                open={!!selectedActionCard}
                onClose={() => setSelectedActionCard(null)}
                onUpdated={patch => {
                    setActionCards(prev => prev.map(c =>
                        c.id === selectedActionCard.id ? { ...c, ...patch } as (ActionCardFull & { linkId: number }) : c
                    ))
                    setSelectedActionCard(prev => prev ? { ...prev, ...patch } as (ActionCardFull & { linkId: number }) : null)
                }}
                onDeleted={id => {
                    setActionCards(prev => prev.filter(c => c.id !== id))
                    setSelectedActionCard(null)
                }}
            />
        )}
        {selectedPartner && (
            <PartnerDetailSheet
                partner={selectedPartner}
                open={!!selectedPartner}
                onClose={() => setSelectedPartner(null)}
                onUpdated={updated => {
                    setProjectPartners(prev => prev.map(pp =>
                        pp.partner_id === updated.id ? { ...pp, partner: updated } : pp
                    ))
                    setSelectedPartner(updated)
                }}
                onDeleted={id => {
                    setProjectPartners(prev => prev.filter(pp => pp.partner_id !== id))
                    setSelectedPartner(null)
                }}
            />
        )}
        </>
    )
}

function toActionCardData(card: ActionCardFull): ActionCardData {
    return {
        id:          card.id,
        title:       card.title,
        description: card.description,
        start_date:  card.start_date,
        end_date:    card.end_date,
        status:      { id: card.status.id, label: card.status.label, context: card.status.context },
        category:    {
            id:     card.category.id,
            title:  card.category.title,
            color:  card.category.color ?? null,
            parent: card.category.parent
                ? { id: card.category.parent.id, title: card.category.parent.title, color: card.category.parent.color ?? null }
                : undefined,
        },
        owner: card.owner
            ? { id: card.owner.id, first_name: card.owner.first_name, last_name: card.owner.last_name, position: card.owner.position }
            : undefined,
    }
}

// --- KpiEntryDialog ---

type KpiEntryDialogProps = {
    kpi: Kpi
    projectId: number
    entries: KpiEntry[]
    currentUserId: number
    onEntryAdded: (e: KpiEntry) => void
    onEntryUpdated: (e: KpiEntry) => void
    onEntryDeleted: (id: number) => void
}

function KpiEntryDialog({ kpi, projectId, entries, currentUserId, onEntryAdded, onEntryUpdated, onEntryDeleted }: KpiEntryDialogProps) {
    const [editingId, setEditingId] = useState<number | null>(null)
    const [showAdd, setShowAdd] = useState(false)
    const sorted = [...entries].sort((a, b) => a.year.localeCompare(b.year))

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-sm font-semibold">{kpi.label}</DialogTitle>
                <p className="text-xs text-muted-foreground">{kpi.definition}</p>
            </DialogHeader>

            <div className="flex flex-col gap-2 mt-2">
                {sorted.length === 0 && !showAdd && (
                    <p className="text-xs text-muted-foreground italic">Aucune saisie pour ce KPI.</p>
                )}

                {sorted.map(entry => (
                    <div key={entry.id}>
                        {editingId === entry.id ? (
                            <KpiEntryForm
                                initial={entry}
                                kpi={kpi}
                                projectId={projectId}
                                currentUserId={currentUserId}
                                onSaved={updated => { onEntryUpdated(updated); setEditingId(null) }}
                                onCancel={() => setEditingId(null)}
                            />
                        ) : (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border group">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-10">{entry.year}</span>
                                    <span className="text-sm font-semibold tabular-nums">{entry.value}</span>
                                    <span className="text-xs text-muted-foreground">{kpi.unit}</span>
                                    {entry.comment && <span className="text-xs text-muted-foreground truncate max-w-[300px]">{entry.comment}</span>}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingId(entry.id)} className="p-1 rounded hover:bg-muted">
                                        <Pencil size={12} />
                                    </button>
                                    <button onClick={async () => { await deleteKpiEntry(entry.id); onEntryDeleted(entry.id) }} className="p-1 rounded hover:bg-muted text-destructive">
                                        <Trash size={12} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {showAdd ? (
                    <KpiEntryForm
                        kpi={kpi}
                        projectId={projectId}
                        currentUserId={currentUserId}
                        onSaved={entry => { onEntryAdded(entry); setShowAdd(false) }}
                        onCancel={() => setShowAdd(false)}
                    />
                ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 self-start rounded-md" onClick={() => setShowAdd(true)}>
                        <Plus size={11} /> Ajouter une saisie
                    </Button>
                )}
            </div>
        </>
    )
}

// --- KpiEntryForm ---

type KpiEntryFormProps = {
    kpi: Kpi
    projectId: number
    currentUserId: number
    initial?: KpiEntry
    onSaved: (e: KpiEntry) => void
    onCancel: () => void
}

function KpiEntryForm({ kpi, projectId, currentUserId, initial, onSaved, onCancel }: KpiEntryFormProps) {
    const currentYear = String(new Date().getFullYear())
    const [value,   setValue]   = useState(String(initial?.value ?? ''))
    const [year,    setYear]    = useState(initial?.year ?? currentYear)
    const [comment, setComment] = useState(initial?.comment ?? '')
    const [saving,  setSaving]  = useState(false)

    async function handleSave() {
        const v = Number(value)
        if (isNaN(v) || !year) return
        setSaving(true)
        try {
            if (initial) {
                await updateKpiEntry(initial.id, { value: v, year, comment })
                onSaved({ ...initial, value: v, year, comment })
            } else {
                const entry = await addKpiEntry({
                    kpi_id: kpi.id, project_id: projectId,
                    member_id: currentUserId, author_id: currentUserId,
                    value: v, year, comment, date: new Date().toISOString().slice(0, 10),
                })
                onSaved(entry)
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
            <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                    <Label className="text-xs">Valeur ({kpi.unit})</Label>
                    <Input type="number" value={value} onChange={e => setValue(e.target.value)} className="h-7 text-sm" />
                </div>
                <div className="flex flex-col gap-1 w-20">
                    <Label className="text-xs">Année</Label>
                    <Input value={year} onChange={e => setYear(e.target.value)} className="h-7 text-sm" maxLength={4} />
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label className="text-xs">Commentaire</Label>
                <Input value={comment} onChange={e => setComment(e.target.value)} className="h-7 text-sm" placeholder="Optionnel" />
            </div>
            <div className="flex gap-1.5 justify-end">
                <Button variant="ghost" size="sm" className="h-7 text-xs rounded-md" onClick={onCancel}>Annuler</Button>
                <Button size="sm" className="h-7 text-xs rounded-md" onClick={handleSave} disabled={saving}>
                    {saving ? '...' : initial ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
            </div>
        </div>
    )
}

// --- Composant principal ---

export default function Projects() {
    const [projects,      setProjects]      = useState<ProjectFull[]>([])
    const [projectCalls,  setProjectCalls]  = useState<ProjectCallFull[]>([])
    const [axes,          setAxes]          = useState<Axis[]>([])
    const [statuses,      setStatuses]      = useState<Status[]>([])
    const [partners,      setPartners]      = useState<Partner[]>([])
    const [members,       setMembers]       = useState<Member[]>([])
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
        Promise.all([getProjectCalls(), getProjects(), getAxes(), getStatuses(), getPartners(), getFinancialAgreements(), getMembers()])
            .then(([pcs, ps, axs, sts, pts, agrs, m]) => {
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
                setMembers(m)
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
                        <Plus size={14} />Nouveau dispositif
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
                                                                onSelectAll={() => { setMultipleSelect(true); setSelectedProjects(filteredProjects) }}
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
                                Aucun dispositif correspondant aux filtres
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
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => { setMultipleSelect(true); setSelectedProjects(filteredProjects) }}>
                                <ListChecks size={13} /> Tout sélectionner
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={copyProjectTitlesGroup}>
                                <Copy size={13} /> Copier les titres
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => exportToCsv(
                                'projets.csv',
                                ['Titre', 'Appel à projets', 'Axe', 'Budget (€)'],
                                selectedProjects.map(p => [p.title, p.projectCall.title, p.projectCall.axis.name, p.budget])
                            )}>
                                <FileDown size={13} /> Exporter en CSV
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
                members={members}
                onMemberCreated={m => setMembers(prev => [...prev, m])}
                onPartnerCreated={p => setPartners(prev => [...prev, p])}
            />
        </div>
    )
}
