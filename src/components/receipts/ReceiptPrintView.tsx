"use client";

import { useEffect } from "react";
import type { Receipt, Site } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Props {
  receipt: Receipt & { site: Site };
}

function ReceiptCopy({
  receipt,
  copyLabel,
  signerLabel,
}: {
  receipt: Receipt & { site: Site };
  copyLabel: string;
  signerLabel: string;
}) {
  const site = receipt.site;

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        border: "1px solid #000",
        padding: "16px",
        boxSizing: "border-box",
        backgroundColor: "#fff",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>{site.name}</div>
          <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>{site.address}</div>
          {site.vergi_no && (
            <div style={{ fontSize: "9px", color: "#555", marginTop: "1px" }}>Vergi No: {site.vergi_no}</div>
          )}
          <div style={{ fontSize: "9px", color: "#888", fontStyle: "italic" }}>Management Application</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "1px" }}>MASRAF VE HİZMET</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "1px" }}>MAKBUZU</div>
          <div style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>{copyLabel}</div>
        </div>
        <div style={{ border: "1px solid #000", padding: "6px 10px", fontSize: "10px" }}>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ paddingRight: "8px", fontWeight: "bold" }}>Tarih</td>
                <td style={{ color: "#000" }}>
                  {format(new Date(receipt.date), "dd.MM.yyyy", { locale: tr })}
                </td>
              </tr>
              <tr>
                <td style={{ paddingRight: "8px", fontWeight: "bold" }}>Seri No</td>
                <td style={{ fontWeight: "bold" }}>{receipt.serial_no}</td>
              </tr>
              <tr>
                <td style={{ paddingRight: "8px", fontWeight: "bold" }}>Sıra No</td>
                <td style={{ color: "#cc0000", fontWeight: "bold" }}>
                  {String(receipt.sequence_no).padStart(4, "0")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment description */}
      <div style={{ border: "1px solid #ccc", padding: "6px 10px", marginBottom: "8px", minHeight: "28px", fontSize: "10px", color: "#555" }}>
        ÖDEME AÇIKLAMASI: {receipt.payment_description ?? ""}
      </div>

      {/* Items table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
        <thead>
          <tr style={{ backgroundColor: "#1a1a2e", color: "#fff" }}>
            <th style={{ padding: "6px 8px", textAlign: "center", width: "60px", fontSize: "10px" }}>Kalem No</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontSize: "10px" }}>Ayrıntılı Nakit Tahsilat Kalemleri</th>
            <th style={{ padding: "6px 8px", textAlign: "right", width: "100px", fontSize: "10px" }}>Tutar (₺)</th>
            <th style={{ padding: "6px 8px", textAlign: "right", width: "80px", fontSize: "10px" }}>Liras (Kr.)</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, i) => {
            const amt = Number(item.amount_islenen ?? 0);
            const lira = Math.floor(amt);
            const kurus = Math.round((amt - lira) * 100);
            return (
              <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "5px 8px", textAlign: "center", color: "#555" }}>{item.no}</td>
                <td style={{ padding: "5px 8px" }}>{item.description}</td>
                <td style={{ padding: "5px 8px", textAlign: "right" }}>{amt > 0 ? lira.toLocaleString("tr-TR") : ""}</td>
                <td style={{ padding: "5px 8px", textAlign: "right" }}>{amt > 0 ? String(kurus).padStart(2, "0") : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Total row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "9px", color: "#555", marginBottom: "3px" }}>YALNIZ (YAZI İLE):</div>
          <div style={{ border: "1px solid #ccc", padding: "4px 8px", minHeight: "22px", fontSize: "9px" }}>
            {receipt.amount_words ?? ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginLeft: "16px" }}>
          <div style={{ border: "1px solid #000", padding: "5px 10px", fontWeight: "bold", fontSize: "11px" }}>
            Toplam Tutar (₺)
          </div>
          <div style={{ border: "1px solid #000", borderLeft: "none", padding: "5px 16px", fontWeight: "bold", fontSize: "11px", minWidth: "80px", textAlign: "right" }}>
            {Number(receipt.total_islenen).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Signature area */}
      <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "9px", color: "#555" }}>Müşteri Kodu:</div>
          <div style={{ borderBottom: "1px solid #000", width: "160px", marginTop: "4px" }}>
            {receipt.customer_code ?? ""}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #000", width: "200px", paddingTop: "4px", fontSize: "9px", color: "#555" }}>
            KASE / İMZA
          </div>
          <div style={{ marginTop: "4px", fontSize: "9px", color: "#555" }}>{signerLabel}</div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPrintView({ receipt }: Props) {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <div
      style={{
        maxWidth: "210mm",
        margin: "0 auto",
        padding: "10mm",
        backgroundColor: "#f5f5f5",
      }}
    >
      <style>{`
        @media print {
          body { margin: 0; background: white; }
          .no-print { display: none !important; }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
        <button
          onClick={() => window.print()}
          style={{
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 20px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          Yazdır / PDF Kaydet
        </button>
        <button
          onClick={() => window.history.back()}
          style={{
            background: "#e5e7eb",
            color: "#374151",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Geri
        </button>
      </div>

      {/* First copy */}
      <ReceiptCopy
        receipt={receipt}
        copyLabel="SİTE ÖDEME KOPYASI"
        signerLabel="ÖDEMEYİ YAPAN BİRİM"
      />

      {/* Cut line */}
      <div
        style={{
          textAlign: "center",
          padding: "12px 0",
          color: "#999",
          fontSize: "10px",
          letterSpacing: "4px",
          borderTop: "1px dashed #aaa",
          borderBottom: "1px dashed #aaa",
          margin: "12px 0",
        }}
      >
        ✂ KESİM HATTI / CUT HERE ✂
      </div>

      {/* Second copy */}
      <ReceiptCopy
        receipt={receipt}
        copyLabel="CONTRACTOR MAKBUZ KOPYASI"
        signerLabel="ÖDEMEYİ ALAN CONTRACTOR"
      />
    </div>
  );
}
