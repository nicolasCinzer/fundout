import { useFormContext, type ControllerRenderProps, type FieldPath } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { BankrollMcFormValues } from '../schema'

interface BankrollMcFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

type NumberFieldName = FieldPath<BankrollMcFormValues>

function NumberFieldInput({
  field,
  min,
  max,
}: {
  field: ControllerRenderProps<BankrollMcFormValues, NumberFieldName>
  min?: number
  max?: number
}) {
  const displayValue = field.value === undefined || field.value === null ? '' : String(field.value)
  return (
    <Input
      type="number"
      min={min}
      max={max}
      step="any"
      name={field.name}
      ref={field.ref}
      onBlur={field.onBlur}
      value={displayValue}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') {
          field.onChange(null)
          return
        }
        const parsed = Number(raw)
        field.onChange(Number.isNaN(parsed) ? null : parsed)
      }}
    />
  )
}

export function BankrollMcForm({ onSubmit }: BankrollMcFormProps) {
  const { t } = useTranslation('bankroll-mc')
  const { control, formState } = useFormContext<BankrollMcFormValues>()

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <h2 className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground">
          {t('form.simulationInputs')}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name="bankroll"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{t('form.fields.bankroll')}</FormLabel>
              <FormControl>
                <NumberFieldInput field={field} min={0.01} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{t('form.fields.costPerAttempt')}</FormLabel>
              <FormControl>
                <NumberFieldInput field={field} min={0.01} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name="payoutProbPct"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{t('form.fields.payoutProbability')}</FormLabel>
              <FormControl>
                <NumberFieldInput field={field} min={0.1} max={99.9} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="payoutNet"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{t('form.fields.netPayout')}</FormLabel>
              <FormControl>
                <NumberFieldInput field={field} min={0.01} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <FormField
          control={control}
          name="targetBankroll"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{t('form.fields.targetBankroll')}</FormLabel>
              <FormControl>
                <NumberFieldInput field={field} min={0.01} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={formState.isSubmitting} className="px-8">
          {formState.isSubmitting ? t('form.running') : t('form.submit')}
        </Button>
      </div>
      </form>
    </Card>
  )
}
