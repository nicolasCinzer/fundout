import { useMemo } from 'react'
import { STRATEGY_REGISTRY } from '../../strategies'
import { StrategyCard } from './strategy-card'
import { StrategyCardSkeleton } from './strategy-card-skeleton'
import type { CalcInput } from '../../types'

type Props = {
  input: CalcInput | null
}

export function StrategyLab({ input }: Props) {
  const inputKey = useMemo(() => (input ? JSON.stringify(input) : null), [input])

  // Memoize each runner's result independently so a single runner change
  // doesn't invalidate all others.
  const analyticResult = useMemo(
    () => (input && inputKey ? STRATEGY_REGISTRY[0].run(input) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputKey],
  )
  const mcResult = useMemo(
    () => (input && inputKey ? STRATEGY_REGISTRY[1].run(input) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputKey],
  )

  const results = [analyticResult, mcResult]

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold leading-none tracking-tight">Strategy Lab</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Different points on a risk/reward frontier — neither is universally correct; pick the
          one whose variance profile matches your risk tolerance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {input === null
          ? STRATEGY_REGISTRY.map((runner) => <StrategyCardSkeleton key={runner.id} />)
          : results.map((result, i) =>
              result ? (
                <StrategyCard key={STRATEGY_REGISTRY[i].id} result={result} />
              ) : (
                <StrategyCardSkeleton key={STRATEGY_REGISTRY[i].id} />
              ),
            )}
      </div>
    </section>
  )
}
