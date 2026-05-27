import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  evaluationFormSchema,
  type EvaluationFormInput,
  type EvaluationFormValues,
} from "@/features/evaluations/schemas/evaluation-form-schema"
import { useCreateEvaluation } from "@/features/evaluations/api/evaluations-queries"
import { usePropfirms } from "@/features/propfirms/api/propfirms-queries"

type EvaluationFormProps = {
  onSuccess?: () => void
  onCancel?: () => void
}

const STATUS_OPTIONS = [
  { value: "in_progress", label: "In progress" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
] as const

const ACCOUNT_SIZE_PRESETS = [
  10_000, 25_000, 50_000, 100_000, 150_000, 200_000,
] as const

export function EvaluationForm({ onSuccess, onCancel }: EvaluationFormProps) {
  const createMutation = useCreateEvaluation()
  const { data: propfirms, isLoading: propfirmsLoading } = usePropfirms()

  const form = useForm<EvaluationFormInput, undefined, EvaluationFormValues>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      propfirm_id: "",
      account_size: 100_000,
      fee_paid: 540,
      purchase_date: format(new Date(), "yyyy-MM-dd"),
      status: "in_progress",
      closed_at: "",
      notes: "",
    },
  })

  const status = form.watch("status")
  const requiresClosedAt = status !== "in_progress"

  useEffect(() => {
    if (!requiresClosedAt) {
      form.setValue("closed_at", "", { shouldValidate: false })
    }
  }, [requiresClosedAt, form])

  const onSubmit = (values: EvaluationFormValues) => {
    createMutation.mutate(
      {
        propfirm_id: values.propfirm_id,
        account_size: values.account_size,
        fee_paid: values.fee_paid,
        purchase_date: values.purchase_date,
        status: values.status,
        closed_at: values.closed_at || null,
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Evaluation added")
          form.reset()
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || "Could not save the evaluation.")
        },
      },
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="propfirm_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Propfirm</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={propfirmsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        propfirmsLoading ? "Loading…" : "Pick a propfirm"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(propfirms ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="account_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account size</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Account size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_SIZE_PRESETS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        ${size.toLocaleString("en-US")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fee_paid"
            render={({ field }) => {
              const { value, ...rest } = field
              return (
                <FormItem>
                  <FormLabel>Fee paid (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder="540.00"
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

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="purchase_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchased on</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {requiresClosedAt ? (
          <FormField
            control={form.control}
            name="closed_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Closed on</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>
                  Required when status is anything other than in progress.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Anything worth remembering about this challenge…"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving…" : "Add evaluation"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
