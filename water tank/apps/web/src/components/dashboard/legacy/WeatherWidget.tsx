import { useEffect, useState } from 'react';
import { CloudRain, Sun, Cloud, CloudLightning, Snowflake, Settings, X } from 'lucide-react';

const API_KEY = '0b3696d73c7fdfccf4c8473c52e7e76e';

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [city, setCity] = useState(localStorage.getItem('weatherCity') || 'Paris');
  const [unit, setUnit] = useState(localStorage.getItem('weatherUnit') || 'metric');
  const [showSettings, setShowSettings] = useState(false);
  const [tempCity, setTempCity] = useState(city);
  const [tempUnit, setTempUnit] = useState(unit);
  const [fetchError, setFetchError] = useState(false);

  const fetchWeather = async (c: string, u: string) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${c}&units=${u}&appid=${API_KEY}`
      );
      const data = await res.json();
      if (data.cod === 200) {
        setWeather(data);
        setFetchError(false);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    }
  };

  useEffect(() => {
    fetchWeather(city, unit);
    const interval = setInterval(() => fetchWeather(city, unit), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city, unit]);

  const handleSave = () => {
    setCity(tempCity);
    setUnit(tempUnit);
    localStorage.setItem('weatherCity', tempCity);
    localStorage.setItem('weatherUnit', tempUnit);
    setShowSettings(false);
  };

  const unitLabel = unit === 'metric' ? '°C' : '°F';

  const getWeatherIcon = (main: string) => {
    const s = main.toLowerCase();
    if (s === 'clear') return <Sun size={64} className="animate-pulse" style={{ color: '#fbbf24' }} />;
    if (s === 'rain' || s === 'drizzle') return <CloudRain size={64} style={{ color: '#3b82f6' }} />;
    if (s === 'thunderstorm') return <CloudLightning size={64} style={{ color: '#a855f7' }} />;
    if (s === 'snow') return <Snowflake size={64} className="float-anim" style={{ color: '#bae6fd' }} />;
    return <Cloud size={64} className="float-anim" style={{ color: '#94a3b8' }} />;
  };

  return (
    <>
      <button className="settings-btn" onClick={() => { setShowSettings(!showSettings); setTempCity(city); setTempUnit(unit); }} title="Settings">
        {showSettings ? <X size={18} /> : <Settings size={18} />}
      </button>

      {showSettings ? (
        <div className="widget-content settings-panel">
          <div className="settings-group">
            <label>City</label>
            <input
              type="text"
              value={tempCity}
              onChange={(e) => setTempCity(e.target.value)}
              className="settings-input"
              placeholder="e.g. London, Paris, Algiers"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="settings-group">
            <label>Temperature Unit</label>
            <select value={tempUnit} onChange={(e) => setTempUnit(e.target.value)} className="settings-input">
              <option value="metric">°C (Celsius)</option>
              <option value="imperial">°F (Fahrenheit)</option>
            </select>
          </div>
          <button className="settings-save-btn" onClick={handleSave}>Apply Changes</button>
        </div>
      ) : (
        <div className="widget-content weather-layout">
          {!weather ? (
            <div className="centered" style={{ flex: 1, display: 'flex', color: 'var(--text-secondary)' }}>
              {fetchError ? 'Could not load weather — check city name.' : 'Loading weather...'}
            </div>
          ) : (
            <>
              <div className="weather-main">
                {getWeatherIcon(weather.weather[0].main)}
                <div className="temp-display">
                  <span className="temp">{Math.round(weather.main.temp)}{unitLabel}</span>
                  <span className="city">{weather.name}</span>
                </div>
              </div>
              <div className="weather-details">
                <div className="detail-item">
                  <span className="label">Feels like</span>
                  <span className="value">{Math.round(weather.main.feels_like)}{unitLabel}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Humidity</span>
                  <span className="value">{weather.main.humidity}%</span>
                </div>
                <div className="detail-item">
                  <span className="label">Wind</span>
                  <span className="value">{Math.round(weather.wind.speed)} {unit === 'metric' ? 'm/s' : 'mph'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Condition</span>
                  <span className="value" style={{ textTransform: 'capitalize' }}>{weather.weather[0].description}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
