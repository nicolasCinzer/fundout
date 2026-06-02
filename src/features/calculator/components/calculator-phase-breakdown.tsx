import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { CalcResult } from '../types'

type Props = {
  result: CalcResult | null
}

const STRATEGY_LABELS: Record<string, string> = {
  'consistency': 'Consistency',
  'min-days': 'Min days',
  'single-shot': 'Single shot',
}

function strategyLabel(phase: { strategy: string; cushion?: unknown }): string {
  if (phase.cushion) return 'Cushion'
  return STRATEGY_LABELS[phase.strategy] ?? phase.strategy
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
  const phases = result?.phases ?? []
  const mc = result?.mc ?? null

  return (
    <Card className="h-full gap-3 p-4">
      <p className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground border-b pb-2">
        Phase pass breakdown
      </p>

      {phases.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Fill in the form to see the breakdown
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            {phases.map((phase, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Phase {i + 1}</span>
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
                        Day 1
                      </span>
                      <span>
                        risk ${phase.cushion.day1Risk} → target ${phase.cushion.day1Target}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="uppercase tracking-wide not-mono font-sans font-semibold text-[9px]">
                        Days 2–{phase.cushion.profitDays}
                      </span>
                      <span>±${phase.cushion.betSize} coin-flip</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono tabular-nums text-muted-foreground">
                    <span className="uppercase tracking-wide not-mono font-sans font-semibold text-[9px]">
                      Plan · {phase.days}d
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
                  MC Cushion · Funded simulation
                </p>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  10k runs
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Kpi
                  label="Median (P50)"
                  value={formatCurrency(mc.payoutP50IfPass, true)}
                  hint="when passing"
                />
                <Kpi
                  label="Range P5–P95"
                  value={`${formatCurrency(mc.payoutP5IfPass, true)} – ${formatCurrency(mc.payoutP95IfPass, true)}`}
                  hint="when passing"
                />
                <Kpi
                  label="Std deviation"
                  value={formatCurrency(mc.payoutStdDev, true)}
                  hint="payout volatility"
                  tone="muted"
                />
                <Kpi
                  label="Repeat ×"
                  value={`${mc.repeatMultiplier.toFixed(2)}×`}
                  hint="cycle-2 odds vary"
                />
              </div>

              <div className="rounded-md border bg-muted/20 p-2.5 space-y-1">
                <p className="text-[10px] font-heading uppercase tracking-wide text-muted-foreground">
                  Lifetime expected payout
                </p>
                <p className="text-lg font-semibold tabular-nums leading-none text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(mc.lifetimePayout, true)}
                </p>
                <p className="text-[10px] text-muted-foreground/80">
                  {formatCurrency(mc.expectedPayout, true)} per cycle ×{' '}
                  {mc.repeatMultiplier.toFixed(2)} expected cycles
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
