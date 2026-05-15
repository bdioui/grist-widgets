import type {
    Status, Category, Member, Partner, Axis,
    ActionCard, ProjectCall, Project, FinancialAgreement,
    Phd, MobilityGrant, ToDoList, ToDoItem,
    IndicatorDefinition, BudgetCategory, BudgetDetail,
    MemberActionCard, AxisActionCard, ProjectActionCard,
} from '@/lib/types'

export const mockStatuses: Status[] = [
    { id: 1, label: 'En cours',  context: 'action_card' },
    { id: 2, label: 'Planifié',  context: 'action_card' },
    { id: 3, label: 'Terminé',   context: 'action_card' },
    { id: 4, label: 'Annulé',    context: 'action_card' },
    { id: 5, label: 'À traiter', context: 'action_card' },
    { id: 6, label: 'En cours',  context: 'project_call' },
    { id: 7, label: 'Terminé',   context: 'project_call' },
    { id: 8, label: 'En cours',  context: 'todo_item' },
    { id: 9, label: 'Terminé',   context: 'todo_item' },
]

export const mockCategories: Category[] = [
    { id: 1, parent_category_id: null, title: 'Formation' },
    { id: 2, parent_category_id: 1,    title: 'Sensibilisation' },
    { id: 3, parent_category_id: 1,    title: 'Doctorat' },
    { id: 4, parent_category_id: null, title: 'Recherche' },
    { id: 5, parent_category_id: 4,    title: 'Valorisation' },
    { id: 6, parent_category_id: null, title: 'Partenariat' },
    { id: 7, parent_category_id: 6,    title: 'Gouvernance' },
    { id: 8, parent_category_id: null, title: 'Mobilité' },
    { id: 9, parent_category_id: null, title: 'Financier' },
    { id: 10, parent_category_id: null, title: 'Communication' },
]

export const mockPartners: Partner[] = [
    { id: 1, name: 'Université X', description: 'Université partenaire principale', color: '#dbeafe', logo: '', status_id: 1, type: 'Université' },
    { id: 2, name: 'Entreprise A', description: 'Partenaire industriel', color: '#d1fae5', logo: '', status_id: 1, type: 'Entreprise privée' },
    { id: 3, name: 'Association B', description: 'Association de recherche', color: '#ede9fe', logo: '', status_id: 1, type: 'Association' },
]

export const mockMembers: Member[] = [
    { id: 1, partner_id: 1, first_name: 'Marie',   last_name: 'Dupont',  position: 'Coordinatrice de projet', email: 'marie.dupont@univ.fr',   tel: '0600000001', genre: 'F', status: 'Enseignant-chercheur', profile_image: '' },
    { id: 2, partner_id: 1, first_name: 'Thomas',  last_name: 'Martin',  position: 'Enseignant-chercheur',    email: 'thomas.martin@univ.fr',   tel: '0600000002', genre: 'M', status: 'Enseignant-chercheur', profile_image: '' },
    { id: 3, partner_id: 1, first_name: 'Claire',  last_name: 'Bernard', position: 'Gestionnaire',            email: 'claire.bernard@univ.fr',  tel: '0600000003', genre: 'F', status: 'BIATSS',               profile_image: '' },
    { id: 4, partner_id: 1, first_name: 'Antoine', last_name: 'Leroy',   position: 'Doctorant',               email: 'antoine.leroy@univ.fr',   tel: '0600000004', genre: 'M', status: 'Doctorant',             profile_image: '' },
]

export const mockAxes: Axis[] = [
    { id: 1, name: 'Axe 1 – Formation',       description: 'Actions liées à la formation et à la pédagogie' },
    { id: 2, name: 'Axe 2 – Recherche',        description: 'Actions liées à la recherche et à la valorisation' },
    { id: 3, name: 'Axe 3 – International',    description: 'Actions liées à la mobilité et aux partenariats internationaux' },
]

export const mockActionCards: ActionCard[] = [
    { id: 1,  owner_id: 1, category_id: 2,  status_id: 1, title: 'Séminaire de lancement AAP',             color: '#dbeafe', description: 'Organisation du séminaire de lancement de l\'appel à projets. Indicateur cible : 80 participants.', start_date: '2025-09-01', end_date: '2025-09-15' },
    { id: 2,  owner_id: 2, category_id: 2,  status_id: 2, title: 'Module de sensibilisation étudiants',    color: '#dbeafe', description: 'Conception d\'un module pédagogique de 3h destiné aux étudiants de L3 et M1.', start_date: '2025-10-01', end_date: '2025-12-15' },
    { id: 3,  owner_id: 2, category_id: 3,  status_id: 2, title: 'Atelier doctorants – Rédaction scientifique', color: '#ede9fe', description: 'Atelier de 2 jours animé par un enseignant-chercheur senior.', start_date: '2025-11-10', end_date: '2025-11-11' },
    { id: 4,  owner_id: 1, category_id: 4,  status_id: 5, title: 'Dépôt rapport intermédiaire AAP-01',    color: '#fce7f3', description: 'Rédaction et dépôt du rapport intermédiaire pour l\'appel à projets AAP-01.', start_date: '2025-06-01', end_date: '2025-06-30' },
    { id: 5,  owner_id: 2, category_id: 5,  status_id: 1, title: 'Publication actes de colloque',          color: '#fce7f3', description: 'Coordination de la publication des actes du colloque annuel.', start_date: '2025-05-01', end_date: '2025-07-31' },
    { id: 6,  owner_id: 3, category_id: 6,  status_id: 5, title: 'Convention partenariat Entreprise A',   color: '#ffedd5', description: 'Finalisation de la convention de partenariat. Budget engagé : 45 000 €.', start_date: '2025-05-15', end_date: '' },
    { id: 7,  owner_id: 1, category_id: 7,  status_id: 2, title: 'Réunion comité de pilotage',             color: '#e0f2fe', description: 'Réunion trimestrielle du comité de pilotage.', start_date: '2025-07-10', end_date: '' },
    { id: 8,  owner_id: 4, category_id: 8,  status_id: 2, title: 'Bourse de mobilité – Conférence Berlin', color: '#d1fae5', description: 'Mobilité sortante pour présentation de travaux. Montant estimé : 1 200 €.', start_date: '2025-09-22', end_date: '2025-09-26' },
    { id: 9,  owner_id: 2, category_id: 3,  status_id: 1, title: 'Suivi thèse – Co-tutelle internationale', color: '#ede9fe', description: 'Encadrement d\'une thèse en co-tutelle internationale.', start_date: '2024-10-01', end_date: '2027-09-30' },
    { id: 10, owner_id: 3, category_id: 9,  status_id: 5, title: 'Ventilation dépenses SIFAC – T1',        color: '#fef9c3', description: 'Ventilation des enregistrements financiers SIFAC du premier trimestre.', start_date: '2025-04-01', end_date: '2025-04-30' },
    { id: 11, owner_id: 3, category_id: 9,  status_id: 1, title: 'Révision annexe financière partenaire B', color: '#fef9c3', description: 'Mise à jour de l\'annexe financière suite à un redéploiement budgétaire.', start_date: '2025-05-01', end_date: '' },
    { id: 12, owner_id: 1, category_id: 10, status_id: 1, title: 'Mise à jour site web du projet',          color: '#e0f2fe', description: 'Publication des derniers résultats et actualités.', start_date: '2025-05-10', end_date: '' },
]

export const mockProjectCalls: ProjectCall[] = [
    { id: 1, axis_id: 1, title: 'AAP-01 – Formation innovante', description: 'Appel à projets pour des actions de formation innovante.', start_date: '2024-01-01', end_date: '2025-12-31', status_id: 6 },
    { id: 2, axis_id: 2, title: 'AAP-02 – Recherche appliquée', description: 'Appel à projets pour des travaux de recherche appliquée.', start_date: '2024-06-01', end_date: '2026-05-31', status_id: 6 },
]

export const mockProjects: Project[] = [
    { id: 1, project_call_id: 1, title: 'Projet Formation Numérique', budget: 120000, grant: 80000 },
    { id: 2, project_call_id: 2, title: 'Projet Recherche IA', budget: 200000, grant: 150000 },
]

export const mockFinancialAgreements: FinancialAgreement[] = [
    { id: 1, project_id: 1, partner_id: 2, title: 'Convention Entreprise A', description: 'Accord de co-financement', budget: 45000, grant: 30000, signed_date: '2024-03-01' },
    { id: 2, project_id: 2, partner_id: 3, title: 'Convention Association B', description: 'Accord de partenariat recherche', budget: 60000, grant: 50000, signed_date: '2024-06-15' },
]

export const mockPhds: Phd[] = [
    { id: 1, member_id: 4, start_date: '2024-10-01', end_date: '2027-09-30', axis_id: 2 },
]

export const mockMobilityGrants: MobilityGrant[] = [
    { id: 1, member_id: 4, start_date: '2025-09-22', end_date: '2025-09-26', axis_id: 3 },
]

export const mockIndicatorDefinitions: IndicatorDefinition[] = [
    { id: 1, label: 'Nombre d\'étudiants sensibilisés', unit: 'étudiants', definition: 'Nombre total d\'étudiants ayant participé à une action de sensibilisation.', dimension: 'Formation' },
    { id: 2, label: 'Nombre de publications',           unit: 'publications', definition: 'Nombre d\'articles ou actes publiés dans le cadre du projet.', dimension: 'Recherche' },
    { id: 3, label: 'Nombre de mobilités',              unit: 'mobilités', definition: 'Nombre de mobilités sortantes financées.', dimension: 'International' },
]

export const mockBudgetCategories: BudgetCategory[] = [
    { id: 1, partner_id: null, title: 'Personnel' },
    { id: 2, partner_id: null, title: 'Équipement' },
    { id: 3, partner_id: null, title: 'Missions' },
    { id: 4, partner_id: null, title: 'Autres dépenses' },
]

export const mockBudgetDetails: BudgetDetail[] = [
    { id: 1, budget_category_id: 1, title: 'Post-doctorants', description: 'Salaires post-docs', budget: 60000 },
    { id: 2, budget_category_id: 1, title: 'Ingénieurs',      description: 'Salaires ingénieurs', budget: 40000 },
    { id: 3, budget_category_id: 3, title: 'Déplacements',    description: 'Frais de mission',    budget: 15000 },
]

export const mockToDoLists: ToDoList[] = [
    { id: 1, action_card_id: 1, title: 'Préparation logistique' },
    { id: 2, action_card_id: 4, title: 'Rédaction rapport' },
]

export const mockToDoItems: ToDoItem[] = [
    { id: 1, list_id: 1, content: 'Réserver la salle',          status_id: 9, start_date: '2025-08-01', end_time: '2025-08-15' },
    { id: 2, list_id: 1, content: 'Envoyer les invitations',    status_id: 8, start_date: '2025-08-15', end_time: '2025-08-30' },
    { id: 3, list_id: 2, content: 'Collecter les indicateurs',  status_id: 8, start_date: '2025-06-01', end_time: '2025-06-15' },
    { id: 4, list_id: 2, content: 'Rédiger la synthèse',        status_id: 8, start_date: '2025-06-15', end_time: '2025-06-25' },
]

export const mockMemberActionCards: MemberActionCard[] = [
    { id: 1, member_id: 1, action_card_id: 1,  role: 'Responsable'  },
    { id: 2, member_id: 2, action_card_id: 1,  role: 'Contributeur' },
    { id: 3, member_id: 3, action_card_id: 1,  role: 'Observateur'  },
    { id: 4, member_id: 2, action_card_id: 5,  role: 'Responsable'  },
    { id: 5, member_id: 1, action_card_id: 5,  role: 'Contributeur' },
    { id: 6, member_id: 4, action_card_id: 8,  role: 'Responsable'  },
    { id: 7, member_id: 2, action_card_id: 9,  role: 'Responsable'  },
    { id: 8, member_id: 4, action_card_id: 9,  role: 'Contributeur' },
    { id: 9, member_id: 3, action_card_id: 10, role: 'Responsable'  },
]

export const mockAxisActionCards: AxisActionCard[] = [
    { id: 1, axis_id: 1, action_card_id: 1  },
    { id: 2, axis_id: 1, action_card_id: 2  },
    { id: 3, axis_id: 1, action_card_id: 3  },
    { id: 4, axis_id: 2, action_card_id: 4  },
    { id: 5, axis_id: 2, action_card_id: 5  },
    { id: 6, axis_id: 2, action_card_id: 9  },
    { id: 7, axis_id: 3, action_card_id: 8  },
    { id: 8, axis_id: 1, action_card_id: 7  },
    { id: 9, axis_id: 2, action_card_id: 10 },
    { id: 10, axis_id: 2, action_card_id: 11 },
]

export const mockProjectActionCards: ProjectActionCard[] = [
    { id: 1, project_id: 1, action_card_id: 1  },
    { id: 2, project_id: 1, action_card_id: 2  },
    { id: 3, project_id: 2, action_card_id: 5  },
    { id: 4, project_id: 2, action_card_id: 9  },
]
