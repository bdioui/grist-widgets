import { fetchTable, updateRecord, addRecord, addRecords, deleteRecord } from '@/lib/grist'
import {
    mockStatuses, mockCategories, mockMembers, mockPartners, mockLabs, mockPartnerLabs,
    mockAxes, mockActionCards, mockProjectCalls, mockProjects,
    mockFinancialAgreements, mockPhds, mockMobilityGrants,
    mockIndicatorDefinitions, mockBudgetCategories, mockBudgetDetails,
    mockToDoLists, mockToDoItems, mockMemberActionCards, mockAxisActionCards, mockProjectActionCards,
    mockAgreementActionCards, mockGroup, mockGroupMember, mockComments
} from '@/lib/mock'
import {
    normalizeStatuses, normalizeCategories, normalizeMembers, normalizePartners,
    normalizeAxes, normalizeActionCards, normalizeActionCardsFull,
    normalizeProjectCalls, normalizeProjects, normalizeFinancialAgreements,
    normalizePhds, normalizeMobilityGrants, normalizeIndicatorDefinitions,
    normalizeBudgetCategories, normalizeBudgetDetails,
    normalizeToDoLists, normalizeToDoItems,
    normalizeMemberActionCards, normalizeProjectActionCards, normalizeAgreementActionCards,
    normalizePartnerCardsFull, normalizeLabs, normalizePartnerLabs, normalizeLabCardsFull,
    normalizeGroup, normalizeGroupMember, normalizeComments, normalizeCommentsFull
} from '@/lib/normalize'
import type {
    Status, Category, Member, Partner, Axis, Lab, PartnerLab, LabCardFull,
    ActionCard, ActionCardFull, PartnerCardFull, ProjectCall, Project,
    FinancialAgreement, Phd, MobilityGrant,
    IndicatorDefinition, BudgetCategory, BudgetDetail,
    ToDoList, ToDoItem, MemberActionCard, AxisActionCard, ProjectActionCard, AgreementActionCard, MemberFull,
    Group, GroupMember, Comment, CommentFull
} from '@/lib/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// --- IDs des tables Grist (Grist capitalise automatiquement la 1ère lettre) ---
// Si vos tables ont un ID différent, modifiez uniquement ici.
const T = {
    status: 'Status',
    category: 'Category',
    member: 'Member',
    partner: 'Partner',
    axis: 'Axis',
    action_card: 'Action_card',
    project_call: 'Project_call',
    project: 'Project',
    financial_agreement: 'Financial_agreement',
    phd: 'Phd',
    mobility_grant: 'Mobility_grant',
    indicator_definition: 'Indicator_definition',
    budget_category: 'Budget_category',
    budget_detail: 'Budget_detail',
    to_do_list: 'To_do_list',
    to_do_item: 'To_do_item',
    axis_action_card: 'Axis_action_card',
    member_action_card: 'Member_action_card',
    agreement_action_card: 'Agreement_action_card',
    project_action_card: 'Project_action_card',
    lab: 'Lab',
    partner_lab: 'Partner_lab',
    group: 'Group',
    group_member: 'Group_member',
    comment: 'Comment'
}

// --- Tables de référence ---
export async function getStatuses(): Promise<Status[]> { return USE_MOCK ? mockStatuses : normalizeStatuses(await fetchTable(T.status)) }
export async function getCategories(): Promise<Category[]> { return USE_MOCK ? mockCategories : normalizeCategories(await fetchTable(T.category)) }
export async function getMembers(): Promise<Member[]> { return USE_MOCK ? mockMembers : normalizeMembers(await fetchTable(T.member)) }
export async function getGroups(): Promise<Group[]> { return USE_MOCK ? mockGroup : normalizeGroup(await fetchTable(T.group)) }
export async function getGroupMembers(): Promise<GroupMember[]> { return USE_MOCK ? mockGroupMember : normalizeGroupMember(await fetchTable(T.group_member)) }
export async function getPartners(): Promise<Partner[]> { return USE_MOCK ? mockPartners : normalizePartners(await fetchTable(T.partner)) }
export async function getAxes(): Promise<Axis[]> { return USE_MOCK ? mockAxes : normalizeAxes(await fetchTable(T.axis)) }
export async function getLabs(): Promise<Lab[]> { return USE_MOCK ? mockLabs : normalizeLabs(await fetchTable(T.lab)) }
export async function getPartnerLabs(): Promise<PartnerLab[]> { return USE_MOCK ? mockPartnerLabs : normalizePartnerLabs(await fetchTable(T.partner_lab)) }

// --- Cœur du système ---

export async function getActionCards(): Promise<ActionCard[]> { return USE_MOCK ? mockActionCards : normalizeActionCards(await fetchTable(T.action_card)) }
export async function getComments(): Promise<Comment[]> { return USE_MOCK ? mockComments : normalizeComments(await fetchTable(T.comment)) }

export async function getCommentsFull(cardId: number): Promise<CommentFull[]> {
    if (USE_MOCK) {
        const filtered = mockComments.filter(c => c.action_card_id === cardId)
        return normalizeCommentsFull(filtered as Record<string, unknown>[], mockMembers)
    }
    const [rows, members] = await Promise.all([fetchTable(T.comment), getMembers()])
    const filtered = rows.filter(r => r.action_card_id === cardId)
    return normalizeCommentsFull(filtered, members)
}

export async function createComment(data: Omit<Comment, 'id'>): Promise<Comment> {
    if (USE_MOCK) {
        const id = Math.max(0, ...mockComments.map(c => c.id)) + 1
        const comment = { id, ...data }
        mockComments.push(comment)
        return comment
    }
    const id = await addRecord(T.comment, data)
    return { id, ...data }
}

export async function updateComment(id: number, patch: Partial<Comment>): Promise<void> {
    if (USE_MOCK) {
        const i = mockComments.findIndex(c => c.id === id)
        if (i !== -1) mockComments[i] = { ...mockComments[i], ...patch }
        return
    }
    await updateRecord(T.comment, id, patch)
}

export async function deleteComment(id: number): Promise<void> {
    if (USE_MOCK) {
        const idx = mockComments.findIndex(c => c.id === id)
        if (idx !== -1) mockComments.splice(idx, 1)
        return
    }
    await deleteRecord(T.comment, id)
}
export async function getProjectCalls(): Promise<ProjectCall[]> { return USE_MOCK ? mockProjectCalls : normalizeProjectCalls(await fetchTable(T.project_call)) }
export async function getProjects(): Promise<Project[]> { return USE_MOCK ? mockProjects : normalizeProjects(await fetchTable(T.project)) }
export async function getFinancialAgreements(): Promise<FinancialAgreement[]> { return USE_MOCK ? mockFinancialAgreements : normalizeFinancialAgreements(await fetchTable(T.financial_agreement)) }
export async function getPhds(): Promise<Phd[]> { return USE_MOCK ? mockPhds : normalizePhds(await fetchTable(T.phd)) }
export async function getMobilityGrants(): Promise<MobilityGrant[]> { return USE_MOCK ? mockMobilityGrants : normalizeMobilityGrants(await fetchTable(T.mobility_grant)) }

// --- Budget & indicateurs ---

export async function getIndicatorDefinitions(): Promise<IndicatorDefinition[]> { return USE_MOCK ? mockIndicatorDefinitions : normalizeIndicatorDefinitions(await fetchTable(T.indicator_definition)) }
export async function getBudgetCategories(): Promise<BudgetCategory[]> { return USE_MOCK ? mockBudgetCategories : normalizeBudgetCategories(await fetchTable(T.budget_category)) }
export async function getBudgetDetails(): Promise<BudgetDetail[]> { return USE_MOCK ? mockBudgetDetails : normalizeBudgetDetails(await fetchTable(T.budget_detail)) }

// --- To-do ---

export async function getToDoLists(): Promise<ToDoList[]> { return USE_MOCK ? mockToDoLists : normalizeToDoLists(await fetchTable(T.to_do_list)) }
export async function getToDoItems(): Promise<ToDoItem[]> { return USE_MOCK ? mockToDoItems : normalizeToDoItems(await fetchTable(T.to_do_item)) }

// --- Liens globaux (pour les filtres du kanban) ---

export async function getAllAxisActionCards(): Promise<AxisActionCard[]> {
    if (USE_MOCK) return [...mockAxisActionCards]
    const rows = await fetchTable(T.axis_action_card)
    return rows.map(r => ({ id: Number(r.id), axis_id: Number(r.axis_id), action_card_id: Number(r.action_card_id) }))
}

export async function getAllMemberActionCards(): Promise<MemberActionCard[]> {
    if (USE_MOCK) return [...mockMemberActionCards]
    const rows = await fetchTable(T.member_action_card)
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
            fetchTable(T.member_action_card).then(normalizeMemberActionCards),
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
            fetchTable(T.project_action_card).then(normalizeProjectActionCards),
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
        fetchTable(T.to_do_list).then(normalizeToDoLists),
        fetchTable(T.to_do_item).then(normalizeToDoItems),
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
    await updateRecord(T.to_do_item, id, patch)
}

export async function addToDoItemToList(listId: number, content: string): Promise<ToDoItem> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockToDoItems.map(i => i.id)) + 1
        const item: ToDoItem = { id: newId, list_id: listId, content, status_id: 8, start_date: '', end_time: '' }
        mockToDoItems.push(item)
        return item
    }
    const id = await addRecord(T.to_do_item, { list_id: listId, content, status_id: 8 })
    return { id, list_id: listId, content, status_id: 8, start_date: '', end_time: '' }
}

export async function addToDoListToCard(cardId: number, title: string): Promise<ToDoList & { items: ToDoItem[] }> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockToDoLists.map(l => l.id)) + 1
        const list: ToDoList = { id: newId, action_card_id: cardId, title }
        mockToDoLists.push(list)
        return { ...list, items: [] }
    }
    const id = await addRecord(T.to_do_list, { action_card_id: cardId, title })
    return { id, action_card_id: cardId, title, items: [] }
}

export async function addMemberToCard(cardId: number, memberId: number, role: string): Promise<MemberActionCard & { member: Member }> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockMemberActionCards.map(m => m.id)) + 1
        const link: MemberActionCard = { id: newId, member_id: memberId, action_card_id: cardId, role }
        mockMemberActionCards.push(link)
        return { ...link, member: mockMembers.find(m => m.id === memberId)! }
    }
    const id = await addRecord(T.member_action_card, { member_id: memberId, action_card_id: cardId, role })
    const members = await getMembers()
    return { id, member_id: memberId, action_card_id: cardId, role, member: members.find(m => m.id === memberId)! }
}

export async function removeMemberFromCard(linkId: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockMemberActionCards.findIndex(m => m.id === linkId)
        if (i !== -1) mockMemberActionCards.splice(i, 1)
        return
    }
    await deleteRecord(T.member_action_card, linkId)
}

export async function addProjectToCard(cardId: number, projectId: number): Promise<ProjectActionCard & { project: Project }> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockProjectActionCards.map(p => p.id)) + 1
        const link: ProjectActionCard = { id: newId, project_id: projectId, action_card_id: cardId }
        mockProjectActionCards.push(link)
        return { ...link, project: mockProjects.find(p => p.id === projectId)! }
    }
    const id = await addRecord(T.project_action_card, { project_id: projectId, action_card_id: cardId })
    const projects = await getProjects()
    return { id, project_id: projectId, action_card_id: cardId, project: projects.find(p => p.id === projectId)! }
}

export async function removeProjectFromCard(linkId: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockProjectActionCards.findIndex(p => p.id === linkId)
        if (i !== -1) mockProjectActionCards.splice(i, 1)
        return
    }
    await deleteRecord(T.project_action_card, linkId)
}

export async function addGroup(name: string): Promise<Group> {
    if (USE_MOCK) {
        const id = Math.max(0, ...mockGroup.map(g => g.id)) + 1
        const group: Group = { id, name }
        mockGroup.push(group)
        return group
    }
    const id = await addRecord(T.group, { name })
    return { id, name }
}

export async function deleteGroup(id: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockGroup.findIndex(g => g.id === id)
        if (i !== -1) mockGroup.splice(i, 1)
        return
    }
    await deleteRecord(T.group, id)
}

export async function addMemberToGroup(memberId: number, groupId: number): Promise<GroupMember> {
    if (USE_MOCK) {
        const id = Math.max(0, ...mockGroupMember.map(g => g.id)) + 1
        const link: GroupMember = { id, member_id: memberId, group_id: groupId }
        mockGroupMember.push(link)
        return link
    }
    const id = await addRecord(T.group_member, { member_id: memberId, group_id: groupId })
    return { id, member_id: memberId, group_id: groupId }
}

export async function removeMemberFromGroup(linkId: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockGroupMember.findIndex(g => g.id === linkId)
        if (i !== -1) mockGroupMember.splice(i, 1)
        return
    }
    await deleteRecord(T.group_member, linkId)
}

export async function getMembersByGroup(groupId: number): Promise<Member[]> {
    const [links, members] = await Promise.all([
        USE_MOCK ? mockGroupMember : normalizeGroupMember(await fetchTable(T.group_member)),
        getMembers()
    ])
    const memberIds = links.filter(l => l.group_id === groupId).map(l => l.member_id)
    return members.filter(m => memberIds.includes(m.id))
}

// Renvoie les groupes d'un membre spécifique
export async function getGroupsByMember(memberId: number): Promise<Group[]> {
    const [links, groups] = await Promise.all([
        USE_MOCK ? mockGroupMember : normalizeGroupMember(await fetchTable(T.group_member)),
        getGroups()
    ])
    const groupIds = links.filter(l => l.member_id === memberId).map(l => l.group_id)
    return groups.filter(g => groupIds.includes(g.id))
}

export async function getAgreementActionCardsByCard(cardId: number): Promise<(AgreementActionCard & { agreement: FinancialAgreement })[]> {
    const [links, agreements] = await (USE_MOCK
        ? Promise.resolve([
            mockAgreementActionCards.filter(a => a.action_card_id === cardId),
            mockFinancialAgreements,
        ])
        : Promise.all([
            fetchTable(T.agreement_action_card).then(normalizeAgreementActionCards),
            getFinancialAgreements(),
        ])
    )
    const agreementMap = new Map((agreements as FinancialAgreement[]).map(a => [a.id, a]))
    return (links as AgreementActionCard[])
        .filter(l => l.action_card_id === cardId)
        .map(l => ({ ...l, agreement: agreementMap.get(l.financial_agreement_id)! }))
        .filter(l => l.agreement)
}

export async function addAgreementToCard(cardId: number, agreementId: number): Promise<AgreementActionCard & { agreement: FinancialAgreement }> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockAgreementActionCards.map(a => a.id)) + 1
        const link: AgreementActionCard = { id: newId, financial_agreement_id: agreementId, action_card_id: cardId }
        mockAgreementActionCards.push(link)
        return { ...link, agreement: mockFinancialAgreements.find(a => a.id === agreementId)! }
    }
    const id = await addRecord(T.agreement_action_card, { financial_agreement_id: agreementId, action_card_id: cardId })
    const agreements = await getFinancialAgreements()
    return { id, financial_agreement_id: agreementId, action_card_id: cardId, agreement: agreements.find(a => a.id === agreementId)! }
}

export async function removeAgreementFromCard(linkId: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockAgreementActionCards.findIndex(a => a.id === linkId)
        if (i !== -1) mockAgreementActionCards.splice(i, 1)
        return
    }
    await deleteRecord(T.agreement_action_card, linkId)
}

// --- Membres ---

export async function getMembersFull(): Promise<MemberFull[]> {
    const [members, partners, labs] = await (USE_MOCK
        ? Promise.resolve([mockMembers, mockPartners, mockLabs])
        : Promise.all([getMembers(), getPartners(), getLabs()])
    )
    const partnerMap = new Map((partners as Partner[]).map(p => [p.id, p]))
    const labMap = new Map((labs as Lab[]).map(l => [l.id, l]))
    return (members as Member[]).map(m => ({
        ...m,
        partner: partnerMap.get(m.partner_id) ?? null,
        lab: labMap.get(m.lab_id) ?? null,
    }))
}

export async function getLabCardsFull(): Promise<LabCardFull[]> {
    const [labRows, partnerLabs, partners, members] = await (USE_MOCK
        ? Promise.resolve([mockLabs, mockPartnerLabs, mockPartners, mockMembers])
        : Promise.all([
            fetchTable(T.lab),
            getPartnerLabs(),
            getPartners(),
            getMembers(),
        ])
    )
    if (USE_MOCK) {
        return normalizeLabCardsFull(
            (labRows as Lab[]).map(l => l as unknown as Record<string, unknown>),
            partnerLabs as PartnerLab[],
            partners as Partner[],
            members as Member[],
        )
    }
    return normalizeLabCardsFull(
        labRows as Record<string, unknown>[],
        partnerLabs as PartnerLab[],
        partners as Partner[],
        members as Member[],
    )
}

export async function addMember(fields: Omit<Member, 'id'>): Promise<Member> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockMembers.map(m => m.id)) + 1
        const member: Member = { id: newId, ...fields }
        mockMembers.push(member)
        return member
    }
    const { lab_id, ...gristFields } = fields
    const id = await addRecord(T.member, gristFields)
    if (lab_id) {
        try { await updateRecord(T.member, id, { lab_id }) } catch { /* colonne lab_id absente */ }
    }
    return { id, ...fields }
}

export async function updateMember(id: number, patch: Partial<Omit<Member, 'id'>>): Promise<void> {
    if (USE_MOCK) {
        const m = mockMembers.find(m => m.id === id)
        if (m) Object.assign(m, patch)
        return
    }
    const { lab_id, ...gristPatch } = patch
    if (Object.keys(gristPatch).length > 0) await updateRecord(T.member, id, gristPatch)
    if (lab_id !== undefined) {
        try { await updateRecord(T.member, id, { lab_id }) } catch { /* colonne lab_id absente de Grist */ }
    }
}

export async function deleteMember(id: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockMembers.findIndex(m => m.id === id)
        if (i !== -1) mockMembers.splice(i, 1)
        return
    }
    await deleteRecord(T.member, id)
}

// --- Partenaires ---

export async function addPartner(fields: Omit<Partner, 'id'>): Promise<Partner> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockPartners.map(p => p.id)) + 1
        const partner: Partner = { id: newId, ...fields }
        mockPartners.push(partner)
        return partner
    }
    const id = await addRecord(T.partner, fields)
    return { id, ...fields }
}

export async function updatePartner(id: number, patch: Partial<Omit<Partner, 'id'>>): Promise<void> {
    if (USE_MOCK) {
        const p = mockPartners.find(p => p.id === id)
        if (p) Object.assign(p, patch)
        return
    }
    await updateRecord(T.partner, id, patch)
}

export async function deletePartner(id: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockPartners.findIndex(p => p.id === id)
        if (i !== -1) mockPartners.splice(i, 1)
        return
    }
    await deleteRecord(T.partner, id)
}

// --- Laboratoires ---

export async function addLab(fields: Omit<Lab, 'id'>): Promise<Lab> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockLabs.map(l => l.id)) + 1
        const lab: Lab = { id: newId, ...fields }
        mockLabs.push(lab)
        return lab
    }
    const id = await addRecord(T.lab, fields)
    return { id, ...fields }
}

export async function updateLab(id: number, patch: Partial<Omit<Lab, 'id'>>): Promise<void> {
    if (USE_MOCK) {
        const l = mockLabs.find(l => l.id === id)
        if (l) Object.assign(l, patch)
        return
    }
    await updateRecord(T.lab, id, patch)
}

export async function deleteLab(id: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockLabs.findIndex(l => l.id === id)
        if (i !== -1) mockLabs.splice(i, 1)
        return
    }
    await deleteRecord(T.lab, id)
}

export async function addPartnerToLab(labId: number, partnerId: number): Promise<PartnerLab> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockPartnerLabs.map(pl => pl.id)) + 1
        const link: PartnerLab = { id: newId, lab_id: labId, partner_id: partnerId }
        mockPartnerLabs.push(link)
        return link
    }
    const id = await addRecord(T.partner_lab, { lab_id: labId, partner_id: partnerId })
    return { id, lab_id: labId, partner_id: partnerId }
}

export async function removePartnerFromLab(linkId: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockPartnerLabs.findIndex(pl => pl.id === linkId)
        if (i !== -1) mockPartnerLabs.splice(i, 1)
        return
    }
    await deleteRecord(T.partner_lab, linkId)
}

export async function attachMemberToLab(memberId: number, labId: number): Promise<void> {
    if (USE_MOCK) {
        const m = mockMembers.find(m => m.id === memberId)
        if (m) m.lab_id = labId
        return
    }
    try { await updateRecord(T.member, memberId, { lab_id: labId }) } catch { /* colonne lab_id absente */ }
}

export async function detachMemberFromLab(memberId: number): Promise<void> {
    if (USE_MOCK) {
        const m = mockMembers.find(m => m.id === memberId)
        if (m) m.lab_id = 0
        return
    }
    try { await updateRecord(T.member, memberId, { lab_id: 0 }) } catch { /* colonne lab_id absente */ }
}

// --- Appels à projets ---

export async function addProjectCall(fields: Omit<ProjectCall, 'id'>): Promise<ProjectCall> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockProjectCalls.map(p => p.id)) + 1
        const pc: ProjectCall = { id: newId, ...fields }
        mockProjectCalls.push(pc)
        return pc
    }
    const id = await addRecord(T.project_call, fields)
    return { id, ...fields }
}

export async function updateProjectCall(id: number, patch: Partial<Omit<ProjectCall, 'id'>>): Promise<void> {
    if (USE_MOCK) {
        const pc = mockProjectCalls.find(p => p.id === id)
        if (pc) Object.assign(pc, patch)
        return
    }
    await updateRecord(T.project_call, id, patch)
}

export async function deleteProjectCall(id: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockProjectCalls.findIndex(p => p.id === id)
        if (i !== -1) mockProjectCalls.splice(i, 1)
        return
    }
    await deleteRecord(T.project_call, id)
}

// --- Projets ---

export async function addProject(fields: Omit<Project, 'id'>): Promise<Project> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockProjects.map(p => p.id)) + 1
        const project: Project = { id: newId, ...fields }
        mockProjects.push(project)
        return project
    }
    const id = await addRecord(T.project, fields)
    return { id, ...fields }
}

export async function updateProject(id: number, patch: Partial<Omit<Project, 'id'>>): Promise<void> {
    if (USE_MOCK) {
        const p = mockProjects.find(p => p.id === id)
        if (p) Object.assign(p, patch)
        return
    }
    await updateRecord(T.project, id, patch)
}

export async function deleteProject(id: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockProjects.findIndex(p => p.id === id)
        if (i !== -1) mockProjects.splice(i, 1)
        return
    }
    await deleteRecord(T.project, id)
}

// --- Conventions financières ---

export async function getAgreementsByProject(projectId: number): Promise<(FinancialAgreement & { partner: Partner })[]> {
    const [agreements, partners] = await (USE_MOCK
        ? Promise.resolve([mockFinancialAgreements, mockPartners])
        : Promise.all([
            getFinancialAgreements(),
            getPartners(),
        ])
    )
    const partnerMap = new Map((partners as Partner[]).map(p => [p.id, p]))
    return (agreements as FinancialAgreement[])
        .filter(a => a.project_id === projectId)
        .map(a => ({ ...a, partner: partnerMap.get(a.partner_id)! }))
        .filter(a => a.partner)
}

export async function addAgreement(fields: Omit<FinancialAgreement, 'id'>): Promise<FinancialAgreement> {
    if (USE_MOCK) {
        const newId = Math.max(0, ...mockFinancialAgreements.map(a => a.id)) + 1
        const agreement: FinancialAgreement = { id: newId, ...fields }
        mockFinancialAgreements.push(agreement)
        return agreement
    }
    const id = await addRecord(T.financial_agreement, fields)
    return { id, ...fields }
}

export async function updateAgreement(id: number, patch: Partial<Omit<FinancialAgreement, 'id'>>): Promise<void> {
    if (USE_MOCK) {
        const a = mockFinancialAgreements.find(a => a.id === id)
        if (a) Object.assign(a, patch)
        return
    }
    await updateRecord(T.financial_agreement, id, patch)
}

export async function deleteAgreement(id: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockFinancialAgreements.findIndex(a => a.id === id)
        if (i !== -1) mockFinancialAgreements.splice(i, 1)
        return
    }
    await deleteRecord(T.financial_agreement, id)
}

// --- Catégories ---

export async function createCategory(title: string, parentId: number | null, color?: string | null): Promise<Category> {
    if (USE_MOCK) {
        const newId = Math.max(...mockCategories.map(c => c.id)) + 1
        const cat: Category = { id: newId, parent_category_id: parentId, title, color: color ?? null }
        mockCategories.push(cat)
        return cat
    }
    const id = await addRecord(T.category, { title, parent_category_id: parentId ?? 0, color: color ?? '' })
    return { id, parent_category_id: parentId, title, color: color ?? null }
}

export async function updateCategory(id: number, patch: Partial<Pick<Category, 'title' | 'parent_category_id' | 'color'>>): Promise<void> {
    if (USE_MOCK) {
        const cat = mockCategories.find(c => c.id === id)
        if (cat) Object.assign(cat, patch)
        return
    }
    await updateRecord(T.category, id, patch)
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
    return await addRecord(T.category, { title: 'Autre', parent_category_id: null })
}

export async function deleteCategory(id: number): Promise<void> {
    const autreId = await getOrCreateOtherCategory()

    if (USE_MOCK) {
        // Reassign action cards to "Autre"
        for (const card of mockActionCards) {
            if (card.category_id === id) card.category_id = autreId
        }
        // Promote child categories to root
        for (const cat of mockCategories) {
            if (cat.parent_category_id === id) cat.parent_category_id = null
        }
        const i = mockCategories.findIndex(c => c.id === id)
        if (i !== -1) mockCategories.splice(i, 1)
        return
    }

    const [allCards, allCats] = await Promise.all([
        fetchTable(T.action_card),
        getCategories(),
    ])

    // Reassign action cards to "Autre"
    const cardsToMove = allCards.filter(r => r.category_id === id)
    await Promise.all(cardsToMove.map(r => updateRecord(T.action_card, r.id as number, { category_id: autreId })))

    // Promote child categories to root
    const children = allCats.filter(c => c.parent_category_id === id)
    await Promise.all(children.map(c => updateRecord(T.category, c.id, { parent_category_id: 0 })))

    await deleteRecord(T.category, id)
}

// --- Mutations ---

// Formulaire de création d'une ActionCard complète
export type ActionCardCreateForm = {
    // Général
    title: string
    description: string
    start_date: string
    end_date: string
    // Classification
    status_id: number
    category_id: number
    axis_id: number | null
    // Personnes
    owner_id: number
    members: { member_id: number; role: string }[]
    // Projet
    project_id: number | null
    // To-do
    todo_title: string
    todo_items: string[]
}

export async function createActionCardFull(form: ActionCardCreateForm): Promise<ActionCardFull> {
    if (USE_MOCK) {
        // En mode mock on pousse dans les tableaux en mémoire (reload = reset)
        const newId = Math.max(...mockActionCards.map(c => c.id)) + 1
        const card = {
            id: newId,
            owner_id: form.owner_id,
            category_id: form.category_id,
            status_id: form.status_id,
            title: form.title,
            color: '',
            description: form.description,
            start_date: form.start_date,
            end_date: form.end_date,
        }
        mockActionCards.push(card)

        const statusMap = new Map(mockStatuses.map(s => [s.id, s]))
        const categoryMap = new Map(mockCategories.map(c => [c.id, c]))
        const memberMap = new Map(mockMembers.map(m => [m.id, m]))
        const category = categoryMap.get(form.category_id)!
        const parent = category.parent_category_id ? categoryMap.get(category.parent_category_id) ?? null : null

        return { ...card, status: statusMap.get(form.status_id)!, category: { ...category, parent }, owner: memberMap.get(form.owner_id)! }
    }

    // 1. Créer la carte principale
    const cardId = await addRecord(T.action_card, {
        title: form.title,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        status_id: form.status_id,
        category_id: form.category_id,
        owner_id: form.owner_id,
    })

    // 2. Lier les participants en parallèle avec les autres relations
    await Promise.all([
        form.members.length > 0
            ? addRecords(T.member_action_card, form.members.map(m => ({ member_id: m.member_id, action_card_id: cardId, role: m.role })))
            : Promise.resolve([]),
        form.project_id
            ? addRecord(T.project_action_card, { project_id: form.project_id, action_card_id: cardId })
            : Promise.resolve(0),
        form.axis_id
            ? addRecord(T.axis_action_card, { axis_id: form.axis_id, action_card_id: cardId })
            : Promise.resolve(0),
        (async () => {
            if (!form.todo_title && form.todo_items.length === 0) return
            const listId = await addRecord(T.to_do_list, { action_card_id: cardId, title: form.todo_title || 'To-do' })
            if (form.todo_items.length > 0) {
                await addRecords(T.to_do_item, form.todo_items.map(content => ({
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
    await updateRecord(T.action_card, id, patch)
}

export async function deleteActionCard(id: number): Promise<void> {
    if (USE_MOCK) {
        const i = mockActionCards.findIndex(c => c.id === id)
        if (i !== -1) mockActionCards.splice(i, 1)
        return
    }
    await deleteRecord(T.action_card, id)
}

// --- Requête enrichie (jointures) ---

export async function getActionCardsFull(): Promise<ActionCardFull[]> {
    if (USE_MOCK) {
        const statusMap = new Map(mockStatuses.map(s => [s.id, s]))
        const categoryMap = new Map(mockCategories.map(c => [c.id, c]))
        const memberMap = new Map(mockMembers.map(m => [m.id, m]))

        return mockActionCards.map(card => ({
            ...card,
            status: statusMap.get(card.status_id)!,
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
        fetchTable(T.action_card),
        getStatuses(),
        getCategories(),
        getMembers(),
    ])

    return normalizeActionCardsFull(rows, statuses, categories, members)
}

export async function getPartnerCardsFull(): Promise<PartnerCardFull[]> {
    if (USE_MOCK) {

        const membersByPartner = new Map<number, Member[]>()
        for (const m of mockMembers) {
            const existing = membersByPartner.get(m.partner_id) ?? []
            membersByPartner.set(m.partner_id, [...existing, m])
        }

        // Agreements — boucle sur mockFinancialAgreements
        const agreementsByPartner = new Map<number, FinancialAgreement[]>()
        for (const a of mockFinancialAgreements) {
            const existing = agreementsByPartner.get(a.partner_id) ?? []
            agreementsByPartner.set(a.partner_id, [...existing, a])
        }

        // Projects — déduits depuis les conventions (pas de partner_id direct)
        const projectsByPartner = new Map<number, Project[]>()
        for (const a of mockFinancialAgreements) {
            const project = mockProjects.find(p => p.id === a.project_id)
            if (!project) continue
            const existing = projectsByPartner.get(a.partner_id) ?? []
            // éviter les doublons si plusieurs conventions sur le même projet
            if (!existing.find(p => p.id === project.id)) {
                projectsByPartner.set(a.partner_id, [...existing, project])
            }
        }

        return mockPartners.map(partner => ({
            ...partner,
            members: membersByPartner.get(partner.id) ?? [],
            agreements: agreementsByPartner.get(partner.id) ?? [],
            projects: projectsByPartner.get(partner.id) ?? []

        }))
    }

    const [rows, financial_agreements, projects, members] = await Promise.all([
        fetchTable(T.partner),
        getFinancialAgreements(),
        getProjects(),
        getMembers(),
    ])

    return normalizePartnerCardsFull(rows, financial_agreements, projects, members)
}

