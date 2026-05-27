import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Tables } from "@/types/database"

export type Propfirm = Tables<"propfirms">

export const propfirmsKeys = {
  all: ["propfirms"] as const,
  list: () => [...propfirmsKeys.all, "list"] as const,
}

export function usePropfirms() {
  return useQuery({
    queryKey: propfirmsKeys.list(),
    queryFn: async (): Promise<Propfirm[]> => {
      const { data, error } = await supabase
        .from("propfirms")
        .select("*")
        .order("name", { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
