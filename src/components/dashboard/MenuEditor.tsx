'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CategoryWithItems, Item, Restaurant } from '@/lib/supabase/types'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X, Check } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  restaurant: Restaurant
  initialCategories: CategoryWithItems[]
}

const EMPTY_ITEM = {
  name_fr: '', name_ar: '', name_en: '',
  description_fr: '', description_ar: '', description_en: '',
  price: '', image_url: '', is_available: true, is_visible: true,
}

const EMPTY_CAT = { name_fr: '', name_ar: '', name_en: '' }

export default function MenuEditor({ restaurant, initialCategories }: Props) {
  const [categories, setCategories] = useState<CategoryWithItems[]>(initialCategories)
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(initialCategories.map(c => c.id)))
  const [editingItem, setEditingItem] = useState<Partial<Item> & { categoryId?: string } | null>(null)
  const [editingCat, setEditingCat] = useState<{ id?: string; name_fr: string; name_ar: string; name_en: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const toggleCat = (id: string) =>
    setOpenCats(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  // ---- Category ops ----
  const saveCategory = async () => {
    if (!editingCat) return
    setSaving(true)
    const payload = {
      restaurant_id: restaurant.id,
      name_fr: editingCat.name_fr,
      name_ar: editingCat.name_ar,
      name_en: editingCat.name_en,
      position: categories.length,
      is_visible: true,
    }
    if (editingCat.id) {
      const { data } = await supabase.from('categories').update(payload).eq('id', editingCat.id).select().single()
      if (data) setCategories(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c))
    } else {
      const { data } = await supabase.from('categories').insert(payload).select().single()
      if (data) setCategories(prev => [...prev, { ...data, items: [] }])
    }
    setEditingCat(null)
    setSaving(false)
    toast.success('Catégorie enregistrée')
  }

  const deleteCategory = async (catId: string) => {
    if (!confirm('Supprimer cette catégorie et tous ses articles ?')) return
    await supabase.from('categories').delete().eq('id', catId)
    setCategories(prev => prev.filter(c => c.id !== catId))
    toast.success('Catégorie supprimée')
  }

  // ---- Item ops ----
  const saveItem = async () => {
    if (!editingItem) return
    setSaving(true)
    const payload = {
      restaurant_id: restaurant.id,
      category_id: editingItem.categoryId ?? editingItem.category_id!,
      name_fr: editingItem.name_fr ?? null,
      name_ar: editingItem.name_ar ?? null,
      name_en: editingItem.name_en ?? null,
      description_fr: editingItem.description_fr ?? null,
      description_ar: editingItem.description_ar ?? null,
      description_en: editingItem.description_en ?? null,
      price: Number(editingItem.price) || 0,
      image_url: editingItem.image_url || null,
      is_available: editingItem.is_available ?? true,
      is_visible: editingItem.is_visible ?? true,
      position: 0,
    }

    if (editingItem.id) {
      const { data } = await supabase.from('items').update(payload).eq('id', editingItem.id).select().single()
      if (data) {
        setCategories(prev => prev.map(c =>
          c.id === payload.category_id
            ? { ...c, items: c.items.map(i => i.id === data.id ? data : i) }
            : c
        ))
      }
    } else {
      const { data } = await supabase.from('items').insert(payload).select().single()
      if (data) {
        setCategories(prev => prev.map(c =>
          c.id === payload.category_id ? { ...c, items: [...c.items, data] } : c
        ))
      }
    }
    setEditingItem(null)
    setSaving(false)
    toast.success('Article enregistré')
  }

  const toggleAvailable = async (item: Item) => {
    await supabase.from('items').update({ is_available: !item.is_available }).eq('id', item.id)
    setCategories(prev => prev.map(c => ({
      ...c,
      items: c.items.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i)
    })))
  }

  const deleteItem = async (item: Item) => {
    if (!confirm('Supprimer cet article ?')) return
    await supabase.from('items').delete().eq('id', item.id)
    setCategories(prev => prev.map(c => ({ ...c, items: c.items.filter(i => i.id !== item.id) })))
    toast.success('Article supprimé')
  }

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du menu</h1>
          <p className="text-gray-400 text-sm mt-0.5">{restaurant.name}</p>
        </div>
        <button
          onClick={() => setEditingCat({ ...EMPTY_CAT })}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600"
        >
          <Plus size={16} /> Catégorie
        </button>
      </div>

      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <button onClick={() => toggleCat(cat.id)} className="flex-1 flex items-center gap-2 text-left">
                {openCats.has(cat.id) ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                <span className="font-semibold text-gray-800">{cat.name_fr || cat.name_ar || cat.name_en}</span>
                <span className="text-xs text-gray-400">({cat.items.length} articles)</span>
              </button>
              <button onClick={() => setEditingCat({ id: cat.id, name_fr: cat.name_fr ?? '', name_ar: cat.name_ar ?? '', name_en: cat.name_en ?? '' })}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Pencil size={14} />
              </button>
              <button onClick={() => deleteCategory(cat.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Items */}
            {openCats.has(cat.id) && (
              <div>
                {cat.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                    {item.image_url && (
                      <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{item.name_fr || item.name_ar || item.name_en}</p>
                      <p className="text-orange-500 text-xs font-semibold">{formatPrice(item.price, restaurant.currency)}</p>
                    </div>
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        item.is_available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {item.is_available ? '✓ Dispo' : 'Indispo'}
                    </button>
                    <button onClick={() => setEditingItem({ ...item, categoryId: cat.id })}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteItem(item)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditingItem({ ...EMPTY_ITEM as any, categoryId: cat.id })}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-orange-500 font-medium hover:bg-orange-50 transition-colors"
                >
                  <Plus size={16} /> Ajouter un article
                </button>
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 mb-4">Aucune catégorie créée</p>
            <button onClick={() => setEditingCat({ ...EMPTY_CAT })}
              className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
              Créer la première catégorie
            </button>
          </div>
        )}
      </div>

      {/* Category modal */}
      {editingCat && (
        <Modal title={editingCat.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'} onClose={() => setEditingCat(null)}>
          <div className="space-y-3">
            <Field label="Nom (Français)" value={editingCat.name_fr} onChange={v => setEditingCat(p => p ? { ...p, name_fr: v } : p)} />
            <Field label="Nom (Arabe)" value={editingCat.name_ar} onChange={v => setEditingCat(p => p ? { ...p, name_ar: v } : p)} dir="rtl" />
            <Field label="Nom (Anglais)" value={editingCat.name_en} onChange={v => setEditingCat(p => p ? { ...p, name_en: v } : p)} />
          </div>
          <ModalActions onSave={saveCategory} onCancel={() => setEditingCat(null)} saving={saving} />
        </Modal>
      )}

      {/* Item modal */}
      {editingItem && (
        <Modal title={editingItem.id ? 'Modifier l\'article' : 'Nouvel article'} onClose={() => setEditingItem(null)}>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Nom (Français) *" value={editingItem.name_fr ?? ''} onChange={v => setEditingItem(p => p ? { ...p, name_fr: v } : p)} />
              <Field label="Nom (Arabe)" value={editingItem.name_ar ?? ''} onChange={v => setEditingItem(p => p ? { ...p, name_ar: v } : p)} dir="rtl" />
              <Field label="Nom (Anglais)" value={editingItem.name_en ?? ''} onChange={v => setEditingItem(p => p ? { ...p, name_en: v } : p)} />
            </div>
            <Field label="Description (Français)" value={editingItem.description_fr ?? ''} onChange={v => setEditingItem(p => p ? { ...p, description_fr: v } : p)} multiline />
            <Field label="Description (Arabe)" value={editingItem.description_ar ?? ''} onChange={v => setEditingItem(p => p ? { ...p, description_ar: v } : p)} multiline dir="rtl" />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prix (MAD) *</label>
              <input
                type="number" step="0.5" min="0"
                value={editingItem.price as any ?? ''}
                onChange={e => setEditingItem(p => p ? { ...p, price: e.target.value as any } : p)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <Field label="URL de l'image (optionnel)" value={editingItem.image_url ?? ''} onChange={v => setEditingItem(p => p ? { ...p, image_url: v } : p)} placeholder="https://..." />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editingItem.is_available ?? true}
                  onChange={e => setEditingItem(p => p ? { ...p, is_available: e.target.checked } : p)}
                  className="w-4 h-4 accent-orange-500" />
                Disponible
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editingItem.is_visible ?? true}
                  onChange={e => setEditingItem(p => p ? { ...p, is_visible: e.target.checked } : p)}
                  className="w-4 h-4 accent-orange-500" />
                Visible
              </label>
            </div>
          </div>
          <ModalActions onSave={saveItem} onCancel={() => setEditingItem(null)} saving={saving} />
        </Modal>
      )}
    </div>
  )
}

function Field({ label, value, onChange, multiline, dir, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  multiline?: boolean; dir?: string; placeholder?: string
}) {
  const cls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} dir={dir} placeholder={placeholder} className={`${cls} resize-none`} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} dir={dir} placeholder={placeholder} className={cls} />
      }
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function ModalActions({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex gap-3 mt-5">
      <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
        Annuler
      </button>
      <button onClick={onSave} disabled={saving}
        className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
        {saving ? 'Enregistrement...' : <><Check size={16} /> Enregistrer</>}
      </button>
    </div>
  )
}
