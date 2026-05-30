import { ChevronDown } from 'lucide-react'
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
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn('text-lg font-semibold tabular-nums leading-none', toneClasses[tone])}>
        {value}
      </p>
    </div>
  )
}

const HOW_IT_WORKS: Record<string, string[]> = {
  'mc-cushion': [
    'Day 1 — stop-loss at the full account drawdown, take-profit at the funded objective. Probability of hitting target = drawdown / (drawdown + objective). Win → cushion equal to the objective; lose → account blown.',
    'After day 1 — each min-profit day, take a 1:1 trade against the daily minimum profit (50/50). Wins count toward the min-trading-days requirement; losses consume from the cushion without blowing the account.',
    'You pass when the required min-trading-days are completed before the cushion runs out.',
  ],
}

export function StrategyCard({ result }: Props) {
  const badgeLabel =
    result.kind === 'deterministic' ? 'Deterministic' : 'Monte Carlo (10k runs)'

  const evTone: Tone =
    result.evNetOfFees > 0 ? 'positive' : result.evNetOfFees < 0 ? 'negative' : 'default'

  const isStochastic = result.kind === 'stochastic'
  const steps = HOW_IT_WORKS[result.strategyId]
  const hasRange =
    isStochastic && result.payoutP95IfPass > result.payoutP5IfPass

  return (
    <Card className={cn('transition-opacity', !result.applicable && 'opacity-60')}>
      <CardHeader className="pb-3 gap-1.5">
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
          <div className="space-y-3">
            <div
              className={cn(
                'grid gap-4 border-t pt-3',
                hasRange ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3',
              )}
            >
              <Kpi
                label="P(pass)"
                value={formatPercent(result.pPass)}
                tone={result.pPass > 0.5 ? 'positive' : 'default'}
              />
              <Kpi
                label="Expected payout"
                value={formatCurrency(result.expectedPayout, true)}
              />
              {hasRange && (
                <Kpi
                  label="Range (P5—P95)"
                  value={`${formatCurrency(result.payoutP5IfPass, true)} — ${formatCurrency(result.payoutP95IfPass, true)}`}
                />
              )}
              <Kpi
                label="Net EV"
                value={formatCurrency(result.evNetOfFees, true)}
                tone={evTone}
              />
            </div>

            {steps && (
              <details className="group border-t pt-2">
                <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                  How it works
                </summary>
                <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-foreground/60">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
