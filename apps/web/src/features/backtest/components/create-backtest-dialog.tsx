import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ChevronDown, ChevronRight } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { backtestCreateSchema } from "@/features/backtest/schemas/backtest-form-schema"
import { accountRulesSchema } from "@/features/backtest/schemas/account-rules-schema"
import { BacktestRulesFields } from "@/features/backtest/components/backtest-rules-fields"
import { useTranslation } from "react-i18next"
import { useCreateBacktest } from "@/features/backtest/api/backtests-queries"

// ---------------------------------------------------------------------------
// CreateBacktestDialog
//
// RHF + manual safeParse at submit (project convention — no zodResolver).
// The rules section is OPTIONAL (collapsed by default). If the user leaves the
// entire rules section empty → create without rules (nulls). If partially
// filled → surface the refinement errors via form.setError.
// ---------------------------------------------------------------------------

type BaseFormValues = {
  name: string
  bankroll_initial: string
  eval_cost: string
  asset: string
  period: string
  strategy: string
}

type RulesFormValues = {
  dd_starting_balance: string
  dd_amount: string
  dd_type: string
  eval_profit_target: string
  eval_consistency_pct: string
  eval_min_profit_days: string
  eval_min_profit_amount: string
  funded_consistency_pct: string
  funded_min_profit_days: string
  funded_min_profit_amount: string
}

type FormValues = BaseFormValues & RulesFormValues

type Props = {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
}

export function CreateBacktestDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation("backtest")
  const navigate = useNavigate()
  const createMutation = useCreateBacktest()
  const [rulesExpanded, setRulesExpanded] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      bankroll_initial: "10000",
      eval_cost: "100",
      asset: "",
      period: "",
      strategy: "",
      dd_starting_balance: "",
      dd_amount: "",
      dd_type: "",
      eval_profit_target: "",
      eval_consistency_pct: "",
      eval_min_profit_days: "",
      eval_min_profit_amount: "",
      funded_consistency_pct: "",
      funded_min_profit_days: "",
      funded_min_profit_amount: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    // Validate base fields
    const baseResult = backtestCreateSchema.safeParse({
      name: values.name,
      bankroll_initial: values.bankroll_initial,
      eval_cost: values.eval_cost,
      asset: values.asset || undefined,
      period: values.period || undefined,
      strategy: values.strategy || undefined,
    })
    if (!baseResult.success) {
      for (const issue of baseResult.error.issues) {
        const field = issue.path[0] as keyof BaseFormValues | undefined
        if (field) {
          form.setError(field, { message: issue.message })
        }
      }
      return
    }

    // Validate optional rules (normalize empty strings → null)
    const normalized = {
      dd_starting_balance: values.dd_starting_balance || null,
      dd_amount: values.dd_amount || null,
      dd_type: values.dd_type || null,
      eval_profit_target: values.eval_profit_target || null,
      eval_consistency_pct: values.eval_consistency_pct || null,
      eval_min_profit_days: values.eval_min_profit_days || null,
      eval_min_profit_amount: values.eval_min_profit_amount || null,
      funded_consistency_pct: values.funded_consistency_pct || null,
      funded_min_profit_days: values.funded_min_profit_days || null,
      funded_min_profit_amount: values.funded_min_profit_amount || null,
    }
    const rulesResult = accountRulesSchema.safeParse(normalized)
    if (!rulesResult.success) {
      const issues = rulesResult.error.issues
      for (const issue of issues) {
        const field = issue.path[0] as keyof RulesFormValues | undefined
        if (field) {
          form.setError(field, { message: issue.message })
        }
      }
      // Expand the rules section so the user can see the errors
      setRulesExpanded(true)
      toast.error(issues[0]?.message ?? t("tracker.rules.validationError"))
      return
    }

    try {
      const created = await createMutation.mutateAsync({
        ...baseResult.data,
        ...rulesResult.data,
      })
      form.reset()
      setRulesExpanded(false)
      onOpenChange(false)
      navigate({ to: "/backtest/$id", params: { id: created.id } })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.errorSave"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("form.new.title")}</DialogTitle>
          <DialogDescription>
            {t("form.newDescription")}
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
                    <Input
                      placeholder="Ej: FTMO 100K — Julio"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="bankroll_initial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.initialBankroll")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="10000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eval_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.evalCost")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0.01}
                        step="0.01"
                        placeholder="100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional metadata */}
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
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account rules — optional collapsible section */}
            <div className="rounded-md border">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setRulesExpanded((v) => !v)}
              >
                <span>{t("tracker.rules.createSection")}</span>
                {rulesExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </button>
              {rulesExpanded && (
                <div className="border-t px-3 py-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t("tracker.rules.createSectionHint")}
                  </p>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <BacktestRulesFields control={form.control as any} />
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                {t("form.submit.cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("form.submit.creating") : t("form.submit.create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
