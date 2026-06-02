import { useFormContext, Controller } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { X } from 'lucide-react'
import type { CalculatorFormValues } from '../schemas/calculator-form-schema'

type Props = {
  index: number
  onRemove: () => void
  canRemove: boolean
}

export function CalculatorPhaseCard({ index, onRemove, canRemove }: Props) {
  const { control, watch, setValue } = useFormContext<CalculatorFormValues>()

  const hasConsistency = watch(`phases.${index}.hasConsistency`)
  const hasMinDays = watch(`phases.${index}.hasMinDays`)
  const isFunded = watch(`phases.${index}.isFunded`)
  const ddType = watch(`phases.${index}.ddType`)

  function toggleConsistency(checked: boolean) {
    setValue(`phases.${index}.hasConsistency`, checked, { shouldValidate: true })
    if (checked) {
      setValue(`phases.${index}.consistencyPct`, 50, { shouldValidate: true })
      setValue(`phases.${index}.hasMinDays`, false, { shouldValidate: true })
    }
  }

  function toggleMinDays(checked: boolean) {
    setValue(`phases.${index}.hasMinDays`, checked, { shouldValidate: true })
    if (checked) {
      setValue(`phases.${index}.minDays`, 1, { shouldValidate: true })
      setValue(`phases.${index}.minProfit`, 100, { shouldValidate: true })
      setValue(`phases.${index}.hasConsistency`, false, { shouldValidate: true })
    }
  }

  function toggleFunded(checked: boolean) {
    setValue(`phases.${index}.isFunded`, checked, { shouldValidate: true })
    if (!checked) {
      setValue(`phases.${index}.payoutCapPct`, undefined, { shouldValidate: true })
      setValue(`phases.${index}.splitPct`, undefined, { shouldValidate: true })
    } else {
      setValue(`phases.${index}.payoutCapPct`, 50, { shouldValidate: true })
      setValue(`phases.${index}.splitPct`, 90, { shouldValidate: true })
    }
  }

  const hasConditional = hasConsistency || hasMinDays || isFunded

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Phase {index + 1}
          {isFunded && (
            <span className="ml-2 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              FUNDED
            </span>
          )}
        </span>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onRemove}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Remove phase
          </Button>
        )}
      </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={control}
            name={`phases.${index}.dd`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Drawdown ($)</FormLabel>
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
            name={`phases.${index}.objective`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Objective ($)</FormLabel>
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
            name={`phases.${index}.ddType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">DD type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="eod">EOD</SelectItem>
                    <SelectItem value="trailing" disabled>
                      Trailing — soon
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={`phases.${index}.hasConsistency`}
              render={({ field }) => (
                <Checkbox
                  id={`consistency-toggle-${index}`}
                  checked={!!field.value}
                  disabled={hasMinDays}
                  onCheckedChange={(v) => toggleConsistency(v === true)}
                />
              )}
            />
            <Label
              htmlFor={`consistency-toggle-${index}`}
              className="text-xs cursor-pointer"
            >
              Consistency
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={`phases.${index}.hasMinDays`}
              render={({ field }) => (
                <Checkbox
                  id={`mindays-toggle-${index}`}
                  checked={!!field.value}
                  disabled={hasConsistency}
                  onCheckedChange={(v) => toggleMinDays(v === true)}
                />
              )}
            />
            <Label
              htmlFor={`mindays-toggle-${index}`}
              className="text-xs cursor-pointer"
            >
              Min trading days
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={`phases.${index}.ddFixed`}
              render={({ field }) => (
                <Checkbox
                  id={`ddfixed-toggle-${index}`}
                  checked={ddType === 'static' ? false : !!field.value}
                  disabled={ddType === 'static'}
                  onCheckedChange={(v) =>
                    setValue(`phases.${index}.ddFixed`, v === true, { shouldValidate: true })
                  }
                />
              )}
            />
            <Label
              htmlFor={`ddfixed-toggle-${index}`}
              className={`text-xs cursor-pointer ${ddType === 'static' ? 'text-muted-foreground/50' : ''}`}
            >
              DD fixed
            </Label>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Controller
              control={control}
              name={`phases.${index}.isFunded`}
              render={({ field }) => (
                <Switch
                  id={`funded-toggle-${index}`}
                  checked={field.value}
                  onCheckedChange={toggleFunded}
                />
              )}
            />
            <Label
              htmlFor={`funded-toggle-${index}`}
              className="text-xs cursor-pointer"
            >
              Funded phase
            </Label>
          </div>
        </div>

        {hasConditional && (
          <div className="grid grid-cols-2 gap-2.5 rounded-md border border-dashed border-border/60 p-2">
            {hasConsistency && (
              <FormField
                control={control}
                name={`phases.${index}.consistencyPct`}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-xs">
                      Max daily profit (% of objective)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {hasMinDays && (
              <>
                <FormField
                  control={control}
                  name={`phases.${index}.minDays`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Min days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
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
                  name={`phases.${index}.minProfit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Daily min profit ($)</FormLabel>
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
              </>
            )}
            {isFunded && (
              <>
                <FormField
                  control={control}
                  name={`phases.${index}.payoutCapPct`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Payout cap (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
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
                  name={`phases.${index}.splitPct`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Profit split (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
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
                  name={`phases.${index}.minPayoutRequest`}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs">Min payout request ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        Minimum amount the propfirm allows to request
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        )}

      <FormField
        control={control}
        name={`phases.${index}.isFunded`}
        render={() => <FormMessage />}
      />
    </div>
  )
}
