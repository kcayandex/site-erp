"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const YEARS = [2024, 2025, 2026, 2027];

interface MonthRow {
  name: string;
  kar: number;
  nakit: number;
  havale: number;
  gider: number;
  dagitim: number;
  devreden: number;
  net: number;
}

export default function YillikOzet() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [
      { data: receipts },
      { data: payments },
      { data: expenses },
      { data: distributions },
      { data: settlements },
      { data: prevYear },
    ] = await Promise.all([
      supabase.from("receipts").select("date, total_islenen, total_odenen")
        .gte("date", `${year}-01-01`).lte("date", `${year}-12-31`),
      supabase.from("monthly_payments").select("year, month, amount, payment_method")
        .eq("year", year).not("paid_at", "is", null),
      supabase.from("company_expenses").select("expense_date, amount, paid_by, reimbursed_amount")
        .gte("expense_date", `${year}-01-01`).lte("expense_date", `${year}-12-31`),
      supabase.from("kasa_distributions").select("distribution_date, partner_amounts")
        .gte("distribution_date", `${year}-01-01`).lte("distribution_date", `${year}-12-31`),
      supabase.from("kasa_settlements").select("month, closing_balance").eq("year", year),
      supabase.from("kasa_settlements").select("closing_balance, month")
        .eq("year", year - 1).order("month", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const computed = MONTHS.map((name, i) => {
      const m = i + 1;
      const ms = `${year}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(year, m, 0).getDate();
      const me = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const kar = (receipts ?? [])
        .filter((r) => r.date >= ms && r.date <= me)
        .reduce((s, r) => s + (Number(r.total_islenen) - Number(r.total_odenen)), 0);

      const nakit = (payments ?? [])
        .filter((p) => p.month === m && p.payment_method === "nakit")
        .reduce((s, p) => s + Number(p.amount), 0);

      const havale = (payments ?? [])
        .filter((p) => p.month === m && p.payment_method === "havale")
        .reduce((s, p) => s + Number(p.amount), 0);

      const gider = (expenses ?? [])
        .filter((e) => e.expense_date >= ms && e.expense_date <= me)
        .reduce((s, e) => {
          if (e.paid_by === "kasa") return s + Number(e.amount);
          return s + Number(e.reimbursed_amount ?? 0);
        }, 0);

      const dagitim = (distributions ?? [])
        .filter((d) => d.distribution_date >= ms && d.distribution_date <= me)
        .reduce((s, d) => {
          return s + Object.values(d.partner_amounts as Record<string, number>).reduce((v, n) => v + Number(n), 0);
        }, 0);

      const devreden =
        m === 1
          ? Number((prevYear as { closing_balance?: number } | null)?.closing_balance ?? 0)
          : Number((settlements ?? []).find((s) => s.month === m - 1)?.closing_balance ?? 0);

      const net = devreden + kar + nakit - gider - dagitim;

      return { name, kar, nakit, havale, gider, dagitim, devreden, net };
    });

    setRows(computed);
    setLoading(false);
  }, [year, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fmt = (n: number) =>
    n === 0 ? "—" : `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}`;

  const totals = rows.reduce(
    (s, r) => ({
      kar: s.kar + r.kar,
      nakit: s.nakit + r.nakit,
      havale: s.havale + r.havale,
      gider: s.gider + r.gider,
      dagitim: s.dagitim + r.dagitim,
    }),
    { kar: 0, nakit: 0, havale: 0, gider: 0, dagitim: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/kasa" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft size={14} /> Aylık Kasa
        </Link>
        <div className="flex items-center gap-2">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                y === year
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ay</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Devreden</th>
                <th className="text-right px-4 py-3 font-semibold text-blue-600">Makbuz Karı</th>
                <th className="text-right px-4 py-3 font-semibold text-green-600">Nakit Ücret</th>
                <th className="text-right px-4 py-3 font-semibold text-indigo-500">Havale</th>
                <th className="text-right px-4 py-3 font-semibold text-red-500">Giderler</th>
                <th className="text-right px-4 py-3 font-semibold text-orange-500">Dağıtımlar</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-800">Net Kasa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const isEmpty = r.kar === 0 && r.nakit === 0 && r.gider === 0 && r.dagitim === 0 && r.devreden === 0;
                return (
                  <tr key={r.name} className={`hover:bg-gray-50 transition ${isEmpty ? "opacity-35" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-700">{r.name}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmt(r.devreden)}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{fmt(r.kar)}</td>
                    <td className="px-4 py-3 text-right text-green-700">{fmt(r.nakit)}</td>
                    <td className="px-4 py-3 text-right text-indigo-600">{fmt(r.havale)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{fmt(r.gider)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{fmt(r.dagitim)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${r.net < 0 ? "text-red-600" : isEmpty ? "text-gray-300" : "text-gray-900"}`}>
                      {isEmpty ? "—" : `₺${r.net.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td className="px-4 py-3 font-bold text-gray-700">Yıl Toplamı</td>
                <td className="px-4 py-3 text-right text-gray-400 text-xs italic">—</td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">
                  ₺{totals.kar.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right font-bold text-green-700">
                  ₺{totals.nakit.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right font-bold text-indigo-600">
                  ₺{totals.havale.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-600">
                  ₺{totals.gider.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right font-bold text-orange-600">
                  ₺{totals.dagitim.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  ₺{(totals.kar + totals.nakit - totals.gider - totals.dagitim).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
