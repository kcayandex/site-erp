"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, Building2, HardHat, ChevronUp, ChevronDown, ChevronsUpDown, X, ExternalLink } from "lucide-react"
import Link from "next/link"

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

interface DetailReceipt {
  id: string
  receipt_no: string
  date: string
  category: string | null
  site_id: string
  site_name: string
  contractor_id: string | null
  contractor_name: string | null
  total_islenen: number
  total_odenen: number
}

interface Props {
  siteRows: SiteRow[]
  contractorRows: ContractorRow[]
  periodLabel: string
  receipts: DetailReceipt[]
}

type SortField = "total_islenen" | "total_odenen" | "profit" | "margin"
type SortDir = "asc" | "desc"

interface Selected {
  id: string
  name: string
  type: "site" | "contractor"
}

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
}

function margin(row: { total_islenen: number; profit: number }) {
  return row.total_islenen > 0 ? (row.profit / row.total_islenen) * 100 : 0
}

function TrendIcon({ profit }: { profit: number }) {
  return profit > 0
    ? <TrendingUp size={14} className="text-green-600" />
    : profit < 0
    ? <TrendingDown size={14} className="text-red-500" />
    : <Minus size={14} className="text-gray-400" />
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={13} className="text-gray-400" />
  return dir === "asc"
    ? <ChevronUp size={13} className="text-blue-600" />
    : <ChevronDown size={13} className="text-blue-600" />
}

function SortTh({
  label, field, active, dir, align = "right", color = "text-gray-600", onClick,
}: {
  label: string; field: SortField; active: boolean; dir: SortDir
  align?: "left" | "center" | "right"; color?: string; onClick: (f: SortField) => void
}) {
  return (
    <th
      className={`px-6 py-3 font-semibold ${color} text-${align} cursor-pointer select-none hover:bg-gray-100 transition`}
      onClick={() => onClick(field)}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end w-full" : align === "center" ? "justify-center w-full" : ""}`}>
        {label}
        <SortIcon field={field} active={active} dir={dir} />
      </span>
    </th>
  )
}

function sortRows<T extends { total_islenen: number; total_odenen: number; profit: number }>(
  rows: T[], field: SortField, dir: SortDir
): T[] {
  return [...rows].sort((a, b) => {
    const av = field === "margin" ? margin(a) : a[field]
    const bv = field === "margin" ? margin(b) : b[field]
    return dir === "asc" ? av - bv : bv - av
  })
}

function DetailPanel({
  selected,
  receipts,
  onClose,
}: {
  selected: Selected
  receipts: DetailReceipt[]
  onClose: () => void
}) {
  const filtered = receipts.filter((r) =>
    selected.type === "site"
      ? r.site_id === selected.id
      : r.contractor_id === selected.id,
  ).sort((a, b) => b.date.localeCompare(a.date))

  const totalIslenen = filtered.reduce((s, r) => s + r.total_islenen, 0)
  const totalOdenen = filtered.reduce((s, r) => s + r.total_odenen, 0)
  const totalProfit = totalIslenen - totalOdenen

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {selected.type === "site"
              ? <Building2 size={18} className="text-blue-600" />
              : <HardHat size={18} className="text-blue-600" />}
            <h3 className="text-base font-bold text-gray-800">{selected.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div>
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">İşlenen</p>
            <p className="text-lg font-bold text-blue-700">₺{fmt(totalIslenen)}</p>
          </div>
          <div>
            <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide">Ödenen</p>
            <p className="text-lg font-bold text-orange-700">₺{fmt(totalOdenen)}</p>
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>Net Kâr</p>
            <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-green-700" : "text-red-700"}`}>₺{fmt(totalProfit)}</p>
          </div>
        </div>

        {/* Receipt list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Makbuz bulunamadı.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tarih</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Makbuz No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategori</th>
                  <th className="text-right px-4 py-3 font-semibold text-blue-600">İşlenen</th>
                  <th className="text-right px-4 py-3 font-semibold text-orange-600">Ödenen</th>
                  <th className="text-right px-4 py-3 font-semibold text-green-700">Kâr</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const profit = r.total_islenen - r.total_odenen
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{r.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.receipt_no}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.category ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-blue-700 font-medium">₺{fmt(r.total_islenen)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">₺{fmt(r.total_odenen)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${profit >= 0 ? "text-green-700" : "text-red-600"}`}>₺{fmt(profit)}</td>
                      <td className="px-2 py-3">
                        <Link
                          href={`/makbuzlar/${r.id}`}
                          className="text-gray-400 hover:text-blue-600 transition"
                          title="Makbuzu aç"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

export default function UnifiedReport({ siteRows, contractorRows, periodLabel, receipts }: Props) {
  const [tab, setTab] = useState<"site" | "contractor">("site")
  const [sortField, setSortField] = useState<SortField>("profit")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selected, setSelected] = useState<Selected | null>(null)

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => d === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

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

  const sortedSites = sortRows(siteRows, sortField, sortDir)
  const sortedContractors = sortRows(contractorRows, sortField, sortDir)

  const thProps = { active: true, dir: sortDir, onClick: handleSort }

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

      {/* Tabs + Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab("site")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === "site" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Building2 size={15} />
            Site Bazında
          </button>
          <button
            onClick={() => setTab("contractor")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === "contractor" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
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
                <SortTh label="İşlenen (₺)" field="total_islenen" {...thProps} active={sortField === "total_islenen"} color="text-blue-600" />
                <SortTh label="Ödenen (₺)" field="total_odenen" {...thProps} active={sortField === "total_odenen"} color="text-orange-600" />
                <SortTh label="Kâr (₺)" field="profit" {...thProps} active={sortField === "profit"} color="text-green-700" />
                <SortTh label="Marj" field="margin" {...thProps} active={sortField === "margin"} align="center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedSites.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Bu dönemde kayıt yok.</td></tr>
              ) : sortedSites.map(row => {
                const m = margin(row)
                const isActive = selected?.id === row.site_id
                return (
                  <tr
                    key={row.site_id}
                    className={`cursor-pointer transition ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    onClick={() => setSelected(isActive ? null : { id: row.site_id, name: row.site_name, type: "site" })}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800">{row.site_name}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{row.receipt_count}</td>
                    <td className="px-6 py-4 text-right text-blue-700 font-medium">₺{fmt(row.total_islenen)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">₺{fmt(row.total_odenen)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${row.profit >= 0 ? "text-green-700" : "text-red-700"}`}>₺{fmt(row.profit)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon profit={row.profit} />
                        <span className={`text-xs font-semibold ${row.profit >= 0 ? "text-green-600" : "text-red-500"}`}>%{m.toFixed(1)}</span>
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
                <SortTh label="İşlenen (₺)" field="total_islenen" {...thProps} active={sortField === "total_islenen"} color="text-blue-600" />
                <SortTh label="Contractor'a Ödenen (₺)" field="total_odenen" {...thProps} active={sortField === "total_odenen"} color="text-orange-600" />
                <SortTh label="Benim Kârım (₺)" field="profit" {...thProps} active={sortField === "profit"} color="text-green-700" />
                <SortTh label="Marj" field="margin" {...thProps} active={sortField === "margin"} align="center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedContractors.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Bu dönemde contractor kaydı yok.</td></tr>
              ) : sortedContractors.map(row => {
                const m = margin(row)
                const isActive = selected?.id === row.contractor_id
                return (
                  <tr
                    key={row.contractor_id}
                    className={`cursor-pointer transition ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    onClick={() => setSelected(isActive ? null : { id: row.contractor_id, name: row.contractor_name, type: "contractor" })}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800">{row.contractor_name}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{row.receipt_count}</td>
                    <td className="px-6 py-4 text-right text-blue-700 font-medium">₺{fmt(row.total_islenen)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">₺{fmt(row.total_odenen)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${row.profit >= 0 ? "text-green-700" : "text-red-700"}`}>₺{fmt(row.profit)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon profit={row.profit} />
                        <span className={`text-xs font-semibold ${row.profit >= 0 ? "text-green-600" : "text-red-500"}`}>%{m.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail slide-over */}
      {selected && (
        <DetailPanel
          selected={selected}
          receipts={receipts}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
