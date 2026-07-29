import { useRef, useState } from "react"
import { Plus, Trash2, CalendarDays, Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { formatCurrency, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SessionOps } from "@/features/backtest/hooks/use-backtest-session"
import type { TradingDay } from "@/features/backtest/types"

// ---------------------------------------------------------------------------
// BacktestTradeEntry
//
// Day-centric entry: trading days are shown as compact square cards (day #,
// day net, and the day's share of net profit). Trades are added to the current
// (last) day via the input; per-trade detail is intentionally not listed — what
// matters is how each day closes. Keeps the module short.
// ---------------------------------------------------------------------------

type Props = {
  days: TradingDay[]
  ops: SessionOps
}

const netOf = (d: TradingDay) => d.trades.reduce((s, tr) => s + tr.pnl, 0)

export function BacktestTradeEntry({ days, ops }: Props) {
  const { t } = useTranslation("backtest")
  const [pnlInput, setPnlInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Always operate on the last day.
  const currentDay = days.length > 0 ? days[days.length - 1] : null
  const totalNet = days.reduce((s, d) => s + netOf(d), 0)

  function handleAddDay() {
    ops.addDay({ id: crypto.randomUUID(), trades: [] })
  }

  function handleAddTrade() {
    const pnl = parseFloat(pnlInput)
    if (isNaN(pnl) || currentDay === null) return
    ops.addTrade(currentDay.id, { id: crypto.randomUUID(), pnl })
    setPnlInput("")
    inputRef.current?.focus()
  }

  function handleUndoLastTrade() {
    if (!currentDay || currentDay.trades.length === 0) return
    const last = currentDay.trades[currentDay.trades.length - 1]
    ops.removeTrade(currentDay.id, last.id)
  }

  return (
    <Card className="gap-3 px-4 py-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <p className="text-sm font-medium text-muted-foreground">
          {t("tracker.day.daysTitle")}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={handleAddDay}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {t("tracker.day.add")}
        </Button>
      </div>

      {/* Day squares */}
      {days.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {days.map((day, idx) => {
            const net = netOf(day)
            const pct = net > 0 && totalNet > 0 ? net / totalNet : 0
            const isCurrent = idx === days.length - 1
            const tone =
              net > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : net < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
            return (
              <div
                key={day.id}
                className={cn(
                  "group relative rounded-lg border px-2 py-2 text-center",
                  isCurrent
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-muted/20",
                )}
              >
                <p className="text-[10px] text-muted-foreground">
                  {t("tracker.day.label", { n: idx + 1 })}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums leading-tight",
                    tone,
                  )}
                >
                  {net >= 0 ? "+" : ""}
                  {formatCurrency(net)}
                </p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {formatPercent(pct)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-0.5 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => ops.removeDay(day.id)}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="py-2 text-center text-xs text-muted-foreground">
          {t("tracker.day.noDays")}
        </p>
      )}

      {/* Current-day trade input */}
      {currentDay && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("tracker.trade.pnl")}</p>
            {currentDay.trades.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
                onClick={handleUndoLastTrade}
              >
                <Undo2 className="h-3 w-3" />
                {t("tracker.trade.undoLast")}
              </Button>
            )}
          </div>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              type="number"
              step="any"
              placeholder={t("tracker.trade.pnlPlaceholder")}
              value={pnlInput}
              onChange={(e) => setPnlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTrade()
                }
              }}
            />
            <InputGroupAddon align="inline-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={pnlInput === "" || isNaN(parseFloat(pnlInput))}
                onClick={handleAddTrade}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
          <p className="text-[10px] text-muted-foreground/70">
            {t("tracker.trade.pressEnter")}
          </p>
        </div>
      )}
    </Card>
  )
}
