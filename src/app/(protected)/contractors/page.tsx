import { createClient } from "@/lib/supabase/server"
import ContractorList from "@/components/contractors/ContractorList"

export default async function ContractorsPage() {
  const supabase = await createClient()
  const { data: contractors } = await supabase
    .from("contractors")
    .select("*")
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Contractors</h2>
        <p className="text-gray-500 text-sm mt-1">
          {contractors?.filter(c => c.is_active).length ?? 0} aktif contractor
        </p>
      </div>
      <ContractorList contractors={contractors ?? []} />
    </div>
  )
}
