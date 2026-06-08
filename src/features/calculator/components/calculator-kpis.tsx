import { Card } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CalcResult } from '../types'

type Props = {
  result: CalcResult | null
}

type Tone = 'default' | 'positive' | 'negative'

const toneClasses: Record<Tone, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
}

type KpiCardProps = {
  label: string
  value: string
  hint?: string
  tone?: Tone
}

function KpiCard({ label, value, hint, tone = 'default' }: KpiCardProps) {
  return (
    <Card className="gap-2 px-4 py-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-heading font-semibold tracking-tight tabular-nums leading-none text-3xl',
          toneClasses[tone],
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

export function CalculatorKpis({ result }: Props) {
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
    ? `~${expectedAttempts} ${expectedAttempts === 1 ? 'attempt' : 'attempts'} per payout`
    : undefined

  const evHint =
    result && result.w > 0 ? `Gross payout: ${formatCurrency(result.w)}` : undefined

  const roiHint =
    maxCost !== null && maxCost > 0
      ? `Break-even cost: ${formatCurrency(maxCost)}`
      : undefined

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <KpiCard
        label="Payout probability"
        value={payoutProb}
        tone="positive"
        hint={payoutHint}
      />
      <KpiCard label="Expected value" value={ev} tone={evTone} hint={evHint} />
      <KpiCard label="ROI" value={roi} tone={roiTone} hint={roiHint} />
    </div>
  )
}
