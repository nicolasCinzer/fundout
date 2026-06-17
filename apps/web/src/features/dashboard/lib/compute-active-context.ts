import type { FundedAccount } from "@/features/funded-accounts/api/funded-accounts-queries"
import { isDateInRange, type DateRange } from "./period"

export type ActiveContext = {
  badge: string | null
  badgeTooltip: string | null
}

/**
 * Find the propfirm with the most active funded accounts within the current
 * range. Matches the scope of the card's `activeFunded` count, so the badge
 * always reflects what the user is looking at. Ties broken alphabetically for
 * stable display.
 */
export function computeActiveContext(
  fundedAccounts: FundedAccount[],
  range: DateRange,
): ActiveContext {
  const counts = new Map<string, number>()
  for (const fa of fundedAccounts) {
    if (!isDateInRange(fa.start_date, range)) continue
    if (fa.status !== "active") continue
    const name = fa.evaluation?.propfirm?.name
    if (!name) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  if (counts.size === 0) return { badge: null, badgeTooltip: null }

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0])
  })
  const [name, count] = sorted[0]
  return {
    badge: name,
    badgeTooltip: `Propfirm with the most active funded accounts in this period (${count}).`,
  }
}
