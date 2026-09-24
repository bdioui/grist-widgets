import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ToDoItem, ToDoList, MemberActionCard, ProjectPartner, FinancialAgreement, Expanse, AgreementDirection } from './types'
import { WORKING_ROLES, PARTNER_ROLE_DIRECTION } from '../lib/constants'

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

// `budget` (recettes) n'est jamais saisi directement : il tombe de
// selfFinanced + cofinanced. Recettes et dépenses étant de même nature,
// `balance` est un vrai solde.
export type ProjectFinancials = {
    selfFinanced: number
    cofinanced:   number
    budget:       number
    granted:      number
    direct:       number
    spent:        number
    balance:      number
}

// Rendu quand un projet n'a encore aucune ligne financière.
export const NO_FINANCIALS: ProjectFinancials = {
    selfFinanced: 0, cofinanced: 0, budget: 0, granted: 0, direct: 0, spent: 0, balance: 0,
}

// Une seule arithmétique, deux appelants : la liste des projets la calcule pour
// tout le monde, la fiche projet la rappelle pour le sien. Les projets sont
// posés en premier pour que chacun ait sa ligne, même sans mouvement ; les
// trois sources viennent ensuite l'alimenter et le dernier passage dérive.
export function computeFinancials(
    // `budget` porte ici le financement propre, pas le total : c'est le seul
    // chiffre saisi à la main, le reste s'observe.
    projects:        { id: number; budget: number }[],
    projectPartners: ProjectPartner[],
    agreements:      FinancialAgreement[],
    expanses:        Expanse[],
): Map<number, ProjectFinancials> {
    const totals = new Map<number, ProjectFinancials>()
    for (const p of projects) totals.set(p.id, { ...NO_FINANCIALS, selfFinanced: p.budget })

    // Les conventions d'abord : une convention signée fait foi sur le montant
    // annoncé au tour de table. On retient au passage les couples
    // (projet, partenaire, sens) déjà couverts, pour ne pas compter deux fois.
    // Le sens fait partie de la clé : un partenaire peut très bien apporter
    // par une convention et recevoir par une autre.
    const settled = new Set<string>()
    for (const a of agreements) {
        const f = totals.get(a.project_id)
        if (!f) continue
        if (a.direction === 'recette') f.cofinanced += a.grant
        else                           f.granted    += a.grant
        settled.add(`${a.project_id}:${a.partner_id}:${a.direction}`)
    }

    // Le montant annoncé au tour de table ne vaut que tant qu'aucune
    // convention ne le couvre : il tient la place en attendant la signature.
    for (const pp of projectPartners) {
        const direction = PARTNER_ROLE_DIRECTION[pp.role]
        if (!direction) continue
        if (settled.has(`${pp.project_id}:${pp.partner_id}:${direction}`)) continue
        const f = totals.get(pp.project_id)
        if (!f) continue
        if (direction === 'recette') f.cofinanced += pp.amount ?? 0
        else                         f.granted    += pp.amount ?? 0
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
        f.budget  = f.selfFinanced + f.cofinanced
        f.spent   = f.granted + f.direct
        f.balance = f.budget - f.spent
    }
    return totals
}

// Additionner les deux sens donnerait un chiffre qui ne désigne rien : ce que le
// programme reçoit et ce qu'il verse ne se cumulent pas. Tout total de
// conventions doit donc choisir son côté.
export function sumGrant(
    agreements: { direction: AgreementDirection; grant: number }[],
    direction: AgreementDirection,
) {
    return agreements.reduce((s, a) => a.direction === direction ? s + a.grant : s, 0)
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