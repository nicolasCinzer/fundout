import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
  payoutFormSchema,
  type PayoutFormInput,
  type PayoutFormValues,
} from "@/features/payouts/schemas/payout-form-schema"
import { useCreatePayout } from "@/features/payouts/api/payouts-queries"

type PayoutFormProps = {
  /** Funded account this payout belongs to. Required — payouts always derive
   *  from drilling into a funded account row. */
  fundedAccountId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PayoutForm({
  fundedAccountId,
  onSuccess,
  onCancel,
}: PayoutFormProps) {
  const createMutation = useCreatePayout()

  const form = useForm<PayoutFormInput, undefined, PayoutFormValues>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: {
      funded_account_id: fundedAccountId,
      amount: 1000,
      fee_taken: 0,
      paid_at: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  })

  const onSubmit = (values: PayoutFormValues) => {
    createMutation.mutate(
      {
        funded_account_id: fundedAccountId,
        amount: values.amount,
        fee_taken: values.fee_taken,
        paid_at: values.paid_at,
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Payout recorded")
          form.reset()
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || "Could not save the payout.")
        },
      },
    )
  }

  return (
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
                      placeholder="1000.00"
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
                      placeholder="0.00"
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
                  placeholder="Method, exchange rate, anything to remember…"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving…" : "Record payout"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
