import { useEffect, useState } from 'react';
import { Car, ExternalLink } from 'lucide-react';

interface ParkingWidgetProps {
  onOpenPage?: () => void;
}

export function ParkingWidget({ onOpenPage }: ParkingWidgetProps = {}) {
  const [spots, setSpots] = useState<Record<string, any>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${apiHost}:8001/api/parking/status`);
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
  const total = spotList.length || 26;
  const free = spotList.filter(([, d]) => d.status === 'FREE').length;
  const occupied = spotList.length > 0 ? (total - free) : 0;

  return (
    <>
      <div className="widget-header">
        <div 
          className="widget-title-group"
          style={{ cursor: onOpenPage ? 'pointer' : 'default' }}
          onClick={onOpenPage}
          title="Open Parking Monitor Page"
        >
          <div className="widget-icon purple-icon"><Car size={18} /></div>
          <div>
            <h2 className="widget-title">Smart Parking</h2>
            <p className="widget-subtitle">Live lot availability</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <span className="dot" style={{ background: '#10b981' }}></span> {free} Free
          </div>
          {onOpenPage && (
            <button
              className="widget-action-btn"
              onClick={onOpenPage}
              title="Open Parking Monitor Page"
              aria-label="Open Parking Page"
            >
              <ExternalLink size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="widget-content parking-widget-compact">
        {error ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>
            Detector engine connecting...
          </div>
        ) : (
          <>
            <div className="parking-quick-stats">
              <div className="quick-stat-box free-box">
                <span className="stat-num text-green">{free}</span>
                <span className="stat-desc">Free Slots</span>
              </div>
              <div className="quick-stat-box occupied-box">
                <span className="stat-num text-red">{occupied}</span>
                <span className="stat-desc">Occupied</span>
              </div>
              <div className="quick-stat-box total-box">
                <span className="stat-num">{total}</span>
                <span className="stat-desc">Total Bays</span>
              </div>
            </div>

            {onOpenPage && (
              <button 
                className="parking-view-map-btn"
                onClick={onOpenPage}
                title="View full architectural map and camera zones"
              >
                <Car size={15} /> Open Real 2D Parking Map
                <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
