import { createClient } from "@/lib/supabase/server";
import SiteList from "@/components/sites/SiteList";

export default async function SitesPage() {
  const supabase = await createClient();

  const [{ data: sites }, { data: roleData }] = await Promise.all([
    supabase.from("sites").select("*").order("name"),
    supabase.rpc("get_my_role"),
  ]);

  const isAdmin = roleData === "admin" || roleData === "superadmin";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Siteler</h2>
        <p className="text-gray-500 text-sm mt-1">
          {sites?.filter((s) => s.is_active).length ?? 0} aktif site
        </p>
      </div>
      <SiteList sites={sites ?? []} isAdmin={isAdmin} />
    </div>
  );
}
