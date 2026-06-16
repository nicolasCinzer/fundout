import { toPng } from "html-to-image"
import { isIOS } from "@/features/dashboard/components/share-card/lib/is-ios"

export type ExportPngOptions = {
  width: number
  height: number
  filename: string
}

/**
 * Captures a DOM node as a PNG and triggers a download.
 * iOS Safari blocks programmatic <a download> — falls back to window.open().
 * ADR: awaits document.fonts.ready before capture to guarantee variable fonts are loaded.
 */
export async function exportNodeToPng(
  node: HTMLElement,
  opts: ExportPngOptions,
): Promise<void> {
  // 1. Wait for variable fonts (Manrope, Outfit) to be fully loaded
  await document.fonts.ready

  // 2. Capture at 2× for retina-quality output
  const dataUrl = await toPng(node, {
    width: opts.width,
    height: opts.height,
    pixelRatio: 2,
    cacheBust: true,
  })

  // 3. Trigger download — iOS Safari blocks <a download>, so we fall back to new tab
  if (isIOS()) {
    window.open(dataUrl, "_blank", "noopener")
    return
  }

  const a = document.createElement("a")
  a.href = dataUrl
  a.download = opts.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
