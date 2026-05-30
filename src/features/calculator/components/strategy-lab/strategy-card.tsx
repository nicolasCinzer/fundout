import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { StrategyResult } from '../../strategies'

type Props = {
  result: StrategyResult
}

type Tone = 'default' | 'positive' | 'negative'

const toneClasses: Record<Tone, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
}

type KpiProps = {
  label: string
  value: string
  tone?: Tone
}

function Kpi({ label, value, tone = 'default' }: KpiProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-semibold tabular-nums leading-none', toneClasses[tone])}>
        {value}
      </p>
    </div>
  )
}

// Strategy-specific explanation copy. Keyed by strategyId so each runner
// owns its own "how it works" narrative without bloating StrategyResult.
const HOW_IT_WORKS: Record<string, { title: string; steps: string[]; tradeoff: string }> = {
  'mc-cushion': {
    title: 'How it works',
    steps: [
      'Day 1 — trade with the stop-loss at the full account drawdown and the take-profit at the funded objective. Probability of hitting target = drawdown / (drawdown + objective). Win → cushion equal to the objective; lose → account blown.',
      'After day 1 — each min-profit day, take a 1:1 trade against the daily minimum profit (50/50). Wins count toward the min-trading-days requirement; losses consume from the cushion without blowing the account.',
      'You pass when the required min-trading-days are completed before the cushion runs out.',
    ],
    tradeoff:
      'Trade-off vs the standard plan: lower day-1 probability when objective > drawdown, but larger cushion + higher payout when you do pass. Payout is stochastic — the final amount depends on how many losing days you accumulate.',
  },
}

export function StrategyCard({ result }: Props) {
  const badgeLabel =
    result.kind === 'deterministic' ? 'Deterministic' : 'Monte Carlo (10k runs)'

  const evTone: Tone =
    result.evNetOfFees > 0 ? 'positive' : result.evNetOfFees < 0 ? 'negative' : 'default'

  const isStochastic = result.kind === 'stochastic'
  const howItWorks = HOW_IT_WORKS[result.strategyId]

  return (
    <Card className={cn('transition-opacity', !result.applicable && 'opacity-60')}>
      <CardHeader className="pb-3 gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{result.label}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px] px-2 py-0.5">
            {badgeLabel}
          </Badge>
        </div>
        <CardDescription className="text-xs leading-relaxed">
          {result.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!result.applicable ? (
          <p className="text-sm text-muted-foreground">{result.notApplicableReason}</p>
        ) : (
          <div className="space-y-5">
            {howItWorks && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {howItWorks.title}
                </p>
                <ol className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  {howItWorks.steps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-foreground/60">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <Kpi
                label="Probability of pass"
                value={formatPercent(result.pPass)}
                tone={result.pPass > 0.5 ? 'positive' : 'default'}
              />
              <Kpi
                label="Expected payout when pass"
                value={formatCurrency(result.expectedPayout, true)}
              />
            </div>

            {isStochastic && result.payoutP95IfPass > result.payoutP5IfPass && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Payout range when pass (P5 — P95)
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(result.payoutP5IfPass, true)}
                  <span className="text-muted-foreground"> — </span>
                  {formatCurrency(result.payoutP95IfPass, true)}
                </p>
                <p className="text-xs text-muted-foreground">
                  90% of successful runs land in this range.
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <Kpi
                label="Net EV"
                value={formatCurrency(result.evNetOfFees, true)}
                tone={evTone}
              />
            </div>

            {howItWorks && (
              <p className="text-xs leading-relaxed text-muted-foreground border-t pt-3">
                {howItWorks.tradeoff}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
