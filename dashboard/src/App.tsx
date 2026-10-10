import { Droplets, Car, CloudRain, Video, LayoutDashboard, Settings, ExternalLink, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WeatherWidget } from './components/WeatherWidget';
import { WaterTankWidget } from './components/WaterTankWidget';
import { ParkingWidget } from './components/ParkingWidget';
import { ParkingPage } from './components/ParkingPage';
import { CameraWidget } from './components/CameraWidget';
import { DeviceDiagnostics } from './components/DeviceDiagnostics';
import './index.css';
import './components.css';

function App() {
  const [timeStr, setTimeStr] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_open', String(next));
      return next;
    });
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const int = setInterval(updateTime, 10000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="app-wrapper">
      
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'hidden'}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Droplets size={24} />
          </div>
          <div className="brand-text">
            <h1>Smart Home</h1>
            <p>Water & Parking Monitor</p>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={toggleSidebar}
            title="Hide Menu"
            aria-label="Hide Menu"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a href={`http://${window.location.hostname}:5173`} target="_blank" rel="noopener noreferrer" className="nav-item" title="Open in new window">
            <Droplets size={20} /> Water Tank <ExternalLink size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </a>
          <a href="#" className={`nav-item ${currentView === 'parking' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('parking'); }}>
            <Car size={20} /> Parking
          </a>
          <a href="#" className={`nav-item ${currentView === 'camera' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('camera'); }}>
            <Video size={20} /> Camera
          </a>
          <a href="#" className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('settings'); }}>
            <Settings size={20} /> Settings
          </a>
        </nav>

        <div className="sidebar-status">
          <div className="status-indicator">
            <span className="status-dot"></span> System Online
          </div>
          <p>All services running</p>
          {timeStr && <p style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{timeStr}</p>}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Floating Left Edge Menu Toggle Arrow */}
        <button
          className={`edge-sidebar-toggle ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
          onClick={toggleSidebar}
          title={sidebarOpen ? "Hide Menu" : "Show Menu"}
          aria-label={sidebarOpen ? "Hide Menu" : "Show Menu"}
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {/* Dashboard Grid Container or Settings */}
        {currentView === 'dashboard' ? (
          <div className="dashboard-grid">
            
            {/* LEFT COLUMN: Water & Weather */}
            <div className="grid-col-left">
              
              {/* Water Tank */}
              <div className="glass-panel water-panel">
                <WaterTankWidget />
              </div>

              {/* Weather */}
              <div className="glass-panel weather-panel has-bg">
                <WeatherWidget />
              </div>

              {/* Parking */}
              <div className="glass-panel parking-widget-panel">
                <ParkingWidget onOpenPage={() => setCurrentView('parking')} />
              </div>
              
            </div>

            {/* RIGHT COLUMN: Door Camera (Full space) */}
            <div className="grid-col-right">
              
              <div className="glass-panel camera-panel camera-full">
                <div className="widget-header camera-header">
                  <div
                    className="widget-title-group"
                    onClick={() => setCurrentView('camera')}
                    style={{ cursor: 'pointer' }}
                    title="Open Dedicated Camera View"
                  >
                    <div className="widget-icon red-icon"><Video size={22} /></div>
                    <div>
                      <h2 className="widget-title">Door Camera</h2>
                      <p className="widget-subtitle">Live feed - Entrance</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="widget-action-btn"
                      onClick={() => setCurrentView('camera')}
                      title="Open Dedicated Camera View"
                      aria-label="Open Dedicated Camera View"
                    >
                      <ExternalLink size={15} />
                    </button>
                  </div>
                </div>
                <CameraWidget />
              </div>
              
            </div>

          </div>
        ) : currentView === 'parking' ? (
          <ParkingPage onGoHome={() => setCurrentView('dashboard')} />
        ) : currentView === 'camera' ? (
          <div className="settings-page" style={{ padding: '24px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  className="page-home-btn"
                  onClick={() => setCurrentView('dashboard')}
                  title="Return to Main Dashboard"
                >
                  <Home size={18} />
                  <span>Home Dashboard</span>
                </button>
                <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Video className="red-icon" size={24} /> Dedicated Door Camera View
                </h2>
              </div>
            </div>
            <div className="glass-panel" style={{ flex: 1, minHeight: 0, padding: '0' }}>
              <CameraWidget />
            </div>
          </div>
        ) : currentView === 'settings' ? (
          <div className="settings-page" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <button
                className="page-home-btn"
                onClick={() => setCurrentView('dashboard')}
                title="Return to Main Dashboard"
              >
                <Home size={18} />
                <span>Home Dashboard</span>
              </button>
              <h2 style={{ margin: 0, color: 'white' }}>Settings & Diagnostics</h2>
            </div>
            <DeviceDiagnostics />
          </div>
        ) : null}

      </main>
    </div>
  );
}

export default App;
