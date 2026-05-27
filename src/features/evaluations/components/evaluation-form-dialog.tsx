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

type EvaluationFormDialogProps = {
  trigger?: React.ReactNode
}

export function EvaluationFormDialog({ trigger }: EvaluationFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            New evaluation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New evaluation</DialogTitle>
          <DialogDescription>
            Record a propfirm challenge you've purchased. You can edit details
            later as the evaluation progresses.
          </DialogDescription>
        </DialogHeader>
        <EvaluationForm
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
