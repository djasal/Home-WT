import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Wifi, Cpu, Thermometer, Activity } from 'lucide-react';

export function DeviceDiagnostics() {
  const [deviceData, setDeviceData] = useState<any>(null);
  const [measurementData, setMeasurementData] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const apiUrl = `http://${window.location.hostname}:4000`;
    const socket = io(apiUrl, { transports: ['websocket'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('measurement:new', (payload: any) => {
      if (payload?.device) {
        setDeviceData(payload.device);
      }
      if (payload?.measurement) {
        setMeasurementData(payload.measurement);
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '32px', color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', fontSize: '1.5rem', fontWeight: 600 }}>
        <Activity size={28} className="primary-icon" /> ESP32 Device Diagnostics
      </h2>
      
      {!connected && (
        <div style={{ color: 'var(--accent-red)', marginBottom: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
          Disconnected from Backend API.
        </div>
      )}
      
      {!deviceData ? (
        <div style={{ color: 'var(--text-secondary)', padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <Activity className="pulse-icon" style={{ margin: '0 auto 12px auto' }} />
          Waiting for next ESP32 heartbeat... (Updates every 30s)
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Device ID</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{deviceData.deviceId}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: deviceData.status === 'ONLINE' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {deviceData.status}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>WiFi Network</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <Wifi size={20} color="var(--accent-blue)" /> {deviceData.wifiSsid || 'Unknown'} 
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>({deviceData.wifiSignal} dBm)</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>IP Address</div>
            <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
              {deviceData.ipAddress}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Internal Temp</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <Thermometer size={20} color="var(--accent-orange)" /> {measurementData?.temperatureC ? `${measurementData.temperatureC}°C` : '--'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Sensor Hardware</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', color: deviceData.sensorOk ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              <Cpu size={20} /> {deviceData.sensorOk ? 'OK (Responding)' : 'FAULT (Timeout)'}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
