import type { Site } from "@/types";
import { AlertTriangle, AlertCircle } from "lucide-react";

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ContractAlerts({ sites }: { sites: Site[] }) {
  const today = new Date().toISOString().split("T")[0];
  const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const activeSites = sites.filter((s) => s.is_active);

  const expired = activeSites.filter(
    (s) => s.contract_end_date && s.contract_end_date < today
  );

  const expiringSoon = activeSites.filter(
    (s) =>
      s.contract_end_date &&
      s.contract_end_date >= today &&
      s.contract_end_date <= in60
  );

  if (expired.length === 0 && expiringSoon.length === 0) return null;

  return (
    <div className="space-y-3">
      {expired.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-red-600" />
            <span className="text-sm font-semibold text-red-700">
              Sözleşmesi Sona Ermiş ({expired.length} site)
            </span>
          </div>
          <div className="space-y-1.5">
            {expired.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-red-800 font-medium">{s.name}</span>
                <span className="text-red-500 text-xs">
                  {daysBetween(s.contract_end_date!, today)} gün önce sona erdi
                  {" "}({s.contract_end_date})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">
              Sözleşmesi Yakında Bitiyor ({expiringSoon.length} site)
            </span>
          </div>
          <div className="space-y-1.5">
            {expiringSoon.map((s) => {
              const days = daysBetween(today, s.contract_end_date!);
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-amber-800 font-medium">{s.name}</span>
                  <span className="text-amber-600 text-xs">
                    {days} gün kaldı ({s.contract_end_date})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
