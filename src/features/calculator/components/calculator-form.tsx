import { useEffect, useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Plus, Landmark } from 'lucide-react'
import type { CalculatorFormValues } from '../schemas/calculator-form-schema'
import { CalculatorPhaseCard } from './calculator-phase-card'

export function CalculatorForm() {
  const { control } = useFormContext<CalculatorFormValues>()
  const { fields, append, remove } = useFieldArray({ name: 'phases', control })
  const [activePhase, setActivePhase] = useState('0')

  useEffect(() => {
    const i = Number(activePhase)
    if (i >= fields.length) setActivePhase(String(fields.length - 1))
  }, [fields.length, activePhase])

  function handleAddPhase() {
    append({
      dd: 1000,
      objective: 2000,
      ddType: 'eod',
      ddFixed: false,
      isFunded: false,
      hasConsistency: false,
      hasMinDays: false,
      minPayoutRequest: 0,
    })
    setActivePhase(String(fields.length))
  }

  function handleRemovePhase(index: number) {
    remove(index)
    if (Number(activePhase) === index) setActivePhase('0')
  }

  return (
    <div className="space-y-4">
      <Card className="gap-3 p-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Landmark className="h-4 w-4 text-primary" />
          <h2 className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground">
            Challenge setup
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
      </Card>

      <Card className="gap-0 overflow-hidden p-0">
        <Tabs value={activePhase} onValueChange={setActivePhase} className="gap-0">
          <div className="flex items-center justify-between border-b bg-muted/30 px-2">
            <TabsList variant="line" className="h-10 bg-transparent">
              {fields.map((field, i) => (
                <TabsTrigger
                  key={field.id}
                  value={String(i)}
                  className="px-3 text-[11px] font-heading uppercase tracking-wide"
                >
                  Phase {i + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={fields.length >= 4}
              onClick={handleAddPhase}
            >
              <Plus className="h-3.5 w-3.5" />
              Add phase
            </Button>
          </div>
          {fields.map((field, i) => (
            <TabsContent key={field.id} value={String(i)} className="p-4">
              <CalculatorPhaseCard
                index={i}
                onRemove={() => handleRemovePhase(i)}
                canRemove={fields.length > 1}
              />
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  )
}
