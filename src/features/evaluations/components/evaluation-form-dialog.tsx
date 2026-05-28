import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EvaluationForm } from "@/features/evaluations/components/evaluation-form"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"

type EvaluationFormDialogProps = {
  trigger?: React.ReactNode
  evaluation?: Evaluation
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EvaluationFormDialog({
  trigger,
  evaluation,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EvaluationFormDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setUncontrolledOpen

  const isEdit = !!evaluation

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger || !isEdit ? (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New evaluation
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit evaluation" : "New evaluation"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this evaluation."
              : "Record a propfirm challenge you've purchased. You can edit details later as the evaluation progresses."}
          </DialogDescription>
        </DialogHeader>
        <EvaluationForm
          evaluation={evaluation}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
