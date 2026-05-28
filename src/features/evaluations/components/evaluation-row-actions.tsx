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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { EvaluationFormDialog } from "@/features/evaluations/components/evaluation-form-dialog"
import { LogResetDialog } from "@/features/evaluations/components/log-reset-dialog"
import { MarkFundedDialog } from "@/features/evaluations/components/mark-funded-dialog"
import {
  useDeleteEvaluation,
  useUpdateEvaluationStatus,
  useUndoMarkEvaluationFailed,
  type Evaluation,
} from "@/features/evaluations/api/evaluations-queries"

type EvaluationRowActionsProps = {
  evaluation: Evaluation
}

export function EvaluationRowActions({ evaluation }: EvaluationRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [fundedDialogOpen, setFundedDialogOpen] = useState(false)
  const updateStatus = useUpdateEvaluationStatus()
  const undoMarkFailed = useUndoMarkEvaluationFailed()
  const deleteEvaluation = useDeleteEvaluation()

  const isInProgress = evaluation.status === "in_progress"
  const isPending =
    updateStatus.isPending ||
    undoMarkFailed.isPending ||
    deleteEvaluation.isPending
  const propfirmName = evaluation.propfirm?.name ?? null

  const handleMarkFailed = () => {
    updateStatus.mutate(
      { id: evaluation.id, status: "failed" },
      {
        onSuccess: () => {
          toast.warning("Marked as failed", {
            duration: 6000,
            action: {
              label: "Undo",
              onClick: () => {
                undoMarkFailed.mutate(evaluation.id, {
                  onSuccess: () => toast.success("Undone", { duration: 3000 }),
                  onError: (e) =>
                    toast.error(e.message || "Undo failed"),
                })
              },
            },
          })
        },
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
      <div className="flex items-center justify-end gap-0.5">
        {isInProgress ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFundedDialogOpen(true)}
                  disabled={isPending}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="sr-only">Mark as funded</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as funded</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setResetDialogOpen(true)}
                  disabled={isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">Log reset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Log reset</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleMarkFailed}
                  disabled={isPending}
                >
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span className="sr-only">Mark as failed</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as failed</TooltipContent>
            </Tooltip>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
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
          </>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditDialogOpen(true)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
          </>
        )}
      </div>
      <LogResetDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        evaluationId={evaluation.id}
        propfirmName={propfirmName}
      />
      <MarkFundedDialog
        open={fundedDialogOpen}
        onOpenChange={setFundedDialogOpen}
        evaluation={evaluation}
      />
      <EvaluationFormDialog
        evaluation={evaluation}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  )
}
