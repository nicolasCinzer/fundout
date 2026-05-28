import type { Dispatch, SetStateAction } from "react"
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payout</DialogTitle>
          <DialogDescription>
            {propfirmName
              ? `Log a withdrawal from your ${propfirmName} account.`
              : "Log a withdrawal from this funded account."}
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
