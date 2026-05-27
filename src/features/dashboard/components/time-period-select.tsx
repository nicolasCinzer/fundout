import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PERIODS,
  PERIOD_LABEL,
  type Period,
} from "@/features/dashboard/lib/period"

type TimePeriodSelectProps = {
  value: Period
  onChange: (value: Period) => void
}

export function TimePeriodSelect({ value, onChange }: TimePeriodSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Period)}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODS.map((p) => (
          <SelectItem key={p} value={p}>
            {PERIOD_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
