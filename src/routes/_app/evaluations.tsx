import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { FileText, Search, X } from "lucide-react"
import { AppHeader } from "@/components/common/app-header"
import { EmptyState } from "@/components/common/empty-state"
import { SortableTableHead } from "@/components/common/sortable-table-head"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  compareDates,
  compareNullableDates,
  compareNumbers,
  compareStrings,
} from "@/lib/sorting"
import {
  totalFee,
  resetsTotal,
  useEvaluations,
  type EvaluationStatus,
  type Evaluation,
} from "@/features/evaluations/api/evaluations-queries"
import { EvaluationFormDialog } from "@/features/evaluations/components/evaluation-form-dialog"
import { EvaluationRowActions } from "@/features/evaluations/components/evaluation-row-actions"

const SORT_KEYS = [
  "propfirm",
  "account_size",
  "fee_paid",
  "purchase_date",
  "closed_at",
  "status",
] as const

const ROUTE_STATUSES = ["in_progress", "passed", "failed"] as const
type RouteStatus = (typeof ROUTE_STATUSES)[number]

const SEARCH_SCHEMA = z.object({
  q: z.string().optional().catch(undefined),
  status: z.enum(ROUTE_STATUSES).optional().catch(undefined),
  sort: z.enum(SORT_KEYS).optional().catch(undefined),
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
})

export const Route = createFileRoute("/_app/evaluations")({
  component: EvaluationsPage,
  validateSearch: (search) => SEARCH_SCHEMA.parse(search),
})

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

const STATUS_META: {
  [K in EvaluationStatus]?: { variant: BadgeVariant; label: string }
} = {
  in_progress: { variant: "default", label: "In progress" },
  passed: { variant: "secondary", label: "Passed" },
  failed: { variant: "destructive", label: "Failed" },
}

function getStatusMeta(s: EvaluationStatus) {
  return STATUS_META[s] ?? { variant: "outline" as BadgeVariant, label: s }
}

function sortEvaluations(
  rows: Evaluation[],
  key: (typeof SORT_KEYS)[number],
  dir: "asc" | "desc",
): Evaluation[] {
  const sorted = [...rows]
  switch (key) {
    case "propfirm":
      return sorted.sort((a, b) =>
        compareStrings(a.propfirm?.name ?? "", b.propfirm?.name ?? "", dir),
      )
    case "account_size":
      return sorted.sort((a, b) =>
        compareNumbers(Number(a.account_size), Number(b.account_size), dir),
      )
    case "fee_paid":
      // Sort by total fee (base + resets) so the visible value drives the order.
      return sorted.sort((a, b) =>
        compareNumbers(totalFee(a), totalFee(b), dir),
      )
    case "purchase_date":
      return sorted.sort((a, b) =>
        compareDates(a.purchase_date, b.purchase_date, dir),
      )
    case "closed_at":
      return sorted.sort((a, b) =>
        compareNullableDates(a.closed_at, b.closed_at, dir),
      )
    case "status":
      return sorted.sort((a, b) => compareStrings(a.status, b.status, dir))
  }
}

function EvaluationsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isLoading } = useEvaluations()

  const total = data?.length ?? 0
  const hasFilters = !!search.q || !!search.status

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.q?.toLowerCase().trim() ?? ""
    return data.filter((e) => {
      if (q && !(e.propfirm?.name ?? "").toLowerCase().includes(q)) return false
      if (search.status && e.status !== search.status) return false
      return true
    })
  }, [data, search.q, search.status])

  const rows = useMemo(() => {
    if (!search.sort) return filtered
    return sortEvaluations(filtered, search.sort, search.dir ?? "asc")
  }, [filtered, search.sort, search.dir])

  const updateSearch = (next: { q?: string; status?: RouteStatus }) => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: next.q !== undefined ? next.q || undefined : prev.q,
        status:
          next.status !== undefined ? next.status || undefined : prev.status,
      }),
      replace: true,
    })
  }

  const handleSort = (key: string) => {
    const typedKey = key as (typeof SORT_KEYS)[number]
    navigate({
      search: (prev) => {
        if (prev.sort === typedKey) {
          return { ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }
        }
        return { ...prev, sort: typedKey, dir: "asc" }
      },
      replace: true,
    })
  }

  const clearFilters = () => navigate({ search: {}, replace: true })

  return (
    <>
      <AppHeader
        title="Evaluations"
        description="Every challenge you've purchased"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>All evaluations</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading…"
                : hasFilters
                  ? `${rows.length} of ${total}`
                  : `${total} total`}
            </CardDescription>
            <CardAction>
              <EvaluationFormDialog />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by propfirm…"
                  className="pl-9"
                  value={search.q ?? ""}
                  onChange={(e) => updateSearch({ q: e.target.value })}
                />
              </div>
              <Select
                value={search.status ?? "all"}
                onValueChange={(v) =>
                  updateSearch({
                    status: v === "all" ? undefined : (v as RouteStatus),
                  })
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              ) : null}
            </div>

            {isLoading ? (
              <TableSkeleton columns={7} rows={5} />
            ) : rows.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title="No matches"
                  description="Try a different search term or clear the filters."
                  action={
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<FileText className="h-5 w-5" />}
                  title="No evaluations yet"
                  description="Track your first propfirm challenge to start measuring funding ratio and ROI."
                  action={<EvaluationFormDialog />}
                />
              )
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        sortKey="propfirm"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                      >
                        Propfirm
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="account_size"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                        align="right"
                      >
                        Account size
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="fee_paid"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                        align="right"
                      >
                        Fee
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="purchase_date"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                      >
                        Purchased
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="closed_at"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                      >
                        Closed
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="status"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                      >
                        Status
                      </SortableTableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((e) => {
                      const meta = getStatusMeta(e.status)
                      const resetSum = resetsTotal(e)
                      const resetCount = e.resets?.length ?? 0
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">
                            {e.propfirm?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(e.account_size)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <span>{formatCurrency(e.fee_paid, true)}</span>
                            {resetSum > 0 ? (
                              <>
                                <span className="text-muted-foreground"> + </span>
                                <span
                                  className="text-amber-600 dark:text-amber-400"
                                  title={`${resetCount} reset${resetCount === 1 ? "" : "s"}`}
                                >
                                  {formatCurrency(resetSum, true)}
                                </span>
                              </>
                            ) : null}
                          </TableCell>
                          <TableCell>{formatDate(e.purchase_date)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {e.closed_at ? formatDate(e.closed_at) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <EvaluationRowActions evaluation={e} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
