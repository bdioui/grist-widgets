import { useEffect, useState } from 'react'
import { getMembersFull, getPartners, getLabs, addMember, updateMember, deleteMember, getGroups, getGroupMembers, removeMemberFromGroup, addMemberToGroup, addGroup, deleteGroup } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Plus, Pencil, X, Mail, Phone, ChevronDown, Trash2, CopyIcon, Trash, PencilIcon, ShareIcon, CheckIcon, ListChecks, Download, FileDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { type MemberFull, type Partner, type Lab, type Group, type GroupMember } from '@/lib/types'
import { exportToCsv } from '@/lib/utils'
import {ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuGroup, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger,}  from '@/components/ui/context-menu'

// --- Constantes ---

const MEMBER_STATUSES = [
    'Enseignant-chercheur',
    'Chercheur',
    'BIATSS',
    'Doctorant',
    'Post-doc',
    'Salarié',
    'Fonctionnaire',
    'Élu',
    'Autre',
]

const GENRES = ['F', 'M', 'Autre']

type MemberForm = {
    first_name:    string
    last_name:     string
    position:      string
    email:         string
    tel:           string
    genre:         string
    status:        string
    partner_id:    number
    lab_id:        number
    profile_image: string
}

const EMPTY_FORM: MemberForm = {
    first_name:    '',
    last_name:     '',
    position:      '',
    email:         '',
    tel:           '',
    genre:         'F',
    status:        'Enseignant-chercheur',
    partner_id:    0,
    lab_id:        0,
    profile_image: '',
}

// --- Formulaire création / édition ---

type MemberFormSheetProps =
    | { mode: 'create'; partners: Partner[]; labs: Lab[]; onCreated: (m: MemberFull) => void; onClose: () => void }
    | { mode: 'edit';   partners: Partner[]; labs: Lab[]; member: MemberFull; onUpdated: (m: MemberFull) => void; onClose: () => void }

function MemberFormSheet(props: MemberFormSheetProps) {
    const isEdit = props.mode === 'edit'
    const [form, setForm] = useState<MemberForm>(
        isEdit
            ? {
                first_name:    props.member.first_name,
                last_name:     props.member.last_name,
                position:      props.member.position,
                email:         props.member.email,
                tel:           props.member.tel,
                genre:         props.member.genre,
                status:        props.member.status,
                partner_id:    props.member.partner_id,
                lab_id:        props.member.lab_id,
                profile_image: props.member.profile_image,
            }
            : EMPTY_FORM
    )
    const [saving, setSaving] = useState(false)

    function setField<K extends keyof MemberForm>(key: K, value: MemberForm[K]) {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    async function handleSave() {
        if (!form.first_name.trim() || !form.last_name.trim()) return
        setSaving(true)
        try {
            const partner = props.partners.find(p => p.id === form.partner_id) ?? null
            const lab     = props.labs.find(l => l.id === form.lab_id) ?? null
            if (isEdit) {
                await updateMember(props.member.id, form)
                props.onUpdated({ ...props.member, ...form, partner, lab })
            } else {
                const created = await addMember(form)
                props.onCreated({ ...created, partner, lab })
            }
            props.onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                    <Label>Prénom</Label>
                    <Input value={form.first_name} onChange={e => setField('first_name', e.target.value)} placeholder="Prénom" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                    <Label>Nom</Label>
                    <Input value={form.last_name} onChange={e => setField('last_name', e.target.value)} placeholder="Nom" />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Poste</Label>
                <Input value={form.position} onChange={e => setField('position', e.target.value)} placeholder="Titre / fonction" />
            </div>

            <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                    <Label>Statut</Label>
                    <Select value={form.status} onValueChange={v => setField('status', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {MEMBER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5 w-28">
                    <Label>Genre</Label>
                    <Select value={form.genre} onValueChange={v => setField('genre', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Partenaire</Label>
                <Select
                    value={form.partner_id ? String(form.partner_id) : '0'}
                    onValueChange={v => setField('partner_id', Number(v))}
                >
                    <SelectTrigger><SelectValue placeholder="Aucun partenaire" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">Aucun partenaire</SelectItem>
                        {props.partners.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Laboratoire</Label>
                <Select
                    value={form.lab_id ? String(form.lab_id) : '0'}
                    onValueChange={v => setField('lab_id', Number(v))}
                >
                    <SelectTrigger><SelectValue placeholder="Aucun laboratoire" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">Aucun laboratoire</SelectItem>
                        {props.labs.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@exemple.fr" />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Téléphone</Label>
                <Input type="tel" value={form.tel} onChange={e => setField('tel', e.target.value)} placeholder="06 00 00 00 00" />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Photo de profil (URL)</Label>
                <div className="flex items-center gap-3">
                    <Input
                        value={form.profile_image}
                        onChange={e => setField('profile_image', e.target.value)}
                        placeholder="https://..."
                    />
                    {form.profile_image && (
                        <img
                            src={form.profile_image}
                            alt="Aperçu"
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-border"
                            onError={e => (e.currentTarget.style.display = 'none')}
                        />
                    )}
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={props.onClose}>Annuler</Button>
                <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saving || !form.first_name.trim() || !form.last_name.trim()}
                >
                    {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
                </Button>
            </div>
        </div>
    )
}

// --- Sheet de consultation ---

type MemberDetailSheetProps = {
    member:    MemberFull
    partners:  Partner[]
    labs:      Lab[]
    open:      boolean
    onClose:   () => void
    onUpdated: (m: MemberFull) => void
    onDeleted: (id: number) => void
}

function MemberDetailSheet({ member, partners, labs, open, onClose, onUpdated, onDeleted }: MemberDetailSheetProps) {
    const [editing,    setEditing]    = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [deleting,   setDeleting]   = useState(false)

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteMember(member.id)
            onDeleted(member.id)
            onClose()
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) { setEditing(false); setConfirming(false); onClose() } }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[520px] overflow-y-auto flex flex-col gap-0 p-0">

                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        {member.profile_image ? (
                            <div
                                className="w-9 h-9 rounded-full bg-cover bg-center shrink-0 mt-0.5"
                                style={{ backgroundImage: `url(${member.profile_image})` }}
                            />
                        ) : (
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 mt-0.5"
                                style={{ backgroundColor: member.partner?.color ?? '#E7E8E2' }}
                            >
                                {member.first_name[0]}{member.last_name[0]}
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <SheetTitle className="text-base leading-tight">
                                {member.first_name} {member.last_name}
                            </SheetTitle>
                            <span className="text-xs text-muted-foreground truncate">{member.position}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {confirming ? (
                            <>
                                <span className="text-xs text-destructive mr-1">Supprimer ?</span>
                                <Button variant="destructive" size="sm" className="h-7" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? '...' : 'Confirmer'}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7" onClick={() => setConfirming(false)}>
                                    Annuler
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(v => !v)}>
                                    <Pencil size={14} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
                                    <Trash2 size={14} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                                    <X size={14} />
                                </Button>
                            </>
                        )}
                    </div>
                </SheetHeader>

                {/* Formulaire édition */}
                {editing && (
                    <>
                        <MemberFormSheet
                            mode="edit"
                            partners={partners}
                            labs={labs}
                            member={member}
                            onUpdated={m => { onUpdated(m); setEditing(false) }}
                            onClose={() => setEditing(false)}
                        />
                        <Separator />
                    </>
                )}

                {/* Contenu */}
                <div className="flex flex-col gap-5 px-6 py-5">

                    <section className="flex flex-col gap-2 text-sm">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Informations</p>
                        <div className="flex flex-col gap-2 mt-1">
                            <div className="flex items-center gap-3">
                                <span className="w-24 shrink-0 text-xs text-muted-foreground">Statut</span>
                                <Badge variant="outline" className="text-xs">{member.status}</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-24 shrink-0 text-xs text-muted-foreground">Genre</span>
                                <span>{member.genre}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-24 shrink-0 text-xs text-muted-foreground">Partenaire</span>
                                {member.partner ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full border border-border" style={{ backgroundColor: member.partner.color }}>
                                        {member.partner.name}
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">Aucun</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-24 shrink-0 text-xs text-muted-foreground">Laboratoire</span>
                                {member.lab ? (
                                    <Badge variant="secondary" className="text-xs">{member.lab.name}</Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">Aucun</span>
                                )}
                            </div>
                        </div>
                    </section>

                    <Separator />

                    <section className="flex flex-col gap-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</p>
                        <div className="flex flex-col gap-1 mt-1">
                            {member.email ? (
                                <a
                                    href={`mailto:${member.email}`}
                                    className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted group"
                                >
                                    <Mail size={14} className="text-muted-foreground shrink-0" />
                                    <span className="text-sm text-blue-600 group-hover:underline">{member.email}</span>
                                </a>
                            ) : (
                                <p className="text-xs text-muted-foreground italic px-2">Aucun email renseigné</p>
                            )}
                            {member.tel && (
                                <a
                                    href={`tel:${member.tel}`}
                                    className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted group"
                                >
                                    <Phone size={14} className="text-muted-foreground shrink-0" />
                                    <span className="text-sm group-hover:underline">{member.tel}</span>
                                </a>
                            )}
                        </div>
                    </section>

                </div>
            </SheetContent>
        </Sheet>
    )
}

// --- Carte contact ---

function MemberCard({ member, onClick, selectOn, selected, onToggle, onDelete, selectedMembers, groups, groupLinks, onToggleGroup, onToggleMultipleGroup, onSelectAll}: {
    member: MemberFull
    onClick: () => void
    selectOn: boolean
    selected: boolean
    onToggle: () => void
    onDelete: (id: number) => void
    selectedMembers: MemberFull[]
    groups: Group[]
    groupLinks: GroupMember[]
    onToggleGroup: (member: MemberFull, groupId: number) => void
    onToggleMultipleGroup: (groupId: number) => void
    onSelectAll: () => void
}) {

    const [copied, setCopied] = useState(false)
    const [memberCopied, setMemberCopied] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [deleting,   setDeleting]   = useState(false)

    function copyEmail() {
        navigator.clipboard.writeText(member.email)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function copyEmails() {
        const emails = selectedMembers
            .map(m => m.email)
            .filter(Boolean)
            .join(', ')

        navigator.clipboard.writeText(emails)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function copyMember() {
        const memberInfos = [
            `${member.first_name} ${member.last_name}`,
            member.partner?.name,
            member.position,
            member.email,
            member.tel,
        ].filter(Boolean).join('\n')

        navigator.clipboard.writeText(memberInfos)
        setMemberCopied(true)
        setTimeout(() => setMemberCopied(false), 2000)
    }

    function copyMembers() {
        const membersInfos = selectedMembers
            .map(m => [
                `${m.first_name} ${m.last_name}`,
                m.partner?.name,
                m.position,
                m.email,
                m.tel,
            ].filter(Boolean).join('\n'))
            .join('\n\n')

        navigator.clipboard.writeText(membersInfos)
        setMemberCopied(true)
        setTimeout(() => setMemberCopied(false), 2000)
    }

    function exportSelectedCSV() {
        const columns = [
            { key: 'first_name', label: 'Prénom' },
            { key: 'last_name',  label: 'Nom' },
            { key: 'position',   label: 'Poste' },
            { key: 'email',      label: 'Email' },
            { key: 'tel',        label: 'Téléphone' },
            { key: 'status',     label: 'Statut' },
            { key: 'partner',    label: 'Partenaire' },
        ]
        const rows = selectedMembers.map(m => ({
            first_name: m.first_name,
            last_name:  m.last_name,
            position:   m.position,
            email:      m.email,
            tel:        m.tel,
            status:     m.status,
            partner:    m.partner?.name ?? '',
        }))
        const header = columns.map(c => `"${c.label}"`).join(',')
        const body   = rows.map(r => columns.map(c => `"${(r[c.key as keyof typeof r] ?? '').replace(/"/g, '""')}"`).join(','))
        const csv    = ['﻿' + header, ...body].join('\n')
        const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url    = URL.createObjectURL(blob)
        const a      = document.createElement('a')
        a.href       = url
        a.download   = 'contacts.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteMember(member.id)
            onDelete(member.id)
        } finally {
            setDeleting(false)
            setConfirming(false)
        }
    }

    async function handleDeleteMultiple() {
        setDeleting(true)
        try {
            await Promise.all(selectedMembers.map(m => deleteMember(m.id)))
            selectedMembers.forEach(m => onDelete(m.id))
            setConfirming(false)
        } finally {
            setDeleting(false)
        }
    }

    return (
        

        <ContextMenu onOpenChange={open => { if (!open) setConfirming(false) }}>

            <ContextMenuTrigger>

            <Card
                className={`cursor-pointer transition-all duration-200 ${
                    selected
                        ? 'bg-muted border-foreground shadow-none'
                        : 'hover:shadow-md'
                }`}
                onClick={selectOn ? onToggle : onClick}
            >

                <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                        {member.profile_image ? (
                            <div
                                className="w-9 h-9 rounded-full bg-cover bg-center shrink-0 mt-0.5"
                                style={{ backgroundImage: `url(${member.profile_image})` }}
                            />
                        ) : (
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 mt-0.5"
                                style={{ backgroundColor: member.partner?.color ?? '#E7E8E2' }}
                            >
                                {member.first_name[0]}{member.last_name[0]}
                            </div>
                        )}
                       
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-sm leading-snug">
                                    {member.first_name} {member.last_name}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs shrink-0">{member.status}</Badge>
                            </div>
                            <CardDescription className="text-xs">{member.position}</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    {member.partner ? (
                        <span
                            className="px-1.5 py-0.5 rounded-full border border-border text-xs shrink-0"
                            style={{ backgroundColor: member.partner.color }}
                        >
                            {member.partner.name}
                        </span>
                    ) : (
                        <span className="italic shrink-0">Sans partenaire</span>
                    )}
                    {member.email && (
                        <span className="truncate">{member.email}</span>
                    )}
                </CardContent>
            </Card>

        </ContextMenuTrigger>
            
            <ContextMenuContent>
                <ContextMenuGroup>
                    {selectOn ? (
                        <>
                        <ContextMenuItem onClick={onSelectAll}>
                            <CheckIcon size={14} /> Tout sélectionner
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                         <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyEmails}>
                            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                            {copied ? 'Copié !' : 'Copier email'}
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyMembers}>
                            {memberCopied ? <CheckIcon /> : <ShareIcon />}
                            {memberCopied ? 'Infos copiées !' : 'Partager'}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={exportSelectedCSV}>
                            <Download size={14} /> Exporter CSV ({selectedMembers.length})
                        </ContextMenuItem>
                        <ContextMenuSub>
                            <ContextMenuSubTrigger><Plus size={14} /> Ajouter à</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                {groups.map(g => {
                                    const memberIdsInGroup = groupLinks.filter(l => l.group_id === g.id).map(l => l.member_id)
                                    const allInGroup = selectedMembers.length > 0 && selectedMembers.every(m => memberIdsInGroup.includes(m.id))
                                    return (
                                        <ContextMenuItem key={g.id} onSelect={e => e.preventDefault()} onClick={() => onToggleMultipleGroup(g.id)}>
                                            {allInGroup ? <CheckIcon size={14} /> : <div className="w-[14px]" />}
                                            {g.name}
                                        </ContextMenuItem>
                                    )
                                })}
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                        </>
                        
                    
                    ) : (
                        <>
                        <ContextMenuItem onClick={onClick}><PencilIcon /> Editer </ContextMenuItem>
                        <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyEmail}>
                            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                            {copied ? 'Copié !' : 'Copier email'}
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={e => e.preventDefault()} onClick={copyMember}>
                            {memberCopied ? <CheckIcon /> : <ShareIcon />}
                            {memberCopied ? 'Infos copiées !' : 'Partager'}
                        </ContextMenuItem>
                        <ContextMenuSub>
                            <ContextMenuSubTrigger><Plus size={14} /> Ajouter à</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                {groups.map(g => {
                                    const isInGroup = groupLinks.some(l => l.member_id === member.id && l.group_id === g.id)
                                    return (
                                        <ContextMenuItem key={g.id} onSelect={e => e.preventDefault()} onClick={() => onToggleGroup(member, g.id)}>
                                            {isInGroup ? <CheckIcon size={14} /> : <div className="w-[14px]" />}
                                            {g.name}
                                        </ContextMenuItem>
                                    )
                                })}
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                        </>
                    )}
                    
                </ContextMenuGroup>
                    <ContextMenuSeparator />
                <ContextMenuGroup>
                    {selectOn ? (
                        <>
                            {confirming ? (
                            <ContextMenuItem onSelect={e => e.preventDefault()}className="flex gap-2 p-1">
                                <Button variant="outline" size="sm" className="h-7 flex-1 border-md" onClick={() => setConfirming(false)}>
                                    Annuler
                                </Button>
                                <Button variant="destructive" size="sm" className="h-7 flex-1 border-md" onClick={handleDeleteMultiple} disabled={deleting}>
                                    {deleting ? '...' : `Confirmer (${selectedMembers.length} contacts)`}
                                </Button>
                            </ContextMenuItem>
                            
                        ) : (
                            <ContextMenuItem className="text-destructive focus:text-destructive" variant="destructive" onSelect={e => e.preventDefault()} onClick={() => setConfirming(true)}>
                                <Trash size={14} /> Supprimer
                            </ContextMenuItem>
                        )}
                        </>
                    ): (
                        <>
                            {confirming ? (
                            <ContextMenuItem onSelect={e => e.preventDefault()} className="flex gap-2 p-1">
                                <Button variant="outline" size="sm" className="h-7 flex-1 border-md" onClick={() => setConfirming(false)}>
                                    Annuler
                                </Button>
                                <Button variant="destructive" size="sm" className="h-7 flex-1 border-md" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? '...' : 'Confirmer'}
                                </Button>
                            </ContextMenuItem>
                        ) : (
                            <ContextMenuItem className="text-destructive focus:text-destructive" variant="destructive" onSelect={e => e.preventDefault()} onClick={() => setConfirming(true)}>
                                <Trash size={14} /> Supprimer
                            </ContextMenuItem>
                        )}
                        </>
                    )}
                    
                </ContextMenuGroup>
            </ContextMenuContent>


        </ContextMenu>
        
    )
}

// --- Skeleton ---

function MemberCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <Skeleton className="h-3 w-20" />
            </CardContent>
        </Card>
    )
}

// --- Page principale ---

export default function Members() {
    const [members,  setMembers]  = useState<MemberFull[]>([])
    const [partners, setPartners] = useState<Partner[]>([])
    const [labs,     setLabs]     = useState<Lab[]>([])
    const [groups, setGroups]     = useState<Group[]>([])
    const [groupLinks, setGroupLinks] = useState<GroupMember[]>([])
    const [loading,  setLoading]  = useState(false)
    const [error,    setError]    = useState('')
    const [query,         setQuery]         = useState('')
    const [statusFilter,  setStatusFilter]  = useState<string[]>([])
    const [partnerFilter, setPartnerFilter] = useState<number[]>([])
    const [groupFilter, setGroupFilter] = useState<number[]>([])
    const [groupSearch, setGroupSearch] = useState('')
    const [selected,       setSelected]       = useState<MemberFull | null>(null)
    const [showCreate,     setShowCreate]     = useState(false)
    const [partnerSearch,  setPartnerSearch]  = useState('')
    const [multipleSelect, setMultipleSelect] = useState(false)
    const [selectedMembers, setSelectedMembers] = useState<MemberFull[]>([])
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<number | null>(null)

    function copyEmailsGroup() {
        const emails = selectedMembers.map(m => m.email).filter(Boolean).join(', ')
        navigator.clipboard.writeText(emails)
    }

    function copyMembersGroup() {
        const info = selectedMembers
            .map(m => [
                `${m.first_name} ${m.last_name}`,
                m.partner?.name ? `Partenaire : ${m.partner.name}` : null,
                m.position    ? `Poste : ${m.position}`            : null,
                m.email       ? `Email : ${m.email}`               : null,
                m.tel         ? `Tél : ${m.tel}`                   : null,
            ].filter(Boolean).join('\n'))
            .join('\n\n')
        navigator.clipboard.writeText(info)
    }

    async function handleDeleteSelected() {
        await Promise.all(selectedMembers.map(m => deleteMember(m.id)))
        setMembers(prev => prev.filter(m => !selectedMembers.find(sm => sm.id === m.id)))
        setSelectedMembers([])
        setMultipleSelect(false)
        setConfirmingDelete(false)
    }

    function selectAll() {
        setSelectedMembers(filtered)
    }

    function toggleMember(member: MemberFull) {
        setSelectedMembers(prev =>
            prev.find(m => m.id === member.id)
                ? prev.filter(m => m.id !== member.id)
                : [...prev, member]
        )
        console.log(selectedMembers)
    }

    async function handleDeleteGroup(groupId: number) {
        await deleteGroup(groupId)
        setGroups(prev => prev.filter(g => g.id !== groupId))
        setGroupLinks(prev => prev.filter(l => l.group_id !== groupId))
        setGroupFilter(prev => prev.filter(id => id !== groupId))
        setConfirmDeleteGroupId(null)
    }

    async function handleCreateGroup(name: string) {
        const group = await addGroup(name)
        setGroups(prev => [...prev, group])
        setGroupSearch('')
    }

    async function handleToggleGroup(member: MemberFull, groupId: number) {
        const existingLink = groupLinks.find(l => l.member_id === member.id && l.group_id === groupId)
        if (existingLink) {
            await removeMemberFromGroup(existingLink.id)
            setGroupLinks(prev => prev.filter(l => l.id !== existingLink.id))
        } else {
            const link = await addMemberToGroup(member.id, groupId)
            setGroupLinks(prev => [...prev, link])
        }
    }

    async function handleToggleMultipleGroup(groupId: number) {
        const memberIdsInGroup = groupLinks.filter(l => l.group_id === groupId).map(l => l.member_id)
        const allInGroup = selectedMembers.length > 0 && selectedMembers.every(m => memberIdsInGroup.includes(m.id))

        if (allInGroup) {
            const linksToRemove = groupLinks.filter(l => l.group_id === groupId && selectedMembers.some(m => m.id === l.member_id))
            await Promise.all(linksToRemove.map(l => removeMemberFromGroup(l.id)))
            setGroupLinks(prev => prev.filter(l => !linksToRemove.find(lr => lr.id === l.id)))
        } else {
            const toAdd = selectedMembers.filter(m => !memberIdsInGroup.includes(m.id))
            const links = await Promise.all(toAdd.map(m => addMemberToGroup(m.id, groupId)))
            setGroupLinks(prev => [...prev, ...links])
        }
    }

    useEffect(() => {
    setLoading(true)
    Promise.all([getMembersFull(), getPartners(), getLabs(), getGroups(), getGroupMembers()])
        .then(([m, p, l, g, gm]) => {
            setMembers(m)
            setPartners(p)
            setLabs(l)
            setGroups(g)
            setGroupLinks(gm) 
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
}, [])

    const availableStatuses = [...new Set(members.map(m => m.status))].sort()

    const filtered = members.filter(m => {
        const matchesQuery = !query.trim() ||
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
            m.position.toLowerCase().includes(query.toLowerCase()) ||
            m.email.toLowerCase().includes(query.toLowerCase())
        const matchesStatus  = statusFilter.length === 0 || statusFilter.includes(m.status)
        const matchesPartner = partnerFilter.length === 0 || partnerFilter.includes(m.partner_id)
        const matchesGroup = groupFilter.length === 0 || groupLinks.some(l => groupFilter.includes(l.group_id) && l.member_id === m.id)
        return matchesQuery && matchesStatus && matchesPartner && matchesGroup
    })

    function handleUpdated(updated: MemberFull) {
        setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))
        setSelected(updated)
    }

    function handleCreated(newMember: MemberFull) {
        setMembers(prev => [...prev, newMember])
        setShowCreate(false)
    }

    function handleDeleted(id: number) {
        setMembers(prev => prev.filter(m => m.id !== id))
        setSelected(null)
    }

    return (
        <div className="m-5 flex flex-col gap-4">

            {/* Barre + filtres + bouton */}
            <div className="flex items-center gap-3 flex-wrap">
                <Input
                    placeholder="Rechercher un contact..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="max-w-sm"
                />

                {/* Filtre statut — multi-select */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            statusFilter.length > 0
                                ? 'bg-foreground text-background border-foreground'
                                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                        }`}>
                            {statusFilter.length === 0
                                ? 'Tous les statuts'
                                : statusFilter.length === 1
                                    ? statusFilter[0]
                                    : `${statusFilter.length} statuts`
                            }
                            <ChevronDown size={12} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-52 p-2 flex flex-col gap-0.5">
                        {statusFilter.length > 0 && (
                            <>
                                <button
                                    onClick={() => setStatusFilter([])}
                                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-left"
                                >
                                    Tout déselectionner
                                </button>
                                <Separator className="my-1" />
                            </>
                        )}
                        {availableStatuses.map(s => (
                            <label
                                key={s}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                            >
                                <Checkbox
                                    checked={statusFilter.includes(s)}
                                    onCheckedChange={checked => setStatusFilter(prev =>
                                        checked ? [...prev, s] : prev.filter(x => x !== s)
                                    )}
                                />
                                {s}
                            </label>
                        ))}
                    </PopoverContent>
                </Popover>


                {/* Filtre partenaire — multi-select avec recherche */}
                <Popover onOpenChange={open => { if (!open) setPartnerSearch('') }}>
                    <PopoverTrigger asChild>
                        <button className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            partnerFilter.length > 0
                                ? 'bg-foreground text-background border-foreground'
                                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                        }`}>
                            {partnerFilter.length === 0
                                ? 'Tous les partenaires'
                                : partnerFilter.length === 1
                                    ? partners.find(p => p.id === partnerFilter[0])?.name ?? '1 partenaire'
                                    : `${partnerFilter.length} partenaires`
                            }
                            <ChevronDown size={12} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-2 flex flex-col gap-0.5">
                        <Input
                            placeholder="Rechercher..."
                            value={partnerSearch}
                            onChange={e => setPartnerSearch(e.target.value)}
                            className="h-7 text-xs mb-1"
                            autoFocus
                        />
                        {partnerFilter.length > 0 && (
                            <>
                                <button
                                    onClick={() => setPartnerFilter([])}
                                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-left"
                                >
                                    Tout déselectionner
                                </button>
                                <Separator className="my-1" />
                            </>
                        )}
                        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
                            {partners
                                .filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()))
                                .map(p => (
                                    <label
                                        key={p.id}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                                    >
                                        <Checkbox
                                            checked={partnerFilter.includes(p.id)}
                                            onCheckedChange={checked => setPartnerFilter(prev =>
                                                checked ? [...prev, p.id] : prev.filter(x => x !== p.id)
                                            )}
                                        />
                                        <span className="flex items-center gap-1.5">
                                            {p.color && (
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                            )}
                                            {p.name}
                                        </span>
                                    </label>
                                ))
                            }
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Filtre partenaire — multi-select avec recherche */}
                <Popover onOpenChange={open => { if (!open) { setGroupSearch(''); setConfirmDeleteGroupId(null) } }}>
                    <PopoverTrigger asChild>
                        <button className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            groupFilter.length > 0
                                ? 'bg-foreground text-background border-foreground'
                                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                        }`}>
                            {groupFilter.length === 0
                                ? 'Tous les groupes'
                                : groupFilter.length === 1
                                    ? groups.find(g => g.id === groupFilter[0])?.name ?? '1 groupe'
                                    : `${groupFilter.length} groupes`
                            }
                            <ChevronDown size={12} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-2 flex flex-col gap-0.5">
                        <Input
                            placeholder="Rechercher ou créer un groupe"
                            value={groupSearch}
                            onChange={e => setGroupSearch(e.target.value)}
                            className="h-7 text-xs mb-1"
                            autoFocus
                        />
                        {groupFilter.length > 0 && (
                            <>
                                <button
                                    onClick={() => setGroupFilter([])}
                                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-left"
                                >
                                    Tout déselectionner
                                </button>
                                <Separator className="my-1" />
                            </>
                        )}
                        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
                            {groups
                                .filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
                                .map(g => (
                                    <div key={g.id} className="flex items-center rounded hover:bg-muted group/item">
                                        {confirmDeleteGroupId === g.id ? (
                                            <div className="flex items-center gap-1 px-2 py-1 w-full">
                                                <span className="text-xs text-destructive flex-1">Supprimer ?</span>
                                                <button
                                                    onClick={() => setConfirmDeleteGroupId(null)}
                                                    className="text-xs px-1.5 py-0.5 rounded hover:bg-muted-foreground/20"
                                                >
                                                    Non
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGroup(g.id)}
                                                    className="text-xs px-1.5 py-0.5 rounded text-destructive hover:bg-destructive/10 font-medium"
                                                >
                                                    Oui
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs flex-1 min-w-0">
                                                    <Checkbox
                                                        checked={groupFilter.includes(g.id)}
                                                        onCheckedChange={checked => setGroupFilter(prev =>
                                                            checked ? [...prev, g.id] : prev.filter(x => x !== g.id)
                                                        )}
                                                    />
                                                    <span className="truncate">{g.name}</span>
                                                </label>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setConfirmDeleteGroupId(g.id) }}
                                                    className="opacity-0 group-hover/item:opacity-100 p-1 mr-1 rounded text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                                                >
                                                    <Trash size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))
                            }
                            {groupSearch.trim() && !groups.some(g => g.name.toLowerCase() === groupSearch.trim().toLowerCase()) && (
                                <button
                                    onClick={() => handleCreateGroup(groupSearch.trim())}
                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-muted text-xs text-muted-foreground hover:text-foreground w-full text-left"
                                >
                                    <Plus size={12} />
                                    Créer « {groupSearch.trim()} »
                                </button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <span className="text-sm text-muted-foreground flex-1">
                    {filtered.length} contact{filtered.length > 1 ? 's' : ''}
                </span>

            {multipleSelect ? (
                <Button size="sm" variant="outline" className="gap-1.5 rounded-md" onClick={() => { setMultipleSelect(false); setSelectedMembers([]) }}>
                    <X size={14} /> Terminer
                </Button>
            ) : (
                <Button size="sm" className="gap-1.5 rounded-md bg-transparent border border-border text-foreground hover:bg-muted" onClick={() => setMultipleSelect(true)}>
                    <ListChecks size={14} /> Sélection multiple
                </Button>
            )}

                <Button size="sm" className="gap-1.5 rounded-md" onClick={() => setShowCreate(true)}>
                    <Plus size={14} /> Nouveau contact
                </Button>
            </div>

            {error && <p className="text-sm text-destructive">Erreur : {error}</p>}

            {/* Grille */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading
                    ? [...Array(6)].map((_, i) => <MemberCardSkeleton key={i} />)
                    : filtered.map(member => (
                        <MemberCard
                            key={member.id}
                            member={member}
                            onClick={() => setSelected(member)}
                            selectOn= {multipleSelect}
                            selected={!!selectedMembers.find(m => m.id === member.id)}
                            onToggle={() => toggleMember(member)}
                            onDelete={handleDeleted}
                            selectedMembers={selectedMembers}
                            groups={groups}
                            groupLinks={groupLinks}
                            onToggleGroup={handleToggleGroup}
                            onToggleMultipleGroup={(groupId) => handleToggleMultipleGroup(groupId)}
                            onSelectAll={selectAll}
                        />
                    ))
                }
                {!loading && filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                        Aucun contact ne correspond à la recherche.
                    </p>
                )}
            </div>

            {/* Sheet consultation */}
            {selected && (
                <MemberDetailSheet
                    member={selected}
                    partners={partners}
                    labs={labs}
                    open={!!selected}
                    onClose={() => setSelected(null)}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                />
            )}

            {/* Sheet création */}
            <Sheet open={showCreate} onOpenChange={v => { if (!v) setShowCreate(false) }}>
                <SheetContent side="right" showCloseButton={false} className="!w-[480px] p-0">
                    <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                        <SheetTitle>Nouveau contact</SheetTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreate(false)}>
                            <X size={14} />
                        </Button>
                    </SheetHeader>
                    <MemberFormSheet
                        mode="create"
                        partners={partners}
                        labs={labs}
                        onCreated={handleCreated}
                        onClose={() => setShowCreate(false)}
                    />
                </SheetContent>
            </Sheet>

            {/* Floating selection bar */}
            {multipleSelect && selectedMembers.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-full bg-foreground text-background shadow-xl">
                    {confirmingDelete ? (
                        <>
                            <span className="text-sm px-2">Supprimer {selectedMembers.length} contact{selectedMembers.length > 1 ? 's' : ''} ?</span>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => setConfirmingDelete(false)}>Annuler</Button>
                            <Button variant="ghost" size="sm" className="h-7 rounded-full text-red-400 hover:text-red-300 hover:bg-white/10" onClick={handleDeleteSelected}>Confirmer</Button>
                        </>
                    ) : (
                        <>
                            <span className="text-sm font-medium px-2">{selectedMembers.length} sélectionné{selectedMembers.length > 1 ? 's' : ''}</span>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={selectAll}>
                                <ListChecks size={13} /> Tout sélectionner
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={copyEmailsGroup}>
                                <CopyIcon size={13} /> Copier emails
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={copyMembersGroup}>
                                <ShareIcon size={13} /> Partager
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => exportToCsv(
                                'contacts.csv',
                                ['Prénom', 'Nom', 'Poste', 'Email', 'Téléphone', 'Statut', 'Partenaire', 'Laboratoire'],
                                selectedMembers.map(m => [m.first_name, m.last_name, m.position, m.email, m.tel, m.status, m.partner?.name ?? '', m.lab?.name ?? ''])
                            )}>
                                <FileDown size={13} /> Exporter en CSV
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full text-red-400 hover:text-red-300 hover:bg-white/10" onClick={() => setConfirmingDelete(true)}>
                                <Trash size={13} /> Supprimer
                            </Button>
                            <div className="w-px h-4 bg-background/20 mx-1" />
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-background hover:text-background hover:bg-white/10" onClick={() => { setMultipleSelect(false); setSelectedMembers([]) }}>
                                <X size={13} />
                            </Button>
                        </>
                    )}
                </div>
            )}

        </div>
    )
}
