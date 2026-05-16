// Résout les clés étrangères des tables Grist (format plat) en objets imbriqués
// identiques au format des mocks, utilisables directement par le front.

import type {
    Status, Category, Member, Partner, Axis,
    ActionCard, ActionCardFull,
    ProjectCall, Project, FinancialAgreement,
    Phd, MobilityGrant, ToDoList, ToDoItem,
    IndicatorDefinition, BudgetCategory, BudgetDetail,
    MemberActionCard, ProjectActionCard,
} from '@/lib/types'

// --- Helpers ---

function str(v: unknown): string  { return typeof v === 'string'  ? v  : '' }
function num(v: unknown): number  { return typeof v === 'number'  ? v  : 0  }
function nullable(v: unknown): number | null {
    return typeof v === 'number' && v !== 0 ? v : null
}

// --- Tables de référence (pas de jointure, nettoyage des types seulement) ---

export function normalizeStatuses(rows: Record<string, unknown>[]): Status[] {
    return rows.map(r => ({
        id:      num(r.id),
        label:   str(r.label),
        context: str(r.context),
    }))
}

export function normalizeCategories(rows: Record<string, unknown>[]): Category[] {
    return rows.map(r => ({
        id:                 num(r.id),
        parent_category_id: nullable(r.parent_category_id),
        title:              str(r.title),
        color:              r.color ? str(r.color) : null,
    }))
}

export function normalizeMembers(rows: Record<string, unknown>[]): Member[] {
    return rows.map(r => ({
        id:            num(r.id),
        partner_id:    num(r.partner_id),
        first_name:    str(r.first_name),
        last_name:     str(r.last_name),
        position:      str(r.position),
        email:         str(r.email),
        tel:           str(r.tel),
        genre:         str(r.genre),
        status:        str(r.status),
        profile_image: str(r.profile_image),
    }))
}

export function normalizePartners(rows: Record<string, unknown>[]): Partner[] {
    return rows.map(r => ({
        id:          num(r.id),
        name:        str(r.name),
        description: str(r.description),
        color:       str(r.color),
        logo:        str(r.logo),
        status_id:   num(r.status_id),
        type:        str(r.type),
    }))
}

export function normalizeAxes(rows: Record<string, unknown>[]): Axis[] {
    return rows.map(r => ({
        id:          num(r.id),
        name:        str(r.name),
        description: str(r.description),
    }))
}

// --- Action cards ---

export function normalizeActionCards(rows: Record<string, unknown>[]): ActionCard[] {
    return rows.map(r => ({
        id:          num(r.id),
        owner_id:    num(r.owner_id),
        category_id: num(r.category_id),
        status_id:   num(r.status_id),
        title:       str(r.title),
        color:       str(r.color),
        description: str(r.description),
        start_date:  str(r.start_date),
        end_date:    str(r.end_date),
    }))
}

// Jointure complète : résout status, category (+ parent) et owner
export function normalizeActionCardsFull(
    rows:       Record<string, unknown>[],
    statuses:   Status[],
    categories: Category[],
    members:    Member[],
): ActionCardFull[] {
    const statusMap   = new Map(statuses.map(s => [s.id, s]))
    const categoryMap = new Map(categories.map(c => [c.id, c]))
    const memberMap   = new Map(members.map(m => [m.id, m]))

    return normalizeActionCards(rows).map(card => {
        const category = categoryMap.get(card.category_id)
        const parent   = category?.parent_category_id
            ? categoryMap.get(category.parent_category_id) ?? null
            : null

        return {
            ...card,
            status:   statusMap.get(card.status_id)!,
            category: { ...category!, parent },
            owner:    memberMap.get(card.owner_id)!,
        }
    })
}

// --- Autres tables ---

export function normalizeProjectCalls(rows: Record<string, unknown>[]): ProjectCall[] {
    return rows.map(r => ({
        id:          num(r.id),
        axis_id:     num(r.axis_id),
        title:       str(r.title),
        description: str(r.description),
        start_date:  str(r.start_date),
        end_date:    str(r.end_date),
        status_id:   num(r.status_id),
    }))
}

export function normalizeProjects(rows: Record<string, unknown>[]): Project[] {
    return rows.map(r => ({
        id:              num(r.id),
        project_call_id: num(r.project_call_id),
        title:           str(r.title),
        budget:          num(r.budget),
        grant:           num(r.grant),
    }))
}

export function normalizeFinancialAgreements(rows: Record<string, unknown>[]): FinancialAgreement[] {
    return rows.map(r => ({
        id:          num(r.id),
        project_id:  num(r.project__id ?? r.project_id),
        partner_id:  num(r.partner_id),
        title:       str(r.title),
        description: str(r.description),
        budget:      num(r.budget),
        grant:       num(r.grant),
        signed_date: str(r.signed_date),
    }))
}

export function normalizePhds(rows: Record<string, unknown>[]): Phd[] {
    return rows.map(r => ({
        id:         num(r.id),
        member_id:  num(r.member),
        start_date: str(r.start_date),
        end_date:   str(r.end_date),
        axis_id:    num(r.axis_id),
    }))
}

export function normalizeMobilityGrants(rows: Record<string, unknown>[]): MobilityGrant[] {
    return rows.map(r => ({
        id:         num(r.id),
        member_id:  num(r.member),
        start_date: str(r.start_date),
        end_date:   str(r.end_date),
        axis_id:    num(r.axis_id),
    }))
}

export function normalizeIndicatorDefinitions(rows: Record<string, unknown>[]): IndicatorDefinition[] {
    return rows.map(r => ({
        id:         num(r.id),
        label:      str(r.label),
        unit:       str(r.unit),
        definition: str(r.definition),
        dimension:  str(r.dimension),
    }))
}

export function normalizeBudgetCategories(rows: Record<string, unknown>[]): BudgetCategory[] {
    return rows.map(r => ({
        id:         num(r.id),
        partner_id: nullable(r.partner_id),
        title:      str(r.title),
    }))
}

export function normalizeBudgetDetails(rows: Record<string, unknown>[]): BudgetDetail[] {
    return rows.map(r => ({
        id:                 num(r.id),
        budget_category_id: num(r.budget_category_id),
        title:              str(r.title),
        description:        str(r.description),
        budget:             num(r.budget),
    }))
}

export function normalizeToDoLists(rows: Record<string, unknown>[]): ToDoList[] {
    return rows.map(r => ({
        id:             num(r.id),
        action_card_id: num(r.action_card_id),
        title:          str(r.title),
    }))
}

export function normalizeToDoItems(rows: Record<string, unknown>[]): ToDoItem[] {
    return rows.map(r => ({
        id:         num(r.id),
        list_id:    num(r.list_id),
        content:    str(r.content),
        status_id:  num(r.status_id),
        start_date: str(r.start_date),
        end_time:   str(r.end_time),
    }))
}

export function normalizeMemberActionCards(rows: Record<string, unknown>[]): MemberActionCard[] {
    return rows.map(r => ({
        id:             num(r.id),
        member_id:      num(r.member_id),
        action_card_id: num(r.action_card_id),
        role:           str(r.role),
    }))
}

export function normalizeProjectActionCards(rows: Record<string, unknown>[]): ProjectActionCard[] {
    return rows.map(r => ({
        id:             num(r.id),
        project_id:     num(r.project_id),
        action_card_id: num(r.action_card_id),
    }))
}
