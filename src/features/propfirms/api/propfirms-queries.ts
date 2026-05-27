import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/api/auth-provider"
import type { Tables, TablesInsert } from "@/types/database"

export type Propfirm = Tables<"propfirms">

export type NewPropfirmInput = Omit<
  TablesInsert<"propfirms">,
  "id" | "created_by" | "created_at" | "updated_at"
>

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

/** Slug-ify a propfirm name: lowercase, ascii-ish, dashes. */
export function propfirmSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function useCreatePropfirm() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: NewPropfirmInput): Promise<Propfirm> => {
      if (!user) throw new Error("Not authenticated")
      const { data, error } = await supabase
        .from("propfirms")
        .insert({ ...input, created_by: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propfirmsKeys.all })
    },
  })
}
