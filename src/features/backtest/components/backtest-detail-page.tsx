import { useMemo, useState } from "react"
import { AlertTriangle, Pencil } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/common/app-header"
import { EmptyState } from "@/components/common/empty-state"
import {
  useBacktest,
  useBacktestEvents,
} from "@/features/backtest/api/backtests-queries"
import { computeStats } from "@/features/backtest/lib/compute-stats"
import { groupLifecycles } from "@/features/backtest/lib/group-lifecycles"
import { computeBankrollCurve } from "@/features/backtest/lib/compute-bankroll-curve"
import { BacktestEventForm } from "./backtest-event-form"
import { BacktestUndoButton } from "./backtest-undo-button"
import { BacktestLifecycleTable } from "./backtest-lifecycle-table"
import { BacktestStatsPanel } from "./backtest-stats-panel"
import { BacktestStatusLegend } from "./backtest-status-legend"
import { BacktestBankrollChart } from "./backtest-bankroll-chart"
import { EditBacktestMetaDialog } from "./edit-backtest-meta-dialog"
import { BacktestMetaHeader } from "./backtest-meta-header"

type Props = {
  id: string
}

export function BacktestDetailPage({ id }: Props) {
  const { data: backtest, isLoading: btLoading } = useBacktest(id)
  const { data: events, isLoading: evLoading } = useBacktestEvents(id)
  const [renameOpen, setRenameOpen] = useState(false)

  const isLoading = btLoading || evLoading
  const eventsArr = events ?? []

  const stats = useMemo(() => {
    if (!backtest) return null
    return computeStats(eventsArr, backtest)
  }, [eventsArr, backtest])

  const lifecycles = useMemo(() => groupLifecycles(eventsArr), [eventsArr])

  const bankrollCurve = useMemo(() => {
    if (!backtest) return []
    return computeBankrollCurve(eventsArr, backtest)
  }, [eventsArr, backtest])

  const lastEvent = eventsArr.length > 0 ? eventsArr[eventsArr.length - 1] : null

  if (isLoading) {
    return (
      <>
        <AppHeader title="Backtest" />
        <main className="flex-1 p-4 md:p-6">
          <div className="h-48 animate-pulse rounded-xl bg-muted/30" />
        </main>
      </>
    )
  }

  if (!backtest) {
    return (
      <>
        <AppHeader title="Backtest" />
        <main className="flex-1 p-4 md:p-6">
          <EmptyState
            title="Backtest not found"
            description="This backtest does not exist or you don't have access."
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
        description="Backtest detail"
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
            Edit
          </Button>
        </div>

        {/* Game-over banner (Amendment 2) */}
        {isGameOver && (
          <div className="flex items-start gap-3 rounded-md border border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Your simulation has ended.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Review your strategy — it performs worse than random. You can undo events to explore alternative scenarios.
              </p>
            </div>
          </div>
        )}

        {/* Three-column layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Left: Event form + Undo + Bankroll chart */}
          <div className="space-y-3">
            <Card className="gap-3 px-4 py-3.5">
              <p className="text-sm font-medium text-muted-foreground border-b pb-2">
                Record event
              </p>
              <BacktestEventForm
                backtestId={id}
                lastEvent={lastEvent}
                isGameOver={isGameOver}
              />
              <BacktestUndoButton backtestId={id} events={eventsArr} />
            </Card>
            <BacktestBankrollChart
              data={bankrollCurve}
              initialBankroll={Number(backtest.bankroll_initial)}
            />
          </div>

          {/* Center: Lifecycle table + legend */}
          <div className="space-y-3">
            <Card className="gap-3 px-4 py-3.5">
              <p className="text-sm font-medium text-muted-foreground border-b pb-2">
                Lifecycles{" "}
                <span className="text-muted-foreground/70">({lifecycles.length})</span>
              </p>
              <BacktestLifecycleTable
                lifecycles={lifecycles}
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
