import { Badge } from "@/components/ui/badge"
import type { Backtest } from "@/features/backtest/types"

type Props = {
  backtest: Backtest
}

export function BacktestMetaHeader({ backtest }: Props) {
  const { asset, period, strategy } = backtest

  if (!asset && !period && !strategy) return null

  return (
    <div className="space-y-1 min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {asset && (
          <Badge variant="secondary" className="font-mono">
            {asset}
          </Badge>
        )}
        {period && (
          <span className="text-xs text-muted-foreground">
            <span className="text-muted-foreground/70">Period:</span>{" "}
            <span className="text-foreground">{period}</span>
          </span>
        )}
      </div>
      {strategy && (
        <p className="text-xs text-muted-foreground leading-snug max-w-prose">
          {strategy}
        </p>
      )}
    </div>
  )
}
