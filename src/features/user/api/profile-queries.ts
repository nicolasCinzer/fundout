import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { i18n } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/api/auth-provider"
import type { Database } from "@/types/database"

export type Locale = "en" | "es"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// ─── Query keys ────────────────────────────────────────────────────────────────

export const profileKeys = {
  all: ["profile"] as const,
  byUser: (userId: string) => ["profile", userId] as const,
}

// ─── useProfile ────────────────────────────────────────────────────────────────

/**
 * Fetches the profile row for the authenticated user.
 * Returns `null` when no row exists yet (cold-start).
 * Uses `.maybeSingle()` so a missing row is null, not an error (S-11 idempotency).
 */
export function useProfile() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: profileKeys.byUser(userId ?? ""),
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId as string)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })
}

// ─── useSetLocale ───────────────────────────────────────────────────────────────

/**
 * Mutation that updates the active locale.
 * - When authenticated: upserts `profiles.locale` + updates i18n + localStorage.
 * - When unauthenticated (login page): updates i18n + localStorage only.
 * Optimistic update keeps the UI instant (FR-03).
 */
export function useSetLocale() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (locale: Locale) => {
      // Always update i18n and localStorage immediately
      await i18n.changeLanguage(locale)
      localStorage.setItem("fundout.locale", locale)

      if (!userId) {
        // Unauthenticated path (FR-04): localStorage + i18n only
        return
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: userId, locale },
          { onConflict: "user_id" },
        )

      if (error) throw error
    },
    onMutate: async (locale) => {
      if (!userId) return
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: profileKeys.byUser(userId) })
      const previous = queryClient.getQueryData<Profile | null>(
        profileKeys.byUser(userId),
      )
      queryClient.setQueryData<Profile | null>(
        profileKeys.byUser(userId),
        (old) => (old ? { ...old, locale } : old),
      )
      return { previous }
    },
    onError: (_err, _locale, context) => {
      if (!userId || !context) return
      queryClient.setQueryData(profileKeys.byUser(userId), context.previous)
    },
  })
}
