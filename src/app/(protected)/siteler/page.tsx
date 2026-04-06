import { createClient } from "@/lib/supabase/server";
import SiteList from "@/components/sites/SiteList";

export default async function SitesPage() {
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("name");

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .single();

  const isAdmin = roleData?.role === "admin";

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
