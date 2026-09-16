import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ToDoItem, ToDoList, MemberActionCard } from './types'
import { WORKING_ROLES } from '../lib/constants'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
    const escape = (v: string | number | null | undefined) => {
        const s = v == null ? '' : String(v)
        return s.includes(';') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s
    }
    const lines = [headers, ...rows].map(row => row.map(escape).join(';'))
    const csv = '﻿' + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function participantsByCard(memberLinks: MemberActionCard[], lists: ToDoList[], items: ToDoItem[]): Map<number, Set<number>> {
    const participantByCard = new Map<number, Set<number>>()
    const listToCard = new Map<number, number>()
    for (const l of lists) listToCard.set(l.id, l.action_card_id)

    for (const m of memberLinks) {
        if (!WORKING_ROLES.has(m.role)) continue
        const onCard = participantByCard.get(m.action_card_id) ?? new Set<number>()
        onCard.add(m.member_id)
        participantByCard.set(m.action_card_id, onCard)
    }

    for (const i of items) {
        if (i.owner_id === null) continue
        const cardId = listToCard.get(i.list_id)
        if (!cardId) continue
        const participantList = participantByCard.get(cardId) ?? new Set<number>()
        participantList.add(i.owner_id)
        participantByCard.set(cardId, participantList)
    }


    return participantByCard
}