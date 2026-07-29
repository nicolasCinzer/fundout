import { ChartLine } from "lucide-react"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/common/empty-state"

// ---------------------------------------------------------------------------
// BalanceTrackerEmptyState
//
// Informational-only empty state shown when the backtest has no account rules.
// Account rules are now defined at creation time (create-backtest-dialog).
// There is no action button — this backtest cannot gain balance tracking.
// ---------------------------------------------------------------------------

export function BalanceTrackerEmptyState() {
  const { t } = useTranslation("backtest")

  return (
    <EmptyState
      icon={<ChartLine className="h-5 w-5" />}
      title={t("tracker.empty.title")}
      description={t("tracker.empty.description")}
    />
  )
}
