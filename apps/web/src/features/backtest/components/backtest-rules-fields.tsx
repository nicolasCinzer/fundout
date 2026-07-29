import type { Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// ---------------------------------------------------------------------------
// BacktestRulesFields
//
// Shared rules field markup for both create-backtest-dialog (optional section)
// and any future read-only view. Accepts an RHF control and a disabled flag.
//
// Renders: CORE section + eval optional section + funded optional section.
// No dialog wrapper — compose inside the parent form.
// ---------------------------------------------------------------------------

// The form value shape expected by these fields (strings, as RHF always provides)
export type RulesFormValues = {
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

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  disabled?: boolean
}

export function BacktestRulesFields({ control, disabled = false }: Props) {
  const { t } = useTranslation("backtest")

  return (
    <div className="space-y-5">
      {/* CORE section */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("tracker.rules.sections.core")}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name="dd_starting_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tracker.rules.fields.dd_starting_balance")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="50000"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="dd_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tracker.rules.fields.dd_amount")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="2000"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name="dd_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tracker.rules.fields.dd_type")}</FormLabel>
                <Select
                  disabled={disabled}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EOD">
                      {t("tracker.rules.fields.dd_type_eod")}
                    </SelectItem>
                    <SelectItem value="Intraday">
                      {t("tracker.rules.fields.dd_type_intraday")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="eval_profit_target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tracker.rules.fields.eval_profit_target")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="3000"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Eval optional section */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("tracker.rules.sections.evalOptional")}
        </p>

        <FormField
          control={control}
          name="eval_consistency_pct"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tracker.rules.fields.eval_consistency_pct")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  placeholder="0.30"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name="eval_min_profit_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tracker.rules.fields.eval_min_profit_days")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="5"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="eval_min_profit_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tracker.rules.fields.eval_min_profit_amount")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="50"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Funded optional section */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("tracker.rules.sections.fundedOptional")}
        </p>

        <FormField
          control={control}
          name="funded_consistency_pct"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tracker.rules.fields.funded_consistency_pct")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  placeholder="0.40"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name="funded_min_profit_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tracker.rules.fields.funded_min_profit_days")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="5"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="funded_min_profit_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tracker.rules.fields.funded_min_profit_amount")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="50"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}
