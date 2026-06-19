import { useState, useCallback } from "react"
import { SHARE_HANDLE_STORAGE_KEY } from "@/features/dashboard/components/share-card/share-card.constants"

/**
 * Persists the user's @handle to localStorage.
 * SSR-safe: typeof window guard (Fundout is SPA, so this is defensive only).
 * Swallows localStorage exceptions (private mode / quota exceeded).
 */
export function useShareHandle(): [string, (next: string) => void] {
  const [handle, setHandleState] = useState<string>(() => {
    if (typeof window === "undefined") return ""
    try {
      return window.localStorage.getItem(SHARE_HANDLE_STORAGE_KEY) ?? ""
    } catch {
      return ""
    }
  })

  const setHandle = useCallback((next: string) => {
    setHandleState(next)
    try {
      window.localStorage.setItem(SHARE_HANDLE_STORAGE_KEY, next)
    } catch {
      /* ignore quota / private mode */
    }
  }, [])

  return [handle, setHandle]
}
