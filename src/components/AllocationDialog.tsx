import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import SearchInput from '@/components/SearchInput'
import { splitCents } from '@/lib/utils'
import type { Allocation, Expanse, Project } from '@/lib/types'

// Le champ est saisi en texte : « 12, » ou « - » doivent pouvoir exister pendant la frappe.
type Row = { project_id: number; amount: string }

type Props = {
    open: boolean
    expanse: Pick<Expanse, 'id' | 'title' | 'amount'> | null
    projects: Project[]
    initialParts: Allocation[]
    // Projet ajouté d'office : le rattachement depuis la fiche projet part de là.
    initialProjectId?: number
    onSave: (parts: Allocation[]) => Promise<void> | void
    onClose: () => void
}

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 })

// Tout le calcul passe par des centimes entiers : en flottant 0,1 + 0,2 n'est pas
// 0,3, et la contrainte « somme des parts = montant » doit être exacte.
const toCents = (x: number) => Math.round(x * 100)
const fromCents = (c: number) => (c / 100).toFixed(2)
const parseCents = (raw: string) => toCents(parseFloat(raw.replace(',', '.')) || 0)

type FormProps = Omit<Props, 'open' | 'expanse'> & { expanse: Pick<Expanse, 'id' | 'title' | 'amount'> }

// Radix ne monte son contenu qu'à l'ouverture : ce formulaire repart donc d'un état
// neuf à chaque fois, et initialise ses lignes depuis les props sans passer par un effet.
function AllocationForm({ expanse, projects, initialParts, initialProjectId, onSave, onClose }: FormProps) {
    const totalCents = toCents(expanse.amount)

    const [rows, setRows] = useState<Row[]>(() => {
        const base: Row[] = initialParts.map(p => ({ project_id: p.project_id, amount: fromCents(toCents(p.amount)) }))
        if (initialProjectId != null && !base.some(r => r.project_id === initialProjectId)) {
            const rest = totalCents - base.reduce((s, r) => s + parseCents(r.amount), 0)
            base.push({ project_id: initialProjectId, amount: fromCents(rest) })
        }
        return base
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects])

    const allocatedCents = rows.reduce((s, r) => s + parseCents(r.amount), 0)
    const remainingCents = totalCents - allocatedCents
    // Aucune ligne est permis : la dépense n'est alors affectée à aucun projet.
    const balanced = rows.length === 0 || remainingCents === 0
    const available = projects.filter(p => !rows.some(r => r.project_id === p.id))

    // Un projet ajouté reçoit d'emblée ce qu'il reste à répartir : le premier prend 100 %.
    function addProject(p: Project) {
        setRows(prev => {
            const rest = totalCents - prev.reduce((s, r) => s + parseCents(r.amount), 0)
            return [...prev, { project_id: p.id, amount: fromCents(rest) }]
        })
    }

    function setAmount(projectId: number, amount: string) {
        setRows(prev => prev.map(r => r.project_id === projectId ? { ...r, amount } : r))
    }

    function removeProject(projectId: number) {
        setRows(prev => prev.filter(r => r.project_id !== projectId))
    }

    // « = reste » : cette ligne absorbe ce que les autres ne couvrent pas.
    function fillRest(projectId: number) {
        setRows(prev => {
            const others = prev.filter(r => r.project_id !== projectId).reduce((s, r) => s + parseCents(r.amount), 0)
            return prev.map(r => r.project_id === projectId ? { ...r, amount: fromCents(totalCents - others) } : r)
        })
    }

    function splitEvenly() {
        const parts = splitCents(totalCents, rows.length)
        setRows(prev => prev.map((r, i) => ({ ...r, amount: fromCents(parts[i]) })))
    }

    async function handleSave() {
        setSaving(true)
        setError(null)
        try {
            await onSave(rows.map(r => ({ project_id: r.project_id, amount: parseCents(r.amount) / 100 })))
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : "L'enregistrement a échoué")
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Répartir la dépense</DialogTitle>
                <DialogDescription>
                    {expanse.title} — {eur.format(totalCents / 100)}
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 py-1">
                {rows.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                        Aucun projet : la dépense n'est affectée à aucun projet.
                    </p>
                )}

                {rows.map(r => (
                    <div key={r.project_id} className="flex items-center gap-2">
                        <span className="flex-1 min-w-0 truncate text-sm">
                            {projectMap.get(r.project_id)?.title ?? `Projet n°${r.project_id}`}
                        </span>
                        <Input
                            type="number"
                            step="0.01"
                            value={r.amount}
                            onChange={e => setAmount(r.project_id, e.target.value)}
                            className="h-8 w-32 text-right text-xs"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground"
                            title="Compléter avec ce qu'il reste à répartir"
                            onClick={() => fillRest(r.project_id)}
                        >
                            = reste
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeProject(r.project_id)}
                        >
                            <X size={13} />
                        </Button>
                    </div>
                ))}

                <div className="flex items-center gap-2 pt-1">
                    <SearchInput
                        data={available}
                        onSelect={addProject}
                        getLabel={p => p.title}
                        placeholder="Ajouter un projet…"
                        dropdownClassName="min-w-[320px]"
                    />
                    {rows.length >= 2 && (
                        <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" onClick={splitEvenly}>
                            Parts égales
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-xs">
                <span className="text-muted-foreground">
                    Alloué {eur.format(allocatedCents / 100)} sur {eur.format(totalCents / 100)}
                </span>
                {rows.length > 0 && (
                    <span className={remainingCents === 0 ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                        {remainingCents === 0 ? 'Réparti' : `Reste ${eur.format(remainingCents / 100)}`}
                    </span>
                )}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <DialogFooter className="gap-2">
                <Button className='rounded-md' variant="outline" size="sm" onClick={onClose} disabled={saving}>Annuler</Button>
                <Button className='rounded-md' size="sm" onClick={handleSave} disabled={!balanced || saving}>
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
            </DialogFooter>
        </>
    )
}

export default function AllocationDialog({ open, expanse, onClose, ...rest }: Props) {
    return (
        <Dialog open={open && !!expanse} onOpenChange={o => { if (!o) onClose() }}>
            <DialogContent className="sm:max-w-xl">
                {expanse && <AllocationForm expanse={expanse} onClose={onClose} {...rest} />}
            </DialogContent>
        </Dialog>
    )
}
