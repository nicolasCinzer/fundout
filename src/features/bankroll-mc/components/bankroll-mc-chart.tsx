import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { BankrollMcResult } from '../types'

const SAMPLED_PATHS = 250 as const
const X_TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

type Props = {
  result: BankrollMcResult | null
}

type ChartRow = Record<string, number | null> & { x: number }

function buildChartData(result: BankrollMcResult): ChartRow[] {
  return Array.from({ length: 101 }, (_, x) => {
    const row: ChartRow = { x }
    row.p10 = result.percentileP10[x]
    row.p50 = result.percentileP50[x]
    row.p90 = result.percentileP90[x]
    for (let i = 0; i < SAMPLED_PATHS; i++) {
      const path = result.sampledPaths[i]
      row[`s${i}`] = path && x < path.length ? path[x] : null
    }
    return row
  })
}

// Custom inline legend above the chart
function ChartLegend() {
  return (
    <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-4 bg-destructive" />
        <span>p10</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-4 bg-primary" />
        <span>p50</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-4 bg-chart-2" />
        <span>p90</span>
      </div>
    </div>
  )
}

export function BankrollMcChart({ result }: Props) {
  if (!result) {
    return (
      <div className="flex items-center justify-center rounded-md border bg-muted/20 aspect-video">
        <p className="text-xs text-muted-foreground">El gráfico aparece cuando el formulario es válido</p>
      </div>
    )
  }

  const data = buildChartData(result)

  // Spaghetti path series — rendered first (behind percentile lines)
  const spaghettiLines = Array.from({ length: SAMPLED_PATHS }, (_, i) => (
    <Line
      key={`s${i}`}
      type="linear"
      dataKey={`s${i}`}
      stroke="var(--muted-foreground)"
      strokeOpacity={0.08}
      strokeWidth={1}
      dot={false}
      isAnimationActive={false}
      connectNulls={false}
      activeDot={false}
      legendType="none"
    />
  ))

  return (
    <div>
      <ChartLegend />
      {/* No tooltip in v1 — 253 series makes it unusable.
          If percentile-only tooltip is needed later, add a custom content renderer
          that filters series by dataKey.startsWith('p'). */}
      <ResponsiveContainer width="100%" aspect={16 / 9}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, 100]}
            ticks={X_TICKS}
            tick={{ fontSize: 10 }}
            label={{ value: 'Intento', position: 'insideBottom', offset: -2, fontSize: 10 }}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 10 }}
            width={72}
          />

          {/* Spaghetti: 250 low-opacity grey paths (behind percentile lines) */}
          {spaghettiLines}

          {/* Percentile overlays — on top */}
          <Line
            dataKey="p10"
            stroke="var(--destructive)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
            legendType="none"
          />
          <Line
            dataKey="p50"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
            legendType="none"
          />
          <Line
            dataKey="p90"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
