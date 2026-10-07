import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Edit2 } from "lucide-react";
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
import { api, type CreateTankInput } from "@/lib/api";
import { formatNumber, statusTone } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Tank } from "@/types/api";

export const TanksPage = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTankId, setEditingTankId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateTankInput & { ownerId?: string }>>({
    shape: "CYLINDER"
  });

  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["tanks"],
    queryFn: api.tanks
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: api.users,
    enabled: user?.role === "ADMIN"
  });

  const createMutation = useMutation({
    mutationFn: (newTank: CreateTankInput) => api.createTank(newTank),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tanks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsDialogOpen(false);
      setFormData({ shape: "CYLINDER" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTankInput & { ownerId?: string }> }) => api.updateTank(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tanks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsDialogOpen(false);
      setEditingTankId(null);
      setFormData({ shape: "CYLINDER" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTank(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tanks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const handleEdit = (tank: Tank) => {
    setEditingTankId(tank.id);
    setFormData({
      name: tank.name,
      location: tank.location,
      capacityLiters: tank.capacityLiters,
      heightCm: tank.heightCm,
      diameterCm: tank.diameterCm || undefined,
      lengthCm: tank.lengthCm || undefined,
      widthCm: tank.widthCm || undefined,
      shape: tank.shape as any,
      ownerId: tank.ownerId
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTankId(null);
    setFormData({ shape: "CYLINDER" });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.capacityLiters || !formData.heightCm) return;
    
    if (editingTankId) {
      updateMutation.mutate({ id: editingTankId, data: formData });
    } else {
      createMutation.mutate(formData as CreateTankInput);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[420px]" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("tanks.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data?.length ?? 0} {t("tanks.configured")}</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" /> {t("tanks.addTank")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTankId ? t("tanks.editTank") : t("tanks.addNewTank")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("tanks.name")}</Label>
                <Input 
                  id="name" 
                  value={formData.name || ""} 
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Roof Tank" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t("tanks.location")}</Label>
                <Input 
                  id="location" 
                  value={formData.location || ""} 
                  onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Main Building" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">{t("tanks.capacity")}</Label>
                  <Input 
                    id="capacity" 
                    type="number" 
                    value={formData.capacityLiters || ""} 
                    onChange={(e) => setFormData(p => ({ ...p, capacityLiters: Number(e.target.value) }))}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">{t("tanks.height")}</Label>
                  <Input 
                    id="height" 
                    type="number" 
                    value={formData.heightCm || ""} 
                    onChange={(e) => setFormData(p => ({ ...p, heightCm: Number(e.target.value) }))}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("tanks.shape")}</Label>
                <Select 
                  value={formData.shape} 
                  onValueChange={(v: "CYLINDER" | "RECTANGLE") => setFormData(p => ({ ...p, shape: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("tanks.selectShape")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CYLINDER">{t("tanks.cylinder")}</SelectItem>
                    <SelectItem value="RECTANGLE">{t("tanks.rectangle")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.shape === "CYLINDER" && (
                <div className="space-y-2">
                  <Label htmlFor="diameter">{t("tanks.diameter")}</Label>
                  <Input 
                    id="diameter" 
                    type="number" 
                    value={formData.diameterCm || ""} 
                    onChange={(e) => setFormData(p => ({ ...p, diameterCm: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder={t("tanks.optionalVolume")}
                  />
                </div>
              )}

              {formData.shape === "RECTANGLE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="length">{t("tanks.length")}</Label>
                    <Input 
                      id="length" 
                      type="number" 
                      value={formData.lengthCm || ""} 
                      onChange={(e) => setFormData(p => ({ ...p, lengthCm: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder={t("tanks.optional")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">{t("tanks.width")}</Label>
                    <Input 
                      id="width" 
                      type="number" 
                      value={formData.widthCm || ""} 
                      onChange={(e) => setFormData(p => ({ ...p, widthCm: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder={t("tanks.optional")}
                    />
                  </div>
                </div>
              )}
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
                {createMutation.isPending || updateMutation.isPending ? t("tanks.saving") : editingTankId ? t("tanks.saveChanges") : t("tanks.createTank")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("tanks.inventory")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 px-4 font-medium">{t("tanks.name")}</th>
                <th className="py-3 px-4 font-medium">{t("tanks.location")}</th>
                <th className="py-3 px-4 font-medium">{t("tanks.capacity")}</th>
                <th className="py-3 px-4 font-medium">{t("tanks.height")}</th>
                <th className="py-3 px-4 font-medium">{t("tanks.current")}</th>
                <th className="py-3 px-4 font-medium">{t("tanks.status")}</th>
                <th className="py-3 px-4 font-medium ltr:text-right rtl:text-left">{t("tanks.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((tank) => (
                <tr key={tank.id} className="border-b last:border-b-0">
                  <td className="py-4 px-4 font-medium">{tank.name}</td>
                  <td className="py-4 px-4">{tank.location}</td>
                  <td className="py-4 px-4">{formatNumber(tank.capacityLiters)} L</td>
                  <td className="py-4 px-4">{formatNumber(tank.heightCm, 1)} cm</td>
                  <td className="py-4 px-4">{formatNumber(tank.currentPercent, 1)}%</td>
                  <td className="py-4 px-4">
                    <Badge tone={statusTone(tank.status)}>{tank.status}</Badge>
                  </td>
                  <td className="py-4 px-4 flex gap-2 ltr:justify-end rtl:justify-start">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(tank)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(t("tanks.deleteConfirm").replace("{name}", tank.name))) {
                          deleteMutation.mutate(tank.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t("tanks.noTanks")}
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
