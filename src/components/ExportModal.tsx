import { useEffect, useState, useMemo } from 'react'
import {
    getMembers, getPartners, getLabs, getProjects, getProjectCalls,
    getAxes, getFinancialAgreements, getFormations,
    getAllProjectMembers, getProjectPartners, getPartnerLabs,
    getAllTablesRaw,
} from '@/lib/api'
import {
    type DB, type QueryableTableKey, type FieldType,
    SCHEMA, TABLE_FIELDS, QUERYABLE_TABLES, traverse,
} from '@/lib/querySchema'

import {Checkbox} from '../components/ui/checkbox'
import JSZip from 'jszip'





// ── Types ──────────────────────────────────────────────────────────────────

type Operator =
    | 'contains' | 'equals' | 'starts_with'
    | 'gt' | 'lt' | 'gte' | 'lte'
    | 'is_true' | 'is_false'
    | 'before' | 'after'

type Filter = {
    id:          string
    targetTable: QueryableTableKey
    field:       string
    operator:    Operator
    value:       string
}

const OPERATORS: Record<FieldType, { value: Operator; label: string }[]> = {
    string:  [
        { value: 'contains',    label: 'contient' },
        { value: 'equals',      label: '=' },
        { value: 'starts_with', label: 'commence par' },
    ],
    number:  [
        { value: 'equals', label: '=' },
        { value: 'gt',     label: '>' },
        { value: 'lt',     label: '<' },
        { value: 'gte',    label: '>=' },
        { value: 'lte',    label: '<=' },
    ],
    boolean: [
        { value: 'is_true',  label: 'est vrai' },
        { value: 'is_false', label: 'est faux' },
    ],
    date: [
        { value: 'equals', label: '=' },
        { value: 'after',  label: 'après' },
        { value: 'before', label: 'avant' },
    ],
    enum: [
        { value: 'equals', label: '=' },
    ],
}

// ── Moteur de filtrage ─────────────────────────────────────────────────────

function matchesFilter(record: Record<string, unknown>, filter: Filter): boolean {
    const val  = record[filter.field]
    const fval = filter.value.trim()
    switch (filter.operator) {
        case 'contains':    return String(val ?? '').toLowerCase().includes(fval.toLowerCase())
        case 'equals':      return String(val ?? '') === fval
        case 'starts_with': return String(val ?? '').toLowerCase().startsWith(fval.toLowerCase())
        case 'gt':          return Number(val) > Number(fval)
        case 'lt':          return Number(val) < Number(fval)
        case 'gte':         return Number(val) >= Number(fval)
        case 'lte':         return Number(val) <= Number(fval)
        case 'is_true':     return val === true || val === 1
        case 'is_false':    return val === false || val === 0
        case 'before':      return String(val ?? '') < fval
        case 'after':       return String(val ?? '') > fval
        default:            return true
    }
}

// Les valeurs non scalaires (RefList Grist ['L', 1, 2], objets) passent en JSON
// pour rester relisibles au lieu de devenir "L,1,2" ou "[object Object]".
function toCell(v: unknown): string {
    if (v === null || v === undefined) return ''
    return typeof v === 'object' ? JSON.stringify(v) : String(v)
}

async function backupDB() {
    const zip = new JSZip()
    const tables = await getAllTablesRaw()

    for (const [table, rows] of Object.entries(tables)) {
        if (rows.length === 0) continue

        // Union des clés : une ligne mock peut omettre un champ optionnel
        const headers = [...new Set(rows.flatMap(r => Object.keys(r)))]
        const csv = [headers, ...rows.map(r => headers.map(h => toCell(r[h])))]
            .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
            .join('\n')

        zip.file(`${table}.csv`, '\uFEFF' + csv)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(a.href)
}

function applyFilters(
    db: DB,
    rootTable: QueryableTableKey,
    filters: Filter[],
): Record<string, unknown>[] {
    let results = db[rootTable] as Record<string, unknown>[]

    for (const filter of filters) {
        const isBool = filter.operator === 'is_true' || filter.operator === 'is_false'
        if (!filter.field || (!filter.value && !isBool)) continue

        if (filter.targetTable === rootTable) {
            // Filtre direct sur la table racine
            results = results.filter(r => matchesFilter(r, filter))
        } else {
            // Filtre croisé : traverse jusqu'à la table cible puis vérifie le prédicat
            const path = SCHEMA[rootTable]?.[filter.targetTable]
            if (!path) continue
            results = results.filter(root => {
                const reached = traverse([root], path, db)
                return reached.some(r => matchesFilter(r, filter))
            })
        }
    }

    return results
}

// ── Colonnes ───────────────────────────────────────────────────────────────

// Une colonne lit un champ de la table racine ou d'une table jointe.
// Pour une table jointe, plusieurs enregistrements peuvent être atteints :
// leurs valeurs sont dédoublonnées puis concaténées dans une seule cellule.
type Column = {
    key:   string
    label: string
    table: QueryableTableKey
    field: string
}

// Colonne croisée ajoutée par l'utilisateur ; `id` sert de clé React.
type ExtraColumn = {
    id:    string
    table: QueryableTableKey
    field: string
}

function cellValue(
    db: DB,
    rootTable: QueryableTableKey,
    root: Record<string, unknown>,
    col: Column,
): string {
    if (col.table === rootTable) return toCell(root[col.field])

    const path = SCHEMA[rootTable]?.[col.table]
    if (!path) return ''
    const values = traverse([root], path, db)
        .map(r => toCell(r[col.field]))
        .filter(v => v !== '')
    return [...new Set(values)].join(' ; ')
}

// ── Export CSV ─────────────────────────────────────────────────────────────

function downloadCSV(
    db:        DB,
    results:   Record<string, unknown>[],
    columns:   Column[],
    tableName: QueryableTableKey,
) {
    const header = columns.map(c => c.label)
    const rows   = results.map(r => columns.map(c => cellValue(db, tableName, r, c)))
    const csv    = [header, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `export_${tableName}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

// ── Composant ──────────────────────────────────────────────────────────────

export default function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [db, setDb]                   = useState<DB | null>(null)
    const [rootTable, setRootTable]     = useState<QueryableTableKey>('members')
    const [filters, setFilters]         = useState<Filter[]>([])
    const [selectedFields, setSelected] = useState<string[]>([])
    const [extraColumns, setExtra]      = useState<ExtraColumn[]>([])

    // Chargement unique de toutes les tables
    useEffect(() => {
        Promise.all([
            getMembers(), getPartners(), getLabs(), getProjects(),
            getProjectCalls(), getAxes(), getFinancialAgreements(), getFormations(),
            getAllProjectMembers(), getProjectPartners(), getPartnerLabs(),
        ]).then(([members, partners, labs, projects, projectCalls, axes,
                  agreements, formations, projectMembers, projectPartners, partnerLabs]) => {
            setDb({ members, partners, labs, projects, projectCalls, axes,
                    agreements, formations, projectMembers, projectPartners, partnerLabs })
        })
    }, [])

    // Reset filtres et colonnes quand on change de table racine
    useEffect(() => {
        setFilters([])
        setExtra([])
        setSelected((TABLE_FIELDS[rootTable] ?? []).map(f => f.key))
    }, [rootTable])

    const rootFields = TABLE_FIELDS[rootTable] ?? []

    // Tables joignables depuis la table racine (pour le select de filtre)
    const joinableTables = useMemo(() => [
        QUERYABLE_TABLES.find(t => t.key === rootTable)!,
        ...QUERYABLE_TABLES.filter(t => t.key !== rootTable && SCHEMA[rootTable]?.[t.key]),
    ], [rootTable])

    // Colonnes dans l'ordre d'export : champs racine cochés, puis colonnes croisées
    const columns = useMemo<Column[]>(() => [
        ...rootFields
            .filter(f => selectedFields.includes(f.key))
            .map(f => ({ key: f.key, label: f.label, table: rootTable, field: f.key })),
        ...extraColumns.map(c => {
            const tableLabel = QUERYABLE_TABLES.find(t => t.key === c.table)?.label ?? c.table
            const fieldLabel = TABLE_FIELDS[c.table]?.find(f => f.key === c.field)?.label ?? c.field
            return { key: c.id, label: `${tableLabel} · ${fieldLabel}`, table: c.table, field: c.field }
        }),
    ], [rootFields, rootTable, selectedFields, extraColumns])

    // Résultats calculés à chaque changement de filtre
    const results = useMemo(() =>
        db ? applyFilters(db, rootTable, filters) : [],
    [db, rootTable, filters])

    // ── Handlers filtres ──────────────────────────────────────────────────

    function addFilter() {
        const firstField = TABLE_FIELDS[rootTable]?.[0]
        if (!firstField) return
        setFilters(prev => [...prev, {
            id:          crypto.randomUUID(),
            targetTable: rootTable,
            field:       firstField.key,
            operator:    OPERATORS[firstField.type][0].value,
            value:       '',
        }])
    }

    function updateFilter(id: string, patch: Partial<Filter>) {
        setFilters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
    }

    function removeFilter(id: string) {
        setFilters(prev => prev.filter(f => f.id !== id))
    }

    // ── Handlers colonnes croisées ────────────────────────────────────────

    const crossTables = joinableTables.filter(t => t.key !== rootTable)

    function addExtraColumn() {
        const table = crossTables[0]?.key
        const field = table && TABLE_FIELDS[table]?.[0]?.key
        if (!table || !field) return
        setExtra(prev => [...prev, { id: crypto.randomUUID(), table, field }])
    }

    function updateExtraColumn(id: string, patch: Partial<ExtraColumn>) {
        setExtra(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    }

    function removeExtraColumn(id: string) {
        setExtra(prev => prev.filter(c => c.id !== id))
    }

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">Requête & Export</h2>
                    <button
                        onClick={() => backupDB()}
                        className="text-xs px-1.5 py-1.5 bg-gray-100 text-black rounded-md hover:bg-indigo-300 disabled:opacity-40 hover-text-indigo-700 disabled:cursor-not-allowed transition-colors"
                    >
                        Exporter toute la base
                    </button>
                   
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">

                    {/* Table racine */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Table racine
                        </span>
                        <div className="flex gap-2 flex-wrap">
                            {QUERYABLE_TABLES.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setRootTable(t.key)}
                                    className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                        rootTable === t.key
                                            ? 'bg-black text-white'
                                            : 'border-gray-200 text-gray-500 hover:border-indigo-500 hover:text-indigo-600'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Filtres
                        </span>

                        {filters.map(filter => {
                            const targetFields  = TABLE_FIELDS[filter.targetTable] ?? []
                            const currentField  = targetFields.find(f => f.key === filter.field)
                            const ops           = currentField ? OPERATORS[currentField.type] : []
                            const isBool        = currentField?.type === 'boolean'
                            const isEnum        = currentField?.type === 'enum'

                            return (
                                <div key={filter.id} className="flex items-center gap-2 flex-wrap">

                                    {/* Table cible */}
                                    <select
                                        value={filter.targetTable}
                                        onChange={e => {
                                            const tbl       = e.target.value as QueryableTableKey
                                            const firstField = TABLE_FIELDS[tbl]?.[0]
                                            updateFilter(filter.id, {
                                                targetTable: tbl,
                                                field:       firstField?.key ?? '',
                                                operator:    firstField ? OPERATORS[firstField.type][0].value : 'contains',
                                                value:       '',
                                            })
                                        }}
                                        className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-white"
                                    >
                                        {joinableTables.map(t => (
                                            <option key={t.key} value={t.key}>{t.label}</option>
                                        ))}
                                    </select>

                                    {/* Champ */}
                                    <select
                                        value={filter.field}
                                        onChange={e => {
                                            const field = targetFields.find(f => f.key === e.target.value)
                                            updateFilter(filter.id, {
                                                field:    e.target.value,
                                                operator: field ? OPERATORS[field.type][0].value : 'contains',
                                                value:    '',
                                            })
                                        }}
                                        className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-white"
                                    >
                                        {targetFields.map(f => (
                                            <option key={f.key} value={f.key}>{f.label}</option>
                                        ))}
                                    </select>

                                    {/* Opérateur */}
                                    <select
                                        value={filter.operator}
                                        onChange={e => updateFilter(filter.id, { operator: e.target.value as Operator })}
                                        className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-white"
                                    >
                                        {ops.map(op => (
                                            <option key={op.value} value={op.value}>{op.label}</option>
                                        ))}
                                    </select>

                                    {/* Valeur — masquée pour les booléens */}
                                    {!isBool && (
                                        isEnum && currentField?.values?.length ? (
                                            <select
                                                value={filter.value}
                                                onChange={e => updateFilter(filter.id, { value: e.target.value })}
                                                className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-white flex-1 min-w-32"
                                            >
                                                <option value="">— choisir —</option>
                                                {currentField.values.map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={
                                                    currentField?.type === 'date'   ? 'date'   :
                                                    currentField?.type === 'number' ? 'number' : 'text'
                                                }
                                                value={filter.value}
                                                onChange={e => updateFilter(filter.id, { value: e.target.value })}
                                                placeholder="valeur…"
                                                className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700 flex-1 min-w-32"
                                            />
                                        )
                                    )}

                                    <button
                                        onClick={() => removeFilter(filter.id)}
                                        className="text-gray-300 hover:text-red-400 text-sm leading-none shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )
                        })}

                        <button
                            onClick={addFilter}
                            className="self-start text-xs text-indigo-500 hover:text-gray-600"
                        >
                            + Ajouter un filtre
                        </button>
                    </div>

                    {/* Colonnes à exporter */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Colonnes à exporter
                        </span>
                        <div className="flex flex-row gap-4 flex-wrap">
                            {rootFields.map(f => (
                                <label key={f.key} className="flex items-center gap-1.5 cursor-pointer">
                                    <Checkbox
                                        checked={selectedFields.includes(f.key)}
                                        onCheckedChange={() => setSelected(prev =>
                                            prev.includes(f.key)
                                                ? prev.filter(k => k !== f.key)
                                                : [...prev, f.key]
                                        )}
                                    />
                                    <span className="text-xs text-gray-600">{f.label}</span>
                                </label>
                            ))}
                        </div>

                        {extraColumns.map(col => (
                            <div key={col.id} className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={col.table}
                                    onChange={e => {
                                        const table = e.target.value as QueryableTableKey
                                        updateExtraColumn(col.id, {
                                            table,
                                            field: TABLE_FIELDS[table]?.[0]?.key ?? '',
                                        })
                                    }}
                                    className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-white"
                                >
                                    {crossTables.map(t => (
                                        <option key={t.key} value={t.key}>{t.label}</option>
                                    ))}
                                </select>

                                <select
                                    value={col.field}
                                    onChange={e => updateExtraColumn(col.id, { field: e.target.value })}
                                    className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-white"
                                >
                                    {(TABLE_FIELDS[col.table] ?? []).map(f => (
                                        <option key={f.key} value={f.key}>{f.label}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => removeExtraColumn(col.id)}
                                    className="text-gray-300 hover:text-red-400 text-sm leading-none shrink-0"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {crossTables.length > 0 && (
                            <button
                                onClick={addExtraColumn}
                                className="self-start text-xs text-indigo-500 hover:text-gray-600"
                            >
                                + Ajouter une colonne d'une autre table
                            </button>
                        )}
                    </div>

                    {/* Aperçu des résultats */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Résultats · {results.length}
                        </span>

                        {!db ? (
                            <p className="text-xs text-gray-300">Chargement…</p>
                        ) : results.length === 0 ? (
                            <p className="text-xs text-gray-300">Aucun résultat</p>
                        ) : (
                            <div className="overflow-x-auto rounded border border-gray-100">
                                <table className="text-xs w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {columns.map(c => (
                                                <th key={c.key} className="text-left px-3 py-2 text-gray-400 font-medium whitespace-nowrap">
                                                    {c.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.slice(0, 50).map((row, i) => (
                                            <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                                                {columns.map(c => (
                                                    <td key={c.key} className="px-3 py-1.5 text-gray-600 whitespace-nowrap">
                                                        {cellValue(db, rootTable, row, c) || '—'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {results.length > 50 && (
                                    <p className="text-[10px] text-gray-400 px-3 py-2 border-t border-gray-50">
                                        Aperçu limité à 50 lignes — l'export contiendra les {results.length} résultats.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="text-xs text-gray-400 border rounded-md px-1.5 py-1.5 hover:text-indigo-600 hover:border-indigo-500"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => db && downloadCSV(db, results, columns, rootTable)}
                        disabled={results.length === 0 || columns.length === 0}
                        className="text-xs px-1.5 py-1.5 bg-black text-white rounded-md hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Exporter CSV · {results.length}
                    </button>
                </div>
            </div>
        </div>
    )
}
