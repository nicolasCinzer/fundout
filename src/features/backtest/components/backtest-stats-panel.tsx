import {
  Banknote,
  Flame,
  FlaskConical,
  Percent,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { KpiCard } from "@/features/dashboard/components/kpi-card"
import { formatCurrency, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { BacktestStats } from "@/features/backtest/types"

type Props = {
  stats: BacktestStats
}

function safeNum(n: number): number {
  return Number.isFinite(n) ? n : 0
}

export function BacktestStatsPanel({ stats }: Props) {
  const s = {
    countE: stats.counts.E,
    countF: stats.counts.F,
    countP: stats.counts.P,
    funded: safeNum(stats.rates.funded),
    payout: safeNum(stats.rates.payout),
    success: safeNum(stats.rates.success),
    worstStreak: stats.worstStreak,
    payoutsTotal: safeNum(stats.payoutsTotal),
    bankrollInitial: safeNum(stats.bankrollInitial),
    evalsSpend: safeNum(stats.evalsSpend),
    netProfit: safeNum(stats.netProfit),
    bankrollCurrent: safeNum(stats.bankrollCurrent),
    roi: safeNum(stats.roi),
  }

  const profitTone = s.netProfit > 0 ? "positive" : s.netProfit < 0 ? "negative" : "default"
  const bankrollTone = s.bankrollCurrent > s.bankrollInitial
    ? "positive"
    : s.bankrollCurrent < s.bankrollInitial
      ? "negative"
      : "default"

  return (
    <div className="space-y-3">
      {/* Volumes */}
      <div>
        <p className="mb-1.5 text-[10px] font-heading uppercase tracking-wide text-muted-foreground px-0.5">
          Volumes
        </p>
        <div className="grid grid-cols-1 gap-2">
          <KpiCard
            label="Evaluations"
            value={String(s.countE)}
            icon={<FlaskConical className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Funded"
            value={String(s.countF)}
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Payouts"
            value={String(s.countP)}
            icon={<Banknote className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Rates */}
      <div>
        <p className="mb-1.5 text-[10px] font-heading uppercase tracking-wide text-muted-foreground px-0.5">
          Rates
        </p>
        <div className="grid grid-cols-1 gap-2">
          <KpiCard
            label="% Funded"
            value={formatPercent(s.funded)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="% Payout"
            value={formatPercent(s.payout)}
            icon={<Percent className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="% Success"
            value={formatPercent(s.success)}
            icon={<Target className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Risk */}
      <div>
        <p className="mb-1.5 text-[10px] font-heading uppercase tracking-wide text-muted-foreground px-0.5">
          Risk
        </p>
        <div className="grid grid-cols-1 gap-2">
          <KpiCard
            label="Worst Streak"
            value={String(s.worstStreak)}
            tone={s.worstStreak >= 3 ? "negative" : "default"}
            icon={<Flame className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Financial summary */}
      <Card
        className={cn(
          "gap-2 px-4 py-4",
          stats.isGameOver && "border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20",
        )}
      >
        <p className="text-xs font-medium text-muted-foreground">Financial summary</p>
        <div className="space-y-1.5">
          <Row label="Initial bankroll" value={formatCurrency(s.bankrollInitial, true)} />
          <Row label="Spent on evaluations" value={formatCurrency(s.evalsSpend, true)} tone="negative" />
          <Row label="Total withdrawn" value={formatCurrency(s.payoutsTotal, true)} />
          <div className="my-1 border-t" />
          <Row
            label="Net profit"
            value={formatCurrency(s.netProfit, true)}
            tone={profitTone}
          />
          <Row
            label="ROI"
            value={formatPercent(s.roi)}
            tone={profitTone}
          />
          <div className="my-1 border-t" />
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Current bankroll</span>
            <span
              className={cn(
                "font-heading text-xl font-semibold tabular-nums",
                bankrollTone === "positive" && "text-emerald-600 dark:text-emerald-400",
                bankrollTone === "negative" && "text-rose-600 dark:text-rose-400",
                stats.isGameOver && "text-amber-600 dark:text-amber-400",
              )}
            >
              {formatCurrency(s.bankrollCurrent, true)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

type RowTone = "default" | "positive" | "negative"

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: RowTone
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400",
          tone === "negative" && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value}
      </span>
    </div>
  )
}
