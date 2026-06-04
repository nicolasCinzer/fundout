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
import { formatCurrency, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { BacktestStats } from "@/features/backtest/types"

type Props = {
  stats: BacktestStats
}

type Tone = "default" | "positive" | "negative" | "warning"

const toneClasses: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
  warning: "text-amber-600 dark:text-amber-400",
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

  const profitTone: Tone =
    s.netProfit > 0 ? "positive" : s.netProfit < 0 ? "negative" : "default"
  const bankrollTone: Tone = stats.isGameOver
    ? "warning"
    : s.bankrollCurrent > s.bankrollInitial
      ? "positive"
      : s.bankrollCurrent < s.bankrollInitial
        ? "negative"
        : "default"
  const streakTone: Tone =
    s.worstStreak >= 5 ? "negative" : s.worstStreak >= 3 ? "warning" : "default"

  return (
    <div className="space-y-3">
      {/* Volumes */}
      <Card className="gap-2 px-4 py-3.5">
        <p className="text-sm font-medium text-muted-foreground border-b pb-2">
          Volumes
        </p>
        <div className="space-y-2.5">
          <MetricRow
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            label="Evaluations"
            value={String(s.countE)}
          />
          <MetricRow
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Funded"
            value={String(s.countF)}
          />
          <MetricRow
            icon={<Banknote className="h-3.5 w-3.5" />}
            label="Payouts"
            value={String(s.countP)}
          />
        </div>
      </Card>

      {/* Rates */}
      <Card className="gap-2 px-4 py-3.5">
        <p className="text-sm font-medium text-muted-foreground border-b pb-2">
          Rates
        </p>
        <div className="space-y-2.5">
          <MetricRow
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="% Funded"
            value={formatPercent(s.funded)}
            bar={Math.min(1, s.funded)}
          />
          <MetricRow
            icon={<Percent className="h-3.5 w-3.5" />}
            label="% Payout"
            value={formatPercent(s.payout)}
            bar={Math.min(1, s.payout)}
          />
          <MetricRow
            icon={<Target className="h-3.5 w-3.5" />}
            label="% Success"
            value={formatPercent(s.success)}
            bar={Math.min(1, s.success)}
          />
        </div>
      </Card>

      {/* Risk */}
      <Card className="gap-2 px-4 py-3.5">
        <p className="text-sm font-medium text-muted-foreground border-b pb-2">
          Risk
        </p>
        <MetricRow
          icon={<Flame className="h-3.5 w-3.5" />}
          label="Worst Streak"
          value={String(s.worstStreak)}
          tone={streakTone}
          hint="Longest consecutive run of evaluations without producing a payout."
        />
      </Card>

      {/* Financial summary */}
      <Card
        className={cn(
          "gap-2 px-4 py-3.5",
          stats.isGameOver && "border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20",
        )}
      >
        <p className="text-sm font-medium text-muted-foreground border-b pb-2">
          Financial summary
        </p>
        <div className="space-y-1.5">
          <Row label="Initial bankroll" value={formatCurrency(s.bankrollInitial, true)} />
          <Row
            label="Spent on evaluations"
            value={formatCurrency(s.evalsSpend, true)}
            tone="negative"
          />
          <Row label="Total withdrawn" value={formatCurrency(s.payoutsTotal, true)} />
          <div className="my-1 border-t" />
          <Row
            label="Net profit"
            value={formatCurrency(s.netProfit, true)}
            tone={profitTone}
          />
          <Row label="ROI" value={formatPercent(s.roi)} tone={profitTone} />
          <div className="my-1 border-t" />
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <span className="text-xs font-medium text-muted-foreground">
              Current bankroll
            </span>
            <span
              className={cn(
                "font-heading text-xl font-semibold tabular-nums",
                toneClasses[bankrollTone],
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

function MetricRow({
  icon,
  label,
  value,
  tone = "default",
  bar,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: Tone
  bar?: number
  hint?: string
}) {
  const barColor =
    tone === "negative"
      ? "bg-rose-500/70"
      : tone === "warning"
        ? "bg-amber-500/70"
        : tone === "positive"
          ? "bg-emerald-500/70"
          : "bg-primary/70"

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span
          className={cn(
            "font-heading text-base font-semibold tabular-nums leading-none",
            toneClasses[tone],
          )}
        >
          {value}
        </span>
      </div>
      {bar !== undefined && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${Math.max(2, bar * 100)}%` }}
          />
        </div>
      )}
      {hint && (
        <p className="text-[10px] text-muted-foreground/80 leading-snug">{hint}</p>
      )}
    </div>
  )
}
