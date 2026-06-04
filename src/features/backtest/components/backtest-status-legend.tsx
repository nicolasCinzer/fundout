import { Card } from "@/components/ui/card"
import type { LifecycleStatus } from "@/features/backtest/types"

const ENTRIES: Array<{
  status: LifecycleStatus
  label: string
  description: string
}> = [
  { status: "lost", label: "Lost", description: "Failed before funded." },
  { status: "breached_no_payout", label: "Breached", description: "Funded, breached, no payout." },
  { status: "funded_paid", label: "Paid", description: "Funded with at least one payout." },
  { status: "funded_active", label: "Funded", description: "Active funded, awaiting payout." },
  { status: "open", label: "Open", description: "Bought, not yet funded." },
]

const BADGE_CLASS: Record<LifecycleStatus, string> = {
  lost: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  breached_no_payout:
    "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  funded_paid:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  funded_active: "border-primary/40 bg-primary/10 text-primary",
  open: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
}

export function BacktestStatusLegend() {
  return (
    <Card className="gap-2 px-4 py-3">
      <p className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground">
        State legend
      </p>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {ENTRIES.map((e) => (
          <div key={e.status} className="flex items-center gap-2 min-w-0">
            <span
              className={`inline-flex h-5 w-[68px] shrink-0 items-center justify-center rounded-4xl border px-2 text-[11px] font-medium ${BADGE_CLASS[e.status]}`}
            >
              {e.label}
            </span>
            <p className="text-[11px] text-muted-foreground leading-snug truncate">
              {e.description}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
