import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, type PropsWithChildren } from "react"
import { I18nextProvider } from "react-i18next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/features/auth/api/auth-provider"
import { I18nLocaleSync } from "@/components/common/i18n-locale-sync"
import { i18n } from "@/lib/i18n"

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* I18nLocaleSync mounts profile sync effects before any routed page renders (NFR-04) */}
            <I18nLocaleSync />
            <TooltipProvider delayDuration={150}>
              {children}
              <Toaster richColors closeButton />
            </TooltipProvider>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  )
}
