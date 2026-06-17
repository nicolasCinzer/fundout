import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
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
  /** Funded account's start_date — payouts cannot be dated before this. */
  startDate: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PayoutForm({
  fundedAccountId,
  startDate,
  onSuccess,
  onCancel,
}: PayoutFormProps) {
  const { t } = useTranslation(["payouts", "common"])
  const createMutation = useCreatePayout()
  const today = format(new Date(), "yyyy-MM-dd")

  const form = useForm<PayoutFormInput, undefined, PayoutFormValues>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: {
      funded_account_id: fundedAccountId,
      amount: 1000,
      fee_taken: 0,
      paid_at: today,
      notes: "",
    },
  })

  const onSubmit = (values: PayoutFormValues) => {
    if (values.paid_at < startDate) {
      form.setError("paid_at", {
        message: t("errors.dateBeforeStart"),
      })
      return
    }
    if (values.paid_at > today) {
      form.setError("paid_at", {
        message: t("errors.dateInFuture"),
      })
      return
    }
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
          toast.success(t("toasts.recorded"))
          form.reset()
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || t("toasts.errorSave"))
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
                  <FormLabel>{t("form.fields.amount")}</FormLabel>
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
                  <FormLabel>{t("form.fields.fee")}</FormLabel>
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
              <FormLabel>{t("form.fields.paidOn")}</FormLabel>
              <FormControl>
                <Input type="date" min={startDate} max={today} {...field} />
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
              <FormLabel>{t("form.fields.notes")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("form.fields.notesPlaceholder")}
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
              {t("common:actions.cancel")}
            </Button>
          ) : null}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t("payouts:form.submit.saving") : t("payouts:form.submit.record")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
