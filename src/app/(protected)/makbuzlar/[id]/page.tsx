import { createClient } from "@/lib/supabase/server";
import ReceiptForm from "@/components/receipts/ReceiptForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";

export default async function EditReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const [{ data: receipt }, { data: sites }] = await Promise.all([
    supabase
      .from("receipts")
      .select("*, site:sites(id, name, abbreviation, address)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("sites")
      .select("id, name, abbreviation, address")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!receipt) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Makbuz: {receipt.receipt_no}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Düzenle</p>
        </div>
        <Link
          href={`/makbuzlar/${params.id}/yazdir`}
          target="_blank"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Printer size={16} />
          Yazdır / PDF
        </Link>
      </div>
      <ReceiptForm sites={sites ?? []} existingReceipt={receipt} />
    </div>
  );
}
