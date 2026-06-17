import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/api/auth-provider"
import type { Database, Tables, TablesInsert } from "@/types/database"

export type EvaluationStatus = Database["public"]["Enums"]["evaluation_status"]
export type EvaluationReset = Tables<"evaluation_resets">

export type Evaluation = Tables<"evaluations"> & {
  propfirm: Pick<Tables<"propfirms">, "id" | "name" | "slug"> | null
  resets: EvaluationReset[]
}

export type NewEvaluationInput = Omit<
  TablesInsert<"evaluations">,
  "id" | "user_id" | "created_at" | "updated_at"
>

export type NewResetInput = {
  evaluation_id: string
  fee: number
  reset_at: string
  notes: string | null
}

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
        .select(
          "*, propfirm:propfirms(id, name, slug), resets:evaluation_resets(*)",
        )
        .order("purchase_date", { ascending: false })
      if (error) throw error
      return (data ?? []) as Evaluation[]
    },
  })
}

/** Sum of base fee + every reset fee for an evaluation. */
export function totalFee(e: Evaluation): number {
  const resetSum = (e.resets ?? []).reduce((acc, r) => acc + Number(r.fee), 0)
  return Number(e.fee_paid) + resetSum
}

/** Sum of just the reset fees. */
export function resetsTotal(e: Evaluation): number {
  return (e.resets ?? []).reduce((acc, r) => acc + Number(r.fee), 0)
}

export type UpdateEvaluationInput = {
  id: string
  propfirm_id: string
  account_size: number
  fee_paid: number
  purchase_date: string
  notes: string | null
}

/**
 * Edits the data fields of an evaluation. Status + closed_at are NOT updated
 * here — those transitions live in the dedicated mutations (mark funded,
 * mark failed) so the linked funded_account stays in sync.
 */
export function useUpdateEvaluation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateEvaluationInput) => {
      const { error } = await supabase
        .from("evaluations")
        .update(patch)
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
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
 * Compound: marks evaluation as passed (closed_at = today) AND inserts the
 * linked funded_account. Two operations, idempotent on retry — see commit
 * message for failure-mode reasoning.
 */
type MarkFundedInput = {
  evaluationId: string
  fundedAt: string
}

export function useMarkEvaluationFunded() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ evaluationId, fundedAt }: MarkFundedInput) => {
      if (!user) throw new Error("Not authenticated")

      const { error: updateError } = await supabase
        .from("evaluations")
        .update({ status: "passed", closed_at: fundedAt })
        .eq("id", evaluationId)
      if (updateError) throw updateError

      const { data, error: insertError } = await supabase
        .from("funded_accounts")
        .insert({
          user_id: user.id,
          evaluation_id: evaluationId,
          start_date: fundedAt,
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

export function useLogEvaluationReset() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: NewResetInput) => {
      if (!user) throw new Error("Not authenticated")
      const { data, error } = await supabase
        .from("evaluation_resets")
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

export function useDeleteEvaluation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("evaluations").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["funded_accounts"] })
      queryClient.invalidateQueries({ queryKey: ["payouts"] })
    },
  })
}

export function useUndoMarkEvaluationFailed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (evaluationId: string) => {
      const { error } = await supabase
        .from("evaluations")
        .update({ status: "in_progress", closed_at: null })
        .eq("id", evaluationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
    },
  })
}

export function useUndoMarkEvaluationFunded() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      evaluationId,
      fundedAccountId,
    }: {
      evaluationId: string
      fundedAccountId: string
    }) => {
      const { error: deleteError } = await supabase
        .from("funded_accounts")
        .delete()
        .eq("id", fundedAccountId)
      if (deleteError) throw deleteError

      const { error: resetError } = await supabase
        .from("evaluations")
        .update({ status: "in_progress", closed_at: null })
        .eq("id", evaluationId)
      // funded_account was already deleted at this point — partial failure
      if (resetError)
        throw new Error(
          "Undo partially failed — funded account removed but evaluation could not be reset. Please refresh and check.",
        )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["funded_accounts"] })
    },
  })
}
