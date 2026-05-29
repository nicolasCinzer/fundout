import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { CalculatorFormValues } from '../schemas/calculator-form-schema'
import { CalculatorPhaseCard } from './calculator-phase-card'

export function CalculatorForm() {
  const { control } = useFormContext<CalculatorFormValues>()
  const { fields, append, remove } = useFieldArray({ name: 'phases', control })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name="cEval"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Evaluation cost ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
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
          name="cActivation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Activation fee ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
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

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {fields.map((field, i) => (
          <CalculatorPhaseCard
            key={field.id}
            index={i}
            onRemove={() => remove(i)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={fields.length >= 4}
        onClick={() =>
          append({
            dd: 1000,
            objective: 2000,
            ddType: 'eod',
            ddFixed: false,
            isFunded: false,
          })
        }
      >
        Add phase
      </Button>
    </div>
  )
}
