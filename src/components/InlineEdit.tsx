import { useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SearchInput from '@/components/SearchInput'
import { cn } from '@/lib/utils'

// Cellules modifiables en place : un double-clic sur la valeur la transforme en champ,
// et le choix ou la sortie du champ enregistre. Aucune ligne n'a de mode
// « édition » : chaque cellule porte sa propre sauvegarde.
//
// `onCommit` peut lever une erreur : la cellule reprend alors son affichage
// d'origine, puisqu'elle lit toujours sa valeur dans les props du parent.

type Commit<T> = (value: T) => Promise<void> | void

const viewClass =
    'block w-full min-h-6 -mx-1 px-1 py-0.5 rounded text-left transition-colors cursor-default select-none hover:bg-muted/70 disabled:cursor-default disabled:hover:bg-transparent'

async function run(commit: () => Promise<void> | void) {
    try {
        await commit()
    } catch (err) {
        console.error('Enregistrement impossible :', err)
    }
}

type ViewProps = { onOpen: () => void; disabled?: boolean; className?: string; children: ReactNode }

function View({ onOpen, disabled, className = '', children }: ViewProps) {
    return (
        <button type="button" onDoubleClick={onOpen} disabled={disabled} className={cn(viewClass, className)}>
            {children}
        </button>
    )
}

const EMPTY = <span className="text-muted-foreground/50">—</span>

// ─── Texte, nombre, date ─────────────────────────────────────────────────────

type InputProps = {
    value: string
    onCommit: Commit<string>
    kind?: 'text' | 'number' | 'date'
    // Ce qui s'affiche au repos ; la valeur brute par défaut.
    display?: ReactNode
    disabled?: boolean
    className?: string
    inputClassName?: string
}

export function EditableInput({ value, onCommit, kind = 'text', display, disabled, className, inputClassName = '' }: InputProps) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState('')
    // Échap ferme le champ, ce qui peut déclencher un blur : sans ce drapeau
    // l'annulation serait enregistrée.
    const cancelled = useRef(false)

    function open() {
        cancelled.current = false
        setDraft(value)
        setEditing(true)
    }

    function commit() {
        if (cancelled.current) return
        setEditing(false)
        if (draft !== value) void run(() => onCommit(draft))
    }

    if (!editing) {
        return (
            <View onOpen={open} disabled={disabled} className={className}>
                {display ?? (value ? value : EMPTY)}
            </View>
        )
    }

    return (
        <Input
            autoFocus
            type={kind}
            step={kind === 'number' ? '0.01' : undefined}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
                e.stopPropagation()
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') { cancelled.current = true; setEditing(false) }
            }}
            className={cn('h-7 text-xs', kind === 'number' && 'text-right', inputClassName)}
        />
    )
}

// ─── Liste fermée ────────────────────────────────────────────────────────────

export type InlineOption = { value: string; label: string }

type SelectProps = {
    value: string
    options: InlineOption[]
    onCommit: Commit<string>
    display?: ReactNode
    disabled?: boolean
    className?: string
}

export function EditableSelect({ value, options, onCommit, display, disabled, className }: SelectProps) {
    const [editing, setEditing] = useState(false)

    if (!editing) {
        return (
            <View onOpen={() => setEditing(true)} disabled={disabled} className={className}>
                {display ?? (options.find(o => o.value === value)?.label || EMPTY)}
            </View>
        )
    }

    return (
        <Select
            defaultOpen
            value={value}
            onValueChange={v => {
                setEditing(false)
                if (v !== value) void run(() => onCommit(v))
            }}
            onOpenChange={open => { if (!open) setEditing(false) }}
        >
            <SelectTrigger className="h-7 w-full text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
                {options.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
            </SelectContent>
        </Select>
    )
}

// ─── Recherche dans une liste ────────────────────────────────────────────────

type SearchProps<T extends { id: number }> = {
    data: T[]
    getLabel: (item: T) => string
    groupBy?: (item: T) => { primary: string; secondary?: string }
    onSelect: Commit<T>
    // Fournie : une croix permet de vider la valeur (référence facultative).
    onClear?: Commit<void>
    display: ReactNode
    placeholder?: string
    dropdownClassName?: string
    disabled?: boolean
    className?: string
}

export function EditableSearch<T extends { id: number }>({
    data, getLabel, groupBy, onSelect, onClear, display, placeholder, dropdownClassName, disabled, className,
}: SearchProps<T>) {
    const [editing, setEditing] = useState(false)

    if (!editing) {
        return (
            <View onOpen={() => setEditing(true)} disabled={disabled} className={className}>
                {display}
            </View>
        )
    }

    return (
        // Le choix se fait au mousedown dans SearchInput, avant le blur : fermer
        // avec un délai laisse à la sélection le temps de passer.
        <div className="flex items-center gap-1" onBlur={() => setTimeout(() => setEditing(false), 200)}>
            <SearchInput
                autoFocus
                data={data}
                getLabel={getLabel}
                groupBy={groupBy}
                placeholder={placeholder}
                dropdownClassName={dropdownClassName}
                onSelect={item => { setEditing(false); void run(() => onSelect(item)) }}
            />
            {onClear && (
                <button
                    type="button"
                    title="Vider"
                    onMouseDown={e => { e.preventDefault(); setEditing(false); void run(() => onClear()) }}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
                >
                    <X size={11} />
                </button>
            )}
        </div>
    )
}
