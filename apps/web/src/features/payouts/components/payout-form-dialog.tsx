import type { Dispatch, SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PayoutForm } from "@/features/payouts/components/payout-form"

type PayoutFormDialogProps = {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  fundedAccountId: string
  startDate: string
  propfirmName?: string | null
}

export function PayoutFormDialog({
  open,
  onOpenChange,
  fundedAccountId,
  startDate,
  propfirmName,
}: PayoutFormDialogProps) {
  const { t } = useTranslation("payouts")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dialog.new.title")}</DialogTitle>
          <DialogDescription>
            {propfirmName
              ? t("dialog.new.descriptionWithName", { name: propfirmName })
              : t("dialog.new.description")}
          </DialogDescription>
        </DialogHeader>
        <PayoutForm
          fundedAccountId={fundedAccountId}
          startDate={startDate}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
