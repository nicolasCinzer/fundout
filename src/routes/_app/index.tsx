import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { useTranslation } from "react-i18next"
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
import { ActivePanel } from "@/features/dashboard/components/active-panel"
import { TimePeriodSelect } from "@/features/dashboard/components/time-period-select"
import { computeFlow } from "@/features/dashboard/lib/compute-flow"
import { computeKpis } from "@/features/dashboard/lib/compute-kpis"
import { computeLeaderboard } from "@/features/dashboard/lib/compute-leaderboard"
import { computePnlContext } from "@/features/dashboard/lib/compute-pnl-context"
import { computeRatioContext } from "@/features/dashboard/lib/compute-ratio-context"
import {
  DEFAULT_PERIOD,
  PERIODS,
  periodLabel,
  periodRange,
  type CustomRange,
  type Period,
} from "@/features/dashboard/lib/period"
import { useEvaluations } from "@/features/evaluations/api/evaluations-queries"
import { useFundedAccounts } from "@/features/funded-accounts/api/funded-accounts-queries"
import { usePayouts } from "@/features/payouts/api/payouts-queries"
import { EvaluationFormDialog } from "@/features/evaluations/components/evaluation-form-dialog"
import { ShareCardButton } from "@/features/dashboard/components/share-card"
import { formatCurrency, formatPercent } from "@/lib/format"
import { useFormatters } from "@/lib/i18n/use-formatters"
import { format } from "date-fns"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const SEARCH_SCHEMA = z.object({
  period: z.enum(PERIODS).optional().catch(undefined),
  from: z.string().regex(DATE_RE).optional().catch(undefined),
  to: z.string().regex(DATE_RE).optional().catch(undefined),
})

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
  validateSearch: (search) => SEARCH_SCHEMA.parse(search),
})

function DashboardPage() {
  const { t } = useTranslation("dashboard")
  const formatters = useFormatters()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const period: Period = search.period ?? DEFAULT_PERIOD
  const custom: CustomRange = { from: search.from, to: search.to }

  const evaluations = useEvaluations()
  const fundedAccounts = useFundedAccounts()
  const payouts = usePayouts()

  const ready = !!(
    evaluations.data &&
    fundedAccounts.data &&
    payouts.data
  )

  const range = periodRange(period, new Date(), custom)
  const rangeStr =
    range.start && range.end
      ? `${format(range.start, "MMM d, yyyy", { locale: formatters.dateLocale })} – ${format(range.end, "MMM d, yyyy", { locale: formatters.dateLocale })}`
      : ""

  const handlePeriodChange = (next: Period, nextCustom?: CustomRange) => {
    const usingCustom = next === "custom"
    navigate({
      search: {
        period: next === DEFAULT_PERIOD ? undefined : next,
        from: usingCustom ? nextCustom?.from : undefined,
        to: usingCustom ? nextCustom?.to : undefined,
      },
      replace: true,
    })
  }

  return (
    <>
      <AppHeader
        title={t("title")}
        description={t("subtitle")}
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {t("periodBanner", {
                period: periodLabel(t, period),
                range: rangeStr,
              })}
            </span>
          </p>
          <TimePeriodSelect
            value={period}
            custom={custom}
            onChange={handlePeriodChange}
          />
        </div>

        {!ready ? (
          <DashboardSkeleton />
        ) : evaluations.data!.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-5 w-5" />}
            title={t("emptyState.noData.title")}
            description={t("emptyState.noData.description")}
            action={<EvaluationFormDialog />}
            className="mt-8"
          />
        ) : (
          <DashboardContent
            period={period}
            custom={custom}
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
  custom: CustomRange
  evaluations: NonNullable<ReturnType<typeof useEvaluations>["data"]>
  fundedAccounts: NonNullable<ReturnType<typeof useFundedAccounts>["data"]>
  payouts: NonNullable<ReturnType<typeof usePayouts>["data"]>
}

function DashboardContent({
  period,
  custom,
  evaluations,
  fundedAccounts,
  payouts,
}: DashboardContentProps) {
  const { t } = useTranslation("dashboard")
  const range = periodRange(period, new Date(), custom)
  const kpis = computeKpis(evaluations, fundedAccounts, payouts, range)
  const flow = computeFlow(evaluations, payouts, range)
  const leaderboard = computeLeaderboard(
    evaluations,
    fundedAccounts,
    payouts,
    range,
  )
  const pnlContext = computePnlContext(evaluations, payouts, period, t)
  const ratioContext = computeRatioContext(
    evaluations,
    fundedAccounts,
    payouts,
    period,
    kpis.fundingRatio,
    kpis.payoutRatio,
    t,
  )
  const netPositive = kpis.netPnl >= 0

  const noPeriodActivity =
    kpis.totalEvaluations === 0 &&
    kpis.countFunded === 0 &&
    kpis.totalPayoutsGross === 0

  if (noPeriodActivity) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-5 w-5" />}
        title={t("emptyState.noPeriodActivity.title")}
        description={t("emptyState.noPeriodActivity.description")}
        className="mt-8"
      />
    )
  }

  return (
    <>
      {/* Period row: TimePeriodSelect lives in DashboardPage; Share lives here with kpis */}
      <div className="flex justify-end">
        <ShareCardButton kpis={kpis} period={period} />
      </div>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label={t("kpi.netPnl.title")}
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
        />
        <KpiCard
          label={t("kpi.totalSpent.title")}
          value={formatCurrency(kpis.totalSpent)}
          hint={
            kpis.totalResets === 0
              ? t("kpi.totalSpent.hintNoResets", { count: kpis.totalEvaluations })
              : t("kpi.totalSpent.hint", {
                  count: kpis.totalEvaluations,
                  resets: kpis.totalResets,
                })
          }
          icon={<DollarSign className="h-4 w-4" />}
          badge={`~ ${formatCurrency(kpis.avgCostPerAttempt)}`}
          badgeTooltip={t("kpi.totalSpent.badgeTooltip")}
        />
        <KpiCard
          label={t("kpi.totalPayouts.title")}
          value={formatCurrency(kpis.totalPayoutsNet)}
          hint={t("kpi.totalPayouts.hint", { count: kpis.countPayouts })}
          icon={<TrendingUp className="h-4 w-4" />}
          badge={`~ ${formatCurrency(kpis.avgPayoutNet)}`}
          badgeTooltip={t("kpi.totalPayouts.badgeTooltip")}
        />
        <KpiCard
          label={t("kpi.fundingRatio.title")}
          value={formatPercent(kpis.fundingRatio)}
          hint={t("kpi.fundingRatio.hint", {
            funded: kpis.countFunded,
            total: kpis.totalAttempts,
          })}
          icon={<Target className="h-4 w-4" />}
          badge={ratioContext.fundingBadge?.value}
          badgeTone={ratioContext.fundingBadge?.tone}
          badgeTooltip={ratioContext.fundingBadge?.tooltip}
        />
        <KpiCard
          label={t("kpi.payoutRatio.title")}
          value={formatPercent(kpis.payoutRatio)}
          hint={t("kpi.payoutRatio.hint", {
            paid: kpis.countWithPayouts,
            total: kpis.totalAttempts,
          })}
          icon={<Percent className="h-4 w-4" />}
          badge={ratioContext.payoutBadge?.value}
          badgeTone={ratioContext.payoutBadge?.tone}
          badgeTooltip={ratioContext.payoutBadge?.tooltip}
        />
      </section>

      <section className="grid items-stretch gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <FlowChart data={flow} />
        </div>
        <div className="lg:col-span-4">
          <ActivePanel
            fundedAccounts={fundedAccounts}
            evaluations={evaluations}
            payouts={payouts}
          />
        </div>
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
