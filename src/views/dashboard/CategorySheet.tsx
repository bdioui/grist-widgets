import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCategories, createCategory, updateCategory } from '@/lib/api'
import type { Category } from '@/lib/types'

type Props = {
    open: boolean
    category?: Category        // fourni → mode édition, absent → mode création
    onClose: () => void
    onSaved: (category: Category) => void
}

export default function CategorySheet({ open, category, onClose, onSaved }: Props) {
    const [title,     setTitle]     = useState('')
    const [parentId,  setParentId]  = useState<number | null>(null)
    const [parents,   setParents]   = useState<Category[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error,     setError]     = useState<string | null>(null)

    const isEdit = !!category

    useEffect(() => {
        if (!open) return
        setTitle(category?.title ?? '')
        setParentId(category?.parent_category_id ?? null)
        setError(null)
        getCategories().then(all => {
            // Seules les catégories sans parent peuvent être parent
            setParents(all.filter(c => !c.parent_category_id && c.id !== category?.id))
        })
    }, [open, category])

    async function handleSubmit() {
        if (!title.trim()) {
            setError('Le titre est obligatoire.')
            return
        }
        setError(null)
        setSubmitting(true)
        try {
            if (isEdit) {
                await updateCategory(category!.id, { title: title.trim(), parent_category_id: parentId })
                onSaved({ ...category!, title: title.trim(), parent_category_id: parentId })
            } else {
                const created = await createCategory(title.trim(), parentId)
                onSaved(created)
            }
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
            <SheetContent side="right" showCloseButton={false} className="!w-[400px] flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>{isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</SheetTitle>
                </SheetHeader>

                <div className="flex-1 px-6 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Titre *</Label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            placeholder="Nom de la catégorie"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Catégorie parente <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
                        <Select
                            value={parentId ? String(parentId) : 'none'}
                            onValueChange={v => setParentId(v === 'none' ? null : Number(v))}
                        >
                            <SelectTrigger><SelectValue placeholder="Aucune (catégorie racine)" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Aucune (catégorie racine)</SelectItem>
                                {parents.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Si une catégorie parente est choisie, cette catégorie apparaîtra comme sous-catégorie.
                        </p>
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t flex flex-col gap-2">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose} disabled={submitting}>Annuler</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
