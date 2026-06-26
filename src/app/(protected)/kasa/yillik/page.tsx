import YillikOzet from "@/components/kasa/YillikOzet";

export default function YillikOzetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Yıllık Özet</h2>
        <p className="text-gray-500 text-sm mt-1">Aylara göre gelir, gider ve kasa dağılımı</p>
      </div>
      <YillikOzet />
    </div>
  );
}
