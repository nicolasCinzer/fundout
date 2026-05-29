import { Card } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CalcResult } from '../types'

type Props = {
  result: CalcResult | null
}

const STRATEGY_LABELS: Record<string, string> = {
  'consistency': 'Consistency',
  'min-days': 'Min days',
  'single-shot': 'Single shot',
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
  const payoutProb = result ? formatPercent(result.pTotal) : '—'
  const ev = result ? formatCurrency(result.ev, true) : '—'
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
    ? `~${expectedAttempts} ${expectedAttempts === 1 ? 'attempt' : 'attempts'} per payout`
    : undefined

  const evHint =
    result && result.w > 0 ? `Gross payout: ${formatCurrency(result.w, true)}` : undefined

  const roiHint =
    maxCost !== null && maxCost > 0
      ? `Break-even cost: ${formatCurrency(maxCost, true)}`
      : undefined

  return (
    <div className="lg:sticky lg:top-4 space-y-3">
      <CompactKpi
        label="Payout probability"
        value={payoutProb}
        emphasized
        tone="positive"
        hint={payoutHint}
      />
      <div className="grid grid-cols-2 gap-3">
        <CompactKpi label="Expected value" value={ev} tone={evTone} hint={evHint} />
        <CompactKpi label="ROI" value={roi} tone={roiTone} hint={roiHint} />
      </div>

      {result && result.phases.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground">
            Phase breakdown
          </p>
          {result.phases.map((phase, i) => (
            <div
              key={i}
              className="rounded-md border bg-card px-3 py-2 space-y-1.5"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Phase {i + 1}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {STRATEGY_LABELS[phase.strategy] ?? phase.strategy}
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
            </div>
          ))}
        </div>
      )}

      {!result && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Fill in the form to see results
        </p>
      )}
    </div>
  )
}
