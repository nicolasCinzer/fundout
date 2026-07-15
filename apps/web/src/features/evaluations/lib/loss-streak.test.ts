import { describe, it, expect } from "vitest"
import {
  toOutcomeTimeline,
  computeLossStreak,
  type OutcomeEvent,
} from "@/features/evaluations/lib/loss-streak"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"

/**
 * Minimal fixture — only the fields the streak reads.
 * `resets` is passed as a list of reset_at dates for brevity.
 */
function makeEval(partial: {
  id?: string
  purchase_date?: string
  resets?: string[]
}): Evaluation {
  return {
    id: partial.id ?? "eval-1",
    purchase_date: partial.purchase_date ?? "2026-01-01",
    resets: (partial.resets ?? []).map((reset_at) => ({ reset_at })),
  } as unknown as Evaluation
}

const NO_WITHDRAWALS = new Set<string>()

describe("toOutcomeTimeline — Layer 1 (derive attempts from evaluations)", () => {
  it("marks an evaluation with no withdrawal as a loss at its purchase date", () => {
    const timeline = toOutcomeTimeline(
      [makeEval({ id: "e1", purchase_date: "2026-03-10" })],
      NO_WITHDRAWALS,
    )
    expect(timeline).toEqual([{ date: "2026-03-10", outcome: "loss" }])
  })

  it("marks an evaluation that withdrew as a win at its purchase date", () => {
    const timeline = toOutcomeTimeline(
      [makeEval({ id: "e1", purchase_date: "2026-03-10" })],
      new Set(["e1"]),
    )
    expect(timeline).toEqual([{ date: "2026-03-10", outcome: "win" }])
  })

  it("counts every reset as a loss, even when the evaluation itself withdrew", () => {
    const timeline = toOutcomeTimeline(
      [
        makeEval({
          id: "e1",
          purchase_date: "2026-01-01",
          resets: ["2026-02-01", "2026-02-05"],
        }),
      ],
      new Set(["e1"]),
    )
    expect(timeline).toEqual([
      { date: "2026-01-01", outcome: "win" },
      { date: "2026-02-01", outcome: "loss" },
      { date: "2026-02-05", outcome: "loss" },
    ])
  })

  it("sorts all attempt events chronologically ascending", () => {
    const timeline = toOutcomeTimeline(
      [
        makeEval({ id: "e1", purchase_date: "2026-05-01" }),
        makeEval({ id: "e2", purchase_date: "2026-01-15", resets: ["2026-03-01"] }),
      ],
      NO_WITHDRAWALS,
    )
    expect(timeline.map((e) => e.date)).toEqual([
      "2026-01-15",
      "2026-03-01",
      "2026-05-01",
    ])
  })

  it("reproduces 'the first account withdrew, the rest didn't' as trailing losses", () => {
    // Earliest eval withdrew; two later evals + one reset did not.
    const evals = [
      makeEval({ id: "won", purchase_date: "2026-06-15" }),
      makeEval({ id: "e2", purchase_date: "2026-06-25" }),
      makeEval({ id: "e3", purchase_date: "2026-06-29", resets: ["2026-07-05"] }),
    ]
    const timeline = toOutcomeTimeline(evals, new Set(["won"]))
    expect(timeline[0]).toEqual({ date: "2026-06-15", outcome: "win" })
    expect(computeLossStreak(timeline).current).toBe(3)
  })
})

describe("computeLossStreak — Layer 2 (fold over ordered outcomes)", () => {
  const ev = (outcome: "win" | "loss", date = "2026-01-01"): OutcomeEvent => ({
    date,
    outcome,
  })

  it("returns zeros for an empty timeline", () => {
    expect(computeLossStreak([])).toEqual({
      current: 0,
      longest: 0,
      average: 0,
    })
  })

  it("counts an all-loss timeline as a single run", () => {
    expect(computeLossStreak([ev("loss"), ev("loss"), ev("loss")])).toEqual({
      current: 3,
      longest: 3,
      average: 3,
    })
  })

  it("resets current to 0 when the last event is a win", () => {
    expect(computeLossStreak([ev("loss"), ev("loss"), ev("win")])).toEqual({
      current: 0,
      longest: 2,
      average: 2,
    })
  })

  it("counts only trailing losses as current after a win breaks the run", () => {
    expect(
      computeLossStreak([ev("loss"), ev("win"), ev("loss"), ev("loss")]),
    ).toEqual({ current: 2, longest: 2, average: 1.5 })
  })

  it("tracks the longest run even when it is not the current one", () => {
    expect(
      computeLossStreak([
        ev("loss"),
        ev("loss"),
        ev("loss"),
        ev("win"),
        ev("loss"),
      ]),
    ).toEqual({ current: 1, longest: 3, average: 2 })
  })

  it("averages the length of each maximal loss run", () => {
    // runs: [1], [1], [1] → 3 losses / 3 runs = 1
    expect(
      computeLossStreak([
        ev("loss"),
        ev("win"),
        ev("loss"),
        ev("win"),
        ev("loss"),
      ]),
    ).toEqual({ current: 1, longest: 1, average: 1 })
  })

  it("returns zeros when there are only wins", () => {
    expect(computeLossStreak([ev("win"), ev("win")])).toEqual({
      current: 0,
      longest: 0,
      average: 0,
    })
  })
})
