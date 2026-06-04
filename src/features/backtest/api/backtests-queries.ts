import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import type { Backtest, BacktestEvent } from "@/features/backtest/types"
import type { BacktestCreateInput, BacktestEventAppendInput } from "@/features/backtest/schemas/backtest-form-schema"

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const backtestsKeys = {
  all: ["backtests"] as const,
  list: () => [...backtestsKeys.all, "list"] as const,
  detail: (id: string) => [...backtestsKeys.all, "detail", id] as const,
  events: (id: string) => [...backtestsKeys.all, "events", id] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export function useBacktests() {
  return useQuery({
    queryKey: backtestsKeys.list(),
    queryFn: async (): Promise<Backtest[]> => {
      const { data, error } = await supabase
        .from("backtests")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useBacktest(id: string) {
  return useQuery({
    queryKey: backtestsKeys.detail(id),
    queryFn: async (): Promise<Backtest | null> => {
      const { data, error } = await supabase
        .from("backtests")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useBacktestEvents(id: string) {
  return useQuery({
    queryKey: backtestsKeys.events(id),
    queryFn: async (): Promise<BacktestEvent[]> => {
      const { data, error } = await supabase
        .from("backtest_events")
        .select("*")
        .eq("backtest_id", id)
        .order("position", { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!id,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useCreateBacktest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BacktestCreateInput): Promise<Backtest> => {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error("No autenticado")
      const { data, error } = await supabase
        .from("backtests")
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backtestsKeys.list() })
    },
  })
}

export function useUpdateBacktestName() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }): Promise<Backtest> => {
      // Only sends { name } — eval_cost is intentionally immutable (ADR-5)
      const { data, error } = await supabase
        .from("backtests")
        .update({ name })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backtestsKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: backtestsKeys.list() })
    },
  })
}

export function useDeleteBacktest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("backtests").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backtestsKeys.list() })
    },
  })
}

export function useAppendBacktestEvent(backtestId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BacktestEventAppendInput): Promise<BacktestEvent> => {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error("No autenticado")

      // Compute next position from cached events
      const cached = queryClient.getQueryData<BacktestEvent[]>(
        backtestsKeys.events(backtestId),
      )
      const last = cached && cached.length > 0 ? cached[cached.length - 1] : null
      const nextPosition = (last?.position ?? 0) + 1

      const { data, error } = await supabase
        .from("backtest_events")
        .insert({
          backtest_id: backtestId,
          user_id: user.id,
          position: nextPosition,
          type: input.type,
          amount: input.type === "P" ? input.amount : null,
          notes: input.notes ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backtestsKeys.events(backtestId) })
    },
    onError: (error: Error & { code?: string }) => {
      if (error.code === "23505") {
        // UNIQUE(backtest_id, position) violation — another tab modified events
        queryClient.invalidateQueries({ queryKey: backtestsKeys.events(backtestId) })
        toast.error("Otro tab modificó este backtest, recargamos los eventos.")
      }
    },
  })
}

export function useUndoLastBacktestEvent(backtestId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const cached = queryClient.getQueryData<BacktestEvent[]>(
        backtestsKeys.events(backtestId),
      )
      if (!cached || cached.length === 0) return

      const last = cached[cached.length - 1]
      const { error } = await supabase
        .from("backtest_events")
        .delete()
        .eq("id", last.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backtestsKeys.events(backtestId) })
    },
  })
}
