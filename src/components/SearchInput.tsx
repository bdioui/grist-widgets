import { useState } from "react"
import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"

type SearchInputProps<T extends { id: number }> = {
    data: T[]
    onSelect: (item: T) => void
    getLabel: (item: T) => string
    renderItem?: (item: T) => ReactNode
    filterFn?: (item: T, query: string) => boolean
    placeholder?: string
    value?: string
}

export default function SearchInput<T extends { id: number }>({
    data,
    onSelect,
    getLabel,
    renderItem,
    filterFn,
    placeholder = 'Rechercher...',
    value,
}: SearchInputProps<T>) {
    const [query,   setQuery]   = useState('')
    const [open,    setOpen]    = useState(false)
    const [focused, setFocused] = useState(false)

    const displayValue = focused ? query : (value ?? query)

    const filtered = query.trim().length === 0 ? data : data.filter(item =>
        filterFn
            ? filterFn(item, query)
            : getLabel(item).toLowerCase().includes(query.toLowerCase())
    )

    function select(item: T) {
        onSelect(item)
        setQuery('')
        setFocused(false)
        setOpen(false)
    }

    return (
        <div className="relative flex-1">
            <Input
                value={displayValue}
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => { setFocused(true); setQuery(''); setOpen(true) }}
                onBlur={() => setTimeout(() => { setOpen(false); setFocused(false); setQuery('') }, 150)}
                placeholder={placeholder}
                className="h-8 text-xs"
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filtered.map(item => (
                            <li
                                key={item.id}
                                onMouseDown={() => select(item)}
                                className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-muted"
                            >
                                {renderItem ? renderItem(item) : <span>{getLabel(item)}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}