import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
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

  const [computed, setComputed] = useState<{
    input: BankrollMcInput | null
    result: BankrollMcResult | null
  }>({ input: null, result: null })

  const onSubmit = (values: BankrollMcFormValues) => {
    const mcInput = formValuesToInput(values)
    setComputed({ input: mcInput, result: runSimulation(mcInput) })
  }

  return (
    <>
      <AppHeader
        title="Bankroll MC"
        description="Simulador Monte Carlo de ruina de bankroll — 10 000 runs, semilla fija"
      />
      <main className="flex-1 p-4 md:p-6">
        <FormProvider {...form}>
          <div className="lg:grid lg:grid-cols-[1fr_440px] lg:gap-4">
            <div className="flex flex-col gap-4">
              <BankrollMcForm onSubmit={form.handleSubmit(onSubmit)} />
              <BankrollMcChart result={computed.result} />
            </div>
            <BankrollMcResults result={computed.result} input={computed.input} />
          </div>
        </FormProvider>
      </main>
    </>
  )
}
