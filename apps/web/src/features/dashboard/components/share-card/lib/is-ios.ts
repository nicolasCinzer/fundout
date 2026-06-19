/**
 * iOS/iPadOS detection utility.
 * ADR-4: UA-based detection + iPadOS-on-MacIntel heuristic.
 * True feature detection requires actually attempting the download — not viable.
 * False-positive on iPadOS-with-mouse is acceptable: the new-tab fallback still works.
 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  const iOSLike = /iPad|iPhone|iPod/.test(ua)
  const iPadOS =
    navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1
  return iOSLike || iPadOS
}
