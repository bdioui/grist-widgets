import { useEffect, useState } from 'react'
import {
    getPartnerCardsFull, addPartner, updatePartner, deletePartner,
    getLabCardsFull, addLab, updateLab, deleteLab,
    getPartners, getMembers,
    addPartnerToLab, removePartnerFromLab,
    attachMemberToLab, detachMemberFromLab,
} from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@/components/ui/avatar'
import { Plus, Pencil, X, ChevronDown, Trash2, FlaskConical, Users, Trash, CopyIcon, ShareIcon, CheckIcon, ListChecks } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuGroup, ContextMenuSeparator } from '@/components/ui/context-menu'
import type { PartnerCardFull, Partner, Lab, LabCardFull, Member } from '@/lib/types'

// --- Constantes ---

const PARTNER_TYPES = [
    'Université et grandes écoles',
    'Entreprise privée',
    'Association',
    'Établissement public',
    'Administration',
    'Collectivité',
    'Fondation',
    'Autre',
]

const LAB_TYPES = [
    "Unité d'appui à la recherche",
    'Chaire de recherche',
    'Unité mixte de recherche',
    'Laboratoire commun',
    'Équipe de recherche labelisée',
]

const LAB_TOPICS = [
    'Société et sciences humaines',
    'Aménagement et urbanisme',
    'Politique et société',
    'Économie et management',
    'Droit',
    'Arts, culture, philosophie',
    'Histoire et archéologie',
    'Communication, langues et éducation',
    'Psychologie',
    'Environnement',
    'Écosystèmes et biodiversité',
    'Agrosystèmes',
    'Biologie et santé',
    'Santé publique',
    'Médecine',
    'Cancérologie',
    'Sports',
    'Biologie',
    'Mathématiques',
    'Chimie',
    'Physique',
    'Imagerie et électronique',
    'Mécanique',
    'Autre',
]

const PALETTE = [
    { label: 'Lavande',      hexa: '#D8CFEE' },
    { label: 'Rose',         hexa: '#EEC5EF' },
    { label: 'Fuchsia',      hexa: '#F4B8D1' },
    { label: 'Corail',       hexa: '#F4C5B8' },
    { label: 'Pêche',        hexa: '#F9DEC9' },
    { label: 'Jaune',        hexa: '#EDD803' },
    { label: 'Jaune pâle',   hexa: '#F7F0A0' },
    { label: 'Vert tendre',  hexa: '#C8EABF' },
    { label: 'Vert sauge',   hexa: '#B8D9C5' },
    { label: 'Menthe',       hexa: '#B8EAE0' },
    { label: 'Bleu ciel',    hexa: '#BFD9F4' },
    { label: 'Bleu',         hexa: '#C5D2EF' },
    { label: 'Bleu nuit',    hexa: '#B8C8E8' },
    { label: 'Gris',         hexa: '#E7E8E2' },
    { label: 'Gris chaud',   hexa: '#E2DDD8' },
    { label: 'Beige',        hexa: '#EDE5D0' },
    { label: 'Sable',        hexa: '#E8DFC0' },
    { label: 'Terracotta',   hexa: '#E8C4A8' },
]

// =============================================================================
// PARTNER FORMS & SHEETS
// =============================================================================

type PartnerForm = { name: string; description: string; color: string; logo: string; type: string; status_id: number; consortium: boolean }
const EMPTY_PARTNER_FORM: PartnerForm = { name: '', description: '', color: '#E7E8E2', logo: '', type: 'Université et grandes écoles', status_id: 1, consortium: false }

type PartnerSheetProps =
    | { mode: 'create'; onCreated: (p: Partner) => void; onClose: () => void }
    | { mode: 'edit';   partner: PartnerCardFull; onUpdated: (p: PartnerCardFull) => void; onClose: () => void }

function PartnerFormSheet(props: PartnerSheetProps) {
    const isEdit = props.mode === 'edit'
    const [form, setForm] = useState<PartnerForm>(
        isEdit ? { name: props.partner.name, description: props.partner.description, color: props.partner.color, logo: props.partner.logo, type: props.partner.type, status_id: props.partner.status_id, consortium: props.partner.consortium }
               : EMPTY_PARTNER_FORM
    )
    const [saving, setSaving] = useState(false)

    function setField<K extends keyof PartnerForm>(key: K, value: PartnerForm[K]) {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    async function handleSave() {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            if (isEdit) {
                await updatePartner(props.partner.id, form)
                props.onUpdated({ ...props.partner, ...form })
            } else {
                const created = await addPartner(form)
                props.onCreated(created)
            }
            props.onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex flex-col gap-1.5">
                <Label>Nom</Label>
                <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Nom du partenaire" />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} placeholder="Description..." />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setField('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PARTNER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-2">
                <Label>Couleur</Label>
                <div className="flex gap-2">
                    {PALETTE.map(c => (
                        <button key={c.hexa} title={c.label} onClick={() => setField('color', c.hexa)}
                            className="w-7 h-7 rounded-full border-2 transition-all"
                            style={{ backgroundColor: c.hexa, borderColor: form.color === c.hexa ? '#000' : 'transparent' }}
                        />
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Logo (URL)</Label>
                <Input value={form.logo} onChange={e => setField('logo', e.target.value)} placeholder="https://..." />
            </div>
            <label className="flex items-center gap-3 px-1 cursor-pointer">
                <Checkbox
                    checked={form.consortium}
                    onCheckedChange={checked => setField('consortium', Boolean(checked))}
                />
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Membre du consortium</span>
                    <span className="text-xs text-muted-foreground">Ce partenaire fait partie du consortium principal</span>
                </div>
            </label>
            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={props.onClose}>Annuler</Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name.trim()}>
                    {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
                </Button>
            </div>
        </div>
    )
}

type PartnerDetailSheetProps = {
    partner:   PartnerCardFull
    open:      boolean
    onClose:   () => void
    onUpdated: (p: PartnerCardFull) => void
    onDeleted: (id: number) => void
}

function PartnerDetailSheet({ partner, open, onClose, onUpdated, onDeleted }: PartnerDetailSheetProps) {
    const [editing,    setEditing]    = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [deleting,   setDeleting]   = useState(false)

    async function handleDelete() {
        setDeleting(true)
        try {
            await deletePartner(partner.id)
            onDeleted(partner.id)
            onClose()
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) { setEditing(false); setConfirming(false); onClose() } }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[560px] overflow-y-auto flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        {partner.color && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: partner.color }} />}
                        <SheetTitle className="text-base truncate">{partner.name}</SheetTitle>
                        <Badge variant="outline" className="text-xs shrink-0">{partner.type}</Badge>
                        {partner.consortium && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                                <Users size={10} /> Consortium
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {confirming ? (
                            <>
                                <span className="text-xs text-destructive mr-1">Supprimer ?</span>
                                <Button variant="destructive" size="sm" className="h-7" onClick={handleDelete} disabled={deleting}>{deleting ? '...' : 'Confirmer'}</Button>
                                <Button variant="ghost" size="sm" className="h-7" onClick={() => setConfirming(false)}>Annuler</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(v => !v)}><Pencil size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirming(true)}><Trash2 size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X size={14} /></Button>
                            </>
                        )}
                    </div>
                </SheetHeader>
                {editing && (
                    <>
                        <PartnerFormSheet mode="edit" partner={partner} onUpdated={p => { onUpdated(p); setEditing(false) }} onClose={() => setEditing(false)} />
                        <Separator />
                    </>
                )}
                <div className="flex flex-col gap-5 px-6 py-5">
                    {partner.description && <p className="text-sm text-muted-foreground leading-relaxed">{partner.description}</p>}
                    <Separator />
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Membres — {partner.members.length}</p>
                        {partner.members.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Aucun membre</p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {partner.members.map(m => (
                                    <div key={m.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted">
                                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 border border-border">
                                            {m.first_name[0]}{m.last_name[0]}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm">{m.first_name} {m.last_name}</span>
                                            <span className="text-xs text-muted-foreground truncate">{m.position}</span>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-muted-foreground">{m.status}</span>
                                            {m.email && <a href={`mailto:${m.email}`} className="text-xs text-blue-600 hover:underline truncate max-w-32">{m.email}</a>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                    <Separator />
                    <section className="flex flex-col gap-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Projets & conventions — {partner.projects.length} projet{partner.projects.length > 1 ? 's' : ''}, {partner.agreements.length} convention{partner.agreements.length > 1 ? 's' : ''}
                        </p>
                        {partner.projects.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Aucun projet lié</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {partner.projects.map(p => {
                                    const projectAgreements = partner.agreements.filter(a => a.project_id === p.id)
                                    return (
                                        <div key={p.id} className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                                                <span className="text-sm font-medium">{p.title}</span>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                                    {p.budget > 0 && <span>{p.budget.toLocaleString('fr-FR')} €</span>}
                                                    {p.budget > 0 && p.grant > 0 && <span className="text-green-600">{Math.round((p.grant / p.budget) * 100)} %</span>}
                                                </div>
                                            </div>
                                            {projectAgreements.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic pl-4">Aucune convention</p>
                                            ) : (
                                                <div className="flex flex-col gap-0.5 pl-4 border-l-2 ml-3" style={{ borderColor: 'hsl(var(--border))' }}>
                                                    {projectAgreements.map(a => (
                                                        <div key={a.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted">
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm">{a.title}</span>
                                                                {a.signed_date && <span className="text-xs text-muted-foreground">Signé le {a.signed_date}</span>}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-4">
                                                                {a.budget > 0 && <span>{a.budget.toLocaleString('fr-FR')} €</span>}
                                                                {a.budget > 0 && a.grant > 0 && <span className="text-green-600">{Math.round((a.grant / a.budget) * 100)} %</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// =============================================================================
// LAB FORMS & SHEETS
// =============================================================================

type LabForm = { name: string; description: string; type: string; topic: string }
const EMPTY_LAB_FORM: LabForm = { name: '', description: '', type: 'Laboratoire académique', topic: '' }

type LabSheetProps =
    | { mode: 'create'; onCreated: (l: Lab) => void; onClose: () => void }
    | { mode: 'edit';   lab: LabCardFull; onUpdated: (l: LabCardFull) => void; onClose: () => void }

function LabFormSheet(props: LabSheetProps) {
    const isEdit = props.mode === 'edit'

    const initTopic = isEdit ? props.lab.topic : ''
    const initTopicSelect = isEdit
        ? (LAB_TOPICS.includes(props.lab.topic) ? props.lab.topic : 'Autre')
        : ''
    const initTopicCustom = isEdit && !LAB_TOPICS.includes(props.lab.topic) ? props.lab.topic : ''

    const [form, setForm] = useState<LabForm>(
        isEdit ? { name: props.lab.name, description: props.lab.description, type: props.lab.type, topic: initTopic }
               : EMPTY_LAB_FORM
    )
    const [topicSelect, setTopicSelect] = useState(initTopicSelect)
    const [topicCustom, setTopicCustom] = useState(initTopicCustom)
    const [saving, setSaving] = useState(false)

    function setField<K extends keyof LabForm>(key: K, value: LabForm[K]) {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    function handleTopicSelect(value: string) {
        setTopicSelect(value)
        if (value !== 'Autre') {
            setTopicCustom('')
            setField('topic', value)
        } else {
            setField('topic', topicCustom)
        }
    }

    function handleTopicCustom(value: string) {
        setTopicCustom(value)
        setField('topic', value)
    }

    async function handleSave() {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            if (isEdit) {
                await updateLab(props.lab.id, form)
                props.onUpdated({ ...props.lab, ...form })
            } else {
                const created = await addLab(form)
                props.onCreated(created)
            }
            props.onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex flex-col gap-1.5">
                <Label>Nom / Acronyme</Label>
                <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Ex : LRGE, UMR 42…" />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} placeholder="Description..." />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setField('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {LAB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Thématique</Label>
                <Select value={topicSelect} onValueChange={handleTopicSelect}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une thématique…" /></SelectTrigger>
                    <SelectContent>
                        {LAB_TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
                {topicSelect === 'Autre' && (
                    <Input
                        value={topicCustom}
                        onChange={e => handleTopicCustom(e.target.value)}
                        placeholder="Préciser la thématique…"
                        className="mt-1.5"
                    />
                )}
            </div>
            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={props.onClose}>Annuler</Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name.trim()}>
                    {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
                </Button>
            </div>
        </div>
    )
}

type LabDetailSheetProps = {
    lab:       LabCardFull
    open:      boolean
    onClose:   () => void
    onUpdated: (l: LabCardFull) => void
    onDeleted: (id: number) => void
}

function LabDetailSheet({ lab, open, onClose, onUpdated, onDeleted }: LabDetailSheetProps) {
    const [editing,    setEditing]    = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [deleting,   setDeleting]   = useState(false)

    const [allPartners,  setAllPartners]  = useState<import('@/lib/types').Partner[]>([])
    const [allMembers,   setAllMembers]   = useState<Member[]>([])
    const [labState,     setLabState]     = useState<LabCardFull>(lab)
    const [partnerLinks, setPartnerLinks] = useState<{ id: number; partner_id: number }[]>([])

    const [partnerToAdd, setPartnerToAdd] = useState('')
    const [memberToAdd,  setMemberToAdd]  = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        setLabState(lab)
        Promise.all([getPartners(), getMembers()]).then(([p, m]) => {
            setAllPartners(p)
            setAllMembers(m)
            setPartnerLinks(lab.partners.map((p, i) => ({ id: i + 1, partner_id: p.id })))
        })
    }, [open, lab.id])

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteLab(lab.id)
            onDeleted(lab.id)
            onClose()
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    async function handleAddPartner() {
        const partnerId = Number(partnerToAdd)
        if (!partnerId) return
        setSaving(true)
        try {
            const link = await addPartnerToLab(lab.id, partnerId)
            const partner = allPartners.find(p => p.id === partnerId)!
            const updated = { ...labState, partners: [...labState.partners, partner] }
            setLabState(updated)
            setPartnerLinks(prev => [...prev, { id: link.id, partner_id: partnerId }])
            onUpdated(updated)
            setPartnerToAdd('')
        } finally {
            setSaving(false)
        }
    }

    async function handleRemovePartner(partnerId: number) {
        const link = partnerLinks.find(l => l.partner_id === partnerId)
        if (!link) return
        await removePartnerFromLab(link.id)
        const updated = { ...labState, partners: labState.partners.filter(p => p.id !== partnerId) }
        setLabState(updated)
        setPartnerLinks(prev => prev.filter(l => l.partner_id !== partnerId))
        onUpdated(updated)
    }

    async function handleAddMember() {
        const memberId = Number(memberToAdd)
        if (!memberId) return
        setSaving(true)
        try {
            await attachMemberToLab(memberId, lab.id)
            const member = allMembers.find(m => m.id === memberId)!
            const updated = { ...labState, members: [...labState.members, { ...member, lab_id: lab.id }] }
            setLabState(updated)
            onUpdated(updated)
            setMemberToAdd('')
        } finally {
            setSaving(false)
        }
    }

    async function handleRemoveMember(memberId: number) {
        await detachMemberFromLab(memberId)
        const updated = { ...labState, members: labState.members.filter(m => m.id !== memberId) }
        setLabState(updated)
        onUpdated(updated)
    }

    const linkedPartnerIds = labState.partners.map(p => p.id)
    const linkedMemberIds  = labState.members.map(m => m.id)
    const availablePartners = allPartners.filter(p => !linkedPartnerIds.includes(p.id))
    const availableMembers  = allMembers.filter(m => !linkedMemberIds.includes(m.id))

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) { setEditing(false); setConfirming(false); onClose() } }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[560px] overflow-y-auto flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <FlaskConical size={16} className="shrink-0 text-muted-foreground" />
                        <SheetTitle className="text-base truncate">{labState.name}</SheetTitle>
                        <Badge variant="outline" className="text-xs shrink-0">{labState.type}</Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {confirming ? (
                            <>
                                <span className="text-xs text-destructive mr-1">Supprimer ?</span>
                                <Button variant="destructive" size="sm" className="h-7" onClick={handleDelete} disabled={deleting}>{deleting ? '...' : 'Confirmer'}</Button>
                                <Button variant="ghost" size="sm" className="h-7" onClick={() => setConfirming(false)}>Annuler</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(v => !v)}><Pencil size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirming(true)}><Trash2 size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X size={14} /></Button>
                            </>
                        )}
                    </div>
                </SheetHeader>

                {editing && (
                    <>
                        <LabFormSheet mode="edit" lab={labState} onUpdated={l => { setLabState(l); onUpdated(l); setEditing(false) }} onClose={() => setEditing(false)} />
                        <Separator />
                    </>
                )}

                <div className="flex flex-col gap-5 px-6 py-5">
                    {labState.topic && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Thématique :</span>
                            <Badge variant="secondary" className="text-xs">{labState.topic}</Badge>
                        </div>
                    )}
                    {labState.description && <p className="text-sm text-muted-foreground leading-relaxed">{labState.description}</p>}

                    <Separator />

                    {/* Partenaires liés */}
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Partenaires — {labState.partners.length}</p>
                        {labState.partners.map(p => (
                            <div key={p.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted group">
                                {p.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />}
                                <span className="text-sm flex-1">{p.name}</span>
                                <Badge variant="outline" className="text-xs">{p.type}</Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemovePartner(p.id)}>
                                    <X size={12} />
                                </Button>
                            </div>
                        ))}
                        {availablePartners.length > 0 && (
                            <div className="flex gap-2 mt-1">
                                <Select value={partnerToAdd} onValueChange={setPartnerToAdd}>
                                    <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Lier un partenaire…" /></SelectTrigger>
                                    <SelectContent>
                                        {availablePartners.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button size="icon" className="h-8 w-8" disabled={!partnerToAdd || saving} onClick={handleAddPartner}>
                                    <Plus size={14} />
                                </Button>
                            </div>
                        )}
                    </section>

                    <Separator />

                    {/* Membres */}
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Membres — {labState.members.length}</p>
                        {labState.members.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun membre rattaché</p>}
                        {labState.members.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted group">
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 border border-border">
                                    {m.first_name[0]}{m.last_name[0]}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm">{m.first_name} {m.last_name}</span>
                                    <span className="text-xs text-muted-foreground truncate">{m.position}</span>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">{m.status}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveMember(m.id)}>
                                    <X size={12} />
                                </Button>
                            </div>
                        ))}
                        {availableMembers.length > 0 && (
                            <div className="flex gap-2 mt-1">
                                <Select value={memberToAdd} onValueChange={setMemberToAdd}>
                                    <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Rattacher un membre…" /></SelectTrigger>
                                    <SelectContent>
                                        {availableMembers.map(m => (
                                            <SelectItem key={m.id} value={String(m.id)}>{m.first_name} {m.last_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button size="icon" className="h-8 w-8" disabled={!memberToAdd || saving} onClick={handleAddMember}>
                                    <Plus size={14} />
                                </Button>
                            </div>
                        )}
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// =============================================================================
// CARDS
// =============================================================================

function PartnerCard({ partner, onClick, selectOn, selected, onToggle, onDelete, selectedPartners }: {
    partner: PartnerCardFull
    onClick: () => void
    selectOn: boolean
    selected: boolean
    onToggle: () => void
    onDelete: (id: number) => void
    selectedPartners: PartnerCardFull[]
}) {
    const totalBudget = partner.agreements.reduce((sum, a) => sum + a.budget, 0)
    const totalGrant  = partner.agreements.reduce((sum, a) => sum + a.grant,  0)
    const rate        = totalBudget > 0 ? Math.round((totalGrant / totalBudget) * 100) : null

    const [copied,        setCopied]        = useState(false)
    const [partnerCopied, setPartnerCopied] = useState(false)
    const [confirming,    setConfirming]    = useState(false)
    const [deleting,      setDeleting]      = useState(false)

    function copyName() {
        navigator.clipboard.writeText(partner.name)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function copyNames() {
        navigator.clipboard.writeText(selectedPartners.map(p => p.name).join(', '))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function copyPartnerInfo() {
        const info = [partner.name, partner.type, partner.description].filter(Boolean).join('\n')
        navigator.clipboard.writeText(info)
        setPartnerCopied(true)
        setTimeout(() => setPartnerCopied(false), 2000)
    }

    function copyPartnersInfo() {
        const info = selectedPartners
            .map(p => [
                p.name,
                `Type : ${p.type}`,
                p.description ? `Description : ${p.description}` : null,
            ].filter(Boolean).join('\n'))
            .join('\n\n')
        navigator.clipboard.writeText(info)
        setPartnerCopied(true)
        setTimeout(() => setPartnerCopied(false), 2000)
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deletePartner(partner.id)
            onDelete(partner.id)
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    async function handleDeleteMultiple() {
        setDeleting(true)
        try {
            await Promise.all(selectedPartners.map(p => deletePartner(p.id)))
            selectedPartners.forEach(p => onDelete(p.id))
            setConfirming(false)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <ContextMenu onOpenChange={open => { if (!open) setConfirming(false) }}>
            <ContextMenuTrigger>
        <Card
            className={`cursor-pointer transition-all duration-200 ${selected ? 'ring-2 ring-foreground shadow-none' : 'hover:shadow-md'}`}
            onClick={selectOn ? onToggle : onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm leading-snug">{partner.name}</CardTitle>
                    <div className="flex items-center gap-1 shrink-0">
                        {partner.consortium && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 cursor-default">
                                        <Users size={10} /> Consortium
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Membre du consortium</TooltipContent>
                            </Tooltip>
                        )}
                        <Badge variant="outline" className="text-xs">{partner.type}</Badge>
                    </div>
                </div>
                <CardDescription className="text-xs line-clamp-2">{partner.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
                {partner.members.length > 0 && (
                    <div className="flex items-center gap-2">
                        <AvatarGroup>
                            {partner.members.slice(0, 4).map(m => (
                                <Avatar key={m.id}>
                                    <AvatarImage src={m.profile_image} alt={`${m.first_name} ${m.last_name}`} />
                                    <AvatarFallback>{m.first_name[0]}{m.last_name[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                            {partner.members.length > 4 && <AvatarGroupCount>+{partner.members.length - 4}</AvatarGroupCount>}
                        </AvatarGroup>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-[10px] text-muted-foreground cursor-default">
                                    {partner.members.length} membre{partner.members.length > 1 ? 's' : ''}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="flex flex-col gap-1">
                                {partner.members.map(m => (
                                    <div key={m.id} className="text-xs whitespace-nowrap">
                                        {m.first_name} {m.last_name}
                                        {/* <span className="text-muted-foreground ml-1">— {m.position}</span> */}
                                    </div>
                                ))}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {partner.projects.length > 0 && <span>{partner.projects.length} projet{partner.projects.length > 1 ? 's' : ''}</span>}
                        {partner.agreements.length > 0 && <span>{partner.agreements.length} convention{partner.agreements.length > 1 ? 's' : ''}</span>}
                        {partner.projects.length === 0 && partner.agreements.length === 0 && <span className="italic">Aucun projet lié</span>}
                    </div>
                    {totalBudget > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="font-medium text-foreground cursor-default">{totalGrant.toLocaleString('fr-FR')} €</span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="flex flex-col gap-1">
                                <div className="text-xs whitespace-nowrap">Budget total : <span className="font-medium">{totalBudget.toLocaleString('fr-FR')} €</span></div>
                                <div className="text-xs whitespace-nowrap">Subvention : <span className="font-medium">{totalGrant.toLocaleString('fr-FR')} €</span></div>
                                {rate !== null && <div className="text-xs whitespace-nowrap">Taux financé : <span className="font-medium text-green-600">{rate} %</span></div>}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </CardContent>
        </Card>
            </ContextMenuTrigger>

            <ContextMenuContent>
                <ContextMenuGroup>
                    {selectOn ? (
                        <>
                            <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyNames}>
                                {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                                {copied ? 'Copié !' : 'Copier les noms'}
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyPartnersInfo}>
                                {partnerCopied ? <CheckIcon size={14} /> : <ShareIcon size={14} />}
                                {partnerCopied ? 'Infos copiées !' : 'Partager'}
                            </ContextMenuItem>
                        </>
                    ) : (
                        <>
                            <ContextMenuItem onClick={onClick}><Pencil size={14} /> Éditer</ContextMenuItem>
                            <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyName}>
                                {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                                {copied ? 'Copié !' : 'Copier le nom'}
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyPartnerInfo}>
                                {partnerCopied ? <CheckIcon size={14} /> : <ShareIcon size={14} />}
                                {partnerCopied ? 'Infos copiées !' : 'Partager'}
                            </ContextMenuItem>
                        </>
                    )}
                </ContextMenuGroup>
                <ContextMenuSeparator />
                <ContextMenuGroup>
                    {confirming ? (
                        <ContextMenuItem onSelect={e => e.preventDefault()} className="flex gap-2 p-1">
                            <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => setConfirming(false)}>Annuler</Button>
                            <Button variant="destructive" size="sm" className="h-7 flex-1" onClick={selectOn ? handleDeleteMultiple : handleDelete} disabled={deleting}>
                                {deleting ? '...' : selectOn ? `Confirmer (${selectedPartners.length})` : 'Confirmer'}
                            </Button>
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()} onClick={() => setConfirming(true)}>
                            <Trash size={14} /> Supprimer
                        </ContextMenuItem>
                    )}
                </ContextMenuGroup>
            </ContextMenuContent>
        </ContextMenu>
    )
}

function LabCard({ lab, onClick }: { lab: LabCardFull; onClick: () => void }) {
    return (
        <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={onClick}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <FlaskConical size={14} className="shrink-0 text-muted-foreground" />
                        <CardTitle className="text-sm leading-snug">{lab.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{lab.type}</Badge>
                </div>
                {lab.topic && <Badge variant="secondary" className="text-xs w-fit mt-1">{lab.topic}</Badge>}
                <CardDescription className="text-xs line-clamp-2 mt-1">{lab.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-xs text-muted-foreground pt-0">
                <span>{lab.partners.length} partenaire{lab.partners.length > 1 ? 's' : ''}</span>
                {lab.members.length > 0 && (
                    <div className="flex items-center gap-2">
                        <AvatarGroup>
                            {lab.members.slice(0, 4).map(m => (
                                <Avatar key={m.id}>
                                    <AvatarImage src={m.profile_image} />
                                    <AvatarFallback>{m.first_name[0]}{m.last_name[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                            {lab.members.length > 4 && <AvatarGroupCount>+{lab.members.length - 4}</AvatarGroupCount>}
                        </AvatarGroup>
                        <span>{lab.members.length} membre{lab.members.length > 1 ? 's' : ''}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function CardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full mt-1" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-6 h-6 rounded-full" />)}
                </div>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// PAGE PRINCIPALE
// =============================================================================

type ViewMode = 'partners' | 'labs'

export default function Partners() {
    const [viewMode, setViewMode] = useState<ViewMode>('partners')

    // Partners state
    const [partners,    setPartners]    = useState<PartnerCardFull[]>([])
    const [loadingP,    setLoadingP]    = useState(false)
    const [selectedP,   setSelectedP]   = useState<PartnerCardFull | null>(null)
    const [showCreateP, setShowCreateP] = useState(false)

    // Labs state
    const [labs,        setLabs]        = useState<LabCardFull[]>([])
    const [loadingL,    setLoadingL]    = useState(false)
    const [selectedL,   setSelectedL]   = useState<LabCardFull | null>(null)
    const [showCreateL, setShowCreateL] = useState(false)

    // Shared filters
    const [query,           setQuery]           = useState('')
    const [typeFilter,      setTypeFilter]      = useState<string[]>([])
    const [consortiumOnly,  setConsortiumOnly]  = useState(false)

    // Multi-select (partners only)
    const [multipleSelect,    setMultipleSelect]    = useState(false)
    const [selectedPartners,  setSelectedPartners]  = useState<PartnerCardFull[]>([])
    const [confirmingDeleteP, setConfirmingDeleteP] = useState(false)

    useEffect(() => {
        setLoadingP(true)
        getPartnerCardsFull().then(setPartners).finally(() => setLoadingP(false))
    }, [])

    useEffect(() => {
        if (viewMode !== 'labs' || labs.length > 0) return
        setLoadingL(true)
        getLabCardsFull().then(setLabs).finally(() => setLoadingL(false))
    }, [viewMode])

    function copyPartnerNamesGroup() {
        navigator.clipboard.writeText(selectedPartners.map(p => p.name).join(', '))
    }

    function copyPartnersInfoGroup() {
        const info = selectedPartners
            .map(p => [
                p.name,
                `Type : ${p.type}`,
                p.description ? `Description : ${p.description}` : null,
            ].filter(Boolean).join('\n'))
            .join('\n\n')
        navigator.clipboard.writeText(info)
    }

    async function handleDeleteSelectedPartners() {
        await Promise.all(selectedPartners.map(p => deletePartner(p.id)))
        setPartners(prev => prev.filter(p => !selectedPartners.find(sp => sp.id === p.id)))
        setSelectedPartners([])
        setMultipleSelect(false)
        setConfirmingDeleteP(false)
    }

    function togglePartner(partner: PartnerCardFull) {
        setSelectedPartners(prev =>
            prev.find(p => p.id === partner.id)
                ? prev.filter(p => p.id !== partner.id)
                : [...prev, partner]
        )
    }

    function handleViewMode(mode: ViewMode) {
        setViewMode(mode)
        setQuery('')
        setTypeFilter([])
        setConsortiumOnly(false)
        setMultipleSelect(false)
        setSelectedPartners([])
    }

    // Partners handlers
    const filteredPartners = partners.filter(p => {
        const matchesQuery      = !query.trim() || p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase())
        const matchesType       = typeFilter.length === 0 || typeFilter.includes(p.type)
        const matchesConsortium = !consortiumOnly || p.consortium
        return matchesQuery && matchesType && matchesConsortium
    })
    const availablePartnerTypes = [...new Set(partners.map(p => p.type))].sort()

    function handlePartnerUpdated(updated: PartnerCardFull) {
        setPartners(prev => prev.map(p => p.id === updated.id ? updated : p))
        setSelectedP(updated)
    }
    function handlePartnerCreated(newPartner: import('@/lib/types').Partner) {
        const full: PartnerCardFull = { ...newPartner, members: [], projects: [], agreements: [] }
        setPartners(prev => [...prev, full])
        setShowCreateP(false)
    }
    function handlePartnerDeleted(id: number) {
        setPartners(prev => prev.filter(p => p.id !== id))
        setSelectedPartners(prev => prev.filter(p => p.id !== id))
        setSelectedP(null)
    }

    // Labs handlers
    const filteredLabs = labs.filter(l => {
        const matchesQuery = !query.trim() || l.name.toLowerCase().includes(query.toLowerCase()) || l.description.toLowerCase().includes(query.toLowerCase())
        const matchesType  = typeFilter.length === 0 || typeFilter.includes(l.type)
        return matchesQuery && matchesType
    })
    const availableLabTypes = [...new Set(labs.map(l => l.type))].sort()

    function handleLabUpdated(updated: LabCardFull) {
        setLabs(prev => prev.map(l => l.id === updated.id ? updated : l))
        setSelectedL(updated)
    }
    function handleLabCreated(newLab: Lab) {
        const full: LabCardFull = { ...newLab, partners: [], members: [] }
        setLabs(prev => [...prev, full])
        setShowCreateL(false)
    }
    function handleLabDeleted(id: number) {
        setLabs(prev => prev.filter(l => l.id !== id))
        setSelectedL(null)
    }

    const isPartners = viewMode === 'partners'
    const loading    = isPartners ? loadingP : loadingL
    const types      = isPartners ? availablePartnerTypes : availableLabTypes

    return (
        <div className="m-5 flex flex-col gap-4">

            {/* Toggle + barre de recherche */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle partenaires / laboratoires */}
                <div className="bg-gray-200 rounded-full border p-1 flex relative">
                    {(['partners', 'labs'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleViewMode(mode)}
                            className={`relative px-4 py-1 rounded-full text-sm z-10 transition-colors duration-300 ${viewMode === mode ? 'text-white' : 'text-black'}`}
                        >
                            <span className="relative z-20">
                                {mode === 'partners' ? 'Partenaires' : 'Laboratoires'}
                            </span>
                            {viewMode === mode && (
                                <span className="absolute inset-0 bg-black rounded-full z-10" />
                            )}
                        </button>
                    ))}
                </div>

                <Input
                    placeholder={isPartners ? 'Rechercher un partenaire…' : 'Rechercher un laboratoire…'}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="max-w-sm"
                />

                <Popover>
                    <PopoverTrigger asChild>
                        <button className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            typeFilter.length > 0
                                ? 'bg-foreground text-background border-foreground'
                                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                        }`}>
                            {typeFilter.length === 0 ? 'Tous les types' : typeFilter.length === 1 ? typeFilter[0] : `${typeFilter.length} types`}
                            <ChevronDown size={12} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-56 p-2 flex flex-col gap-0.5">
                        {typeFilter.length > 0 && (
                            <>
                                <button onClick={() => setTypeFilter([])} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-left">Tout déselectionner</button>
                                <Separator className="my-1" />
                            </>
                        )}
                        {types.map(type => (
                            <label key={type} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-xs">
                                <Checkbox
                                    checked={typeFilter.includes(type)}
                                    onCheckedChange={checked => setTypeFilter(prev => checked ? [...prev, type] : prev.filter(t => t !== type))}
                                />
                                {type}
                            </label>
                        ))}
                    </PopoverContent>
                </Popover>

                {isPartners && (
                    <button
                        onClick={() => setConsortiumOnly(v => !v)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            consortiumOnly
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                        }`}
                    >
                        <Users size={12} /> Consortium
                    </button>
                )}

                <span className="text-sm text-muted-foreground flex-1">
                    {isPartners
                        ? `${filteredPartners.length} partenaire${filteredPartners.length > 1 ? 's' : ''}`
                        : `${filteredLabs.length} laboratoire${filteredLabs.length > 1 ? 's' : ''}`
                    }
                </span>

                {isPartners && (
                    multipleSelect ? (
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-md" onClick={() => { setMultipleSelect(false); setSelectedPartners([]) }}>
                            <X size={14} /> Terminer
                        </Button>
                    ) : (
                        <Button size="sm" className="gap-1.5 rounded-md bg-transparent border border-border text-foreground hover:bg-muted" onClick={() => setMultipleSelect(true)}>
                            <ListChecks size={14} /> Sélection multiple
                        </Button>
                    )
                )}

                {isPartners ? (
                    <Button size="sm" className="gap-1.5 rounded-md" onClick={() => setShowCreateP(true)}>
                        <Plus size={14} /> Nouveau partenaire
                    </Button>
                ) : (
                    <Button size="sm" className="gap-1.5 rounded-md" onClick={() => setShowCreateL(true)}>
                        <Plus size={14} /> Nouveau laboratoire
                    </Button>
                )}
            </div>

            {/* Grille */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading
                    ? [...Array(6)].map((_, i) => <CardSkeleton key={i} />)
                    : isPartners
                        ? filteredPartners.map(p => (
                            <PartnerCard
                                key={p.id}
                                partner={p}
                                onClick={() => setSelectedP(p)}
                                selectOn={multipleSelect}
                                selected={!!selectedPartners.find(sp => sp.id === p.id)}
                                onToggle={() => togglePartner(p)}
                                onDelete={handlePartnerDeleted}
                                selectedPartners={selectedPartners}
                            />
                        ))
                        : filteredLabs.map(l => <LabCard key={l.id} lab={l} onClick={() => setSelectedL(l)} />)
                }
                {!loading && isPartners && filteredPartners.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-8">Aucun partenaire ne correspond à la recherche.</p>
                )}
                {!loading && !isPartners && filteredLabs.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-8">Aucun laboratoire ne correspond à la recherche.</p>
                )}
            </div>

            {/* Partner detail sheet */}
            {selectedP && (
                <PartnerDetailSheet
                    partner={selectedP}
                    open={!!selectedP}
                    onClose={() => setSelectedP(null)}
                    onUpdated={handlePartnerUpdated}
                    onDeleted={handlePartnerDeleted}
                />
            )}

            {/* Lab detail sheet */}
            {selectedL && (
                <LabDetailSheet
                    lab={selectedL}
                    open={!!selectedL}
                    onClose={() => setSelectedL(null)}
                    onUpdated={handleLabUpdated}
                    onDeleted={handleLabDeleted}
                />
            )}

            {/* Partner create sheet */}
            <Sheet open={showCreateP} onOpenChange={v => { if (!v) setShowCreateP(false) }}>
                <SheetContent side="right" showCloseButton={false} className="!w-[480px] p-0">
                    <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                        <SheetTitle>Nouveau partenaire</SheetTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setShowCreateP(false)}><X size={14} /></Button>
                    </SheetHeader>
                    <PartnerFormSheet mode="create" onCreated={handlePartnerCreated} onClose={() => setShowCreateP(false)} />
                </SheetContent>
            </Sheet>

            {/* Lab create sheet */}
            <Sheet open={showCreateL} onOpenChange={v => { if (!v) setShowCreateL(false) }}>
                <SheetContent side="right" showCloseButton={false} className="!w-[480px] p-0">
                    <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                        <SheetTitle>Nouveau laboratoire</SheetTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setShowCreateL(false)}><X size={14} /></Button>
                    </SheetHeader>
                    <LabFormSheet mode="create" onCreated={handleLabCreated} onClose={() => setShowCreateL(false)} />
                </SheetContent>
            </Sheet>

            {/* Floating selection bar */}
            {isPartners && multipleSelect && selectedPartners.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-full bg-foreground text-background shadow-xl">
                    {confirmingDeleteP ? (
                        <>
                            <span className="text-sm px-2">Supprimer {selectedPartners.length} partenaire{selectedPartners.length > 1 ? 's' : ''} ?</span>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => setConfirmingDeleteP(false)}>Annuler</Button>
                            <Button variant="ghost" size="sm" className="h-7 rounded-full text-red-400 hover:text-red-300 hover:bg-white/10" onClick={handleDeleteSelectedPartners}>Confirmer</Button>
                        </>
                    ) : (
                        <>
                            <span className="text-sm font-medium px-2">{selectedPartners.length} sélectionné{selectedPartners.length > 1 ? 's' : ''}</span>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={copyPartnerNamesGroup}>
                                <CopyIcon size={13} /> Copier les noms
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={copyPartnersInfoGroup}>
                                <ShareIcon size={13} /> Partager
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-red-400 hover:text-red-300 hover:bg-white/10" onClick={() => setConfirmingDeleteP(true)}>
                                <Trash size={13} /> Supprimer
                            </Button>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => { setMultipleSelect(false); setSelectedPartners([]) }}>
                                <X size={13} />
                            </Button>
                        </>
                    )}
                </div>
            )}

        </div>
    )
}
