import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
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

  const { t } = useTranslation("evaluations")
  const isEdit = !!evaluation

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger || !isEdit ? (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t("form.submit.add")}
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("form.edit.title") : t("form.new.title")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("form.edit.description") : t("form.new.description")}
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
