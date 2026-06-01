import { useFormContext, type ControllerRenderProps, type FieldPath } from 'react-hook-form'
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
  const { control, formState } = useFormContext<BankrollMcFormValues>()

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name="bankroll"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Bankroll ($)</FormLabel>
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
              <FormLabel className="text-xs">Costo por intento ($)</FormLabel>
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
              <FormLabel className="text-xs">Prob. de payout (%)</FormLabel>
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
              <FormLabel className="text-xs">Payout neto ($)</FormLabel>
              <FormControl>
                <NumberFieldInput field={field} min={0.01} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="targetBankroll"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Target bankroll ($, opcional)</FormLabel>
            <FormControl>
              <NumberFieldInput field={field} min={0.01} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" disabled={formState.isSubmitting} className="w-full">
        Calcular
      </Button>
    </form>
  )
}
