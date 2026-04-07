import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FileText, Printer } from "lucide-react";
import ReceiptActions from "@/components/receipts/ReceiptActions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function ReceiptsPage() {
  const supabase = await createClient();

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*, site:sites(name, abbreviation)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Makbuzlar</h2>
          <p className="text-gray-500 text-sm mt-1">
            {receipts?.length ?? 0} makbuz
          </p>
        </div>
        <Link
          href="/makbuzlar/yeni"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Yeni Makbuz
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {receipts && receipts.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Makbuz No</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Site</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Tarih</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Kategori</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600">Toplam (İşlenen)</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-blue-700">
                    {receipt.receipt_no}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {(receipt.site as { name: string })?.name ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {format(new Date(receipt.date), "dd MMM yyyy", { locale: tr })}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {receipt.category ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    ₺{Number(receipt.total_islenen).toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/makbuzlar/${receipt.id}`}
                        className="text-gray-400 hover:text-blue-600 transition"
                        title="Düzenle"
                      >
                        <FileText size={16} />
                      </Link>
                      <Link
                        href={`/makbuzlar/${receipt.id}/yazdir`}
                        target="_blank"
                        className="text-gray-400 hover:text-green-600 transition"
                        title="Yazdır"
                      >
                        <Printer size={16} />
                      </Link>
                      <ReceiptActions receiptId={receipt.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p>Henüz makbuz oluşturulmamış.</p>
            <Link
              href="/makbuzlar/yeni"
              className="mt-3 inline-block text-blue-600 hover:underline text-sm"
            >
              İlk makbuzu oluştur
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
