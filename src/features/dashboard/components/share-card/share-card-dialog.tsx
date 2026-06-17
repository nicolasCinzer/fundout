import { useRef, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShareCardPreview } from "@/features/dashboard/components/share-card/share-card-preview"
import { useShareHandle } from "@/features/dashboard/components/share-card/hooks/use-share-handle"
import { exportNodeToPng } from "@/features/dashboard/components/share-card/lib/export-png"
import { isIOS } from "@/features/dashboard/components/share-card/lib/is-ios"
import {
  SHARE_CARD_DIMENSIONS,
  type ShareCardDimensionKey,
} from "@/features/dashboard/components/share-card/share-card.constants"
import type { DashboardKpis } from "@/features/dashboard/lib/compute-kpis"
import type { Period } from "@/features/dashboard/lib/period"

type ShareCardDialogProps = {
  kpis: DashboardKpis
  periodLabel: string
  period: Period
  trigger: React.ReactNode
}

/** Converts a period key to a URL-slug for the filename (e.g. "last_30_days" → "last-30-days") */
function periodSlug(period: Period): string {
  return period.replaceAll("_", "-")
}

export function ShareCardDialog({
  kpis,
  periodLabel,
  period,
  trigger,
}: ShareCardDialogProps) {
  const { t } = useTranslation("dashboard")
  const [open, setOpen] = useState(false)
  const [dimensions, setDimensions] = useState<ShareCardDimensionKey>("x")
  const [handle, setHandle] = useShareHandle()
  const [busy, setBusy] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  const cardRef = useRef<HTMLDivElement | null>(null)

  const kpiLabels = {
    netPnl:       t("shareCard.kpi.netPnl"),
    roi:          t("shareCard.kpi.roi"),
    evaluations:  t("shareCard.kpi.evaluations"),
    totalSpent:   t("shareCard.kpi.totalSpent"),
    totalPayouts: t("shareCard.kpi.totalPayouts"),
    fundingRatio: t("shareCard.kpi.fundingRatio"),
    payoutRatio:  t("shareCard.kpi.payoutRatio"),
    emptyValue:   t("shareCard.emptyValue"),
    tagline:      t("shareCard.tagline"),
  }

  const { width, height } = SHARE_CARD_DIMENSIONS[dimensions]

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    setBusy(true)
    setIosHint(false)
    try {
      const filename = `fundout-${periodSlug(period)}-${width}x${height}.png`
      await exportNodeToPng(cardRef.current, { width, height, filename })
      if (isIOS()) {
        setIosHint(true)
      } else {
        toast.success(t("shareCard.success"))
      }
    } catch {
      toast.error(t("shareCard.error"))
    } finally {
      setBusy(false)
    }
  }, [cardRef, period, width, height, t])

  const shareCardKpis = {
    netPnl:           kpis.netPnl,
    totalSpent:       kpis.totalSpent,
    totalPayoutsNet:  kpis.totalPayoutsNet,
    fundingRatio:     kpis.fundingRatio,
    payoutRatio:      kpis.payoutRatio,
    totalEvaluations: kpis.totalEvaluations,
    roi:              kpis.roi,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("shareCard.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("shareCard.dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Card preview — scaled to fit dialog */}
          <div className="flex justify-center py-2">
            <ShareCardPreview
              kpis={shareCardKpis}
              periodLabel={periodLabel}
              handle={handle}
              dimensions={dimensions}
              kpiLabels={kpiLabels}
              maxWidth={520}
              cardRef={cardRef}
            />
          </div>

          <div className="space-y-4">
            {/* Dimensions toggle — segmented control via Tabs */}
            <div className="space-y-2">
              <Label>{t("shareCard.dimensionsLabel")}</Label>
              <Tabs
                value={dimensions}
                onValueChange={(v) => setDimensions(v as ShareCardDimensionKey)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  {(["x", "ig"] as const).map((dim) => (
                    <TabsTrigger key={dim} value={dim} className="flex-1">
                      {t(`shareCard.dimensions.${dim}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Handle input with @ prefix */}
            <div className="space-y-2">
              <Label htmlFor="share-handle">{t("shareCard.handleLabel")}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="share-handle"
                  value={handle.replace(/^@/, "")}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder={t("shareCard.handlePlaceholder").replace(/^@/, "")}
                  className="pl-7"
                />
              </div>
            </div>

            {/* iOS hint — amber toast-style box */}
            {iosHint && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                {t("shareCard.iosHint")}
              </div>
            )}

            {/* Download CTA */}
            <Button
              onClick={handleDownload}
              disabled={busy}
              className="w-full"
            >
              <Download className="h-4 w-4" />
              {busy ? t("shareCard.downloadingButton") : t("shareCard.downloadButton")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
