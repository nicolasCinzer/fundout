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
        title="Sin backtests"
        description="Todavía no tenés backtests. Creá uno para empezar a simular."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Crear backtest
          </Button>
        }
      />
      <CreateBacktestDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
