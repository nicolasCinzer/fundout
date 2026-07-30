import { toast } from "sonner"
import { Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { useUndoLastBacktestEvent } from "@/features/backtest/api/backtests-queries"
import type { BacktestEvent } from "@/features/backtest/types"

type Props = {
  backtestId: string
  events: BacktestEvent[]
  /** The selected lifecycle's id — undo targets only this lifecycle's last event. */
  lifecycleId: string
  // NOTE: isGameOver is intentionally NOT a prop here.
  // Undo MUST remain available even when game is over (Amendment 2 requirement).
}

export function BacktestUndoButton({ backtestId, events, lifecycleId }: Props) {
  const { t } = useTranslation("backtest")
  const { t: tc } = useTranslation("common")
  const undoMutation = useUndoLastBacktestEvent(backtestId, lifecycleId)
  // Show undo as disabled if the selected lifecycle has no events
  const lcEvents = events.filter(ev => ev.lifecycle_id === lifecycleId)
  const last = lcEvents.length > 0 ? lcEvents.reduce((m, ev) => ev.position > m.position ? ev : m) : null

  const handleUndo = async () => {
    try {
      await undoMutation.mutateAsync()
      toast.success(t("event.undoneSuccess"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("errors.undoFailed"))
    }
  }

  return (
    <ConfirmDelete
      trigger={
        <Button
          variant="outline"
          className="w-full"
          disabled={!last || undoMutation.isPending}
        >
          <Undo2 className="mr-2 h-4 w-4" />
          {t("event.undo")}
        </Button>
      }
      title={t("event.undoConfirmTitle")}
      description={
        last
          ? t("event.undoConfirmDescription", { type: last.type, position: last.position })
          : t("event.undoNoEvents")
      }
      confirmLabel={tc("actions.undo")}
      pending={undoMutation.isPending}
      onConfirm={handleUndo}
    />
  )
}
