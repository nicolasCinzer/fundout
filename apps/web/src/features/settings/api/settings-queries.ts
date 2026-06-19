import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/api/auth-provider"
import { evaluationsKeys } from "@/features/evaluations/api/evaluations-queries"
import { fundedAccountsKeys } from "@/features/funded-accounts/api/funded-accounts-queries"
import { payoutsKeys } from "@/features/payouts/api/payouts-queries"

/**
 * Wipes the user's journal data: evaluations, funded_accounts, payouts and
 * evaluation_resets. Backtests, profile and propfirms are kept.
 *
 * Implementation: a single DELETE on `evaluations` filtered by user_id. The
 * schema cascades to funded_accounts, payouts and evaluation_resets, so one
 * statement is enough. RLS already restricts deletes to the owner row.
 */
export function useResetJournal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated")
      const { error } = await supabase
        .from("evaluations")
        .delete()
        .eq("user_id", user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
      queryClient.invalidateQueries({ queryKey: fundedAccountsKeys.all })
      queryClient.invalidateQueries({ queryKey: payoutsKeys.all })
    },
  })
}
