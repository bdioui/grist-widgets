// --- Tables de référence ---


export type User = {
    first_name: string
    last_name: string
    email: string
    picture?: string
}

export type Status = {
    id: number
    label: string   // 'En cours' | 'Terminé' | 'Annulé' | 'Planifié'
    context: string // 'action_card' | 'project_call' | 'todo_item'
}

export type Category = {
    id: number
    parent_category_id: number | null
    title: string
    color?: string | null
}

export type Partner = {
    id: number
    name: string
    description: string
    color: string
    logo: string
    status_id: number
    type: string // 'Entreprise privée' | 'Association' | ...
    consortium: boolean
}

export type Lab = {
    id: number
    name: string
    description: string
    type: string // 'Laboratoire académique' | 'UMR' | 'Équipe de recherche' | ...
    topic: string
}

export type PartnerLab = {
    id: number
    lab_id: number
    partner_id: number
}

export type Member = {
    id: number
    partner_id: number
    lab_id: number
    first_name: string
    last_name: string
    position: string
    email: string
    tel: string
    genre: string
    status: string // 'Prof' | 'Enseignant-chercheur' | 'BIATSS' | ...
    profile_image: string
}

export type GroupMember = {
    id: number
    member_id: number
    group_id: number
}

export type Group = {
    id: number
    name: string
}

export type ProjectMember = {
    id: number
    member_id: number
    project_id: number
}

export type AgreementMember = {
    id: number
    member_id: number
    agreement_id: number
}

export type Axis = {
    id: number
    name: string
    description: string
}

// --- Indicateurs ---

export type IndicatorDefinition = {
    id: number
    label: string
    unit: string
    definition: string
    dimension: string
}

export type ActionIndicatorValue = {
    id: number
    action_card_id: number
    indicator_id: number
    value: number
    comment: string
    date: string
    year: string
    author_id: number
}

// --- Cœur du système ---

export type ProjectCall = {
    id: number
    axis_id: number
    title: string
    description: string
    start_date: string
    end_date: string
    status_id: number
}

export type Project = {
    id: number
    project_call_id: number
    status_id: number
    title: string
    description: string
    budget: number
    grant: number
}

export type FinancialAgreement = {
    id: number
    project_id: number
    partner_id: number
    status_id: number
    title: string
    description: string
    budget: number
    grant: number
    signed_date: string
}

export type Phd = {
    id: number
    member_id: number
    start_date: string
    end_date: string
    axis_id: number
}

export type MobilityGrant = {
    id: number
    member_id: number
    start_date: string
    end_date: string
    axis_id: number
}

export type ActionCard = {
    id: number
    owner_id: number
    category_id: number
    status_id: number
    title: string
    color: string
    description: string
    start_date: string
    end_date: string
}

export type Comment = {
    id: number
    owner_id: number
    parent_comment_id?: number
    action_card_id: number
    content: string
    timestamp: string
}

export type CommentFull = Comment & {
    owner: Member
    replies?: CommentFull[]
}

// --- Budget ---

export type BudgetCategory = {
    id: number
    partner_id: number | null
    title: string
}

export type BudgetDetail = {
    id: number
    budget_category_id: number
    title: string
    description: string
    budget: number
}

// --- Tables de jonction ---

export type MemberActionCard = {
    id: number
    member_id: number
    action_card_id: number
    role: string // 'responsable' | 'contributeur' | 'observateur'
}

export type AxisActionCard = {
    id: number
    axis_id: number
    action_card_id: number
}

export type ProjectActionCard = {
    id: number
    project_id: number
    action_card_id: number
}

export type AgreementActionCard = {
    id: number
    financial_agreement_id: number
    action_card_id: number
}

// --- To-do ---

export type ToDoList = {
    id: number
    action_card_id: number
    title: string
}

export type ToDoItem = {
    id: number
    list_id: number
    content: string
    status_id: number
    start_date: string
    end_time: string
}

// --- Types enrichis (jointures côté front) ---

export type ActionCardFull = ActionCard & {
    status: Status
    category: Category & { parent: Category | null }
    owner: Member
}

export type MemberFull = Member & {
    partner: Partner | null
    lab: Lab | null
}

export type PartnerCardFull = Partner & {
    projects: Project[]
    agreements: FinancialAgreement[]
    members: Member[]
}

export type LabCardFull = Lab & {
    partners: Partner[]
    members: Member[]
}

