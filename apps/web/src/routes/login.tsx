import { Navigate, createFileRoute } from "@tanstack/react-router"
import { FullPageSpinner } from "@/components/common/full-page-spinner"
import { LoginForm } from "@/features/auth/components/login-form"
import { LanguageToggle } from "@/components/common/language-toggle"
import { useAuth } from "@/features/auth/api/auth-provider"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/" />
  return (
    <div className="relative">
      {/* FR-04: standalone language toggle on login page (top-right, unauthenticated) */}
      <div className="absolute right-4 top-4 z-10">
        <LanguageToggle />
      </div>
      <LoginForm />
    </div>
  )
}
