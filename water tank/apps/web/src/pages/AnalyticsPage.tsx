import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Activity, BellRing, Droplets, PieChart, ShieldAlert, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

export const AnalyticsPage = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.analytics()
  });

  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("analytics.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("analytics.description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.totalTanks")}</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalTanks || 0}</div>
            <p className="text-xs text-muted-foreground">{t("analytics.activelyMonitored")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.totalVolume")}</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics?.currentStored || 0)} L</div>
            <p className="text-xs text-muted-foreground">
              {t("analytics.outOfCapacity").replace("{capacity}", formatNumber(analytics?.totalCapacity || 0))}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.averageHealth")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.averageHealth || 0}%</div>
            <p className="text-xs text-muted-foreground">{t("analytics.overallAverage")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.activeAlerts")}</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.alertsCount || 0}</div>
            <p className="text-xs text-muted-foreground">{t("analytics.configuredRules")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {t("analytics.statusBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.tanks?.map((tank) => (
              <div key={tank.id} className="flex items-center">
                <div className="w-[180px] font-medium truncate pr-4">{tank.name}</div>
                <div className="flex-1">
                  <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${tank.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-[120px] text-right text-sm text-muted-foreground">
                  {formatNumber(tank.current)} L ({tank.percentage}%)
                </div>
              </div>
            ))}
            
            {(!analytics?.tanks || analytics.tanks.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t("analytics.noTanks")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
