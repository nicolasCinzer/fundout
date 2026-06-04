import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { backtestEventAppendSchema } from "@/features/backtest/schemas/backtest-form-schema"
import { useAppendBacktestEvent } from "@/features/backtest/api/backtests-queries"
import { nextAllowedEvent } from "@/features/backtest/lib/next-allowed-event"
import type { BacktestEvent, BacktestEventType } from "@/features/backtest/types"

const TYPE_LABEL: Record<BacktestEventType, string> = {
  E: "Comprar Eval",
  F: "Funded",
  P: "Retiro",
}

// Flat form values — discriminated union handled manually at submit
type EventFormValues = {
  type: BacktestEventType
  amount: string
  notes: string
}

type Props = {
  backtestId: string
  lastEvent: BacktestEvent | null
  isGameOver: boolean
}

export function BacktestEventForm({ backtestId, lastEvent, isGameOver }: Props) {
  const appendMutation = useAppendBacktestEvent(backtestId)
  const allowedTypes = nextAllowedEvent(lastEvent)
  const [selectedType, setSelectedType] = useState<BacktestEventType | null>(null)

  const form = useForm<EventFormValues>({
    defaultValues: { type: "E", amount: "", notes: "" },
  })

  const handleTypeSelect = (type: BacktestEventType) => {
    if (isGameOver || !allowedTypes.includes(type)) return
    setSelectedType(type)
    form.setValue("type", type)
    form.setValue("amount", "")
  }

  const onSubmit = async (values: EventFormValues) => {
    if (isGameOver || !selectedType) return

    // Build the discriminated union payload and validate with Zod
    const payload =
      selectedType === "P"
        ? { type: "P" as const, amount: values.amount, notes: values.notes || null }
        : { type: selectedType, notes: values.notes || null }

    const parsed = backtestEventAppendSchema.safeParse(payload)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message
      form.setError("amount", { message: firstError })
      return
    }

    try {
      await appendMutation.mutateAsync(parsed.data)
      setSelectedType(null)
      form.reset({ type: "E", amount: "", notes: "" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el evento.")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Type selector buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">Tipo de evento</p>
          <div className="flex gap-2">
            {(["E", "F", "P"] as BacktestEventType[]).map((t) => {
              const allowed = allowedTypes.includes(t)
              const isSelected = selectedType === t
              return (
                <Button
                  key={t}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!allowed || isGameOver || appendMutation.isPending}
                  onClick={() => handleTypeSelect(t)}
                  className="flex-1 font-mono"
                >
                  {t}
                  <span className="ml-1 hidden text-xs font-normal sm:inline">
                    — {TYPE_LABEL[t]}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Amount field — only for P */}
        {selectedType === "P" && (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto del retiro (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0.01}
                    step="0.01"
                    placeholder="500.00"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observaciones sobre este evento…"
                  rows={2}
                  disabled={isGameOver || appendMutation.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={!selectedType || isGameOver || appendMutation.isPending}
        >
          {appendMutation.isPending ? "Registrando…" : "Registrar evento"}
        </Button>
      </form>
    </Form>
  )
}
