'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant, Table } from '@/lib/supabase/types'
import { Plus, Download, Trash2, QrCode, X } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface Props {
  restaurant: Restaurant
  initialTables: Table[]
}

export default function TableManager({ restaurant, initialTables }: Props) {
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [previewTable, setPreviewTable] = useState<Table | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClient()

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const scanUrl = (token: string) => `${baseUrl}/scan/${token}`

  useEffect(() => {
    if (previewTable) {
      const url = scanUrl(previewTable.qr_token)
      QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      }).then(setQrDataUrl)
    }
  }, [previewTable])

  const generateToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const addTable = async () => {
    if (!newLabel.trim()) return
    setAdding(true)
    const qr_token = generateToken()
    const { data, error } = await supabase
      .from('tables')
      .insert({ restaurant_id: restaurant.id, label: newLabel.trim(), qr_token, is_active: true })
      .select()
      .single()

    if (error) {
      toast.error('Erreur lors de la création')
    } else if (data) {
      setTables(prev => [...prev, data])
      setNewLabel('')
      toast.success(`Table "${data.label}" créée`)
    }
    setAdding(false)
  }

  const deleteTable = async (table: Table) => {
    if (!confirm(`Supprimer "${table.label}" ? Le QR code ne fonctionnera plus.`)) return
    await supabase.from('tables').delete().eq('id', table.id)
    setTables(prev => prev.filter(t => t.id !== table.id))
    toast.success('Table supprimée')
  }

  const downloadQR = async (table: Table) => {
    const url = scanUrl(table.qr_token)
    const dataUrl = await QRCode.toDataURL(url, { width: 600, margin: 3, errorCorrectionLevel: 'M' })
    const link = document.createElement('a')
    link.download = `QR-${table.label.replace(/\s+/g, '-')}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tables & QR Codes</h1>
        <p className="text-gray-400 text-sm mt-0.5">{restaurant.name}</p>
      </div>

      {/* Add table form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Ajouter une table</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTable()}
            placeholder="ex: Table 1, Bar, Terrasse 2..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            onClick={addTable}
            disabled={!newLabel.trim() || adding}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-orange-600"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Tables list */}
      {tables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <QrCode className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-400">Aucune table créée. Ajoutez votre première table ci-dessus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div key={table.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">{table.label}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{table.qr_token}</p>
                </div>
                <button onClick={() => deleteTable(table)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewTable(table)}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <QrCode size={15} /> Afficher
                </button>
                <button
                  onClick={() => downloadQR(table)}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600"
                >
                  <Download size={15} /> Télécharger
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Preview modal */}
      {previewTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewTable(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs text-center">
            <button onClick={() => setPreviewTable(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-gray-900 mb-1">{previewTable.label}</h3>
            <p className="text-xs text-gray-400 mb-4">{restaurant.name}</p>

            {qrDataUrl && (
              <img src={qrDataUrl} alt={`QR ${previewTable.label}`} className="w-full rounded-2xl mb-4" />
            )}

            <p className="text-xs text-gray-400 mb-4 break-all">{scanUrl(previewTable.qr_token)}</p>

            <button
              onClick={() => downloadQR(previewTable)}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Download size={18} /> Télécharger PNG
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
