import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Edit2, Plus, Shield, ShieldAlert, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { UserModal } from "@/components/users/UserModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { User } from "@/types/api";

export function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: api.users
  });

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create user");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete user");
    }
  });

  const handleCreate = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(t("users.deleteConfirm").replace("{name}", name))) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: any) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("users.title")}</h1>
          <p className="text-muted-foreground">{t("users.description")}</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> {t("users.addUser")}
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {users?.map((user) => (
          <Card key={user.id} className="overflow-hidden relative group">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  {user.role === "ADMIN" ? <ShieldAlert className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id, user.name)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm border-t pt-3 border-border/50">
                  <span className="text-muted-foreground">{t("users.role")}</span>
                  <span className="font-medium flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md text-xs">
                    {user.role === "ADMIN" ? <Shield className="h-3 w-3 text-amber-500" /> : null}
                    {user.role === "ADMIN" ? t("users.admin") : t("users.user")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("dashboard.lastUpdate")}</span>
                  <span className="font-medium text-xs">{formatDateTime(user.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingUser}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
