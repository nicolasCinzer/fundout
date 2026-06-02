import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

type BrandMarkProps = {
  size?: "sm" | "md" | "lg"
  tagline?: boolean
  className?: string
}

const sizeConfig = {
  sm: {
    square: "size-8",
    icon: "size-4",
    wordmark: "text-sm font-semibold",
  },
  md: {
    square: "size-10",
    icon: "size-5",
    wordmark: "text-base font-semibold",
  },
  lg: {
    square: "size-12",
    icon: "size-6",
    wordmark: "text-xl font-semibold",
  },
}

export function BrandMark({ size = "md", tagline = false, className }: BrandMarkProps) {
  const cfg = sizeConfig[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0",
          cfg.square,
        )}
      >
        <TrendingUp className={cfg.icon} />
      </div>
      <div className="grid flex-1 leading-tight">
        <span className={cn("font-heading", cfg.wordmark)}>Fundout</span>
        {tagline && (
          <span className="truncate text-xs text-muted-foreground">
            Propfirm tracker
          </span>
        )}
      </div>
    </div>
  )
}
