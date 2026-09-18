import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ToDoItem, ToDoList, MemberActionCard, ProjectPartner, FinancialAgreement, Expanse } from './types'
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

// Vue financière d'un projet. Recettes : le budget, dont la part apportée par
// les partenaires (cofinanced), le reste étant porté par le laboratoire
// (selfFinanced). Dépenses : les subventions accordées (granted) et les
// dépenses directes.
export type ProjectFinancials = {
    budget:       number
    cofinanced:   number
    selfFinanced: number
    granted:      number
    direct:       number
    spent:        number
    balance:      number
}

// Rendu quand un projet n'a encore aucune ligne financière.
export const NO_FINANCIALS: ProjectFinancials = {
    budget: 0, cofinanced: 0, selfFinanced: 0, granted: 0, direct: 0, spent: 0, balance: 0,
}

// Une seule arithmétique, deux appelants : la liste des projets la calcule pour
// tout le monde, la fiche projet la rappelle pour le sien. Les projets sont
// posés en premier pour que chacun ait sa ligne, même sans mouvement ; les
// trois sources viennent ensuite l'alimenter et le dernier passage dérive.
export function computeFinancials(
    projects:        { id: number; budget: number }[],
    projectPartners: ProjectPartner[],
    agreements:      FinancialAgreement[],
    expanses:        Expanse[],
): Map<number, ProjectFinancials> {
    const totals = new Map<number, ProjectFinancials>()
    for (const p of projects) totals.set(p.id, { ...NO_FINANCIALS, budget: p.budget })

    for (const pp of projectPartners) {
        const f = totals.get(pp.project_id)
        if (f) f.cofinanced += pp.amount ?? 0
    }

    for (const a of agreements) {
        const f = totals.get(a.project_id)
        if (f) f.granted += a.grant
    }

    // Une dépense rattachée à une convention n'est que le versement d'une
    // subvention déjà comptée ; la compter deux fois gonflerait le total.
    for (const e of expanses) {
        if (!e.project_id) continue
        if (e.agreement_id) continue
        const f = totals.get(e.project_id)
        if (f) f.direct += e.amount
    }

    for (const f of totals.values()) {
        f.selfFinanced = f.budget - f.cofinanced
        f.spent        = f.granted + f.direct
        f.balance      = f.budget - f.spent
    }
    return totals
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