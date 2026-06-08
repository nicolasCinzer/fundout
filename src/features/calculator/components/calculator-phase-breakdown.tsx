import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { CalcResult } from '../types'

type Props = {
  result: CalcResult | null
}

type Tone = 'default' | 'positive' | 'negative' | 'muted'

const toneClasses: Record<Tone, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
  muted: 'text-muted-foreground',
}

function Kpi({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: Tone
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'text-base font-semibold leading-none tabular-nums',
          toneClasses[tone],
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="text-[10px] tabular-nums text-muted-foreground/80">
          {hint}
        </p>
      )}
    </div>
  )
}

export function CalculatorPhaseBreakdown({ result }: Props) {
  const { t } = useTranslation('calculator')
  const phases = result?.phases ?? []
  const mc = result?.mc ?? null

  function strategyLabel(phase: { strategy: string; cushion?: unknown }): string {
    if (phase.cushion) return t('results.strategyLabels.cushion')
    const keyMap: Record<string, string> = {
      'consistency': t('results.strategyLabels.consistency'),
      'min-days': t('results.strategyLabels.minDays'),
      'single-shot': t('results.strategyLabels.singleShot'),
    }
    return keyMap[phase.strategy] ?? phase.strategy
  }

  return (
    <Card className="h-full gap-3 p-4">
      <p className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground border-b pb-2">
        {t('results.phasePassBreakdown')}
      </p>

      {phases.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t('results.noBreakdown')}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            {phases.map((phase, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t('form.phase', { number: i + 1 })}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {strategyLabel(phase)}
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
                {phase.cushion ? (
                  <div className="space-y-1 text-[10px] font-mono tabular-nums text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="uppercase tracking-wide not-mono font-sans font-semibold text-[9px]">
                        {t('results.day1Label')}
                      </span>
                      <span>
                        {t('results.day1Detail', { risk: phase.cushion.day1Risk, target: phase.cushion.day1Target })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="uppercase tracking-wide not-mono font-sans font-semibold text-[9px]">
                        {t('results.laterDaysLabel', { days: phase.cushion.profitDays })}
                      </span>
                      <span>{t('results.laterDaysDetail', { betSize: phase.cushion.betSize })}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono tabular-nums text-muted-foreground">
                    <span className="uppercase tracking-wide not-mono font-sans font-semibold text-[9px]">
                      {t('results.planLabel', { days: phase.days })}
                    </span>
                    {phase.ddEffective.map((ddEff, d) => (
                      <span key={d}>
                        {Math.round(ddEff)}
                        <span className="text-muted-foreground/60">:</span>
                        {Math.round(phase.dailyTargets[d])}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {mc && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-heading uppercase tracking-wide text-muted-foreground">
                  {t('results.mcCushion')}
                </p>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  {t('results.mcRuns')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Kpi
                  label={t('results.mcMedianP50')}
                  value={formatCurrency(mc.payoutP50IfPass)}
                  hint={t('results.mcWhenPassing')}
                />
                <Kpi
                  label={t('results.mcRangeP5P95')}
                  value={`${formatCurrency(mc.payoutP5IfPass)} – ${formatCurrency(mc.payoutP95IfPass)}`}
                  hint={t('results.mcWhenPassing')}
                />
                <Kpi
                  label={t('results.mcStdDev')}
                  value={formatCurrency(mc.payoutStdDev)}
                  hint={t('results.mcPayoutVolatility')}
                  tone="muted"
                />
                <Kpi
                  label={t('results.mcRepeat')}
                  value={`${mc.repeatMultiplier.toFixed(2)}×`}
                  hint={t('results.mcRepeatHint')}
                />
              </div>

              <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                <p className="text-[10px] font-heading uppercase tracking-wide text-muted-foreground">
                  {t('results.mcLifetimePayout')}
                </p>
                <p className="text-lg font-semibold tabular-nums leading-none text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(mc.lifetimePayout)}
                </p>
                <p className="text-[10px] text-muted-foreground/80">
                  {t('results.mcLifetimePayoutHint', {
                    amount: formatCurrency(mc.expectedPayout),
                    multiplier: mc.repeatMultiplier.toFixed(2),
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
