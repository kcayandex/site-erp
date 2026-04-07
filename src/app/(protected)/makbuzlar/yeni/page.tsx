import { createClient } from "@/lib/supabase/server";
import ReceiptForm from "@/components/receipts/ReceiptForm";

export default async function NewReceiptPage() {
  const supabase = await createClient();

  const [{ data: sites }, { data: contractors }] = await Promise.all([
    supabase.from("sites").select("id, name, abbreviation, address").eq("is_active", true).order("name"),
    supabase.from("contractors").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Yeni Makbuz</h2>
        <p className="text-gray-500 text-sm mt-1">Masraf ve Hizmet Makbuzu oluştur</p>
      </div>
      <ReceiptForm sites={sites ?? []} contractors={contractors ?? []} />
    </div>
  );
}
