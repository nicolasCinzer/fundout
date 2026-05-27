import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Tone = "default" | "positive" | "negative"

type KpiCardProps = {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  tone?: Tone
  emphasized?: boolean
}

const toneClasses: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  emphasized = false,
}: KpiCardProps) {
  return (
    <Card className={cn(emphasized && "border-primary/40 shadow-sm")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon ? (
          <span className="text-muted-foreground">{icon}</span>
        ) : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums",
            toneClasses[tone],
            emphasized && "text-3xl",
          )}
        >
          {value}
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
