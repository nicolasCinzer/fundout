import { useFormContext } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { BankrollMcFormValues } from '../schema'

export function BankrollMcForm() {
  const { control } = useFormContext<BankrollMcFormValues>()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name="bankroll"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Bankroll (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
              <FormLabel className="text-xs">Costo por intento (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
          name="payoutProb"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Prob. de payout (0–1)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0.001}
                  max={0.999}
                  step="0.01"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
              <FormLabel className="text-xs">Payout neto (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
            <FormLabel className="text-xs">Target bankroll (€, opcional)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0.01}
                step="any"
                placeholder="Ej: 5000"
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
  )
}
