"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Power, User } from "lucide-react"
import type { Contractor } from "@/types"

interface FormData {
  name: string
  address: string
  phone: string
  notes: string
}

const EMPTY: FormData = { name: "", address: "", phone: "", notes: "" }

export default function ContractorList({
  contractors,
}: {
  contractors: Contractor[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contractor | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
    setError(null)
  }

  function openEdit(c: Contractor) {
    setEditing(c)
    setForm({ name: c.name, address: c.address ?? "", phone: c.phone ?? "", notes: c.notes ?? "" })
    setShowForm(true)
    setError(null)
  }

  function set(field: keyof FormData, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      name: form.name,
      address: form.address || null,
      phone: form.phone || null,
      notes: form.notes || null,
    }

    if (editing) {
      const { error: err } = await supabase.from("contractors").update(payload).eq("id", editing.id)
      if (err) { setError("Güncelleme başarısız: " + err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from("contractors").insert({ ...payload, is_active: true })
      if (err) { setError("Eklenemedi: " + err.message); setLoading(false); return }
    }

    setShowForm(false)
    setForm(EMPTY)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive(c: Contractor) {
    await supabase.from("contractors").update({ is_active: !c.is_active }).eq("id", c.id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <button
        onClick={openNew}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
      >
        <Plus size={16} />
        Yeni Contractor Ekle
      </button>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">
            {editing ? "Contractor Düzenle" : "Yeni Contractor"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad / Firma Adı <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hasan Elektrik" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+90 532 000 00 00" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <input type="text" value={form.address} onChange={e => set("address", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Adres..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <input type="text" value={form.notes} onChange={e => set("notes", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ek notlar..." />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50">
                {loading ? "Kaydediliyor..." : editing ? "Güncelle" : "Ekle"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition">
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contractors.map(c => (
          <div key={c.id} className={`bg-white rounded-xl border p-5 ${c.is_active ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 text-orange-700 rounded-lg p-2">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                  {c.phone && <p className="text-xs text-gray-500 mt-0.5">{c.phone}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded transition" title="Düzenle">
                  <Pencil size={14} />
                </button>
                <button onClick={() => toggleActive(c)}
                  className={`p-1.5 rounded transition ${c.is_active ? "text-gray-400 hover:text-red-500" : "text-gray-300 hover:text-green-500"}`}
                  title={c.is_active ? "Pasife Al" : "Aktife Al"}>
                  <Power size={14} />
                </button>
              </div>
            </div>
            {c.address && <p className="text-xs text-gray-500 mt-3">{c.address}</p>}
            {c.notes && <p className="text-xs text-gray-400 mt-1 italic">{c.notes}</p>}
            <div className="mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {c.is_active ? "Aktif" : "Pasif"}
              </span>
            </div>
          </div>
        ))}
        {contractors.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <User size={40} className="mx-auto mb-3 opacity-40" />
            <p>Henüz contractor eklenmemiş.</p>
          </div>
        )}
      </div>
    </div>
  )
}
