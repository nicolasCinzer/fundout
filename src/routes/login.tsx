import { Navigate, createFileRoute } from "@tanstack/react-router"
import { FullPageSpinner } from "@/components/common/full-page-spinner"
import { LoginForm } from "@/features/auth/components/login-form"
import { useAuth } from "@/features/auth/api/auth-provider"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/" />
  return <LoginForm />
}
