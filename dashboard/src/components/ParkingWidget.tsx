import { useEffect, useState } from 'react';

export function ParkingWidget() {
  const [spots, setSpots] = useState<Record<string, any>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/parking/status');
        if (!res.ok) throw new Error('not ok');
        const data = await res.json();
        setSpots(data);
        setError(false);
      } catch {
        setError(true);
      }
    };

    fetchSpots();
    const interval = setInterval(fetchSpots, 3000);
    return () => clearInterval(interval);
  }, []);

  const spotList = Object.entries(spots);
  const free = spotList.filter(([, d]) => d.status === 'FREE').length;
  const occupied = spotList.length - free;

  if (error) {
    return (
      <div className="widget-content centered" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Parking engine offline...
      </div>
    );
  }

  return (
    <div className="widget-content parking-layout">
      <div className="parking-summary">
        <div className="stat">
          <span className="stat-value" style={{ color: '#22c55e' }}>{free}</span>
          <span className="stat-label">Free</span>
        </div>
        <div className="stat">
          <span className="stat-value">{spotList.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat">
          <span className="stat-value" style={{ color: '#ef4444' }}>{occupied}</span>
          <span className="stat-label">Occupied</span>
        </div>
      </div>

      <div className="parking-grid">
        {spotList.length === 0 && (
          <div className="no-data">No parking zones detected yet...</div>
        )}
        {spotList.map(([name, data]) => {
          const isFree = data.status === 'FREE';
          return (
            <div key={name} className={`parking-spot ${isFree ? 'free' : 'occupied'}`}>
              <span className="spot-icon">{isFree ? '🟢' : '🔴'}</span>
              <span className="spot-name">{name.replace('Parking Space ', '')}</span>
              <span className="spot-badge">{data.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
