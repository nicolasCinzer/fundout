import { useTranslation } from "react-i18next"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShareCardDialog } from "@/features/dashboard/components/share-card/share-card-dialog"
import type { DashboardKpis } from "@/features/dashboard/lib/compute-kpis"
import type { Period } from "@/features/dashboard/lib/period"
import { periodLabel } from "@/features/dashboard/lib/period"

type ShareCardButtonProps = {
  kpis: DashboardKpis
  period: Period
}

export function ShareCardButton({ kpis, period }: ShareCardButtonProps) {
  const { t } = useTranslation("dashboard")
  const label = periodLabel(t, period)

  return (
    <ShareCardDialog
      kpis={kpis}
      periodLabel={label}
      period={period}
      trigger={
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />
          {t("shareCard.buttonLabel")}
        </Button>
      }
    />
  )
}
