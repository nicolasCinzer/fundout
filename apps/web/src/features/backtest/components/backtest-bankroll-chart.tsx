import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/format"
import type { BankrollPoint } from "@/features/backtest/lib/compute-bankroll-curve"

const chartConfig = {
  bankroll: {
    label: "Bankroll",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

function compactCurrency(v: number): string {
  return `$${compactFormatter.format(v)}`
}

type Props = {
  data: BankrollPoint[]
  initialBankroll: number
}

export function BacktestBankrollChart({ data, initialBankroll }: Props) {
  const { t } = useTranslation("backtest")
  const hasEvents = data.length > 1

  return (
    <Card className="gap-3 px-4 py-3.5">
      <p className="text-sm font-medium text-muted-foreground border-b pb-2">
        {t("chart.title")}
      </p>
      {!hasEvents ? (
        <div className="flex h-[200px] items-center justify-center">
          <p className="text-xs text-muted-foreground text-center">
            {t("chart.emptyDescription")}
          </p>
        </div>
      ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full"
          >
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillBacktestBankroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-bankroll)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-bankroll)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="step"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                className="text-[10px]"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v) => compactCurrency(Number(v))}
                className="text-[10px]"
                domain={["dataMin", "dataMax"]}
              />
              <ReferenceLine
                y={initialBankroll}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(label) => t("chart.eventLabel", { n: label })}
                    formatter={(value, _name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                          <span className="text-muted-foreground">
                            {item.payload.event ? `${item.payload.event} →` : t("chart.initialLabel")}
                          </span>
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {formatCurrency(Number(value))}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="bankroll"
                type="monotone"
                fill="url(#fillBacktestBankroll)"
                stroke="var(--color-bankroll)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
      )}
    </Card>
  )
}
