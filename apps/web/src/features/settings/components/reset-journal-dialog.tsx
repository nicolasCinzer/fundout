import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AlertTriangle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useResetJournal } from "@/features/settings/api/settings-queries"

type ResetJournalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetJournalDialog({
  open,
  onOpenChange,
}: ResetJournalDialogProps) {
  const { t } = useTranslation("settings")
  const mutation = useResetJournal()
  const [confirmText, setConfirmText] = useState("")
  const confirmPhrase = t("resetDialog.confirmPhrase")
  const canSubmit = confirmText === confirmPhrase && !mutation.isPending

  useEffect(() => {
    if (open) setConfirmText("")
  }, [open])

  const handleSubmit = () => {
    if (!canSubmit) return
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("resetDialog.toasts.success"))
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || t("resetDialog.toasts.error"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("resetDialog.title")}</DialogTitle>
          <DialogDescription>{t("resetDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {t("resetDialog.willDelete")}
            </div>
            <ul className="ml-6 list-disc text-sm text-muted-foreground">
              <li>{t("resetDialog.items.evaluations")}</li>
              <li>{t("resetDialog.items.fundedAccounts")}</li>
              <li>{t("resetDialog.items.payouts")}</li>
            </ul>
          </div>

          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              {t("resetDialog.willKeep")}
            </div>
            <ul className="ml-6 list-disc text-sm text-muted-foreground">
              <li>{t("resetDialog.items.backtests")}</li>
              <li>{t("resetDialog.items.profile")}</li>
            </ul>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reset-confirm">
              {t("resetDialog.confirmLabel", { phrase: `"${confirmPhrase}"` })}
            </Label>
            <Input
              id="reset-confirm"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("resetDialog.confirmPlaceholder")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t("resetDialog.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {mutation.isPending
              ? t("resetDialog.submitting")
              : t("resetDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
