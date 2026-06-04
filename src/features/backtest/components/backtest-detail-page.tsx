import { useMemo, useState } from "react"
import { AlertTriangle, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/common/app-header"
import { EmptyState } from "@/components/common/empty-state"
import {
  useBacktest,
  useBacktestEvents,
} from "@/features/backtest/api/backtests-queries"
import { computeStats } from "@/features/backtest/lib/compute-stats"
import { groupLifecycles } from "@/features/backtest/lib/group-lifecycles"
import { BacktestEventForm } from "./backtest-event-form"
import { BacktestUndoButton } from "./backtest-undo-button"
import { BacktestLifecycleTable } from "./backtest-lifecycle-table"
import { BacktestStatsPanel } from "./backtest-stats-panel"
import { RenameBacktestDialog } from "./rename-backtest-dialog"

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
            title="Backtest no encontrado"
            description="Este backtest no existe o no tenés acceso."
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
        description="Detalle de backtest"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {/* Rename button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRenameOpen(true)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Renombrar
          </Button>
        </div>

        {/* Game-over banner (Amendment 2) */}
        {isGameOver && (
          <div className="flex items-start gap-3 rounded-md border border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Tu simulación terminó.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Revisá tu estrategia — es peor que la aleatoriedad. Podés deshacer eventos para explorar escenarios alternativos.
              </p>
            </div>
          </div>
        )}

        {/* Three-column layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Left: Event form + Undo */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-medium">Registrar evento</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <BacktestEventForm
                  backtestId={id}
                  lastEvent={lastEvent}
                  isGameOver={isGameOver}
                />
                <BacktestUndoButton
                  backtestId={id}
                  events={eventsArr}
                />
              </CardContent>
            </Card>
          </div>

          {/* Center: Lifecycle table */}
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium">
                Lifecycles{" "}
                <span className="text-muted-foreground">({lifecycles.length})</span>
              </p>
            </CardHeader>
            <CardContent>
              <BacktestLifecycleTable
                lifecycles={lifecycles}
                evalCost={Number(backtest.eval_cost)}
              />
            </CardContent>
          </Card>

          {/* Right: Stats panel */}
          {stats && <BacktestStatsPanel stats={stats} />}
        </div>
      </main>

      <RenameBacktestDialog
        backtest={backtest}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </>
  )
}
