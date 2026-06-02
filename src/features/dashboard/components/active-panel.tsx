import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { FundedAccount } from "@/features/funded-accounts/api/funded-accounts-queries"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"

type Props = {
  fundedAccounts: FundedAccount[]
  evaluations: Evaluation[]
  payouts: Payout[]
}

const MAX_ITEMS = 3

export function ActivePanel({ fundedAccounts, evaluations, payouts }: Props) {
  const netByAccount = new Map<string, number>()
  for (const p of payouts) {
    const id = p.funded_account?.id
    if (!id) continue
    const net = Number(p.amount) - Number(p.fee_taken)
    netByAccount.set(id, (netByAccount.get(id) ?? 0) + net)
  }

  const activeAccounts = fundedAccounts.filter((a) => a.status === "active")
  const topAccounts = [...activeAccounts]
    .sort(
      (a, b) => (netByAccount.get(b.id) ?? 0) - (netByAccount.get(a.id) ?? 0),
    )
    .slice(0, MAX_ITEMS)

  const activeEvaluations = evaluations.filter((e) => e.status === "in_progress")
  const recentEvaluations = activeEvaluations.slice(0, MAX_ITEMS)

  return (
    <div className="grid gap-4 lg:grid-cols-1">
      <Card className="gap-3 p-4">
        <SectionHeader title="Active accounts" count={activeAccounts.length} />
        {topAccounts.length === 0 ? (
          <EmptyRow message="No active funded accounts." />
        ) : (
          <ul className="space-y-2">
            {topAccounts.map((a) => {
              const net = netByAccount.get(a.id) ?? 0
              const size = a.evaluation?.account_size ?? null
              const name = a.evaluation?.propfirm?.name ?? "Unknown propfirm"
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-card/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    {size !== null && (
                      <p className="text-[11px] text-muted-foreground">
                        {formatCurrency(size)} account
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        net > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {net > 0 ? `+${formatCurrency(net)}` : "No payouts"}
                    </p>
                    <p className="text-[10px] font-heading uppercase tracking-wide text-muted-foreground">
                      Active
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {activeAccounts.length > MAX_ITEMS && (
          <ViewMoreLink
            to="/funded-accounts"
            count={activeAccounts.length - MAX_ITEMS}
          />
        )}
      </Card>

      <Card className="gap-3 p-4">
        <SectionHeader
          title="Active evaluations"
          count={activeEvaluations.length}
        />
        {recentEvaluations.length === 0 ? (
          <EmptyRow message="No evaluations in progress." />
        ) : (
          <ul className="space-y-2">
            {recentEvaluations.map((e) => {
              const name = e.propfirm?.name ?? "Unknown propfirm"
              const size = e.account_size
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-card/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatCurrency(size)} account
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-heading uppercase tracking-wide"
                  >
                    Active
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
        {activeEvaluations.length > MAX_ITEMS && (
          <ViewMoreLink
            to="/evaluations"
            count={activeEvaluations.length - MAX_ITEMS}
          />
        )}
      </Card>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between border-b pb-2">
      <h3 className="text-[11px] font-heading uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <span className="text-[11px] font-heading tabular-nums text-muted-foreground">
        {count}
      </span>
    </div>
  )
}

function EmptyRow({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-center text-xs text-muted-foreground">
      {message}
    </p>
  )
}

function ViewMoreLink({
  to,
  count,
}: {
  to: "/funded-accounts" | "/evaluations"
  count: number
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
    >
      <span>
        View {count} more {count === 1 ? "item" : "items"}
      </span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
