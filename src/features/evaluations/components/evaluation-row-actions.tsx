import { useState } from "react"
import {
  MoreHorizontal,
  CheckCircle2,
  Pencil,
  XCircle,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { EvaluationFormDialog } from "@/features/evaluations/components/evaluation-form-dialog"
import { LogResetDialog } from "@/features/evaluations/components/log-reset-dialog"
import {
  useDeleteEvaluation,
  useMarkEvaluationFunded,
  useUpdateEvaluationStatus,
  type Evaluation,
} from "@/features/evaluations/api/evaluations-queries"

type EvaluationRowActionsProps = {
  evaluation: Evaluation
}

export function EvaluationRowActions({ evaluation }: EvaluationRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const markFunded = useMarkEvaluationFunded()
  const updateStatus = useUpdateEvaluationStatus()
  const deleteEvaluation = useDeleteEvaluation()

  const isInProgress = evaluation.status === "in_progress"
  const isPending =
    markFunded.isPending || updateStatus.isPending || deleteEvaluation.isPending
  const propfirmName = evaluation.propfirm?.name ?? null

  const handleMarkFunded = () => {
    markFunded.mutate(evaluation.id, {
      onSuccess: () => toast.success("Marked as funded"),
      onError: (e) => toast.error(e.message || "Could not mark as funded"),
    })
  }

  const handleMarkFailed = () => {
    updateStatus.mutate(
      { id: evaluation.id, status: "failed" },
      {
        onSuccess: () => toast.success("Marked as failed"),
        onError: (e) => toast.error(e.message || "Could not update status"),
      },
    )
  }

  const handleDelete = async () => {
    await new Promise<void>((resolve, reject) => {
      deleteEvaluation.mutate(evaluation.id, {
        onSuccess: () => {
          toast.success("Evaluation deleted")
          resolve()
        },
        onError: (e) => {
          toast.error(e.message || "Could not delete")
          reject(e)
        },
      })
    })
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false)
              setEditDialogOpen(true)
            }}
            disabled={isPending}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isInProgress ? (
            <>
              <DropdownMenuItem onClick={handleMarkFunded} disabled={isPending}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Mark as funded
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMarkFailed} disabled={isPending}>
                <XCircle className="mr-2 h-4 w-4" />
                Mark as failed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setMenuOpen(false)
                  setResetDialogOpen(true)
                }}
                disabled={isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Log reset
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <ConfirmDelete
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            }
            title="Delete this evaluation?"
            description={
              evaluation.status === "passed"
                ? "This will also delete the linked funded account, any payouts recorded against it, and all reset events."
                : "This will permanently remove the evaluation and any reset events linked to it."
            }
            pending={deleteEvaluation.isPending}
            onConfirm={async () => {
              await handleDelete()
              setMenuOpen(false)
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <LogResetDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        evaluationId={evaluation.id}
        propfirmName={propfirmName}
      />
      <EvaluationFormDialog
        evaluation={evaluation}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  )
}
