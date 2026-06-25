import { createClient } from "@/lib/supabase/server";
import MonthlyFeeList from "@/components/aylik-ucretler/MonthlyFeeList";

export default async function AylikUcretlerPage() {
  const supabase = await createClient();

  const [{ data: sites }, { data: allPaidPayments }, { data: feePeriods }] = await Promise.all([
    supabase.from("sites").select("*").order("name"),
    supabase
      .from("monthly_payments")
      .select("site_id, amount")
      .not("paid_at", "is", null),
    supabase
      .from("site_fee_periods")
      .select("*")
      .order("effective_from"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Aylık Ücretler</h2>
        <p className="text-gray-500 text-sm mt-1">
          Aylık ödeme takibi ve sözleşme durumu
        </p>
      </div>
      <MonthlyFeeList
        sites={sites ?? []}
        allPaidPayments={allPaidPayments ?? []}
        feePeriods={feePeriods ?? []}
      />
    </div>
  );
}
