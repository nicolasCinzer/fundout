import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { SortDir } from "@/lib/sorting"

type SortableTableHeadProps = {
  sortKey: string
  currentSort: string | undefined
  currentDir: SortDir | undefined
  onSort: (key: string) => void
  children: ReactNode
  align?: "left" | "right"
  className?: string
}

export function SortableTableHead({
  sortKey,
  currentSort,
  currentDir,
  onSort,
  children,
  align = "left",
  className,
}: SortableTableHeadProps) {
  const active = currentSort === sortKey
  const Icon = active
    ? currentDir === "desc"
      ? ArrowDown
      : ArrowUp
    : ChevronsUpDown

  return (
    <TableHead className={cn(align === "right" && "text-right", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {children}
        <Icon className={cn("h-3 w-3", !active && "opacity-40")} />
      </button>
    </TableHead>
  )
}
