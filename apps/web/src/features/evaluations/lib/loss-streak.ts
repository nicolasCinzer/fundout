import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"

export type Outcome = "win" | "loss"

/** A single resolved outcome on the timeline, dated by its own event. */
export type OutcomeEvent = {
  date: string
  outcome: Outcome
}

export type LossStreak = {
  /** Consecutive losses at the tail of the timeline (the live streak). */
  current: number
  /** The longest run of consecutive losses ever recorded. */
  longest: number
  /** Mean length of each maximal loss run (totalLosses / runCount). */
  average: number
}

/**
 * LAYER 1 — derive an ordered timeline of attempts from evaluations.
 *
 * This is the SWAPPABLE adapter: today it infers events from denormalized
 * state, tomorrow it gets replaced by reading an authoritative event log.
 * `computeLossStreak` (Layer 2) stays untouched when that happens.
 *
 * Domain rules (attempt-centric):
 * - An "attempt" is a paid shot at funded money: the evaluation itself plus
 *   every reset. Each is one event, dated by its own date.
 * - The ONLY win is a withdrawal (a payout). An evaluation is a win when it
 *   ultimately produced a payout — pass `withdrewEvalIds` for those.
 * - Everything else is a loss: failed evals, in_progress evals, funded evals
 *   that never withdrew, and every reset (a blown account).
 *
 * Getting funded is NOT a win — you haven't withdrawn a cent yet.
 *
 * Ordering is by date string (ISO `yyyy-MM-dd`) ascending. Same-day events
 * keep insertion order — day granularity can't disambiguate them. A real
 * event log with timestamps will resolve that later.
 */
export function toOutcomeTimeline(
  evaluations: Evaluation[],
  withdrewEvalIds: Set<string>,
): OutcomeEvent[] {
  const events: OutcomeEvent[] = []

  for (const e of evaluations) {
    // The evaluation itself is one attempt. It's a win only if it withdrew.
    events.push({
      date: e.purchase_date,
      outcome: withdrewEvalIds.has(e.id) ? "win" : "loss",
    })
    // Each reset is another paid attempt — a blown account, always a loss.
    for (const r of e.resets ?? []) {
      events.push({ date: r.reset_at, outcome: "loss" })
    }
  }

  // Stable sort: ISO date strings compare lexicographically; ties preserve
  // insertion order (Array.prototype.sort is stable in modern engines).
  return events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/**
 * LAYER 2 — fold an ordered outcome timeline into loss streaks.
 *
 * Source-agnostic: works the same whether the timeline came from Layer 1 or
 * from a future event log. This is the part that survives the event log.
 */
export function computeLossStreak(timeline: OutcomeEvent[]): LossStreak {
  let current = 0
  let longest = 0
  let totalLosses = 0
  let runCount = 0

  for (const event of timeline) {
    if (event.outcome === "loss") {
      if (current === 0) runCount += 1 // start of a new maximal loss run
      current += 1
      totalLosses += 1
      if (current > longest) longest = current
    } else {
      current = 0
    }
  }

  const average = runCount === 0 ? 0 : totalLosses / runCount
  return { current, longest, average }
}
