"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"

const PERIODS = [
  { key: "month", label: "Bu Ay" },
  { key: "quarter", label: "Son 3 Ay" },
  { key: "year", label: "Bu Yıl" },
  { key: "custom", label: "Özel" },
]

export default function ReportFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activePeriod = searchParams.get("period") ?? "month"
  const fromParam = searchParams.get("from") ?? ""
  const toParam = searchParams.get("to") ?? ""

  const [from, setFrom] = useState(fromParam)
  const [to, setTo] = useState(toParam)

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(params)
    router.push(`${pathname}?${sp.toString()}`)
  }

  function selectPeriod(key: string) {
    if (key === "custom") {
      navigate({ period: "custom", from, to })
    } else {
      navigate({ period: key })
    }
  }

  function applyCustom() {
    navigate({ period: "custom", from, to })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-600">Dönem:</span>
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => selectPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activePeriod === p.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activePeriod === "custom" && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={applyCustom}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Uygula
          </button>
        </div>
      )}
    </div>
  )
}
