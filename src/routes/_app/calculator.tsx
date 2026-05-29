import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, useWatch, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppHeader } from '@/components/common/app-header'
import { calculatorFormSchema, type CalculatorFormValues } from '@/features/calculator/schemas/calculator-form-schema'
import { formValuesToCalcInput } from '@/features/calculator/lib/form-to-input'
import { calculate } from '@/features/calculator/lib/calc-engine'
import { CalculatorForm } from '@/features/calculator/components/calculator-form'
import { CalculatorResults } from '@/features/calculator/components/calculator-results'
import type { CalcResult } from '@/features/calculator/types'

export const Route = createFileRoute('/_app/calculator')({
  component: CalculatorPage,
})

const DEFAULTS: CalculatorFormValues = {
  cEval: 140,
  cActivation: 0,
  phases: [
    {
      dd: 2000,
      objective: 3000,
      ddType: 'eod',
      ddFixed: false,
      isFunded: false,
      hasConsistency: true,
      consistencyPct: 50,
      hasMinDays: false,
    },
    {
      dd: 2000,
      objective: 2600,
      ddType: 'eod',
      ddFixed: true,
      isFunded: true,
      hasConsistency: false,
      hasMinDays: true,
      minDays: 5,
      minProfit: 150,
      payoutCapPct: 50,
      splitPct: 90,
    },
  ],
}

function CalculatorPage() {
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: DEFAULTS,
    mode: 'onChange',
  })

  const values = useWatch({ control: form.control })

  const result = useMemo<CalcResult | null>(() => {
    const parsed = calculatorFormSchema.safeParse(values)
    if (!parsed.success) return null
    return calculate(formValuesToCalcInput(parsed.data))
  }, [values])

  return (
    <>
      <AppHeader
        title="Calculator"
        description="Evaluate the probability and ROI of a multi-phase propfirm challenge"
      />
      <main className="flex-1 p-4 md:p-6">
        <FormProvider {...form}>
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-4 xl:grid-cols-[1fr_380px] 2xl:grid-cols-[1fr_440px]">
            <CalculatorForm />
            <CalculatorResults result={result} />
          </div>
        </FormProvider>
      </main>
    </>
  )
}
