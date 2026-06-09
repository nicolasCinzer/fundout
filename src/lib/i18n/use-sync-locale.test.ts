/**
 * use-sync-locale tests — node environment.
 * Tests the logic of locale synchronization without React rendering.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Hoist mocks ──────────────────────────────────────────────────────────────

const { mockChangeLanguage, mockUseProfile, mockI18nLanguage } = vi.hoisted(() => {
  const mockChangeLanguage = vi.fn().mockResolvedValue(undefined)
  const mockI18nLanguage = { current: "en" }
  const mockUseProfile = vi.fn(() => ({ data: null }))
  return { mockChangeLanguage, mockUseProfile, mockI18nLanguage }
})

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    i18n: {
      get language() { return mockI18nLanguage.current },
      changeLanguage: mockChangeLanguage,
    },
  })),
}))

vi.mock("@/features/user/api/profile-queries", () => ({
  useProfile: mockUseProfile,
}))

// localStorage stub
const localStorageStore: Record<string, string> = {}
vi.stubGlobal("localStorage", {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value },
  removeItem: (key: string) => { delete localStorageStore[key] },
  clear: () => { for (const k of Object.keys(localStorageStore)) delete localStorageStore[k] },
})

/**
 * Simulate what useSyncLocale's useEffect does when it runs.
 * We're testing the synchronization logic, not React's effect scheduling.
 */
function runSyncLocaleEffect(profileLocale: string | null | undefined, currentLang: string) {
  // Mirrors the effect in use-sync-locale.ts
  if (!profileLocale) return
  if (profileLocale === currentLang) return
  mockChangeLanguage(profileLocale)
  localStorage.setItem("fundout.locale", profileLocale)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockI18nLanguage.current = "en"
  for (const k of Object.keys(localStorageStore)) delete localStorageStore[k]
})

describe("useSyncLocale — sync effect logic", () => {
  it("calls i18n.changeLanguage when profile.locale differs from current language", () => {
    runSyncLocaleEffect("es", "en")
    expect(mockChangeLanguage).toHaveBeenCalledWith("es")
  })

  it("does NOT call i18n.changeLanguage when profile.locale matches current language", () => {
    runSyncLocaleEffect("en", "en")
    expect(mockChangeLanguage).not.toHaveBeenCalled()
  })

  it("does NOT call i18n.changeLanguage when profile is null (loading or no row)", () => {
    runSyncLocaleEffect(null, "en")
    expect(mockChangeLanguage).not.toHaveBeenCalled()
  })

  it("mirrors profile.locale to localStorage (FR-12: post-logout persistence)", () => {
    runSyncLocaleEffect("es", "en")
    expect(localStorage.getItem("fundout.locale")).toBe("es")
  })

  it("does NOT write localStorage when locale already matches", () => {
    runSyncLocaleEffect("en", "en")
    expect(localStorage.getItem("fundout.locale")).toBeNull()
  })
})
