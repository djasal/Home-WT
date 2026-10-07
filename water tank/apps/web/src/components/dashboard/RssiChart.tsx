import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, getRssiStatus } from "@/lib/utils";
import type { Measurement } from "@/types/api";

type RssiChartProps = {
  history: Measurement[];
};

export const RssiChart = ({ history }: RssiChartProps) => {
  const { t } = useTranslation();
  // Filter out measurements without RSSI and format data
  const data = history
    .filter((m) => m.wifiRssi != null)
    .map((measurement) => ({
      time: formatTime(measurement.recordedAt),
      rssi: measurement.wifiRssi,
      recordedAt: measurement.recordedAt
    }));

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t("dashboard.wifiSignalStrength")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{data.length} {t("dashboard.readings")}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border bg-background/70 text-sm text-muted-foreground">
              {t("dashboard.noRssiData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 0, right: 18, top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={28} />
                <YAxis
                  domain={[-100, 0]}
                  tickFormatter={(value) => `${value} dBm`}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))"
                  }}
                  formatter={(value) => {
                    return [`${value} dBm (${getRssiStatus(Number(value))})`, "RSSI"];
                  }}
                  labelFormatter={(_, payload) => {
                    const point = payload?.[0]?.payload as { recordedAt?: string } | undefined;
                    return point?.recordedAt ? new Date(point.recordedAt).toLocaleString() : "";
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rssi"
                  stroke="#8b5cf6" // Violet color for RSSI
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
