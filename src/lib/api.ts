import { fetchTable, updateRecord, addRecord, addRecords, deleteRecord } from '@/lib/grist'
import {
    mockStatuses, mockCategories, mockMembers, mockPartners,
    mockAxes, mockActionCards, mockProjectCalls, mockProjects,
    mockFinancialAgreements, mockPhds, mockMobilityGrants,
    mockIndicatorDefinitions, mockBudgetCategories, mockBudgetDetails,
    mockToDoLists, mockToDoItems, mockMemberActionCards, mockAxisActionCards, mockProjectActionCards,
} from '@/lib/mock'
import {
    normalizeStatuses, normalizeCategories, normalizeMembers, normalizePartners,
    normalizeAxes, normalizeActionCards, normalizeActionCardsFull,
    normalizeProjectCalls, normalizeProjects, normalizeFinancialAgreements,
    normalizePhds, normalizeMobilityGrants, normalizeIndicatorDefinitions,
    normalizeBudgetCategories, normalizeBudgetDetails,
    normalizeToDoLists, normalizeToDoItems,
    normalizeMemberActionCards, normalizeProjectActionCards,
} from '@/lib/normalize'
import type {
    Status, Category, Member, Partner, Axis,
    ActionCard, ActionCardFull, ProjectCall, Project,
    FinancialAgreement, Phd, MobilityGrant,
    IndicatorDefinition, BudgetCategory, BudgetDetail,
    ToDoList, ToDoItem, MemberActionCard, AxisActionCard, ProjectActionCard,
} from '@/lib/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// --- Tables de référence ---

export async function getStatuses():            Promise<Status[]>             { return USE_MOCK ? mockStatuses            : normalizeStatuses(           await fetchTable('status')) }
export async function getCategories():          Promise<Category[]>           { return USE_MOCK ? mockCategories          : normalizeCategories(         await fetchTable('category')) }
export async function getMembers():             Promise<Member[]>             { return USE_MOCK ? mockMembers             : normalizeMembers(            await fetchTable('member')) }
export async function getPartners():            Promise<Partner[]>            { return USE_MOCK ? mockPartners            : normalizePartners(           await fetchTable('partner')) }
export async function getAxes():                Promise<Axis[]>               { return USE_MOCK ? mockAxes                : normalizeAxes(               await fetchTable('axis')) }

// --- Cœur du système ---

export async function getActionCards():         Promise<ActionCard[]>         { return USE_MOCK ? mockActionCards         : normalizeActionCards(        await fetchTable('action_card')) }
export async function getProjectCalls():        Promise<ProjectCall[]>        { return USE_MOCK ? mockProjectCalls        : normalizeProjectCalls(       await fetchTable('project_call')) }
export async function getProjects():            Promise<Project[]>            { return USE_MOCK ? mockProjects            : normalizeProjects(           await fetchTable('project')) }
export async function getFinancialAgreements(): Promise<FinancialAgreement[]> { return USE_MOCK ? mockFinancialAgreements : normalizeFinancialAgreements(await fetchTable('financial_agreement')) }
export async function getPhds():                Promise<Phd[]>                { return USE_MOCK ? mockPhds                : normalizePhds(               await fetchTable('Phd')) }
export async function getMobilityGrants():      Promise<MobilityGrant[]>      { return USE_MOCK ? mockMobilityGrants      : normalizeMobilityGrants(     await fetchTable('mobility_grant')) }

// --- Budget & indicateurs ---

export async function getIndicatorDefinitions(): Promise<IndicatorDefinition[]> { return USE_MOCK ? mockIndicatorDefinitions : normalizeIndicatorDefinitions(await fetchTable('indicator_definition')) }
export async function getBudgetCategories():     Promise<BudgetCategory[]>      { return USE_MOCK ? mockBudgetCategories     : normalizeBudgetCategories(   await fetchTable('budget_category')) }
export async function getBudgetDetails():        Promise<BudgetDetail[]>        { return USE_MOCK ? mockBudgetDetails        : normalizeBudgetDetails(      await fetchTable('budget_detail')) }

// --- To-do ---

export async function getToDoLists(): Promise<ToDoList[]> { return USE_MOCK ? mockToDoLists : normalizeToDoLists(await fetchTable('to_do_list')) }
export async function getToDoItems(): Promise<ToDoItem[]> { return USE_MOCK ? mockToDoItems : normalizeToDoItems(await fetchTable('to_do_item')) }

// --- Liens globaux (pour les filtres du kanban) ---

export async function getAllAxisActionCards(): Promise<AxisActionCard[]> {
    if (USE_MOCK) return [...mockAxisActionCards]
    const rows = await fetchTable('axis_action_card')
    return rows.map(r => ({ id: Number(r.id), axis_id: Number(r.axis_id), action_card_id: Number(r.action_card_id) }))
}

export async function getAllMemberActionCards(): Promise<MemberActionCard[]> {
    if (USE_MOCK) return [...mockMemberActionCards]
    const rows = await fetchTable('member_action_card')
    return normalizeMemberActionCards(rows)
}

// --- Jointures par carte ---

export async function getMemberActionCardsByCard(cardId: number): Promise<(MemberActionCard & { member: Member })[]> {
    const [links, members] = await (USE_MOCK
        ? Promise.resolve([
            mockMemberActionCards.filter(m => m.action_card_id === cardId),
            mockMembers,
          ])
        : Promise.all([
            fetchTable('member_action_card').then(normalizeMemberActionCards),
            getMembers(),
          ])
    )
    const memberMap = new Map((members as Member[]).map(m => [m.id, m]))
    return (links as MemberActionCard[])
        .filter(l => l.action_card_id === cardId)
        .map(l => ({ ...l, member: memberMap.get(l.member_id)! }))
        .filter(l => l.member)
}

export async function getProjectActionCardsByCard(cardId: number): Promise<(ProjectActionCard & { project: Project })[]> {
    const [links, projects] = await (USE_MOCK
        ? Promise.resolve([
            mockProjectActionCards.filter(p => p.action_card_id === cardId),
            mockProjects,
          ])
        : Promise.all([
            fetchTable('project_action_card').then(normalizeProjectActionCards),
            getProjects(),
          ])
    )
    const projectMap = new Map((projects as Project[]).map(p => [p.id, p]))
    return (links as ProjectActionCard[])
        .filter(l => l.action_card_id === cardId)
        .map(l => ({ ...l, project: projectMap.get(l.project_id)! }))
        .filter(l => l.project)
}

export async function getToDoListsWithItemsByCard(cardId: number): Promise<(ToDoList & { items: ToDoItem[] })[]> {
    if (USE_MOCK) {
        const lists = mockToDoLists.filter(l => l.action_card_id === cardId)
        return lists.map(l => ({ ...l, items: mockToDoItems.filter(i => i.list_id === l.id) }))
    }
    const [lists, items] = await Promise.all([
        fetchTable('to_do_list').then(normalizeToDoLists),
        fetchTable('to_do_item').then(normalizeToDoItems),
    ])
    return lists
        .filter(l => l.action_card_id === cardId)
        .map(l => ({ ...l, items: items.filter(i => i.list_id === l.id) }))
}

// --- Mutations sur les éléments d'une ActionCard ---

export async function updateToDoItem(id: number, patch: Partial<Pick<ToDoItem, 'content' | 'status_id' | 'start_date' | 'end_time'>>): Promise<void> {
    if (USE_MOCK) {
        const item = mockToDoItems.find(i => i.id === id)
        if (item) Object.assign(item, patch)
        return
    }
    await updateRecord('to_do_item', id, patch)
}

export async function addToDoItemToList(listId: number, content: string): Promise<ToDoItem> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockToDoItems.map(i => i.id)) + 1
        const item: ToDoItem = { id: newId, list_id: listId, content, status_id: 8, start_date: '', end_time: '' }
        mockToDoItems.push(item)
        return item
    }
    const id = await addRecord('to_do_item', { list_id: listId, content, status_id: 8 })
    return { id, list_id: listId, content, status_id: 8, start_date: '', end_time: '' }
}

export async function addToDoListToCard(cardId: number, title: string): Promise<ToDoList & { items: ToDoItem[] }> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockToDoLists.map(l => l.id)) + 1
        const list: ToDoList = { id: newId, action_card_id: cardId, title }
        mockToDoLists.push(list)
        return { ...list, items: [] }
    }
    const id = await addRecord('to_do_list', { action_card_id: cardId, title })
    return { id, action_card_id: cardId, title, items: [] }
}

export async function addMemberToCard(cardId: number, memberId: number, role: string): Promise<MemberActionCard & { member: Member }> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockMemberActionCards.map(m => m.id)) + 1
        const link: MemberActionCard = { id: newId, member_id: memberId, action_card_id: cardId, role }
        mockMemberActionCards.push(link)
        return { ...link, member: mockMembers.find(m => m.id === memberId)! }
    }
    const id = await addRecord('member_action_card', { member_id: memberId, action_card_id: cardId, role })
    const members = await getMembers()
    return { id, member_id: memberId, action_card_id: cardId, role, member: members.find(m => m.id === memberId)! }
}

export async function removeMemberFromCard(linkId: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockMemberActionCards.findIndex(m => m.id === linkId)
        if (i !== -1) mockMemberActionCards.splice(i, 1)
        return
    }
    await deleteRecord('member_action_card', linkId)
}

export async function addProjectToCard(cardId: number, projectId: number): Promise<ProjectActionCard & { project: Project }> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockProjectActionCards.map(p => p.id)) + 1
        const link: ProjectActionCard = { id: newId, project_id: projectId, action_card_id: cardId }
        mockProjectActionCards.push(link)
        return { ...link, project: mockProjects.find(p => p.id === projectId)! }
    }
    const id = await addRecord('project_action_card', { project_id: projectId, action_card_id: cardId })
    const projects = await getProjects()
    return { id, project_id: projectId, action_card_id: cardId, project: projects.find(p => p.id === projectId)! }
}

export async function removeProjectFromCard(linkId: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockProjectActionCards.findIndex(p => p.id === linkId)
        if (i !== -1) mockProjectActionCards.splice(i, 1)
        return
    }
    await deleteRecord('project_action_card', linkId)
}

// --- Catégories ---

export async function createCategory(title: string, parentId: number | null): Promise<Category> {
    if (USE_MOCK) {
        const newId = Math.max(...mockCategories.map(c => c.id)) + 1
        const cat: Category = { id: newId, parent_category_id: parentId, title }
        mockCategories.push(cat)
        return cat
    }
    const id = await addRecord('category', { title, parent_category_id: parentId ?? 0 })
    return { id, parent_category_id: parentId, title }
}

export async function updateCategory(id: number, patch: Partial<Pick<Category, 'title' | 'parent_category_id'>>): Promise<void> {
    if (USE_MOCK) {
        const cat = mockCategories.find(c => c.id === id)
        if (cat) Object.assign(cat, patch)
        return
    }
    await updateRecord('category', id, patch)
}

// --- Catégorie "Autre" ---

export async function getOrCreateOtherCategory(): Promise<number> {
    if (USE_MOCK) {
        const existing = mockCategories.find(c => c.title === 'Autre')
        if (existing) return existing.id
        const newId = Math.max(...mockCategories.map(c => c.id)) + 1
        mockCategories.push({ id: newId, parent_category_id: null, title: 'Autre' })
        return newId
    }
    const cats = await getCategories()
    const existing = cats.find(c => c.title === 'Autre')
    if (existing) return existing.id
    return await addRecord('category', { title: 'Autre', parent_category_id: null })
}

// --- Mutations ---

// Formulaire de création d'une ActionCard complète
export type ActionCardCreateForm = {
    // Général
    title:       string
    description: string
    start_date:  string
    end_date:    string
    // Classification
    status_id:   number
    category_id: number
    axis_id:     number | null
    // Personnes
    owner_id:    number
    members:     { member_id: number; role: string }[]
    // Projet
    project_id:  number | null
    // To-do
    todo_title:  string
    todo_items:  string[]
}

export async function createActionCardFull(form: ActionCardCreateForm): Promise<ActionCardFull> {
    if (USE_MOCK) {
        // En mode mock on pousse dans les tableaux en mémoire (reload = reset)
        const newId = Math.max(...mockActionCards.map(c => c.id)) + 1
        const card = {
            id:          newId,
            owner_id:    form.owner_id,
            category_id: form.category_id,
            status_id:   form.status_id,
            title:       form.title,
            color:       '',
            description: form.description,
            start_date:  form.start_date,
            end_date:    form.end_date,
        }
        mockActionCards.push(card)

        const statusMap   = new Map(mockStatuses.map(s => [s.id, s]))
        const categoryMap = new Map(mockCategories.map(c => [c.id, c]))
        const memberMap   = new Map(mockMembers.map(m => [m.id, m]))
        const category    = categoryMap.get(form.category_id)!
        const parent      = category.parent_category_id ? categoryMap.get(category.parent_category_id) ?? null : null

        return { ...card, status: statusMap.get(form.status_id)!, category: { ...category, parent }, owner: memberMap.get(form.owner_id)! }
    }

    // 1. Créer la carte principale
    const cardId = await addRecord('action_card', {
        title:       form.title,
        description: form.description,
        start_date:  form.start_date,
        end_date:    form.end_date,
        status_id:   form.status_id,
        category_id: form.category_id,
        owner_id:    form.owner_id,
    })

    // 2. Lier les participants en parallèle avec les autres relations
    await Promise.all([
        form.members.length > 0
            ? addRecords('member_action_card', form.members.map(m => ({ member_id: m.member_id, action_card_id: cardId, role: m.role })))
            : Promise.resolve([]),
        form.project_id
            ? addRecord('project_action_card', { project_id: form.project_id, action_card_id: cardId })
            : Promise.resolve(0),
        form.axis_id
            ? addRecord('axis_action_card', { axis_id: form.axis_id, action_card_id: cardId })
            : Promise.resolve(0),
        (async () => {
            if (!form.todo_title && form.todo_items.length === 0) return
            const listId = await addRecord('to_do_list', { action_card_id: cardId, title: form.todo_title || 'To-do' })
            if (form.todo_items.length > 0) {
                await addRecords('to_do_item', form.todo_items.map(content => ({
                    list_id: listId, content, status_id: 8,
                })))
            }
        })(),
    ])

    // 3. Retourner la carte enrichie depuis l'API
    const full = await getActionCardsFull()
    return full.find(c => c.id === cardId)!
}

export async function updateActionCard(
    id: number,
    patch: Partial<Pick<ActionCard, 'category_id' | 'status_id' | 'owner_id' | 'title' | 'description' | 'color' | 'start_date' | 'end_date'>>
): Promise<void> {
    if (USE_MOCK) return // pas de persistance en mode mock
    await updateRecord('action_card', id, patch)
}

// --- Requête enrichie (jointures) ---

export async function getActionCardsFull(): Promise<ActionCardFull[]> {
    if (USE_MOCK) {
        const statusMap   = new Map(mockStatuses.map(s => [s.id, s]))
        const categoryMap = new Map(mockCategories.map(c => [c.id, c]))
        const memberMap   = new Map(mockMembers.map(m => [m.id, m]))

        return mockActionCards.map(card => ({
            ...card,
            status:   statusMap.get(card.status_id)!,
            category: {
                ...categoryMap.get(card.category_id)!,
                parent: (() => {
                    const cat = categoryMap.get(card.category_id)
                    return cat?.parent_category_id ? categoryMap.get(cat.parent_category_id) ?? null : null
                })(),
            },
            owner: memberMap.get(card.owner_id)!,
        }))
    }

    const [rows, statuses, categories, members] = await Promise.all([
        fetchTable('action_card'),
        getStatuses(),
        getCategories(),
        getMembers(),
    ])

    return normalizeActionCardsFull(rows, statuses, categories, members)
}
