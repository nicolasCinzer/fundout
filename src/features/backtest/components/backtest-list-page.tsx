import { useState } from "react"
import { FlaskConical } from "lucide-react"
import { AppHeader } from "@/components/common/app-header"
import { Button } from "@/components/ui/button"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { useBacktests } from "@/features/backtest/api/backtests-queries"
import { BacktestCard } from "./backtest-card"
import { BacktestEmptyState } from "./backtest-empty-state"
import { CreateBacktestDialog } from "./create-backtest-dialog"

export function BacktestListPage() {
  const { data, isLoading } = useBacktests()
  const [createOpen, setCreateOpen] = useState(false)
  const backtests = data ?? []

  return (
    <>
      <AppHeader
        title="Backtest"
        description="Simulate evaluation runs and measure outcomes."
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-end">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <FlaskConical className="mr-2 h-4 w-4" />
            New backtest
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton columns={3} rows={4} />
        ) : backtests.length === 0 ? (
          <BacktestEmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {backtests.map((bt) => (
              <BacktestCard
                key={bt.id}
                backtest={bt}
                // isGameOver: list page does not fetch events per-card (lean).
                // Badge shows only after user visits detail page (cache hit).
                // This is a documented limitation — game over is always shown on detail.
                isGameOver={false}
              />
            ))}
          </div>
        )}
      </main>
      <CreateBacktestDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
