"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Header({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/giris");
    router.refresh();
  }

  return (
    <header className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{userEmail}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition"
        >
          <LogOut size={15} />
          Çıkış
        </button>
      </div>
    </header>
  );
}
