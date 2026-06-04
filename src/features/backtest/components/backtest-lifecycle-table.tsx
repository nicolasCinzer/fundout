import { FlaskConical } from "lucide-react"
import { EmptyState } from "@/components/common/empty-state"
import { Badge } from "@/components/ui/badge"
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
  lost: "Perdida",
  blown_no_payout: "Explotada",
  funded_paid: "Pagada",
  open: "Abierta",
}

function StatusBadge({ status }: { status: LifecycleStatus }) {
  if (status === "lost") {
    return (
      <Badge variant="destructive">
        {STATUS_LABEL.lost}
      </Badge>
    )
  }
  if (status === "blown_no_payout") {
    return (
      <span className="inline-flex h-5 items-center rounded-4xl border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
        {STATUS_LABEL.blown_no_payout}
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
    <span className="inline-flex h-5 items-center rounded-4xl border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
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
        title="Sin eventos aún"
        description="Empezá con E."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 font-heading text-xs uppercase tracking-wide">
              #
            </TableHead>
            <TableHead className="font-heading text-xs uppercase tracking-wide">
              Tipo
            </TableHead>
            <TableHead className="font-heading text-xs uppercase tracking-wide">
              Fondeado
            </TableHead>
            <TableHead className="text-right font-heading text-xs uppercase tracking-wide">
              Retiros
            </TableHead>
            <TableHead className="text-right font-heading text-xs uppercase tracking-wide">
              Suma retiros
            </TableHead>
            <TableHead className="font-heading text-xs uppercase tracking-wide">
              Resultado
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
                <span className="font-mono text-xs font-medium">E</span>
                {lc.fundedEvent ? (
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    +F
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lc.fundedEvent ? "Sí" : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {lc.payouts.length > 0 ? lc.payouts.length : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {lc.payoutsTotal > 0
                  ? formatCurrency(lc.payoutsTotal, true)
                  : "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={lc.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
