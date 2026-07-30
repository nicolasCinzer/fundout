import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Pencil, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/common/app-header"
import { EmptyState } from "@/components/common/empty-state"
import {
  useBacktest,
  useBacktestEvents,
  useAppendBacktestEvent,
} from "@/features/backtest/api/backtests-queries"
import { computeStats } from "@/features/backtest/lib/compute-stats"
import { groupLifecycles } from "@/features/backtest/lib/group-lifecycles"
import { computeBankrollCurve } from "@/features/backtest/lib/compute-bankroll-curve"
import { hasCompleteCore, toAccountRules } from "@/features/backtest/types"
import { computeAccountState } from "@/features/backtest/lib/compute-account-state"
import { readAllLifecycleSessions } from "@/features/backtest/lib/read-all-lifecycle-sessions"
import { deriveLifecycleStatus, isLifecycleLive, BREACH_ANIM_MS } from "@/features/backtest/lib/compute-lifecycle-status"
import { BacktestEventForm } from "./backtest-event-form"
import { BacktestUndoButton } from "./backtest-undo-button"
import { BacktestLifecycleTable } from "./backtest-lifecycle-table"
import { BacktestStatsPanel } from "./backtest-stats-panel"
import { BacktestStatusLegend } from "./backtest-status-legend"
import { BacktestBankrollChart } from "./backtest-bankroll-chart"
import { EditBacktestMetaDialog } from "./edit-backtest-meta-dialog"
import { BacktestMetaHeader } from "./backtest-meta-header"
import { BalanceTrackerEmptyState } from "./balance-tracker-empty-state"
import { BalanceTracker } from "./balance-tracker"
import type { Lifecycle } from "@/features/backtest/types"

type Props = {
  id: string
}

export function BacktestDetailPage({ id }: Props) {
  const { t } = useTranslation("backtest")
  const { data: backtest, isLoading: btLoading } = useBacktest(id)
  const { data: events, isLoading: evLoading } = useBacktestEvents(id)
  const [renameOpen, setRenameOpen] = useState(false)

  // ---------------------------------------------------------------------------
  // Multi-account orchestration state (ADR-7, REQ-MA-ORCH-01..05)
  // ---------------------------------------------------------------------------

  const [selectedLifecycleId, setSelectedLifecycleId] = useState<string | null>(null)
  // Track which lifecycle ids are currently animating breach (BREACH_ANIM_MS timer)
  const [breachingIds, setBreachingIds] = useState<Set<string>>(new Set())

  const isLoading = btLoading || evLoading
  const eventsArr = events ?? []

  const stats = useMemo(() => {
    if (!backtest) return null
    return computeStats(eventsArr, backtest)
  }, [eventsArr, backtest])

  const lifecycles = useMemo(() => groupLifecycles(eventsArr), [eventsArr])

  // Read all lifecycle sessions and compute per-lifecycle account state
  const allSessions = useMemo(() => readAllLifecycleSessions(id, lifecycles), [id, lifecycles])

  // Build enriched lifecycles with breach info and full status
  const enrichedLifecycles = useMemo(() => {
    if (!backtest || !hasCompleteCore(backtest)) return lifecycles.map(lc => ({
      lifecycle: lc,
      breached: false,
      isLive: true,
      status: lc.status,
    }))

    const rules = toAccountRules(backtest)
    return lifecycles.map(lc => {
      const session = allSessions.get(lc.evalEvent.id)
      const phase = lc.fundedEvent ? "funded" : "eval"
      const days = phase === "funded" ? (session?.funded ?? []) : (session?.eval ?? [])
      const accountState = computeAccountState(rules, phase, days)
      const breached = accountState.final.breached
      const status = deriveLifecycleStatus(lc, breached)
      return {
        lifecycle: lc,
        breached,
        isLive: isLifecycleLive(breached),
        status,
      }
    })
  }, [backtest, lifecycles, allSessions])

  // Live lifecycles (not breached) — these appear in chips + are selectable
  const liveLifecycles = useMemo(
    () => enrichedLifecycles.filter(el => el.isLive).map(el => el.lifecycle),
    [enrichedLifecycles],
  )

  // Lifecycle table shows ALL lifecycles with terminal status
  const lifecyclesWithStatus = useMemo(
    () => enrichedLifecycles.map(el => ({ ...el.lifecycle, status: el.status })) as Lifecycle[],
    [enrichedLifecycles],
  )

  // Initialize selectedLifecycleId to the LAST live lifecycle (most recently created live)
  useEffect(() => {
    if (selectedLifecycleId !== null) return // already set
    const lastLive = liveLifecycles[liveLifecycles.length - 1]
    if (lastLive) {
      setSelectedLifecycleId(lastLive.evalEvent.lifecycle_id ?? lastLive.evalEvent.id)
    }
  }, [liveLifecycles, selectedLifecycleId])

  // Breach detection: when a previously-live lifecycle becomes breached, animate then jump selection
  useEffect(() => {
    enrichedLifecycles.forEach(el => {
      const lcId = el.lifecycle.evalEvent.lifecycle_id ?? el.lifecycle.evalEvent.id
      if (el.breached && !breachingIds.has(lcId)) {
        // Newly breached — start animation, schedule selection jump after BREACH_ANIM_MS
        setBreachingIds(prev => new Set([...prev, lcId]))

        // If this was the selected lifecycle, jump selection immediately (DESIGN ADR-8 says
        // selection jump is at breach detection, not after animation)
        if (selectedLifecycleId === lcId) {
          const nextLive = liveLifecycles.find(lc => {
            const candidateId = lc.evalEvent.lifecycle_id ?? lc.evalEvent.id
            return candidateId !== lcId
          })
          setSelectedLifecycleId(nextLive ? (nextLive.evalEvent.lifecycle_id ?? nextLive.evalEvent.id) : null)
        }

        // Remove from breachingIds after animation completes
        setTimeout(() => {
          setBreachingIds(prev => {
            const next = new Set(prev)
            next.delete(lcId)
            return next
          })
        }, BREACH_ANIM_MS)
      }
    })
  }, [enrichedLifecycles]) // eslint-disable-line react-hooks/exhaustive-deps

  const appendEvent = useAppendBacktestEvent(id)

  const handleNewEval = useCallback(async () => {
    const newLcId = crypto.randomUUID()
    await appendEvent.mutateAsync({ input: { type: "E" }, lifecycleId: newLcId })
    // Optimistically pre-select the new account before refetch
    setSelectedLifecycleId(newLcId)
  }, [appendEvent])

  const handleSelect = useCallback((lcId: string) => {
    setSelectedLifecycleId(lcId)
  }, [])

  const bankrollCurve = useMemo(() => {
    if (!backtest) return []
    return computeBankrollCurve(eventsArr, backtest)
  }, [eventsArr, backtest])

  const lastEvent = eventsArr.length > 0 ? eventsArr[eventsArr.length - 1] : null

  if (isLoading) {
    return (
      <>
        <AppHeader title={t("title")} />
        <main className="flex-1 p-4 md:p-6">
          <div className="h-48 animate-pulse rounded-xl bg-muted/30" />
        </main>
      </>
    )
  }

  if (!backtest) {
    return (
      <>
        <AppHeader title={t("title")} />
        <main className="flex-1 p-4 md:p-6">
          <EmptyState
            title={t("detail.notFound.title")}
            description={t("detail.notFound.description")}
          />
        </main>
      </>
    )
  }

  const isGameOver = stats?.isGameOver ?? false

  return (
    <>
      <AppHeader
        title={backtest.name}
        description={t("detail.description")}
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {/* Edit + Meta header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <BacktestMetaHeader backtest={backtest} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRenameOpen(true)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {t("detail.editButton")}
          </Button>
        </div>

        {/* Game-over banner (Amendment 2) */}
        {isGameOver && (
          <div className="flex items-start gap-3 rounded-md border border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {t("detail.gameOver.title")}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {t("detail.gameOver.description")}
              </p>
            </div>
          </div>
        )}

        {/* Three-column layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Left column:
              - tracking ON (rules set): bankroll chart + tracker (drives events, undo inside)
              - tracking OFF: manual Record-event form + undo (legacy flow) */}
          <div className="space-y-3">
            {hasCompleteCore(backtest) ? (
              <>
                <BacktestBankrollChart
                  data={bankrollCurve}
                  initialBankroll={Number(backtest.bankroll_initial)}
                />
                {/* Balance tracker — controlled child */}
                <BalanceTracker
                  backtest={backtest}
                  rules={toAccountRules(backtest)}
                  events={eventsArr}
                  selectedLifecycleId={selectedLifecycleId}
                  onSelect={handleSelect}
                  onNewEval={handleNewEval}
                />
              </>
            ) : (
              <>
                <Card className="gap-3 px-4 py-3.5">
                  <p className="text-sm font-medium text-muted-foreground border-b pb-2">
                    {t("detail.recordEvent")}
                  </p>
                  <BacktestEventForm
                    backtestId={id}
                    lastEvent={lastEvent}
                    isGameOver={isGameOver}
                  />
                  <BacktestUndoButton
                    backtestId={id}
                    events={eventsArr}
                    lifecycleId={lastEvent?.lifecycle_id ?? ""}
                  />
                </Card>
                <BacktestBankrollChart
                  data={bankrollCurve}
                  initialBankroll={Number(backtest.bankroll_initial)}
                />
                <BalanceTrackerEmptyState />
              </>
            )}
          </div>

          {/* Center: Lifecycle table + legend */}
          <div className="space-y-3">
            {/* Lifecycle panel header with "New evaluation" button (REQ-MA-NEW-01) */}
            <Card className="gap-3 px-4 py-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("lifecycle.count_other", { count: lifecyclesWithStatus.length })}
                </p>
                {hasCompleteCore(backtest) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={handleNewEval}
                    disabled={appendEvent.isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("lifecycle.newEval")}
                  </Button>
                )}
              </div>
              <BacktestLifecycleTable
                lifecycles={lifecyclesWithStatus}
                evalCost={Number(backtest.eval_cost)}
              />
            </Card>
            <BacktestStatusLegend />
          </div>

          {/* Right: Stats panel */}
          {stats && <BacktestStatsPanel stats={stats} />}
        </div>

      </main>

      <EditBacktestMetaDialog
        backtest={backtest}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </>
  )
}
