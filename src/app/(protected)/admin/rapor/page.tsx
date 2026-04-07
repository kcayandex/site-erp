import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import ReportFilters from "@/components/admin/ReportFilters"
import UnifiedReport from "@/components/admin/UnifiedReport"
import ReportCharts from "@/components/admin/ReportCharts"

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getDateRange(
  period: string,
  from: string,
  to: string,
): { start: string; end: string; label: string } {
  const today = new Date()

  if (period === "custom" && from && to) {
    return { start: from, end: to, label: `${from} – ${to}` }
  }

  if (period === "quarter") {
    const start = new Date(today)
    start.setMonth(today.getMonth() - 2)
    start.setDate(1)
    return { start: fmtDate(start), end: fmtDate(today), label: "Son 3 Ay" }
  }

  if (period === "year") {
    return {
      start: `${today.getFullYear()}-01-01`,
      end: fmtDate(today),
      label: `${today.getFullYear()} Yılı`,
    }
  }

  // default: month
  const start = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`
  return {
    start,
    end: fmtDate(today),
    label: `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`,
  }
}

export default async function RaporPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string }
}) {
  const supabase = await createClient()

  // Admin check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user!.id)
    .single()

  if (roleData?.role !== "admin") redirect("/dashboard")

  const period = searchParams.period ?? "month"
  const { start, end, label } = getDateRange(
    period,
    searchParams.from ?? "",
    searchParams.to ?? "",
  )

  const { data: receipts } = await supabase
    .from("receipts")
    .select(
      "site_id, contractor_id, total_islenen, total_odenen, date, site:sites(name), contractor:contractors(name)",
    )
    .gte("date", start)
    .lte("date", end)

  // Aggregate by site
  const siteMap = new Map<
    string,
    {
      site_name: string
      receipt_count: number
      total_islenen: number
      total_odenen: number
      profit: number
    }
  >()

  for (const r of receipts ?? []) {
    const key = r.site_id as string
    const site = Array.isArray(r.site) ? r.site[0] : r.site
    const siteName = (site as { name: string } | null)?.name ?? key
    const existing = siteMap.get(key) ?? {
      site_name: siteName,
      receipt_count: 0,
      total_islenen: 0,
      total_odenen: 0,
      profit: 0,
    }
    const islened = Number(r.total_islenen ?? 0)
    const odened = Number(r.total_odenen ?? 0)
    siteMap.set(key, {
      site_name: siteName,
      receipt_count: existing.receipt_count + 1,
      total_islenen: existing.total_islenen + islened,
      total_odenen: existing.total_odenen + odened,
      profit: existing.profit + (islened - odened),
    })
  }

  // Aggregate by contractor
  const ctMap = new Map<
    string,
    {
      contractor_name: string
      receipt_count: number
      total_islenen: number
      total_odenen: number
      profit: number
    }
  >()

  for (const r of receipts ?? []) {
    if (!r.contractor_id) continue
    const key = r.contractor_id as string
    const ct = Array.isArray(r.contractor) ? r.contractor[0] : r.contractor
    const ctName = (ct as { name: string } | null)?.name ?? key
    const existing = ctMap.get(key) ?? {
      contractor_name: ctName,
      receipt_count: 0,
      total_islenen: 0,
      total_odenen: 0,
      profit: 0,
    }
    const islened = Number(r.total_islenen ?? 0)
    const odened = Number(r.total_odenen ?? 0)
    ctMap.set(key, {
      contractor_name: ctName,
      receipt_count: existing.receipt_count + 1,
      total_islenen: existing.total_islenen + islened,
      total_odenen: existing.total_odenen + odened,
      profit: existing.profit + (islened - odened),
    })
  }

  const siteRows = Array.from(siteMap.entries())
    .map(([site_id, v]) => ({ site_id, ...v }))
    .sort((a, b) => b.total_islenen - a.total_islenen)

  const contractorRows = Array.from(ctMap.entries())
    .map(([contractor_id, v]) => ({ contractor_id, ...v }))
    .sort((a, b) => b.total_islenen - a.total_islenen)

  // Aggregate by month for trend chart
  const SHORT_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
  const monthMap = new Map<string, { label: string; islenen: number; odenen: number }>()
  for (const r of receipts ?? []) {
    const ym = (r.date as string).slice(0, 7) // "2026-04"
    const [yr, mo] = ym.split("-")
    const label = `${SHORT_MONTHS[Number(mo) - 1]} ${yr.slice(2)}`
    const ex = monthMap.get(ym) ?? { label, islenen: 0, odenen: 0 }
    monthMap.set(ym, {
      label,
      islenen: ex.islenen + Number(r.total_islenen ?? 0),
      odenen: ex.odenen + Number(r.total_odenen ?? 0),
    })
  }

  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      month: v.label,
      islenen: v.islenen,
      odenen: v.odenen,
      kar: v.islenen - v.odenen,
    }))

  const totalIslenen = siteRows.reduce((s, r) => s + r.total_islenen, 0)
  const totalOdenen = siteRows.reduce((s, r) => s + r.total_odenen, 0)

  const chartSites = siteRows.map((r) => ({
    site_name: r.site_name,
    islenen: r.total_islenen,
    kar: r.profit,
    margin: r.total_islenen > 0 ? (r.profit / r.total_islenen) * 100 : 0,
  }))

  const chartContractors = contractorRows
    .filter((r) => r.total_odenen > 0)
    .map((r) => ({
      contractor_name: r.contractor_name,
      odenen: r.total_odenen,
      kar: r.profit,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Rapor</h2>
        <p className="text-gray-500 text-sm mt-1">
          Site ve Contractor bazında kâr analizi
        </p>
      </div>
      <Suspense>
        <ReportFilters />
      </Suspense>
      <ReportCharts
        monthly={monthlyData}
        sites={chartSites}
        contractors={chartContractors}
        totalIslenen={totalIslenen}
        totalOdenen={totalOdenen}
      />
      <UnifiedReport
        siteRows={siteRows}
        contractorRows={contractorRows}
        periodLabel={label}
      />
    </div>
  )
}
