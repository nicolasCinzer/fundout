import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type Tone = "default" | "positive" | "negative"
type BadgeTone = "default" | "negative"

type KpiCardProps = {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  badge?: ReactNode
  badgeTone?: BadgeTone
  badgeTooltip?: ReactNode
  tone?: Tone
  emphasized?: boolean
}

const toneClasses: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
}

const badgeToneClasses: Record<BadgeTone, string> = {
  default: "border-primary/20 bg-primary/10 text-primary",
  negative:
    "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  badge,
  badgeTone = "default",
  badgeTooltip,
  tone = "default",
  emphasized = false,
}: KpiCardProps) {
  const badgeNode = badge ? (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
        badgeToneClasses[badgeTone],
      )}
    >
      {badge}
    </span>
  ) : null
  return (
    <Card
      className={cn(
        "gap-2 px-4 py-3.5",
        emphasized && "border-primary/40 shadow-sm",
      )}
    >
      <div className="flex flex-row items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {badgeNode ? (
          badgeTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>{badgeNode}</TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {badgeTooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            badgeNode
          )
        ) : icon ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          "font-heading text-2xl font-semibold leading-none tracking-tight tabular-nums",
          toneClasses[tone],
          emphasized && "text-3xl",
        )}
      >
        {value}
      </div>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  )
}
