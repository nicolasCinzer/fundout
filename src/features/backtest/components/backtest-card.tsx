import { Link } from "@tanstack/react-router"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { BacktestCardActions } from "./backtest-card-actions"
import type { Backtest } from "@/features/backtest/types"

type Props = {
  backtest: Backtest
  isGameOver?: boolean
}

export function BacktestCard({ backtest, isGameOver = false }: Props) {
  return (
    <div className="relative">
      <Link
        to="/backtest/$id"
        params={{ id: backtest.id }}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <Card className="gap-3 px-5 py-4 hover:ring-foreground/20 transition-shadow cursor-pointer">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-heading text-sm font-semibold truncate">
                {backtest.name}
              </h3>
              {isGameOver && (
                <Badge variant="destructive" className="shrink-0">
                  Terminado
                </Badge>
              )}
            </div>
            {/* Actions stop link propagation via onClick on trigger */}
            <div
              className="shrink-0"
              onClick={(e) => e.preventDefault()}
            >
              <BacktestCardActions backtest={backtest} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Bankroll{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatCurrency(Number(backtest.bankroll_initial), true)}
              </span>
            </span>
            <span>
              Eval{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatCurrency(Number(backtest.eval_cost), true)}
              </span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(backtest.created_at)}
          </p>
        </Card>
      </Link>
    </div>
  )
}
