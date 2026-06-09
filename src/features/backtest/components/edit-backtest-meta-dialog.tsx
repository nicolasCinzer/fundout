import type { Dispatch, SetStateAction } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button"
import {
  backtestUpdateSchema,
  type BacktestUpdateInput,
} from "@/features/backtest/schemas/backtest-form-schema"
import { useTranslation } from "react-i18next"
import { useUpdateBacktestMeta } from "@/features/backtest/api/backtests-queries"
import type { Backtest } from "@/features/backtest/types"

type Props = {
  backtest: Backtest
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
}

type FormValues = {
  name: string
  asset: string
  period: string
  strategy: string
}

export function EditBacktestMetaDialog({ backtest, open, onOpenChange }: Props) {
  const { t } = useTranslation("backtest")
  const updateMutation = useUpdateBacktestMeta()

  const form = useForm<FormValues>({
    defaultValues: {
      name: backtest.name,
      asset: backtest.asset ?? "",
      period: backtest.period ?? "",
      strategy: backtest.strategy ?? "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    const parsed = backtestUpdateSchema.safeParse(values)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input")
      return
    }
    const patch: BacktestUpdateInput = parsed.data
    try {
      await updateMutation.mutateAsync({ id: backtest.id, ...patch })
      toast.success(t("toasts.updated"))
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.errorSave"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("form.edit.title")}</DialogTitle>
          <DialogDescription>
            {t("form.edit.immutableNote")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.name")}</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="asset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.asset")}</FormLabel>
                    <FormControl>
                      <Input placeholder="NQ, ES, EUR/USD…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.period")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Q1 2024, Jan–Mar…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.strategy")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.fields.strategyPlaceholder")}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                {t("form.submit.cancel")}
              </Button>
              <Button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => void onSubmit(form.getValues())}
              >
                {updateMutation.isPending ? t("form.submit.saving") : t("form.submit.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
