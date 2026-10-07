import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Car, AlertCircle, RefreshCw, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SpaceStatus {
  status: "FREE" | "OCCUPIED";
  camera: string;
  last_update: number;
}

interface Summary {
  total: number;
  free: number;
  occupied: number;
  percent_free: number;
}

const API_URL = "http://localhost:8001/api/parking";

export const ParkingPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Record<string, SpaceStatus>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedCam, setSelectedCam] = useState<string>("camera_2");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(Date.now());

  const fetchData = async () => {
    try {
      const [statusRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/status`),
        fetch(`${API_URL}/summary`)
      ]);
      
      if (!statusRes.ok || !summaryRes.ok) throw new Error("Failed to fetch data");
      
      const statusData = await statusRes.json();
      const summaryData = await summaryRes.json();
      
      setStatus(statusData);
      setSummary(summaryData);
      setError(null);
      setTimestamp(Date.now());
    } catch (err) {
      console.error(err);
      setError("Could not connect to parking server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const cameras = ["camera_2", "camera_3", "camera_4"];
  const camSpaces = Object.entries(status).filter(([_, s]) => s.camera === `Parking - Cam ${selectedCam.split('_')[1]}`);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("parking.title", "Smart Parking")}</h1>
          <p className="text-muted-foreground">{t("parking.subtitle", "Live AI detection of parking availability")}</p>
        </div>
        <div className="flex items-center gap-2">
          {error && <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> {t("parking.offline", "Offline")}</Badge>}
          {!error && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><div className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" /> {t("parking.live", "Live")}</Badge>}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t("parking.refresh", "Refresh")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parking.totalSpaces", "Total Spaces")}</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-500">{t("parking.available", "Available")}</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-green-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{summary?.free || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">{t("parking.occupied", "Occupied")}</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-red-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summary?.occupied || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parking.availabilityRate", "Availability Rate")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.percent_free || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle>{t("parking.liveCameraFeed", "Live Camera Feed")}</CardTitle>
            <div className="flex gap-2">
              {cameras.map(cam => (
                <Button 
                  key={cam} 
                  variant={selectedCam === cam ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSelectedCam(cam)}
                >
                  Cam {cam.split('_')[1]}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            <div className="relative flex-1 bg-black min-h-[400px] overflow-hidden rounded-b-xl flex items-center justify-center">
              {error ? (
                <div className="text-muted-foreground flex flex-col items-center p-8 text-center">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p>{t("parking.feedUnavailable", "Feed unavailable. Start the Python detector engine.")}</p>
                </div>
              ) : (
                <img 
                  src={`${API_URL}/snapshot/${selectedCam}?t=${timestamp}`} 
                  alt={`Live view from ${selectedCam}`}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("parking.spaceStatus", "Space Status")} (Cam {selectedCam.split('_')[1]})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-2">
              {camSpaces.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                  {t("parking.noSpaces", "No spaces configured for this camera.")}
                </div>
              ) : (
                camSpaces.map(([id, s]) => (
                  <div 
                    key={id} 
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                      s.status === 'FREE' 
                        ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    <span className="font-bold text-lg">{id}</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                      {s.status === 'FREE' ? t("parking.free", "FREE") : t("parking.occupiedState", "OCCUPIED")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
