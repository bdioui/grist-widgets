import type {
    Status, Category, Member, Partner, Axis, Lab, PartnerLab,
    ActionCard, ProjectCall, Project, FinancialAgreement,
    Phd, MobilityGrant, ToDoList, ToDoItem,
    Kpi, KpiEntry, BudgetCategory, BudgetDetail,
    MemberActionCard, AxisActionCard, ProjectActionCard, AgreementActionCard,
    Group,
    GroupMember,
    User,
    Comment,
    ProjectMember,
    AgreementMember,
    ProjectPartner,
    ProjectMilestone,
    TimeEntry,
} from '@/lib/types'

export const mockUser: User = {
    first_name: 'Isabelle',
    last_name: 'Petit',
    email: 'isabelle.petit@entreprise.fr'
}

export const mockStatuses: Status[] = [
    { id: 1, label: 'En cours', context: 'action_card' },
    { id: 2, label: 'Planifié', context: 'action_card' },
    { id: 3, label: 'Terminé', context: 'action_card' },
    { id: 4, label: 'Annulé', context: 'action_card' },
    { id: 5, label: 'À traiter', context: 'action_card' },
    { id: 6, label: 'En cours', context: 'project_call' },
    { id: 7, label: 'Terminé', context: 'project_call' },
    { id: 8, label: 'En cours', context: 'todo_item' },
    { id: 9, label: 'Terminé', context: 'todo_item' },
    // --- Projet ---
    { id: 10, label: 'En cours', context: 'project' },
    { id: 11, label: 'Terminé', context: 'project' },
    { id: 12, label: 'Suspendu', context: 'project' },
    { id: 13, label: 'En attente', context: 'project' },
    // --- Convention financière ---
    { id: 14, label: 'En préparation', context: 'financial_agreement' },
    { id: 15, label: 'Active', context: 'financial_agreement' },
    { id: 16, label: 'Soldée', context: 'financial_agreement' },
    { id: 17, label: 'Annulée', context: 'financial_agreement' },
]

export const mockCategories: Category[] = [
    { id: 1, parent_category_id: null, title: 'Formation', color: '#D8CFEE' },
    { id: 2, parent_category_id: 1, title: 'Sensibilisation', color: null },
    { id: 3, parent_category_id: 1, title: 'Doctorat', color: null },
    { id: 4, parent_category_id: null, title: 'Recherche', color: '#EEC5EF' },
    { id: 5, parent_category_id: 4, title: 'Valorisation', color: null },
    { id: 6, parent_category_id: null, title: 'Partenariat', color: '#C5D2EF' },
    { id: 7, parent_category_id: 6, title: 'Gouvernance', color: null },
    { id: 8, parent_category_id: null, title: 'Mobilité', color: '#E7E8E2' },
    { id: 9, parent_category_id: null, title: 'Financier', color: '#EDD803' },
    { id: 10, parent_category_id: null, title: 'Communication', color: '#D8CFEE' },
    { id: 11, parent_category_id: 4, title: 'Publication', color: null },
    { id: 12, parent_category_id: 6, title: 'Convention', color: null },
]

export const mockPartners: Partner[] = [
    { id: 1, name: 'Université X', description: 'Université partenaire principale', color: '#D8CFEE', logo: '', status_id: 1, type: 'Université et grandes écoles', consortium: true },
    { id: 2, name: 'Entreprise A', description: 'Partenaire industriel stratégique', color: '#E7E8E2', logo: '', status_id: 1, type: 'Entreprise privée', consortium: false },
    { id: 3, name: 'Association B', description: 'Association de recherche appliquée', color: '#EEC5EF', logo: '', status_id: 1, type: 'Association', consortium: true },
    { id: 4, name: 'Institut de Recherche', description: 'Institut national de recherche', color: '#C5D2EF', logo: '', status_id: 1, type: 'Établissement public', consortium: false },
    { id: 5, name: 'Collectivité D', description: 'Collectivité territoriale partenaire', color: '#EDD803', logo: '', status_id: 1, type: 'Collectivité', consortium: false },
    { id: 6, name: 'Fondation E', description: 'Fondation de financement scientifique', color: '#EEC5EF', logo: '', status_id: 1, type: 'Fondation', consortium: false },
]

export const mockLabs: Lab[] = [
    { id: 1, name: 'LRGE', description: 'Laboratoire de Recherche en Génie Environnemental', type: 'Laboratoire académique', topic: 'Environnement, énergie' },
    { id: 2, name: 'UMR 42', description: 'Unité mixte de recherche en sciences cognitives', type: 'Unité mixte de recherche', topic: 'Sciences cognitives, IA' },
    { id: 3, name: 'CERI', description: 'Centre d\'Études et de Recherche en Innovation', type: 'Centre de recherche', topic: 'Innovation, transfert techno' },
]

export const mockPartnerLabs: PartnerLab[] = [
    { id: 1, lab_id: 1, partner_id: 1 },
    { id: 2, lab_id: 1, partner_id: 4 },
    { id: 3, lab_id: 2, partner_id: 1 },
    { id: 4, lab_id: 3, partner_id: 2 },
    { id: 5, lab_id: 3, partner_id: 4 },
]

export const mockMembers: Member[] = [
    // Université X
    { id: 1, partner_id: 1, lab_id: 1, first_name: 'Marie', last_name: 'Dupont', position: 'Coordinatrice de projet', email: 'marie.dupont@univ.fr', tel: '0600000001', genre: 'F', status: 'Enseignant-chercheur', profile_image: '', is_staff: true },
    { id: 2, partner_id: 1, lab_id: 1, first_name: 'Thomas', last_name: 'Martin', position: 'Enseignant-chercheur', email: 'thomas.martin@univ.fr', tel: '0600000002', genre: 'M', status: 'Enseignant-chercheur', profile_image: '', is_staff: true },
    { id: 3, partner_id: 1, lab_id: 0, first_name: 'Claire', last_name: 'Bernard', position: 'Gestionnaire', email: 'claire.bernard@univ.fr', tel: '0600000003', genre: 'F', status: 'BIATSS', profile_image: '', is_staff: true },
    { id: 4, partner_id: 1, lab_id: 2, first_name: 'Antoine', last_name: 'Leroy', position: 'Doctorant', email: 'antoine.leroy@univ.fr', tel: '0600000004', genre: 'M', status: 'Doctorant', profile_image: '', is_staff: false },
    { id: 5, partner_id: 1, lab_id: 2, first_name: 'Sophie', last_name: 'Girard', position: 'Maîtresse de conférences', email: 'sophie.girard@univ.fr', tel: '0600000005', genre: 'F', status: 'Enseignant-chercheur', profile_image: '', is_staff: true },
    // Entreprise A
    { id: 6, partner_id: 2, lab_id: 3, first_name: 'Julien', last_name: 'Moreau', position: 'Responsable R&D', email: 'julien.moreau@entreprise.fr', tel: '0600000006', genre: 'M', status: 'Salarié', profile_image: '', is_staff: false },
    { id: 7, partner_id: 2, lab_id: 0, first_name: 'Isabelle', last_name: 'Petit', position: 'Chargée de partenariats', email: 'isabelle.petit@entreprise.fr', tel: '0600000007', genre: 'F', status: 'Salarié', profile_image: '', is_staff: false },
    { id: 8, partner_id: 2, lab_id: 0, first_name: 'Nicolas', last_name: 'Roux', position: 'Ingénieur senior', email: 'nicolas.roux@entreprise.fr', tel: '0600000008', genre: 'M', status: 'Salarié', profile_image: '', is_staff: false },
    // Association B
    { id: 9, partner_id: 3, lab_id: 0, first_name: 'Lucie', last_name: 'Fontaine', position: 'Directrice', email: 'lucie.fontaine@assoc.fr', tel: '0600000009', genre: 'F', status: 'Salarié', profile_image: '', is_staff: false },
    { id: 10, partner_id: 3, lab_id: 0, first_name: 'Paul', last_name: 'Chevalier', position: 'Chargé de mission', email: 'paul.chevalier@assoc.fr', tel: '0600000010', genre: 'M', status: 'Salarié', profile_image: '', is_staff: false },
    { id: 11, partner_id: 3, lab_id: 0, first_name: 'Emma', last_name: 'Simon', position: 'Coordinatrice scientifique', email: 'emma.simon@assoc.fr', tel: '0600000011', genre: 'F', status: 'Salarié', profile_image: '', is_staff: false },
    // Institut de Recherche
    { id: 12, partner_id: 4, lab_id: 1, first_name: 'François', last_name: 'Lambert', position: 'Directeur de recherche', email: 'f.lambert@inr.fr', tel: '0600000012', genre: 'M', status: 'Chercheur', profile_image: '', is_staff: true },
    { id: 13, partner_id: 4, lab_id: 1, first_name: 'Nathalie', last_name: 'Mercier', position: 'Ingénieure de recherche', email: 'n.mercier@inr.fr', tel: '0600000013', genre: 'F', status: 'Chercheur', profile_image: '', is_staff: true },
    { id: 14, partner_id: 4, lab_id: 3, first_name: 'Adrien', last_name: 'Blanc', position: 'Post-doctorant', email: 'a.blanc@inr.fr', tel: '0600000014', genre: 'M', status: 'Post-doc', profile_image: '', is_staff: false },
    // Collectivité D
    { id: 15, partner_id: 5, lab_id: 0, first_name: 'Christine', last_name: 'Rousseau', position: 'Élue référente', email: 'c.rousseau@collectivite.fr', tel: '0600000015', genre: 'F', status: 'Élu', profile_image: '', is_staff: false },
    { id: 16, partner_id: 5, lab_id: 0, first_name: 'Marc', last_name: 'Garnier', position: 'Chargé de coopération', email: 'm.garnier@collectivite.fr', tel: '0600000016', genre: 'M', status: 'Fonctionnaire', profile_image: '', is_staff: false },
    // Fondation E
    { id: 17, partner_id: 6, lab_id: 0, first_name: 'Alice', last_name: 'Fournier', position: 'Responsable programmes', email: 'a.fournier@fondation.fr', tel: '0600000017', genre: 'F', status: 'Salarié', profile_image: '', is_staff: false },
    { id: 18, partner_id: 6, lab_id: 0, first_name: 'Bruno', last_name: 'Morin', position: 'Analyste financier', email: 'b.morin@fondation.fr', tel: '0600000018', genre: 'M', status: 'Salarié', profile_image: '', is_staff: false },

]

export const mockGroup: Group[] = [
    { id: 1, name: 'Groupe de travail 1', owner_id: 1 },
    { id: 2, name: 'Groupe de travail 2', owner_id: 1 },
    { id: 3, name: 'Groupe de travail 3', owner_id: 2 },
    { id: 4, name: 'Groupe de travail 4', owner_id: 4 },
]

export const mockGroupMember: GroupMember[] = [
    // Groupe 1 — membres université + institut
    { id: 1, member_id: 1, group_id: 1 },
    { id: 2, member_id: 2, group_id: 1 },
    { id: 3, member_id: 5, group_id: 1 },
    { id: 4, member_id: 12, group_id: 1 },
    { id: 5, member_id: 13, group_id: 1 },

    // Groupe 2 — membres entreprise + fondation
    { id: 6, member_id: 6, group_id: 2 },
    { id: 7, member_id: 7, group_id: 2 },
    { id: 8, member_id: 17, group_id: 2 },
    { id: 9, member_id: 18, group_id: 2 },

    // Groupe 3 — membres association + collectivité
    { id: 10, member_id: 9, group_id: 3 },
    { id: 11, member_id: 10, group_id: 3 },
    { id: 12, member_id: 15, group_id: 3 },
    { id: 13, member_id: 16, group_id: 3 },

    // Groupe 4 — transversal (chercheurs/doctorants)
    { id: 14, member_id: 4, group_id: 4 },
    { id: 15, member_id: 5, group_id: 4 },
    { id: 16, member_id: 14, group_id: 4 },
    { id: 17, member_id: 2, group_id: 4 },

    // Quelques membres dans plusieurs groupes
    { id: 18, member_id: 1, group_id: 4 },
    { id: 19, member_id: 12, group_id: 3 },
]

export const mockAxes: Axis[] = [
    { id: 1, name: 'Axe 1 – Formation', description: 'Actions liées à la formation et à la pédagogie' },
    { id: 2, name: 'Axe 2 – Recherche', description: 'Actions liées à la recherche et à la valorisation' },
    { id: 3, name: 'Axe 3 – International', description: 'Actions liées à la mobilité et aux partenariats internationaux' },
    { id: 4, name: 'Axe 4 – Innovation', description: 'Actions liées au transfert de technologie et à l\'innovation' },
]

export const mockActionCards: ActionCard[] = [
    // --- 2025 ---
    { id: 1, owner_id: 1, category_id: 2, status_id: 3, title: 'Séminaire de lancement AAP', color: '', description: 'Organisation du séminaire de lancement de l\'appel à projets. Indicateur cible : 80 participants.', start_date: '2025-09-01', end_date: '2025-09-15' },
    { id: 2, owner_id: 2, category_id: 2, status_id: 3, title: 'Module de sensibilisation étudiants', color: '', description: 'Conception d\'un module pédagogique de 3h destiné aux étudiants de L3 et M1.', start_date: '2025-10-01', end_date: '2025-12-15' },
    { id: 3, owner_id: 2, category_id: 3, status_id: 3, title: 'Atelier doctorants – Rédaction scientifique', color: '', description: 'Atelier de 2 jours animé par un enseignant-chercheur senior.', start_date: '2025-11-10', end_date: '2025-11-20' },
    { id: 4, owner_id: 1, category_id: 11, status_id: 3, title: 'Dépôt rapport intermédiaire AAP-01', color: '', description: 'Rédaction et dépôt du rapport intermédiaire pour l\'appel à projets AAP-01.', start_date: '2025-06-01', end_date: '2025-06-30' },
    { id: 5, owner_id: 2, category_id: 5, status_id: 3, title: 'Publication actes de colloque', color: '', description: 'Coordination de la publication des actes du colloque annuel.', start_date: '2025-05-01', end_date: '2025-07-31' },
    { id: 6, owner_id: 3, category_id: 12, status_id: 3, title: 'Convention partenariat Entreprise A', color: '', description: 'Finalisation de la convention de partenariat. Budget engagé : 45 000 €.', start_date: '2025-05-15', end_date: '2025-06-15' },
    { id: 7, owner_id: 1, category_id: 7, status_id: 3, title: 'Réunion comité de pilotage Q3 2025', color: '', description: 'Réunion trimestrielle du comité de pilotage.', start_date: '2025-07-10', end_date: '2025-07-11' },
    { id: 8, owner_id: 4, category_id: 8, status_id: 3, title: 'Bourse de mobilité – Conférence Berlin', color: '', description: 'Mobilité sortante pour présentation de travaux. Montant estimé : 1 200 €.', start_date: '2025-09-22', end_date: '2025-09-26' },
    { id: 9, owner_id: 2, category_id: 3, status_id: 1, title: 'Suivi thèse – Co-tutelle internationale', color: '', description: 'Encadrement d\'une thèse en co-tutelle internationale.', start_date: '2024-10-01', end_date: '2027-09-30' },
    { id: 10, owner_id: 3, category_id: 9, status_id: 3, title: 'Ventilation dépenses SIFAC – T1 2025', color: '', description: 'Ventilation des enregistrements financiers SIFAC du premier trimestre.', start_date: '2025-04-01', end_date: '2025-04-30' },
    { id: 11, owner_id: 3, category_id: 9, status_id: 3, title: 'Révision annexe financière partenaire B', color: '', description: 'Mise à jour de l\'annexe financière suite à un redéploiement budgétaire.', start_date: '2025-08-01', end_date: '2025-08-31' },
    { id: 12, owner_id: 1, category_id: 10, status_id: 3, title: 'Mise à jour site web du projet', color: '', description: 'Publication des derniers résultats et actualités.', start_date: '2025-10-10', end_date: '2025-10-25' },
    { id: 13, owner_id: 6, category_id: 4, status_id: 3, title: 'Étude de faisabilité – Transfert techno', color: '', description: 'Étude de faisabilité pour le transfert technologique avec Entreprise A.', start_date: '2025-09-01', end_date: '2025-11-30' },
    { id: 14, owner_id: 12, category_id: 11, status_id: 3, title: 'Soumission article – Journal Q1', color: '', description: 'Rédaction et soumission d\'un article dans un journal de rang Q1.', start_date: '2025-10-01', end_date: '2025-12-15' },
    { id: 15, owner_id: 9, category_id: 12, status_id: 3, title: 'Renouvellement convention Association B', color: '', description: 'Négociation et signature du renouvellement de la convention triennale.', start_date: '2025-11-01', end_date: '2025-12-31' },

    // --- Janvier–Avril 2026 ---
    { id: 16, owner_id: 1, category_id: 7, status_id: 3, title: 'Comité de pilotage Q1 2026', color: '', description: 'Réunion de pilotage du premier trimestre 2026.', start_date: '2026-01-15', end_date: '2026-01-16' },
    { id: 17, owner_id: 5, category_id: 2, status_id: 3, title: 'Journée portes ouvertes Masters', color: '', description: 'Organisation de la journée d\'information pour les masters du programme.', start_date: '2026-01-20', end_date: '2026-01-20' },
    { id: 18, owner_id: 14, category_id: 4, status_id: 3, title: 'Colloque international IA & Éducation', color: '', description: 'Organisation et participation au colloque annuel.', start_date: '2026-02-03', end_date: '2026-02-05' },
    { id: 19, owner_id: 3, category_id: 9, status_id: 3, title: 'Clôture budgétaire exercice 2025', color: '', description: 'Finalisation des opérations comptables de l\'exercice 2025.', start_date: '2026-01-05', end_date: '2026-01-31' },
    { id: 20, owner_id: 7, category_id: 12, status_id: 3, title: 'Accord-cadre Institut de Recherche', color: '', description: 'Signature de l\'accord-cadre de coopération avec l\'Institut national.', start_date: '2026-02-10', end_date: '2026-02-28' },
    { id: 21, owner_id: 13, category_id: 5, status_id: 3, title: 'Déposit brevet – Procédé innovant', color: '', description: 'Dépôt d\'un brevet conjoint sur un procédé de traitement des données.', start_date: '2026-03-01', end_date: '2026-03-15' },
    { id: 22, owner_id: 2, category_id: 3, status_id: 3, title: 'Soutenance thèse – Dupuis Rémi', color: '', description: 'Soutenance de thèse de doctorat.', start_date: '2026-03-20', end_date: '2026-03-20' },
    { id: 23, owner_id: 15, category_id: 6, status_id: 3, title: 'Forum collectivités & universités', color: '', description: 'Participation au forum annuel des partenariats collectivités/universités.', start_date: '2026-03-25', end_date: '2026-03-27' },
    { id: 24, owner_id: 17, category_id: 9, status_id: 3, title: 'Appel à projets Fondation E – Session 1', color: '', description: 'Instruction des dossiers de candidature de la session 1.', start_date: '2026-04-01', end_date: '2026-04-30' },
    { id: 25, owner_id: 8, category_id: 4, status_id: 3, title: 'Revue de littérature – IA générative', color: '', description: 'Revue systématique de la littérature pour l\'état de l\'art.', start_date: '2026-04-07', end_date: '2026-04-25' },

    // --- Mai–Juillet 2026 (autour de la date courante) ---
    { id: 26, owner_id: 1, category_id: 2, status_id: 1, title: 'Formation équipe – Outils numériques', color: '', description: 'Formation de l\'équipe projet aux nouveaux outils collaboratifs.', start_date: '2026-05-05', end_date: '2026-05-16' },
    { id: 27, owner_id: 12, category_id: 11, status_id: 1, title: 'Rédaction livre blanc – Innovation', color: '', description: 'Coordination de la rédaction d\'un livre blanc sur l\'innovation en recherche.', start_date: '2026-05-01', end_date: '2026-06-30' },
    { id: 28, owner_id: 6, category_id: 4, status_id: 2, title: 'Prototype démonstrateur – Phase 2', color: '', description: 'Développement de la deuxième phase du prototype technologique.', start_date: '2026-05-15', end_date: '2026-07-31' },
    { id: 29, owner_id: 3, category_id: 9, status_id: 1, title: 'Ventilation dépenses SIFAC – T1 2026', color: '', description: 'Ventilation des enregistrements financiers du premier trimestre 2026.', start_date: '2026-05-01', end_date: '2026-05-31' },
    { id: 30, owner_id: 5, category_id: 10, status_id: 1, title: 'Campagne réseaux sociaux – Résultats', color: '', description: 'Lancement d\'une campagne de communication sur les résultats du programme.', start_date: '2026-05-20', end_date: '2026-06-10' },
    { id: 31, owner_id: 1, category_id: 7, status_id: 2, title: 'Comité de pilotage Q2 2026', color: '', description: 'Réunion de pilotage du deuxième trimestre 2026.', start_date: '2026-06-05', end_date: '2026-06-06' },
    { id: 32, owner_id: 4, category_id: 8, status_id: 2, title: 'École d\'été internationale', color: '', description: 'Participation et co-organisation de l\'école d\'été.', start_date: '2026-06-22', end_date: '2026-07-03' },
    { id: 33, owner_id: 11, category_id: 12, status_id: 2, title: 'Avenant convention Association B', color: '', description: 'Rédaction et validation d\'un avenant à la convention en cours.', start_date: '2026-06-01', end_date: '2026-06-30' },
    { id: 34, owner_id: 13, category_id: 5, status_id: 2, title: 'Présentation valorisation – Salon Tech', color: '', description: 'Présentation des travaux de valorisation au salon professionnel.', start_date: '2026-07-08', end_date: '2026-07-10' },
    { id: 35, owner_id: 18, category_id: 9, status_id: 2, title: 'Audit financier mi-parcours', color: '', description: 'Audit intermédiaire des dépenses engagées sur le programme.', start_date: '2026-07-01', end_date: '2026-07-15' },

    // --- Août–Décembre 2026 ---
    { id: 36, owner_id: 2, category_id: 3, status_id: 2, title: 'Rentrée doctorale 2026', color: '', description: 'Accueil et intégration des nouveaux doctorants.', start_date: '2026-09-01', end_date: '2026-09-05' },
    { id: 37, owner_id: 16, category_id: 6, status_id: 2, title: 'Partenariat Collectivité D – Phase 2', color: '', description: 'Lancement de la deuxième phase du partenariat territorial.', start_date: '2026-09-15', end_date: '2026-10-31' },
    { id: 38, owner_id: 5, category_id: 2, status_id: 2, title: 'MOOC – Développement durable', color: '', description: 'Création d\'un MOOC sur les enjeux du développement durable.', start_date: '2026-09-01', end_date: '2026-11-30' },
    { id: 39, owner_id: 17, category_id: 9, status_id: 2, title: 'Appel à projets Fondation E – Session 2', color: '', description: 'Instruction des dossiers de candidature de la session 2.', start_date: '2026-10-01', end_date: '2026-10-31' },
    { id: 40, owner_id: 1, category_id: 7, status_id: 2, title: 'Comité de pilotage Q3 2026', color: '', description: 'Réunion de pilotage du troisième trimestre.', start_date: '2026-10-08', end_date: '2026-10-09' },
    { id: 41, owner_id: 10, category_id: 10, status_id: 2, title: 'Rapport annuel programme 2026', color: '', description: 'Rédaction et publication du rapport annuel d\'activités.', start_date: '2026-11-01', end_date: '2026-11-30' },
    { id: 42, owner_id: 12, category_id: 4, status_id: 2, title: 'Conférence de clôture programme', color: '', description: 'Organisation de la conférence finale du programme.', start_date: '2026-12-01', end_date: '2026-12-03' },

    // --- Sans date (pour le kanban) ---
    { id: 43, owner_id: 2, category_id: 2, status_id: 5, title: 'Conception module e-learning', color: '', description: 'Concevoir un module e-learning sur les bonnes pratiques de recherche.', start_date: '', end_date: '' },
    { id: 44, owner_id: 6, category_id: 4, status_id: 5, title: 'Définir protocole expérimental', color: '', description: 'Établir le protocole expérimental pour la phase 3 du projet de recherche.', start_date: '', end_date: '' },
    { id: 45, owner_id: 3, category_id: 9, status_id: 5, title: 'Préparer dossier financement 2027', color: '', description: 'Constituer le dossier de demande de financement pour la période suivante.', start_date: '', end_date: '' },
]

export const mockProjectCalls: ProjectCall[] = [
    { id: 1, axis_id: 1, title: 'AAP-01 – Formation innovante', description: 'Appel à projets pour des actions de formation innovante.', start_date: '2024-01-01', end_date: '2025-12-31', status_id: 7, budget: 150000 },
    { id: 2, axis_id: 2, title: 'AAP-02 – Recherche appliquée', description: 'Appel à projets pour des travaux de recherche appliquée.', start_date: '2024-06-01', end_date: '2026-05-31', status_id: 6, budget: 300000 },
    { id: 3, axis_id: 3, title: 'AAP-03 – Mobilité internationale', description: 'Appel à projets pour les mobilités et coopérations.', start_date: '2025-01-01', end_date: '2026-12-31', status_id: 6, budget: 120000 },
    { id: 4, axis_id: 4, title: 'AAP-04 – Innovation et transfert', description: 'Appel à projets pour l\'innovation et le transfert de technologie.', start_date: '2025-06-01', end_date: '2027-05-31', status_id: 6, budget: 250000 },
]

export const mockProjects: Project[] = [
    { id: 1, project_call_id: 1, status_id: 11, title: 'Projet Formation Numérique', description: 'Développement d\'outils pédagogiques numériques pour les formations universitaires de premier cycle.', budget: 120000, start_date: '2024-01-01', end_date: '2025-12-31' },
    { id: 2, project_call_id: 2, status_id: 10, title: 'Projet Recherche IA', description: 'Programme de recherche appliquée sur l\'utilisation de l\'IA dans l\'analyse de données scientifiques.', budget: 200000, start_date: '2024-06-01', end_date: '2026-05-31' },
    { id: 3, project_call_id: 3, status_id: 10, title: 'Projet Mobilités Europe', description: 'Financement de mobilités sortantes et accueil de chercheurs européens dans le cadre du programme Erasmus+.', budget: 85000, start_date: '2025-01-01', end_date: '2026-12-31' },
    { id: 4, project_call_id: 4, status_id: 10, title: 'Projet Transfert Technologique', description: 'Valorisation et transfert de brevets issus des travaux de recherche vers le secteur industriel partenaire.', budget: 160000, start_date: '2025-03-01', end_date: '2027-02-28' },
]

export const mockFinancialAgreements: FinancialAgreement[] = [
    { id: 1, project_id: 1, partner_id: 2, axis_id: 1, status_id: 16, title: 'Convention Entreprise A', description: 'Accord de co-financement formation', budget: 45000, grant: 30000, signed_date: '2024-03-01' },
    { id: 2, project_id: 2, partner_id: 3, axis_id: 2, status_id: 15, title: 'Convention Association B', description: 'Accord de partenariat recherche', budget: 60000, grant: 50000, signed_date: '2024-06-15' },
    { id: 3, project_id: 3, partner_id: 4, axis_id: 3, status_id: 15, title: 'Convention Institut Recherche', description: 'Accord de coopération internationale', budget: 30000, grant: 25000, signed_date: '2025-02-01' },
    { id: 4, project_id: 4, partner_id: 6, axis_id: null, status_id: 14, title: 'Convention Fondation E', description: 'Subvention innovation et transfert', budget: 80000, grant: 70000, signed_date: '2025-07-01' },
    { id: 5, project_id: 2, partner_id: 5, axis_id: 2, status_id: 15, title: 'Convention Collectivité D', description: 'Cofinancement recherche territoriale', budget: 20000, grant: 15000, signed_date: '2025-03-15' },
]

export const mockPhds: Phd[] = [
    { id: 1, member_id: 4, start_date: '2024-10-01', end_date: '2027-09-30', axis_id: 2 },
    { id: 2, member_id: 14, start_date: '2023-10-01', end_date: '2026-09-30', axis_id: 4 },
]

export const mockMobilityGrants: MobilityGrant[] = [
    { id: 1, member_id: 4, start_date: '2025-09-22', end_date: '2025-09-26', axis_id: 3 },
    { id: 2, member_id: 14, start_date: '2026-06-22', end_date: '2026-07-03', axis_id: 3 },
    { id: 3, member_id: 5, start_date: '2026-03-25', end_date: '2026-03-27', axis_id: 3 },
]

export const mockKpis: Kpi[] = [
    { id: 1, label: 'Nombre d\'étudiants sensibilisés', unit: 'étudiants', definition: 'Nombre total d\'étudiants ayant participé à une action de sensibilisation.', dimension: 'Formation' },
    { id: 2, label: 'Nombre de publications', unit: 'publications', definition: 'Nombre d\'articles ou actes publiés dans le cadre du projet.', dimension: 'Recherche' },
    { id: 3, label: 'Nombre de mobilités', unit: 'mobilités', definition: 'Nombre de mobilités sortantes financées.', dimension: 'International' },
    { id: 4, label: 'Nombre de brevets déposés', unit: 'brevets', definition: 'Nombre de dépôts de brevets issus des travaux du programme.', dimension: 'Innovation' },
    { id: 5, label: 'Taux d\'insertion professionnelle', unit: '%', definition: 'Taux d\'insertion des doctorants à 6 mois après soutenance.', dimension: 'Formation' },
]

export const mockKpiEntries: KpiEntry[] = [
    // Projet 1 — Formation Numérique
    { id: 1, project_id: 1, kpi_id: 1, member_id: 1, value: 120, comment: 'Séminaire de lancement', date: '2024-06-30', year: '2024', author_id: 1 },
    { id: 2, project_id: 1, kpi_id: 1, member_id: 1, value: 210, comment: 'Module sensibilisation L3', date: '2025-01-15', year: '2025', author_id: 1 },
    { id: 3, project_id: 1, kpi_id: 5, member_id: 3, value: 78, comment: 'Cohorte 2023', date: '2024-09-01', year: '2024', author_id: 3 },
    { id: 4, project_id: 1, kpi_id: 5, member_id: 3, value: 82, comment: 'Cohorte 2024', date: '2025-09-01', year: '2025', author_id: 3 },

    // Projet 2 — Recherche IA
    { id: 5, project_id: 2, kpi_id: 2, member_id: 2, value: 3, comment: 'Articles soumis T1 2025', date: '2025-03-31', year: '2025', author_id: 2 },
    { id: 6, project_id: 2, kpi_id: 2, member_id: 2, value: 5, comment: 'Publications acceptées T2', date: '2025-06-30', year: '2025', author_id: 2 },
    { id: 7, project_id: 2, kpi_id: 2, member_id: 12, value: 2, comment: 'Actes de colloque', date: '2026-02-05', year: '2026', author_id: 12 },

    // Projet 3 — Mobilités Europe
    { id: 8, project_id: 3, kpi_id: 3, member_id: 1, value: 4, comment: 'Mobilités sortantes S1 2025', date: '2025-06-30', year: '2025', author_id: 1 },
    { id: 9, project_id: 3, kpi_id: 3, member_id: 1, value: 7, comment: 'Mobilités sortantes S2 2025', date: '2025-12-31', year: '2025', author_id: 1 },
    { id: 10, project_id: 3, kpi_id: 3, member_id: 5, value: 3, comment: 'Mobilités sortantes S1 2026', date: '2026-06-30', year: '2026', author_id: 5 },

    // Projet 4 — Transfert Technologique
    { id: 11, project_id: 4, kpi_id: 4, member_id: 2, value: 1, comment: 'Brevet procédé de traitement', date: '2026-03-15', year: '2026', author_id: 2 },
    { id: 12, project_id: 4, kpi_id: 4, member_id: 13, value: 1, comment: 'Brevet matériau composite', date: '2026-05-20', year: '2026', author_id: 13 },
]

export const mockBudgetCategories: BudgetCategory[] = [
    { id: 1, partner_id: null, title: 'Personnel' },
    { id: 2, partner_id: null, title: 'Équipement' },
    { id: 3, partner_id: null, title: 'Missions' },
    { id: 4, partner_id: null, title: 'Autres dépenses' },
    { id: 5, partner_id: 2, title: 'R&D Entreprise A' },
    { id: 6, partner_id: 4, title: 'Frais Institut' },
]

export const mockBudgetDetails: BudgetDetail[] = [
    { id: 1, budget_category_id: 1, title: 'Post-doctorants', description: 'Salaires post-docs', budget: 60000 },
    { id: 2, budget_category_id: 1, title: 'Ingénieurs', description: 'Salaires ingénieurs', budget: 40000 },
    { id: 3, budget_category_id: 3, title: 'Déplacements', description: 'Frais de mission nationaux', budget: 15000 },
    { id: 4, budget_category_id: 3, title: 'Mobilités inter', description: 'Frais de mobilité internationale', budget: 25000 },
    { id: 5, budget_category_id: 2, title: 'Matériel labo', description: 'Équipements de laboratoire', budget: 18000 },
    { id: 6, budget_category_id: 5, title: 'Développement', description: 'Coûts R&D partenaire', budget: 30000 },
]

export const mockToDoLists: ToDoList[] = [
    { id: 1, action_card_id: 1, title: 'Préparation logistique' },
    { id: 2, action_card_id: 4, title: 'Rédaction rapport' },
    { id: 3, action_card_id: 26, title: 'Organisation formation' },
    { id: 4, action_card_id: 31, title: 'Préparation comité' },
]

export const mockToDoItems: ToDoItem[] = [
    { id: 1, list_id: 1, content: 'Réserver la salle', status_id: 9, start_date: '2025-08-01', end_time: '2025-08-15', due_date: '2025-08-10' },
    { id: 2, list_id: 1, content: 'Envoyer les invitations', status_id: 9, start_date: '2025-08-15', end_time: '2025-08-30', due_date: '2025-08-25' },
    { id: 3, list_id: 2, content: 'Collecter les indicateurs', status_id: 9, start_date: '2025-06-01', end_time: '2025-06-15', due_date: '' },
    { id: 4, list_id: 2, content: 'Rédiger la synthèse', status_id: 9, start_date: '2025-06-15', end_time: '2025-06-25', due_date: '' },
    { id: 5, list_id: 3, content: 'Préparer les supports', status_id: 8, start_date: '2026-04-25', end_time: '2026-05-01', due_date: '2026-04-30' },
    { id: 6, list_id: 3, content: 'Inviter les participants', status_id: 8, start_date: '2026-04-28', end_time: '2026-05-05', due_date: '' },
    { id: 7, list_id: 4, content: 'Envoyer l\'ordre du jour', status_id: 8, start_date: '2026-05-28', end_time: '2026-06-01', due_date: '2026-05-30' },
    { id: 8, list_id: 4, content: 'Préparer les indicateurs', status_id: 8, start_date: '2026-05-28', end_time: '2026-06-04', due_date: '' },
]

export const mockMemberActionCards: MemberActionCard[] = [
    // Carte 1
    { id: 1, member_id: 1, action_card_id: 1, role: 'Responsable' },
    { id: 2, member_id: 2, action_card_id: 1, role: 'Contributeur' },
    { id: 3, member_id: 3, action_card_id: 1, role: 'Observateur' },
    // Carte 5
    { id: 4, member_id: 2, action_card_id: 5, role: 'Responsable' },
    { id: 5, member_id: 12, action_card_id: 5, role: 'Contributeur' },
    // Carte 8
    { id: 6, member_id: 4, action_card_id: 8, role: 'Responsable' },
    // Carte 9
    { id: 7, member_id: 2, action_card_id: 9, role: 'Responsable' },
    { id: 8, member_id: 4, action_card_id: 9, role: 'Contributeur' },
    // Carte 10
    { id: 9, member_id: 3, action_card_id: 10, role: 'Responsable' },
    // Carte 13
    { id: 10, member_id: 6, action_card_id: 13, role: 'Responsable' },
    { id: 11, member_id: 8, action_card_id: 13, role: 'Contributeur' },
    { id: 12, member_id: 2, action_card_id: 13, role: 'Observateur' },
    // Carte 14
    { id: 13, member_id: 12, action_card_id: 14, role: 'Responsable' },
    { id: 14, member_id: 13, action_card_id: 14, role: 'Contributeur' },
    // Carte 18
    { id: 15, member_id: 14, action_card_id: 18, role: 'Responsable' },
    { id: 16, member_id: 12, action_card_id: 18, role: 'Contributeur' },
    { id: 17, member_id: 5, action_card_id: 18, role: 'Observateur' },
    // Carte 20
    { id: 18, member_id: 7, action_card_id: 20, role: 'Responsable' },
    { id: 19, member_id: 12, action_card_id: 20, role: 'Contributeur' },
    // Carte 23
    { id: 20, member_id: 15, action_card_id: 23, role: 'Responsable' },
    { id: 21, member_id: 16, action_card_id: 23, role: 'Contributeur' },
    { id: 22, member_id: 1, action_card_id: 23, role: 'Observateur' },
    // Carte 26
    { id: 23, member_id: 1, action_card_id: 26, role: 'Responsable' },
    { id: 24, member_id: 5, action_card_id: 26, role: 'Contributeur' },
    { id: 25, member_id: 10, action_card_id: 26, role: 'Observateur' },
    // Carte 27
    { id: 26, member_id: 12, action_card_id: 27, role: 'Responsable' },
    { id: 27, member_id: 13, action_card_id: 27, role: 'Contributeur' },
    // Carte 28
    { id: 28, member_id: 6, action_card_id: 28, role: 'Responsable' },
    { id: 29, member_id: 8, action_card_id: 28, role: 'Contributeur' },
    // Carte 32
    { id: 30, member_id: 4, action_card_id: 32, role: 'Responsable' },
    { id: 31, member_id: 14, action_card_id: 32, role: 'Contributeur' },
    { id: 32, member_id: 9, action_card_id: 32, role: 'Observateur' },
]

export const mockAxisActionCards: AxisActionCard[] = [
    { id: 1, axis_id: 1, action_card_id: 1 },
    { id: 2, axis_id: 1, action_card_id: 2 },
    { id: 3, axis_id: 1, action_card_id: 3 },
    { id: 4, axis_id: 2, action_card_id: 4 },
    { id: 5, axis_id: 2, action_card_id: 5 },
    { id: 6, axis_id: 2, action_card_id: 9 },
    { id: 7, axis_id: 3, action_card_id: 8 },
    { id: 8, axis_id: 1, action_card_id: 7 },
    { id: 9, axis_id: 2, action_card_id: 10 },
    { id: 10, axis_id: 2, action_card_id: 11 },
    { id: 11, axis_id: 4, action_card_id: 13 },
    { id: 12, axis_id: 2, action_card_id: 14 },
    { id: 13, axis_id: 3, action_card_id: 15 },
    { id: 14, axis_id: 1, action_card_id: 17 },
    { id: 15, axis_id: 2, action_card_id: 18 },
    { id: 16, axis_id: 4, action_card_id: 18 },
    { id: 17, axis_id: 3, action_card_id: 20 },
    { id: 18, axis_id: 2, action_card_id: 21 },
    { id: 19, axis_id: 4, action_card_id: 21 },
    { id: 20, axis_id: 3, action_card_id: 23 },
    { id: 21, axis_id: 1, action_card_id: 26 },
    { id: 22, axis_id: 2, action_card_id: 27 },
    { id: 23, axis_id: 4, action_card_id: 28 },
    { id: 24, axis_id: 1, action_card_id: 30 },
    { id: 25, axis_id: 2, action_card_id: 34 },
    { id: 26, axis_id: 3, action_card_id: 32 },
    { id: 27, axis_id: 1, action_card_id: 36 },
    { id: 28, axis_id: 3, action_card_id: 37 },
    { id: 29, axis_id: 1, action_card_id: 38 },
    { id: 30, axis_id: 2, action_card_id: 42 },
]

export const mockProjectActionCards: ProjectActionCard[] = [
    { id: 1, project_id: 1, action_card_id: 1 },
    { id: 2, project_id: 1, action_card_id: 2 },
    { id: 3, project_id: 2, action_card_id: 5 },
    { id: 4, project_id: 2, action_card_id: 9 },
    { id: 5, project_id: 4, action_card_id: 13 },
    { id: 6, project_id: 2, action_card_id: 14 },
    { id: 7, project_id: 3, action_card_id: 8 },
    { id: 8, project_id: 4, action_card_id: 28 },
    { id: 9, project_id: 2, action_card_id: 27 },
    { id: 10, project_id: 3, action_card_id: 32 },
]

export const mockAgreementActionCards: AgreementActionCard[] = [
    { id: 1, financial_agreement_id: 1, action_card_id: 1 },
    { id: 2, financial_agreement_id: 1, action_card_id: 2 },
    { id: 3, financial_agreement_id: 2, action_card_id: 5 },
    { id: 4, financial_agreement_id: 2, action_card_id: 14 },
    { id: 5, financial_agreement_id: 3, action_card_id: 8 },
    { id: 6, financial_agreement_id: 4, action_card_id: 13 },
    { id: 7, financial_agreement_id: 4, action_card_id: 28 },
    { id: 8, financial_agreement_id: 5, action_card_id: 9 },
]

export const mockComments: Comment[] = [
    // Carte 1 — commentaires racine + réponses
    { id: 1, owner_id: 1, action_card_id: 1, content: 'Le séminaire est confirmé pour le 3 septembre, salle A12.', timestamp: '2025-08-20T09:15:00' },
    { id: 2, owner_id: 2, action_card_id: 1, parent_comment_id: 1, content: 'Parfait, je préviens les intervenants.', timestamp: '2025-08-20T10:02:00' },
    { id: 3, owner_id: 3, action_card_id: 1, parent_comment_id: 1, content: 'J\'envoie les invitations cette semaine.', timestamp: '2025-08-20T11:30:00' },
    { id: 4, owner_id: 1, action_card_id: 1, content: 'Penser à réserver le matériel de projection.', timestamp: '2025-08-21T08:45:00' },
    { id: 5, owner_id: 4, action_card_id: 1, parent_comment_id: 4, content: 'C\'est déjà réservé, j\'ai confirmé avec la logistique.', timestamp: '2025-08-21T09:10:00' },

    // Carte 2
    { id: 6, owner_id: 2, action_card_id: 2, content: 'Le module est prêt à 80%, il manque la partie évaluation.', timestamp: '2025-10-05T14:00:00' },
    { id: 7, owner_id: 5, action_card_id: 2, parent_comment_id: 6, content: 'Je m\'en charge cette semaine.', timestamp: '2025-10-06T09:30:00' },
    { id: 8, owner_id: 2, action_card_id: 2, content: 'Pensez à valider avec la direction pédagogique avant diffusion.', timestamp: '2025-10-07T16:00:00' },

    // Carte 9 — thèse en cours
    { id: 9, owner_id: 2, action_card_id: 9, content: 'Réunion de suivi prévue mi-novembre, à confirmer avec le co-directeur.', timestamp: '2025-10-15T10:00:00' },
    { id: 10, owner_id: 4, action_card_id: 9, parent_comment_id: 9, content: 'Le professeur Müller est disponible le 18 novembre.', timestamp: '2025-10-15T11:45:00' },
    { id: 11, owner_id: 2, action_card_id: 9, parent_comment_id: 10, content: 'Noté, je bloque la date.', timestamp: '2025-10-15T12:00:00' },

    // Carte 14
    { id: 12, owner_id: 12, action_card_id: 14, content: 'Première version de l\'article envoyée aux co-auteurs pour relecture.', timestamp: '2025-10-20T08:00:00' },
    { id: 13, owner_id: 13, action_card_id: 14, parent_comment_id: 12, content: 'Commentaires envoyés par mail, quelques ajustements sur la méthodologie.', timestamp: '2025-10-22T17:30:00' },
]

export const mockProjectMembers: ProjectMember[] = [
    // Projet 1 — Formation Numérique
    { id: 1, project_id: 1, member_id: 1, role: 'Lead' },      // Marie Dupont (coordinatrice)
    { id: 2, project_id: 1, member_id: 3, role: 'Equipe' },    // Claire Bernard (gestionnaire)
    { id: 3, project_id: 1, member_id: 7, role: 'Partenaire' },// Isabelle Petit
    // Projet 2 — Recherche IA
    { id: 4, project_id: 2, member_id: 2, role: 'Lead' },      // Thomas Martin
    { id: 5, project_id: 2, member_id: 5, role: 'Equipe' },    // Sophie Girard
    { id: 6, project_id: 2, member_id: 6, role: 'Partenaire' },// Julien Moreau (R&D)
    { id: 7, project_id: 2, member_id: 4, role: 'Observateur' },// Antoine Leroy (doctorant)
    // Projet 3 — Mobilités Europe
    { id: 8, project_id: 3, member_id: 1, role: 'Lead' },      // Marie Dupont
    { id: 9, project_id: 3, member_id: 5, role: 'Equipe' },    // Sophie Girard
    // Projet 4 — Transfert Technologique
    { id: 10, project_id: 4, member_id: 2, role: 'Lead' },      // Thomas Martin
    { id: 11, project_id: 4, member_id: 6, role: 'Partenaire' },// Julien Moreau
    { id: 12, project_id: 4, member_id: 7, role: 'Equipe' },    // Isabelle Petit
]

export const mockAgreementMembers: AgreementMember[] = [
    // Convention 1 — Entreprise A (projet 1)
    { id: 1, agreement_id: 1, member_id: 1 }, // Marie Dupont
    { id: 2, agreement_id: 1, member_id: 7 }, // Isabelle Petit
    // Convention 2 — Association B (projet 2)
    { id: 3, agreement_id: 2, member_id: 2 }, // Thomas Martin
    { id: 4, agreement_id: 2, member_id: 5 }, // Sophie Girard
    // Convention 3 — Institut Recherche (projet 3)
    { id: 5, agreement_id: 3, member_id: 1 }, // Marie Dupont
    // Convention 4 — Fondation E (projet 4)
    { id: 6, agreement_id: 4, member_id: 6 }, // Julien Moreau
    { id: 7, agreement_id: 4, member_id: 2 }, // Thomas Martin
    // Convention 5 — Collectivité D (projet 2)
    { id: 8, agreement_id: 5, member_id: 5 }, // Sophie Girard
]

export const mockProjectPartners: ProjectPartner[] = [
    // Projet 1 – Formation Numérique (budget 120k, grant 80k → 40k à couvrir)
    { id: 1, project_id: 1, partner_id: 1, role: 'Associé', amount: null, label: null },
    { id: 2, project_id: 1, partner_id: 5, role: 'Cofinanceur', amount: 20000, label: 'Apport en numéraire' },

    // Projet 2 – Recherche IA (budget 200k, grant 150k → 50k à couvrir)
    { id: 3, project_id: 2, partner_id: 1, role: 'Bénéficiaire', amount: null, label: null },
    { id: 4, project_id: 2, partner_id: 2, role: 'Cofinanceur', amount: 30000, label: 'Apport en numéraire' },
    { id: 5, project_id: 2, partner_id: 4, role: 'Associé', amount: null, label: null },

    // Projet 3 – Mobilités Europe (budget 85k, grant 60k → 25k à couvrir)
    { id: 6, project_id: 3, partner_id: 1, role: 'Bénéficiaire', amount: null, label: null },
    { id: 7, project_id: 3, partner_id: 5, role: 'Cofinanceur', amount: 15000, label: 'Apport en nature' },

    // Projet 4 – Transfert Technologique (budget 160k, grant 120k → 40k à couvrir)
    { id: 8, project_id: 4, partner_id: 2, role: 'Bénéficiaire', amount: null, label: null },
    { id: 9, project_id: 4, partner_id: 1, role: 'Associé', amount: null, label: null },
    { id: 10, project_id: 4, partner_id: 5, role: 'Cofinanceur', amount: 25000, label: 'Apport en numéraire' },
]

export const mockProjectMilestones: ProjectMilestone[] = [
    // Projet 1 – Formation Numérique
    { id: 1, project_id: 1, title: 'Lancement du projet', description: 'Réunion de démarrage et validation du plan de travail', due_date: '2024-02-01', status_id: 3 },
    { id: 2, project_id: 1, title: 'Livraison module pilote', description: 'Premier module pédagogique livré et testé', due_date: '2024-09-01', status_id: 3 },
    { id: 3, project_id: 1, title: 'Évaluation finale', description: 'Bilan et rapport de clôture', due_date: '2025-11-01', status_id: 3 },

    // Projet 2 – Recherche IA
    { id: 4, project_id: 2, title: 'Revue de littérature', description: 'État de l\'art sur l\'IA appliquée à l\'analyse de données', due_date: '2024-09-01', status_id: 3 },
    { id: 5, project_id: 2, title: 'Prototype v1', description: 'Premier prototype fonctionnel de l\'outil d\'analyse', due_date: '2025-03-01', status_id: 1 },
    { id: 6, project_id: 2, title: 'Publication des résultats', description: 'Soumission d\'un article dans une revue indexée', due_date: '2025-12-01', status_id: 2 },

    // Projet 3 – Mobilités Europe
    { id: 7, project_id: 3, title: 'Sélection des candidats', description: 'Appel à candidatures et sélection des mobilités', due_date: '2025-03-01', status_id: 3 },
    { id: 8, project_id: 3, title: 'Départ première vague', description: 'Départ des premiers chercheurs sélectionnés', due_date: '2025-06-01', status_id: 1 },
    { id: 9, project_id: 3, title: 'Rapport intermédiaire', description: 'Bilan mi-parcours des mobilités réalisées', due_date: '2026-01-01', status_id: 2 },

    // Projet 4 – Transfert Technologique
    { id: 10, project_id: 4, title: 'Audit des brevets', description: 'Identification et valorisation des brevets existants', due_date: '2025-06-01', status_id: 1 },
    { id: 11, project_id: 4, title: 'Accord de licence signé', description: 'Signature d\'un accord de licence avec partenaire industriel', due_date: '2026-01-01', status_id: 2 },
    { id: 12, project_id: 4, title: 'Clôture et bilan', description: 'Rapport final et évaluation de l\'impact du transfert', due_date: '2027-01-01', status_id: 2 },
]

export const mockTimeEntry: TimeEntry[] = [
    // Projet 1 — Formation Numérique
    { id: 1, project_id: 1, member_id: 1, days: 20, start_date: '2024-01-01', end_date: '2024-06-30' }, // Marie Dupont
    { id: 2, project_id: 1, member_id: 3, days: 10, start_date: '2024-01-01', end_date: '2024-06-30' }, // Claire Bernard
    { id: 3, project_id: 1, member_id: 7, days: 8, start_date: '2024-07-01', end_date: '2024-12-31' }, // Isabelle Petit
    { id: 4, project_id: 1, member_id: 1, days: 15, start_date: '2025-01-01', end_date: '2025-06-30' }, // Marie Dupont (2e période)
    // Projet 2 — Recherche IA
    { id: 5, project_id: 2, member_id: 2, days: 30, start_date: '2024-06-01', end_date: '2024-12-31' }, // Thomas Martin
    { id: 6, project_id: 2, member_id: 5, days: 25, start_date: '2024-06-01', end_date: '2024-12-31' }, // Sophie Girard
    { id: 7, project_id: 2, member_id: 6, days: 12, start_date: '2024-09-01', end_date: '2025-02-28' }, // Julien Moreau
    { id: 8, project_id: 2, member_id: 4, days: 5, start_date: '2025-01-01', end_date: '2025-06-30' }, // Antoine Leroy
    // Projet 3 — Mobilités Europe
    { id: 9, project_id: 3, member_id: 1, days: 10, start_date: '2025-01-01', end_date: '2025-06-30' }, // Marie Dupont
    { id: 10, project_id: 3, member_id: 5, days: 8, start_date: '2025-03-01', end_date: '2025-09-30' }, // Sophie Girard
    // Projet 4 — Transfert Technologique
    { id: 11, project_id: 4, member_id: 2, days: 20, start_date: '2025-03-01', end_date: '2025-09-30' }, // Thomas Martin
    { id: 12, project_id: 4, member_id: 6, days: 18, start_date: '2025-03-01', end_date: '2025-09-30' }, // Julien Moreau
    { id: 13, project_id: 4, member_id: 7, days: 10, start_date: '2025-06-01', end_date: '2025-12-31' }, // Isabelle Petit
]
