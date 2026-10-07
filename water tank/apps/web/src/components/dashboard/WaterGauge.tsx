import { Droplets, RadioTower, Ruler, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatNumber, statusTone } from "@/lib/utils";
import type { Device, Tank } from "@/types/api";

type WaterGaugeProps = {
  tank?: Tank | null;
  device?: Device | null;
};

export const WaterGauge = ({ tank, device }: WaterGaugeProps) => {
  const { t } = useTranslation();
  const percentage = Math.round(tank?.currentPercent ?? 0);
  const circumference = `${percentage * 3.6}deg`;
  const status = tank?.status ?? "MEDIUM";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t("dashboard.currentTankLevel")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{tank?.name ?? t("dashboard.noTankConnected")}</p>
        </div>
        <Badge tone={statusTone(status)}>{status}</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="mx-auto flex w-full max-w-[260px] flex-col items-center">
            {tank?.shape === "RECTANGLE" ? (
              <div
                className="relative aspect-square w-full rounded-md border-[12px] border-muted bg-background overflow-hidden p-0 shadow-inner"
                aria-label={`${percentage}% full`}
              >
                <div
                  className="absolute bottom-0 left-0 w-full bg-primary/70 transition-all duration-700"
                  style={{ height: `${percentage}%` }}
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMjBsMTAtMTBMMjAgMjBIMHoiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIvPjwvc3ZnPg==')] opacity-50" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-semibold">{percentage}%</span>
                  <span className="mt-1 text-sm text-muted-foreground">{t("dashboard.full")}</span>
                </div>
              </div>
            ) : (
              <div
                className="relative aspect-square w-full rounded-full p-3"
                style={{
                  background: `conic-gradient(hsl(var(--primary)) ${circumference}, hsl(var(--muted)) 0deg)`
                }}
                aria-label={`${percentage}% full`}
              >
                <div className="relative h-full overflow-hidden rounded-full bg-background">
                  <div
                    className="water-surface absolute bottom-0 left-0 w-full bg-primary/70 transition-all duration-700"
                    style={{ height: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-semibold">{percentage}%</span>
                    <span className="mt-1 text-sm text-muted-foreground">{t("dashboard.full")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid content-center gap-3 sm:grid-cols-2">
            <GaugeFact
              icon={Ruler}
              label={t("dashboard.distance")}
              value={`${formatNumber(tank?.currentDistanceCm ?? 0, 1)} cm`}
            />
            <GaugeFact
              icon={Droplets}
              label={t("dashboard.volume")}
              value={`${formatNumber(tank?.currentVolumeLiters ?? 0)} / ${formatNumber(tank?.capacityLiters ?? 0)} L`}
            />
            <GaugeFact
              icon={Wifi}
              label={t("dashboard.wifiRssi")}
              value={device?.wifiSignal ? `${device.wifiSignal} dBm` : t("dashboard.noData")}
            />
            <GaugeFact
              icon={RadioTower}
              label={t("dashboard.lastUpdateInfo")}
              value={formatDateTime(device?.lastSeen)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const GaugeFact = ({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border bg-background/70 p-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </div>
    <p className="mt-2 text-lg font-semibold">{value}</p>
  </div>
);
