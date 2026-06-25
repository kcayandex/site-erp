"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Site, MonthlyPayment } from "@/types";
import { CheckCircle2, XCircle, X } from "lucide-react";
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

export default function MonthlyFeeList({ sites }: { sites: Site[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [payments, setPayments] = useState<Record<string, MonthlyPayment>>({});
  const [payForm, setPayForm] = useState<PayForm | null>(null);
  const [saving, setSaving] = useState(false);
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

  function openPayForm(site: Site) {
    setPayForm({
      siteId: site.id,
      siteName: site.name,
      amount: String(site.monthly_fee),
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
  const totalExpected = activeSites.reduce((sum, s) => sum + Number(s.monthly_fee), 0);
  const totalCollected = Object.values(payments)
    .filter((p) => p.paid_at)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-5">
      {/* Month/year selector */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Beklenen Toplam</p>
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
                  min="0"
                  step="0.01"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Not (opsiyonel)</label>
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

      {/* Sites table */}
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
            {activeSites.map((site) => {
              const payment = payments[site.id];
              const isPaid = !!payment?.paid_at;
              return (
                <tr key={site.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{site.name}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-700">
                    ₺{Number(site.monthly_fee).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
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
    </div>
  );
}
