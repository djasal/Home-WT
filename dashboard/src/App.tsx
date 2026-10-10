import { Droplets, Car, CloudRain, Video, LayoutDashboard, Settings, Bell, User, Eye, Activity, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WeatherWidget } from './components/WeatherWidget';
import { WaterTankWidget } from './components/WaterTankWidget';
import { ParkingPage } from './components/ParkingPage';
import { CameraWidget } from './components/CameraWidget';
import { DeviceDiagnostics } from './components/DeviceDiagnostics';
import './index.css';
import './components.css';

function App() {
  const [timeStr, setTimeStr] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');

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
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Droplets size={24} />
          </div>
          <div className="brand-text">
            <h1>Smart Home</h1>
            <p>Water & Parking Monitor</p>
          </div>
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
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-spacer"></div>
          <div className="topbar-actions">
            <button className="icon-btn notification-btn">
              <Bell size={18} />
              <span className="badge"></span>
            </button>
            <div className="datetime">{timeStr}</div>
            <button className="icon-btn user-btn">
              <User size={18} />
            </button>
          </div>
        </header>

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
              
            </div>

            {/* RIGHT COLUMN: Door Camera (Full space) */}
            <div className="grid-col-right">
              
              <div className="glass-panel camera-panel camera-full">
                <div className="widget-header camera-header">
                  <div className="widget-title-group">
                    <div className="widget-icon red-icon"><Video size={22} /></div>
                    <div>
                      <h2 className="widget-title">Door Camera</h2>
                      <p className="widget-subtitle">Live feed - Entrance</p>
                    </div>
                  </div>
                  <div className="status-badge normal-badge">
                    <span className="dot animate-pulse"></span> LIVE
                  </div>
                </div>
                <CameraWidget />
              </div>
              
            </div>

          </div>
        ) : currentView === 'parking' ? (
          <ParkingPage />
        ) : currentView === 'camera' ? (
          <div className="settings-page" style={{ padding: '24px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><Video className="red-icon"/> Dedicated Camera View</h2>
            <div className="glass-panel" style={{ flex: 1, minHeight: 0, padding: '0' }}>
              <CameraWidget />
            </div>
          </div>
        ) : currentView === 'settings' ? (
          <div className="settings-page" style={{ padding: '24px' }}>
            <DeviceDiagnostics />
          </div>
        ) : null}

      </main>
    </div>
  );
}

export default App;
