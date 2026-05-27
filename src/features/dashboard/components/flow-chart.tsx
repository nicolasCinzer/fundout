import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/format"
import type { FlowPoint } from "@/features/dashboard/lib/compute-flow"

const chartConfig = {
  fees: {
    label: "Fees paid",
    color: "var(--chart-4)",
  },
  payouts: {
    label: "Payouts (net)",
    color: "var(--chart-2)",
  },
  cumulative: {
    label: "Cumulative P&L",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

type FlowChartProps = {
  data: FlowPoint[]
}

export function FlowChart({ data }: FlowChartProps) {
  // Compact Y-axis tick labels when values are large enough that full
  // currency strings ($1,200,000) make the axis crowded.
  const max = data.reduce(
    (acc, p) => Math.max(acc, Math.abs(p.fees), Math.abs(p.payouts), Math.abs(p.cumulative)),
    0,
  )
  const compact = max >= 10_000

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily flow</CardTitle>
        <CardDescription>
          Fees and payouts by day, with cumulative net P&amp;L over the
          selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <ComposedChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              minTickGap={48}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(v) =>
                compact
                  ? `$${Math.round(Number(v) / 1000)}k`
                  : formatCurrency(Number(v))
              }
              width={64}
            />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value), true)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="fees"
              fill="var(--color-fees)"
              radius={[2, 2, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="payouts"
              fill="var(--color-payouts)"
              radius={[2, 2, 0, 0]}
              maxBarSize={24}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-cumulative)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
