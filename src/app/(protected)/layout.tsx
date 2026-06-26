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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/giris");

  const { data: role } = await supabase.rpc("get_my_role");
  const isAdmin = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";

  // For non-admin users, fetch allowed pages from page_access table
  let allowedPages: string[] | undefined = undefined;
  if (!isAdmin && role) {
    const { data: access } = await supabase
      .from("page_access")
      .select("page_key")
      .eq("role", role)
      .eq("is_visible", true);
    if (access && access.length > 0) {
      allowedPages = access.map((a) => a.page_key);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} allowedPages={allowedPages} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userEmail={session.user.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
