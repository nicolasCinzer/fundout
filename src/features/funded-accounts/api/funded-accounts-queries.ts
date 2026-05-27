import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import type { Database, Tables } from "@/types/database"

export type FundedAccountStatus =
  Database["public"]["Enums"]["funded_account_status"]

type PropfirmRef = Pick<Tables<"propfirms">, "id" | "name" | "slug"> | null
type EvaluationRef =
  | (Pick<Tables<"evaluations">, "id" | "account_size" | "propfirm_id"> & {
      propfirm: PropfirmRef
    })
  | null

export type FundedAccount = Tables<"funded_accounts"> & {
  evaluation: EvaluationRef
}

export const fundedAccountsKeys = {
  all: ["funded_accounts"] as const,
  list: () => [...fundedAccountsKeys.all, "list"] as const,
}

export function useFundedAccounts() {
  return useQuery({
    queryKey: fundedAccountsKeys.list(),
    queryFn: async (): Promise<FundedAccount[]> => {
      const { data, error } = await supabase
        .from("funded_accounts")
        .select(
          "*, evaluation:evaluations(id, account_size, propfirm_id, propfirm:propfirms(id, name, slug))",
        )
        .order("start_date", { ascending: false })
      if (error) throw error
      return (data ?? []) as FundedAccount[]
    },
  })
}

export function useMarkFundedAccountBreached() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const today = format(new Date(), "yyyy-MM-dd")
      const { error } = await supabase
        .from("funded_accounts")
        .update({ status: "breached", closed_at: today })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundedAccountsKeys.all })
    },
  })
}

export function useDeleteFundedAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("funded_accounts")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      // Funded accounts cascade to payouts. The linked evaluation stays.
      queryClient.invalidateQueries({ queryKey: fundedAccountsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["payouts"] })
      // The evaluation still exists but its row UI may show different actions
      // now that it has no linked funded account.
      queryClient.invalidateQueries({ queryKey: ["evaluations"] })
    },
  })
}
