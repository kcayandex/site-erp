"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { amountToWords } from "@/lib/utils/amount-to-words";
import { getSerialNo, buildReceiptNo } from "@/lib/utils/receipt-number";
import { RECEIPT_CATEGORIES } from "@/lib/constants/categories";
import type { Site, Receipt, ReceiptItem, Contractor } from "@/types";

const EMPTY_ITEMS: ReceiptItem[] = Array.from({ length: 5 }, (_, i) => ({
  no: i + 1,
  description: "",
  amount_islenen: 0,
  amount_odenen: 0,
}));

interface Props {
  sites: Pick<Site, "id" | "name" | "abbreviation" | "address">[];
  contractors: Pick<Contractor, "id" | "name">[];
  existingReceipt?: Receipt;
}

export default function ReceiptForm({ sites, contractors, existingReceipt }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const today = new Date().toISOString().split("T")[0];

  const [siteId, setSiteId] = useState(existingReceipt?.site_id ?? "");
  const [date, setDate] = useState(existingReceipt?.date ?? today);
  const [category, setCategory] = useState(existingReceipt?.category ?? "")
  const [contractorId, setContractorId] = useState(existingReceipt?.contractor_id ?? "")
  const [paymentDescription, setPaymentDescription] = useState(
    existingReceipt?.payment_description ?? ""
  );
  const [items, setItems] = useState<ReceiptItem[]>(
    existingReceipt?.items ?? EMPTY_ITEMS
  );
  const [customerCode, setCustomerCode] = useState(
    existingReceipt?.customer_code ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewReceiptNo, setPreviewReceiptNo] = useState(
    existingReceipt?.receipt_no ?? ""
  );

  const selectedSite = sites.find((s) => s.id === siteId);

  // Preview receipt number when site or date changes
  useEffect(() => {
    if (!siteId || existingReceipt) return;
    const year = new Date(date).getFullYear();
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    const serialNo = getSerialNo(site.abbreviation, year);

    supabase
      .rpc("get_next_sequence", { p_site_id: siteId, p_serial_no: serialNo })
      .then(({ data }) => {
        const seq = data ?? 1;
        setPreviewReceiptNo(buildReceiptNo(site.abbreviation, year, seq));
      });
  }, [siteId, date, existingReceipt]);

  const totalIslenen = items.reduce((sum, item) => sum + (Number(item.amount_islenen) || 0), 0);
  const totalOdened = items.reduce((sum, item) => sum + (Number(item.amount_odenen) || 0), 0);

  function updateItem(index: number, field: keyof ReceiptItem, value: string | number) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!siteId) {
      setError("Lütfen bir site seçin.");
      return;
    }

    setLoading(true);
    setError(null);

    const year = new Date(date).getFullYear();
    const site = sites.find((s) => s.id === siteId)!;
    const serialNo = getSerialNo(site.abbreviation, year);

    const amountWords = amountToWords(totalIslenen);

    if (existingReceipt) {
      // Update
      const { error: updateError } = await supabase
        .from("receipts")
        .update({
          site_id: siteId,
          date,
          category: category || null,
          contractor_id: contractorId || null,
          payment_description: paymentDescription || null,
          items,
          total_islenen: totalIslenen,
          total_odenen: totalOdened,
          amount_words: amountWords,
          customer_code: customerCode || null,
        })
        .eq("id", existingReceipt.id);

      if (updateError) {
        setError("Makbuz güncellenemedi: " + updateError.message);
        setLoading(false);
        return;
      }

      router.push("/makbuzlar");
    } else {
      // Get next sequence and current user in parallel
      const [{ data: seqData }, { data: { user } }] = await Promise.all([
        supabase.rpc("get_next_sequence", { p_site_id: siteId, p_serial_no: serialNo }),
        supabase.auth.getUser(),
      ]);

      const seq = seqData ?? 1;
      const receiptNo = buildReceiptNo(site.abbreviation, year, seq);

      const { error: insertError } = await supabase.from("receipts").insert({
        site_id: siteId,
        receipt_no: receiptNo,
        serial_no: serialNo,
        sequence_no: seq,
        date,
        category: category || null,
        contractor_id: contractorId || null,
        payment_description: paymentDescription || null,
        items,
        total_islenen: totalIslenen,
        total_odenen: totalOdened,
        amount_words: amountWords,
        customer_code: customerCode || null,
        created_by: user?.id,
      });

      if (insertError) {
        setError("Makbuz oluşturulamadı: " + insertError.message);
        setLoading(false);
        return;
      }

      router.push("/makbuzlar");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site <span className="text-red-500">*</span>
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Site seçin...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Makbuz No (Otomatik)
            </label>
            <div className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm font-mono text-blue-700 font-semibold">
              {previewReceiptNo || "— Site seçince oluşur —"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contractor
            </label>
            <select
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz...</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Kategori seçin...</option>
              {RECEIPT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ödeme Açıklaması
            </label>
            <input
              type="text"
              value={paymentDescription}
              onChange={(e) => setPaymentDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ödeme açıklaması..."
            />
          </div>
        </div>

        {selectedSite && (
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <strong>Site Adresi:</strong> {selectedSite.address}
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Ödeme Kalemleri</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 w-12">No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Açıklama</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 w-40">
                  İşlenen (₺) <span className="text-xs font-normal text-blue-500">PDF'e girer</span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 w-40">
                  Ödenen (₺) <span className="text-xs font-normal text-orange-400">Dahili</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-center text-gray-400 font-medium">{item.no}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="Kalem açıklaması..."
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount_islenen || ""}
                      onChange={(e) =>
                        updateItem(index, "amount_islenen", parseFloat(e.target.value) || 0)
                      }
                      className="w-full border border-blue-200 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="0,00"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount_odenen || ""}
                      onChange={(e) =>
                        updateItem(index, "amount_odenen", parseFloat(e.target.value) || 0)
                      }
                      className="w-full border border-orange-200 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-orange-400"
                      placeholder="0,00"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-semibold text-gray-700 text-right">
                  Toplam
                </td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">
                  ₺{totalIslenen.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-bold text-orange-600">
                  ₺{totalOdened.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Amount in words + Customer Code */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Yalnız (Yazı ile) — Otomatik
          </label>
          <div className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700 min-h-[40px]">
            {totalIslenen > 0 ? amountToWords(totalIslenen) : "—"}
          </div>
        </div>

        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Müşteri Kodu
          </label>
          <input
            type="text"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Müşteri kodu..."
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : existingReceipt ? "Güncelle" : "Makbuzu Kaydet"}
        </button>
        <a
          href="/makbuzlar"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-lg text-sm transition"
        >
          İptal
        </a>
      </div>
    </form>
  );
}
