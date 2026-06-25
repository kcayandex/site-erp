import KasaDashboard from "@/components/kasa/KasaDashboard";

export default function KasaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">KTurkey Kasa</h2>
        <p className="text-gray-500 text-sm mt-1">
          Aylık gelir, gider ve ortak dağılımı
        </p>
      </div>
      <KasaDashboard />
    </div>
  );
}
