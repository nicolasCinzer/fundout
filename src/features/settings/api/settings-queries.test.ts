/**
 * settings-queries tests — pure node environment (no jsdom).
 * Verifies the supabase interaction shape of the reset-journal mutation in
 * isolation, mirroring the pattern used by profile-queries.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDelete, mockEq, mockFrom } = vi.hoisted(() => {
  const mockEq = vi.fn()
  const mockDelete = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn((_table: string) => ({ delete: mockDelete }))
  return { mockDelete, mockEq, mockFrom }
})

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}))

import { supabase } from "@/lib/supabase"

const MOCK_USER_ID = "user-abc-123"

/** Simulate the mutationFn that useResetJournal executes. */
async function runResetJournalMutationFn(userId: string | null) {
  if (!userId) throw new Error("Not authenticated")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("evaluations")
    .delete()
    .eq("user_id", userId)
  if (error) throw error
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useResetJournal — mutationFn", () => {
  it("deletes from evaluations scoped to the current user_id", async () => {
    mockEq.mockResolvedValueOnce({ error: null })

    await runResetJournalMutationFn(MOCK_USER_ID)

    expect(mockFrom).toHaveBeenCalledWith("evaluations")
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(mockEq).toHaveBeenCalledWith("user_id", MOCK_USER_ID)
  })

  it("throws when not authenticated (guard prevents wiping anything)", async () => {
    await expect(runResetJournalMutationFn(null)).rejects.toThrow(
      "Not authenticated",
    )
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("propagates supabase errors so the caller can surface them", async () => {
    mockEq.mockResolvedValueOnce({ error: { message: "rls denied" } })

    await expect(runResetJournalMutationFn(MOCK_USER_ID)).rejects.toMatchObject({
      message: "rls denied",
    })
  })
})
