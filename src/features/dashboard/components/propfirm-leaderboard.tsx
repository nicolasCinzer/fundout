import { Trophy } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import type { LeaderboardRow } from "@/features/dashboard/lib/compute-leaderboard"

type PropfirmLeaderboardProps = {
  rows: LeaderboardRow[]
}

export function PropfirmLeaderboard({ rows }: PropfirmLeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Propfirms by ROI</CardTitle>
        <CardDescription>
          Net P&amp;L per propfirm in the selected period. Sorted best to worst.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-5 w-5" />}
            title="No activity in this period"
            description="Once you have evaluations, funded accounts, or payouts in the selected period, propfirms will rank here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propfirm</TableHead>
                  <TableHead className="text-right">Evaluations</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Funded</TableHead>
                  <TableHead className="text-right">Paid out</TableHead>
                  <TableHead className="text-right">Payouts (net)</TableHead>
                  <TableHead className="text-right">Net P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.propfirmId}>
                    <TableCell className="font-medium">
                      {r.propfirmName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.evaluationsCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(r.totalFees)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.fundedCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.paidOutCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(r.totalPayoutsNet)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-semibold",
                        r.netPnl > 0 &&
                          "text-emerald-600 dark:text-emerald-400",
                        r.netPnl < 0 && "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {r.netPnl >= 0 ? "+" : ""}
                      {formatCurrency(r.netPnl)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
