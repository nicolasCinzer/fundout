import { analyticRunner } from './analytic'
import { mcCushionRunner } from './mc-cushion'
import type { StrategyRunner } from './types'

export const STRATEGY_REGISTRY: readonly StrategyRunner[] = [
  analyticRunner,
  mcCushionRunner,
] as const
