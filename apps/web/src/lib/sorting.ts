export type SortDir = "asc" | "desc"

const dirSign = (dir: SortDir) => (dir === "asc" ? 1 : -1)

export function compareStrings(a: string, b: string, dir: SortDir): number {
  return a.localeCompare(b) * dirSign(dir)
}

export function compareNumbers(a: number, b: number, dir: SortDir): number {
  return (a - b) * dirSign(dir)
}

export function compareDates(a: string, b: string, dir: SortDir): number {
  // ISO date strings sort lexicographically the same as chronologically.
  return a.localeCompare(b) * dirSign(dir)
}

/** Null/undefined values are pushed to the bottom regardless of direction. */
export function compareNullableDates(
  a: string | null | undefined,
  b: string | null | undefined,
  dir: SortDir,
): number {
  const aMissing = a == null || a === ""
  const bMissing = b == null || b === ""
  if (aMissing && bMissing) return 0
  if (aMissing) return 1
  if (bMissing) return -1
  return a!.localeCompare(b!) * dirSign(dir)
}
