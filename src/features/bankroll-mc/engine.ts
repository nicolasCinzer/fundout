import { mulberry32 } from '../calculator/lib/prng'
import type { BankrollMcInput, BankrollMcResult, PercentileBand } from './types'

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const SEED = 42
const ITERATIONS = 10000
const MAX_ATTEMPTS = 100

// ---------------------------------------------------------------------------
// Internal per-run result
// ---------------------------------------------------------------------------

type RunResult = {
  trajectory: number[]
  ruined: boolean
  payouts: number
  maxDDPct: number
  reachedTarget: boolean
}

// ---------------------------------------------------------------------------
// simulateRun — one Monte Carlo run
// ---------------------------------------------------------------------------

function simulateRun(
  input: BankrollMcInput,
  rng: () => number,
): RunResult {
  const { bankroll: startBankroll, cost, payoutProb, payoutNet, targetBankroll } = input

  let bankroll = startBankroll
  let peak = bankroll
  let maxDDPct = 0
  let payouts = 0
  let reachedTarget = false

  const trajectory: number[] = [bankroll]

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    if (bankroll < cost) break // ruin before this attempt

    bankroll -= cost
    if (rng() < payoutProb) {
      bankroll += payoutNet
      payouts++
    }

    trajectory.push(bankroll)

    if (bankroll > peak) {
      peak = bankroll
    }

    if (peak > 0) {
      const dd = (peak - bankroll) / peak
      if (dd > maxDDPct) maxDDPct = dd
    }

    if (targetBankroll !== undefined && bankroll >= targetBankroll) {
      reachedTarget = true
    }
  }

  // A run is ruined if it stopped before MAX_ATTEMPTS because bankroll < cost
  const ruined = trajectory.length <= MAX_ATTEMPTS && trajectory[trajectory.length - 1] < cost

  return { trajectory, ruined, payouts, maxDDPct, reachedTarget }
}

// ---------------------------------------------------------------------------
// runSimulation — public entry point
// ---------------------------------------------------------------------------

export function runSimulation(input: BankrollMcInput): BankrollMcResult {
  const rng = mulberry32(SEED)

  // --- Storage ---
  // Full trajectory matrix: ITERATIONS × (MAX_ATTEMPTS + 1)
  const matrix = new Float64Array(ITERATIONS * (MAX_ATTEMPTS + 1))
  // Per-run alive length (number of valid trajectory indices)
  const aliveLen = new Int16Array(ITERATIONS)

  // Per-run aggregation arrays
  const finalBankrolls = new Float64Array(ITERATIONS)
  const maxDDPcts = new Float64Array(ITERATIONS)
  const payoutsArr = new Float64Array(ITERATIONS)
  const attemptsToRuin: number[] = []

  let ruinedCount = 0
  let survivalCount = 0
  let reachedTargetCount = 0

  // --- Main loop ---
  for (let run = 0; run < ITERATIONS; run++) {
    const res = simulateRun(input, rng)
    const len = res.trajectory.length
    aliveLen[run] = len

    // Write trajectory into matrix row
    const offset = run * (MAX_ATTEMPTS + 1)
    for (let j = 0; j < len; j++) {
      matrix[offset + j] = res.trajectory[j]
    }

    finalBankrolls[run] = res.trajectory[len - 1]
    maxDDPcts[run] = res.maxDDPct
    payoutsArr[run] = res.payouts

    if (res.ruined) {
      ruinedCount++
      attemptsToRuin.push(len - 1) // attempt index at which ruin occurred (trajectory length - 1)
    } else {
      survivalCount++
    }

    if (res.reachedTarget) {
      reachedTargetCount++
    }
  }

  // --- Metrics aggregation ---
  const ruinRate = ruinedCount / ITERATIONS
  const survivalRate = survivalCount / ITERATIONS
  const pReachTarget = input.targetBankroll !== undefined
    ? reachedTargetCount / ITERATIONS
    : 0

  const avgFinalBankroll = arrayMean(finalBankrolls)
  const avgMaxDrawdownPct = arrayMean(maxDDPcts)
  const avgPayoutsCollected = arrayMean(payoutsArr)

  const avgAttemptsToRuin = attemptsToRuin.length > 0
    ? attemptsToRuin.reduce((a, b) => a + b, 0) / attemptsToRuin.length
    : 0

  const evPerAttempt = -input.cost + input.payoutProb * input.payoutNet

  // Final bankroll percentiles
  const sortedFinals = Array.from(finalBankrolls).sort((a, b) => a - b)
  const p10FinalBankroll = pickPercentile(sortedFinals, 0.1)
  const p50FinalBankroll = pickPercentile(sortedFinals, 0.5)
  const p90FinalBankroll = pickPercentile(sortedFinals, 0.9)

  const maxAttemptsHeuristic = Math.floor(input.bankroll / input.cost)

  // --- Percentile bands (post-loop) ---
  const percentileP10: PercentileBand = new Array(MAX_ATTEMPTS + 1).fill(null)
  const percentileP50: PercentileBand = new Array(MAX_ATTEMPTS + 1).fill(null)
  const percentileP90: PercentileBand = new Array(MAX_ATTEMPTS + 1).fill(null)

  for (let x = 0; x <= MAX_ATTEMPTS; x++) {
    const aliveCohort: number[] = []
    for (let run = 0; run < ITERATIONS; run++) {
      if (aliveLen[run] > x) {
        aliveCohort.push(matrix[run * (MAX_ATTEMPTS + 1) + x])
      }
    }
    if (aliveCohort.length > 0) {
      aliveCohort.sort((a, b) => a - b)
      percentileP10[x] = pickPercentile(aliveCohort, 0.1)
      percentileP50[x] = pickPercentile(aliveCohort, 0.5)
      percentileP90[x] = pickPercentile(aliveCohort, 0.9)
    }
    // else leave null
  }

  return {
    ruinRate,
    avgFinalBankroll,
    p10FinalBankroll,
    p50FinalBankroll,
    p90FinalBankroll,
    avgAttemptsToRuin,
    avgPayoutsCollected,
    evPerAttempt,
    avgMaxDrawdownPct,
    pReachTarget,
    survivalRate,
    maxAttemptsHeuristic,
    simCount: ITERATIONS,
    percentileP10,
    percentileP50,
    percentileP90,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function arrayMean(arr: Float64Array): number {
  let sum = 0
  for (let i = 0; i < arr.length; i++) sum += arr[i]
  return sum / arr.length
}

function pickPercentile(sorted: number[], p: number): number {
  const idx = Math.floor((sorted.length - 1) * p)
  return sorted[idx]
}
