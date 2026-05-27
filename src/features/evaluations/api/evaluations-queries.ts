import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/api/auth-provider"
import type { Database, Tables, TablesInsert } from "@/types/database"

export type EvaluationStatus = Database["public"]["Enums"]["evaluation_status"]

export type Evaluation = Tables<"evaluations"> & {
  propfirm: Pick<Tables<"propfirms">, "id" | "name" | "slug"> | null
}

export type NewEvaluationInput = Omit<
  TablesInsert<"evaluations">,
  "id" | "user_id" | "created_at" | "updated_at"
>

export const evaluationsKeys = {
  all: ["evaluations"] as const,
  list: () => [...evaluationsKeys.all, "list"] as const,
}

export function useEvaluations() {
  return useQuery({
    queryKey: evaluationsKeys.list(),
    queryFn: async (): Promise<Evaluation[]> => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*, propfirm:propfirms(id, name, slug)")
        .order("purchase_date", { ascending: false })
      if (error) throw error
      return (data ?? []) as Evaluation[]
    },
  })
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: NewEvaluationInput) => {
      if (!user) throw new Error("Not authenticated")
      const { data, error } = await supabase
        .from("evaluations")
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
    },
  })
}

/**
 * Compound: marks the evaluation as passed (closed_at = today) AND creates
 * the linked funded_account in active state. One user-facing click.
 *
 * Not atomic at the DB level (no transaction from the client). If the second
 * step fails, the evaluation is left passed without a funded account — the
 * user can re-run the action; the update is idempotent and the insert will
 * complete the second time.
 */
export function useMarkEvaluationFunded() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (evaluationId: string) => {
      if (!user) throw new Error("Not authenticated")
      const today = format(new Date(), "yyyy-MM-dd")

      const { error: updateError } = await supabase
        .from("evaluations")
        .update({ status: "passed", closed_at: today })
        .eq("id", evaluationId)
      if (updateError) throw updateError

      const { data, error: insertError } = await supabase
        .from("funded_accounts")
        .insert({
          user_id: user.id,
          evaluation_id: evaluationId,
          start_date: today,
          status: "active",
        })
        .select()
        .single()
      if (insertError) throw insertError
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["funded_accounts"] })
    },
  })
}

type UpdateEvaluationStatusInput = {
  id: string
  status: Exclude<EvaluationStatus, "passed">
}

export function useUpdateEvaluationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: UpdateEvaluationStatusInput) => {
      const today = format(new Date(), "yyyy-MM-dd")
      const closed_at = status === "in_progress" ? null : today
      const { error } = await supabase
        .from("evaluations")
        .update({ status, closed_at })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
    },
  })
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("evaluations").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      // Evaluations cascade to funded_accounts which cascade to payouts.
      // Invalidate all three.
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["funded_accounts"] })
      queryClient.invalidateQueries({ queryKey: ["payouts"] })
    },
  })
}
