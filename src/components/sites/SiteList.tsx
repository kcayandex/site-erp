"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Site } from "@/types";
import { generateAbbreviation } from "@/lib/utils/receipt-number";
import { Plus, Pencil, Power, Building2 } from "lucide-react";

interface SiteFormData {
  name: string;
  address: string;
  abbreviation: string;
}

const EMPTY_FORM: SiteFormData = { name: "", address: "", abbreviation: "" };

export default function SiteList({
  sites,
  isAdmin,
}: {
  sites: Site[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [form, setForm] = useState<SiteFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setEditingSite(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function openEdit(site: Site) {
    setEditingSite(site);
    setForm({
      name: site.name,
      address: site.address,
      abbreviation: site.abbreviation,
    });
    setShowForm(true);
    setError(null);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      abbreviation: editingSite ? prev.abbreviation : generateAbbreviation(name),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (editingSite) {
      const { error: updateError } = await supabase
        .from("sites")
        .update({
          name: form.name,
          address: form.address,
          abbreviation: form.abbreviation.toUpperCase(),
        })
        .eq("id", editingSite.id);

      if (updateError) {
        setError("Güncelleme başarısız: " + updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("sites").insert({
        name: form.name,
        address: form.address,
        abbreviation: form.abbreviation.toUpperCase(),
        is_active: true,
      });

      if (insertError) {
        setError(
          insertError.message.includes("unique")
            ? "Bu kısaltma zaten kullanılıyor."
            : "Site eklenemedi: " + insertError.message
        );
        setLoading(false);
        return;
      }
    }

    setShowForm(false);
    setForm(EMPTY_FORM);
    setLoading(false);
    router.refresh();
  }

  async function toggleActive(site: Site) {
    await supabase
      .from("sites")
      .update({ is_active: !site.is_active })
      .eq("id", site.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Add button — only admin */}
      {isAdmin && (
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Yeni Site Ekle
        </button>
      )}

      {/* Form */}
      {showForm && isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">
            {editingSite ? "Siteyi Düzenle" : "Yeni Site"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Toprak Panorama"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kısaltma (Makbuz Seri) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.abbreviation}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      abbreviation: e.target.value.toUpperCase(),
                    }))
                  }
                  required
                  maxLength={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TPR"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Max 5 karakter — makbuz seri no'sunda kullanılır
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kargıcak Mah. 119. Sk. No:8 C/1 Alanya / Antalya"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Kaydediliyor..." : editingSite ? "Güncelle" : "Ekle"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sites grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <div
            key={site.id}
            className={`bg-white rounded-xl border p-5 ${
              site.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-lg p-2">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{site.name}</p>
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs font-mono px-2 py-0.5 rounded mt-0.5">
                    {site.abbreviation}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(site)}
                    className="text-gray-400 hover:text-blue-600 p-1.5 rounded transition"
                    title="Düzenle"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(site)}
                    className={`p-1.5 rounded transition ${
                      site.is_active
                        ? "text-gray-400 hover:text-red-500"
                        : "text-gray-300 hover:text-green-500"
                    }`}
                    title={site.is_active ? "Pasife Al" : "Aktife Al"}
                  >
                    <Power size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">{site.address}</p>
            <div className="mt-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  site.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {site.is_active ? "Aktif" : "Pasif"}
              </span>
            </div>
          </div>
        ))}

        {sites.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-40" />
            <p>Henüz site eklenmemiş.</p>
          </div>
        )}
      </div>
    </div>
  );
}
