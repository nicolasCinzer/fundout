import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  useMarkEvaluationFunded,
  useUndoMarkEvaluationFunded,
  type Evaluation,
} from "@/features/evaluations/api/evaluations-queries"

const schema = z.object({
  funded_at: z
    .string()
    .min(1, "Pick a date")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
})

type FormValues = z.infer<typeof schema>

type MarkFundedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  evaluation: Evaluation
}

export function MarkFundedDialog({
  open,
  onOpenChange,
  evaluation,
}: MarkFundedDialogProps) {
  const markFunded = useMarkEvaluationFunded()
  const undoMarkFunded = useUndoMarkEvaluationFunded()
  const today = format(new Date(), "yyyy-MM-dd")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { funded_at: today },
  })

  useEffect(() => {
    if (open) form.reset({ funded_at: today })
  }, [open, form, today])

  const onSubmit = (values: FormValues) => {
    if (values.funded_at < evaluation.purchase_date) {
      form.setError("funded_at", {
        message: "Funded date cannot be before purchase date",
      })
      return
    }
    if (values.funded_at > today) {
      form.setError("funded_at", { message: "Funded date cannot be in the future" })
      return
    }
    markFunded.mutate(
      { evaluationId: evaluation.id, fundedAt: values.funded_at },
      {
        onSuccess: (fundedAccount) => {
          onOpenChange(false)
          toast.success("Marked as funded", {
            duration: 6000,
            action: {
              label: "Undo",
              onClick: () => {
                undoMarkFunded.mutate(
                  {
                    evaluationId: evaluation.id,
                    fundedAccountId: fundedAccount.id,
                  },
                  {
                    onSuccess: () => toast.success("Undone", { duration: 3000 }),
                    onError: (e) =>
                      toast.error(
                        e.message ||
                          "Undo partially failed — please refresh and check.",
                      ),
                  },
                )
              },
            },
          })
        },
        onError: (e) => toast.error(e.message || "Could not mark as funded"),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as funded</DialogTitle>
          <DialogDescription>
            When did this evaluation get funded? This sets the start of the
            payout window.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="funded_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funded on</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={evaluation.purchase_date}
                      max={today}
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={markFunded.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={markFunded.isPending}>
                {markFunded.isPending ? "Saving…" : "Mark as funded"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
