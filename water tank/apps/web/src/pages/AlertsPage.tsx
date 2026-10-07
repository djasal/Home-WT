import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

type CreateAlertInput = {
  tankId?: string;
  type: string;
  threshold?: number | null;
  channel?: string;
  enabled?: boolean;
  message: string;
};

export const AlertsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAlertInput>>({
    type: "LOW_LEVEL",
    channel: "PUSH",
    enabled: true
  });

  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.alerts
  });

  const { data: tanks, isLoading: isLoadingTanks } = useQuery({
    queryKey: ["tanks"],
    queryFn: api.tanks
  });

  const createMutation = useMutation({
    mutationFn: (newAlert: CreateAlertInput) => api.createAlert(newAlert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setIsDialogOpen(false);
      setFormData({ type: "LOW_LEVEL", channel: "PUSH", enabled: true, threshold: undefined, message: "" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.message) return;
    
    // Convert empty tankId string to undefined for global alerts (if any)
    const payload = { ...formData };
    if (!payload.tankId || payload.tankId === "all") {
      payload.tankId = undefined;
    }
    
    createMutation.mutate(payload as CreateAlertInput);
  };

  const isLoading = isLoadingAlerts || isLoadingTanks;

  if (isLoading) {
    return <Skeleton className="h-[420px]" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("alerts.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{alerts?.length ?? 0} active alerts</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t("alerts.addRule")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("alerts.rules")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("alerts.tank")}</Label>
                <Select 
                  value={formData.tankId || "all"} 
                  onValueChange={(v) => setFormData(p => ({ ...p, tankId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("tanks.selectTank")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("alerts.allTanks")}</SelectItem>
                    {tanks?.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("alerts.condition")}</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("alerts.condition")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW_LEVEL">{t("alerts.lowLevel")}</SelectItem>
                    <SelectItem value="HIGH_LEVEL">{t("alerts.highLevel")}</SelectItem>
                    <SelectItem value="SENSOR_FAILURE">{t("dashboard.sensorFault")}</SelectItem>
                    <SelectItem value="DEVICE_OFFLINE">{t("alerts.deviceOffline")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.type === "LOW_LEVEL" || formData.type === "HIGH_LEVEL") && (
                <div className="space-y-2">
                  <Label htmlFor="threshold">{t("alerts.threshold")}</Label>
                  <Input 
                    id="threshold" 
                    type="number" 
                    value={formData.threshold ?? ""} 
                    onChange={(e) => setFormData(p => ({ ...p, threshold: Number(e.target.value) }))}
                    required 
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">{t("alerts.message")}</Label>
                <Input 
                  id="message" 
                  value={formData.message || ""} 
                  onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                  placeholder={t("alerts.messageHelper")} 
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("alerts.saving") : t("alerts.saveRule")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("alerts.rules")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 px-4 font-medium">{t("alerts.condition")}</th>
                <th className="py-3 px-4 font-medium">{t("alerts.tank")}</th>
                <th className="py-3 px-4 font-medium">{t("alerts.value")}</th>
                <th className="py-3 px-4 font-medium">{t("alerts.message")}</th>
                <th className="py-3 px-4 font-medium">{t("tanks.status")}</th>
                <th className="py-3 px-4 font-medium ltr:text-right rtl:text-left">{t("alerts.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(alerts ?? []).map((alert) => (
                <tr key={alert.id} className="border-b last:border-b-0">
                  <td className="py-4 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      {alert.type.replace("_", " ")}
                    </div>
                  </td>
                  <td className="py-4 px-4">{alert.tank?.name || t("alerts.allTanks")}</td>
                  <td className="py-4 px-4">
                    {alert.threshold ? `${alert.type === "LOW_LEVEL" ? "<=" : ">="} ${alert.threshold}%` : "Event-based"}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground max-w-[200px] truncate">
                    {alert.message}
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={alert.enabled ? "default" : "secondary"}>
                      {alert.enabled ? t("alerts.enabled") : t("alerts.disabled")}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 flex gap-2 ltr:justify-end rtl:justify-start">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(t("alerts.deleteConfirm"))) {
                          deleteMutation.mutate(alert.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {alerts?.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t("alerts.noRules")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
