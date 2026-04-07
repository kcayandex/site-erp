"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"

export default function ReceiptActions({ receiptId }: { receiptId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setLoading(true)
    await supabase.from("receipts").delete().eq("id", receiptId)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition disabled:opacity-50"
        >
          {loading ? "..." : "Evet, sil"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded bg-gray-100 transition"
        >
          İptal
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-gray-400 hover:text-red-600 transition"
      title="Sil"
    >
      <Trash2 size={16} />
    </button>
  )
}
