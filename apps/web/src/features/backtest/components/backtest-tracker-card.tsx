import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AccountRules, AccountState } from "@/features/backtest/types"

// ---------------------------------------------------------------------------
// BacktestTrackerCard
//
// The headline tracker card as per user mockup:
//  - Header: name + EVAL badge + DD-type badge + status badge
//  - Metrics row: balance, profit target (effective), trading days
//  - Consistency block (when eval_consistency_pct set)
//  - MLL → TARGET progress bar (the main visual)
//
// Props: rules + engine-derived state (no I/O here — pure display).
// Satisfies: C2a-2 LiveDdPanel (eval view) per task spec.
// ---------------------------------------------------------------------------

type Props = {
  backtestName: string
  /** 1-based account index shown as "1 · Name". */
  accountIndex: number
  rules: AccountRules
  state: AccountState
  /** When set, show "Mark funded" CTA (passEligible reached). */
  onMarkFunded?: () => void
  isMarkFundedPending?: boolean
}

type StatusVariant = "in-progress" | "breached" | "passed"

function getStatus(state: AccountState): StatusVariant {
  if (state.final.breached) return "breached"
  if (state.eval?.passEligible) return "passed"
  return "in-progress"
}

const statusConfig: Record<
  StatusVariant,
  { label: string; labelKey: string; className: string }
> = {
  "in-progress": {
    label: "In progress",
    labelKey: "tracker.status.inProgress",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  breached: {
    label: "Breached",
    labelKey: "tracker.status.breached",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  },
  passed: {
    label: "Passed",
    labelKey: "tracker.status.passed",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
}

export function BacktestTrackerCard({
  backtestName,
  accountIndex,
  rules,
  state,
  onMarkFunded,
  isMarkFundedPending,
}: Props) {
  const { t } = useTranslation("backtest")

  const { final, consistency, eval: evalResult, days } = state
  const tradingDayCount = days.length
  const status = getStatus(state)
  const statusCfg = statusConfig[status]

  // Effective target for display
  const effectiveTarget = evalResult?.effectiveTarget ?? rules.evalProfitTarget
  const currentNetProfit = final.balance - rules.startingBalance

  // Progress bar: span [threshold (MLL) … effectiveTarget absolute]
  const floorBalance = final.threshold // MLL
  const targetBalance = rules.startingBalance + effectiveTarget // absolute target
  const totalRange = targetBalance - floorBalance
  const currentBalance = final.balance

  // Clamp position 0..1
  const rawPosition = totalRange > 0 ? (currentBalance - floorBalance) / totalRange : 0
  const clampedPosition = Math.min(1, Math.max(0, rawPosition))

  const isBreached = final.breached
  const isPassed = evalResult?.passEligible ?? false

  // Profit tone
  const profitTone =
    currentNetProfit >= effectiveTarget
      ? "positive"
      : currentNetProfit < 0
        ? "negative"
        : "default"

  const profitToneClass = {
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-rose-600 dark:text-rose-400",
    default: "text-foreground",
  }[profitTone]

  return (
    <Card className="gap-4 px-4 py-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{accountIndex} · {backtestName}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {t("tracker.phase.eval")}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
            {rules.ddType === "EOD" ? "EOD DRAWDOWN" : "INTRADAY DRAWDOWN"}
          </Badge>
        </div>
        <Badge className={cn("text-[10px] px-2 py-0.5 border-0", statusCfg.className)}>
          {t(statusCfg.labelKey)}
        </Badge>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
        {/* Balance */}
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("tracker.dd.balance")}
          </p>
          <p className="font-heading text-lg font-semibold tabular-nums leading-none">
            {formatCurrency(final.balance)}
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {t("tracker.dd.availableDd")} {formatCurrency(final.ddBuffer)}
          </p>
        </div>

        {/* Profit target */}
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {consistency?.raisedByConsistency
              ? t("tracker.eval.effectiveTarget")
              : t("tracker.eval.target")}
          </p>
          <p
            className={cn(
              "font-heading text-lg font-semibold tabular-nums leading-none",
              profitToneClass,
            )}
          >
            {formatCurrency(currentNetProfit)}
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            / {formatCurrency(effectiveTarget)}
          </p>
        </div>

        {/* Trading days + secondary gates (consistency, profit days) — compact */}
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Trading days
          </p>
          <p className="font-heading text-lg font-semibold tabular-nums leading-none">
            {tradingDayCount}
          </p>
          {consistency !== null && (
            <p
              className={cn(
                "text-[10px] tabular-nums",
                currentNetProfit <= 0
                  ? "text-muted-foreground"
                  : consistency.satisfied
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
              )}
            >
              {t("tracker.funded.consistency")}{" "}
              {currentNetProfit > 0
                ? formatPercent(consistency.bestWinningDay / currentNetProfit)
                : "—"}
              {" / "}
              {formatPercent(consistency.pct)}
            </p>
          )}
          {evalResult?.minProfitDaysRequired != null && (
            <p
              className={cn(
                "text-[10px] tabular-nums",
                evalResult.profitDaysMet
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {(evalResult.profitDaysCount ?? 0)}/{evalResult.minProfitDaysRequired}{" "}
              {t("tracker.eval.profitDays")}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* MLL → TARGET progress bar — headline visual */}
      <div className="space-y-2">
        {/* Labels */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {t("tracker.progress.mll")}
            </span>{" "}
            {formatCurrency(floorBalance)}
            {final.locked && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">
                ({t("tracker.dd.locked")})
              </span>
            )}
          </span>
          <span>
            {t("tracker.progress.target")}{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(targetBalance)}
            </span>
          </span>
        </div>

        {/* Progress bar track */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          {/* Fill */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isBreached ? "bg-rose-500" : isPassed ? "bg-emerald-500" : "bg-primary/70",
            )}
            style={{ width: `${Math.max(2, clampedPosition * 100)}%` }}
          />
          {/* Balance marker line */}
          {!isBreached && (
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground/80"
              style={{ left: `${clampedPosition * 100}%` }}
            />
          )}
        </div>

        {/* Balance value */}
        <div className="text-center">
          <span className="text-xs font-medium tabular-nums">
            {t("tracker.progress.balanceMarker")}:{" "}
            <span
              className={cn(
                isBreached
                  ? "text-rose-600 dark:text-rose-400"
                  : isPassed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground",
              )}
            >
              {formatCurrency(final.balance)}
            </span>
          </span>
        </div>
      </div>

      {/* Lifecycle transition actions (C2b — tracker-driven) */}
      {onMarkFunded && (
        <>
          <Separator />
          <Button
            size="sm"
            className="w-full"
            onClick={onMarkFunded}
            disabled={isMarkFundedPending}
          >
            {isMarkFundedPending
              ? t("tracker.actions.markingFunded")
              : t("tracker.actions.markFunded")}
          </Button>
        </>
      )}

    </Card>
  )
}
