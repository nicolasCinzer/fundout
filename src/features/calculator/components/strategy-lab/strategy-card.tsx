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
  muted?: boolean
}

function Kpi({ label, value, tone = 'default', muted = false }: KpiProps) {
  return (
    <div className="space-y-1">
      <p className={cn('text-xs font-medium', muted ? 'text-muted-foreground/70' : 'text-muted-foreground')}>
        {label}
      </p>
      <p className={cn('text-xl font-semibold tabular-nums leading-none', toneClasses[tone])}>
        {value}
      </p>
    </div>
  )
}

export function StrategyCard({ result }: Props) {
  const badgeLabel =
    result.kind === 'deterministic' ? 'Deterministic' : 'Monte Carlo (10k runs)'

  const evTone: Tone =
    result.evNetOfFees > 0 ? 'positive' : result.evNetOfFees < 0 ? 'negative' : 'default'

  const isStochastic = result.kind === 'stochastic'

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
          <div className="space-y-4">
            {/* Primary metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Kpi
                label="P(pass)"
                value={formatPercent(result.pPass)}
                tone={result.pPass > 0.5 ? 'positive' : 'default'}
              />
              <Kpi
                label="Expected payout when pass"
                value={formatCurrency(result.expectedPayout, true)}
              />
            </div>

            {/* Percentile distribution — stochastic only */}
            {isStochastic && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Payout distribution
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Kpi label="P5" value={formatCurrency(result.payoutP5, true)} muted />
                  <Kpi label="P50" value={formatCurrency(result.payoutP50, true)} muted />
                  <Kpi label="P95" value={formatCurrency(result.payoutP95, true)} muted />
                </div>
              </div>
            )}

            {/* Net EV */}
            <div className="border-t pt-3">
              <Kpi
                label="Net EV"
                value={formatCurrency(result.evNetOfFees, true)}
                tone={evTone}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
