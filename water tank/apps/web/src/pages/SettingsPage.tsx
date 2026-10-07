import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Globe, Moon, RefreshCw, Sun, Wifi, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { DeviceDiagnostics } from "@/components/dashboard/DeviceDiagnostics";

type WifiNetwork = { ssid: string; rssi: number; encryption: string; };

export const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "today"],
    queryFn: () => api.dashboard("today")
  });

  const activeDevice = data?.devices?.[0];

  const [isResetting, setIsResetting] = useState(false);
  const [isChangingWifi, setIsChangingWifi] = useState(false);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [scannedNetworks, setScannedNetworks] = useState<WifiNetwork[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isManualSsid, setIsManualSsid] = useState(false);
  const [scanError, setScanError] = useState(false);

  const scanNetworks = async () => {
    if (!activeDevice?.id) return;
    setIsScanning(true);
    setScanError(false);
    setScannedNetworks([]);
    try {
      const resData = await api.scanWifi(activeDevice.id);
      const networks = resData.networks ?? [];
      setScannedNetworks(networks);
      if (networks.length === 0) {
        setIsManualSsid(true);
      }
    } catch (err) {
      console.error("Failed to scan networks", err);
      setScanError(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetWifi = async () => {
    if (!activeDevice?.ipAddress) return;
    if (!confirm(t("network.resetConfirm").replace("{device}", activeDevice.deviceId))) return;

    try {
      setIsResetting(true);
      const res = await fetch(`http://${activeDevice.ipAddress}/reset-wifi`, {
        method: "POST",
      });
      if (res.ok) {
        alert(t("network.resetSuccess"));
      } else {
        alert(t("network.resetFail"));
      }
    } catch (err) {
      alert(t("network.resetError"));
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangeWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDevice?.id) return;
    if (!ssid) return;

    try {
      setIsChangingWifi(true);
      await api.changeWifi(activeDevice.id, ssid, password);
      alert(t("network.changeSuccess"));
      setSsid("");
      setPassword("");
    } catch (err) {
      alert(err instanceof Error ? err.message : t("network.changeFail"));
    } finally {
      setIsChangingWifi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.description")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card shadow-soft overflow-hidden">
          <div className="border-b bg-muted/20 px-6 py-4">
            <h2 className="font-semibold">{t("settings.language")} / Language</h2>
            <p className="text-sm text-muted-foreground">Choose your application language</p>
          </div>
          <div className="p-6 flex gap-4">
            <Button 
              variant={language === "en" ? "default" : "outline"} 
              onClick={() => changeLanguage("en")} 
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              English
            </Button>
            <Button 
              variant={language === "ar" ? "default" : "outline"} 
              onClick={() => changeLanguage("ar")} 
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              العربية
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-soft overflow-hidden">
          <div className="border-b bg-muted/20 px-6 py-4">
            <h2 className="font-semibold">{t("settings.theme")}</h2>
            <p className="text-sm text-muted-foreground">Select your preferred color scheme</p>
          </div>
          <div className="p-6">
            <Button variant="outline" onClick={toggleTheme} className="gap-2">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-soft overflow-hidden max-w-3xl">
        <div className="border-b bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <SettingsIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">{t("network.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("network.description").replace("{device}", activeDevice?.deviceId ?? t("network.none"))}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!activeDevice?.ipAddress ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {t("network.noDevice")}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={scanNetworks} disabled={isScanning}>
                  <Wifi className="mr-2 h-4 w-4" />
                  {isScanning ? t("network.scanning") : t("network.scan")}
                </Button>
                <Button variant="outline" onClick={handleResetWifi} disabled={isResetting}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
                  {t("network.reset")}
                </Button>
              </div>

              <form onSubmit={handleChangeWifi} className="space-y-4 rounded-lg border bg-muted/10 p-5">
                <h3 className="font-medium text-sm text-foreground mb-4">{t("network.connectNew")}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ssid">{t("network.ssid")}</Label>
                  </div>
                  
                  {isScanning ? (
                    <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                      {t("network.scanningMsg")}
                    </div>
                  ) : scanError ? (
                    <div className="space-y-2">
                      <div className="flex h-10 items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {t("network.reachError")}
                      </div>
                      <Input 
                        id="ssid" 
                        value={ssid} 
                        onChange={(e) => setSsid(e.target.value)} 
                        placeholder={t("network.typeManual")}
                        required
                      />
                    </div>
                  ) : isManualSsid ? (
                    <div className="space-y-2">
                      <Input 
                        id="ssid" 
                        value={ssid} 
                        onChange={(e) => setSsid(e.target.value)} 
                        placeholder={t("network.manualPlaceholder")}
                        required
                      />
                      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={() => { setIsManualSsid(false); setSsid(""); }}>
                        {t("network.backToList")}
                      </Button>
                    </div>
                  ) : scannedNetworks.length > 0 ? (
                    <select
                      id="ssid-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={ssid}
                      onChange={(e) => {
                        if (e.target.value === "manual") {
                          setIsManualSsid(true);
                          setSsid("");
                        } else {
                          setSsid(e.target.value);
                        }
                      }}
                      required
                    >
                      <option value="" disabled>{t("network.selectNetwork")}</option>
                      {scannedNetworks.map((net, i) => (
                        <option key={i} value={net.ssid}>
                          {net.ssid} ({net.rssi} dBm) {net.encryption === "secure" ? "🔒" : ""}
                        </option>
                      ))}
                      <option value="manual">{t("network.otherManual")}</option>
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <Input 
                        id="ssid" 
                        value={ssid} 
                        onChange={(e) => setSsid(e.target.value)} 
                        placeholder={t("network.manualPlaceholder")} 
                        required
                      />
                      <p className="text-xs text-muted-foreground">{t("network.scanPrompt")}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("network.wifiPassword")}</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder={t("network.leaveBlank")}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isChangingWifi || !ssid}>
                    {isChangingWifi ? t("network.applying") : t("network.connect")}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {/* ESP32 LIVE DIAGNOSTICS */}
      <DeviceDiagnostics activeDevice={activeDevice} />

    </div>
  );
};
