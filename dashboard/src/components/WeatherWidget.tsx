import { useEffect, useState, useRef } from 'react';
import { 
  CloudRain, Sun, Cloud, CloudLightning, Snowflake, Settings, X, 
  ExternalLink, Volume2, VolumeX, Moon, Clock
} from 'lucide-react';

const API_KEY = '0b3696d73c7fdfccf4c8473c52e7e76e';

const PRAYER_ARABIC: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء'
};

const CALCULATION_METHODS = [
  { id: '19', name: 'Algeria (Ministry of Religious Affairs & Wakfs)' },
  { id: '3', name: 'Muslim World League (MWL)' },
  { id: '4', name: 'Umm Al-Qura University, Makkah' },
  { id: '5', name: 'Egyptian General Authority of Survey' },
  { id: '2', name: 'Islamic Society of North America (ISNA)' },
  { id: '18', name: 'Tunisia' },
  { id: '21', name: 'Morocco' },
  { id: '13', name: 'Diyanet İşleri Başkanlığı, Turkey' }
];

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [adhan, setAdhan] = useState<any>(null);
  const [hijriDate, setHijriDate] = useState<any>(null);

  // Locations: allow custom Weather label while ensuring Prayer Times resolve to Algiers
  const [city, setCity] = useState(() => localStorage.getItem('weatherCity') || 'Mohammadia, Algiers');
  const [prayerCity, setPrayerCity] = useState(() => localStorage.getItem('prayerCity') || 'Algiers');
  const [country, setCountry] = useState(() => localStorage.getItem('weatherCountry') || 'Algeria');
  const [method, setMethod] = useState(() => localStorage.getItem('weatherMethod') || '19');
  const [unit, setUnit] = useState(() => localStorage.getItem('weatherUnit') || 'metric');
  
  const [showSettings, setShowSettings] = useState(false);
  const [tempCity, setTempCity] = useState(city);
  const [tempPrayerCity, setTempPrayerCity] = useState(prayerCity);
  const [tempCountry, setTempCountry] = useState(country);
  const [tempMethod, setTempMethod] = useState(method);
  const [tempUnit, setTempUnit] = useState(unit);
  const [fetchError, setFetchError] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://cdn.aladhan.com/audio/adhans/a9.mp3');
    const audio = audioRef.current;

    const handleEnded = () => setIsPlayingAudio(false);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const toggleAdhanAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
        setIsPlayingAudio(false);
      });
    }
  };

  // Helper to ensure Algiers communes (e.g. Mohammadia, Bab Ezzouar, Kouba) query Algiers timetable
  // and prevent resolving to Mohammadia in Mascara Province (which is 12 mins off)
  const resolveEffectivePrayerCity = (pCity: string, wCity: string) => {
    const target = (pCity || wCity || 'Algiers').trim().toLowerCase();
    if (
      target.includes('mohammadia') || 
      target.includes('alger') ||
      target.includes('kouba') ||
      target.includes('bab ezzouar') ||
      target.includes('hydra') ||
      target.includes('dar el beida') ||
      target.includes('cheraga')
    ) {
      return 'Algiers';
    }
    return pCity || wCity || 'Algiers';
  };

  const fetchWeatherAndAdhan = async (c: string, pCity: string, cntry: string, m: string, u: string) => {
    try {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      const dateStr = `${d}-${mo}-${y}`;

      const effectivePrayerCity = resolveEffectivePrayerCity(pCity, c);

      // For weather in Mohammadia, Algiers: use exact coordinates (36.726, 3.136)
      // to avoid OpenWeatherMap resolving to Mohammadia in Mascara
      const isMohammadiaAlgiers = c.toLowerCase().includes('mohammadia');
      const weatherUrl = isMohammadiaAlgiers
        ? `https://api.openweathermap.org/data/2.5/weather?lat=36.726&lon=3.136&units=${u}&appid=${API_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(c)}&units=${u}&appid=${API_KEY}`;

      const adhanUrl = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(effectivePrayerCity)}&country=${encodeURIComponent(cntry)}&method=${m}`;

      const [weatherRes, adhanRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(adhanUrl)
      ]);

      const weatherData = await weatherRes.json();
      const adhanData = await adhanRes.json();

      if (weatherData.cod === 200) {
        setWeather(weatherData);
        setFetchError(false);
      } else {
        setFetchError(true);
      }

      if (adhanData.code === 200 && adhanData.data) {
        setAdhan(adhanData.data.timings);
        if (adhanData.data.date?.hijri) {
          setHijriDate(adhanData.data.date.hijri);
        }
      }
    } catch (e) {
      console.error('Error fetching weather and prayer times:', e);
      setFetchError(true);
    }
  };

  useEffect(() => {
    fetchWeatherAndAdhan(city, prayerCity, country, method, unit);
    const interval = setInterval(() => fetchWeatherAndAdhan(city, prayerCity, country, method, unit), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city, prayerCity, country, method, unit]);

  const handleSave = () => {
    setCity(tempCity);
    setPrayerCity(tempPrayerCity);
    setCountry(tempCountry);
    setMethod(tempMethod);
    setUnit(tempUnit);

    localStorage.setItem('weatherCity', tempCity);
    localStorage.setItem('prayerCity', tempPrayerCity);
    localStorage.setItem('weatherCountry', tempCountry);
    localStorage.setItem('weatherMethod', tempMethod);
    localStorage.setItem('weatherUnit', tempUnit);
    setShowSettings(false);
  };

  const getNextPrayer = () => {
    if (!adhan) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const prayerKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const p of prayerKeys) {
      const timeVal = adhan[p];
      if (!timeVal) continue;
      const [h, m] = timeVal.split(':').map(Number);
      const pMinutes = h * 60 + m;
      if (pMinutes > currentMinutes) {
        const diff = pMinutes - currentMinutes;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return {
          name: p,
          time: timeVal,
          countdown: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
        };
      }
    }

    return {
      name: 'Fajr',
      time: adhan.Fajr,
      countdown: 'Tomorrow'
    };
  };

  const nextPrayer = getNextPrayer();
  const unitLabel = unit === 'metric' ? '°C' : '°F';
  const effectivePrayerCity = resolveEffectivePrayerCity(prayerCity, city);
  const aladhanPlayUrl = `https://aladhan.com/play/${encodeURIComponent(effectivePrayerCity)}/${encodeURIComponent(country)}`;

  const getWeatherIcon = (main: string) => {
    const s = main.toLowerCase();
    if (s === 'clear') return <Sun size={38} className="animate-pulse" style={{ color: '#fbbf24' }} />;
    if (s === 'rain' || s === 'drizzle') return <CloudRain size={38} style={{ color: '#3b82f6' }} />;
    if (s === 'thunderstorm') return <CloudLightning size={38} style={{ color: '#a855f7' }} />;
    if (s === 'snow') return <Snowflake size={38} className="float-anim" style={{ color: '#bae6fd' }} />;
    return <Cloud size={38} className="float-anim" style={{ color: '#94a3b8' }} />;
  };

  return (
    <>
      <div className="widget-header weather-header" style={{ position: 'relative' }}>
        <div className="widget-title-group">
          <div className="widget-icon white-icon"><CloudRain size={18} /></div>
          <div>
            <h2 className="widget-title">Weather & Prayer</h2>
            <p className="widget-subtitle">
              {city.toLowerCase().includes('mohammadia') ? 'Mohammadia, Algiers' : (weather ? `${weather.name}, ${weather.sys.country}` : `${city}, ${country}`)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {nextPrayer && (
            <div className="status-badge sync-badge" title={`Next prayer is ${nextPrayer.name} at ${nextPrayer.time}`}>
              <Clock size={12} /> {nextPrayer.name} {nextPrayer.time}
            </div>
          )}
          <button 
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              border: 'none', 
              color: 'white', 
              padding: '6px', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              display: 'flex',
              transition: 'all 0.2s'
            }} 
            onClick={() => { 
              setShowSettings(!showSettings); 
              setTempCity(city); 
              setTempPrayerCity(prayerCity);
              setTempCountry(country);
              setTempMethod(method);
              setTempUnit(unit); 
            }} 
            title="Configure Location & Calculation Method"
          >
            {showSettings ? <X size={16} /> : <Settings size={16} />}
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="widget-content settings-panel">
          <div className="settings-group">
            <label>Weather City / Area</label>
            <input
              type="text"
              value={tempCity}
              onChange={(e) => setTempCity(e.target.value)}
              className="settings-input"
              placeholder="e.g. Mohammadia, Algiers"
            />
          </div>
          <div className="settings-group">
            <label>Prayer Times Reference City</label>
            <input
              type="text"
              value={tempPrayerCity}
              onChange={(e) => setTempPrayerCity(e.target.value)}
              className="settings-input"
              placeholder="Algiers (Official Algerian Awqaf reference)"
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Algiers provides official times for Mohammadia & Greater Algiers.
            </span>
          </div>
          <div className="settings-group">
            <label>Country</label>
            <input
              type="text"
              value={tempCountry}
              onChange={(e) => setTempCountry(e.target.value)}
              className="settings-input"
              placeholder="e.g. Algeria"
            />
          </div>
          <div className="settings-group">
            <label>Adhan Calculation Method</label>
            <select 
              value={tempMethod} 
              onChange={(e) => setTempMethod(e.target.value)} 
              className="settings-input"
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="settings-group">
            <label>Temperature Unit</label>
            <select 
              value={tempUnit} 
              onChange={(e) => setTempUnit(e.target.value)} 
              className="settings-input"
            >
              <option value="metric">°C (Celsius)</option>
              <option value="imperial">°F (Fahrenheit)</option>
            </select>
          </div>
          <button className="settings-save-btn" onClick={handleSave}>
            Apply Changes
          </button>
        </div>
      ) : (
        <div className="widget-content weather-layout">
          {!weather ? (
            <div className="centered" style={{ flex: 1, display: 'flex', color: 'var(--text-secondary)' }}>
              {fetchError ? 'Could not load weather — please check city in settings.' : 'Loading weather & prayer times...'}
            </div>
          ) : (
            <>
              {/* Weather Info */}
              <div className="weather-top-row">
                <div className="weather-hero">
                  <div className="weather-icon-box">
                    {getWeatherIcon(weather.weather[0].main)}
                  </div>
                  <div className="weather-temp-info">
                    <span className="temp">{Math.round(weather.main.temp)}{unitLabel}</span>
                    <span className="condition-text">{weather.weather[0].description}</span>
                  </div>
                </div>

                <div className="weather-metrics">
                  <div className="metric-row">
                    <span className="metric-label">Feels like</span>
                    <span className="metric-value">{Math.round(weather.main.feels_like)}{unitLabel}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Humidity</span>
                    <span className="metric-value">{weather.main.humidity}%</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Wind</span>
                    <span className="metric-value">{Math.round(weather.wind.speed)} {unit === 'metric' ? 'm/s' : 'mph'}</span>
                  </div>
                </div>
              </div>
              
              {/* Adhan & Prayer Times Strip */}
              {adhan && (
                <div className="adhan-section">
                  <div className="adhan-header-row">
                    <div className="adhan-meta">
                      <span className="adhan-title">
                        <Moon size={14} className="text-blue" /> Prayer Times ({effectivePrayerCity})
                      </span>
                      {hijriDate && (
                        <span className="adhan-hijri" title="Hijri Date">
                          {hijriDate.day} {hijriDate.month?.en} {hijriDate.year} AH
                        </span>
                      )}
                      {nextPrayer && (
                        <span className="adhan-next-badge" title={`Time remaining: ${nextPrayer.countdown}`}>
                          Next: {nextPrayer.name} ({nextPrayer.countdown})
                        </span>
                      )}
                    </div>

                    <div className="adhan-controls">
                      {/* Play / Pause Adhan Stream */}
                      <button
                        className={`adhan-ctrl-btn ${isPlayingAudio ? 'active-audio' : ''}`}
                        onClick={toggleAdhanAudio}
                        title={isPlayingAudio ? 'Stop Adhan audio' : 'Listen to Adhan recitation'}
                        aria-label="Play or Stop Adhan Audio"
                      >
                        {isPlayingAudio ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        <span>{isPlayingAudio ? 'Stop' : 'Adhan'}</span>
                      </button>

                      {/* Link to AlAdhan Player Page requested by user */}
                      <a
                        href={aladhanPlayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adhan-ctrl-btn"
                        title="Open AlAdhan Player website in new tab"
                        aria-label="Open AlAdhan Player"
                      >
                        <ExternalLink size={12} />
                        <span>AlAdhan</span>
                      </a>
                    </div>
                  </div>

                  <div className="adhan-strip">
                    {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
                      const isNext = nextPrayer?.name === prayer;
                      return (
                        <div 
                          key={prayer} 
                          className={`adhan-item ${isNext ? 'is-next' : ''}`}
                          title={`${prayer} (${PRAYER_ARABIC[prayer]}): ${adhan[prayer]}`}
                        >
                          <span className="adhan-name">
                            <span>{prayer}</span>
                            <span className="adhan-ar-name">{PRAYER_ARABIC[prayer]}</span>
                          </span>
                          <span className="adhan-time">{adhan[prayer]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
