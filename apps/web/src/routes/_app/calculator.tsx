import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, useWatch, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppHeader } from '@/components/common/app-header'
import { calculatorFormSchema, type CalculatorFormValues } from '@/features/calculator/schemas/calculator-form-schema'
import { formValuesToCalcInput } from '@/features/calculator/lib/form-to-input'
import { calculate } from '@/features/calculator/lib/calc-engine'
import { CalculatorForm } from '@/features/calculator/components/calculator-form'
import { CalculatorKpis } from '@/features/calculator/components/calculator-kpis'
import { CalculatorPhaseBreakdown } from '@/features/calculator/components/calculator-phase-breakdown'
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
      minPayoutRequest: 0,
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
      minPayoutRequest: 0,
    },
  ],
}

const STORAGE_KEY = 'calculator:inputs'

function loadInitialValues(): CalculatorFormValues {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    const validated = calculatorFormSchema.safeParse(parsed)
    return validated.success ? validated.data : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function CalculatorPage() {
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: loadInitialValues(),
    mode: 'onChange',
  })

  useEffect(() => {
    const sub = form.watch((values) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
      } catch {
        // quota or privacy mode — fail silently
      }
    })
    return () => sub.unsubscribe()
  }, [form])

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
          <div className="mx-auto max-w-7xl space-y-4">
            <CalculatorKpis result={result} />

            <div className="grid items-stretch grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <CalculatorForm />
              </div>
              <div className="lg:col-span-4">
                <CalculatorPhaseBreakdown result={result} />
              </div>
            </div>
          </div>
        </FormProvider>
      </main>
    </>
  )
}
