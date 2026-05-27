import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
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
          Fees spent vs net payouts received per month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
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
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value), true)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="fees" fill="var(--color-fees)" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="payouts"
              fill="var(--color-payouts)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
