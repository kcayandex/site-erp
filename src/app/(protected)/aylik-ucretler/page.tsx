import { createClient } from "@/lib/supabase/server";
import MonthlyFeeList from "@/components/aylik-ucretler/MonthlyFeeList";

export default async function AylikUcretlerPage() {
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Aylık Ücretler</h2>
        <p className="text-gray-500 text-sm mt-1">
          Sitelerin aylık yönetim ücreti takibi
        </p>
      </div>
      <MonthlyFeeList sites={sites ?? []} />
    </div>
  );
}
