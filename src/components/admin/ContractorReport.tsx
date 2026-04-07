"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ContractorRow {
  contractor_id: string
  contractor_name: string
  receipt_count: number
  total_islenen: number
  total_odenen: number
  profit: number
}

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
}

export default function ContractorReport({ rows }: { rows: ContractorRow[] }) {
  const totals = rows.reduce(
    (acc, r) => ({
      islenen: acc.islenen + r.total_islenen,
      odenen: acc.odenen + r.total_odenen,
      profit: acc.profit + r.profit,
    }),
    { islenen: 0, odenen: 0, profit: 0 }
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Toplam İşlenen</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">₺{fmt(totals.islenen)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Contractorlara Ödenen</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">₺{fmt(totals.odenen)}</p>
        </div>
        <div className={`rounded-xl p-5 border ${totals.profit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${totals.profit >= 0 ? "text-green-500" : "text-red-500"}`}>Toplam Kârım</p>
          <p className={`text-2xl font-bold mt-1 ${totals.profit >= 0 ? "text-green-700" : "text-red-700"}`}>₺{fmt(totals.profit)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rows.length > 0 ? (
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
              {rows.map(row => {
                const margin = row.total_islenen > 0
                  ? ((row.profit / row.total_islenen) * 100).toFixed(1)
                  : "0.0"
                return (
                  <tr key={row.contractor_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{row.contractor_name}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{row.receipt_count}</td>
                    <td className="px-6 py-4 text-right text-blue-700 font-medium">₺{fmt(row.total_islenen)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">₺{fmt(row.total_odenen)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${row.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                      ₺{fmt(row.profit)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.profit > 0 ? <TrendingUp size={14} className="text-green-600" /> :
                         row.profit < 0 ? <TrendingDown size={14} className="text-red-500" /> :
                         <Minus size={14} className="text-gray-400" />}
                        <span className={`text-xs font-semibold ${row.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                          %{margin}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p>Henüz contractor bazında makbuz yok.</p>
          </div>
        )}
      </div>
    </div>
  )
}
