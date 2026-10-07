import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User } from "@/types/api";

type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: User;
  isSaving: boolean;
};

export function UserModal({ isOpen, onClose, onSubmit, initialData, isSaving }: UserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? "");
      setEmail(initialData?.email ?? "");
      setPassword("");
      setRole(initialData?.role ?? "USER");
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { name, email, role };
    if (password) data.password = password;
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? t("users.editUser") : t("users.addUser")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("users.name")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t("users.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!initialData} />
            {initialData && <p className="text-xs text-muted-foreground">Email cannot be changed.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t("users.role")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{t("users.user")}</SelectItem>
                <SelectItem value="ADMIN">{t("users.admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{initialData ? t("users.passwordHelper") : t("users.password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!initialData} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("users.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("users.saving") : initialData ? t("users.saveChanges") : t("users.createUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
