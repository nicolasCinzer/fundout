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

const topBadgeToneClasses: Record<Tone, string> = {
  default: 'border-primary/20 bg-primary/10 text-primary',
  positive: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  negative: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
}

function TopBadge({ children, tone = 'default' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums',
        topBadgeToneClasses[tone],
      )}
    >
      {children}
    </span>
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
  const ddTone: Tone = result.avgMaxDrawdownPct > 0.5 ? 'negative' : 'default'
  const pReachTone: Tone = result.pReachTarget > 0.5 ? 'positive' : result.pReachTarget > 0.1 ? 'default' : 'negative'

  const avgAttemptsToRuinDisplay =
    result.avgAttemptsToRuin === 0 ? '—' : Math.round(result.avgAttemptsToRuin).toString()

  return (
    <div className="lg:sticky lg:top-4 space-y-3">
      {/* EV-negative advisory */}
      {result.evPerAttempt < 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          Negative EV: ruin only grows over time with this strategy.
        </div>
      )}

      {/* Ruin — headline, EV as top badge */}
      <Card className="gap-2 border-primary/40 px-4 py-3.5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">Ruin</p>
          <TopBadge tone={evTone}>EV {formatCurrency(result.evPerAttempt, true)}/attempt</TopBadge>
        </div>
        <p
          className={cn(
            'font-heading text-3xl font-semibold leading-none tracking-tight tabular-nums',
            toneClasses[ruinTone],
          )}
        >
          {formatPercent(result.ruinRate)}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round(result.ruinRate * result.simCount).toLocaleString()} accounts lost · {Math.round(result.survivalRate * result.simCount).toLocaleString()} survived
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
          <Badge variant="secondary" className="font-normal">
            <span className="text-muted-foreground">Max attempts with no payouts:&nbsp;</span>
            <span className="font-mono tabular-nums">{result.maxAttemptsHeuristic}</span>
          </Badge>
        </div>
      </Card>

      {/* Final bankroll — percentiles as top badges */}
      <Card className="gap-2 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">Final bankroll</p>
          <div className="flex flex-wrap justify-end gap-1">
            <TopBadge>p10 {formatCurrency(result.p10FinalBankroll)}</TopBadge>
            <TopBadge>p50 {formatCurrency(result.p50FinalBankroll)}</TopBadge>
            <TopBadge>p90 {formatCurrency(result.p90FinalBankroll)}</TopBadge>
          </div>
        </div>
        <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums leading-none">
          {formatCurrency(result.avgFinalBankroll)}
        </p>
        <p className="text-xs text-muted-foreground">average across all runs</p>
      </Card>

      {/* Averages — combined card */}
      <Card className="gap-1 px-4 py-3">
        <p className="text-sm font-medium text-muted-foreground">Averages</p>
        <div className="mt-1 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Attempts to ruin</span>
            <span className="font-mono font-medium tabular-nums">{avgAttemptsToRuinDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payouts collected</span>
            <span className="font-mono font-medium tabular-nums">{result.avgPayoutsCollected.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Max drawdown</span>
            <span className={cn('font-mono font-medium tabular-nums', toneClasses[ddTone])}>
              {formatPercent(result.avgMaxDrawdownPct)}
            </span>
          </div>
        </div>
      </Card>

      {/* P(reach target) — only when target provided */}
      {input?.targetBankroll !== undefined && (
        <Card className="gap-2 px-4 py-3.5">
          <p className="text-sm font-medium text-muted-foreground">
            P(reach {formatCurrency(input.targetBankroll)})
          </p>
          <p
            className={cn(
              'font-heading text-2xl font-semibold leading-none tracking-tight tabular-nums',
              toneClasses[pReachTone],
            )}
          >
            {formatPercent(result.pReachTarget)}
          </p>
        </Card>
      )}

      {/* Footer */}
      <p className="px-1 text-[11px] text-muted-foreground">
        Based on <span className="font-mono tabular-nums text-foreground">{result.simCount.toLocaleString()}</span> simulations
      </p>
    </div>
  )
}
