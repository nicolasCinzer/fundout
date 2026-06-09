import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
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
import { Textarea } from "@/components/ui/textarea"
import { useLogEvaluationReset } from "@/features/evaluations/api/evaluations-queries"
import {
  resetFormSchema,
  type ResetFormInput,
  type ResetFormValues,
} from "@/features/evaluations/schemas/reset-form-schema"

type LogResetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  evaluationId: string
  propfirmName?: string | null
}

export function LogResetDialog({
  open,
  onOpenChange,
  evaluationId,
  propfirmName,
}: LogResetDialogProps) {
  const { t } = useTranslation(["evaluations", "common"])
  const mutation = useLogEvaluationReset()

  const form = useForm<ResetFormInput, undefined, ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      fee: 60,
      reset_at: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  })

  // Reset the form when the dialog re-opens so each invocation is fresh.
  useEffect(() => {
    if (open) {
      form.reset({
        fee: 60,
        reset_at: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      })
    }
  }, [open, form])

  const onSubmit = (values: ResetFormValues) => {
    mutation.mutate(
      {
        evaluation_id: evaluationId,
        fee: values.fee,
        reset_at: values.reset_at,
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          toast.success(t("evaluations:logReset.toasts.logged"))
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message || t("evaluations:logReset.toasts.errorLog"))
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("evaluations:logReset.title")}</DialogTitle>
          <DialogDescription>
            {propfirmName
              ? t("evaluations:logReset.descriptionWithName", { name: propfirmName })
              : t("evaluations:logReset.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => {
                  const { value, ...rest } = field
                  return (
                    <FormItem>
                      <FormLabel>{t("evaluations:logReset.fields.resetFee")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="60.00"
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
                name="reset_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("evaluations:logReset.fields.resetDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("evaluations:logReset.fields.notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={t("evaluations:logReset.fields.notesPlaceholder")}
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
                disabled={mutation.isPending}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t("evaluations:logReset.submit.saving") : t("evaluations:logReset.submit.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
