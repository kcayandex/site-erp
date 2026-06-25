import { createClient } from "@/lib/supabase/server";
import ExpenseList from "@/components/giderler/ExpenseList";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function GiderlerPage() {
  const supabase = await createClient();

  const now = new Date();
  const startDate = format(startOfMonth(now), "yyyy-MM-dd");
  const endDate = format(endOfMonth(now), "yyyy-MM-dd");

  const { data: expenses } = await supabase
    .from("company_expenses")
    .select("*")
    .gte("expense_date", startDate)
    .lte("expense_date", endDate)
    .order("expense_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Şirket Giderleri</h2>
        <p className="text-gray-500 text-sm mt-1">
          KTurkey şirket giderleri — bu ay
        </p>
      </div>
      <ExpenseList initialExpenses={expenses ?? []} />
    </div>
  );
}
