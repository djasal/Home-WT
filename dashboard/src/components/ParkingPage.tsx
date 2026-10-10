import { useEffect, useState, useRef } from 'react';
import { 
  Car, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert, 
  Map, Edit3, Camera, Save, Trash2, RotateCcw, Eye, Sparkles, Check, Home
} from 'lucide-react';

interface SpaceStatus {
  status: 'FREE' | 'OCCUPIED';
  camera?: string;
  last_update?: number;
}

interface ZonePolygon {
  id: string;
  label?: string;
  polygon: number[][]; // [[x, y], [x, y], [x, y], [x, y]]
}

interface LayoutSpotDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: 'vertical' | 'horizontal';
}

// 2D Real-World Parking Layout Definitions (Matching User Drawing Exactly)
const INITIAL_LAYOUT_SPOTS: LayoutSpotDef[] = [
  // 1. Bottom Row: P1 to P11 (11 Vertical Spots)
  { id: 'P1', x: 108, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P2', x: 158, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P3', x: 208, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P4', x: 258, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P5', x: 308, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P6', x: 358, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P7', x: 408, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P8', x: 458, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P9', x: 508, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P10', x: 558, y: 300, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P11', x: 608, y: 300, width: 44, height: 84, orientation: 'vertical' },

  // 2. Middle-Left Row: P25 to P21 (5 Horizontal Spots)
  { id: 'P25', x: 20, y: 172, width: 84, height: 44, orientation: 'horizontal' },
  { id: 'P24', x: 112, y: 172, width: 84, height: 44, orientation: 'horizontal' },
  { id: 'P23', x: 204, y: 172, width: 84, height: 44, orientation: 'horizontal' },
  { id: 'P22', x: 296, y: 172, width: 84, height: 44, orientation: 'horizontal' },
  { id: 'P21', x: 388, y: 172, width: 84, height: 44, orientation: 'horizontal' },

  // 3. Far-Left Spot: P26 (Horizontal Spot below P25)
  { id: 'P26', x: 20, y: 226, width: 84, height: 44, orientation: 'horizontal' },

  // 4. Middle-Right Row: P12, P13, P14 (3 Horizontal Spots)
  { id: 'P12', x: 660, y: 236, width: 84, height: 44, orientation: 'horizontal' },
  { id: 'P13', x: 752, y: 236, width: 84, height: 44, orientation: 'horizontal' },
  { id: 'P14', x: 844, y: 236, width: 84, height: 44, orientation: 'horizontal' },

  // 5. Top-Right Bay: P20, P19, P17, P16, P15, P14-Top (6 Vertical Spots)
  { id: 'P20', x: 476, y: 64, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P19', x: 528, y: 64, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P17', x: 580, y: 64, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P16', x: 632, y: 64, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P15', x: 684, y: 64, width: 44, height: 84, orientation: 'vertical' },
  { id: 'P18', x: 736, y: 64, width: 44, height: 84, orientation: 'vertical' },
];

interface ParkingPageProps {
  onGoHome?: () => void;
}

export function ParkingPage({ onGoHome }: ParkingPageProps = {}) {
  const [activeTab, setActiveTab] = useState<'map' | 'editor' | 'cameras'>('map');
  const [spots, setSpots] = useState<Record<string, SpaceStatus>>({});
  const [zones, setZones] = useState<Record<string, ZonePolygon[]>>({ camera_2: [], camera_3: [], camera_4: [] });
  const [selectedCam, setSelectedCam] = useState<string>('camera_2');
  const [activeSpotId, setActiveSpotId] = useState<string>('P1');
  const [drawingPoints, setDrawingPoints] = useState<number[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [editorTimestamp, setEditorTimestamp] = useState(Date.now());
  const [hoveredSpot, setHoveredSpot] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'FREE' | 'OCCUPIED'>('ALL');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const API_BASE = `http://${apiHost}:8001/api/parking`;

  // Fetch initial zones once on mount
  const fetchZones = async () => {
    try {
      const res = await fetch(`${API_BASE}/zones`);
      if (res.ok) {
        const zonesData = await res.json();
        setZones(zonesData);
      }
    } catch (e) {
      console.error('Failed to load zones:', e);
    }
  };

  // Fetch status periodically (DOES NOT touch zones so user edits are never wiped!)
  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const statusData = await res.json();
        setSpots(statusData);
        setError(false);
      } else {
        setError(true);
      }
      setTimestamp(Date.now());
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // User-triggered manual refresh
  const handleManualRefresh = () => {
    fetchStatus();
    fetchZones();
    setEditorTimestamp(Date.now());
  };

  useEffect(() => {
    fetchZones();
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Match spot status dynamically
  const getSpotStatus = (spotId: string): SpaceStatus | null => {
    if (spots[spotId]) return spots[spotId];
    // Check uppercase/lowercase
    const lower = spotId.toLowerCase();
    for (const [k, v] of Object.entries(spots)) {
      if (k.toLowerCase() === lower) return v;
    }
    // Check numeric match (e.g. A1 matches P1 if only A1 is in backend)
    const num = spotId.replace(/\D/g, '');
    if (num) {
      for (const [k, v] of Object.entries(spots)) {
        if (k.replace(/\D/g, '') === num) return v;
      }
    }
    return null;
  };

  // Redraw Vector Overlay on Canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear ONLY the overlay vector layer (camera photo stays untouched underneath!)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing zones for current camera
    const currentCamZones = zones[selectedCam] || [];
    currentCamZones.forEach((z) => {
      const pts = z.polygon;
      if (pts.length < 3) return;

      const isCurrentActive = z.id === activeSpotId;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.closePath();

      // Style
      ctx.fillStyle = isCurrentActive ? 'rgba(59, 130, 246, 0.45)' : 'rgba(16, 185, 129, 0.35)';
      ctx.fill();
      ctx.strokeStyle = isCurrentActive ? '#60a5fa' : '#10b981';
      ctx.lineWidth = isCurrentActive ? 3 : 2;
      ctx.stroke();

      // Label
      const centerX = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
      const centerY = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.id, centerX, centerY);
    });

    // Draw currently drawing points
    if (drawingPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(drawingPoints[0][0], drawingPoints[0][1]);
      for (let i = 1; i < drawingPoints.length; i++) {
        ctx.lineTo(drawingPoints[i][0], drawingPoints[i][1]);
      }
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw point markers
      drawingPoints.forEach((p, idx) => {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(p[0], p[1], 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.fillText(`${idx + 1}`, p[0] + 10, p[1] - 10);
      });
    }
  };

  // Sync canvas dimensions with image natural dimensions
  const syncCanvasDimensions = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (canvas && img && img.naturalWidth && img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    redrawCanvas();
  };

  useEffect(() => {
    if (activeTab === 'editor') {
      redrawCanvas();
    }
  }, [activeTab, selectedCam, zones, drawingPoints, activeSpotId]);

  // Canvas click to add points
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    const newPts = [...drawingPoints, [clickX, clickY]];

    if (newPts.length === 4) {
      // 4 points clicked! Create / replace zone
      const spotName = activeSpotId.trim() || `P${(zones[selectedCam] || []).length + 1}`;
      
      const updatedList = (zones[selectedCam] || []).filter((z) => z.id !== spotName);
      updatedList.push({ id: spotName, label: spotName, polygon: newPts });

      const updatedZones = {
        ...zones,
        [selectedCam]: updatedList
      };

      setZones(updatedZones);
      setDrawingPoints([]);

      // Auto-save immediately to backend!
      persistZones(updatedZones);

      // Auto-increment Spot ID if format is P1, P2...
      const match = spotName.match(/^P(\d+)$/i);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        setActiveSpotId(`P${nextNum}`);
      }
    } else {
      setDrawingPoints(newPts);
    }
  };

  // Persist zones immediately to backend API
  const persistZones = async (updatedZones: Record<string, ZonePolygon[]>) => {
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedZones)
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to auto-save zones:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save zones button handler
  const handleSaveZones = () => {
    persistZones(zones);
  };

  const handleDeleteZone = (zoneId: string) => {
    const updated = (zones[selectedCam] || []).filter((z) => z.id !== zoneId);
    const updatedZones = { ...zones, [selectedCam]: updated };
    setZones(updatedZones);
    // Auto-save immediately to backend!
    persistZones(updatedZones);
  };

  // Compute Layout Statistics
  const totalSpotsCount = INITIAL_LAYOUT_SPOTS.length;
  let freeSpotsCount = 0;
  let occupiedSpotsCount = 0;

  INITIAL_LAYOUT_SPOTS.forEach((s) => {
    const st = getSpotStatus(s.id);
    if (st?.status === 'FREE') freeSpotsCount++;
    else if (st?.status === 'OCCUPIED') occupiedSpotsCount++;
  });

  const availableSpotsCount = freeSpotsCount;
  const occupancyPercent = totalSpotsCount > 0 ? Math.round((occupiedSpotsCount / totalSpotsCount) * 100) : 0;

  return (
    <div className="dedicated-parking-page">
      {/* Top Header */}
      <div className="parking-page-header">
        <div className="page-title-row">
          {onGoHome && (
            <button
              className="page-home-btn"
              onClick={onGoHome}
              title="Return to Main Dashboard"
              aria-label="Return to Main Dashboard"
            >
              <Home size={18} />
              <span>Home</span>
            </button>
          )}
          <div className="widget-icon purple-icon">
            <Car size={24} />
          </div>
          <div>
            <h1 className="parking-page-title">Smart Parking Monitor</h1>
            <p className="parking-page-subtitle">Real architectural layout & interactive AI zone designer</p>
          </div>
        </div>

        <div className="parking-header-actions">
          {/* Mode Switcher Tabs */}
          <div className="parking-mode-tabs">
            <button
              className={`mode-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <Map size={16} /> Live Layout Map
            </button>
            <button
              className={`mode-tab-btn ${activeTab === 'cameras' ? 'active' : ''}`}
              onClick={() => setActiveTab('cameras')}
            >
              <Eye size={16} /> AI Cameras
            </button>
            <button
              className={`mode-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('editor');
                setEditorTimestamp(Date.now());
              }}
            >
              <Edit3 size={16} /> Draw Spots
            </button>
          </div>

          <button
            className="icon-btn refresh-btn"
            onClick={handleManualRefresh}
            disabled={isLoading}
            title="Refresh Status & Data"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="parking-kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Bays</span>
            <Car size={18} className="text-muted" />
          </div>
          <div className="kpi-value">{totalSpotsCount}</div>
          <span className="kpi-detail">P1 – P26 architectural slots</span>
        </div>

        <div className="glass-panel kpi-card kpi-free">
          <div className="kpi-header">
            <span className="kpi-label">Available</span>
            <CheckCircle2 size={18} className="text-green" />
          </div>
          <div className="kpi-value text-green">{availableSpotsCount}</div>
          <span className="kpi-detail">Vacant & ready for parking</span>
        </div>

        <div className="glass-panel kpi-card kpi-occupied">
          <div className="kpi-header">
            <span className="kpi-label">Occupied</span>
            <ShieldAlert size={18} className="text-red" />
          </div>
          <div className="kpi-value text-red">{occupiedSpotsCount}</div>
          <span className="kpi-detail">Currently detected vehicles</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Occupancy</span>
            <span className="kpi-rate-badge">{occupancyPercent}%</span>
          </div>
          <div className="kpi-value">{occupancyPercent}%</div>
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill" style={{ width: `${occupancyPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 2D REAL-WORLD PARKING LOT MAP & SPOTS BREAKDOWN                    */}
      {/* ========================================================================= */}
      {activeTab === 'map' && (
        <>
          <div className="glass-panel map-view-panel">
            <div className="panel-sub-header">
              <div className="cam-header-title">
                <Map size={18} />
                <span>Real-World Parking Lot Architectural Map</span>
              </div>
              <div className="map-legend">
                <span className="legend-item"><span className="legend-dot green"></span> Free</span>
                <span className="legend-item"><span className="legend-dot red"></span> Occupied</span>
                <span className="legend-item"><span className="legend-dot gray"></span> No Data</span>
              </div>
            </div>

            <div className="parking-lot-svg-wrapper">
              <svg
                viewBox="0 0 960 410"
                className="parking-lot-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Outer Wall Boundary matching the drawing */}
                <path
                  d="M 12 165 L 468 165 L 468 56 L 790 56 L 790 165 L 940 165 M 940 286 L 652 286 L 652 396 L 98 396 L 98 286 L 12 286 Z"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Driving Lane Direction Guidance */}
                <g opacity="0.35" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
                  <line x1="120" y1="250" x2="620" y2="250" />
                  <line x1="470" y1="200" x2="900" y2="200" />
                </g>

                {/* Render Parking Spots */}
                {INITIAL_LAYOUT_SPOTS.map((s) => {
                  const st = getSpotStatus(s.id);
                  const isFree = st?.status === 'FREE';
                  const isOccupied = st?.status === 'OCCUPIED';
                  const isHovered = hoveredSpot === s.id;

                  let fill = 'rgba(255, 255, 255, 0.08)';
                  let stroke = 'rgba(255, 255, 255, 0.2)';
                  let textColor = '#cbd5e1';

                  if (isFree) {
                    fill = 'rgba(16, 185, 129, 0.28)';
                    stroke = '#10b981';
                    textColor = '#34d399';
                  } else if (isOccupied) {
                    fill = 'rgba(244, 63, 94, 0.28)';
                    stroke = '#f43f5e';
                    textColor = '#fb7185';
                  }

                  return (
                    <g
                      key={s.id}
                      onMouseEnter={() => setHoveredSpot(s.id)}
                      onMouseLeave={() => setHoveredSpot(null)}
                      onClick={() => setHoveredSpot(hoveredSpot === s.id ? null : s.id)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {/* Parking Bay Rectangle */}
                      <rect
                        x={s.x}
                        y={s.y}
                        width={s.width}
                        height={s.height}
                        rx="6"
                        fill={fill}
                        stroke={isHovered ? '#60a5fa' : stroke}
                        strokeWidth={isHovered ? 3 : 2}
                      />

                      {/* Bay Identifier */}
                      <text
                        x={s.x + s.width / 2}
                        y={s.y + s.height / 2 + (s.orientation === 'vertical' ? 14 : 0)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={textColor}
                        fontWeight="bold"
                        fontSize={s.orientation === 'vertical' ? '14' : '15'}
                        fontFamily="Outfit, sans-serif"
                      >
                        {s.id}
                      </text>

                      {/* Status Icon Indicator */}
                      <circle
                        cx={s.x + s.width / 2}
                        cy={s.orientation === 'vertical' ? s.y + 16 : s.y + s.height / 2 - 12}
                        r="4"
                        fill={isFree ? '#10b981' : isOccupied ? '#f43f5e' : 'rgba(255,255,255,0.3)'}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Info */}
              {hoveredSpot && (
                <div className="spot-hover-card">
                  <span className="card-spot-title">Space {hoveredSpot}</span>
                  <span className={`status-pill ${getSpotStatus(hoveredSpot)?.status === 'FREE' ? 'free' : getSpotStatus(hoveredSpot)?.status === 'OCCUPIED' ? 'occupied' : 'unknown'}`}>
                    {getSpotStatus(hoveredSpot)?.status || 'UNKNOWN'}
                  </span>
                  <span className="card-cam-info">Source: {getSpotStatus(hoveredSpot)?.camera || 'Live Detection'}</span>
                </div>
              )}
            </div>
          </div>

          {/* All 26 Parking Spaces Breakdown Grid */}
          <div className="glass-panel spots-breakdown-panel">
            <div className="panel-sub-header">
              <div className="cam-header-title">
                <Car size={18} />
                <span>All 26 Parking Spaces (P1 – P26)</span>
              </div>

              <div className="filter-pill-group">
                <button
                  className={`filter-pill ${filterStatus === 'ALL' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('ALL')}
                >
                  All ({INITIAL_LAYOUT_SPOTS.length})
                </button>
                <button
                  className={`filter-pill ${filterStatus === 'FREE' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('FREE')}
                >
                  Free ({availableSpotsCount})
                </button>
                <button
                  className={`filter-pill ${filterStatus === 'OCCUPIED' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('OCCUPIED')}
                >
                  Occupied ({occupiedSpotsCount})
                </button>
              </div>
            </div>

            <div className="spots-breakdown-grid">
              {INITIAL_LAYOUT_SPOTS
                .filter((s) => {
                  const st = getSpotStatus(s.id);
                  if (filterStatus === 'FREE') return st?.status === 'FREE';
                  if (filterStatus === 'OCCUPIED') return st?.status === 'OCCUPIED';
                  return true;
                })
                .map((s) => {
                  const st = getSpotStatus(s.id);
                  const isFree = st?.status === 'FREE';
                  const isOccupied = st?.status === 'OCCUPIED';
                  return (
                    <div
                      key={s.id}
                      className={`breakdown-spot-card ${isFree ? 'is-free' : isOccupied ? 'is-occupied' : ''} ${hoveredSpot === s.id ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHoveredSpot(s.id)}
                      onMouseLeave={() => setHoveredSpot(null)}
                      onClick={() => setHoveredSpot(hoveredSpot === s.id ? null : s.id)}
                    >
                      <div className="breakdown-card-top">
                        <span className="breakdown-spot-id">{s.id}</span>
                        <span className={`breakdown-status-badge ${isFree ? 'free' : isOccupied ? 'occupied' : 'nodata'}`}>
                          {isFree ? 'FREE' : isOccupied ? 'OCCUPIED' : 'STANDBY'}
                        </span>
                      </div>
                      <div className="breakdown-card-bottom">
                        <span className="breakdown-cam-tag">
                          {st?.camera ? st.camera.replace('Parking - ', '') : 'Cam Sensor'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE ZONE DRAWING TOOL (Draw Spots on Camera Feed)         */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="parking-editor-split">
          {/* Canvas Drawing Surface */}
          <div className="glass-panel editor-canvas-panel">
            <div className="panel-sub-header">
              <div className="cam-header-title">
                <Edit3 size={18} />
                <span>Click 4 Corners to Define Space Boundary</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setEditorTimestamp(Date.now())}
                  className="btn-refresh-frame"
                  title="Capture fresh reference frame from camera"
                >
                  <RefreshCw size={13} /> Refresh Frame
                </button>

                <div className="cam-switcher">
                  {['camera_2', 'camera_3', 'camera_4'].map((cam) => (
                    <button
                      key={cam}
                      className={`cam-tab-btn ${selectedCam === cam ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCam(cam);
                        setDrawingPoints([]);
                        setEditorTimestamp(Date.now());
                      }}
                    >
                      Cam {cam.split('_')[1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="canvas-wrapper">
              <div className="canvas-stage">
                {/* Real DOM image: always visible, never flickers or goes black! */}
                <img
                  ref={imageRef}
                  src={`${API_BASE}/snapshot/${selectedCam}?t=${editorTimestamp}`}
                  alt={`Camera Feed for ${selectedCam}`}
                  className="stage-camera-img"
                  onLoad={syncCanvasDimensions}
                />

                {/* Transparent overlay canvas for drawing polygons */}
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="stage-drawing-canvas"
                  title="Click 4 points to define a parking space"
                />
              </div>

              {drawingPoints.length > 0 && (
                <div className="drawing-help-banner">
                  <span>Plotted {drawingPoints.length} of 4 corners for <strong>{activeSpotId}</strong></span>
                  <button onClick={() => setDrawingPoints([])} className="btn-cancel-pts">
                    <RotateCcw size={12} /> Clear Points
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controls & Defined Zones Sidebar */}
          <div className="glass-panel editor-sidebar-panel">
            <div className="sidebar-section">
              <label className="section-label">Target Spot ID</label>
              <div className="spot-input-row">
                <input
                  type="text"
                  value={activeSpotId}
                  onChange={(e) => setActiveSpotId(e.target.value)}
                  className="spot-name-input"
                  placeholder="e.g. P1, P2"
                />
              </div>

              <label className="section-label" style={{ marginTop: '12px' }}>Quick Select from Layout</label>
              <div className="quick-chip-grid">
                {INITIAL_LAYOUT_SPOTS.map((s) => (
                  <button
                    key={s.id}
                    className={`quick-chip ${activeSpotId === s.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveSpotId(s.id);
                      setDrawingPoints([]);
                    }}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="save-action-area">
              <button
                className="btn-save-zones"
                onClick={handleSaveZones}
                disabled={isSaving}
              >
                {saveSuccess ? (
                  <>
                    <Check size={18} /> Zones Saved & Active!
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save & Apply to AI Engine
                  </>
                )}
              </button>
            </div>

            {/* List of Defined Zones for this Camera */}
            <div className="zones-list-area">
              <div className="list-header">
                <span>Zones on Cam {selectedCam.split('_')[1]} ({(zones[selectedCam] || []).length})</span>
              </div>

              <div className="zones-scroll">
                {(zones[selectedCam] || []).length === 0 ? (
                  <div className="no-zones-msg">No zones drawn yet for this camera.</div>
                ) : (
                  (zones[selectedCam] || []).map((z) => (
                    <div key={z.id} className="zone-row-item">
                      <div className="zone-info">
                        <span className="zone-id-tag">{z.id}</span>
                        <span className="zone-coords">4 points defined</span>
                      </div>
                      <button
                        className="btn-delete-zone"
                        onClick={() => handleDeleteZone(z.id)}
                        title="Delete zone"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE CAMERAS WITH AI BOUNDING BOXES                                */}
      {/* ========================================================================= */}
      {activeTab === 'cameras' && (
        <div className="glass-panel cameras-full-panel">
          <div className="panel-sub-header">
            <div className="cam-header-title">
              <Camera size={18} />
              <span>Live AI Camera Feed (YOLOv8 Detection)</span>
            </div>

            <div className="cam-switcher">
              {['camera_2', 'camera_3', 'camera_4'].map((cam) => (
                <button
                  key={cam}
                  className={`cam-tab-btn ${selectedCam === cam ? 'active' : ''}`}
                  onClick={() => setSelectedCam(cam)}
                >
                  Cam {cam.split('_')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="parking-snapshot-container">
            {error ? (
              <div className="snapshot-fallback">
                <AlertCircle size={32} />
                <p>Camera feed unavailable</p>
                <span>Make sure python detector engine is running on port 8001</span>
              </div>
            ) : (
              <img
                src={`${API_BASE}/snapshot/${selectedCam}?t=${timestamp}`}
                alt={`AI Detection for ${selectedCam}`}
                className="parking-snapshot-img"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
