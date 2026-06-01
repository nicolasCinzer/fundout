import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, useWatch, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppHeader } from '@/components/common/app-header'
import {
  bankrollMcFormSchema,
  bankrollMcFormDefaults,
  formValuesToInput,
  runSimulation,
  BankrollMcForm,
  BankrollMcResults,
  BankrollMcChart,
} from '@/features/bankroll-mc'
import type { BankrollMcFormValues } from '@/features/bankroll-mc'
import type { BankrollMcResult, BankrollMcInput } from '@/features/bankroll-mc'

export const Route = createFileRoute('/_app/bankroll-mc')({
  component: BankrollMcPage,
})

function BankrollMcPage() {
  const form = useForm<BankrollMcFormValues>({
    resolver: zodResolver(bankrollMcFormSchema),
    defaultValues: bankrollMcFormDefaults,
    mode: 'onChange',
  })

  const values = useWatch({ control: form.control })

  const { input, result } = useMemo<{ input: BankrollMcInput | null; result: BankrollMcResult | null }>(() => {
    const parsed = bankrollMcFormSchema.safeParse(values)
    if (!parsed.success) return { input: null, result: null }
    const mcInput = formValuesToInput(parsed.data)
    return { input: mcInput, result: runSimulation(mcInput) }
  }, [values])

  return (
    <>
      <AppHeader
        title="Bankroll MC"
        description="Simulador Monte Carlo de ruina de bankroll — 5 000 runs, semilla fija"
      />
      <main className="flex-1 p-4 md:p-6">
        <FormProvider {...form}>
          <div className="lg:grid lg:grid-cols-[1fr_440px] lg:gap-4">
            <div className="flex flex-col gap-4">
              <BankrollMcForm />
              <BankrollMcChart result={result} />
            </div>
            <BankrollMcResults result={result} input={input} />
          </div>
        </FormProvider>
      </main>
    </>
  )
}
