import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock html-to-image before importing the module under test
vi.mock("html-to-image", () => ({
  toPng: vi.fn(),
}))

// Mock is-ios before importing
vi.mock(
  "@/features/dashboard/components/share-card/lib/is-ios",
  () => ({ isIOS: vi.fn() }),
)

import { toPng } from "html-to-image"
import { isIOS } from "@/features/dashboard/components/share-card/lib/is-ios"
import { exportNodeToPng } from "@/features/dashboard/components/share-card/lib/export-png"

const mockToPng = vi.mocked(toPng)
const mockIsIOS = vi.mocked(isIOS)

const FAKE_DATA_URL = "data:image/png;base64,ABC123"
const FAKE_NODE = {} as HTMLElement

function makeDocumentStub(fontsReady: Promise<unknown> = Promise.resolve()) {
  return {
    fonts: { ready: fontsReady },
    body: {
      appendChild: vi.fn(),
    },
    createElement: vi.fn(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockToPng.mockResolvedValue(FAKE_DATA_URL)
  // Default: desktop, fonts ready immediately
  mockIsIOS.mockReturnValue(false)
  vi.stubGlobal("document", makeDocumentStub())
  vi.stubGlobal("window", { open: vi.fn() })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("exportNodeToPng", () => {
  it("calls toPng with pixelRatio:2, cacheBust:true, and the given width/height", async () => {
    // Arrange: stub createElement to return a minimal anchor
    const fakeAnchor = { href: "", download: "", click: vi.fn(), remove: vi.fn() }
    document.createElement = vi.fn().mockReturnValue(fakeAnchor)

    await exportNodeToPng(FAKE_NODE, {
      width: 1200,
      height: 630,
      filename: "fundout-test-1200x630.png",
    })

    expect(mockToPng).toHaveBeenCalledOnce()
    expect(mockToPng).toHaveBeenCalledWith(FAKE_NODE, {
      width: 1200,
      height: 630,
      pixelRatio: 2,
      cacheBust: true,
    })
  })

  it("creates and clicks an <a> element on desktop (isIOS=false)", async () => {
    mockIsIOS.mockReturnValue(false)

    const fakeAnchor = { href: "", download: "", click: vi.fn(), remove: vi.fn() }
    document.createElement = vi.fn().mockReturnValue(fakeAnchor)

    await exportNodeToPng(FAKE_NODE, {
      width: 1200,
      height: 630,
      filename: "fundout-last-30-days-1200x630.png",
    })

    expect(document.createElement).toHaveBeenCalledWith("a")
    expect(fakeAnchor.href).toBe(FAKE_DATA_URL)
    expect(fakeAnchor.download).toBe("fundout-last-30-days-1200x630.png")
    expect(fakeAnchor.click).toHaveBeenCalledOnce()
    expect(fakeAnchor.remove).toHaveBeenCalledOnce()
  })

  it("opens a new tab on iOS (isIOS=true) and does NOT create an <a> element", async () => {
    mockIsIOS.mockReturnValue(true)

    await exportNodeToPng(FAKE_NODE, {
      width: 1080,
      height: 1080,
      filename: "fundout-this-year-1080x1080.png",
    })

    expect(window.open).toHaveBeenCalledOnce()
    expect(window.open).toHaveBeenCalledWith(FAKE_DATA_URL, "_blank", "noopener")
    expect(document.createElement).not.toHaveBeenCalledWith("a")
  })

  it("awaits document.fonts.ready before calling toPng", async () => {
    mockIsIOS.mockReturnValue(false)

    const callOrder: string[] = []
    let fontsReadyResolve!: () => void
    const fontsReadyPromise = new Promise<void>((res) => {
      fontsReadyResolve = res
    })

    // Stub document with a deferred fonts.ready
    const docStub = makeDocumentStub(
      fontsReadyPromise.then(() => { callOrder.push("fonts.ready") }),
    )
    const fakeAnchor = { href: "", download: "", click: vi.fn(), remove: vi.fn() }
    docStub.createElement = vi.fn().mockReturnValue(fakeAnchor)
    vi.stubGlobal("document", docStub)

    mockToPng.mockImplementationOnce(async () => {
      callOrder.push("toPng")
      return FAKE_DATA_URL
    })

    const exportPromise = exportNodeToPng(FAKE_NODE, {
      width: 1200,
      height: 630,
      filename: "fundout-test.png",
    })

    // fonts.ready hasn't resolved yet — toPng should not have been called
    expect(callOrder).toEqual([])

    fontsReadyResolve()
    await exportPromise

    expect(callOrder).toEqual(["fonts.ready", "toPng"])
  })
})
