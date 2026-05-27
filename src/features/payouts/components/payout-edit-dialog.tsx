import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  payoutEditSchema,
  type PayoutEditInput,
  type PayoutEditValues,
} from "@/features/payouts/schemas/payout-form-schema"
import {
  useUpdatePayout,
  type Payout,
} from "@/features/payouts/api/payouts-queries"

type PayoutEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  payout: Payout
}

export function PayoutEditDialog({
  open,
  onOpenChange,
  payout,
}: PayoutEditDialogProps) {
  const updateMutation = useUpdatePayout()

  const form = useForm<PayoutEditInput, undefined, PayoutEditValues>({
    resolver: zodResolver(payoutEditSchema),
    defaultValues: {
      amount: Number(payout.amount),
      fee_taken: Number(payout.fee_taken),
      paid_at: payout.paid_at,
      notes: payout.notes ?? "",
    },
  })

  // When the dialog opens for a different payout, sync the form values.
  useEffect(() => {
    if (open) {
      form.reset({
        amount: Number(payout.amount),
        fee_taken: Number(payout.fee_taken),
        paid_at: payout.paid_at,
        notes: payout.notes ?? "",
      })
    }
  }, [open, payout.id, payout.amount, payout.fee_taken, payout.paid_at, payout.notes, form])

  const onSubmit = (values: PayoutEditValues) => {
    updateMutation.mutate(
      {
        id: payout.id,
        amount: values.amount,
        fee_taken: values.fee_taken,
        paid_at: values.paid_at,
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Payout updated")
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message || "Could not update the payout.")
        },
      },
    )
  }

  const propfirmName =
    payout.funded_account?.evaluation?.propfirm?.name ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit payout</DialogTitle>
          <DialogDescription>
            {propfirmName
              ? `Update the ${propfirmName} payout. Linked funded account stays the same.`
              : "Update this payout."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => {
                  const { value, ...rest } = field
                  return (
                    <FormItem>
                      <FormLabel>Amount (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          autoFocus
                          {...rest}
                          value={(value as number | string | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="fee_taken"
                render={({ field }) => {
                  const { value, ...rest } = field
                  return (
                    <FormItem>
                      <FormLabel>Fee (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          {...rest}
                          value={(value as number | string | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <FormField
              control={form.control}
              name="paid_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid on</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
