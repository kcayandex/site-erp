"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard, Building2, FileText, HardHat, BarChart3,
  CalendarCheck, Receipt, Vault, Users, UserCheck, Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, pageKey: "dashboard" },
  { href: "/siteler", label: "Siteler", icon: Building2, pageKey: "siteler" },
  { href: "/contractors", label: "Yükleniciler", icon: HardHat, pageKey: "contractors" },
  { href: "/makbuzlar", label: "Makbuzlar", icon: FileText, pageKey: "makbuzlar" },
  { href: "/aylik-ucretler", label: "Aylık Ücretler", icon: CalendarCheck, pageKey: "aylik-ucretler" },
  { href: "/giderler", label: "Giderler", icon: Receipt, pageKey: "giderler" },
  { href: "/kasa", label: "Kasa", icon: Vault, pageKey: "kasa" },
  { href: "/ortaklar", label: "Ortaklar", icon: Users, pageKey: "ortaklar" },
];

const adminItems = [
  { href: "/admin/rapor", label: "Rapor", icon: BarChart3 },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: UserCheck },
  { href: "/admin/sayfa-yetkileri", label: "Sayfa Yetkileri", icon: Shield },
];

interface SidebarProps {
  isAdmin: boolean;
  allowedPages?: string[];
}

export default function Sidebar({ isAdmin, allowedPages }: SidebarProps) {
  const pathname = usePathname();

  const visibleNavItems = isAdmin
    ? navItems
    : allowedPages != null
    ? navItems.filter((item) => allowedPages.includes(item.pageKey))
    : navItems;

  function linkClass(href: string) {
    const active = pathname.startsWith(href);
    return cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
      active
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    );
  }

  return (
    <aside className="print:hidden w-60 bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">Site ERP</h1>
        <p className="text-xs text-gray-400 mt-0.5">Yönetim Sistemi</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Admin
              </p>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
