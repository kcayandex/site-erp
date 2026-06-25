"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, Wallet, TrendingDown, Users, AlertCircle } from "lucide-react";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const YEARS = [2024, 2025, 2026, 2027];

interface MonthData {
  totalKar: number;
  totalFees: number;
  totalExpenses: number;
  unpaidSites: { name: string; monthly_fee: number }[];
  pendingReimbursements: { description: string; amount: number; paid_by: string }[];
}

export default function KasaDashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [
      { data: receipts },
      { data: payments },
      { data: sites },
      { data: expenses },
    ] = await Promise.all([
      supabase
        .from("receipts")
        .select("total_islenen, total_odened")
        .gte("date", startDate)
        .lte("date", endDate),
      supabase
        .from("monthly_payments")
        .select("amount, site_id")
        .eq("year", year)
        .eq("month", month)
        .not("paid_at", "is", null),
      supabase
        .from("sites")
        .select("id, name, monthly_fee")
        .eq("is_active", true),
      supabase
        .from("company_expenses")
        .select("amount, description, paid_by, reimbursed")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate),
    ]);

    const totalKar = (receipts ?? []).reduce(
      (sum, r) => sum + (Number(r.total_islenen) - Number(r.total_odened)),
      0
    );
    const totalFees = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

    const paidSiteIds = new Set((payments ?? []).map((p) => p.site_id));
    const unpaidSites = (sites ?? [])
      .filter((s) => !paidSiteIds.has(s.id))
      .map((s) => ({ name: s.name, monthly_fee: Number(s.monthly_fee) }));

    const pendingReimbursements = (expenses ?? [])
      .filter((e) => e.paid_by !== "kasa" && !e.reimbursed)
      .map((e) => ({ description: e.description, amount: Number(e.amount), paid_by: e.paid_by }));

    setData({ totalKar, totalFees, totalExpenses, unpaidSites, pendingReimbursements });
    setLoading(false);
  }, [year, month, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const net = data ? data.totalKar + data.totalFees - data.totalExpenses : 0;
  const share = net / 2;

  return (
    <div className="space-y-6">
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

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : data && (
        <>
          {/* 4 summary cards */}
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
                <p className="text-xs text-gray-500">Aylık Ücretler</p>
              </div>
              <p className="text-xl font-bold text-green-700">
                ₺{data.totalFees.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 mt-1">Tahsil edilenler</p>
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
              <p className="text-xs text-gray-400 mb-2">Net KTurkey Geliri</p>
              <p className={`text-2xl font-bold ${net >= 0 ? "text-white" : "text-red-400"}`}>
                ₺{net.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Hesaplama</h3>
            <div className="space-y-0 text-sm divide-y divide-gray-100">
              <div className="flex justify-between py-3">
                <span className="text-gray-600">+ Makbuz Karı (İşlenen − Ödenen)</span>
                <span className="font-semibold text-blue-700">
                  ₺{data.totalKar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-600">+ Tahsil Edilen Aylık Ücretler</span>
                <span className="font-semibold text-green-700">
                  ₺{data.totalFees.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-600">− Şirket Giderleri</span>
                <span className="font-semibold text-red-600">
                  ₺{data.totalExpenses.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-4 font-bold text-base">
                <span className="text-gray-800">= Net Dağıtılabilir Kar</span>
                <span className={net >= 0 ? "text-gray-900" : "text-red-600"}>
                  ₺{net.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Partner split */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-gray-500" />
              <h3 className="font-semibold text-gray-700">Ortak Dağılımı (%50 / %50)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["Ortak 1", "Ortak 2"].map((partner) => (
                <div key={partner} className="bg-gray-50 rounded-xl p-5 text-center">
                  <p className="text-sm text-gray-500 mb-1">{partner}</p>
                  <p className={`text-2xl font-bold ${share >= 0 ? "text-gray-800" : "text-red-600"}`}>
                    ₺{share.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">%50</p>
                </div>
              ))}
            </div>

            {/* Pending reimbursements warning */}
            {data.pendingReimbursements.length > 0 && (
              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={15} className="text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">İade Bekleyen Kişisel Giderler</p>
                </div>
                <div className="space-y-1.5">
                  {data.pendingReimbursements.map((e, i) => (
                    <div key={i} className="flex justify-between text-sm text-amber-700">
                      <span>{e.description} <span className="text-amber-500 text-xs">({e.paid_by === "ortak1" ? "Ortak 1" : "Ortak 2"})</span></span>
                      <span className="font-semibold">
                        ₺{e.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  ₺{data.unpaidSites
                    .reduce((s, x) => s + x.monthly_fee, 0)
                    .toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
