import { useState, type ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ConfirmDeleteProps = {
  trigger: ReactNode
  title?: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
  pending?: boolean
}

export function ConfirmDelete({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending = false,
}: ConfirmDeleteProps) {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)

  const resolvedTitle = title ?? t("confirmDelete.title")
  const resolvedConfirmLabel = confirmLabel ?? t("confirmDelete.confirmLabel")

  const handleConfirm = async () => {
    await onConfirm()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            {resolvedTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t("confirmDelete.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? t("confirmDelete.deleting") : resolvedConfirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
