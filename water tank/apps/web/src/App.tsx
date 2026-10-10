import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { DashboardPage } from "@/pages/DashboardPage";
import { DevicesPage } from "@/pages/DevicesPage";
import { LoginPage } from "@/pages/LoginPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { TanksPage } from "@/pages/TanksPage";
import { AlertsPage } from "@/pages/AlertsPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { UsersPage } from "@/pages/UsersPage";

export const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Skeleton className="h-28 w-full max-w-[420px]" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardPage />} />
        <Route path="tanks" element={<TanksPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<PlaceholderPage page="profile" />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
