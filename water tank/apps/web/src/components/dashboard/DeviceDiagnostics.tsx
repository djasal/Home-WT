import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Activity, Wifi, Cpu, Thermometer, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

export const DeviceDiagnostics = ({ activeDevice }: { activeDevice: any }) => {
  const { t } = useTranslation();
  const [deviceData, setDeviceData] = useState<any>(activeDevice || null);
  const [measurementData, setMeasurementData] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Determine the API URL depending on the current origin
    const apiUrl = window.location.origin.replace(':5173', ':4000').replace(':3000', ':4000');
    const socket: Socket = io(apiUrl, { transports: ["websocket"] });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("measurement:new", (payload: any) => {
      if (payload?.device && (!activeDevice || payload.device.deviceId === activeDevice.deviceId)) {
        setDeviceData(payload.device);
      }
      if (payload?.measurement) {
        setMeasurementData(payload.measurement);
      }
    });

    return () => { socket.disconnect(); };
  }, [activeDevice]);

  if (!deviceData) {
    return (
      <div className="rounded-lg border bg-card shadow-soft overflow-hidden">
        <div className="border-b bg-muted/20 px-6 py-4">
           <Skeleton className="h-6 w-48 mb-2" />
           <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-soft overflow-hidden max-w-3xl mt-6">
      <div className="border-b bg-muted/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold">Live ESP32 Diagnostics</h2>
            <p className="text-sm text-muted-foreground">
              Real-time hardware telemetry from {deviceData.deviceId}
              {!connected && <span className="text-destructive ml-2">(WebSocket Offline)</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="rounded-md border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</p>
              <p className={`font-semibold ${deviceData.status === 'ONLINE' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                {deviceData.status || 'UNKNOWN'}
              </p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground opacity-50" />
          </div>

          <div className="rounded-md border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">IP Address</p>
              <p className="font-mono font-medium">{deviceData.ipAddress || 'Not Assigned'}</p>
            </div>
            <Info className="h-5 w-5 text-muted-foreground opacity-50" />
          </div>

          <div className="rounded-md border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">WiFi Network</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{deviceData.wifiSsid || 'Unknown'}</p>
                <span className="text-xs px-2 py-1 bg-muted rounded-full">{deviceData.wifiSignal ? `${deviceData.wifiSignal} dBm` : 'N/A'}</span>
              </div>
            </div>
            <Wifi className="h-5 w-5 text-muted-foreground opacity-50" />
          </div>

          <div className="rounded-md border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Internal Temp</p>
              <p className="font-semibold">
                {measurementData?.temperatureC != null ? `${measurementData.temperatureC}°C` : (deviceData.temperatureC != null ? `${deviceData.temperatureC}°C` : '--')}
              </p>
            </div>
            <Thermometer className="h-5 w-5 text-muted-foreground opacity-50" />
          </div>

          <div className="rounded-md border p-4 flex items-center justify-between sm:col-span-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Sensor Hardware</p>
              <p className={`font-semibold ${deviceData.sensorOk ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                {deviceData.sensorOk ? 'OK (Responding)' : 'FAULT (Timeout / Unplugged)'}
              </p>
            </div>
            <Cpu className="h-5 w-5 text-muted-foreground opacity-50" />
          </div>

        </div>
      </div>
    </div>
  );
};
