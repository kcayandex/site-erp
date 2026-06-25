"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Site, SiteFeePeriod } from "@/types";
import { generateAbbreviation } from "@/lib/utils/receipt-number";
import { Plus, Pencil, Power, Building2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface SiteFormData {
  name: string;
  address: string;
  abbreviation: string;
  vergi_no: string;
  monthly_fee: string;
  contract_start_date: string;
  contract_end_date: string;
}

interface PeriodForm {
  effective_from: string;
  monthly_fee: string;
  note: string;
}

const EMPTY_FORM: SiteFormData = {
  name: "", address: "", abbreviation: "", vergi_no: "", monthly_fee: "",
  contract_start_date: "", contract_end_date: "",
};

const EMPTY_PERIOD: PeriodForm = { effective_from: "", monthly_fee: "", note: "" };

export default function SiteList({
  sites,
  isAdmin,
}: {
  sites: Site[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [form, setForm] = useState<SiteFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fee periods state
  const [feePeriods, setFeePeriods] = useState<SiteFeePeriod[]>([]);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [periodForm, setPeriodForm] = useState<PeriodForm>(EMPTY_PERIOD);
  const [periodSaving, setPeriodSaving] = useState(false);
  const [showPeriodsFor, setShowPeriodsFor] = useState<string | null>(null);
  const [cardPeriods, setCardPeriods] = useState<Record<string, SiteFeePeriod[]>>({});

  async function loadFeePeriods(siteId: string) {
    const { data } = await supabase
      .from("site_fee_periods")
      .select("*")
      .eq("site_id", siteId)
      .order("effective_from");
    setFeePeriods(data ?? []);
  }

  async function toggleCardPeriods(siteId: string) {
    if (showPeriodsFor === siteId) {
      setShowPeriodsFor(null);
      return;
    }
    if (!cardPeriods[siteId]) {
      const { data } = await supabase
        .from("site_fee_periods")
        .select("*")
        .eq("site_id", siteId)
        .order("effective_from");
      setCardPeriods((prev) => ({ ...prev, [siteId]: data ?? [] }));
    }
    setShowPeriodsFor(siteId);
  }

  function openNew() {
    setEditingSite(null);
    setForm(EMPTY_FORM);
    setFeePeriods([]);
    setShowAddPeriod(false);
    setPeriodForm(EMPTY_PERIOD);
    setShowForm(true);
    setError(null);
  }

  function openEdit(site: Site) {
    setEditingSite(site);
    setForm({
      name: site.name,
      address: site.address,
      abbreviation: site.abbreviation,
      vergi_no: site.vergi_no ?? "",
      monthly_fee: String(site.monthly_fee ?? 0),
      contract_start_date: site.contract_start_date ?? "",
      contract_end_date: site.contract_end_date ?? "",
    });
    setShowAddPeriod(false);
    setPeriodForm(EMPTY_PERIOD);
    setShowForm(true);
    setError(null);
    loadFeePeriods(site.id);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      abbreviation: editingSite ? prev.abbreviation : generateAbbreviation(name),
    }));
  }

  function handleStartDateChange(value: string) {
    setForm((prev) => {
      let endDate = prev.contract_end_date;
      if (value) {
        const d = new Date(value);
        d.setFullYear(d.getFullYear() + 1);
        endDate = d.toISOString().split("T")[0];
      }
      return { ...prev, contract_start_date: value, contract_end_date: endDate };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (editingSite) {
      const { error: updateError } = await supabase
        .from("sites")
        .update({
          name: form.name,
          address: form.address,
          abbreviation: form.abbreviation.toUpperCase(),
          vergi_no: form.vergi_no || null,
          monthly_fee: parseFloat(form.monthly_fee) || 0,
          contract_start_date: form.contract_start_date || null,
          contract_end_date: form.contract_end_date || null,
        })
        .eq("id", editingSite.id);

      if (updateError) {
        setError("Güncelleme başarısız: " + updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { data: newSite, error: insertError } = await supabase
        .from("sites")
        .insert({
          name: form.name,
          address: form.address,
          abbreviation: form.abbreviation.toUpperCase(),
          vergi_no: form.vergi_no || null,
          monthly_fee: parseFloat(form.monthly_fee) || 0,
          contract_start_date: form.contract_start_date || null,
          contract_end_date: form.contract_end_date || null,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        setError(
          insertError.message.includes("unique")
            ? "Bu kısaltma zaten kullanılıyor."
            : "Site eklenemedi: " + insertError.message
        );
        setLoading(false);
        return;
      }

      // Create initial fee period
      if (newSite && parseFloat(form.monthly_fee) > 0) {
        await supabase.from("site_fee_periods").insert({
          site_id: newSite.id,
          effective_from: form.contract_start_date || new Date().toISOString().split("T")[0],
          monthly_fee: parseFloat(form.monthly_fee),
          note: "Başlangıç ücreti",
        });
      }
    }

    setShowForm(false);
    setForm(EMPTY_FORM);
    setLoading(false);
    router.refresh();
  }

  async function handleAddPeriod() {
    if (!editingSite || !periodForm.effective_from || !periodForm.monthly_fee) return;
    setPeriodSaving(true);
    await supabase.from("site_fee_periods").insert({
      site_id: editingSite.id,
      effective_from: periodForm.effective_from,
      monthly_fee: parseFloat(periodForm.monthly_fee),
      note: periodForm.note || null,
    });
    setPeriodSaving(false);
    setPeriodForm(EMPTY_PERIOD);
    setShowAddPeriod(false);
    loadFeePeriods(editingSite.id);
  }

  async function handleDeletePeriod(id: string) {
    if (!editingSite) return;
    if (!confirm("Bu fiyat dönemini silmek istediğinize emin misiniz?")) return;
    await supabase.from("site_fee_periods").delete().eq("id", id);
    loadFeePeriods(editingSite.id);
  }

  async function toggleActive(site: Site) {
    await supabase
      .from("sites")
      .update({ is_active: !site.is_active })
      .eq("id", site.id);
    router.refresh();
  }

  function fmtMonth(dateStr: string) {
    return dateStr.slice(0, 7).split("-").reverse().join(".");
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Yeni Site Ekle
        </button>
      )}

      {/* Form */}
      {showForm && isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">
            {editingSite ? "Siteyi Düzenle" : "Yeni Site"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Toprak Panorama"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kısaltma (Makbuz Seri) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.abbreviation}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, abbreviation: e.target.value.toUpperCase() }))
                  }
                  required
                  maxLength={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TPR"
                />
                <p className="text-xs text-gray-400 mt-1">Max 5 karakter</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vergi No</label>
                <input
                  type="text"
                  value={form.vergi_no}
                  onChange={(e) => setForm((p) => ({ ...p, vergi_no: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Aylık Ücreti (₺)
                </label>
                <input
                  type="number"
                  value={form.monthly_fee}
                  onChange={(e) => setForm((p) => ({ ...p, monthly_fee: e.target.value }))}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sözleşme Başlangıç
                </label>
                <input
                  type="date"
                  value={form.contract_start_date}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sözleşme Bitiş
                  <span className="text-xs text-gray-400 ml-1">(başlangıçtan 1 yıl otomatik)</span>
                </label>
                <input
                  type="date"
                  value={form.contract_end_date}
                  onChange={(e) => setForm((p) => ({ ...p, contract_end_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Fee periods section — only when editing */}
            {editingSite && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Fiyat Dönemleri</h4>
                  {!showAddPeriod && (
                    <button
                      type="button"
                      onClick={() => setShowAddPeriod(true)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus size={13} /> Fiyat Değişikliği Ekle
                    </button>
                  )}
                </div>

                {feePeriods.length > 0 && (
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">Geçerlilik</th>
                          <th className="text-right px-3 py-2 text-gray-500 font-medium">Aylık Ücret</th>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">Not</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {feePeriods.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700 font-medium">
                              {fmtMonth(p.effective_from)} itibaren
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-800">
                              ₺{Number(p.monthly_fee).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-gray-400">{p.note ?? "—"}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeletePeriod(p.id)}
                                className="text-gray-300 hover:text-red-500 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {feePeriods.length === 0 && !showAddPeriod && (
                  <p className="text-xs text-gray-400">Henüz fiyat dönemi yok. Yukarıdaki "Başlangıç Aylık Ücreti" değiştirildiğinde otomatik oluşturulur.</p>
                )}

                {showAddPeriod && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-3">
                    <p className="text-xs font-medium text-blue-700">Yeni Fiyat Dönemi</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Geçerlilik Tarihi *</label>
                        <input
                          type="date"
                          value={periodForm.effective_from}
                          onChange={(e) => setPeriodForm((p) => ({ ...p, effective_from: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Yeni Aylık Ücret (₺) *</label>
                        <input
                          type="number"
                          value={periodForm.monthly_fee}
                          onChange={(e) => setPeriodForm((p) => ({ ...p, monthly_fee: e.target.value }))}
                          min="0" step="0.01"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Not</label>
                        <input
                          type="text"
                          value={periodForm.note}
                          onChange={(e) => setPeriodForm((p) => ({ ...p, note: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Yılbaşı zammı"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddPeriod}
                        disabled={periodSaving || !periodForm.effective_from || !periodForm.monthly_fee}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {periodSaving ? "Ekleniyor..." : "Ekle"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddPeriod(false); setPeriodForm(EMPTY_PERIOD); }}
                        className="bg-white hover:bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg border border-gray-200 transition"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Kaydediliyor..." : editingSite ? "Güncelle" : "Ekle"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sites grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <div
            key={site.id}
            className={`bg-white rounded-xl border p-5 ${
              site.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-lg p-2">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{site.name}</p>
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs font-mono px-2 py-0.5 rounded mt-0.5">
                    {site.abbreviation}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(site)}
                    className="text-gray-400 hover:text-blue-600 p-1.5 rounded transition"
                    title="Düzenle"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(site)}
                    className={`p-1.5 rounded transition ${
                      site.is_active
                        ? "text-gray-400 hover:text-red-500"
                        : "text-gray-300 hover:text-green-500"
                    }`}
                    title={site.is_active ? "Pasife Al" : "Aktife Al"}
                  >
                    <Power size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">{site.address}</p>
            {site.vergi_no && (
              <p className="text-xs text-gray-400 mt-1">Vergi No: {site.vergi_no}</p>
            )}
            <p className="text-xs text-blue-600 font-semibold mt-1">
              Güncel: ₺{Number(site.monthly_fee).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}/ay
            </p>
            {site.contract_start_date && site.contract_end_date && (
              <p className="text-xs text-gray-400 mt-0.5">
                Sözleşme: {fmtMonth(site.contract_start_date)} → {fmtMonth(site.contract_end_date)}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  site.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {site.is_active ? "Aktif" : "Pasif"}
              </span>
              {isAdmin && (
                <button
                  onClick={() => toggleCardPeriods(site.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition"
                >
                  Fiyat Geçmişi
                  {showPeriodsFor === site.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>

            {/* Inline fee history on card */}
            {showPeriodsFor === site.id && cardPeriods[site.id] && (
              <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
                {cardPeriods[site.id].length === 0 ? (
                  <p className="text-xs text-gray-400">Fiyat dönemi yok.</p>
                ) : (
                  cardPeriods[site.id].map((p) => (
                    <div key={p.id} className="flex justify-between text-xs">
                      <span className="text-gray-500">{fmtMonth(p.effective_from)} itibaren</span>
                      <span className="font-semibold text-gray-700">
                        ₺{Number(p.monthly_fee).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        {p.note && <span className="text-gray-400 ml-1">({p.note})</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {sites.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-40" />
            <p>Henüz site eklenmemiş.</p>
          </div>
        )}
      </div>
    </div>
  );
}
