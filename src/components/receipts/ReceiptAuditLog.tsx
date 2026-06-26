import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { History } from "lucide-react";

const ACTION_LABEL: Record<string, { label: string; cls: string }> = {
  insert: { label: "Eklendi", cls: "bg-green-100 text-green-700" },
  update: { label: "Güncellendi", cls: "bg-blue-100 text-blue-700" },
  delete: { label: "Silindi", cls: "bg-red-100 text-red-700" },
};

export default async function ReceiptAuditLog() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("receipt_audit_logs")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(200);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <History size={16} className="text-gray-400" />
        <h3 className="font-semibold text-gray-700">İşlem Geçmişi</h3>
        <span className="ml-auto text-xs text-gray-400">{logs.length} kayıt</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-600 whitespace-nowrap">Tarih / Saat</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">İşlem</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Makbuz No</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Tutar</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Kullanıcı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => {
              const meta = ACTION_LABEL[log.action] ?? { label: log.action, cls: "bg-gray-100 text-gray-700" };
              // summary = "Islenen: 12345"
              const amount = log.summary?.replace("Islenen: ", "") ?? "";
              return (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                    {format(new Date(log.changed_at), "dd MMM yyyy, HH:mm", { locale: tr })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono font-semibold text-blue-700">
                    {log.receipt_no ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {amount ? `₺${Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {log.changed_by_email ?? <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
