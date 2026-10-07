import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Droplets, Clock } from 'lucide-react';

export function WaterTankWidget() {
  const [level, setLevel] = useState<number | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<string>('OFFLINE');
  const [sensorOk, setSensorOk] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const apiUrl = `http://${window.location.hostname}:4000`;
    const socket = io(apiUrl, { transports: ['websocket'] });

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('measurement:new', (data: any) => {
      if (data?.device) {
        setSensorOk(data.device.sensorOk ?? true);
        setDeviceStatus(data.device.status ?? 'OFFLINE');
        if (data.device.lastSeen) {
          setLastUpdate(new Date(data.device.lastSeen));
        }
      }
      
      if (data?.tank && data.tank.currentPercent !== undefined) {
        setLevel(data.tank.currentPercent);
      } else if (data?.measurement && data?.tank) {
        let pct = data.measurement.percentage;
        if (pct === undefined || pct === null) {
          const height = data.tank.heightCm || data.tank.height || 100;
          const distance = data.measurement.distanceCm || data.measurement.distance || 0;
          pct = ((height - distance) / height) * 100;
        }
        pct = Math.max(0, Math.min(100, pct));
        if (!isNaN(pct)) {
          setLevel(pct);
        }
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  const displayLevel = level ?? 65; // fallback to 65% for preview if offline

  let healthState = 'Normal';
  let healthClass = 'normal-badge';
  
  if (!socketConnected) {
    healthState = 'Connecting...';
    healthClass = 'sync-badge';
  } else if (deviceStatus === 'OFFLINE') {
    healthState = 'Offline';
    healthClass = 'offline-badge';
  } else if (!sensorOk) {
    healthState = 'Fault';
    healthClass = 'error-badge';
  }

  return (
    <>
      <div className="widget-header">
        <div className="widget-title-group">
          <div className="widget-icon primary-icon"><Droplets size={22} /></div>
          <div>
            <h2 className="widget-title">Water Tank</h2>
            <p className="widget-subtitle">Live level monitoring</p>
          </div>
        </div>
        <div className={`status-badge ${healthClass}`}>
          <span className="dot"></span> {healthState}
        </div>
      </div>

      <div className="widget-content tank-widget-layout">
      
      {/* Tank + Scale Container */}
      <div className="tank-visual-area">
        <div className="tank-cylinder">
          <div className="tank-lid"></div>
          <div className="water-level" style={{ height: `${displayLevel}%` }}>
            <div className="water-surface"></div>
          </div>
        </div>
        
        {/* Vertical Scale */}
        <div className="tank-scale">
          <div className="scale-mark">100%</div>
          <div className="scale-line"></div>
          <div className="scale-mark">0%</div>
        </div>
      </div>

      {/* Stats Area */}
      <div className="tank-stats-area">
        <div className="tank-percentage">
          {level !== null ? `${Math.round(level)}%` : '--'}
        </div>
        {lastUpdate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Clock size={12} /> {lastUpdate.toLocaleTimeString()}
          </div>
        )}
        <div className="tank-sublabel">TANK LEVEL</div>
        <div className="tank-mini-bar">
          <div className="tank-mini-bar-fill" style={{ width: `${displayLevel}%` }}></div>
        </div>
        
        {!sensorOk && (
          <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginTop: '12px', fontWeight: 'bold' }}>
            SENSOR FAULT
          </div>
        )}

        {!socketConnected && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '12px' }}>
            Connecting...
          </div>
        )}
      </div>
      
    </div>
    </>
  );
}
