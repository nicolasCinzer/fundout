import { useCallback, useEffect, useState } from "react"
import { readSession, writeSession, clearSession as clearSessionStorage } from "../lib/session-store"
import type { Phase, Trade, TradingDay } from "../types"

// ---------------------------------------------------------------------------
// useBacktestSession
//
// Reactive localStorage adapter for a single backtest phase session.
// Exposes TradingDay[] + mutation ops. Does NOT compute derived state —
// computeAccountState is called by the consuming component.
//
// Satisfies: REQ-LS-04, REQ-LS-08, REQ-LS-09, REQ-LS-12, REQ-LS-13
// ---------------------------------------------------------------------------

export type SessionOps = {
  addDay: (day: TradingDay) => void
  updateDay: (dayId: string, updater: (day: TradingDay) => TradingDay) => void
  removeDay: (dayId: string) => void
  addTrade: (dayId: string, trade: Trade) => void
  updateTrade: (dayId: string, tradeId: string, pnl: number) => void
  removeTrade: (dayId: string, tradeId: string) => void
  clearSession: () => void
}

export function useBacktestSession(
  backtestId: string,
  /** Stable key for the current lifecycle attempt (eval event id, or "init"). */
  lifecycleKey: string,
  phase: Phase,
): { days: TradingDay[] } & SessionOps {
  // Re-initialize state when (backtestId, lifecycleKey, phase) changes.
  // We use a stable initializer key so React re-mounts cleanly when the
  // caller switches phases or opens a new lifecycle attempt.
  const sessionKey = `${backtestId}:${lifecycleKey}:${phase}`
  const [currentKey, setCurrentKey] = useState(sessionKey)
  const [days, setDays] = useState<TradingDay[]>(() =>
    readSession(backtestId, lifecycleKey, phase),
  )

  if (currentKey !== sessionKey) {
    // Synchronous state reset on render — React's recommended pattern for
    // "reset state when a prop changes" without an effect.
    setCurrentKey(sessionKey)
    setDays(readSession(backtestId, lifecycleKey, phase))
  }

  // Persist on every change
  useEffect(() => {
    writeSession(backtestId, lifecycleKey, phase, days)
  }, [backtestId, lifecycleKey, phase, days])

  const addDay = useCallback((day: TradingDay) => {
    setDays((prev) => [...prev, day])
  }, [])

  const updateDay = useCallback(
    (dayId: string, updater: (day: TradingDay) => TradingDay) => {
      setDays((prev) => prev.map((d) => (d.id === dayId ? updater(d) : d)))
    },
    [],
  )

  const removeDay = useCallback((dayId: string) => {
    setDays((prev) => prev.filter((d) => d.id !== dayId))
  }, [])

  const addTrade = useCallback((dayId: string, trade: Trade) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, trades: [...d.trades, trade] } : d,
      ),
    )
  }, [])

  const updateTrade = useCallback(
    (dayId: string, tradeId: string, pnl: number) => {
      setDays((prev) =>
        prev.map((d) =>
          d.id === dayId
            ? {
                ...d,
                trades: d.trades.map((t) =>
                  t.id === tradeId ? { ...t, pnl } : t,
                ),
              }
            : d,
        ),
      )
    },
    [],
  )

  const removeTrade = useCallback((dayId: string, tradeId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, trades: d.trades.filter((t) => t.id !== tradeId) }
          : d,
      ),
    )
  }, [])

  const clearSession = useCallback(() => {
    clearSessionStorage(backtestId, lifecycleKey, phase)
    setDays([])
  }, [backtestId, lifecycleKey, phase])

  return {
    days,
    addDay,
    updateDay,
    removeDay,
    addTrade,
    updateTrade,
    removeTrade,
    clearSession,
  }
}
