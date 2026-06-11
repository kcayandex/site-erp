import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ContractorReport from "@/components/admin/ContractorReport"

export default async function ContractorReportPage() {
  const supabase = await createClient()

  const { data: role } = await supabase.rpc("get_my_role")
  if (role !== "admin" && role !== "superadmin") redirect("/dashboard")

  const { data: receipts } = await supabase
    .from("receipts")
    .select("contractor_id, total_islenen, total_odenen, contractor:contractors(name)")
    .not("contractor_id", "is", null)

  const map: Record<string, {
    contractor_name: string
    receipt_count: number
    total_islenen: number
    total_odenen: number
  }> = {}

  ;(receipts ?? []).forEach(r => {
    if (!r.contractor_id) return
    const name = Array.isArray(r.contractor) ? r.contractor[0]?.name : (r.contractor as any)?.name ?? r.contractor_id
    if (!map[r.contractor_id]) {
      map[r.contractor_id] = { contractor_name: name, receipt_count: 0, total_islenen: 0, total_odenen: 0 }
    }
    map[r.contractor_id].receipt_count += 1
    map[r.contractor_id].total_islenen += Number(r.total_islenen ?? 0)
    map[r.contractor_id].total_odenen += Number(r.total_odenen ?? 0)
  })

  const rows = Object.entries(map).map(([contractor_id, data]) => ({
    contractor_id,
    ...data,
    profit: data.total_islenen - data.total_odenen,
  })).sort((a, b) => b.total_islenen - a.total_islenen)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Contractor Raporu</h2>
        <p className="text-gray-500 text-sm mt-1">Contractor bazında ödenen / işlenen / kâr</p>
      </div>
      <ContractorReport rows={rows} />
    </div>
  )
}
