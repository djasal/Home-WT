import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function WaterTankWidget() {
  const [level, setLevel] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  const [sensorOk, setSensorOk] = useState(true);

  useEffect(() => {
    const apiUrl = `http://${window.location.hostname}:4000`;
    const socket = io(apiUrl, { transports: ['websocket'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('measurement:new', (data: any) => {
      if (data?.device) {
        setSensorOk(data.device.sensorOk ?? true);
      }
      
      if (data?.measurement && data?.tank) {
        const height = data.tank.height;
        const distance = data.measurement.distance;
        let pct = ((height - distance) / height) * 100;
        pct = Math.max(0, Math.min(100, pct));
        setLevel(pct);
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  const displayLevel = level ?? 65; // fallback to 65% for preview if offline

  return (
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
        <div className="tank-sublabel">TANK LEVEL</div>
        <div className="tank-mini-bar">
          <div className="tank-mini-bar-fill" style={{ width: `${displayLevel}%` }}></div>
        </div>
        
        {!sensorOk && (
          <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginTop: '12px', fontWeight: 'bold' }}>
            SENSOR FAULT
          </div>
        )}

        {!connected && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '12px' }}>
            Connecting...
          </div>
        )}
      </div>
      
    </div>
  );
}
