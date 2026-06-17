import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { computeStats } from "@/features/backtest/lib/compute-stats"
import type { Backtest, BacktestEvent, BacktestStats } from "@/features/backtest/types"
import type { BacktestCreateInput, BacktestEventAppendInput } from "@/features/backtest/schemas/backtest-form-schema"

export type BacktestWithStats = {
  backtest: Backtest
  events: BacktestEvent[]
  stats: BacktestStats
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const backtestsKeys = {
  all: ["backtests"] as const,
  list: () => [...backtestsKeys.all, "list"] as const,
  listWithStats: () => [...backtestsKeys.all, "list-with-stats"] as const,
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

export function useBacktestsWithStats() {
  return useQuery({
    queryKey: backtestsKeys.listWithStats(),
    queryFn: async (): Promise<BacktestWithStats[]> => {
      const [btRes, evRes] = await Promise.all([
        supabase.from("backtests").select("*").order("created_at", { ascending: false }),
        supabase.from("backtest_events").select("*").order("position", { ascending: true }),
      ])
      if (btRes.error) throw btRes.error
      if (evRes.error) throw evRes.error
      const backtests = btRes.data ?? []
      const events = evRes.data ?? []

      const eventsByBacktest = new Map<string, BacktestEvent[]>()
      for (const ev of events) {
        const arr = eventsByBacktest.get(ev.backtest_id) ?? []
        arr.push(ev)
        eventsByBacktest.set(ev.backtest_id, arr)
      }

      return backtests.map((bt) => {
        const btEvents = eventsByBacktest.get(bt.id) ?? []
        return { backtest: bt, events: btEvents, stats: computeStats(btEvents, bt) }
      })
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
      queryClient.invalidateQueries({ queryKey: backtestsKeys.listWithStats() })
    },
  })
}

type BacktestMetaUpdate = {
  id: string
  name: string
  asset?: string | null
  period?: string | null
  strategy?: string | null
}

export function useUpdateBacktestMeta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: BacktestMetaUpdate): Promise<Backtest> => {
      // bankroll_initial / eval_cost are intentionally immutable (ADR-5)
      const { data, error } = await supabase
        .from("backtests")
        .update(patch)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: backtestsKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: backtestsKeys.list() })
      queryClient.invalidateQueries({ queryKey: backtestsKeys.listWithStats() })
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
      queryClient.invalidateQueries({ queryKey: backtestsKeys.listWithStats() })
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
      queryClient.invalidateQueries({ queryKey: backtestsKeys.listWithStats() })
    },
    onError: (error: Error & { code?: string }) => {
      if (error.code === "23505") {
        // UNIQUE(backtest_id, position) violation — another tab modified events
        queryClient.invalidateQueries({ queryKey: backtestsKeys.events(backtestId) })
      queryClient.invalidateQueries({ queryKey: backtestsKeys.listWithStats() })
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
      queryClient.invalidateQueries({ queryKey: backtestsKeys.listWithStats() })
    },
  })
}
