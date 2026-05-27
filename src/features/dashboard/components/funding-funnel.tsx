import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { DashboardKpis } from "@/features/dashboard/lib/compute-kpis"

type FundingFunnelProps = {
  kpis: DashboardKpis
}

export function FundingFunnel({ kpis }: FundingFunnelProps) {
  const stages = [
    {
      label: "Evaluations",
      value: kpis.totalEvaluations,
      width: 100,
      tone: "bg-chart-1",
      hint: `${kpis.totalEvaluations} total`,
    },
    {
      label: "Funded",
      value: kpis.countFunded,
      width: Math.round(
        (kpis.countFunded / Math.max(kpis.totalEvaluations, 1)) * 100,
      ),
      tone: "bg-chart-2",
      hint: `${formatPercent(kpis.fundingRatio)} funding ratio`,
    },
    {
      label: "With payouts",
      value: kpis.countWithPayouts,
      width: Math.round(
        (kpis.countWithPayouts / Math.max(kpis.totalEvaluations, 1)) * 100,
      ),
      tone: "bg-chart-3",
      hint: `${formatPercent(kpis.payoutRatio)} of funded`,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel</CardTitle>
        <CardDescription>
          From paid evaluation to actual cash in your pocket
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((s) => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{s.label}</span>
              <span className="tabular-nums text-muted-foreground">
                <span className="text-foreground font-semibold">{s.value}</span>{" "}
                · {s.hint}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", s.tone)}
                style={{ width: `${Math.max(s.width, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
