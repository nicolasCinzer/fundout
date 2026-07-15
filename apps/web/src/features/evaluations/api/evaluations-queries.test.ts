/**
 * evaluations-queries tests — pure node environment (no jsdom).
 * Verifies the supabase interaction shape of the log-reset mutation in
 * isolation, mirroring the pattern used by settings-queries.test.ts.
 *
 * Focus: a reset logged on a FAILED evaluation must also revive it back to
 * in_progress (a paid reset means the trader is back in the game), while a
 * reset on an in_progress evaluation must NOT touch the status.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFrom, mockInsert, mockSingle, mockUpdate, mockEq } = vi.hoisted(
  () => {
    const mockSingle = vi.fn()
    const mockSelect = vi.fn(() => ({ single: mockSingle }))
    const mockInsert = vi.fn(() => ({ select: mockSelect }))
    const mockEq = vi.fn()
    const mockUpdate = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn((table: string) => {
      if (table === "evaluation_resets") return { insert: mockInsert }
      if (table === "evaluations") return { update: mockUpdate }
      return {}
    })
    return { mockFrom, mockInsert, mockSingle, mockUpdate, mockEq }
  },
)

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}))

import { supabase } from "@/lib/supabase"

const MOCK_USER_ID = "user-abc-123"

type ResetPayload = {
  evaluation_id: string
  fee: number
  reset_at: string
  notes: string | null
  reviveFromFailed?: boolean
  newName?: string | null
}

/** Simulate the mutationFn that useLogEvaluationReset executes. */
async function runLogResetMutationFn(
  userId: string | null,
  { reviveFromFailed = false, newName, ...input }: ResetPayload,
) {
  if (!userId) throw new Error("Not authenticated")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("evaluation_resets")
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw error

  // A reset can both revive a failed eval AND rename it (a reset means a fresh
  // account, usually with a new ID). Fold both into one evaluations update.
  const patch: Record<string, unknown> = {}
  if (reviveFromFailed) {
    patch.status = "in_progress"
    patch.closed_at = null
  }
  if (newName != null && newName !== "") {
    patch.name = newName
  }
  if (Object.keys(patch).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: patchError } = await (supabase as any)
      .from("evaluations")
      .update(patch)
      .eq("id", input.evaluation_id)
    if (patchError) throw patchError
  }
  return data
}

const RESET_INPUT: ResetPayload = {
  evaluation_id: "eval-1",
  fee: 60,
  reset_at: "2026-07-13",
  notes: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useLogEvaluationReset — mutationFn", () => {
  it("inserts the reset scoped to the current user and does NOT touch status when not reviving", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "reset-1" }, error: null })

    const result = await runLogResetMutationFn(MOCK_USER_ID, RESET_INPUT)

    expect(mockFrom).toHaveBeenCalledWith("evaluation_resets")
    expect(mockInsert).toHaveBeenCalledWith({
      evaluation_id: "eval-1",
      fee: 60,
      reset_at: "2026-07-13",
      notes: null,
      user_id: MOCK_USER_ID,
    })
    // Status must be untouched for an in_progress reset.
    expect(mockFrom).not.toHaveBeenCalledWith("evaluations")
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(result).toEqual({ id: "reset-1" })
  })

  it("does NOT persist control fields (reviveFromFailed, newName) on the reset row", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "reset-1" }, error: null })
    mockEq.mockResolvedValueOnce({ error: null })

    await runLogResetMutationFn(MOCK_USER_ID, {
      ...RESET_INPUT,
      reviveFromFailed: true,
      newName: "ACC-2",
    })

    const insertedRow = mockInsert.mock.calls[0][0]
    expect(insertedRow).not.toHaveProperty("reviveFromFailed")
    expect(insertedRow).not.toHaveProperty("newName")
  })

  it("updates the evaluation name when a new account ID is provided", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "reset-1" }, error: null })
    mockEq.mockResolvedValueOnce({ error: null })

    await runLogResetMutationFn(MOCK_USER_ID, {
      ...RESET_INPUT,
      newName: "ACC-2",
    })

    expect(mockUpdate).toHaveBeenCalledWith({ name: "ACC-2" })
    expect(mockEq).toHaveBeenCalledWith("id", "eval-1")
  })

  it("folds revive + new name into a single evaluations update", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "reset-1" }, error: null })
    mockEq.mockResolvedValueOnce({ error: null })

    await runLogResetMutationFn(MOCK_USER_ID, {
      ...RESET_INPUT,
      reviveFromFailed: true,
      newName: "ACC-2",
    })

    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith({
      status: "in_progress",
      closed_at: null,
      name: "ACC-2",
    })
  })

  it("does not touch the evaluation when newName is blank and not reviving", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "reset-1" }, error: null })

    await runLogResetMutationFn(MOCK_USER_ID, { ...RESET_INPUT, newName: "" })

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("revives a failed evaluation back to in_progress after logging the reset", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "reset-1" }, error: null })
    mockEq.mockResolvedValueOnce({ error: null })

    await runLogResetMutationFn(MOCK_USER_ID, {
      ...RESET_INPUT,
      reviveFromFailed: true,
    })

    expect(mockFrom).toHaveBeenCalledWith("evaluations")
    expect(mockUpdate).toHaveBeenCalledWith({
      status: "in_progress",
      closed_at: null,
    })
    expect(mockEq).toHaveBeenCalledWith("id", "eval-1")
  })

  it("throws when not authenticated (nothing is written)", async () => {
    await expect(runLogResetMutationFn(null, RESET_INPUT)).rejects.toThrow(
      "Not authenticated",
    )
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("propagates the insert error and never flips status", async () => {
    mockSingle.mockResolvedValueOnce({ error: { message: "rls denied" } })

    await expect(
      runLogResetMutationFn(MOCK_USER_ID, {
        ...RESET_INPUT,
        reviveFromFailed: true,
      }),
    ).rejects.toMatchObject({ message: "rls denied" })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
