import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { AppHeader } from "@/components/common/app-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ResetJournalDialog } from "@/features/settings/components/reset-journal-dialog"

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation("settings")
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <>
      <AppHeader
        title={t("page.title")}
        description={t("page.description")}
      />
      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-2xl">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t("dangerZone.title")}
              </CardTitle>
              <CardDescription>{t("dangerZone.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {t("dangerZone.reset.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("dangerZone.reset.description")}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setResetOpen(true)}
                  className="sm:flex-shrink-0"
                >
                  {t("dangerZone.reset.button")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ResetJournalDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  )
}
