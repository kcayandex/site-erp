"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export interface MonthlyPoint {
  month: string   // "Oca 25"
  islenen: number
  odenen: number
  kar: number
}

export interface SiteBar {
  site_name: string
  islenen: number
  kar: number
}

export interface ContractorBar {
  contractor_name: string
  odenen: number
  kar: number
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

interface TooltipEntry {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-medium">{tl(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function ReportCharts({ monthly, sites, contractors, totalIslenen, totalOdenen }: Props) {
  const totalKar = totalIslenen - totalOdenen
  const margin = totalIslenen > 0 ? (totalKar / totalIslenen) * 100 : 0
  const marginColor = margin >= 20 ? "bg-green-500" : margin >= 10 ? "bg-yellow-400" : "bg-red-400"

  return (
    <div className="space-y-6">
      {/* Kâr Marjı Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-600">Toplam Kâr Marjı</span>
          <span className={`text-sm font-bold px-2 py-0.5 rounded-full text-white ${marginColor}`}>
            %{margin.toFixed(1)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${marginColor}`}
            style={{ width: `${Math.min(margin, 100)}%` }}
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

      {/* Site + Contractor Barlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Bar */}
        {sites.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Site Bazında İşlenen</h3>
            <ResponsiveContainer width="100%" height={Math.max(180, sites.length * 44)}>
              <BarChart
                data={sites}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
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
                <Bar dataKey="islenen" name="İşlenen" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="kar" name="Kâr" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Contractor Bar */}
        {contractors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Contractor Bazında Ödenen</h3>
            <ResponsiveContainer width="100%" height={Math.max(180, contractors.length * 44)}>
              <BarChart
                data={contractors}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
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
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="odenen" name="Ödenen" fill="#f97316" radius={[0, 4, 4, 0]} />
                <Bar dataKey="kar" name="Kâr" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
