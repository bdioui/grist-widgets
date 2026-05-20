import { useEffect, useState } from 'react'
import { getPartnerCardsFull, addPartner, updatePartner, deletePartner } from '@/lib/api'
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
import { Plus, Pencil, X, ChevronDown, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { PartnerCardFull, Partner } from '@/lib/types'

// --- Constantes ---

const PARTNER_TYPES = [
    'Université',
    'Entreprise privée',
    'Association',
    'Établissement public',
    'Collectivité',
    'Fondation',
    'Autre',
]

const PALETTE = [
    { label: 'Lavande', hexa: '#D8CFEE' },
    { label: 'Rose',    hexa: '#EEC5EF' },
    { label: 'Jaune',   hexa: '#EDD803' },
    { label: 'Gris',    hexa: '#E7E8E2' },
    { label: 'Bleu',    hexa: '#C5D2EF' },
]

type PartnerForm = {
    name:        string
    description: string
    color:       string
    logo:        string
    type:        string
    status_id:   number
}

const EMPTY_FORM: PartnerForm = {
    name:        '',
    description: '',
    color:       '#E7E8E2',
    logo:        '',
    type:        'Université',
    status_id:   1,
}

// --- Sheet création / édition ---

type PartnerSheetProps =
    | { mode: 'create'; onCreated: (p: Partner) => void; onClose: () => void }
    | { mode: 'edit';   partner: PartnerCardFull; onUpdated: (p: PartnerCardFull) => void; onClose: () => void }

function PartnerFormSheet(props: PartnerSheetProps) {
    const isEdit = props.mode === 'edit'
    const [form, setForm] = useState<PartnerForm>(
        isEdit
            ? {
                name:        props.partner.name,
                description: props.partner.description,
                color:       props.partner.color,
                logo:        props.partner.logo,
                type:        props.partner.type,
                status_id:   props.partner.status_id,
            }
            : EMPTY_FORM
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
                        <button
                            key={c.hexa}
                            title={c.label}
                            onClick={() => setField('color', c.hexa)}
                            className="w-7 h-7 rounded-full border-2 transition-all"
                            style={{
                                backgroundColor: c.hexa,
                                borderColor: form.color === c.hexa ? '#000' : 'transparent',
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Logo (URL)</Label>
                <Input value={form.logo} onChange={e => setField('logo', e.target.value)} placeholder="https://..." />
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

// --- Sheet de consultation ---

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

                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        {partner.color && (
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: partner.color }} />
                        )}
                        <SheetTitle className="text-base truncate">{partner.name}</SheetTitle>
                        <Badge variant="outline" className="text-xs shrink-0">{partner.type}</Badge>
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

                {/* Formulaire d'édition */}
                {editing && (
                    <>
                        <PartnerFormSheet
                            mode="edit"
                            partner={partner}
                            onUpdated={p => { onUpdated(p); setEditing(false) }}
                            onClose={() => setEditing(false)}
                        />
                        <Separator />
                    </>
                )}

                {/* Contenu */}
                <div className="flex flex-col gap-5 px-6 py-5">

                    {/* Description */}
                    {partner.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{partner.description}</p>
                    )}

                    <Separator />

                    {/* Membres */}
                    <section className="flex flex-col gap-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Membres — {partner.members.length}
                        </p>
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
                                            {m.email && (
                                                <a href={`mailto:${m.email}`} className="text-xs text-blue-600 hover:underline truncate max-w-32">
                                                    {m.email}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <Separator />

                    {/* Projets & conventions groupées */}
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

                                            {/* En-tête projet */}
                                            <div className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                                                <span className="text-sm font-medium">{p.title}</span>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                                    {p.budget > 0 && <span>{p.budget.toLocaleString('fr-FR')} €</span>}
                                                    {p.budget > 0 && p.grant > 0 && (
                                                        <span className="text-green-600">{Math.round((p.grant / p.budget) * 100)} %</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Conventions du projet */}
                                            {projectAgreements.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic pl-4">Aucune convention</p>
                                            ) : (
                                                <div className="flex flex-col gap-0.5 pl-4 border-l-2 ml-3" style={{ borderColor: 'hsl(var(--border))' }}>
                                                    {projectAgreements.map(a => (
                                                        <div key={a.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted">
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm">{a.title}</span>
                                                                {a.signed_date && (
                                                                    <span className="text-xs text-muted-foreground">Signé le {a.signed_date}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-4">
                                                                {a.budget > 0 && <span>{a.budget.toLocaleString('fr-FR')} €</span>}
                                                                {a.budget > 0 && a.grant > 0 && (
                                                                    <span className="text-green-600">{Math.round((a.grant / a.budget) * 100)} %</span>
                                                                )}
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

// --- Carte partenaire ---

function PartnerCard({ partner, onClick }: { partner: PartnerCardFull; onClick: () => void }) {
    const totalBudget = partner.agreements.reduce((sum, a) => sum + a.budget, 0)
    const totalGrant  = partner.agreements.reduce((sum, a) => sum + a.grant,  0)
    const rate        = totalBudget > 0 ? Math.round((totalGrant / totalBudget) * 100) : null

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm leading-snug">{partner.name}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">{partner.type}</Badge>
                </div>
                <CardDescription className="text-xs line-clamp-2">{partner.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 pt-0">

                {/* Membres */}
                {partner.members.length > 0 && (
                    <div className="flex items-center gap-2">
                        <AvatarGroup>
                            {partner.members.slice(0, 4).map(m => (
                                <Avatar key={m.id}>
                                    <AvatarImage src={m.profile_image} alt={`${m.first_name} ${m.last_name}`} />
                                    <AvatarFallback>{m.first_name[0]}{m.last_name[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                            {partner.members.length > 4 && (
                                <AvatarGroupCount>+{partner.members.length - 4}</AvatarGroupCount>
                            )}
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
                                        <span className="text-muted-foreground ml-1">— {m.position}</span>
                                    </div>
                                ))}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}

                {/* Montants + projets/conventions */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {partner.projects.length > 0 && (
                            <span>{partner.projects.length} projet{partner.projects.length > 1 ? 's' : ''}</span>
                        )}
                        {partner.agreements.length > 0 && (
                            <span>{partner.agreements.length} convention{partner.agreements.length > 1 ? 's' : ''}</span>
                        )}
                        {partner.projects.length === 0 && partner.agreements.length === 0 && (
                            <span className="italic">Aucun projet lié</span>
                        )}
                    </div>
                    {totalBudget > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="font-medium text-foreground cursor-default">
                                    {totalGrant.toLocaleString('fr-FR')} €
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="flex flex-col gap-1">
                                <div className="text-xs whitespace-nowrap">
                                    Budget total : <span className="font-medium">{totalBudget.toLocaleString('fr-FR')} €</span>
                                </div>
                                <div className="text-xs whitespace-nowrap">
                                    Subvention : <span className="font-medium">{totalGrant.toLocaleString('fr-FR')} €</span>
                                </div>
                                {rate !== null && (
                                    <div className="text-xs whitespace-nowrap">
                                        Taux financé : <span className="font-medium text-green-600">{rate} %</span>
                                    </div>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

            </CardContent>
        </Card>
    )
}

// --- Skeleton ---

function PartnerCardSkeleton() {
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

// --- Page principale ---

export default function Partners() {
    const [partners, setPartners]         = useState<PartnerCardFull[]>([])
    const [loading, setLoading]           = useState(false)
    const [error, setError]               = useState('')
    const [query, setQuery]               = useState('')
    const [typeFilter, setTypeFilter]     = useState<string[]>([])
    const [selected, setSelected]         = useState<PartnerCardFull | null>(null)
    const [showCreate, setShowCreate]     = useState(false)

    useEffect(() => {
        setLoading(true)
        getPartnerCardsFull()
            .then(setPartners)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const availableTypes = [...new Set(partners.map(p => p.type))].sort()

    const filtered = partners.filter(p => {
        const matchesQuery = !query.trim() ||
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
        const matchesType = typeFilter.length === 0 || typeFilter.includes(p.type)
        return matchesQuery && matchesType
    })

    function handleUpdated(updated: PartnerCardFull) {
        setPartners(prev => prev.map(p => p.id === updated.id ? updated : p))
        setSelected(updated)
    }

    function handleCreated(newPartner: Partner) {
        const full: PartnerCardFull = { ...newPartner, members: [], projects: [], agreements: [] }
        setPartners(prev => [...prev, full])
        setShowCreate(false)
    }

    function handleDeleted(id: number) {
        setPartners(prev => prev.filter(p => p.id !== id))
        setSelected(null)
    }

    return (
        <div className="m-5 flex flex-col gap-4">

            {/* Barre de recherche + filtres + bouton créer */}
            <div className="flex items-center gap-3 flex-wrap">
                <Input
                    placeholder="Rechercher un partenaire..."
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
                            {typeFilter.length === 0
                                ? 'Tous les types'
                                : typeFilter.length === 1
                                    ? typeFilter[0]
                                    : `${typeFilter.length} types`
                            }
                            <ChevronDown size={12} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-52 p-2 flex flex-col gap-0.5">
                        {typeFilter.length > 0 && (
                            <>
                                <button
                                    onClick={() => setTypeFilter([])}
                                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-left"
                                >
                                    Tout déselectionner
                                </button>
                                <Separator className="my-1" />
                            </>
                        )}
                        {availableTypes.map(type => (
                            <label
                                key={type}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                            >
                                <Checkbox
                                    checked={typeFilter.includes(type)}
                                    onCheckedChange={checked => setTypeFilter(prev =>
                                        checked ? [...prev, type] : prev.filter(t => t !== type)
                                    )}
                                />
                                {type}
                            </label>
                        ))}
                    </PopoverContent>
                </Popover>
                <span className="text-sm text-muted-foreground flex-1">
                    {filtered.length} partenaire{filtered.length > 1 ? 's' : ''}
                </span>
                <Button size="sm" className="gap-1.5 rounded-md" onClick={() => setShowCreate(true)}>
                    <Plus size={14} /> Nouveau partenaire
                </Button>
            </div>

            {error && <p className="text-sm text-destructive">Erreur : {error}</p>}

            {/* Grille */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading
                    ? [...Array(6)].map((_, i) => <PartnerCardSkeleton key={i} />)
                    : filtered.map(partner => (
                        <PartnerCard
                            key={partner.id}
                            partner={partner}
                            onClick={() => setSelected(partner)}
                        />
                    ))
                }
                {!loading && filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                        Aucun partenaire ne correspond à la recherche.
                    </p>
                )}
            </div>

            {/* Sheet consultation / édition */}
            {selected && (
                <PartnerDetailSheet
                    partner={selected}
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
                        <SheetTitle>Nouveau partenaire</SheetTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setShowCreate(false)}>
                            <X size={14} />
                        </Button>
                    </SheetHeader>
                    <PartnerFormSheet
                        mode="create"
                        onCreated={handleCreated}
                        onClose={() => setShowCreate(false)}
                    />
                </SheetContent>
            </Sheet>

        </div>
    )
}
