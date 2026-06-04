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

const STATUS_LABEL: Record<LifecycleStatus, string> = {
  lost: "Lost",
  breached_no_payout: "Breached",
  funded_paid: "Paid",
  open: "Open",
}

function StatusBadge({ status }: { status: LifecycleStatus }) {
  if (status === "lost") {
    return (
      <span className="inline-flex h-5 items-center rounded-4xl border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        {STATUS_LABEL.lost}
      </span>
    )
  }
  if (status === "breached_no_payout") {
    return (
      <span className="inline-flex h-5 items-center rounded-4xl border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
        {STATUS_LABEL.breached_no_payout}
      </span>
    )
  }
  if (status === "funded_paid") {
    return (
      <span className="inline-flex h-5 items-center rounded-4xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        {STATUS_LABEL.funded_paid}
      </span>
    )
  }
  // open
  return (
    <span className="inline-flex h-5 items-center rounded-4xl border border-muted-foreground/30 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {STATUS_LABEL.open}
    </span>
  )
}

type Props = {
  lifecycles: Lifecycle[]
  evalCost: number
}

export function BacktestLifecycleTable({ lifecycles }: Props) {
  if (lifecycles.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical className="h-5 w-5" />}
        title="No events yet"
        description="Start by recording a Buy Evaluation event."
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
                State
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-right font-heading text-xs uppercase tracking-wide">
                Payouts
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-right font-heading text-xs uppercase tracking-wide">
                Total Withdrawn
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card font-heading text-xs uppercase tracking-wide">
                Notes
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
                    ? formatCurrency(lc.payoutsTotal, true)
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
