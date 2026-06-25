import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: role } = await supabase.rpc("get_my_role");
  if (role !== "admin" && role !== "superadmin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("page_access").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

  const { role, page_key, is_visible } = await req.json();
  if (!role || !page_key || is_visible === undefined) {
    return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("page_access")
    .upsert({ role, page_key, is_visible }, { onConflict: "role,page_key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
