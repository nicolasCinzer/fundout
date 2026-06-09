import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Search, Wallet, X } from "lucide-react"
import { AppHeader } from "@/components/common/app-header"
import { EmptyState } from "@/components/common/empty-state"
import { SortableTableHead } from "@/components/common/sortable-table-head"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { compareDates, compareNumbers, compareStrings } from "@/lib/sorting"
import {
  usePayouts,
  type Payout,
} from "@/features/payouts/api/payouts-queries"
import { PayoutRowActions } from "@/features/payouts/components/payout-row-actions"
import { PayoutsStats } from "@/features/payouts/components/payouts-stats"
import { formatCurrency } from "@/lib/format"
import { useFormatters } from "@/lib/i18n/use-formatters"

const SORT_KEYS = ["propfirm", "paid_at", "amount", "fee_taken", "net"] as const

const SEARCH_SCHEMA = z.object({
  q: z.string().optional().catch(undefined),
  sort: z.enum(SORT_KEYS).optional().catch(undefined),
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})

const PAGE_SIZE = 10

export const Route = createFileRoute("/_app/payouts")({
  component: PayoutsPage,
  validateSearch: (search) => SEARCH_SCHEMA.parse(search),
})

function sortPayouts(
  rows: Payout[],
  key: (typeof SORT_KEYS)[number],
  dir: "asc" | "desc",
): Payout[] {
  const sorted = [...rows]
  switch (key) {
    case "propfirm":
      return sorted.sort((a, b) =>
        compareStrings(
          a.funded_account?.evaluation?.propfirm?.name ?? "",
          b.funded_account?.evaluation?.propfirm?.name ?? "",
          dir,
        ),
      )
    case "paid_at":
      return sorted.sort((a, b) => compareDates(a.paid_at, b.paid_at, dir))
    case "amount":
      return sorted.sort((a, b) =>
        compareNumbers(Number(a.amount), Number(b.amount), dir),
      )
    case "fee_taken":
      return sorted.sort((a, b) =>
        compareNumbers(Number(a.fee_taken), Number(b.fee_taken), dir),
      )
    case "net":
      return sorted.sort((a, b) =>
        compareNumbers(
          Number(a.amount) - Number(a.fee_taken),
          Number(b.amount) - Number(b.fee_taken),
          dir,
        ),
      )
  }
}

function PayoutsPage() {
  const { t } = useTranslation("payouts")
  const { t: tc } = useTranslation("common")
  const { date: formatDate } = useFormatters()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isLoading } = usePayouts()

  const all = data ?? []
  const total = all.length
  const hasFilters = !!search.q

  const filtered = useMemo(() => {
    const q = search.q?.toLowerCase().trim() ?? ""
    if (!q) return all
    return all.filter((p) =>
      (p.funded_account?.evaluation?.propfirm?.name ?? "")
        .toLowerCase()
        .includes(q),
    )
  }, [all, search.q])

  const sorted = useMemo(() => {
    if (!search.sort) return filtered
    return sortPayouts(filtered, search.sort, search.dir ?? "asc")
  }, [filtered, search.sort, search.dir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(Math.max(search.page ?? 1, 1), totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const rows = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  const updateQuery = (q: string) =>
    navigate({
      search: (prev) => ({ ...prev, q: q || undefined, page: undefined }),
      replace: true,
    })

  const handleSort = (key: string) => {
    const typedKey = key as (typeof SORT_KEYS)[number]
    navigate({
      search: (prev) => {
        if (prev.sort === typedKey) {
          return { ...prev, dir: prev.dir === "asc" ? "desc" : "asc", page: undefined }
        }
        return { ...prev, sort: typedKey, dir: "asc", page: undefined }
      },
      replace: true,
    })
  }

  const goToPage = (next: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: next === 1 ? undefined : next }),
      replace: true,
    })
  }

  const clearFilters = () => navigate({ search: {}, replace: true })

  return (
    <>
      <AppHeader title={t("title")} description={t("description")} />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {!isLoading && all.length > 0 && <PayoutsStats payouts={all} />}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>{t("list.title")}</CardTitle>
            <CardDescription>
              {isLoading
                ? tc("status.loading")
                : hasFilters
                  ? t("list.countFiltered", { shown: rows.length, total })
                  : t("list.count", { count: total })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("list.searchPlaceholder")}
                  className="pl-9"
                  value={search.q ?? ""}
                  onChange={(e) => updateQuery(e.target.value)}
                />
              </div>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" />
                  {tc("filters.clear")}
                </Button>
              ) : null}
            </div>

            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : rows.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title={t("list.noMatches.title")}
                  description={t("list.noMatches.description")}
                  action={
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      {t("list.clearFilters")}
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<Wallet className="h-5 w-5" />}
                  title={t("emptyState.title")}
                  description={t("emptyState.description")}
                />
              )
            ) : (
              <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        sortKey="propfirm"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                        className="font-heading uppercase text-xs tracking-wide"
                      >
                        {t("columns.propfirm")}
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="paid_at"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                        className="font-heading uppercase text-xs tracking-wide"
                      >
                        {t("columns.paidOn")}
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="amount"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                        align="right"
                        className="font-heading uppercase text-xs tracking-wide"
                      >
                        {t("columns.amount")}
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="fee_taken"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                        align="right"
                        className="font-heading uppercase text-xs tracking-wide"
                      >
                        {t("columns.fee")}
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="net"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                        align="right"
                        className="font-heading uppercase text-xs tracking-wide"
                      >
                        {t("columns.net")}
                      </SortableTableHead>
                      <TableHead className="w-36 font-heading uppercase text-xs tracking-wide" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((p) => {
                      const net = Number(p.amount) - Number(p.fee_taken)
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.funded_account?.evaluation?.propfirm?.name ?? "—"}
                          </TableCell>
                          <TableCell>{formatDate(p.paid_at)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(Number(p.amount))}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {Number(p.fee_taken) > 0
                              ? formatCurrency(Number(p.fee_taken))
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(net)}
                          </TableCell>
                          <TableCell>
                            <PayoutRowActions payout={p} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {sorted.length > PAGE_SIZE && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    {tc("pagination.showing", {
                      from: pageStart + 1,
                      to: Math.min(pageStart + PAGE_SIZE, sorted.length),
                      total: sorted.length,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      {tc("pagination.prev")}
                    </Button>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {tc("pagination.pageOf", { current: currentPage, total: totalPages })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      {tc("pagination.next")}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
