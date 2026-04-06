import { createClient } from "@/lib/supabase/server";
import { Building2, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: siteCount }, { count: receiptCount }, { data: roleData }] =
    await Promise.all([
      supabase.from("sites").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("receipts").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("role").single(),
    ]);

  const isAdmin = roleData?.role === "admin";

  const cards = [
    {
      label: "Aktif Siteler",
      value: siteCount ?? 0,
      icon: Building2,
      href: "/siteler",
      color: "bg-blue-500",
    },
    {
      label: "Toplam Makbuz",
      value: receiptCount ?? 0,
      icon: FileText,
      href: "/makbuzlar",
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Genel bakış</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition"
            >
              <div className={`${card.color} text-white rounded-xl p-3`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin/kar-raporu"
            className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition"
          >
            <div className="bg-amber-500 text-white rounded-xl p-3">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Kar Raporu</p>
              <p className="text-xs text-gray-500">Site bazında kazanç</p>
            </div>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-3">Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/makbuzlar/yeni"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Yeni Makbuz
          </Link>
          <Link
            href="/siteler"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Site Yönetimi
          </Link>
        </div>
      </div>
    </div>
  );
}
