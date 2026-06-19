import {
  Banknote,
  Dice5,
  Flame,
  FlaskConical,
  HandCoins,
  Percent,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  const { t } = useTranslation("backtest")
  const s = {
    countE: stats.counts.E,
    countF: stats.counts.F,
    countP: stats.counts.P,
    paidFunded: stats.counts.paidFunded,
    funded: safeNum(stats.rates.funded),
    payout: safeNum(stats.rates.payout),
    success: safeNum(stats.rates.success),
    payoutProbability: safeNum(stats.rates.payoutProbability),
    worstStreak: stats.worstStreak,
    payoutsTotal: safeNum(stats.payoutsTotal),
    payoutsMedian: safeNum(stats.payoutsMedian),
    payoutsPerFunded: safeNum(stats.payoutsPerFunded),
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
          {t("stats.volumes.title")}
        </p>
        <div className="space-y-2.5">
          <MetricRow
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            label={t("stats.volumes.evaluations")}
            value={String(s.countE)}
          />
          <MetricRow
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label={t("stats.volumes.funded")}
            value={String(s.countF)}
          />
          <MetricRow
            icon={<HandCoins className="h-3.5 w-3.5" />}
            label={t("stats.volumes.fundedWithPayout")}
            value={String(s.paidFunded)}
          />
          <MetricRow
            icon={<Banknote className="h-3.5 w-3.5" />}
            label={t("stats.volumes.payouts")}
            value={String(s.countP)}
          />
        </div>
      </Card>

      {/* Rates */}
      <Card className="gap-2 px-4 py-3.5">
        <p className="text-sm font-medium text-muted-foreground border-b pb-2">
          {t("stats.rates.title")}
        </p>
        <div className="space-y-2.5">
          <MetricRow
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label={t("stats.rates.percentFunded")}
            value={formatPercent(s.funded)}
            bar={Math.min(1, s.funded)}
            hint={t("tooltips.percentFunded")}
          />
          <MetricRow
            icon={<Percent className="h-3.5 w-3.5" />}
            label={t("stats.rates.percentPayout")}
            value={formatPercent(s.payout)}
            bar={Math.min(1, s.payout)}
            hint={t("tooltips.percentPayout")}
          />
          <MetricRow
            icon={<Target className="h-3.5 w-3.5" />}
            label={t("stats.rates.percentSuccess")}
            value={formatPercent(s.success)}
            bar={Math.min(1, s.success)}
            hint={t("tooltips.percentSuccess")}
          />
          <MetricRow
            icon={<Dice5 className="h-3.5 w-3.5" />}
            label={t("stats.rates.payoutProbability")}
            value={formatPercent(s.payoutProbability)}
            bar={Math.min(1, s.payoutProbability)}
            hint={t("tooltips.payoutProbability")}
          />
        </div>
      </Card>

      {/* Risk */}
      <Card className="gap-2 px-4 py-3.5">
        <p className="text-sm font-medium text-muted-foreground border-b pb-2">
          {t("stats.risk.title")}
        </p>
        <MetricRow
          icon={<Flame className="h-3.5 w-3.5" />}
          label={t("stats.risk.worstStreak")}
          value={String(s.worstStreak)}
          tone={streakTone}
          hint={t("tooltips.worstStreak")}
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
          {t("stats.financial.title")}
        </p>
        <div className="space-y-1.5">
          <Row
            label={t("stats.financial.initialBankroll")}
            value={formatCurrency(s.bankrollInitial)}
            hint={t("tooltips.initialBankroll")}
          />
          <Row
            label={t("stats.financial.spentOnEvaluations")}
            value={formatCurrency(s.evalsSpend)}
            tone="negative"
            hint={t("tooltips.spentOnEvaluations")}
          />
          <Row
            label={t("stats.financial.totalWithdrawn")}
            value={formatCurrency(s.payoutsTotal)}
            hint={t("tooltips.totalWithdrawn")}
          />
          <Row
            label={t("stats.financial.medianPayout")}
            value={formatCurrency(s.payoutsMedian)}
            hint={t("tooltips.medianPayout")}
          />
          <Row
            label={t("stats.financial.avgPayoutsPerFunded")}
            value={s.payoutsPerFunded.toFixed(2)}
            hint={t("tooltips.avgPayoutsPerFunded")}
          />
          <div className="my-1 border-t" />
          <Row
            label={t("stats.financial.netProfit")}
            value={formatCurrency(s.netProfit)}
            tone={profitTone}
            hint={t("tooltips.netProfit")}
          />
          <Row
            label={t("stats.financial.roi")}
            value={formatPercent(s.roi)}
            tone={profitTone}
            hint={t("tooltips.roi")}
          />
          <div className="my-1 border-t" />
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-medium text-muted-foreground decoration-dotted underline-offset-4 hover:underline cursor-help">
                  {t("stats.financial.currentBankroll")}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {t("tooltips.currentBankroll")}
              </TooltipContent>
            </Tooltip>
            <span
              className={cn(
                "font-heading text-xl font-semibold tabular-nums",
                toneClasses[bankrollTone],
              )}
            >
              {formatCurrency(s.bankrollCurrent)}
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
  hint,
}: {
  label: string
  value: string
  tone?: RowTone
  hint?: string
}) {
  const labelNode = hint ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs text-muted-foreground decoration-dotted underline-offset-4 hover:underline cursor-help">
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{hint}</TooltipContent>
    </Tooltip>
  ) : (
    <span className="text-xs text-muted-foreground">{label}</span>
  )

  return (
    <div className="flex items-baseline justify-between gap-2">
      {labelNode}
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
