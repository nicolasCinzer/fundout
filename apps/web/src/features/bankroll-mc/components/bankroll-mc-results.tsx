import { useTranslation } from 'react-i18next'
import { TrendingDown, TrendingUp, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { BankrollMcResult, BankrollMcInput } from '../types'

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
  const { t } = useTranslation('bankroll-mc')

  if (!result) {
    return (
      <div className="space-y-3">
        <Card className="flex h-[200px] items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            {t('results.noResults')}
          </p>
        </Card>
      </div>
    )
  }

  const ruinTone: Tone =
    result.ruinRate > 0.5 ? 'negative' : result.ruinRate > 0.2 ? 'warning' : 'positive'
  const evTone: Tone =
    result.evPerAttempt > 0 ? 'positive' : result.evPerAttempt < 0 ? 'negative' : 'default'
  const ddTone: Tone = result.avgMaxDrawdownPct > 0.5 ? 'negative' : 'default'
  const pReachTone: Tone =
    result.pReachTarget > 0.5 ? 'positive' : result.pReachTarget > 0.1 ? 'default' : 'negative'

  const avgAttemptsToRuinDisplay =
    result.avgAttemptsToRuin === 0 ? '—' : Math.round(result.avgAttemptsToRuin).toString()

  const startBankroll = input?.bankroll ?? 0
  const finalRatio = startBankroll > 0 ? result.avgFinalBankroll / startBankroll : 0

  // Visualisation reference: max scale = max(p90, 2× starting bankroll) so the
  // p10/p50/p90 bars share a consistent baseline.
  const distMax = Math.max(result.p90FinalBankroll, startBankroll * 2, 1)

  return (
    <div className="space-y-3">
      {result.evPerAttempt < 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          {t('results.negativeEv')}
        </div>
      )}

      {/* Ruin — headline KPI */}
      <Card className="gap-2 border-primary/40 px-4 py-3.5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{t('results.ruinRate')}</p>
          <TopBadge tone={evTone}>{t('results.evPerAttempt', { amount: formatCurrency(result.evPerAttempt) })}</TopBadge>
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
          {t('results.accountsLost', {
            lost: Math.round(result.ruinRate * result.simCount).toLocaleString(),
            survived: Math.round(result.survivalRate * result.simCount).toLocaleString(),
          })}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
          <Badge variant="secondary" className="font-normal">
            <span className="text-muted-foreground">{t('results.worstCaseAttempts')}&nbsp;</span>
            <span className="font-mono tabular-nums">{result.maxAttemptsHeuristic}</span>
          </Badge>
        </div>
      </Card>

      {/* Outcome distribution — final bankroll explained as percentiles */}
      <Card className="gap-3 px-4 py-3.5">
        <div className="space-y-0.5 border-b pb-2">
          <p className="text-sm font-medium text-muted-foreground">{t('results.whereYouEndUp')}</p>
          <p className="text-[11px] text-muted-foreground/80 leading-snug">
            {t('results.whereYouEndUpHint', { count: result.simCount.toLocaleString() })}
          </p>
        </div>

        <div className="space-y-2">
          <PercentileRow
            label={t('results.pessimistic')}
            sublabel={t('results.pessimisticSub')}
            value={result.p10FinalBankroll}
            startBankroll={startBankroll}
            maxScale={distMax}
            tone="negative"
          />
          <PercentileRow
            label={t('results.typical')}
            sublabel={t('results.typicalSub')}
            value={result.p50FinalBankroll}
            startBankroll={startBankroll}
            maxScale={distMax}
            tone="default"
            emphasized
          />
          <PercentileRow
            label={t('results.optimistic')}
            sublabel={t('results.optimisticSub')}
            value={result.p90FinalBankroll}
            startBankroll={startBankroll}
            maxScale={distMax}
            tone="positive"
          />
        </div>

        <div className="rounded-md border bg-muted/20 p-2.5 space-y-0.5">
          <p className="text-[10px] font-heading uppercase tracking-wide text-muted-foreground">
            {t('results.avgAcrossRuns')}
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-heading text-lg font-semibold tabular-nums leading-none">
              {formatCurrency(result.avgFinalBankroll)}
            </p>
            {startBankroll > 0 && (
              <p
                className={cn(
                  'text-xs font-medium tabular-nums',
                  finalRatio > 1
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400',
                )}
              >
                {finalRatio > 1 ? '+' : ''}
                {formatPercent(finalRatio - 1)} {t('results.vsStart')}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Per-run averages — expanded with explanations */}
      <Card className="gap-3 px-4 py-3.5">
        <div className="space-y-0.5 border-b pb-2">
          <p className="text-sm font-medium text-muted-foreground">{t('results.runMetrics')}</p>
          <p className="text-[11px] text-muted-foreground/80 leading-snug">
            {t('results.runMetricsHint', { count: result.simCount.toLocaleString() })}
          </p>
        </div>

        <MetricRow
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          label={t('results.attemptsToRuin')}
          value={avgAttemptsToRuinDisplay}
          hint={
            result.avgAttemptsToRuin === 0
              ? t('results.attemptsToRuinHintNone')
              : t('results.attemptsToRuinHint')
          }
        />
        <MetricRow
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label={t('results.payoutsCollected')}
          value={result.avgPayoutsCollected.toFixed(1)}
          hint={t('results.payoutsCollectedHint', {
            expected: ((input?.payoutProb ?? 0) * 100).toFixed(1),
            rate: formatPercent(input?.payoutProb ?? 0),
          })}
        />
        <MetricRow
          icon={<Activity className="h-3.5 w-3.5" />}
          label={t('results.maxDrawdown')}
          value={formatPercent(result.avgMaxDrawdownPct)}
          hint={t('results.maxDrawdownHint')}
          tone={ddTone}
          bar={Math.min(1, result.avgMaxDrawdownPct)}
          barTone={ddTone}
        />
      </Card>

      {/* P(reach target) — only when target provided */}
      {input?.targetBankroll !== undefined && (
        <Card className="gap-2 px-4 py-3.5">
          <p className="text-sm font-medium text-muted-foreground">
            {t('results.pReachTarget', { target: formatCurrency(input.targetBankroll) })}
          </p>
          <p
            className={cn(
              'font-heading text-2xl font-semibold leading-none tracking-tight tabular-nums',
              toneClasses[pReachTone],
            )}
          >
            {formatPercent(result.pReachTarget)}
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {t('results.pReachTargetHint')}
          </p>
        </Card>
      )}

      <p className="px-1 text-[11px] text-muted-foreground">
        {t('results.basedOnRuns', { count: result.simCount.toLocaleString() })}
      </p>
    </div>
  )
}

function PercentileRow({
  label,
  sublabel,
  value,
  startBankroll,
  maxScale,
  tone,
  emphasized,
}: {
  label: string
  sublabel: string
  value: number
  startBankroll: number
  maxScale: number
  tone: Tone
  emphasized?: boolean
}) {
  const fillPct = Math.max(2, Math.min(100, (value / maxScale) * 100))
  const startFillPct =
    startBankroll > 0 ? Math.min(100, (startBankroll / maxScale) * 100) : null

  const barColor =
    tone === 'positive'
      ? 'bg-emerald-500/70'
      : tone === 'negative'
        ? 'bg-rose-500/70'
        : 'bg-primary/70'

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              'text-xs font-semibold',
              emphasized ? toneClasses.default : 'text-muted-foreground',
            )}
          >
            {label}
          </p>
          <p className="text-[10px] text-muted-foreground/80 leading-tight">{sublabel}</p>
        </div>
        <p
          className={cn(
            'font-heading tabular-nums leading-none',
            emphasized ? 'text-base font-bold' : 'text-sm font-semibold',
            toneClasses[tone],
          )}
        >
          {formatCurrency(value)}
        </p>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all', barColor)}
          style={{ width: `${fillPct}%` }}
        />
        {startFillPct !== null && (
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground/60"
            style={{ left: `${startFillPct}%` }}
            title={`Starting bankroll: ${formatCurrency(startBankroll)}`}
          />
        )}
      </div>
    </div>
  )
}

function MetricRow({
  icon,
  label,
  value,
  hint,
  tone = 'default',
  bar,
  barTone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone?: Tone
  bar?: number
  barTone?: Tone
}) {
  const barColor =
    barTone === 'negative'
      ? 'bg-rose-500/70'
      : barTone === 'positive'
        ? 'bg-emerald-500/70'
        : 'bg-primary/70'

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span
          className={cn(
            'font-heading text-base font-semibold tabular-nums leading-none',
            toneClasses[tone],
          )}
        >
          {value}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground/80 leading-snug">{hint}</p>
      {bar !== undefined && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${Math.max(2, bar * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
