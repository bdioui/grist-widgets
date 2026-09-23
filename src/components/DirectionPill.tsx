import type { AgreementDirection } from '@/lib/types'
import { cn } from '@/lib/utils'

// Le sens d'une convention ne se devine pas à son titre : sans cette pastille,
// une convention reçue et une convention versée se ressemblent à l'écran.
// Partagée entre les vues parce que les conventions se lisent dans trois
// onglets et que deux couleurs différentes pour la même chose se paieraient cher.
export function DirectionPill({ direction, className }: { direction: AgreementDirection; className?: string }) {
    const recette = direction === 'recette'
    return (
        <span
            className={cn('text-xs px-1.5 py-0.5 rounded-full shrink-0 text-black', className)}
            style={{ backgroundColor: recette ? '#d1fae5' : '#ffedd5' }}
        >
            {recette ? 'Recette' : 'Dépense'}
        </span>
    )
}
