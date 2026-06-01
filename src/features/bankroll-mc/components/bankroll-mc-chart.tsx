import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { BankrollMcResult } from '../types'

const X_TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

type Props = {
  result: BankrollMcResult | null
}

type ChartRow = {
  x: number
  p10: number | null
  p50: number | null
  p90: number | null
  range: [number, number] | null
}

function buildChartData(result: BankrollMcResult): ChartRow[] {
  return Array.from({ length: 101 }, (_, x) => {
    const p10 = result.percentileP10[x]
    const p50 = result.percentileP50[x]
    const p90 = result.percentileP90[x]
    return {
      x,
      p10: p10 ?? null,
      p50: p50 ?? null,
      p90: p90 ?? null,
      range: p10 != null && p90 != null ? [p10, p90] : null,
    }
  })
}

function ChartHeader() {
  return (
    <div className="mb-3 space-y-2">
      <div>
        <h3 className="text-sm font-medium">Bankroll distribution over time</h3>
        <p className="text-xs text-muted-foreground">
          Each X point is an attempt (0 → 100). The chart summarizes how your
          bankroll evolves across the 10&nbsp;000 simulated runs.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-primary/30" />
          <span>
            <strong className="text-foreground">p10–p90 band</strong>: range where
            the central 80&nbsp;% of runs land
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-primary" />
          <span>
            <strong className="text-foreground">p50 (median)</strong>: the typical
            run
          </span>
        </div>
      </div>
    </div>
  )
}

type TooltipPayload = {
  payload?: ChartRow
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: number }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  const hasData = row.p50 != null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">Attempt {label}</div>
      {hasData ? (
        <div className="space-y-0.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">p90 (top 10%)</span>
            <span className="font-mono">{formatCurrency(row.p90 ?? 0)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">p50 (median)</span>
            <span className="font-mono">{formatCurrency(row.p50 ?? 0)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">p10 (bottom 10%)</span>
            <span className="font-mono">{formatCurrency(row.p10 ?? 0)}</span>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">No runs alive at this attempt</div>
      )}
    </div>
  )
}

export function BankrollMcChart({ result }: Props) {
  if (!result) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-md border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          The chart appears once you calculate with a valid form
        </p>
      </div>
    )
  }

  const data = buildChartData(result)

  return (
    <div>
      <ChartHeader />
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 20, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, 100]}
            ticks={X_TICKS}
            tick={{ fontSize: 11 }}
            label={{ value: 'Attempt', position: 'insideBottom', offset: -8, fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 11 }}
            width={80}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }} />

          <Area
            type="monotone"
            dataKey="range"
            stroke="none"
            fill="var(--primary)"
            fillOpacity={0.18}
            isAnimationActive={false}
            connectNulls={false}
            activeDot={false}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="p50"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
            activeDot={{ r: 4 }}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
