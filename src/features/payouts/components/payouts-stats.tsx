import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { KpiCard } from "@/features/dashboard/components/kpi-card"
import { formatCurrency, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Payout } from "@/features/payouts/api/payouts-queries"

type Props = {
  payouts: Payout[]
}

const TOP_N = 3

function topEntry(map: Map<string, number>): [string, number] | null {
  let best: [string, number] | null = null
  for (const entry of map) {
    if (!best || entry[1] > best[1]) best = entry
  }
  return best && best[1] > 0 ? best : null
}

export function PayoutsStats({ payouts }: Props) {
  const { t } = useTranslation("payouts")
  const stats = useMemo(() => {
    const total = payouts.length
    let totalNet = 0
    let totalFees = 0
    let totalAmount = 0

    const byFirmCount = new Map<string, number>()
    const byFirmNet = new Map<string, number>()

    for (const p of payouts) {
      const name = p.funded_account?.evaluation?.propfirm?.name ?? "Unknown"
      const amount = Number(p.amount)
      const fee = Number(p.fee_taken)
      const net = amount - fee

      totalAmount += amount
      totalFees += fee
      totalNet += net

      byFirmCount.set(name, (byFirmCount.get(name) ?? 0) + 1)
      byFirmNet.set(name, (byFirmNet.get(name) ?? 0) + net)
    }

    const topFirms = [...byFirmNet.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)

    return {
      total,
      totalNet,
      totalFees,
      totalAmount,
      topCount: topEntry(byFirmCount),
      topNet: topEntry(byFirmNet),
      topFirms,
    }
  }, [payouts])

  const avgNet = stats.total ? stats.totalNet / stats.total : 0
  const feePct = stats.totalAmount ? stats.totalFees / stats.totalAmount : 0

  return (
    <div className="grid items-stretch gap-3 grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-1 [&>*]:h-full">
        <KpiCard
          label={t("stats.totalLabel")}
          value={String(stats.total)}
          hint={
            stats.topCount
              ? `${stats.topCount[0]} · ${stats.topCount[1]} ${stats.topCount[1] === 1 ? t("stats.payout") : t("stats.payouts")}`
              : undefined
          }
          badge={
            stats.total > 0 ? `${t("stats.avg")} ${formatCurrency(avgNet)}` : undefined
          }
        />
      </div>
      <div className="lg:col-span-1 [&>*]:h-full">
        <KpiCard
          label={t("stats.netTotal")}
          value={formatCurrency(stats.totalNet)}
          hint={
            stats.topNet
              ? `${stats.topNet[0]} · ${formatCurrency(stats.topNet[1])}`
              : undefined
          }
          tone="positive"
        />
      </div>
      <div className="lg:col-span-1 [&>*]:h-full">
        <KpiCard
          label={t("stats.feesWithheld")}
          value={formatCurrency(stats.totalFees)}
          hint={
            stats.totalAmount > 0
              ? `${formatCurrency(stats.totalAmount)} ${t("stats.gross")}`
              : undefined
          }
          badge={stats.totalAmount > 0 ? formatPercent(feePct) : undefined}
          tone="negative"
          badgeTone="negative"
        />
      </div>
      <div className="col-span-2 lg:col-span-3 [&>*]:h-full">
        <TopPropfirmsCard topFirms={stats.topFirms} t={t} />
      </div>
    </div>
  )
}

type Medal = { bg: string; border: string; text: string }
const MEDALS: Record<1 | 2 | 3, Medal> = {
  1: { bg: "bg-amber-400/10", border: "border-amber-400/30", text: "text-amber-400" },
  2: { bg: "bg-zinc-300/10", border: "border-zinc-300/30", text: "text-zinc-300" },
  3: { bg: "bg-orange-600/10", border: "border-orange-600/30", text: "text-orange-500" },
}

type StepConfig = {
  rank: 1 | 2 | 3
  span: string
  medalSize: string
  medalText: string
  nameSize: string
  countSize: string
}

const COLUMNS: StepConfig[] = [
  { rank: 2, span: "col-span-4", medalSize: "h-6 w-6", medalText: "text-[11px]", nameSize: "text-sm font-semibold", countSize: "text-[11px]" },
  { rank: 1, span: "col-span-5", medalSize: "h-7 w-7", medalText: "text-xs", nameSize: "text-base font-bold", countSize: "text-xs" },
  { rank: 3, span: "col-span-3", medalSize: "h-5 w-5", medalText: "text-[10px]", nameSize: "text-xs font-medium", countSize: "text-[10px]" },
]

function TopPropfirmsCard({
  topFirms,
  t,
}: {
  topFirms: [string, number][]
  t: ReturnType<typeof useTranslation<"payouts">>["t"]
}) {
  return (
    <Card className="gap-2 px-4 py-3.5">
      <p className="text-xs font-medium text-muted-foreground">
        {t("stats.topPropfirms")}
      </p>
      {topFirms.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("stats.noPayouts")}</p>
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
            const [name, value] = entry
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
                  <p className={cn("truncate leading-tight", col.nameSize, medal.text)}>
                    {name}
                  </p>
                  <p className={cn("tabular-nums text-muted-foreground", col.countSize)}>
                    {formatCurrency(value)}
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
