import { useFormContext } from 'react-hook-form'
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
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    field.onChange(isNaN(v) ? undefined : v)
                  }}
                />
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
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    field.onChange(isNaN(v) ? undefined : v)
                  }}
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
          name="payoutProbPct"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Prob. de payout (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0.1}
                  max={99.9}
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    field.onChange(isNaN(v) ? undefined : v)
                  }}
                />
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
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber
                    field.onChange(isNaN(v) ? undefined : v)
                  }}
                />
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
              <Input
                type="number"
                min={0.01}
                step="any"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => {
                  const v = e.target.valueAsNumber
                  field.onChange(isNaN(v) ? undefined : v)
                }}
              />
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
