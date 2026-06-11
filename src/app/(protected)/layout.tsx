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
  // getSession reads from the cookie — no extra network call.
  // Middleware already validates the JWT on every request.
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/giris");

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .single();

  const isAdmin = roleData?.role === "admin";

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userEmail={session.user.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">{children}</main>
      </div>
    </div>
  );
}
