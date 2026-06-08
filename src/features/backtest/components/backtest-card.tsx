import { Link } from "@tanstack/react-router"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { BacktestCardActions } from "./backtest-card-actions"
import type { Backtest, BacktestStats } from "@/features/backtest/types"

type Props = {
  backtest: Backtest
  stats: BacktestStats
}

export function BacktestCard({ backtest, stats }: Props) {
  const isGameOver = stats.isGameOver
  const hasEvents = stats.counts.E > 0

  const bankrollTone = isGameOver
    ? "text-amber-600 dark:text-amber-400"
    : stats.bankrollCurrent > stats.bankrollInitial
      ? "text-emerald-600 dark:text-emerald-400"
      : stats.bankrollCurrent < stats.bankrollInitial
        ? "text-rose-600 dark:text-rose-400"
        : "text-foreground"

  const roiTone =
    stats.netProfit > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : stats.netProfit < 0
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground"

  return (
    <div className="relative">
      <Link
        to="/backtest/$id"
        params={{ id: backtest.id }}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <Card className="gap-3 px-4 py-3.5 transition-shadow hover:ring-1 hover:ring-foreground/20 cursor-pointer">
          {/* Header: name + asset + game-over badge + actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h3 className="font-heading text-sm font-semibold truncate">
                {backtest.name}
              </h3>
              {backtest.asset && (
                <Badge variant="secondary" className="font-mono shrink-0">
                  {backtest.asset}
                </Badge>
              )}
              {isGameOver && (
                <Badge variant="destructive" className="shrink-0">
                  Ended
                </Badge>
              )}
            </div>
            <div
              className="shrink-0"
              onClick={(e) => e.preventDefault()}
            >
              <BacktestCardActions backtest={backtest} />
            </div>
          </div>

          {/* Setup meta */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span>
              {formatCurrency(Number(backtest.bankroll_initial))} start
            </span>
            <span aria-hidden>·</span>
            <span>{formatCurrency(Number(backtest.eval_cost))} / eval</span>
            <span aria-hidden>·</span>
            <span>{formatDate(backtest.created_at)}</span>
          </div>

          {hasEvents ? (
            <>
              {/* Headline: current bankroll + ROI */}
              <div className="flex items-end justify-between gap-2 border-t pt-3">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Current
                  </p>
                  <p
                    className={cn(
                      "font-heading text-xl font-semibold tabular-nums leading-none",
                      bankrollTone,
                    )}
                  >
                    {formatCurrency(stats.bankrollCurrent)}
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    ROI
                  </p>
                  <p
                    className={cn(
                      "font-heading text-sm font-semibold tabular-nums leading-none",
                      roiTone,
                    )}
                  >
                    {formatPercent(stats.roi)}
                  </p>
                </div>
              </div>

              {/* Mini stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Evals" value={String(stats.counts.E)} />
                <MiniStat label="Funded" value={String(stats.counts.F)} />
                <MiniStat label="Payouts" value={String(stats.counts.P)} />
              </div>
            </>
          ) : (
            <div className="border-t pt-3">
              <p className="text-[11px] text-muted-foreground italic">
                No events yet — click to start.
              </p>
            </div>
          )}
        </Card>
      </Link>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/30 px-2 py-1.5 space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
        {label}
      </p>
      <p className="font-heading text-sm font-semibold tabular-nums leading-none">
        {value}
      </p>
    </div>
  )
}
