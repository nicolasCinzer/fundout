import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { i18n } from "@/lib/i18n"

type AuthState = {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Initial session read. Supabase's createClient already parsed the URL hash
    // (detectSessionInUrl is on by default), so any magic-link token is already
    // in localStorage by the time we ask.
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      if (data.session) {
        setSession(data.session)
        setIsLoading(false)
        return
      }

      // Dev-only convenience: seed a session from a password so localhost
      // reloads don't demand a fresh magic link every time. This block is
      // stripped from production builds (import.meta.env.DEV is false there)
      // and stays inert unless .env.local defines the two vars — so it never
      // reaches app.fundout.app. See .env.local.example.
      if (import.meta.env.DEV) {
        const email = import.meta.env.VITE_DEV_AUTOLOGIN_EMAIL
        const password = import.meta.env.VITE_DEV_AUTOLOGIN_PASSWORD
        if (email && password) {
          const { data: dev } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (!cancelled && dev.session) {
            setSession(dev.session)
            setIsLoading(false)
            return
          }
        }
      }

      setSession(null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: !!session,
      isLoading,
      signInWithEmail: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            shouldCreateUser: true,
          },
        })
        return { error }
      },
      signOut: async () => {
        await supabase.auth.signOut()
        // Invalidate profile query so the next login re-fetches fresh data
        queryClient.removeQueries({ queryKey: ["profile"] })
        queryClient.clear()
        // FR-12: keep localStorage locale intact — unauthenticated visits
        // will resolve from fundout.locale via the language detector.
        // i18n keeps the current language (matches localStorage).
        const storedLocale = localStorage.getItem("fundout.locale")
        if (storedLocale && storedLocale !== i18n.language) {
          i18n.changeLanguage(storedLocale as "en" | "es")
        }
      },
    }),
    [session, isLoading, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
