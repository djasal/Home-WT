import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatTime } from "@/lib/utils";
import type { Measurement } from "@/types/api";
import { RangeControl, type RangeKey } from "./RangeControl";

type LevelChartProps = {
  history: Measurement[];
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
};

export const LevelChart = ({ history, range, onRangeChange }: LevelChartProps) => {
  const { t } = useTranslation();
  const data = history.map((measurement) => ({
    time: formatTime(measurement.recordedAt),
    percentage: Number(measurement.percentage.toFixed(1)),
    volume: measurement.volumeLiters,
    recordedAt: measurement.recordedAt
  }));

  const exportCsv = () => {
    const rows = [
      ["recordedAt", "percentage", "distanceCm", "volumeLiters", "wifiRssi"],
      ...history.map((measurement) => [
        measurement.recordedAt,
        measurement.percentage,
        measurement.distanceCm,
        measurement.volumeLiters,
        measurement.wifiRssi ?? ""
      ])
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `watertank-history-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t("dashboard.levelHistory")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{history.length} {t("dashboard.readings")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangeControl value={range} onChange={onRangeChange} />
          <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={history.length === 0}>
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border bg-background/70 text-sm text-muted-foreground">
              {t("dashboard.noReadings")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 18, top: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="levelFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={28} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))"
                  }}
                  formatter={(value, name) => {
                    if (name === "percentage") return [`${formatNumber(Number(value), 1)}%`, t("dashboard.level")];
                    return [`${formatNumber(Number(value))} L`, t("dashboard.volume")];
                  }}
                  labelFormatter={(_, payload) => {
                    const point = payload?.[0]?.payload as { recordedAt?: string } | undefined;
                    return point?.recordedAt ? new Date(point.recordedAt).toLocaleString() : "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#levelFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
