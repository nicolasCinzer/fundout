import type { Dispatch, SetStateAction } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
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
import {
  backtestRenameSchema,
  type BacktestUpdateInput,
} from "@/features/backtest/schemas/backtest-form-schema"
import { useUpdateBacktestName } from "@/features/backtest/api/backtests-queries"
import type { Backtest } from "@/features/backtest/types"

type Props = {
  backtest: Backtest
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
}

export function RenameBacktestDialog({ backtest, open, onOpenChange }: Props) {
  const updateMutation = useUpdateBacktestName()

  const form = useForm<BacktestUpdateInput, unknown, BacktestUpdateInput>({
    resolver: zodResolver(backtestRenameSchema),
    defaultValues: { name: backtest.name },
  })

  const onSubmit = async (values: BacktestUpdateInput) => {
    try {
      await updateMutation.mutateAsync({ id: backtest.id, name: values.name })
      toast.success("Backtest renamed")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename backtest.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename backtest</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
