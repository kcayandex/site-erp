import { createClient } from "@/lib/supabase/server";
import PartnerList from "@/components/ortaklar/PartnerList";

export default async function OrtaklarPage() {
  const supabase = await createClient();

  const { data: partners } = await supabase
    .from("partners")
    .select("*")
    .order("created_at");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Ortaklar</h2>
        <p className="text-gray-500 text-sm mt-1">
          Kar dağılımı ve ortak yönetimi
        </p>
      </div>
      <PartnerList initialPartners={partners ?? []} />
    </div>
  );
}
