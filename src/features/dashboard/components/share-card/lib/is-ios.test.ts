import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { isIOS } from "@/features/dashboard/components/share-card/lib/is-ios"

describe("isIOS", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns true for iPhone UA", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
      maxTouchPoints: 5,
    })
    expect(isIOS()).toBe(true)
  })

  it("returns true for iPad UA", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPad",
      maxTouchPoints: 5,
    })
    expect(isIOS()).toBe(true)
  })

  it("returns true for iPod UA", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPod touch; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPod",
      maxTouchPoints: 5,
    })
    expect(isIOS()).toBe(true)
  })

  it("returns false for Android UA", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
    })
    expect(isIOS()).toBe(false)
  })

  it("returns false for desktop Chrome UA", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124",
      platform: "MacIntel",
      maxTouchPoints: 0,
    })
    expect(isIOS()).toBe(false)
  })

  it("returns true for iPadOS 13+ (MacIntel platform + maxTouchPoints > 1)", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 5,
    })
    expect(isIOS()).toBe(true)
  })

  it("returns false when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined)
    expect(isIOS()).toBe(false)
  })
})
