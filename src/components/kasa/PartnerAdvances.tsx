"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Partner } from "@/types";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Advance {
  id: string;
  partner_id: string;
  partner: { name: string } | null;
  amount: number;
  advance_date: string;
  notes: string | null;
  settled: boolean;
  settled_at: string | null;
}

export default function PartnerAdvances({
  partners,
  onDataChange,
}: {
  partners: Partner[];
  onDataChange?: () => void;
}) {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formPartnerId, setFormPartnerId] = useState(partners[0]?.id ?? "");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchAdvances = useCallback(async () => {
    const { data } = await supabase
      .from("partner_advances")
      .select("*, partner:partners(name)")
      .order("advance_date", { ascending: false })
      .limit(50);
    setAdvances((data ?? []) as Advance[]);
  }, [supabase]);

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  async function handleAdd() {
    const amount = parseFloat(formAmount);
    if (!formPartnerId || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    await supabase.from("partner_advances").insert({
      partner_id: formPartnerId,
      amount,
      advance_date: formDate,
      notes: formNotes || null,
    });
    setSaving(false);
    setShowForm(false);
    setFormAmount("");
    setFormNotes("");
    await fetchAdvances();
    onDataChange?.();
  }

  async function handleSettle(id: string) {
    await supabase
      .from("partner_advances")
      .update({ settled: true, settled_at: new Date().toISOString() })
      .eq("id", id);
    await fetchAdvances();
    onDataChange?.();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu avansı silmek istediğinize emin misiniz?")) return;
    await supabase.from("partner_advances").delete().eq("id", id);
    await fetchAdvances();
    onDataChange?.();
  }

  const pending = advances.filter((a) => !a.settled);
  const settled = advances.filter((a) => a.settled);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Ortak Avansları</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
        >
          <Plus size={14} /> Avans Ekle
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ortak</label>
              <select
                value={formPartnerId}
                onChange={(e) => setFormPartnerId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tarih</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Opsiyonel"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {pending.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 text-center py-4">Bekleyen avans yok.</p>
      ) : (
        <div className="space-y-2">
          {pending.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-4 py-3 text-sm">
              <div>
                <span className="font-semibold text-gray-800">{a.partner?.name}</span>
                <span className="text-gray-500 ml-2">
                  {format(new Date(a.advance_date), "dd MMM yyyy", { locale: tr })}
                </span>
                {a.notes && <span className="text-gray-400 ml-2">— {a.notes}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-700">
                  ₺{Number(a.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => handleSettle(a.id)}
                  title="Avansı kapat (iade edildi)"
                  className="text-green-600 hover:text-green-700 transition"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {settled.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            Kapatılan avanslar ({settled.length})
          </summary>
          <div className="mt-2 space-y-1.5">
            {settled.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-500 bg-gray-50 rounded-lg">
                <div>
                  <span>{a.partner?.name}</span>
                  <span className="ml-2 text-xs">{format(new Date(a.advance_date), "dd MMM yyyy", { locale: tr })}</span>
                  {a.notes && <span className="ml-2 text-xs">— {a.notes}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="line-through">₺{Number(a.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  <button onClick={() => handleDelete(a.id)} className="text-gray-300 hover:text-red-400 transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
