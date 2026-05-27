import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/api/auth-provider"
import type { Tables, TablesInsert } from "@/types/database"

type PropfirmRef = Pick<Tables<"propfirms">, "id" | "name" | "slug"> | null
type EvaluationRef =
  | (Pick<Tables<"evaluations">, "id" | "propfirm_id"> & {
      propfirm: PropfirmRef
    })
  | null
type FundedAccountRef =
  | (Pick<Tables<"funded_accounts">, "id" | "evaluation_id"> & {
      evaluation: EvaluationRef
    })
  | null

export type Payout = Tables<"payouts"> & {
  funded_account: FundedAccountRef
}

export type NewPayoutInput = Omit<
  TablesInsert<"payouts">,
  "id" | "user_id" | "created_at"
>

export const payoutsKeys = {
  all: ["payouts"] as const,
  list: () => [...payoutsKeys.all, "list"] as const,
}

export function usePayouts() {
  return useQuery({
    queryKey: payoutsKeys.list(),
    queryFn: async (): Promise<Payout[]> => {
      const { data, error } = await supabase
        .from("payouts")
        .select(
          "*, funded_account:funded_accounts(id, evaluation_id, evaluation:evaluations(id, propfirm_id, propfirm:propfirms(id, name, slug)))",
        )
        .order("paid_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as Payout[]
    },
  })
}

export function useCreatePayout() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: NewPayoutInput) => {
      if (!user) throw new Error("Not authenticated")
      const { data, error } = await supabase
        .from("payouts")
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutsKeys.all })
    },
  })
}

export function useDeletePayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payouts").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutsKeys.all })
    },
  })
}
