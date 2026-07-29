import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { formatCurrency, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AccountRules, AccountState } from "@/features/backtest/types"

// ---------------------------------------------------------------------------
// BacktestFundedCard
//
// Funded-phase tracker card. Mirrors BacktestTrackerCard in structure but
// shows funded-specific data: DD floor (static), period profit, profit-days
// counter, funded consistency, and withdrawal eligibility badge.
//
// Actions:
//  - "Take payout" (when withdrawalEligible): amount input → calls onTakePayout
//  - "New eval" (when breached): calls onNewEval
//
// Satisfies: C2b-1 (FundedWithdrawalPanel), C2b-3 (LiveDdPanel funded sub-view),
//            REQ-FWG-06, REQ-FWG-07, REQ-PASS-06, REQ-PASS-07
// ---------------------------------------------------------------------------

type Props = {
  backtestName: string
  rules: AccountRules
  state: AccountState
  /** Called with the payout amount when the user confirms "Take payout". */
  onTakePayout: (amount: number) => Promise<void>
  isPayoutPending?: boolean
  /** When set (breached), show "New eval" action. */
  onNewEval?: () => void
}

export function BacktestFundedCard({
  backtestName,
  rules,
  state,
  onTakePayout,
  isPayoutPending,
  onNewEval,
}: Props) {
  const { t } = useTranslation("backtest")
  const [payoutInput, setPayoutInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { final, consistency, funded } = state
  const isBreached = final.breached
  const withdrawalEligible = funded?.withdrawalEligible ?? false
  const periodProfit = funded?.periodProfit ?? 0

  // Status
  const statusVariant = isBreached ? "breached" : withdrawalEligible ? "eligible" : "active"
  const statusConfig = {
    active: {
      labelKey: "tracker.status.funded",
      className:
        "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    },
    eligible: {
      labelKey: "tracker.status.withdrawalEligible",
      className:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    breached: {
      labelKey: "tracker.status.breached",
      className:
        "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    },
  } as const
  const statusCfg = statusConfig[statusVariant]

  // Period profit tone
  const periodProfitTone =
    periodProfit > 0 ? "positive" : periodProfit < 0 ? "negative" : "default"
  const periodProfitClass = {
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-rose-600 dark:text-rose-400",
    default: "text-foreground",
  }[periodProfitTone]

  // DD floor (static — never changes in funded phase)
  const ddFloor = final.threshold
  const ddBuffer = final.ddBuffer

  async function handleTakePayout() {
    const amount = parseFloat(payoutInput)
    if (isNaN(amount) || amount <= 0) return
    setIsSubmitting(true)
    try {
      await onTakePayout(amount)
      setPayoutInput("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPayoutBusy = isPayoutPending || isSubmitting

  return (
    <Card className="gap-4 px-4 py-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{backtestName}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {t("tracker.phase.funded")}
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Balance */}
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("tracker.dd.balance")}
          </p>
          <p className="font-heading text-lg font-semibold tabular-nums leading-none">
            {formatCurrency(final.balance)}
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {t("tracker.dd.startingBalance")} {formatCurrency(rules.startingBalance)}
          </p>
        </div>

        {/* Period profit */}
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("tracker.funded.periodProfit")}
          </p>
          <p
            className={cn(
              "font-heading text-lg font-semibold tabular-nums leading-none",
              periodProfitClass,
            )}
          >
            {periodProfit >= 0 ? "+" : ""}
            {formatCurrency(periodProfit)}
          </p>
        </div>

        {/* Trading days + secondary gates (consistency, profit days) — compact */}
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Trading days
          </p>
          <p className="font-heading text-lg font-semibold tabular-nums leading-none">
            {state.days.length}
          </p>
          {consistency !== null && (
            <p
              className={cn(
                "text-[10px] tabular-nums",
                periodProfit <= 0
                  ? "text-muted-foreground"
                  : consistency.satisfied
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
              )}
            >
              {t("tracker.funded.consistency")}{" "}
              {periodProfit > 0
                ? formatPercent(consistency.bestWinningDay / periodProfit)
                : "—"}
              {" / "}
              {formatPercent(consistency.pct)}
            </p>
          )}
          {funded?.minRequired != null && (
            <p
              className={cn(
                "text-[10px] tabular-nums",
                funded.profitDaysMet
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {funded.profitDaysCount}/{funded.minRequired}{" "}
              {t("tracker.funded.profitDays")}
            </p>
          )}
        </div>
      </div>

      {/* DD floor — static, never trails in funded */}
      <Separator />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("tracker.dd.threshold")}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(ddFloor)}
            </p>
            {final.locked && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 dark:text-amber-400"
              >
                {t("tracker.dd.locked")}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("tracker.dd.buffer")}
          </p>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              ddBuffer <= 0
                ? "text-rose-600 dark:text-rose-400"
                : ddBuffer < rules.ddAmount * 0.2
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {formatCurrency(ddBuffer)}
          </p>
        </div>
      </div>

      {/* Take payout action */}
      {!isBreached && withdrawalEligible && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {t("tracker.funded.withdrawalEligible")}
            </p>
            <div className="flex items-center gap-2">
              <InputGroup className="flex-1">
                <InputGroupAddon align="inline-start">
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="number"
                  step="any"
                  min="0"
                  placeholder={t("tracker.funded.payoutAmountPlaceholder")}
                  value={payoutInput}
                  onChange={(e) => setPayoutInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleTakePayout()
                    }
                  }}
                  disabled={isPayoutBusy}
                />
              </InputGroup>
              <Button
                size="sm"
                disabled={
                  isPayoutBusy ||
                  payoutInput === "" ||
                  isNaN(parseFloat(payoutInput)) ||
                  parseFloat(payoutInput) <= 0
                }
                onClick={handleTakePayout}
              >
                {isPayoutBusy
                  ? t("tracker.funded.takingPayout")
                  : t("tracker.funded.takePayout")}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Withdrawal blocked info (not breached, just not eligible yet) */}
      {!isBreached && !withdrawalEligible && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">
            {t("tracker.funded.withdrawalBlocked")}
          </p>
        </>
      )}

      {/* New eval action (breached) */}
      {onNewEval && isBreached && (
        <>
          <Separator />
          <Button variant="outline" size="sm" onClick={onNewEval}>
            {t("tracker.actions.newEval")}
          </Button>
        </>
      )}
    </Card>
  )
}
