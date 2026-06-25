"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Partner } from "@/types";
import { Plus, Pencil, Check, X, Trash2, AlertTriangle, Users } from "lucide-react";

export default function PartnerList({ initialPartners }: { initialPartners: Partner[] }) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", share_percentage: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", share_percentage: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const totalPct = partners
    .filter((p) => p.is_active)
    .reduce((sum, p) => sum + Number(p.share_percentage), 0);

  function startEdit(partner: Partner) {
    setEditingId(partner.id);
    setEditForm({ name: partner.name, share_percentage: String(partner.share_percentage) });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function handleUpdate(id: string) {
    if (!editForm.name.trim()) { setError("İsim gerekli."); return; }
    setSaving(true);
    const { error: e } = await supabase
      .from("partners")
      .update({
        name: editForm.name.trim(),
        share_percentage: parseFloat(editForm.share_percentage) || 0,
      })
      .eq("id", id);
    setSaving(false);
    if (e) { setError(e.message); return; }
    setEditingId(null);
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) { setError("İsim gerekli."); return; }
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("partners").insert({
      name: addForm.name.trim(),
      share_percentage: parseFloat(addForm.share_percentage) || 0,
    });
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    setAddForm({ name: "", share_percentage: "" });
    setShowAdd(false);
    router.refresh();
  }

  async function toggleActive(partner: Partner) {
    await supabase
      .from("partners")
      .update({ is_active: !partner.is_active })
      .eq("id", partner.id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ortağı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    const { error: e } = await supabase.from("partners").delete().eq("id", id);
    if (e) { alert("Silinemedi: " + e.message); return; }
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Total percentage warning */}
      <div className={`flex items-center justify-between rounded-xl border p-4 ${
        totalPct === 100
          ? "bg-green-50 border-green-100"
          : "bg-amber-50 border-amber-200"
      }`}>
        <div className="flex items-center gap-2">
          <Users size={16} className={totalPct === 100 ? "text-green-600" : "text-amber-600"} />
          <span className={`text-sm font-medium ${totalPct === 100 ? "text-green-700" : "text-amber-700"}`}>
            Aktif Ortaklar Toplam Payı: %{totalPct}
          </span>
        </div>
        {totalPct !== 100 && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle size={12} /> Kasa hesabı için %100 olmalı
          </span>
        )}
      </div>

      <button
        onClick={() => { setShowAdd(true); setAddForm({ name: "", share_percentage: "" }); setError(null); }}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
      >
        <Plus size={16} /> Yeni Ortak Ekle
      </button>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Yeni Ortak</h3>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İsim <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ortak Adı"
              />
            </div>
            <div className="w-36">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay (%)</label>
              <input
                type="number"
                value={addForm.share_percentage}
                onChange={(e) => setAddForm((p) => ({ ...p, share_percentage: e.target.value }))}
                min="0" max="100" step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="50"
              />
            </div>
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50">
              {saving ? "..." : "Ekle"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2.5 rounded-lg transition">
              İptal
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
      )}

      {/* Partners table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">İsim</th>
              <th className="text-center px-6 py-3 font-semibold text-gray-600">Pay (%)</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Durum</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {partners.map((partner) => (
              <tr key={partner.id} className={`hover:bg-gray-50 transition ${!partner.is_active ? "opacity-50" : ""}`}>
                <td className="px-6 py-4">
                  {editingId === partner.id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      className="border border-blue-400 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{partner.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {editingId === partner.id ? (
                    <input
                      type="number"
                      value={editForm.share_percentage}
                      onChange={(e) => setEditForm((p) => ({ ...p, share_percentage: e.target.value }))}
                      min="0" max="100" step="0.01"
                      className="border border-blue-400 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-center"
                    />
                  ) : (
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                      %{partner.share_percentage}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    partner.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {partner.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === partner.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(partner.id)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-700 p-1.5 rounded transition disabled:opacity-50"
                          title="Kaydet"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded transition"
                          title="İptal"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(partner)}
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded transition"
                          title="Düzenle"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleActive(partner)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 rounded"
                          title={partner.is_active ? "Pasife Al" : "Aktife Al"}
                        >
                          {partner.is_active ? "Pasif" : "Aktif"}
                        </button>
                        <button
                          onClick={() => handleDelete(partner.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded transition"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400">
                  Henüz ortak eklenmemiş.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
