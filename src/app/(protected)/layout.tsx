export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = roleData?.role === "admin";

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userEmail={user.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">{children}</main>
      </div>
    </div>
  );
}
