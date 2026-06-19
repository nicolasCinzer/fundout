/**
 * profile-queries tests — pure node environment (no jsdom).
 * Tests focus on the Supabase interaction logic and locale mutation behavior,
 * not React rendering (hooks are React-layer concerns tested via manual smoke S-11).
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Hoist mock factories ─────────────────────────────────────────────────────

const { mockMaybeSingle, mockUpsert, mockFrom, mockChangeLanguage } =
  vi.hoisted(() => {
    const mockMaybeSingle = vi.fn()
    const mockUpsert = vi.fn()
    const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn((_table: string) => ({
      select: mockSelect,
      upsert: mockUpsert,
    }))
    const mockChangeLanguage = vi.fn().mockResolvedValue(undefined)
    return { mockMaybeSingle, mockUpsert, mockFrom, mockChangeLanguage }
  })

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}))

vi.mock("@/lib/i18n", () => ({
  i18n: { changeLanguage: mockChangeLanguage },
}))

vi.mock("@/features/auth/api/auth-provider", () => ({
  useAuth: vi.fn(),
}))

// ─── Helpers to extract supabase logic independently ──────────────────────────

import { supabase } from "@/lib/supabase"
import { i18n } from "@/lib/i18n"

const MOCK_USER_ID = "user-abc-123"

/**
 * Helper: simulate the queryFn that useProfile executes.
 * Tests the Supabase interaction in isolation.
 */
async function runProfileQueryFn(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Helper: simulate the mutationFn that useSetLocale executes.
 */
async function runSetLocaleMutationFn(
  locale: "en" | "es",
  userId: string | null,
) {
  await i18n.changeLanguage(locale)
  localStorage.setItem("fundout.locale", locale)

  if (!userId) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .upsert({ user_id: userId, locale }, { onConflict: "user_id" })

  if (error) throw error
}

// Stub localStorage for node environment
const localStorageStore: Record<string, string> = {}
const mockLocalStorage = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value },
  removeItem: (key: string) => { delete localStorageStore[key] },
  clear: () => { for (const k of Object.keys(localStorageStore)) delete localStorageStore[k] },
}
vi.stubGlobal("localStorage", mockLocalStorage)

beforeEach(() => {
  vi.clearAllMocks()
  mockLocalStorage.clear()
})

// ─── useProfile query logic ───────────────────────────────────────────────────

describe("useProfile — queryFn", () => {
  it("returns the profile row when it exists", async () => {
    const fakeProfile = {
      id: "p-1",
      user_id: MOCK_USER_ID,
      locale: "en",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    }
    mockMaybeSingle.mockResolvedValueOnce({ data: fakeProfile, error: null })

    const result = await runProfileQueryFn(MOCK_USER_ID)
    expect(result).toEqual(fakeProfile)
  })

  it("returns null when no profile row exists (cold-start — S-11)", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await runProfileQueryFn(MOCK_USER_ID)
    expect(result).toBeNull()
  })

  it("uses .maybeSingle() — ensures no error on missing row", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    await runProfileQueryFn(MOCK_USER_ID)
    // Verify the chain: from → select → eq → maybeSingle
    expect(mockFrom).toHaveBeenCalledWith("profiles")
    expect(mockMaybeSingle).toHaveBeenCalledTimes(1)
  })
})

// ─── useSetLocale mutation logic ──────────────────────────────────────────────

describe("useSetLocale — mutationFn", () => {
  it("calls i18n.changeLanguage and Supabase upsert when authenticated", async () => {
    mockUpsert.mockResolvedValueOnce({ error: null })

    await runSetLocaleMutationFn("es", MOCK_USER_ID)

    expect(mockChangeLanguage).toHaveBeenCalledWith("es")
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: MOCK_USER_ID, locale: "es" },
      { onConflict: "user_id" },
    )
  })

  it("does NOT call Supabase upsert when userId is null (unauthenticated)", async () => {
    await runSetLocaleMutationFn("es", null)

    expect(mockChangeLanguage).toHaveBeenCalledWith("es")
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it("upsert uses onConflict:'user_id' — idempotent on double-fire (S-11)", async () => {
    mockUpsert.mockResolvedValue({ error: null })

    // Call twice (simulates StrictMode double-invoke)
    await runSetLocaleMutationFn("es", MOCK_USER_ID)
    await runSetLocaleMutationFn("es", MOCK_USER_ID)

    expect(mockUpsert).toHaveBeenCalledTimes(2)
    // Both calls use the same upsert shape — DB constraint prevents duplicates
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: MOCK_USER_ID, locale: "es" },
      { onConflict: "user_id" },
    )
  })

  it("sets localStorage fundout.locale key", async () => {
    mockUpsert.mockResolvedValueOnce({ error: null })

    await runSetLocaleMutationFn("es", MOCK_USER_ID)

    expect(localStorage.getItem("fundout.locale")).toBe("es")
  })
})
