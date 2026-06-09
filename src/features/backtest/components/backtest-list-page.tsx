import { useState } from "react"
import { FlaskConical } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AppHeader } from "@/components/common/app-header"
import { Button } from "@/components/ui/button"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { useBacktestsWithStats } from "@/features/backtest/api/backtests-queries"
import { BacktestCard } from "./backtest-card"
import { BacktestEmptyState } from "./backtest-empty-state"
import { CreateBacktestDialog } from "./create-backtest-dialog"

export function BacktestListPage() {
  const { t } = useTranslation("backtest")
  const { data, isLoading } = useBacktestsWithStats()
  const [createOpen, setCreateOpen] = useState(false)
  const items = data ?? []

  return (
    <>
      <AppHeader
        title={t("title")}
        description={t("description")}
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-end">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <FlaskConical className="mr-2 h-4 w-4" />
            {t("list.createButton")}
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton columns={3} rows={4} />
        ) : items.length === 0 ? (
          <BacktestEmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ backtest, stats }) => (
              <BacktestCard key={backtest.id} backtest={backtest} stats={stats} />
            ))}
          </div>
        )}
      </main>
      <CreateBacktestDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
