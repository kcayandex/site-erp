"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, Building2, HardHat } from "lucide-react"

interface SiteRow {
  site_id: string
  site_name: string
  receipt_count: number
  total_islenen: number
  total_odenen: number
  profit: number
}

interface ContractorRow {
  contractor_id: string
  contractor_name: string
  receipt_count: number
  total_islenen: number
  total_odenen: number
  profit: number
}

interface Props {
  siteRows: SiteRow[]
  contractorRows: ContractorRow[]
  periodLabel: string
}

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
}

function TrendIcon({ profit }: { profit: number }) {
  return profit > 0
    ? <TrendingUp size={14} className="text-green-600" />
    : profit < 0
    ? <TrendingDown size={14} className="text-red-500" />
    : <Minus size={14} className="text-gray-400" />
}

export default function UnifiedReport({ siteRows, contractorRows, periodLabel }: Props) {
  const [tab, setTab] = useState<"site" | "contractor">("site")

  const siteTotals = siteRows.reduce((a, r) => ({
    islenen: a.islenen + r.total_islenen,
    odenen: a.odenen + r.total_odenen,
    profit: a.profit + r.profit,
  }), { islenen: 0, odenen: 0, profit: 0 })

  const ctTotals = contractorRows.reduce((a, r) => ({
    islenen: a.islenen + r.total_islenen,
    odenen: a.odenen + r.total_odenen,
    profit: a.profit + r.profit,
  }), { islenen: 0, odenen: 0, profit: 0 })

  const activeTotals = tab === "site" ? siteTotals : ctTotals

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Toplam İşlenen</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">₺{fmt(activeTotals.islenen)}</p>
          <p className="text-xs text-blue-400 mt-1">{periodLabel}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Toplam Ödenen</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">₺{fmt(activeTotals.odenen)}</p>
        </div>
        <div className={`rounded-xl p-5 border ${activeTotals.profit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${activeTotals.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
            Net Kâr
          </p>
          <p className={`text-2xl font-bold mt-1 ${activeTotals.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
            ₺{fmt(activeTotals.profit)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab("site")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === "site"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Building2 size={15} />
            Site Bazında
          </button>
          <button
            onClick={() => setTab("contractor")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === "contractor"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <HardHat size={15} />
            Contractor Bazında
          </button>
        </div>

        {/* Site tab */}
        {tab === "site" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Site</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">Makbuz</th>
                <th className="text-right px-6 py-3 font-semibold text-blue-600">İşlenen (₺)</th>
                <th className="text-right px-6 py-3 font-semibold text-orange-600">Ödenen (₺)</th>
                <th className="text-right px-6 py-3 font-semibold text-green-700">Kâr (₺)</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">Marj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {siteRows.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Bu dönemde kayıt yok.</td></tr>
              ) : siteRows.map(row => {
                const margin = row.total_islenen > 0 ? ((row.profit / row.total_islenen) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={row.site_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{row.site_name}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{row.receipt_count}</td>
                    <td className="px-6 py-4 text-right text-blue-700 font-medium">₺{fmt(row.total_islenen)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">₺{fmt(row.total_odenen)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${row.profit >= 0 ? "text-green-700" : "text-red-700"}`}>₺{fmt(row.profit)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon profit={row.profit} />
                        <span className={`text-xs font-semibold ${row.profit >= 0 ? "text-green-600" : "text-red-500"}`}>%{margin}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Contractor tab */}
        {tab === "contractor" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Contractor</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">Makbuz</th>
                <th className="text-right px-6 py-3 font-semibold text-blue-600">İşlenen (₺)</th>
                <th className="text-right px-6 py-3 font-semibold text-orange-600">Contractor'a Ödenen (₺)</th>
                <th className="text-right px-6 py-3 font-semibold text-green-700">Benim Kârım (₺)</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">Marj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contractorRows.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Bu dönemde contractor kaydı yok.</td></tr>
              ) : contractorRows.map(row => {
                const margin = row.total_islenen > 0 ? ((row.profit / row.total_islenen) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={row.contractor_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{row.contractor_name}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{row.receipt_count}</td>
                    <td className="px-6 py-4 text-right text-blue-700 font-medium">₺{fmt(row.total_islenen)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">₺{fmt(row.total_odenen)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${row.profit >= 0 ? "text-green-700" : "text-red-700"}`}>₺{fmt(row.profit)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon profit={row.profit} />
                        <span className={`text-xs font-semibold ${row.profit >= 0 ? "text-green-600" : "text-red-500"}`}>%{margin}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
