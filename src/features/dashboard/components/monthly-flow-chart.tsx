import {
  CartesianGrid,
  Line,
  LineChart,
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
import type { MonthlyFlowPoint } from "@/features/dashboard/lib/compute-monthly-flow"

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

type MonthlyFlowChartProps = {
  data: MonthlyFlowPoint[]
}

export function MonthlyFlowChart({ data }: MonthlyFlowChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly flow</CardTitle>
        <CardDescription>
          Fees vs payouts per month, with cumulative net P&amp;L over the
          selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <LineChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(v) => formatCurrency(Number(v))}
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
            <Line
              type="monotone"
              dataKey="fees"
              stroke="var(--color-fees)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="payouts"
              stroke="var(--color-payouts)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-cumulative)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
