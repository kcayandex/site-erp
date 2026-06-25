"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Partner, KasaSettlement } from "@/types";
import {
  TrendingUp, Wallet, TrendingDown, Users,
  AlertTriangle, CheckCircle2, Lock,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const YEARS = [2024, 2025, 2026, 2027];

interface MonthData {
  totalKar: number;
  totalFeesCash: number;
  totalFeesBank: number;
  totalExpenses: number;
  unpaidSites: { name: string; monthly_fee: number }[];
  pendingReimbursements: { description: string; amount: number; paid_by: string }[];
}

export default function KasaDashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthData | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [settlement, setSettlement] = useState<KasaSettlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const supabase = createClient();

  const getDateRange = useCallback(() => {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { startDate, endDate };
  }, [year, month]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();

    const [
      { data: receipts },
      { data: payments },
      { data: sites },
      { data: expenses },
      { data: partnerData },
      { data: settlementData },
    ] = await Promise.all([
      supabase.from("receipts").select("total_islenen, total_odened").gte("date", startDate).lte("date", endDate),
      supabase.from("monthly_payments").select("amount, site_id, payment_method").eq("year", year).eq("month", month).not("paid_at", "is", null),
      supabase.from("sites").select("id, name, monthly_fee").eq("is_active", true),
      supabase.from("company_expenses").select("amount, description, paid_by, reimbursed").gte("expense_date", startDate).lte("expense_date", endDate),
      supabase.from("partners").select("*").eq("is_active", true).order("created_at"),
      supabase.from("kasa_settlements").select("*").eq("year", year).eq("month", month).maybeSingle(),
    ]);

    setPartners((partnerData ?? []) as Partner[]);
    setSettlement(settlementData as KasaSettlement | null);

    const totalKar = (receipts ?? []).reduce(
      (sum, r) => sum + (Number(r.total_islenen) - Number(r.total_odened)), 0
    );
    const totalFeesCash = (payments ?? []).filter((p) => p.payment_method === "nakit").reduce((sum, p) => sum + Number(p.amount), 0);
    const totalFeesBank = (payments ?? []).filter((p) => p.payment_method === "havale").reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

    const paidSiteIds = new Set((payments ?? []).map((p) => p.site_id));
    const unpaidSites = (sites ?? [])
      .filter((s) => !paidSiteIds.has(s.id))
      .map((s) => ({ name: s.name, monthly_fee: Number(s.monthly_fee) }));

    const pendingReimbursements = (expenses ?? [])
      .filter((e) => e.paid_by !== "kasa" && !e.reimbursed)
      .map((e) => ({ description: e.description, amount: Number(e.amount), paid_by: e.paid_by }));

    setData({ totalKar, totalFeesCash, totalFeesBank, totalExpenses, unpaidSites, pendingReimbursements });
    setLoading(false);
  }, [year, month, supabase, getDateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function getPartnerName(paidBy: string): string {
    const p = partners.find((p) => p.id === paidBy);
    return p?.name ?? "Bilinmeyen";
  }

  async function handleSettle() {
    if (!data) return;
    if (!confirm(`${MONTHS[month - 1]} ${year} ayını kapatmak istediğinize emin misiniz?\n\nBu işlem:\n• Kişisel ödenen giderleri "iade edildi" olarak işaretler\n• Dağıtım kaydını oluşturur\n\nGeri alınamaz.`)) return;

    setSettling(true);
    const { startDate, endDate } = getDateRange();

    await Promise.all([
      supabase
        .from("company_expenses")
        .update({ reimbursed: true, reimbursed_at: new Date().toISOString() })
        .neq("paid_by", "kasa")
        .eq("reimbursed", false)
        .gte("expense_date", startDate)
        .lte("expense_date", endDate),
      supabase.from("kasa_settlements").insert({
        year,
        month,
        total_distributed: net,
      }),
    ]);

    setSettling(false);
    fetchData();
  }

  async function handleUndoSettle() {
    if (!settlement) return;
    if (!confirm("Ayı yeniden açmak istediğinize emin misiniz?")) return;
    await supabase.from("kasa_settlements").delete().eq("id", settlement.id);
    fetchData();
  }

  const net = data ? data.totalKar + data.totalFeesCash - data.totalExpenses : 0;
  const totalPct = partners.reduce((s, p) => s + Number(p.share_percentage), 0);

  // Per-partner owed reimbursements
  const partnerReimbursements: Record<string, number> = {};
  (data?.pendingReimbursements ?? []).forEach((e) => {
    partnerReimbursements[e.paid_by] = (partnerReimbursements[e.paid_by] ?? 0) + e.amount;
  });

  const totalReimbursements = Object.values(partnerReimbursements).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Settlement badge */}
        {!loading && settlement && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
            <CheckCircle2 size={14} />
            Kapatıldı — {format(new Date(settlement.settled_at), "dd MMM yyyy", { locale: tr })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-blue-600" />
                <p className="text-xs text-gray-500">Makbuz Karı</p>
              </div>
              <p className="text-xl font-bold text-blue-700">
                ₺{data.totalKar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 mt-1">İşlenen − Ödenen</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={18} className="text-green-600" />
                <p className="text-xs text-gray-500">Nakit Ücretler</p>
              </div>
              <p className="text-xl font-bold text-green-700">
                ₺{data.totalFeesCash.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 mt-1">Kasaya giren</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={18} className="text-red-500" />
                <p className="text-xs text-gray-500">Şirket Giderleri</p>
              </div>
              <p className="text-xl font-bold text-red-600">
                ₺{data.totalExpenses.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-2">Net Kasa</p>
              <p className={`text-2xl font-bold ${net >= 0 ? "text-white" : "text-red-400"}`}>
                ₺{net.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Dağıtılacak</p>
            </div>
          </div>

          {/* Bank account info — havale fees */}
          {data.totalFeesBank > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-600 rounded-lg p-2">
                  <Wallet size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-800">Banka Hesabı — Havale Ücretler</p>
                  <p className="text-xs text-indigo-500 mt-0.5">Bu tutar kasaya girmez, dağıtıma dahil değildir</p>
                </div>
              </div>
              <p className="text-xl font-bold text-indigo-700">
                ₺{data.totalFeesBank.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Hesaplama</h3>
            <div className="text-sm divide-y divide-gray-100">
              <div className="flex justify-between py-3">
                <span className="text-gray-600">+ Makbuz Karı (İşlenen − Ödenen)</span>
                <span className="font-semibold text-blue-700">₺{data.totalKar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-600">+ Nakit Aylık Ücretler</span>
                <span className="font-semibold text-green-700">₺{data.totalFeesCash.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              {data.totalFeesBank > 0 && (
                <div className="flex justify-between py-2 opacity-50">
                  <span className="text-gray-500 text-xs italic">Havale ücretler (banka — dahil değil)</span>
                  <span className="text-xs text-indigo-600">₺{data.totalFeesBank.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="text-gray-600">− Şirket Giderleri</span>
                <span className="font-semibold text-red-600">₺{data.totalExpenses.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-4 font-bold text-base">
                <span className="text-gray-800">= Net Kasa (Dağıtılacak)</span>
                <span className={net >= 0 ? "text-gray-900" : "text-red-600"}>
                  ₺{net.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Partner distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-700">Ortak Dağılımı</h3>
              </div>
              {totalPct !== 100 && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={11} /> Toplam %{totalPct} (100 olmalı)
                </span>
              )}
            </div>

            {partners.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Ortaklar sayfasından ortak ekleyin.</p>
            ) : (
              <div className="space-y-3">
                {partners.map((partner) => {
                  const profitShare = net * (Number(partner.share_percentage) / 100);
                  const owed = partnerReimbursements[partner.id] ?? 0;
                  const total = profitShare + owed;
                  return (
                    <div key={partner.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-gray-800">{partner.name}</p>
                        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                          %{partner.share_percentage}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Kar Payı</span>
                          <span className={profitShare >= 0 ? "font-medium text-gray-800" : "font-medium text-red-600"}>
                            ₺{profitShare.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {owed > 0 && (
                          <div className="flex justify-between text-amber-700">
                            <span>İade Alacağı</span>
                            <span className="font-medium">
                              + ₺{owed.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-base">
                          <span className="text-gray-700">Kasadan Alacağı</span>
                          <span className={total >= 0 ? "text-gray-900" : "text-red-600"}>
                            ₺{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Total line */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-xl text-white">
                  <span className="text-sm font-medium">Kasadan Toplam Çıkış</span>
                  <span className="font-bold text-lg">
                    ₺{(net + totalReimbursements).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Settle / Undo button */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              {settlement ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700">
                    <Lock size={15} />
                    <span className="text-sm font-medium">
                      Bu ay kapatıldı — {format(new Date(settlement.settled_at), "dd MMMM yyyy, HH:mm", { locale: tr })}
                    </span>
                  </div>
                  <button
                    onClick={handleUndoSettle}
                    className="text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    Yeniden Aç
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSettle}
                  disabled={settling || partners.length === 0}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock size={15} />
                  {settling ? "Kapatılıyor..." : `${MONTHS[month - 1]} ${year} Ayını Kapat — Kasayı Sıfırla`}
                </button>
              )}
            </div>
          </div>

          {/* Unpaid monthly fees */}
          {data.unpaidSites.length > 0 && (
            <div className="bg-white rounded-xl border border-red-100 p-6">
              <h3 className="font-semibold text-gray-700 mb-3">
                Henüz Ödenmemiş Aylık Ücretler
                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  {data.unpaidSites.length} site
                </span>
              </h3>
              <div className="divide-y divide-gray-100">
                {data.unpaidSites.map((site) => (
                  <div key={site.name} className="flex justify-between items-center py-2.5 text-sm">
                    <span className="text-gray-700">{site.name}</span>
                    <span className="font-semibold text-red-600">
                      ₺{site.monthly_fee.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 text-sm font-bold">
                <span className="text-gray-700">Toplam Bekleyen</span>
                <span className="text-red-600">
                  ₺{data.unpaidSites.reduce((s, x) => s + x.monthly_fee, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
