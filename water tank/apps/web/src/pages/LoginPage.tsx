import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Droplets, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters")
});

const loginSchema = registerSchema.omit({ name: true });

type AuthMode = "login" | "register";
type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
};

export const LoginPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { t } = useTranslation();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: {
      name: "",
      email: "admin@watertank.local",
      password: "Admin123!"
    }
  });

  useEffect(() => {
    form.clearErrors();
  }, [form, mode]);

  const onSubmit = async (values: AuthFormValues) => {
    try {
      if (mode === "login") {
        await login({ email: values.email, password: values.password });
      } else {
        await register({
          name: values.name ?? "",
          email: values.email,
          password: values.password
        });
      }
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.authFailed"));
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">WaterTank</p>
            <h1 className="text-xl font-semibold">Monitor</h1>
          </div>
        </div>

        <Card className="glass-panel">
          <CardHeader>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              {(["login", "register"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-medium transition-colors",
                    mode === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {item === "login" ? t("auth.login") : t("auth.register")}
                </button>
              ))}
            </div>
            <CardTitle className="pt-2">{mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              {mode === "register" ? (
                <div className="space-y-2">
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input id="name" autoComplete="name" {...form.register("name")} />
                  <FieldError message={form.formState.errors.name?.message} />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
                <FieldError message={form.formState.errors.email?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
                <FieldError message={form.formState.errors.password?.message} />
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-destructive">{message}</p> : null;
