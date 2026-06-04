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
      {/* KPI grid — counts & rates */}
      <div className="grid grid-cols-2 gap-2">
        <KpiCard label="Evaluaciones" value={String(s.countE)} />
        <KpiCard label="Fondeadas" value={String(s.countF)} />
        <KpiCard label="Retiros" value={String(s.countP)} />
        <KpiCard label="% Fondeado" value={formatPercent(s.funded)} />
        <KpiCard label="% Retiro" value={formatPercent(s.payout)} />
        <KpiCard label="% Éxito" value={formatPercent(s.success)} />
        <KpiCard
          label="Peor Racha"
          value={String(s.worstStreak)}
          tone={s.worstStreak >= 5 ? "negative" : s.worstStreak >= 3 ? "negative" : "default"}
        />
      </div>

      {/* Financial summary */}
      <Card
        className={cn(
          "gap-2 px-4 py-4",
          stats.isGameOver && "border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20",
        )}
      >
        <p className="text-xs font-medium text-muted-foreground">Resumen financiero</p>
        <div className="space-y-1.5">
          <Row label="Bankroll inicial" value={formatCurrency(s.bankrollInitial, true)} />
          <Row label="Gasto evals" value={formatCurrency(s.evalsSpend, true)} tone="negative" />
          <Row label="Total retirado" value={formatCurrency(s.payoutsTotal, true)} />
          <div className="my-1 border-t" />
          <Row
            label="Beneficio neto"
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
            <span className="text-xs font-medium text-muted-foreground">Bankroll actual</span>
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
