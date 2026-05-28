import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Percent,
  Target,
  TrendingUp,
} from "lucide-react"
import { AppHeader } from "@/components/common/app-header"
import { EmptyState } from "@/components/common/empty-state"
import { KpiSkeleton } from "@/components/common/kpi-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { KpiCard } from "@/features/dashboard/components/kpi-card"
import { FlowChart } from "@/features/dashboard/components/flow-chart"
import { PropfirmLeaderboard } from "@/features/dashboard/components/propfirm-leaderboard"
import { TimePeriodSelect } from "@/features/dashboard/components/time-period-select"
import { computeFlow } from "@/features/dashboard/lib/compute-flow"
import { computeKpis } from "@/features/dashboard/lib/compute-kpis"
import { computeLeaderboard } from "@/features/dashboard/lib/compute-leaderboard"
import { computePnlContext } from "@/features/dashboard/lib/compute-pnl-context"
import { computeRatioContext } from "@/features/dashboard/lib/compute-ratio-context"
import { computeActiveContext } from "@/features/dashboard/lib/compute-active-context"
import {
  DEFAULT_PERIOD,
  PERIODS,
  PERIOD_LABEL,
  periodRange,
  type Period,
} from "@/features/dashboard/lib/period"
import { useEvaluations } from "@/features/evaluations/api/evaluations-queries"
import { useFundedAccounts } from "@/features/funded-accounts/api/funded-accounts-queries"
import { usePayouts } from "@/features/payouts/api/payouts-queries"
import { EvaluationFormDialog } from "@/features/evaluations/components/evaluation-form-dialog"
import { formatCurrency, formatPercent } from "@/lib/format"

const SEARCH_SCHEMA = z.object({
  period: z.enum(PERIODS).optional().catch(undefined),
})

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
  validateSearch: (search) => SEARCH_SCHEMA.parse(search),
})

function DashboardPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const period: Period = search.period ?? DEFAULT_PERIOD

  const evaluations = useEvaluations()
  const fundedAccounts = useFundedAccounts()
  const payouts = usePayouts()

  const ready = !!(
    evaluations.data &&
    fundedAccounts.data &&
    payouts.data
  )

  const handlePeriodChange = (next: Period) =>
    navigate({
      search: { period: next === DEFAULT_PERIOD ? undefined : next },
      replace: true,
    })

  return (
    <>
      <AppHeader
        title="Dashboard"
        description="Your propfirm ROI at a glance"
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {PERIOD_LABEL[period].toLowerCase()}
            </span>
            . Switch the period to compare ranges.
          </p>
          <TimePeriodSelect value={period} onChange={handlePeriodChange} />
        </div>

        {!ready ? (
          <DashboardSkeleton />
        ) : evaluations.data!.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-5 w-5" />}
            title="No data yet"
            description="Track your first propfirm evaluation to see funding ratio, net P&L, and monthly flow come to life."
            action={<EvaluationFormDialog />}
            className="mt-8"
          />
        ) : (
          <DashboardContent
            period={period}
            evaluations={evaluations.data!}
            fundedAccounts={fundedAccounts.data!}
            payouts={payouts.data!}
          />
        )}
      </main>
    </>
  )
}

type DashboardContentProps = {
  period: Period
  evaluations: NonNullable<ReturnType<typeof useEvaluations>["data"]>
  fundedAccounts: NonNullable<ReturnType<typeof useFundedAccounts>["data"]>
  payouts: NonNullable<ReturnType<typeof usePayouts>["data"]>
}

function DashboardContent({
  period,
  evaluations,
  fundedAccounts,
  payouts,
}: DashboardContentProps) {
  const range = periodRange(period)
  const kpis = computeKpis(evaluations, fundedAccounts, payouts, range)
  const flow = computeFlow(evaluations, payouts, range)
  const leaderboard = computeLeaderboard(
    evaluations,
    fundedAccounts,
    payouts,
    range,
  )
  const pnlContext = computePnlContext(evaluations, payouts, period)
  const ratioContext = computeRatioContext(
    evaluations,
    fundedAccounts,
    payouts,
    period,
    kpis.fundingRatio,
    kpis.payoutRatio,
  )
  const activeContext = computeActiveContext(fundedAccounts, range)
  const netPositive = kpis.netPnl >= 0

  const noPeriodActivity =
    kpis.totalEvaluations === 0 &&
    kpis.countFunded === 0 &&
    kpis.totalPayoutsGross === 0

  if (noPeriodActivity) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-5 w-5" />}
        title="No activity in this period"
        description="Pick a wider range to see your data, or log some activity to start filling it in."
        className="mt-8"
      />
    )
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1 md:col-span-2">
          <KpiCard
            label="Net P&L"
            value={`${netPositive ? "+" : ""}${formatCurrency(kpis.netPnl)}`}
            hint={pnlContext.subtitle}
            icon={
              netPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )
            }
            badge={pnlContext.badge ?? undefined}
            badgeTooltip={pnlContext.badgeTooltip ?? undefined}
            tone={netPositive ? "positive" : "negative"}
            emphasized
          />
        </div>
        <KpiCard
          label="Total spent"
          value={formatCurrency(kpis.totalSpent)}
          hint={
            kpis.totalResets === 0
              ? `${kpis.totalEvaluations} evaluations purchased`
              : `${kpis.totalEvaluations} evaluations + ${kpis.totalResets} resets purchased`
          }
          icon={<DollarSign className="h-4 w-4" />}
          badge={`~ ${formatCurrency(kpis.avgCostPerAttempt)}`}
          badgeTooltip="Average cost per attempt (evaluations + resets) in this period."
        />
        <KpiCard
          label="Total payouts (net)"
          value={formatCurrency(kpis.totalPayoutsNet)}
          hint={
            kpis.countPayouts === 1
              ? "1 payout received"
              : `${kpis.countPayouts} payouts received`
          }
          icon={<TrendingUp className="h-4 w-4" />}
          badge={`~ ${formatCurrency(kpis.avgPayoutNet)}`}
          badgeTooltip="Average net amount per payout in this period."
        />
        <KpiCard
          label="Funding ratio"
          value={formatPercent(kpis.fundingRatio)}
          hint={`${kpis.countFunded} of ${kpis.totalAttempts} attempts funded`}
          icon={<Target className="h-4 w-4" />}
          badge={ratioContext.fundingBadge?.value}
          badgeTone={ratioContext.fundingBadge?.tone}
          badgeTooltip={ratioContext.fundingBadge?.tooltip}
        />
        <KpiCard
          label="Payout ratio"
          value={formatPercent(kpis.payoutRatio)}
          hint={`${kpis.countWithPayouts} of ${kpis.totalAttempts} attempts reached payout`}
          icon={<Percent className="h-4 w-4" />}
          badge={ratioContext.payoutBadge?.value}
          badgeTone={ratioContext.payoutBadge?.tone}
          badgeTooltip={ratioContext.payoutBadge?.tooltip}
        />
        <KpiCard
          label="Active funded"
          value={String(kpis.activeFunded)}
          hint="Accounts currently active in this period"
          icon={<TrendingUp className="h-4 w-4" />}
          badge={activeContext.badge ?? undefined}
          badgeTooltip={activeContext.badgeTooltip ?? undefined}
        />
      </section>

      <section>
        <FlowChart data={flow} />
      </section>

      <section>
        <PropfirmLeaderboard rows={leaderboard} />
      </section>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-2 h-3 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[180px] w-full" />
          </CardContent>
        </Card>
      </section>
    </>
  )
}
