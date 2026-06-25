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
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: roles } = await admin.from("user_roles").select("user_id, role");
  const roleMap = Object.fromEntries((roles ?? []).map((r) => [r.user_id, r.role]));

  const result = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: roleMap[u.id] ?? "user",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

  const { email, password, role } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre zorunludur" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin.from("user_roles").insert({ user_id: data.user.id, role: role ?? "user" });

  return NextResponse.json({ id: data.user.id, email: data.user.email, role: role ?? "user" });
}
