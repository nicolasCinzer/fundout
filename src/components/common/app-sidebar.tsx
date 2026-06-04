import { Link, useRouterState } from "@tanstack/react-router"
import {
  LayoutDashboard,
  FileText,
  Landmark,
  Wallet,
  TrendingDown,
  ChevronsUpDown,
  LogOut,
  Calculator,
  Plus,
  FlaskConical,
} from "lucide-react"
import { EvaluationFormDialog } from "@/features/evaluations/components/evaluation-form-dialog"
import { BrandMark } from "@/components/common/brand-mark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/features/auth/api/auth-provider"

const navGroups = [
  {
    label: "Tracking",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/evaluations", label: "Evaluations", icon: FileText },
      { to: "/funded-accounts", label: "Funded accounts", icon: Landmark },
      { to: "/payouts", label: "Payouts", icon: Wallet },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/calculator", label: "Evaluation Calculator", icon: Calculator },
      { to: "/bankroll-mc", label: "Bankroll Calculator", icon: TrendingDown },
      { to: "/backtest", label: "Backtest", icon: FlaskConical },
    ],
  },
] as const

function getInitials(email: string | null | undefined): string {
  if (!email) return "?"
  const [local] = email.split("@")
  return local.slice(0, 2).toUpperCase()
}

export function AppSidebar() {
  const { location } = useRouterState()
  const { user, signOut } = useAuth()
  const email = user?.email ?? ""

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <BrandMark size="sm" tagline />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to)
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="mb-2">
            <EvaluationFormDialog
              trigger={
                <SidebarMenuButton
                  tooltip="New evaluation"
                  className="h-10 gap-2.5 px-3.5 bg-linear-to-b from-primary to-primary/85 font-semibold text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/40 transition-all hover:from-primary hover:to-primary hover:text-primary-foreground hover:shadow-primary/50 hover:ring-primary/60 active:scale-[0.98] active:text-primary-foreground [&_svg]:size-4.5 [&_svg]:transition-transform hover:[&_svg]:rotate-90"
                >
                  <Plus />
                  <span>New evaluation</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                  tooltip={email}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {getInitials(email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Signed in</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side="top"
                align="end"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Account</span>
                    <span className="text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
