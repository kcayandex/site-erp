"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

const PAGES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "siteler", label: "Siteler" },
  { key: "contractors", label: "Yükleniciler" },
  { key: "makbuzlar", label: "Makbuzlar" },
  { key: "aylik-ucretler", label: "Aylık Ücretler" },
  { key: "giderler", label: "Giderler" },
  { key: "kasa", label: "Kasa" },
  { key: "ortaklar", label: "Ortaklar" },
];

interface AccessMap {
  [page_key: string]: boolean;
}

export default function SayfaYetkileriPage() {
  const [access, setAccess] = useState<AccessMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function fetchAccess() {
    setLoading(true);
    const res = await fetch("/api/admin/page-access");
    if (res.ok) {
      const data: { role: string; page_key: string; is_visible: boolean }[] = await res.json();
      const map: AccessMap = {};
      for (const item of data) {
        if (item.role === "user") map[item.page_key] = item.is_visible;
      }
      setAccess(map);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAccess(); }, []);

  async function toggle(page_key: string) {
    const current = access[page_key] ?? true;
    const newVal = !current;
    setSaving(page_key);
    setAccess((prev) => ({ ...prev, [page_key]: newVal }));

    const res = await fetch("/api/admin/page-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", page_key, is_visible: newVal }),
    });

    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      setAccess((prev) => ({ ...prev, [page_key]: current }));
    }
    setSaving(null);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Sayfa Yetkileri</h2>
        <p className="text-gray-500 text-sm mt-1">"User" rolü için hangi sayfalar görünür</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
        <strong>Admin</strong> ve <strong>Super Admin</strong> rolleri tüm sayfaları her zaman görür.
        Bu ayarlar yalnızca <strong>User</strong> rolünü etkiler.
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500 font-medium">
            <span>Sayfa</span>
            <span className="text-center">Admin / Super Admin</span>
            <span className="text-center">User</span>
          </div>
          <div className="divide-y divide-gray-50">
            {PAGES.map((page) => {
              const visible = access[page.key] ?? true;
              const isSaving = saving === page.key;
              return (
                <div key={page.key} className="grid grid-cols-3 items-center px-5 py-3.5 hover:bg-gray-50/50">
                  <span className="font-medium text-sm text-gray-800">{page.label}</span>
                  <div className="flex justify-center">
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <Eye size={12} /> Hep görünür
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggle(page.key)}
                      disabled={!!isSaving}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition disabled:opacity-50 ${
                        visible
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {isSaving ? "..." : visible ? "Görünür" : "Gizli"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
