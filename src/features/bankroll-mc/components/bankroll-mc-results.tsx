import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { BankrollMcResult } from '../types'
import type { BankrollMcInput } from '../types'

type Props = {
  result: BankrollMcResult | null
  input: BankrollMcInput | null
}

type Tone = 'default' | 'positive' | 'negative' | 'warning'

const toneClasses: Record<Tone, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
}

type CompactKpiProps = {
  label: string
  value: string
  hint?: string
  tone?: Tone
  emphasized?: boolean
}

function CompactKpi({ label, value, hint, tone = 'default', emphasized = false }: CompactKpiProps) {
  return (
    <Card
      className={cn(
        'gap-2 px-4 py-3.5',
        emphasized && 'border-primary/40 shadow-sm',
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-heading font-semibold tracking-tight tabular-nums leading-none',
          emphasized ? 'text-3xl' : 'text-2xl',
          toneClasses[tone],
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

export function BankrollMcResults({ result, input }: Props) {
  if (!result) {
    return (
      <div className="lg:sticky lg:top-4 space-y-3">
        <p className="text-xs text-muted-foreground text-center py-4">
          Completá el formulario para ver los resultados
        </p>
      </div>
    )
  }

  const ruinTone: Tone = result.ruinRate > 0.5 ? 'negative' : result.ruinRate > 0.2 ? 'warning' : 'positive'
  const evTone: Tone = result.evPerAttempt > 0 ? 'positive' : result.evPerAttempt < 0 ? 'negative' : 'default'
  const survivalTone: Tone = result.survivalRate > 0.5 ? 'positive' : result.survivalRate > 0.1 ? 'default' : 'negative'

  const avgAttemptsToRuinDisplay =
    result.avgAttemptsToRuin === 0 ? '—' : Math.round(result.avgAttemptsToRuin).toString()

  return (
    <div className="lg:sticky lg:top-4 space-y-3">
      {/* EV-negative advisory — ABOVE KPI #1 */}
      {result.evPerAttempt < 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          EV negativo: la ruina solo crece con el tiempo en esta estrategia.
        </div>
      )}

      {/* KPI #1: Ruina % */}
      <CompactKpi
        label="Ruina"
        value={formatPercent(result.ruinRate)}
        emphasized
        tone={ruinTone}
        hint={`${Math.round(result.ruinRate * result.simCount).toLocaleString()} cuentas perdidas · ${Math.round(result.survivalRate * result.simCount).toLocaleString()} sobrevivieron`}
      />

      {/* KPI #2: Bankroll final — avg / p10 / p50 / p90 */}
      <Card className="gap-2 px-4 py-3.5">
        <p className="text-sm font-medium text-muted-foreground">Bankroll final</p>
        <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums leading-none">
          {formatCurrency(result.avgFinalBankroll)}
        </p>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">p10</p>
            <p className="text-xs font-mono tabular-nums">{formatCurrency(result.p10FinalBankroll)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">p50</p>
            <p className="text-xs font-mono tabular-nums">{formatCurrency(result.p50FinalBankroll)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">p90</p>
            <p className="text-xs font-mono tabular-nums">{formatCurrency(result.p90FinalBankroll)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {/* KPI #3: Avg intentos a ruina */}
        <CompactKpi
          label="Avg intentos a ruina"
          value={avgAttemptsToRuinDisplay}
          hint="solo runs ruinados"
        />

        {/* KPI #4: Avg payouts cobrados */}
        <CompactKpi
          label="Avg payouts"
          value={result.avgPayoutsCollected.toFixed(1)}
        />
      </div>

      {/* KPI #5: EV por intento */}
      <CompactKpi
        label="EV por intento"
        value={formatCurrency(result.evPerAttempt, true)}
        tone={evTone}
      />

      {/* KPI #6: Drawdown máx. promedio */}
      <CompactKpi
        label="Drawdown máx. promedio"
        value={formatPercent(result.avgMaxDrawdownPct)}
        tone={result.avgMaxDrawdownPct > 0.5 ? 'negative' : 'default'}
      />

      {/* KPI #7: P(alcanzar target) — ONLY when target provided */}
      {input?.targetBankroll !== undefined && (
        <CompactKpi
          label={`P(alcanzar ${formatCurrency(input.targetBankroll)})`}
          value={formatPercent(result.pReachTarget)}
          tone={result.pReachTarget > 0.5 ? 'positive' : result.pReachTarget > 0.1 ? 'default' : 'negative'}
        />
      )}

      {/* KPI #8: Supervivencia % */}
      <CompactKpi
        label="Supervivencia"
        value={formatPercent(result.survivalRate)}
        tone={survivalTone}
      />

      {/* KPI #9: Referencias */}
      <Card className="gap-1 px-4 py-3">
        <p className="text-sm font-medium text-muted-foreground">Referencia</p>
        <p className="text-xs text-muted-foreground">
          Max intentos sin payouts: <span className="font-mono tabular-nums text-foreground">{result.maxAttemptsHeuristic}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Simulaciones: <span className="font-mono tabular-nums text-foreground">{result.simCount.toLocaleString()}</span>
        </p>
      </Card>
    </div>
  )
}
