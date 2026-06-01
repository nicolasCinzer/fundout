import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { BankrollMcResult } from '../types'

const X_TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

type Props = {
  result: BankrollMcResult | null
}

type ChartRow = {
  x: number
  p50: number | null
  range: [number, number] | null
}

function buildChartData(result: BankrollMcResult): ChartRow[] {
  return Array.from({ length: 101 }, (_, x) => {
    const p10 = result.percentileP10[x]
    const p90 = result.percentileP90[x]
    const p50 = result.percentileP50[x]
    return {
      x,
      p50: p50 ?? null,
      range: p10 != null && p90 != null ? [p10, p90] : null,
    }
  })
}

function ChartLegend() {
  return (
    <div className="mb-3 space-y-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-primary/30" />
          <span>
            <strong className="text-foreground">Banda p10–p90</strong>: donde cae
            el bankroll del 80&nbsp;% de las corridas en cada intento
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-primary" />
          <span>
            <strong className="text-foreground">p50 (mediana)</strong>: la
            corrida típica — la mitad termina por encima y la mitad por debajo
          </span>
        </div>
      </div>
      <p className="text-[11px] leading-snug">
        Las corridas que se funden dejan de aportar al cálculo desde ese intento
        en adelante. Eje X: número de intento. Eje Y: bankroll en €.
      </p>
    </div>
  )
}

export function BankrollMcChart({ result }: Props) {
  if (!result) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-md border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          El gráfico aparece cuando calculás con un formulario válido
        </p>
      </div>
    )
  }

  const data = buildChartData(result)

  return (
    <div>
      <ChartLegend />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 16, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, 100]}
            ticks={X_TICKS}
            tick={{ fontSize: 10 }}
            label={{ value: 'Intento', position: 'insideBottom', offset: -6, fontSize: 10 }}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 10 }}
            width={72}
          />

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
            activeDot={false}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
