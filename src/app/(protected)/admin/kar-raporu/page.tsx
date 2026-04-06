import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfitReport from "@/components/admin/ProfitReport";

export default async function ProfitReportPage() {
  const supabase = await createClient();

  // Admin check
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .single();

  if (roleData?.role !== "admin") redirect("/dashboard");

  const { data: receipts } = await supabase
    .from("receipts")
    .select("site_id, total_islenen, total_odenen, site:sites(name)");

  // Aggregate by site
  const siteMap: Record<
    string,
    { site_name: string; total_islenen: number; total_odenen: number; receipt_count: number }
  > = {};

  (receipts ?? []).forEach((r) => {
    if (!siteMap[r.site_id]) {
      const site = Array.isArray(r.site) ? r.site[0] : r.site
      siteMap[r.site_id] = {
        site_name: (site as { name: string } | null)?.name ?? r.site_id,
        total_islenen: 0,
        total_odenen: 0,
        receipt_count: 0,
      };
    }
    siteMap[r.site_id].total_islenen += Number(r.total_islenen ?? 0);
    siteMap[r.site_id].total_odenen += Number(r.total_odenen ?? 0);
    siteMap[r.site_id].receipt_count += 1;
  });

  const rows = Object.entries(siteMap).map(([site_id, data]) => ({
    site_id,
    ...data,
    profit: data.total_islenen - data.total_odenen,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Kar Raporu</h2>
        <p className="text-gray-500 text-sm mt-1">Site bazında işlenen / ödenen / kar</p>
      </div>
      <ProfitReport rows={rows} />
    </div>
  );
}
