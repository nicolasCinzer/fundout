import type { Dispatch, SetStateAction } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { backtestCreateSchema } from "@/features/backtest/schemas/backtest-form-schema"
import type { z } from "zod"

type BacktestCreateFormValues = z.input<typeof backtestCreateSchema>
type BacktestCreateOutput = z.output<typeof backtestCreateSchema>
import { useCreateBacktest } from "@/features/backtest/api/backtests-queries"

type Props = {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
}

export function CreateBacktestDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const createMutation = useCreateBacktest()

  const form = useForm<BacktestCreateFormValues, unknown, BacktestCreateOutput>({
    resolver: zodResolver(backtestCreateSchema),
    defaultValues: {
      name: "",
      bankroll_initial: 10000,
      eval_cost: 100,
    },
  })

  const onSubmit = async (values: BacktestCreateOutput) => {
    try {
      const created = await createMutation.mutateAsync(values)
      form.reset()
      onOpenChange(false)
      navigate({ to: "/backtest/$id", params: { id: created.id } })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el backtest.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo backtest</DialogTitle>
          <DialogDescription>
            Configurá los parámetros iniciales. El costo de eval no se puede cambiar después.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: FTMO 100K — Julio"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="bankroll_initial"
                render={({ field }) => {
                  const { value, ...rest } = field
                  return (
                    <FormItem>
                      <FormLabel>Bankroll inicial (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="10000"
                          {...rest}
                          value={(value as number | string | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="eval_cost"
                render={({ field }) => {
                  const { value, ...rest } = field
                  return (
                    <FormItem>
                      <FormLabel>Costo de eval (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0.01}
                          step="0.01"
                          placeholder="100"
                          {...rest}
                          value={(value as number | string | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando…" : "Crear backtest"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
