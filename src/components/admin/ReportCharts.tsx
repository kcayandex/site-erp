"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export interface MonthlyPoint {
  month: string
  islenen: number
  odenen: number
  kar: number
}

export interface SiteBar {
  site_name: string
  islenen: number
  kar: number
  margin: number // precomputed %
}

export interface ContractorBar {
  contractor_name: string
  odenen: number  // what contractor earned from us
  kar: number     // what we earned from their jobs
}

interface Props {
  monthly: MonthlyPoint[]
  sites: SiteBar[]
  contractors: ContractorBar[]
  totalIslenen: number
  totalOdenen: number
}

function tl(n: number) {
  return "₺" + n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function marginColor(m: number) {
  if (m >= 20) return "#22c55e"   // green
  if (m >= 10) return "#f59e0b"   // amber
  return "#ef4444"                  // red
}

function marginBadgeClass(m: number) {
  if (m >= 20) return "bg-green-100 text-green-700"
  if (m >= 10) return "bg-amber-100 text-amber-700"
  return "bg-red-100 text-red-600"
}

interface TooltipEntry {
  name: string
  value: number
  color: string
  payload: Record<string, number>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const margin = payload[0]?.payload?.margin
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-700 mb-2 text-xs leading-tight">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-medium">{tl(p.value)}</span>
        </p>
      ))}
      {margin !== undefined && (
        <p className="flex justify-between gap-4 mt-1 pt-1 border-t border-gray-100 text-gray-500">
          <span>Marj</span>
          <span className="font-medium">%{(margin as number).toFixed(1)}</span>
        </p>
      )}
    </div>
  )
}

function ContractorTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const odenen = payload.find((p) => p.name === "Ona Ödedik")?.value ?? 0
  const kar = payload.find((p) => p.name === "Bizim Kârımız")?.value ?? 0
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm min-w-[200px]">
      <p className="font-semibold text-gray-700 mb-2 text-xs leading-tight">{label}</p>
      <p className="flex justify-between gap-4 text-orange-600">
        <span>Ona Ödedik</span>
        <span className="font-medium">{tl(odened)}</span>
      </p>
      <p className="flex justify-between gap-4 text-green-600">
        <span>Bizim Kârımız</span>
        <span className="font-medium">{tl(kar)}</span>
      </p>
      {odened > 0 && (
        <p className="flex justify-between gap-4 mt-1 pt-1 border-t border-gray-100 text-gray-500 text-xs">
          <span>Kâr / Ödeme oranı</span>
          <span className="font-medium">%{((kar / odened) * 100).toFixed(1)}</span>
        </p>
      )}
    </div>
  )
}

export default function ReportCharts({ monthly, sites, contractors, totalIslenen, totalOdenen }: Props) {
  const totalKar = totalIslenen - totalOdenen
  const totalMargin = totalIslenen > 0 ? (totalKar / totalIslenen) * 100 : 0
  const gaugeColor = marginBadgeClass(totalMargin)
  const gaugeBg = totalMargin >= 20 ? "bg-green-500" : totalMargin >= 10 ? "bg-amber-400" : "bg-red-400"

  // Sort sites by profit desc
  const sortedSites = [...sites].sort((a, b) => b.kar - a.kar)
  // Sort contractors by ödenen desc
  const sortedContractors = [...contractors].sort((a, b) => b.odenen - a.odenen)

  return (
    <div className="space-y-6">

      {/* Kâr Marjı Gauge */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-600">Toplam Kâr Marjı</span>
          <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${gaugeColor}`}>
            %{totalMargin.toFixed(1)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${gaugeBg}`}
            style={{ width: `${Math.min(totalMargin, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>%0</span>
          <span>{tl(totalIslenen)} işlendi → {tl(totalKar)} kâr</span>
          <span>%100</span>
        </div>
      </div>

      {/* Aylık Trend */}
      {monthly.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Aylık Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => "₺" + (v / 1000).toFixed(0) + "k"} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="islenen" name="İşlenen" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="odenen" name="Ödenen" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="kar" name="Kâr" stroke="#22c55e" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Site + Contractor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Site Kâr Grafiği */}
        {sortedSites.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-600">Site Bazında Kâr</h3>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />≥%20</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />%10–20</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{"<"}%10</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">Kâr miktarı · renk = marj oranı</p>
            <ResponsiveContainer width="100%" height={Math.max(180, sortedSites.length * 48)}>
              <BarChart
                data={sortedSites}
                layout="vertical"
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => "₺" + (v / 1000).toFixed(0) + "k"} />
                <YAxis
                  type="category"
                  dataKey="site_name"
                  tick={{ fontSize: 11 }}
                  width={130}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 17) + "…" : v}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="kar" name="Kâr" radius={[0, 4, 4, 0]}>
                  {sortedSites.map((s, i) => (
                    <Cell key={i} fill={marginColor(s.margin)} />
                  ))}
                  <LabelList
                    dataKey="margin"
                    position="right"
                    formatter={(v: number) => `%${v.toFixed(1)}`}
                    style={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Contractor Grafiği */}
        {sortedContractors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Contractor — Ödeme vs Kâr</h3>
            <p className="text-xs text-gray-400 mb-4">🟠 Ona ödedik · 🟢 Biz kazandık</p>
            <ResponsiveContainer width="100%" height={Math.max(180, sortedContractors.length * 56)}>
              <BarChart
                data={sortedContractors}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => "₺" + (v / 1000).toFixed(0) + "k"} />
                <YAxis
                  type="category"
                  dataKey="contractor_name"
                  tick={{ fontSize: 11 }}
                  width={130}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 17) + "…" : v}
                />
                <Tooltip content={<ContractorTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="odenen" name="Ona Ödedik" fill="#f97316" radius={[0, 4, 4, 0]} />
                <Bar dataKey="kar" name="Bizim Kârımız" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
