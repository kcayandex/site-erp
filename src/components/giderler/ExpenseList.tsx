"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { CompanyExpense, Partner } from "@/types";
import { Plus, Trash2, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { tr } from "date-fns/locale";

const PRESETS = [
  { key: "thismonth", label: "Bu Ay" },
  { key: "lastmonth", label: "Geçen Ay" },
  { key: "last3months", label: "Son 3 Ay" },
  { key: "last6months", label: "Son 6 Ay" },
] as const;

const CATEGORIES = ["Ofis", "Ulaşım", "Yazılım", "Yemek", "Kira", "Diğer"];

function getPaidByLabel(paidBy: string, partners: Partner[]): string {
  if (paidBy === "kasa") return "Kasa";
  const partner = partners.find((p) => p.id === paidBy);
  return partner?.name ?? "Bilinmeyen";
}

interface ExpenseForm {
  amount: string;
  description: string;
  category: string;
  expense_date: string;
  paid_by: string;
  notes: string;
}

function emptyForm(): ExpenseForm {
  return {
    amount: "",
    description: "",
    category: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
    paid_by: "kasa",
    notes: "",
  };
}

export default function ExpenseList({
  initialExpenses,
  partners,
  activePreset,
  activeMonth,
}: {
  initialExpenses: CompanyExpense[];
  partners: Partner[];
  activePreset: string;
  activeMonth?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialPay, setPartialPay] = useState<{ id: string; input: string } | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const isMultiMonth = activePreset === "last3months" || activePreset === "last6months";

  function getNavMonth(): Date {
    if (activeMonth) {
      const [y, m] = activeMonth.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    if (activePreset === "lastmonth") return subMonths(new Date(), 1);
    return startOfMonth(new Date());
  }

  const navMonth = getNavMonth();

  function goToMonth(date: Date) {
    router.push(`?month=${format(date, "yyyy-MM")}`);
  }

  function goToPreset(preset: string) {
    router.push(`?preset=${preset}`);
  }

  function getPeriodLabel() {
    if (activePreset === "last3months") return "Son 3 Ay Toplam Gider";
    if (activePreset === "last6months") return "Son 6 Ay Toplam Gider";
    return `${format(navMonth, "MMMM yyyy", { locale: tr })} Toplam Gider`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("company_expenses").insert({
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category || null,
      expense_date: form.expense_date,
      paid_by: form.paid_by,
      notes: form.notes || null,
    });

    setSaving(false);
    if (insertError) { setError("Gider eklenemedi: " + insertError.message); return; }
    setForm(emptyForm());
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu gideri silmek istediğinize emin misiniz?")) return;
    await supabase.from("company_expenses").delete().eq("id", id);
    router.refresh();
  }

  async function toggleReimbursed(expense: CompanyExpense) {
    await supabase
      .from("company_expenses")
      .update({
        reimbursed: !expense.reimbursed,
        reimbursed_at: !expense.reimbursed ? format(new Date(), "yyyy-MM-dd") : null,
      })
      .eq("id", expense.id);
    router.refresh();
  }

  async function handlePartialPay(expense: CompanyExpense) {
    if (!partialPay) return;
    const addAmount = parseFloat(partialPay.input);
    if (isNaN(addAmount) || addAmount <= 0) { alert("Geçerli bir tutar girin"); return; }
    const newReimbursed = Number(expense.reimbursed_amount) + addAmount;
    const fullyPaid = newReimbursed >= Number(expense.amount);
    await supabase.from("company_expenses").update({
      reimbursed_amount: newReimbursed,
      reimbursed: fullyPaid,
      reimbursed_at: fullyPaid ? new Date().toISOString() : null,
    }).eq("id", expense.id);
    setPartialPay(null);
    router.refresh();
  }

  const total = initialExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      {/* Filtre çubuğu */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => goToPreset(p.key)}
              className={`text-sm font-medium px-4 py-1.5 rounded-full border transition ${
                activePreset === p.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {!isMultiMonth && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => goToMonth(subMonths(navMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-700 capitalize w-36 text-center">
              {format(navMonth, "MMMM yyyy", { locale: tr })}
            </span>
            <button
              onClick={() => goToMonth(addMonths(navMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-3">
          <p className="text-xs text-gray-500">{getPeriodLabel()}</p>
          <p className="text-xl font-bold text-red-600 mt-0.5">
            ₺{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm()); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} /> Gider Ekle
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Yeni Gider</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ofis kirası"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (₺) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  required min="0" step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Seçiniz —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm((p) => ({ ...p, expense_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kim Ödedi <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.paid_by}
                  onChange={(e) => setForm((p) => ({ ...p, paid_by: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="kasa">Kasa</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opsiyonel"
                />
              </div>
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50">
                {saving ? "Kaydediliyor..." : "Ekle"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition">
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {initialExpenses.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Tarih</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Açıklama</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Kategori</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600">Tutar</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Ödeyen</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">İade</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialExpenses.map((expense) => {
                const isPartner = expense.paid_by !== "kasa";
                return (
                  <tr key={expense.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(expense.expense_date), "dd MMM yyyy", { locale: tr })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{expense.description}</td>
                    <td className="px-6 py-4 text-gray-500">{expense.category ?? "—"}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      ₺{Number(expense.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isPartner ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {getPaidByLabel(expense.paid_by, partners)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isPartner ? (
                        <div className="space-y-1.5">
                          {expense.reimbursed ? (
                            <button
                              onClick={() => toggleReimbursed(expense)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700"
                            >
                              <CheckCircle2 size={11} /> İade Edildi
                            </button>
                          ) : (
                            <>
                              <div className="text-xs text-orange-600 font-medium">
                                {Number(expense.reimbursed_amount) > 0
                                  ? `Kalan: ₺${(Number(expense.amount) - Number(expense.reimbursed_amount)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                                  : "İade Bekliyor"}
                              </div>
                              {partialPay?.id === expense.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                    value={partialPay.input}
                                    onChange={(e) => setPartialPay({ id: expense.id, input: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && handlePartialPay(expense)}
                                    placeholder="Tutar"
                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() => handlePartialPay(expense)}
                                    className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-800 transition"
                                  >
                                    Öde
                                  </button>
                                  <button
                                    onClick={() => setPartialPay(null)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setPartialPay({ id: expense.id, input: "" })}
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
                                >
                                  <RotateCcw size={10} /> Kasadan Öde
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(expense.id)}
                        className="text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-14 text-gray-400">
            <p>Bu dönem için henüz gider eklenmemiş.</p>
          </div>
        )}
      </div>
    </div>
  );
}
