import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link2, Plus, Trash2, Unlink, Edit2 } from "lucide-react";
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
import { api, type CreateDeviceInput } from "@/lib/api";
import { formatDateTime, statusTone } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";

export const DevicesPage = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateDeviceInput & { ownerId?: string }>>({
    sensorType: "JSN-SR04T",
    firmwareVersion: "1.0.0"
  });

  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: devices, isLoading: isDevicesLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: api.devices
  });

  const { data: tanks, isLoading: isTanksLoading } = useQuery({
    queryKey: ["tanks"],
    queryFn: api.tanks
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: api.users,
    enabled: user?.role === "ADMIN"
  });

  const createMutation = useMutation({
    mutationFn: (newDevice: CreateDeviceInput) => api.createDevice(newDevice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsDialogOpen(false);
      setFormData({ sensorType: "JSN-SR04T", firmwareVersion: "1.0.0" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDeviceInput & { ownerId?: string }> }) => api.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsDialogOpen(false);
      setEditingDeviceId(null);
      setFormData({ sensorType: "JSN-SR04T", firmwareVersion: "1.0.0" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const handleEdit = (device: any) => {
    setEditingDeviceId(device.id);
    setFormData({
      deviceId: device.deviceId,
      macAddress: device.macAddress,
      firmwareVersion: device.firmwareVersion,
      sensorType: device.sensorType,
      tankId: device.tank?.id,
      ownerId: device.ownerId
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingDeviceId(null);
    setFormData({ sensorType: "JSN-SR04T", firmwareVersion: "1.0.0" });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deviceId || !formData.macAddress || !formData.firmwareVersion) return;
    
    if (editingDeviceId) {
      updateMutation.mutate({ id: editingDeviceId, data: formData });
    } else {
      createMutation.mutate(formData as CreateDeviceInput);
    }
  };

  if (isDevicesLoading || isTanksLoading) {
    return <Skeleton className="h-[420px]" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("devices.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{devices?.length ?? 0} {t("devices.registered")}</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" /> {t("devices.registerDevice")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingDeviceId ? t("devices.editDevice") : t("devices.registerNewDevice")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">{t("devices.deviceId")}</Label>
                <Input 
                  id="deviceId" 
                  value={formData.deviceId || ""} 
                  onChange={(e) => setFormData(p => ({ ...p, deviceId: e.target.value }))}
                  placeholder="e.g. ESP002" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="macAddress">{t("devices.macAddress")}</Label>
                <Input 
                  id="macAddress" 
                  value={formData.macAddress || ""} 
                  onChange={(e) => setFormData(p => ({ ...p, macAddress: e.target.value }))}
                  placeholder="e.g. 24:6F:28:XX:YY:ZZ" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>{t("devices.assignTank")}</Label>
                <Select 
                  value={formData.tankId || "none"} 
                  onValueChange={(v) => setFormData(p => ({ ...p, tankId: v === "none" ? undefined : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("devices.selectTank")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("devices.unassigned")}</SelectItem>
                    {tanks?.map(tank => (
                      <SelectItem key={tank.id} value={tank.id}>{tank.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {user?.role === "ADMIN" && (
                <div className="space-y-2 border-t pt-4 mt-2">
                  <Label>{t("tanks.assignToUser")}</Label>
                  <Select 
                    value={formData.ownerId || user.id} 
                    onValueChange={(v) => setFormData(p => ({ ...p, ownerId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("tanks.selectUser")} />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? t("tanks.saving") : editingDeviceId ? t("tanks.saveChanges") : t("devices.register")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("devices.fleet")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 px-4 font-medium">{t("devices.deviceId")}</th>
                <th className="py-3 px-4 font-medium">{t("tanks.title")}</th>
                <th className="py-3 px-4 font-medium">{t("devices.firmware")}</th>
                <th className="py-3 px-4 font-medium">WiFi</th>
                <th className="py-3 px-4 font-medium">IP</th>
                <th className="py-3 px-4 font-medium">{t("devices.lastSeen")}</th>
                <th className="py-3 px-4 font-medium">{t("tanks.status")}</th>
                <th className="py-3 px-4 font-medium ltr:text-right rtl:text-left">{t("tanks.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(devices ?? []).map((device) => (
                <tr key={device.id} className="border-b last:border-b-0">
                  <td className="py-4 px-4">
                    <p className="font-medium">{device.deviceId}</p>
                    <p className="text-xs text-muted-foreground">{device.macAddress}</p>
                  </td>
                  <td className="py-4 px-4">
                    {device.tank ? (
                      <span className="flex items-center text-primary">
                        <Link2 className="mr-1 h-3 w-3" />
                        {device.tank.name}
                      </span>
                    ) : (
                      <span className="flex items-center text-muted-foreground">
                        <Unlink className="mr-1 h-3 w-3" />
                        {t("devices.unassigned")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">{device.firmwareVersion}</td>
                  <td className="py-4 px-4">{device.wifiSignal ? `${device.wifiSignal} dBm` : t("dashboard.noData")}</td>
                  <td className="py-4 px-4">{device.ipAddress ?? t("dashboard.noData")}</td>
                  <td className="py-4 px-4">{formatDateTime(device.lastSeen)}</td>
                  <td className="py-4 px-4">
                    <Badge tone={statusTone(device.status)}>{device.status}</Badge>
                  </td>
                  <td className="py-4 px-4 flex gap-2 ltr:justify-end rtl:justify-start">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(device)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(t("devices.deleteConfirm").replace("{id}", device.deviceId))) {
                          deleteMutation.mutate(device.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {devices?.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    {t("devices.noDevices")}
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
