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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { XIcon, InstagramIcon } from "@/features/dashboard/components/share-card/social-icons"
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
    attempts:     t("shareCard.kpi.attempts"),
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
    // Attempts = evaluations + resets. The card's ratios divide by attempts, so
    // the displayed count must match that denominator for the numbers to reconcile.
    totalAttempts:    kpis.totalAttempts,
    roi:              kpis.roi,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("shareCard.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("shareCard.dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Card preview — scaled to fit dialog */}
          <div className="flex justify-center py-2">
            <ShareCardPreview
              kpis={shareCardKpis}
              periodLabel={periodLabel}
              handle={handle}
              dimensions={dimensions}
              kpiLabels={kpiLabels}
              maxWidth={520}
              maxHeight={420}
              cardRef={cardRef}
            />
          </div>

          {/* Compact controls toolbar — format + handle + download in one row below the preview */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Format toggle — icon-only segmented control */}
            <Tabs
              value={dimensions}
              onValueChange={(v) => setDimensions(v as ShareCardDimensionKey)}
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger
                  value="x"
                  className="px-4"
                  aria-label={t("shareCard.dimensions.x")}
                  title={t("shareCard.dimensions.x")}
                >
                  <XIcon className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger
                  value="ig"
                  className="px-4"
                  aria-label={t("shareCard.dimensions.ig")}
                  title={t("shareCard.dimensions.ig")}
                >
                  <InstagramIcon className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Handle input with @ prefix */}
            <div className="relative min-w-[140px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="share-handle"
                value={handle.replace(/^@/, "")}
                onChange={(e) => setHandle(e.target.value)}
                placeholder={t("shareCard.handlePlaceholder").replace(/^@/, "")}
                aria-label={t("shareCard.handleLabel")}
                className="pl-7"
              />
            </div>

            {/* Download CTA */}
            <Button
              onClick={handleDownload}
              disabled={busy}
              className="shrink-0"
            >
              <Download className="h-4 w-4" />
              {busy ? t("shareCard.downloadingButton") : t("shareCard.downloadButton")}
            </Button>
          </div>

          {/* iOS hint — amber toast-style box */}
          {iosHint && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              {t("shareCard.iosHint")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
