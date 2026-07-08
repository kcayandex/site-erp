import { createClient } from "@/lib/supabase/server";
import ExpenseList from "@/components/giderler/ExpenseList";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

function getDateRange(preset: string, month?: string): { startDate?: string; endDate?: string } {
  const now = new Date();

  if (month) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return {
      startDate: format(startOfMonth(d), "yyyy-MM-dd"),
      endDate: format(endOfMonth(d), "yyyy-MM-dd"),
    };
  }

  switch (preset) {
    case "thismonth":
      return {
        startDate: format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "last3months":
      return {
        startDate: format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    default: // "all"
      return {};
  }
}

export default async function GiderlerPage({
  searchParams,
}: {
  searchParams: { preset?: string; month?: string };
}) {
  const supabase = await createClient();
  const activePreset = searchParams.month ? "month" : (searchParams.preset ?? "all");
  const { startDate, endDate } = getDateRange(activePreset, searchParams.month);

  let query = supabase
    .from("company_expenses")
    .select("*")
    .order("expense_date", { ascending: false });

  if (startDate) query = query.gte("expense_date", startDate);
  if (endDate) query = query.lte("expense_date", endDate);

  const [{ data: expenses }, { data: partners }] = await Promise.all([
    query,
    supabase
      .from("partners")
      .select("*")
      .eq("is_active", true)
      .order("created_at"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Şirket Giderleri</h2>
        <p className="text-gray-500 text-sm mt-1">KTurkey şirket giderleri</p>
      </div>
      <ExpenseList
        initialExpenses={expenses ?? []}
        partners={partners ?? []}
        activePreset={activePreset}
        activeMonth={searchParams.month}
      />
    </div>
  );
}
