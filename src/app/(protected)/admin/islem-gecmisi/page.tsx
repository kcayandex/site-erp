import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReceiptAuditLog from "@/components/receipts/ReceiptAuditLog";

export default async function IslemGecmisiPage() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("get_my_role");

  if (role !== "superadmin") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">İşlem Geçmişi</h2>
        <p className="text-gray-500 text-sm mt-1">Makbuzlarda yapılan tüm değişiklikler</p>
      </div>
      <ReceiptAuditLog />
    </div>
  );
}
