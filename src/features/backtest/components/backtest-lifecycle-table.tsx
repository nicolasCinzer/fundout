import { useTranslation } from "react-i18next"
import { FlaskConical } from "lucide-react"
import { EmptyState } from "@/components/common/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import type { Lifecycle, LifecycleStatus } from "@/features/backtest/types"

const STATUS_BADGE_CLASS: Record<LifecycleStatus, string> = {
  lost: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  breached_no_payout:
    "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  funded_paid:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  funded_active: "border-primary/40 bg-primary/10 text-primary",
  open: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
}

function StatusBadge({ status }: { status: LifecycleStatus }) {
  const { t } = useTranslation("backtest")
  return (
    <span
      className={`inline-flex h-5 items-center rounded-4xl border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}
    >
      {t(`lifecycle.badge.${status}`)}
    </span>
  )
}

type Props = {
  lifecycles: Lifecycle[]
  evalCost: number
}

export function BacktestLifecycleTable({ lifecycles }: Props) {
  const { t } = useTranslation("backtest")

  if (lifecycles.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical className="h-5 w-5" />}
        title={t("lifecycle.empty.title")}
        description={t("lifecycle.empty.description")}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 z-10 bg-card w-10 font-heading text-xs uppercase tracking-wide">
                #
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card font-heading text-xs uppercase tracking-wide">
                {t("lifecycle.table.state")}
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-right font-heading text-xs uppercase tracking-wide">
                {t("lifecycle.table.payouts")}
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-right font-heading text-xs uppercase tracking-wide">
                {t("lifecycle.table.totalWithdrawn")}
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card font-heading text-xs uppercase tracking-wide">
                {t("lifecycle.table.notes")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lifecycles.map((lc) => (
              <TableRow key={lc.index}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {lc.index}
                </TableCell>
                <TableCell>
                  <StatusBadge status={lc.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {lc.payouts.length > 0 ? lc.payouts.length : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {lc.payoutsTotal > 0
                    ? formatCurrency(lc.payoutsTotal)
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                  {lc.evalEvent.notes ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
