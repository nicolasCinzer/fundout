import { toast } from "sonner"
import { Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { useUndoLastBacktestEvent } from "@/features/backtest/api/backtests-queries"
import type { BacktestEvent } from "@/features/backtest/types"

type Props = {
  backtestId: string
  events: BacktestEvent[]
  // NOTE: isGameOver is intentionally NOT a prop here.
  // Undo MUST remain available even when game is over (Amendment 2 requirement).
}

export function BacktestUndoButton({ backtestId, events }: Props) {
  const undoMutation = useUndoLastBacktestEvent(backtestId)
  const last = events.length > 0 ? events[events.length - 1] : null

  const handleUndo = async () => {
    try {
      await undoMutation.mutateAsync()
      toast.success("Evento deshecho")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo deshacer.")
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
          Deshacer último evento
        </Button>
      }
      title="¿Deshacer el último evento?"
      description={
        last
          ? `Se eliminará el evento ${last.type} en posición ${last.position}. Esta acción no se puede revertir.`
          : "No hay eventos para deshacer."
      }
      confirmLabel="Deshacer"
      pending={undoMutation.isPending}
      onConfirm={handleUndo}
    />
  )
}
