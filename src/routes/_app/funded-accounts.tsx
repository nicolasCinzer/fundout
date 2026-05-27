import { useMemo } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { Landmark, Search, X } from "lucide-react"
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  compareDates,
  compareNullableDates,
  compareNumbers,
  compareStrings,
} from "@/lib/sorting"
import {
  useFundedAccounts,
  type FundedAccount,
  type FundedAccountStatus,
} from "@/features/funded-accounts/api/funded-accounts-queries"
import { usePayouts } from "@/features/payouts/api/payouts-queries"
import { FundedAccountRowActions } from "@/features/funded-accounts/components/funded-account-row-actions"
import { formatCurrency, formatDate } from "@/lib/format"

const SORT_KEYS = [
  "propfirm",
  "account_size",
  "start_date",
  "closed_at",
  "status",
  "net_payouts",
] as const

const SEARCH_SCHEMA = z.object({
  q: z.string().optional().catch(undefined),
  status: z.enum(["active", "breached"]).optional().catch(undefined),
  sort: z.enum(SORT_KEYS).optional().catch(undefined),
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
})

export const Route = createFileRoute("/_app/funded-accounts")({
  component: FundedAccountsPage,
  validateSearch: (search) => SEARCH_SCHEMA.parse(search),
})

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

const STATUS_META: {
  [K in FundedAccountStatus]?: { variant: BadgeVariant; label: string }
} = {
  active: { variant: "default", label: "Active" },
  breached: { variant: "destructive", label: "Breached" },
}

function getStatusMeta(s: FundedAccountStatus) {
  return STATUS_META[s] ?? { variant: "outline" as BadgeVariant, label: s }
}

function sortFundedAccounts(
  rows: FundedAccount[],
  key: (typeof SORT_KEYS)[number],
  dir: "asc" | "desc",
  netByAccount: Record<string, number>,
): FundedAccount[] {
  const sorted = [...rows]
  switch (key) {
    case "propfirm":
      return sorted.sort((a, b) =>
        compareStrings(
          a.evaluation?.propfirm?.name ?? "",
          b.evaluation?.propfirm?.name ?? "",
          dir,
        ),
      )
    case "account_size":
      return sorted.sort((a, b) =>
        compareNumbers(
          Number(a.evaluation?.account_size ?? 0),
          Number(b.evaluation?.account_size ?? 0),
          dir,
        ),
      )
    case "start_date":
      return sorted.sort((a, b) =>
        compareDates(a.start_date, b.start_date, dir),
      )
    case "closed_at":
      return sorted.sort((a, b) =>
        compareNullableDates(a.closed_at, b.closed_at, dir),
      )
    case "status":
      return sorted.sort((a, b) => compareStrings(a.status, b.status, dir))
    case "net_payouts":
      return sorted.sort((a, b) =>
        compareNumbers(netByAccount[a.id] ?? 0, netByAccount[b.id] ?? 0, dir),
      )
  }
}

function FundedAccountsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const fundedAccounts = useFundedAccounts()
  const payouts = usePayouts()

  const isLoading = fundedAccounts.isLoading || payouts.isLoading
  const all = fundedAccounts.data ?? []
  const total = all.length
  const hasFilters = !!search.q || !!search.status

  const netByAccount = useMemo(
    () =>
      (payouts.data ?? []).reduce<Record<string, number>>((acc, p) => {
        acc[p.funded_account_id] =
          (acc[p.funded_account_id] ?? 0) +
          (Number(p.amount) - Number(p.fee_taken))
        return acc
      }, {}),
    [payouts.data],
  )

  const filtered = useMemo(() => {
    const q = search.q?.toLowerCase().trim() ?? ""
    return all.filter((fa) => {
      if (
        q &&
        !(fa.evaluation?.propfirm?.name ?? "").toLowerCase().includes(q)
      )
        return false
      if (search.status && fa.status !== search.status) return false
      return true
    })
  }, [all, search.q, search.status])

  const rows = useMemo(() => {
    if (!search.sort) return filtered
    return sortFundedAccounts(
      filtered,
      search.sort,
      search.dir ?? "asc",
      netByAccount,
    )
  }, [filtered, search.sort, search.dir, netByAccount])

  const updateSearch = (next: { q?: string; status?: FundedAccountStatus }) => {
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
        title="Funded accounts"
        description="Active and historic funded accounts"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>All funded accounts</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading…"
                : hasFilters
                  ? `${rows.length} of ${total}`
                  : `${total} total`}
            </CardDescription>
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
                    status:
                      v === "all" ? undefined : (v as FundedAccountStatus),
                  })
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="breached">Breached</SelectItem>
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
                  icon={<Landmark className="h-5 w-5" />}
                  title="No funded accounts yet"
                  description="Funded accounts appear here when you mark an evaluation as funded."
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
                        sortKey="start_date"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                      >
                        Started
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
                      <SortableTableHead
                        sortKey="net_payouts"
                        currentSort={search.sort}
                        currentDir={search.dir}
                        onSort={handleSort}
                        align="right"
                      >
                        Net payouts
                      </SortableTableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((fa) => {
                      const meta = getStatusMeta(fa.status)
                      return (
                        <TableRow key={fa.id}>
                          <TableCell className="font-medium">
                            {fa.evaluation?.propfirm?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fa.evaluation
                              ? formatCurrency(fa.evaluation.account_size)
                              : "—"}
                          </TableCell>
                          <TableCell>{formatDate(fa.start_date)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {fa.closed_at ? formatDate(fa.closed_at) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(netByAccount[fa.id] ?? 0)}
                          </TableCell>
                          <TableCell>
                            <FundedAccountRowActions account={fa} />
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
