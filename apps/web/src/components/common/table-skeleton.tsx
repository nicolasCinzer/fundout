import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type TableSkeletonProps = {
  columns: number
  rows?: number
  headers?: string[]
}

export function TableSkeleton({
  columns,
  rows = 6,
  headers,
}: TableSkeletonProps) {
  return (
    <Table>
      {headers ? (
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
      ) : null}
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full max-w-[160px]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
