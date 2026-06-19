import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CalcResult } from '../types'

type Props = {
  result: CalcResult | null
}

// Strategy labels use toggle keys from calculator namespace
const STRATEGY_KEY_MAP: Record<string, string> = {
  'consistency': 'form.toggles.consistency',
  'min-days': 'form.toggles.minTradingDays',
  'single-shot': 'form.toggles.fundedPhase',
}

type Tone = 'default' | 'positive' | 'negative'

const toneClasses: Record<Tone, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
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

export function CalculatorResults({ result }: Props) {
  const { t } = useTranslation('calculator')
  const payoutProb = result ? formatPercent(result.pTotal) : '—'
  const ev = result ? formatCurrency(result.ev) : '—'
  const roi = result
    ? result.roi !== null
      ? formatPercent(result.roi)
      : '—'
    : '—'

  const evTone: Tone = result
    ? result.ev > 0
      ? 'positive'
      : result.ev < 0
        ? 'negative'
        : 'default'
    : 'default'

  const roiTone: Tone = result
    ? result.roi !== null
      ? result.roi > 0
        ? 'positive'
        : result.roi < 0
          ? 'negative'
          : 'default'
      : 'default'
    : 'default'

  const expectedAttempts =
    result && result.pTotal > 0 ? Math.ceil(1 / result.pTotal) : null

  const maxCost = result ? Math.max(0, result.pTotal * result.w) : null

  const payoutHint = expectedAttempts
    ? t('results.attemptsHint', { count: expectedAttempts })
    : undefined

  const evHint =
    result && result.w > 0
      ? t('results.grossPayout', { amount: formatCurrency(result.w) })
      : undefined

  const roiHint =
    maxCost !== null && maxCost > 0
      ? t('results.breakEvenCost', { amount: formatCurrency(maxCost) })
      : undefined

  return (
    <div className="lg:sticky lg:top-4 space-y-3">
      <CompactKpi
        label={t('results.payoutProbability')}
        value={payoutProb}
        emphasized
        tone="positive"
        hint={payoutHint}
      />
      <div className="grid grid-cols-2 gap-3">
        <CompactKpi label={t('results.expectedValue')} value={ev} tone={evTone} hint={evHint} />
        <CompactKpi label={t('results.roi')} value={roi} tone={roiTone} hint={roiHint} />
      </div>

      {result && result.phases.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground">
            {t('results.phaseBreakdown')}
          </p>
          {result.phases.map((phase, i) => (
            <div
              key={i}
              className="rounded-md border bg-card px-3 py-2 space-y-1.5"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t('form.phase', { number: i + 1 })}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {STRATEGY_KEY_MAP[phase.strategy] ? t(STRATEGY_KEY_MAP[phase.strategy] as Parameters<typeof t>[0]) : phase.strategy}
                  </Badge>
                </div>
                <span className="tabular-nums font-medium">
                  {formatPercent(phase.pPhase)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(2, phase.pPhase * 100)}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono tabular-nums text-muted-foreground">
                <span className="uppercase tracking-wide not-mono font-sans font-semibold text-[9px]">
                  {t('results.plan')}
                </span>
                {phase.ddEffective.map((ddEff, d) => (
                  <span key={d}>
                    {Math.round(ddEff)}
                    <span className="text-muted-foreground/60">:</span>
                    {Math.round(phase.dailyTargets[d])}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!result && (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t('results.noResults')}
        </p>
      )}
    </div>
  )
}
