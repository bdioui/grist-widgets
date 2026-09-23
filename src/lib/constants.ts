import type { Partner } from './types'

export const PARTNER_TYPES = [
    'Université et grandes écoles', 'Entreprise privée', 'Association',
    'Établissement public', 'Administration', 'Collectivité', 'Fondation', 'Autre',
]

export const WORKING_ROLES = new Set(['Responsable', 'Contributeur'])

export const PARTNER_ROLES = ['Associé', 'Bénéficiaire', 'Cofinanceur', 'Sous-traitant']

// Seuls ces deux rôles échangent de l'argent avec le programme par voie de
// convention, et le rôle dit de quel côté. Un associé n'apporte rien ; un
// sous-traitant est payé sur facture, donc compté en dépense directe. Un
// montant saisi sur un autre rôle n'entrerait dans aucun total.
export const PARTNER_ROLE_DIRECTION: Record<string, 'recette' | 'depense'> = {
    'Cofinanceur':  'recette',
    'Bénéficiaire': 'depense',
}

// Affiché quand une référence pointe vers un partenaire supprimé.
export const FALLBACK_PARTNER: Partner = {
    id: 0, name: '?', description: '', color: '', logo: '', status_id: 0, type: '', consortium: false,
}

export const PALETTE = [
    { label: 'Lavande', hexa: '#D8CFEE' },
    { label: 'Rose', hexa: '#EEC5EF' },
    { label: 'Fuchsia', hexa: '#F4B8D1' },
    { label: 'Corail', hexa: '#F4C5B8' },
    { label: 'Pêche', hexa: '#F9DEC9' },
    { label: 'Jaune', hexa: '#EDD803' },
    { label: 'Jaune pâle', hexa: '#F7F0A0' },
    { label: 'Vert tendre', hexa: '#C8EABF' },
    { label: 'Vert sauge', hexa: '#B8D9C5' },
    { label: 'Menthe', hexa: '#B8EAE0' },
    { label: 'Bleu ciel', hexa: '#BFD9F4' },
    { label: 'Bleu', hexa: '#C5D2EF' },
    { label: 'Bleu nuit', hexa: '#B8C8E8' },
    { label: 'Gris', hexa: '#E7E8E2' },
    { label: 'Gris chaud', hexa: '#E2DDD8' },
    { label: 'Beige', hexa: '#EDE5D0' },
    { label: 'Sable', hexa: '#E8DFC0' },
    { label: 'Terracotta', hexa: '#E8C4A8' },
]
