import { useState } from "react"
import { FlaskConical } from "lucide-react"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import { CreateBacktestDialog } from "./create-backtest-dialog"

export function BacktestEmptyState() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <EmptyState
        icon={<FlaskConical className="h-5 w-5" />}
        title="No backtests yet"
        description="Create your first backtest to start simulating evaluation runs."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Create backtest
          </Button>
        }
      />
      <CreateBacktestDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
