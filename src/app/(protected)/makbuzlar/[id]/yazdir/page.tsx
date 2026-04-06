import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ReceiptPrintView from "@/components/receipts/ReceiptPrintView";

export default async function PrintReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: receipt } = await supabase
    .from("receipts")
    .select("*, site:sites(id, name, abbreviation, address)")
    .eq("id", params.id)
    .single();

  if (!receipt) notFound();

  return <ReceiptPrintView receipt={receipt} />;
}
