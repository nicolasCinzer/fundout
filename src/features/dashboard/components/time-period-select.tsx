import { useState } from "react"
import { format } from "date-fns"
import { CalendarRange } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  periodLabel,
  periodRange,
  type CustomRange,
  type Period,
} from "@/features/dashboard/lib/period"

type TimePeriodSelectProps = {
  value: Period
  custom: CustomRange
  onChange: (value: Period, custom?: CustomRange) => void
}

const PERIOD_GROUPS: { labelKey: string; periods: Period[] }[] = [
  { labelKey: "All", periods: ["all_time"] },
  { labelKey: "Current", periods: ["this_month", "this_year"] },
  { labelKey: "Previous", periods: ["last_month", "last_year", "last_12_months"] },
  { labelKey: "Quarters (current year)", periods: ["q1", "q2", "q3", "q4"] },
  { labelKey: "Custom", periods: ["custom"] },
]

export function TimePeriodSelect({
  value,
  custom,
  onChange,
}: TimePeriodSelectProps) {
  const { t } = useTranslation("dashboard")

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onValueChange={(v) => onChange(v as Period, custom)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_GROUPS.map((group, gi) => (
            <SelectGroup key={group.labelKey}>
              {gi > 0 && <SelectSeparator />}
              <SelectLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {group.labelKey}
              </SelectLabel>
              {group.periods.map((p) => (
                <SelectItem key={p} value={p}>
                  {periodLabel(t, p)}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      {value === "custom" && (
        <CustomRangeEditor
          custom={custom}
          onApply={(next) => onChange("custom", next)}
        />
      )}
    </div>
  )
}

function CustomRangeEditor({
  custom,
  onApply,
}: {
  custom: CustomRange
  onApply: (next: CustomRange) => void
}) {
  const { t } = useTranslation(["dashboard", "common"])
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(custom.from ?? "")
  const [to, setTo] = useState(custom.to ?? "")

  const range = periodRange("custom", new Date(), custom)
  const label =
    custom.from && custom.to && range.start && range.end
      ? `${format(range.start, "MMM d, yyyy")} – ${format(range.end, "MMM d, yyyy")}`
      : "Pick dates"

  const disabled = !from || !to || from > to

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setFrom(custom.from ?? "")
          setTo(custom.to ?? "")
        }
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarRange className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <p className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground">
          {t("period.custom")}
        </p>
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            {t("common:actions.cancel")}
          </Button>
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => {
              onApply({ from, to })
              setOpen(false)
            }}
          >
            {t("common:actions.continue")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
