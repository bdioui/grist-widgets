import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Download, Loader2 } from 'lucide-react'
import { getMembersFull, getPartners, getProjects, getFinancialAgreements } from '@/lib/api'
import type { MemberFull, Partner, Project, FinancialAgreement } from '@/lib/types'

// --- Config des colonnes par table ---

type Column = { key: string; label: string }
type Row = Record<string, string>

type TableConfig = {
    id: string
    label: string
    columns: Column[]
    load: () => Promise<Row[]>
}

function flattenMembers(members: MemberFull[]): Row[] {
    return members.map(m => ({
        first_name:  m.first_name,
        last_name:   m.last_name,
        position:    m.position,
        email:       m.email,
        tel:         m.tel,
        genre:       m.genre,
        status:      m.status,
        partner:     m.partner?.name ?? '',
        lab:         m.lab?.name ?? '',
    }))
}

function flattenPartners(partners: Partner[]): Row[] {
    return partners.map(p => ({
        name:        p.name,
        type:        p.type,
        description: p.description,
        consortium:  p.consortium ? 'Oui' : 'Non',
    }))
}

function flattenProjects(projects: Project[]): Row[] {
    return projects.map(p => ({
        title:       p.title,
        description: p.description,
        budget:      String(p.budget),
        grant:       String(p.grant),
    }))
}

function flattenAgreements(agreements: FinancialAgreement[]): Row[] {
    return agreements.map(a => ({
        title:       a.title,
        description: a.description,
        budget:      String(a.budget),
        grant:       String(a.grant),
        signed_date: a.signed_date,
    }))
}

const TABLE_CONFIGS: TableConfig[] = [
    {
        id: 'contacts',
        label: 'Contacts',
        columns: [
            { key: 'first_name', label: 'Prénom' },
            { key: 'last_name',  label: 'Nom' },
            { key: 'position',   label: 'Poste' },
            { key: 'email',      label: 'Email' },
            { key: 'tel',        label: 'Téléphone' },
            { key: 'genre',      label: 'Genre' },
            { key: 'status',     label: 'Statut' },
            { key: 'partner',    label: 'Partenaire' },
            { key: 'lab',        label: 'Laboratoire' },
        ],
        load: () => getMembersFull().then(flattenMembers),
    },
    {
        id: 'partenaires',
        label: 'Partenaires',
        columns: [
            { key: 'name',        label: 'Nom' },
            { key: 'type',        label: 'Type' },
            { key: 'description', label: 'Description' },
            { key: 'consortium',  label: 'Consortium' },
        ],
        load: () => getPartners().then(flattenPartners),
    },
    {
        id: 'projets',
        label: 'Projets',
        columns: [
            { key: 'title',       label: 'Titre' },
            { key: 'description', label: 'Description' },
            { key: 'budget',      label: 'Budget' },
            { key: 'grant',       label: 'Subvention' },
        ],
        load: () => getProjects().then(flattenProjects),
    },
    {
        id: 'conventions',
        label: 'Conventions',
        columns: [
            { key: 'title',       label: 'Titre' },
            { key: 'description', label: 'Description' },
            { key: 'budget',      label: 'Budget' },
            { key: 'grant',       label: 'Subvention' },
            { key: 'signed_date', label: 'Date de signature' },
        ],
        load: () => getFinancialAgreements().then(flattenAgreements),
    },
]

// --- Export CSV ---

function downloadCSV(filename: string, columns: Column[], rows: Row[]) {
    const header = columns.map(c => `"${c.label}"`).join(',')
    const body = rows.map(row =>
        columns.map(c => `"${(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [header, ...body].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

// --- Panneau d'une table ---

function TablePanel({ config }: { config: TableConfig }) {
    const [rows, setRows]             = useState<Row[]>([])
    const [loading, setLoading]       = useState(true)
    const [selected, setSelected]     = useState<Set<string>>(
        () => new Set(config.columns.map(c => c.key))
    )

    useEffect(() => {
        setLoading(true)
        config.load()
            .then(setRows)
            .finally(() => setLoading(false))
    }, [config.id])

    function toggleColumn(key: string) {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }

    function toggleAll() {
        if (selected.size === config.columns.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(config.columns.map(c => c.key)))
        }
    }

    const activeColumns = config.columns.filter(c => selected.has(c.key))
    const previewRows   = rows.slice(0, 10)

    return (
        <div className="flex flex-col gap-4">

            {/* Sélection des colonnes */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colonnes</span>
                    <button
                        onClick={toggleAll}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        {selected.size === config.columns.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {config.columns.map(col => (
                        <label
                            key={col.key}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer transition-colors ${
                                selected.has(col.key)
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'border-border text-muted-foreground hover:border-foreground'
                            }`}
                        >
                            <Checkbox
                                checked={selected.has(col.key)}
                                onCheckedChange={() => toggleColumn(col.key)}
                                className="hidden"
                            />
                            {col.label}
                        </label>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Preview */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Aperçu — {rows.length} ligne{rows.length > 1 ? 's' : ''}
                    </span>
                    <Button
                        size="sm"
                        className="h-7 gap-1.5"
                        disabled={activeColumns.length === 0 || loading}
                        onClick={() => downloadCSV(`${config.id}.csv`, activeColumns, rows)}
                    >
                        <Download size={13} />
                        Exporter CSV
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 size={16} className="animate-spin mr-2" /> Chargement...
                    </div>
                ) : activeColumns.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Sélectionne au moins une colonne.</p>
                ) : (
                    <div className="overflow-x-auto rounded border border-border">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    {activeColumns.map(col => (
                                        <th key={col.key} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.map((row, i) => (
                                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                        {activeColumns.map(col => (
                                            <td key={col.key} className="px-3 py-2 max-w-[200px] truncate">
                                                {row[col.key] || <span className="text-muted-foreground italic">—</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rows.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center py-2 border-t border-border">
                                + {rows.length - 10} ligne{rows.length - 10 > 1 ? 's' : ''} non affichées
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Modal principal ---

export default function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
            <DialogContent className="!max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Exporter les données</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="contacts" className="flex flex-col gap-4">
                    <TabsList className="flex flex-row w-fit bg-muted p-1 rounded-lg">
                        {TABLE_CONFIGS.map(t => (
                            <TabsTrigger
                                key={t.id}
                                value={t.id}
                                className="rounded-md px-4 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground"
                            >
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {TABLE_CONFIGS.map(t => (
                        <TabsContent key={t.id} value={t.id}>
                            <TablePanel config={t} />
                        </TabsContent>
                    ))}
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
