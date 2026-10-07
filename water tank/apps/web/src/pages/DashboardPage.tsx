import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Activity, ArrowDown, ArrowUp, Gauge, Waves, Cpu, Hash, Code, Target, Thermometer, Database, Globe, Wifi, Signal } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LevelChart } from "@/components/dashboard/LevelChart";
import { RssiChart } from "@/components/dashboard/RssiChart";
import { type RangeKey } from "@/components/dashboard/RangeControl";
import { WaterGauge } from "@/components/dashboard/WaterGauge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { formatNumber, statusTone, getRssiStatus } from "@/lib/utils";
import type { Device } from "@/types/api";

const STORAGE_KEY = "watertank.selectedTankId";

export const DashboardPage = () => {
  const [range, setRange] = useState<RangeKey>("today");
  const [selectedTankId, setSelectedTankId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || "";
  });
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", range, selectedTankId],
    queryFn: () => api.dashboard(range, selectedTankId || undefined)
  });

  // Auto-select first tank if none selected
  useEffect(() => {
    if (data?.tanks?.length && !selectedTankId) {
      const firstId = data.tanks[0].id;
      setSelectedTankId(firstId);
      localStorage.setItem(STORAGE_KEY, firstId);
    }
  }, [data?.tanks, selectedTankId]);

  const handleTankChange = (id: string) => {
    setSelectedTankId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["tanks"] });
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
    };

    socket.connect();
    socket.on("measurement:new", refresh);

    return () => {
      socket.off("measurement:new", refresh);
    };
  }, [queryClient]);

  const activeDevice = useMemo(() => {
    const latestDeviceId = data?.latest?.deviceId;
    return data?.devices?.find((device) => device.id === latestDeviceId) ?? data?.devices?.[0] ?? null;
  }, [data]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data?.activeTank?.location ?? t("dashboard.noTankSelected")}</p>
        </div>
        
        {data?.tanks && data.tanks.length > 0 && (
          <div className="w-full sm:w-64">
            <Select value={selectedTankId} onValueChange={handleTankChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("dashboard.selectTank")} />
              </SelectTrigger>
              <SelectContent>
                {data.tanks.map((tank) => (
                  <SelectItem key={tank.id} value={tank.id}>
                    {tank.name} ({tank.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("dashboard.averageToday")}
          value={`${formatNumber(data?.stats?.averageToday ?? 0, 1)}%`}
          detail={t("dashboard.averageTodayDetail")}
          icon={Gauge}
          tone="teal"
        />
        <MetricCard
          title={t("dashboard.averageWeek")}
          value={`${formatNumber(data?.stats?.averageWeek ?? 0, 1)}%`}
          detail={t("dashboard.averageWeekDetail")}
          icon={Activity}
          tone="blue"
        />
        <MetricCard
          title={t("dashboard.highestLevel")}
          value={`${formatNumber(data?.stats?.highestLevel ?? 0, 1)}%`}
          detail={t("dashboard.highestLevelDetail")}
          icon={ArrowUp}
          tone="amber"
        />
        <MetricCard
          title={t("dashboard.lowestLevel")}
          value={`${formatNumber(data?.stats?.lowestLevel ?? 0, 1)}%`}
          detail={t("dashboard.lowestLevelDetail")}
          icon={ArrowDown}
          tone="rose"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <WaterGauge tank={data?.activeTank} device={activeDevice} />
          <LevelChart history={data?.history ?? []} range={range} onRangeChange={setRange} />
          <RssiChart history={data?.history ?? []} />
        </div>
        <DeviceSummary 
          device={activeDevice} 
          tankCount={data?.tanks.length ?? 0} 
          temperature={data?.latest?.temperatureC}
        />
      </div>
    </div>
  );
};

type WifiNetwork = { ssid: string; rssi: number; encryption: string; };

function ConnectionBadge({ lastSeen }: { lastSeen?: string | null }) {
  const [now, setNow] = useState(Date.now());
  const prevOnlineRef = useRef<boolean | null>(null);
  const { t } = useTranslation();

  // Synthesize a 2-beep alert using Web Audio API
  const playOfflineAlert = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const playBeep = (startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, startTime);
        osc.frequency.setValueAtTime(330, startTime + 0.15);
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      };
      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.5);
    } catch {
      // Audio not available — fail silently
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const t = Date.now();
      const isOnline = lastSeen ? t - new Date(lastSeen).getTime() < 90000 : false;

      // Fire sound only on the online → offline transition
      if (prevOnlineRef.current === true && !isOnline) {
        playOfflineAlert();
      }
      prevOnlineRef.current = isOnline;
      setNow(t);
    }, 5000);
    return () => clearInterval(interval);
  }, [lastSeen]);

  const isOnline = lastSeen
    ? now - new Date(lastSeen).getTime() < 90000
    : false;

  return (
    <Badge
      tone={statusTone(isOnline ? "ONLINE" : "OFFLINE")}
      className={isOnline ? "" : "animate-pulse shadow-sm"}
    >
      {isOnline ? t("dashboard.online") : t("dashboard.offline")}
    </Badge>
  );
}

function SensorBadge({ sensorOk }: { sensorOk?: boolean | null }) {
  const { t } = useTranslation();
  const ok = sensorOk !== false; // default true if unknown
  return (
    <Badge
      tone={ok ? statusTone("ONLINE") : statusTone("CRITICAL")}
      className={ok ? "" : "animate-pulse shadow-sm"}
    >
      {ok ? t("dashboard.sensorOk") : t("dashboard.sensorFault")}
    </Badge>
  );
}

function DeviceSummary({
  device,
  tankCount,
  temperature
}: {
  device?: Device | null;
  tankCount: number;
  temperature?: number | null;
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const deviceRows = [
    { label: t("devices.deviceId"), value: device?.deviceId ?? t("dashboard.noDevice"), icon: Cpu },
    { label: t("devices.macAddress"), value: device?.macAddress ?? t("dashboard.noData"), icon: Hash },
    { label: t("devices.firmware"), value: device?.firmwareVersion ?? t("dashboard.noData"), icon: Code },
    { label: t("devices.sensorType"), value: device?.sensorType ?? t("dashboard.noData"), icon: Target },
    { label: t("dashboard.temperature") ?? "Temperature", value: temperature ? `${temperature.toFixed(1)} °C` : t("dashboard.noData"), icon: Thermometer },
    { label: t("dashboard.linkedTanks") ?? "Linked Tanks", value: `${tankCount}`, icon: Database }
  ];

  const networkRows = [
    { label: t("devices.network") + " IP", value: device?.ipAddress ?? t("dashboard.noData"), icon: Globe },
    { label: t("devices.network") + " (SSID)", value: device?.wifiSsid ?? t("dashboard.unknown"), icon: Wifi },
    { label: t("network.wifiSignal") ?? "WiFi Signal", value: device?.wifiSignal ? `${device.wifiSignal} dBm (${getRssiStatus(device.wifiSignal)})` : t("dashboard.noData"), icon: Signal },
  ];

  return (
    <div className="rounded-xl border bg-gradient-to-b from-card to-card/50 p-6 shadow-sm h-fit">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner">
            <Waves className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-lg tracking-tight">{t("dashboard.deviceHealth")}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <ConnectionBadge lastSeen={device?.lastSeen} />
              <SensorBadge sensorOk={device?.sensorOk} />
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">ESP32</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-[11px] font-bold tracking-widest text-muted-foreground/70 uppercase">{t("dashboard.deviceParams")}</h3>
          <div className="flex flex-col gap-2">
            {deviceRows.map((row) => (
              <div key={row.label} className="group flex items-center justify-between rounded-lg border border-transparent bg-muted/30 px-3 py-2.5 transition-all hover:border-border hover:bg-muted/50 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-background shadow-sm border border-border/50 text-muted-foreground transition-colors group-hover:text-primary">
                    <row.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground/90">{row.label}</span>
                </div>
                <span className="text-sm font-semibold tracking-tight">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="mb-3 text-[11px] font-bold tracking-widest text-muted-foreground/70 uppercase">{t("dashboard.networkParams")}</h3>
          <div className="flex flex-col gap-2">
            {networkRows.map((row) => (
              <div key={row.label} className="group flex items-center justify-between rounded-lg border border-transparent bg-muted/30 px-3 py-2.5 transition-all hover:border-border hover:bg-muted/50 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-background shadow-sm border border-border/50 text-muted-foreground transition-colors group-hover:text-primary">
                    <row.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground/90">{row.label}</span>
                </div>
                <span className="text-sm font-semibold tracking-tight">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[420px]" />
      <Skeleton className="h-[420px]" />
    </div>
  );
}
