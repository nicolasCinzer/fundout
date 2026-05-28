import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-card/50 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="bg-primary/10 text-primary rounded-xl h-14 w-14 inline-flex items-center justify-center">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-heading text-sm font-semibold">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
