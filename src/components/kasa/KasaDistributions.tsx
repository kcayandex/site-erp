"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Partner, KasaDistribution } from "@/types";
import { Plus, Trash2, Calendar } from "lucide-react";

interface Props {
  partners: Partner[];
}

export default function KasaDistributions({ partners }: Props) {
  const supabase = createClient();
  const [distributions, setDistributions] = useState<KasaDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formAmounts, setFormAmounts] = useState<Record<string, string>>({});
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDistributions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("kasa_distributions")
      .select("*")
      .order("distribution_date", { ascending: false })
      .limit(100);
    setDistributions((data ?? []) as KasaDistribution[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchDistributions(); }, [fetchDistributions]);

  async function handleAdd() {
    if (!formDate) { alert("Tarih seçin."); return; }
    const partner_amounts: Record<string, number> = {};
    for (const p of partners) {
      const val = parseFloat(formAmounts[p.id] || "0");
      if (val > 0) partner_amounts[p.id] = val;
    }
    if (Object.keys(partner_amounts).length === 0) {
      alert("En az bir ortağa tutar girin."); return;
    }
    setSaving(true);
    const { error } = await supabase.from("kasa_distributions").insert({
      distribution_date: formDate,
      partner_amounts,
      notes: formNotes.trim() || null,
    });
    if (error) { alert(error.message); setSaving(false); return; }
    setShowForm(false);
    setFormAmounts({});
    setFormNotes("");
    setSaving(false);
    fetchDistributions();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu dağıtım kaydını silmek istiyor musunuz?")) return;
    await supabase.from("kasa_distributions").delete().eq("id", id);
    fetchDistributions();
  }

  function totalOf(d: KasaDistribution) {
    return Object.values(d.partner_amounts).reduce((s, v) => s + Number(v), 0);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" />
          <h3 className="font-semibold text-gray-700">Dağıtım Kayıtları</h3>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
        >
          <Plus size={15} />
          Dağıtım Ekle
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3 border border-gray-100">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tarih</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {partners.map((p) => (
            <div key={p.id}>
              <label className="text-xs text-gray-500 mb-1 block">{p.name} — Tutar (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formAmounts[p.id] ?? ""}
                onChange={(e) =>
                  setFormAmounts((prev) => ({ ...prev, [p.id]: e.target.value }))
                }
                placeholder="0"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Not (opsiyonel)</label>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Haziran 2026 dağıtımı..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-4">Yükleniyor...</p>
      ) : distributions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Henüz dağıtım kaydı yok.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {distributions.map((d) => (
            <div key={d.id} className="py-3.5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(d.distribution_date + "T00:00:00").toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-1 space-y-0.5">
                  {partners.map((p) => {
                    const amount = d.partner_amounts[p.id];
                    if (!amount) return null;
                    return (
                      <p key={p.id} className="text-xs text-gray-500">
                        {p.name}:{" "}
                        <span className="font-medium text-gray-700">
                          ₺{Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                    );
                  })}
                </div>
                {d.notes && (
                  <p className="text-xs text-gray-400 mt-1 italic">{d.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-gray-800">
                  ₺{totalOf(d).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-gray-300 hover:text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
