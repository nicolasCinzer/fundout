import { useEffect, useRef } from "react"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { BREACH_ANIM_MS } from "@/features/backtest/lib/compute-lifecycle-status"

// ---------------------------------------------------------------------------
// BacktestAccountChips
//
// Renders one chip per live lifecycle (non-breached account).
// Selected chip is highlighted with border-primary/60 bg-primary/5 (matching
// day-square pattern from backtest-trade-entry.tsx).
//
// Breaching chips show a red pulse CSS animation and call onBreachDone after
// BREACH_ANIM_MS milliseconds. The PARENT is responsible for jumping selection
// on breach — the chip only animates and calls onBreachDone.
//
// Container-query responsive sizing (@xs:/@sm: NOT viewport sm:).
//
// Satisfies: REQ-MA-CHIP-01..06, REQ-MA-BREACH-01..05, ADR-8.
// ---------------------------------------------------------------------------

export type AccountChip = {
  id: string
  index: number
  label: string
  profit: number
  selected: boolean
  breaching: boolean
}

type Props = {
  chips: AccountChip[]
  onSelect: (id: string) => void
  onBreachDone: (id: string) => void
}

export function BacktestAccountChips({ chips, onSelect, onBreachDone }: Props) {
  // Track which ids have active breach timers to avoid re-triggering
  const breachTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    chips.forEach(chip => {
      if (chip.breaching && !breachTimers.current.has(chip.id)) {
        const timer = setTimeout(() => {
          breachTimers.current.delete(chip.id)
          onBreachDone(chip.id)
        }, BREACH_ANIM_MS)
        breachTimers.current.set(chip.id, timer)
      }
    })

    // Clean up timers for chips that are no longer breaching
    return () => {
      breachTimers.current.forEach((timer, id) => {
        if (!chips.find(c => c.id === id && c.breaching)) {
          clearTimeout(timer)
          breachTimers.current.delete(id)
        }
      })
    }
  }, [chips, onBreachDone])

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      breachTimers.current.forEach(timer => clearTimeout(timer))
    }
  }, [])

  if (chips.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 @xs:grid-cols-3 @sm:grid-cols-4">
      {chips.map(chip => {
        const profitTone =
          chip.profit > 0
            ? "text-emerald-600 dark:text-emerald-400"
            : chip.profit < 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-muted-foreground"

        return (
          <button
            key={chip.id}
            type="button"
            data-selected={chip.selected ? "true" : "false"}
            data-breaching={chip.breaching ? "true" : "false"}
            onClick={() => onSelect(chip.id)}
            aria-pressed={chip.selected}
            className={cn(
              "relative rounded-lg border px-2 py-2 text-center transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              chip.selected && !chip.breaching
                ? "border-primary/60 bg-primary/5"
                : chip.breaching
                  ? "border-rose-500/60 bg-rose-500/10 animate-pulse"
                  : "border-border bg-muted/20 hover:border-muted-foreground/40",
            )}
          >
            <p className="text-[10px] text-muted-foreground font-mono">
              {chip.index}
            </p>
            <p className={cn("text-sm font-semibold tabular-nums leading-tight", profitTone)}>
              {chip.profit >= 0 ? "+" : ""}
              {formatCurrency(chip.profit)}
            </p>
          </button>
        )
      })}
    </div>
  )
}
