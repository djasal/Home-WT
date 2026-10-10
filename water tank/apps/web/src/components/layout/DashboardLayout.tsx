import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  Droplets,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Smartphone,
  Sun,
  User,
  Users,
  Waves
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const getNavItems = (t: any) => [
  { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
  { to: "/tanks", label: t("nav.tanks"), icon: Droplets },
  { to: "/devices", label: t("nav.devices"), icon: Smartphone },
  { to: "/history", label: t("nav.history"), icon: History },
  { to: "/analytics", label: t("nav.analytics"), icon: ChartNoAxesCombined },
  { to: "/alerts", label: t("nav.alerts"), icon: Bell },
  { to: "/settings", label: t("nav.settings"), icon: Settings },
  { to: "/profile", label: t("nav.profile"), icon: User },
  { to: "/users", label: t("nav.users"), icon: Users }
];

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const navItems = getNavItems(t);
  const filteredNavItems = navItems.filter((item) =>
    item.to === "/users" ? user?.role === "ADMIN" : true
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="glass-panel fixed inset-y-0 start-0 z-30 hidden w-[260px] border-e lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Waves className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">WaterTank</p>
            <p className="truncate font-semibold">Monitor</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/12 text-foreground"
                )
              }
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isRtl && "scale-x-[-1]")} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/70 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              {user?.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="icon" onClick={toggleTheme} title={t("settings.theme")}>
              <ThemeIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="secondary" className="flex-1 gap-2" onClick={logout}>
              <LogOut className={cn("h-4 w-4", isRtl && "scale-x-[-1]")} aria-hidden="true" />
              {t("settings.signOut")}
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:col-start-2">
        <header className="glass-panel sticky top-0 z-20 border-b lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WaterTank</p>
                <p className="font-semibold">Monitor</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="icon" onClick={toggleTheme} title={t("settings.theme")}>
                <ThemeIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button type="button" variant="secondary" size="icon" onClick={logout} title={t("settings.signOut")}>
                <LogOut className={cn("h-4 w-4", isRtl && "scale-x-[-1]")} aria-hidden="true" />
              </Button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  )
                }
              >
                <item.icon className={cn("h-4 w-4", isRtl && "scale-x-[-1]")} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
