import type { LucideIcon } from "lucide-react";
import { Bell, ChartNoAxesCombined, History, Map, Settings, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const pageMeta: Record<string, { title: string; phase: string; icon: LucideIcon }> = {
  history: { title: "History", phase: "Phase 1 data is available on Dashboard", icon: History },
  alerts: { title: "Alerts", phase: "Phase 2", icon: Bell },
  analytics: { title: "Analytics", phase: "Phase 3", icon: ChartNoAxesCombined },
  maps: { title: "Maps", phase: "Phase 2", icon: Map },
  settings: { title: "Settings", phase: "Phase 1 theme is available in sidebar", icon: Settings },
  profile: { title: "Profile", phase: "Phase 1 account", icon: User }
};

export const PlaceholderPage = ({ page }: { page: keyof typeof pageMeta }) => {
  const meta = pageMeta[page];
  const { user } = useAuth();
  const Icon = meta.icon;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{meta.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.phase}</p>
      </div>
      <Card>
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{page === "profile" ? user?.name : meta.title}</p>
            <p className="mt-1 max-w-[520px] text-sm text-muted-foreground">
              {page === "profile"
                ? `${user?.email} · ${user?.role}`
                : "This section is intentionally scoped outside the current local test phase."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
