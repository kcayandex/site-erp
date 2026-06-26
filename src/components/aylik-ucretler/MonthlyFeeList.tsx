"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Site, MonthlyPayment, SiteFeePeriod } from "@/types";
import { CheckCircle2, XCircle, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const YEARS = [2024, 2025, 2026, 2027];

interface PayForm {
  siteId: string;
  siteName: string;
  amount: string;
  paidAt: string;
  method: "nakit" | "havale";
  notes: string;
}

function monthsBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function fmtDate(dateStr: string): string {
  return dateStr.slice(0, 7).split("-").reverse().join(".");
}

function getApplicableFee(
  siteId: string,
  year: number,
  month: number,
  feePeriods: SiteFeePeriod[],
  defaultFee: number
): number {
  const target = `${year}-${String(month).padStart(2, "0")}-01`;
  const relevant = feePeriods
    .filter((p) => p.site_id === siteId && p.effective_from <= target)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return relevant.length > 0 ? Number(relevant[0].monthly_fee) : defaultFee;
}

function getExpectedTotal(site: Site, feePeriods: SiteFeePeriod[]): number {
  if (!site.contract_start_date || !site.contract_end_date) return 0;
  const start = new Date(site.contract_start_date);
  const end = new Date(site.contract_end_date);
  let total = 0;
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endM = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endM) {
    total += getApplicableFee(site.id, cur.getFullYear(), cur.getMonth() + 1, feePeriods, Number(site.monthly_fee));
    cur.setMonth(cur.getMonth() + 1);
  }
  return total;
}

export default function MonthlyFeeList({
  sites,
  allPaidPayments,
  feePeriods,
}: {
  sites: Site[];
  allPaidPayments: { site_id: string; amount: number }[];
  feePeriods: SiteFeePeriod[];
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [payments, setPayments] = useState<Record<string, MonthlyPayment>>({});
  const [payForm, setPayForm] = useState<PayForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"aylik" | "sozlesme">("aylik");
  const supabase = createClient();
  const router = useRouter();

  const fetchPayments = useCallback(async () => {
    const { data } = await supabase
      .from("monthly_payments")
      .select("*")
      .eq("year", year)
      .eq("month", month);
    const map: Record<string, MonthlyPayment> = {};
    (data ?? []).forEach((p) => { map[p.site_id] = p as MonthlyPayment; });
    setPayments(map);
  }, [year, month, supabase]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Contract stats from server-provided all-time payments
  const contractStats = useMemo(() => {
    const stats: Record<string, { paidMonths: number; paidAmount: number }> = {};
    allPaidPayments.forEach((p) => {
      if (!stats[p.site_id]) stats[p.site_id] = { paidMonths: 0, paidAmount: 0 };
      stats[p.site_id].paidMonths++;
      stats[p.site_id].paidAmount += Number(p.amount);
    });
    return stats;
  }, [allPaidPayments]);

  function openPayForm(site: Site) {
    const fee = getApplicableFee(site.id, year, month, feePeriods, Number(site.monthly_fee));
    setPayForm({
      siteId: site.id,
      siteName: site.name,
      amount: String(fee),
      paidAt: format(new Date(), "yyyy-MM-dd"),
      method: "nakit",
      notes: "",
    });
  }

  async function handleMarkPaid() {
    if (!payForm) return;
    setSaving(true);
    await supabase.from("monthly_payments").upsert(
      {
        site_id: payForm.siteId,
        year,
        month,
        amount: parseFloat(payForm.amount) || 0,
        paid_at: payForm.paidAt,
        payment_method: payForm.method,
        notes: payForm.notes || null,
      },
      { onConflict: "site_id,year,month" }
    );
    setSaving(false);
    setPayForm(null);
    fetchPayments();
    router.refresh();
  }

  async function handleMarkUnpaid(siteId: string) {
    const payment = payments[siteId];
    if (!payment) return;
    await supabase
      .from("monthly_payments")
      .update({ paid_at: null, payment_method: null })
      .eq("id", payment.id);
    fetchPayments();
    router.refresh();
  }

  const activeSites = sites.filter((s) => s.is_active);

  // Only sites whose contract covers the selected month
  const sitesInMonth = activeSites.filter((s) => {
    if (!s.contract_start_date || !s.contract_end_date) return false;
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return s.contract_start_date <= monthEnd && s.contract_end_date >= monthStart;
  });

  const totalExpected = sitesInMonth.reduce(
    (sum, s) => sum + getApplicableFee(s.id, year, month, feePeriods, Number(s.monthly_fee)),
    0
  );
  const totalCollected = Object.values(payments)
    .filter((p) => p.paid_at)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const sitesWithContracts = activeSites.filter(
    (s) => s.contract_start_date && s.contract_end_date
  );

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("aylik")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === "aylik"
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Aylık Takip
        </button>
        <button
          onClick={() => setActiveTab("sozlesme")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === "sozlesme"
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sözleşme Durumu
        </button>
      </div>

      {/* ── AYLIK TAKİP ── */}
      {activeTab === "aylik" && (
        <>
          <div className="flex items-center gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Beklenen</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                ₺{totalExpected.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-green-100 p-4">
              <p className="text-xs text-gray-500">Tahsil Edilen</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                ₺{totalCollected.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-red-100 p-4">
              <p className="text-xs text-gray-500">Bekleyen</p>
              <p className="text-xl font-bold text-red-500 mt-1">
                ₺{(totalExpected - totalCollected).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Site</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-600">Aylık Ücret</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Durum</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Ödeme Tarihi</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Yöntem</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sitesInMonth.map((site) => {
                  const payment = payments[site.id];
                  const isPaid = !!payment?.paid_at;
                  return (
                    <tr key={site.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">{site.name}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-700">
                        ₺{getApplicableFee(site.id, year, month, feePeriods, Number(site.monthly_fee)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 text-xs font-medium px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={12} /> Ödendi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 text-xs font-medium px-2.5 py-1 rounded-full">
                            <XCircle size={12} /> Ödenmedi
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {payment?.paid_at
                          ? format(new Date(payment.paid_at), "dd MMM yyyy", { locale: tr })
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 capitalize">
                        {payment?.payment_method ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPaid ? (
                          <button
                            onClick={() => handleMarkUnpaid(site.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition"
                          >
                            Geri Al
                          </button>
                        ) : (
                          <button
                            onClick={() => openPayForm(site)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                          >
                            Ödendi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {activeSites.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      Aktif site bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── SÖZLEŞME DURUMU ── */}
      {activeTab === "sozlesme" && (
        <div className="space-y-4">
          {sitesWithContracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">
              <FileText size={36} className="mx-auto mb-3 opacity-40" />
              <p>Sözleşme tarihi girilmiş site yok.</p>
              <p className="text-sm mt-1">Siteler sayfasından sözleşme başlangıç/bitiş tarihi ekleyin.</p>
            </div>
          ) : (
            sitesWithContracts.map((site) => {
              const stats = contractStats[site.id] ?? { paidMonths: 0, paidAmount: 0 };
              const totalMonths = monthsBetween(site.contract_start_date!, site.contract_end_date!);
              const totalAmount = getExpectedTotal(site, feePeriods);
              const remainingMonths = Math.max(0, totalMonths - stats.paidMonths);
              const remainingAmount = Math.max(0, totalAmount - stats.paidAmount);
              const progress = totalMonths > 0 ? Math.min(100, (stats.paidMonths / totalMonths) * 100) : 0;

              return (
                <div key={site.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{site.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {fmtDate(site.contract_start_date!)} → {fmtDate(site.contract_end_date!)}
                        <span className="ml-2 text-gray-400">({totalMonths} ay)</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Güncel Aylık</p>
                      <p className="font-semibold text-gray-800">
                        ₺{Number(site.monthly_fee).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </p>
                      {feePeriods.some((p) => p.site_id === site.id) && (
                        <p className="text-xs text-blue-500 mt-0.5">
                          {feePeriods.filter((p) => p.site_id === site.id).length} dönem
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Ödenen</p>
                      <p className="font-bold text-green-600 mt-0.5">{stats.paidMonths} ay</p>
                      <p className="text-xs text-gray-400">
                        ₺{stats.paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Kalan</p>
                      <p className="font-bold text-red-500 mt-0.5">{remainingMonths} ay</p>
                      <p className="text-xs text-gray-400">
                        ₺{remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Toplam Sözleşme</p>
                      <p className="font-bold text-gray-800 mt-0.5">{totalMonths} ay</p>
                      <p className="text-xs text-gray-400">
                        ₺{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-right mt-3">
                    %{Math.round(progress)} tamamlandı
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Payment modal */}
      {payForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">{payForm.siteName}</h3>
              <button onClick={() => setPayForm(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((p) => p && { ...p, amount: e.target.value })}
                  min="0" step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi</label>
                <input
                  type="date"
                  value={payForm.paidAt}
                  onChange={(e) => setPayForm((p) => p && { ...p, paidAt: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yöntem</label>
                <select
                  value={payForm.method}
                  onChange={(e) => setPayForm((p) => p && { ...p, method: e.target.value as "nakit" | "havale" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nakit">Nakit</option>
                  <option value="havale">Havale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm((p) => p && { ...p, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleMarkPaid}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : "Ödendi Olarak Kaydet"}
              </button>
              <button
                onClick={() => setPayForm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
