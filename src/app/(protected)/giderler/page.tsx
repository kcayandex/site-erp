import { createClient } from "@/lib/supabase/server";
import ExpenseList from "@/components/giderler/ExpenseList";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

function getDateRange(preset: string, month?: string) {
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
    case "lastmonth": {
      const lm = subMonths(now, 1);
      return {
        startDate: format(startOfMonth(lm), "yyyy-MM-dd"),
        endDate: format(endOfMonth(lm), "yyyy-MM-dd"),
      };
    }
    case "last3months":
      return {
        startDate: format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "last6months":
      return {
        startDate: format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    default:
      return {
        startDate: format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      };
  }
}

export default async function GiderlerPage({
  searchParams,
}: {
  searchParams: { preset?: string; month?: string };
}) {
  const supabase = await createClient();
  const activePreset = searchParams.month ? "month" : (searchParams.preset ?? "thismonth");
  const { startDate, endDate } = getDateRange(activePreset, searchParams.month);

  const [{ data: expenses }, { data: partners }] = await Promise.all([
    supabase
      .from("company_expenses")
      .select("*")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .order("expense_date", { ascending: false }),
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
