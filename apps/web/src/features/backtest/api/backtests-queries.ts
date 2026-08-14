import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { computeStats } from "@/features/backtest/lib/compute-stats"
import type { Backtest, BacktestEvent, BacktestStats } from "@/features/backtest/types"
import { hasCompleteCore } from "@/features/backtest/types"
import type { BacktestCreateInput, BacktestEventAppendInput } from "@/features/backtest/schemas/backtest-form-schema"
import type { AccountRulesInput } from "@/features/backtest/schemas/account-rules-schema"

// Combined create payload: base fields + optional rule columns
export type BacktestCreateWithRulesInput = BacktestCreateInput & AccountRulesInput

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
    mutationFn: async (input: BacktestCreateWithRulesInput): Promise<Backtest> => {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error("No autenticado")
      const { data, error } = await supabase
        .from("backtests")
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error

      // If created with a complete rule set, seed the initial "bought eval" (E)
      // event so the first eval is a real lifecycle from the start — the
      // tracker's Mark-funded (F) needs a preceding E to attach to.
      if (hasCompleteCore(data)) {
        const { error: evErr } = await supabase.from("backtest_events").insert({
          backtest_id: data.id,
          user_id: user.id,
          position: 1,
          type: "E",
          amount: null,
          notes: null,
          lifecycle_id: crypto.randomUUID(), // mint on creation
        })
        if (evErr) throw evErr
      }

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

// ---------------------------------------------------------------------------
// Append event payload: event input + explicit lifecycleId (ADR-5).
// `lifecycleId` is separate from the discriminated-union schema to keep
// the Zod schema untouched (RHF+zodResolver gotcha: transforms break resolvers).
// For E events: caller mints crypto.randomUUID() BEFORE calling mutate so it
// can pre-select the new account. For F/P: caller passes selected lifecycle's id.
// ---------------------------------------------------------------------------
export type AppendEventPayload = {
  input: BacktestEventAppendInput
  lifecycleId: string
}

export function useAppendBacktestEvent(backtestId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ input, lifecycleId }: AppendEventPayload): Promise<BacktestEvent> => {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error("No autenticado")

      // Compute next position from cached events (positions remain globally monotonic)
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
          lifecycle_id: lifecycleId,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Optimistically append the new event so the new lifecycle exists in the
      // cache immediately — otherwise the caller's optimistic selection points to
      // a lifecycle not yet present and the tracker flashes/unmounts until refetch.
      queryClient.setQueryData<BacktestEvent[]>(
        backtestsKeys.events(backtestId),
        (old) => (old ? [...old, data] : [data]),
      )
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

/**
 * Undo the REAL last event of the backtest — the one with the highest position
 * across ALL lifecycles (the most recent action). Not scoped to a lifecycle:
 * "Undo last event" means the last event in the log, regardless of which account
 * it belongs to. (Supersedes the earlier lifecycle-scoped ADR-6 behavior.)
 *
 * Returns the deleted event id so the cache can be updated optimistically.
 * No-op when there are no events.
 */
export function useUndoLastBacktestEvent(backtestId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<string | null> => {
      const cached = queryClient.getQueryData<BacktestEvent[]>(
        backtestsKeys.events(backtestId),
      )
      if (!cached || cached.length === 0) return null

      const last = cached.reduce((max, ev) => (ev.position > max.position ? ev : max))
      const { error } = await supabase
        .from("backtest_events")
        .delete()
        .eq("id", last.id)
      if (error) throw error
      return last.id
    },
    onSuccess: (deletedId) => {
      if (deletedId) {
        queryClient.setQueryData<BacktestEvent[]>(
          backtestsKeys.events(backtestId),
          (old) => old?.filter((ev) => ev.id !== deletedId) ?? old,
        )
      }
      queryClient.invalidateQueries({ queryKey: backtestsKeys.events(backtestId) })
      queryClient.invalidateQueries({ queryKey: backtestsKeys.listWithStats() })
    },
  })
}
