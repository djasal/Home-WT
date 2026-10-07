import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Download, History } from "lucide-react";
import { RangeControl, type RangeKey } from "@/components/dashboard/RangeControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const HistoryPage = () => {
  const [range, setRange] = useState<RangeKey>("today");
  const [tankId, setTankId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: tanks } = useQuery({
    queryKey: ["tanks"],
    queryFn: () => api.tanks()
  });

  const { data: historyData, isLoading } = useQuery({
    queryKey: ["history", range, tankId, page],
    queryFn: () => api.history(tankId === "all" ? undefined : tankId, range, page, limit)
  });

  const { t } = useTranslation();

  const handleExport = () => {
    if (!historyData?.items?.length) return;
    const headers = ["Timestamp", "Tank", "Device", "Volume (L)", "Percentage (%)", "Distance (cm)", "Temperature (C)"];
    const rows = historyData.items.map(m => [
      new Date(m.recordedAt).toISOString(),
      m.tank?.name || "Unknown",
      m.device?.deviceId || "Unknown",
      m.volumeLiters,
      m.percentage,
      m.distanceCm,
      m.temperatureC || ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watertank-history-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = historyData ? Math.ceil(historyData.total / limit) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("history.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("history.description")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={tankId} onValueChange={(v) => { setTankId(v); setPage(1); }}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder={t("history.allTanks")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("history.allTanks")}</SelectItem>
              {tanks?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RangeControl value={range} onChange={(r) => { setRange(r); setPage(1); }} />
          <Button variant="outline" onClick={handleExport} disabled={!historyData?.items?.length}>
            <Download className="mr-2 h-4 w-4" />
            {t("history.export")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t("history.dataLog")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="whitespace-nowrap pb-3 font-medium">{t("history.dateTime")}</th>
                  <th className="whitespace-nowrap pb-3 font-medium">{t("history.tank")}</th>
                  <th className="whitespace-nowrap pb-3 font-medium">{t("history.device")}</th>
                  <th className="whitespace-nowrap pb-3 font-medium">{t("history.level")}</th>
                  <th className="whitespace-nowrap pb-3 font-medium">{t("history.volume")}</th>
                  <th className="whitespace-nowrap pb-3 font-medium">{t("history.distance")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-16" /></td>
                    </tr>
                  ))
                ) : historyData?.items?.length ? (
                  historyData.items.map((measurement) => (
                    <tr key={measurement.id} className="transition-colors hover:bg-muted/50">
                      <td className="whitespace-nowrap py-3 text-muted-foreground">
                        {formatDateTime(measurement.recordedAt)}
                      </td>
                      <td className="whitespace-nowrap py-3 font-medium">
                        {measurement.tank?.name || "—"}
                      </td>
                      <td className="whitespace-nowrap py-3">
                        <Badge variant="secondary">{measurement.device?.deviceId || "—"}</Badge>
                      </td>
                      <td className="whitespace-nowrap py-3 font-medium text-primary">
                        {Math.round(measurement.percentage)}%
                      </td>
                      <td className="whitespace-nowrap py-3">
                        {formatNumber(measurement.volumeLiters)} L
                      </td>
                      <td className="whitespace-nowrap py-3 text-muted-foreground">
                        {formatNumber(measurement.distanceCm, 1)} cm
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t("history.noMeasurements")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {t("history.showingPage").replace("{page}", page.toString()).replace("{total}", totalPages.toString())}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t("history.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t("history.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
