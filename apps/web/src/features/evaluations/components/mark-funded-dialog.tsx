import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { z } from "zod"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
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
import {
  useMarkEvaluationFunded,
  useUndoMarkEvaluationFunded,
  type Evaluation,
} from "@/features/evaluations/api/evaluations-queries"

const schema = z.object({
  funded_at: z
    .string()
    .min(1, "Pick a date")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
})

type FormValues = z.infer<typeof schema>

type MarkFundedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  evaluation: Evaluation
}

export function MarkFundedDialog({
  open,
  onOpenChange,
  evaluation,
}: MarkFundedDialogProps) {
  const { t } = useTranslation(["evaluations", "common"])
  const markFunded = useMarkEvaluationFunded()
  const undoMarkFunded = useUndoMarkEvaluationFunded()
  const today = format(new Date(), "yyyy-MM-dd")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { funded_at: today },
  })

  useEffect(() => {
    if (open) form.reset({ funded_at: today })
  }, [open, form, today])

  const onSubmit = (values: FormValues) => {
    if (values.funded_at < evaluation.purchase_date) {
      form.setError("funded_at", {
        message: t("evaluations:markFunded.errors.dateBeforePurchase"),
      })
      return
    }
    if (values.funded_at > today) {
      form.setError("funded_at", { message: t("evaluations:markFunded.errors.dateInFuture") })
      return
    }
    markFunded.mutate(
      { evaluationId: evaluation.id, fundedAt: values.funded_at },
      {
        onSuccess: (fundedAccount) => {
          onOpenChange(false)
          toast.success(t("evaluations:markFunded.toasts.marked"), {
            duration: 6000,
            action: {
              label: t("common:actions.undo"),
              onClick: () => {
                undoMarkFunded.mutate(
                  {
                    evaluationId: evaluation.id,
                    fundedAccountId: fundedAccount.id,
                  },
                  {
                    onSuccess: () => toast.success(t("evaluations:markFunded.toasts.undone"), { duration: 3000 }),
                    onError: (e) =>
                      toast.error(
                        e.message ||
                          t("evaluations:markFunded.toasts.errorUndo"),
                      ),
                  },
                )
              },
            },
          })
        },
        onError: (e) => toast.error(e.message || t("evaluations:markFunded.toasts.errorMark")),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("evaluations:markFunded.title")}</DialogTitle>
          <DialogDescription>
            {t("evaluations:markFunded.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="funded_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("evaluations:markFunded.fields.fundedOn")}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={evaluation.purchase_date}
                      max={today}
                      autoFocus
                      {...field}
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
                disabled={markFunded.isPending}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button type="submit" disabled={markFunded.isPending}>
                {markFunded.isPending ? t("evaluations:markFunded.submit.saving") : t("evaluations:markFunded.submit.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
