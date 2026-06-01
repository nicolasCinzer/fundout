import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
          Fill out the form to see the results
        </p>
      </div>
    )
  }

  const ruinTone: Tone = result.ruinRate > 0.5 ? 'negative' : result.ruinRate > 0.2 ? 'warning' : 'positive'
  const evTone: Tone = result.evPerAttempt > 0 ? 'positive' : result.evPerAttempt < 0 ? 'negative' : 'default'

  const avgAttemptsToRuinDisplay =
    result.avgAttemptsToRuin === 0 ? '—' : Math.round(result.avgAttemptsToRuin).toString()

  return (
    <div className="lg:sticky lg:top-4 space-y-3">
      {/* EV-negative advisory — ABOVE KPI #1 */}
      {result.evPerAttempt < 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          Negative EV: ruin only grows over time with this strategy.
        </div>
      )}

      {/* Ruin — headline */}
      <CompactKpi
        label="Ruin"
        value={formatPercent(result.ruinRate)}
        emphasized
        tone={ruinTone}
        hint={`${Math.round(result.ruinRate * result.simCount).toLocaleString()} accounts lost · ${Math.round(result.survivalRate * result.simCount).toLocaleString()} survived`}
      />

      {/* Final bankroll — with attempts/payouts badges */}
      <Card className="gap-2 px-4 py-3.5">
        <p className="text-sm font-medium text-muted-foreground">Final bankroll</p>
        <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums leading-none">
          {formatCurrency(result.avgFinalBankroll)}
        </p>
        <div className="mt-1 grid grid-cols-3 gap-1">
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground">p10</p>
            <p className="font-mono text-xs tabular-nums">{formatCurrency(result.p10FinalBankroll)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground">p50</p>
            <p className="font-mono text-xs tabular-nums">{formatCurrency(result.p50FinalBankroll)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground">p90</p>
            <p className="font-mono text-xs tabular-nums">{formatCurrency(result.p90FinalBankroll)}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
          <Badge variant="secondary" className="font-normal">
            <span className="text-muted-foreground">Avg attempts to ruin:&nbsp;</span>
            <span className="font-mono tabular-nums">{avgAttemptsToRuinDisplay}</span>
          </Badge>
          <Badge variant="secondary" className="font-normal">
            <span className="text-muted-foreground">Avg payouts:&nbsp;</span>
            <span className="font-mono tabular-nums">{result.avgPayoutsCollected.toFixed(1)}</span>
          </Badge>
        </div>
      </Card>

      {/* EV + Drawdown side by side */}
      <div className="grid grid-cols-2 gap-3">
        <CompactKpi
          label="EV per attempt"
          value={formatCurrency(result.evPerAttempt, true)}
          tone={evTone}
        />
        <CompactKpi
          label="Avg max drawdown"
          value={formatPercent(result.avgMaxDrawdownPct)}
          tone={result.avgMaxDrawdownPct > 0.5 ? 'negative' : 'default'}
        />
      </div>

      {/* P(reach target) — only when target provided */}
      {input?.targetBankroll !== undefined && (
        <CompactKpi
          label={`P(reach ${formatCurrency(input.targetBankroll)})`}
          value={formatPercent(result.pReachTarget)}
          tone={result.pReachTarget > 0.5 ? 'positive' : result.pReachTarget > 0.1 ? 'default' : 'negative'}
        />
      )}

      {/* Reference — minimal footer */}
      <p className="px-1 text-[11px] text-muted-foreground">
        Max attempts with no payouts: <span className="font-mono tabular-nums text-foreground">{result.maxAttemptsHeuristic}</span> · Simulations: <span className="font-mono tabular-nums text-foreground">{result.simCount.toLocaleString()}</span>
      </p>
    </div>
  )
}
