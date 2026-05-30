import { useMemo } from 'react'
import { STRATEGY_REGISTRY } from '../../strategies'
import { StrategyCard } from './strategy-card'
import { StrategyCardSkeleton } from './strategy-card-skeleton'
import type { CalcInput } from '../../types'

type Props = {
  input: CalcInput | null
}

// The lab is for ALTERNATIVE strategies — the analytic plan is already
// represented by the main calculator results panel. Filter it out here.
const LAB_RUNNERS = STRATEGY_REGISTRY.filter((r) => r.id !== 'analytic')

export function StrategyLab({ input }: Props) {
  const inputKey = useMemo(() => (input ? JSON.stringify(input) : null), [input])

  const results = useMemo(
    () => (input && inputKey ? LAB_RUNNERS.map((runner) => runner.run(input)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputKey],
  )

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold leading-none tracking-tight">Strategy Lab</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Alternative strategies that trade deterministic payout for different probability profiles.
          The standard plan above is the analytic baseline.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4">
        {results === null
          ? LAB_RUNNERS.map((runner) => <StrategyCardSkeleton key={runner.id} />)
          : results.map((result, i) => (
              <StrategyCard key={LAB_RUNNERS[i].id} result={result} />
            ))}
      </div>
    </section>
  )
}
