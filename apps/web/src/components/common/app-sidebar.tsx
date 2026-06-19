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
  Settings,
} from "lucide-react"
import { useTranslation } from "react-i18next"
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

const navGroupItems = [
  {
    labelKey: "nav.groups.tracking" as const,
    items: [
      { to: "/", labelKey: "nav.items.dashboard" as const, icon: LayoutDashboard },
      { to: "/evaluations", labelKey: "nav.items.evaluations" as const, icon: FileText },
      { to: "/funded-accounts", labelKey: "nav.items.fundedAccounts" as const, icon: Landmark },
      { to: "/payouts", labelKey: "nav.items.payouts" as const, icon: Wallet },
    ],
  },
  {
    labelKey: "nav.groups.tools" as const,
    items: [
      { to: "/calculator", labelKey: "nav.items.calculator" as const, icon: Calculator },
      { to: "/bankroll-mc", labelKey: "nav.items.bankrollMc" as const, icon: TrendingDown },
      { to: "/backtest", labelKey: "nav.items.backtest" as const, icon: FlaskConical },
    ],
  },
] as const

function getInitials(email: string | null | undefined): string {
  if (!email) return "?"
  const [local] = email.split("@")
  return local.slice(0, 2).toUpperCase()
}

export function AppSidebar() {
  const { t } = useTranslation("common")
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
        {navGroupItems.map((group) => (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to)
                  const label = t(item.labelKey)
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={label}
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{label}</span>
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
                  tooltip={t("nav.newEvaluation")}
                  className="h-10 gap-2.5 px-3.5 bg-linear-to-b from-primary to-primary/85 font-semibold text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/40 transition-all hover:from-primary hover:to-primary hover:text-primary-foreground hover:shadow-primary/50 hover:ring-primary/60 active:scale-[0.98] active:text-primary-foreground [&_svg]:size-4.5 [&_svg]:transition-transform hover:[&_svg]:rotate-90"
                >
                  <Plus />
                  <span>{t("nav.newEvaluation")}</span>
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
                    <span className="truncate font-medium">
                      {t("nav.signedIn")}
                    </span>
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
                    <span className="text-sm font-medium">{t("nav.account")}</span>
                    <span className="text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
