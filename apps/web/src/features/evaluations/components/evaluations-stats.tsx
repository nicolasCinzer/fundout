import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { KpiCard } from "@/features/dashboard/components/kpi-card"
import { formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import {
  toOutcomeTimeline,
  computeLossStreak,
} from "@/features/evaluations/lib/loss-streak"

type Props = {
  evaluations: Evaluation[]
  /** Evaluation ids that ultimately produced a withdrawal (a payout). */
  withdrewEvalIds: Set<string>
}

const TOP_N = 3

function topEntry(map: Map<string, number>): [string, number] | null {
  let best: [string, number] | null = null
  for (const entry of map) {
    if (!best || entry[1] > best[1]) best = entry
  }
  return best && best[1] > 0 ? best : null
}

export function EvaluationsStats({ evaluations, withdrewEvalIds }: Props) {
  const { t } = useTranslation("evaluations")
  const stats = useMemo(() => {
    const total = evaluations.length
    // An "attempt" is a paid shot at getting funded: the evaluation itself
    // plus every reset. Same definition as computeKpis / computeLeaderboard.
    let totalAttempts = 0
    let passed = 0
    let inProgress = 0
    const byFirm = new Map<string, number>()
    const byFirmPassed = new Map<string, number>()
    const byFirmActive = new Map<string, number>()

    for (const e of evaluations) {
      const name = e.propfirm?.name ?? "Unknown"
      const attempts = 1 + (e.resets?.length ?? 0)
      totalAttempts += attempts
      byFirm.set(name, (byFirm.get(name) ?? 0) + attempts)

      if (e.status === "passed") {
        passed++
        byFirmPassed.set(name, (byFirmPassed.get(name) ?? 0) + 1)
      } else if (e.status === "in_progress") {
        inProgress++
        byFirmActive.set(name, (byFirmActive.get(name) ?? 0) + 1)
      }
    }

    const lossStreak = computeLossStreak(
      toOutcomeTimeline(evaluations, withdrewEvalIds),
    )
    const topFirms = [...byFirm.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)

    return {
      total,
      totalAttempts,
      passed,
      inProgress,
      lossStreak,
      topFirms,
      topActive: topEntry(byFirmActive),
      topPassed: topEntry(byFirmPassed),
    }
  }, [evaluations, withdrewEvalIds])

  // Funding ratio is per attempt (evals + resets), matching the dashboard's
  // fundingRatio in computeKpis — not per evaluation.
  const passedPct = stats.totalAttempts ? stats.passed / stats.totalAttempts : 0

  const avgStreak = stats.lossStreak.average
  const avgStreakLabel = Number.isInteger(avgStreak)
    ? String(avgStreak)
    : avgStreak.toFixed(1)

  const hint = (entry: [string, number] | null, suffix: string) =>
    entry ? `${entry[0]} · ${entry[1]} ${suffix}` : undefined

  return (
    <div className="grid items-stretch gap-3 grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-1 [&>*]:h-full">
        <KpiCard
          label={t("stats.attemptsLabel")}
          value={String(stats.totalAttempts)}
          hint={
            stats.inProgress > 0
              ? hint(stats.topActive, t("stats.active"))
              : t("stats.nothingActive")
          }
          badge={`${stats.inProgress} ${t("stats.active")}`}
        />
      </div>
      <div className="lg:col-span-1 [&>*]:h-full">
        <KpiCard
          label={t("stats.funded")}
          value={String(stats.passed)}
          hint={hint(stats.topPassed, t("stats.funded").toLowerCase())}
          badge={stats.total ? formatPercent(passedPct) : undefined}
          tone="positive"
        />
      </div>
      <div className="lg:col-span-1 [&>*]:h-full">
        <KpiCard
          label={t("stats.lossStreak")}
          value={String(stats.lossStreak.current)}
          hint={
            stats.lossStreak.longest > 0
              ? t("stats.longestStreak", { count: stats.lossStreak.longest })
              : t("stats.noLosses")
          }
          badge={
            avgStreak > 0
              ? t("stats.avgStreak", { value: avgStreakLabel })
              : undefined
          }
          badgeTone="negative"
          tone={stats.lossStreak.current > 0 ? "negative" : "default"}
        />
      </div>
      <div className="col-span-2 lg:col-span-3 [&>*]:h-full">
        <TopPropfirmsCard topFirms={stats.topFirms} t={t} />
      </div>
    </div>
  )
}

type Medal = {
  bg: string
  border: string
  text: string
}

const MEDALS: Record<1 | 2 | 3, Medal> = {
  1: {
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    text: "text-amber-400",
  },
  2: {
    bg: "bg-zinc-300/10",
    border: "border-zinc-300/30",
    text: "text-zinc-300",
  },
  3: {
    bg: "bg-orange-600/10",
    border: "border-orange-600/30",
    text: "text-orange-500",
  },
}

type StepConfig = {
  rank: 1 | 2 | 3
  span: string
  medalSize: string
  medalText: string
  nameSize: string
  countSize: string
}

// Podium ordering: left=silver, center=gold, right=bronze.
// Widths shrink from gold → silver → bronze.
const COLUMNS: StepConfig[] = [
  {
    rank: 2,
    span: "col-span-4",
    medalSize: "h-6 w-6",
    medalText: "text-[11px]",
    nameSize: "text-sm font-semibold",
    countSize: "text-[11px]",
  },
  {
    rank: 1,
    span: "col-span-5",
    medalSize: "h-7 w-7",
    medalText: "text-xs",
    nameSize: "text-base font-bold",
    countSize: "text-xs",
  },
  {
    rank: 3,
    span: "col-span-3",
    medalSize: "h-5 w-5",
    medalText: "text-[10px]",
    nameSize: "text-xs font-medium",
    countSize: "text-[10px]",
  },
]

function TopPropfirmsCard({
  topFirms,
  t,
}: {
  topFirms: [string, number][]
  t: ReturnType<typeof useTranslation<"evaluations">>["t"]
}) {
  return (
    <Card className="gap-2 px-4 py-3.5">
      <p className="text-xs font-medium text-muted-foreground">
        {t("stats.topPropfirms")}
      </p>
      {topFirms.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("stats.noData")}</p>
      ) : (
        <div className="grid grid-cols-12 items-stretch gap-2">
          {COLUMNS.map((col) => {
            const entry = topFirms[col.rank - 1]
            const medal = MEDALS[col.rank]
            if (!entry) {
              return (
                <div
                  key={col.rank}
                  className={cn(
                    "flex items-center gap-2 rounded-md border border-dashed border-muted px-3 py-2 opacity-50",
                    col.span,
                  )}
                >
                  <span className="text-xs text-muted-foreground">—</span>
                </div>
              )
            }
            const [name, count] = entry
            return (
              <div
                key={col.rank}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2",
                  col.span,
                  medal.bg,
                  medal.border,
                )}
              >
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border font-heading font-bold tabular-nums",
                    col.medalSize,
                    col.medalText,
                    medal.border,
                    medal.text,
                  )}
                >
                  {col.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate leading-tight",
                      col.nameSize,
                      medal.text,
                    )}
                  >
                    {name}
                  </p>
                  <p
                    className={cn(
                      "tabular-nums text-muted-foreground",
                      col.countSize,
                    )}
                  >
                    {count} {count === 1 ? t("stats.attempt") : t("stats.attempts")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
