import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/common/app-sidebar"
import { FullPageSpinner } from "@/components/common/full-page-spinner"
import { useAuth } from "@/features/auth/api/auth-provider"

export const Route = createFileRoute("/_app")({
  component: AppLayout,
})

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner />
  if (!isAuthenticated) return <Navigate to="/login" />

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
