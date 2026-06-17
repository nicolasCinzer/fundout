import { Loader2 } from "lucide-react"

export function FullPageSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2
        className="h-6 w-6 animate-spin text-muted-foreground"
        aria-label="Loading"
      />
    </div>
  )
}
