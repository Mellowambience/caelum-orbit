import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud, Sun, CloudRain, CloudLightning, Wind, Droplets, Thermometer,
  Navigation, Search, Settings, MapPin, RefreshCw, Satellite, Globe, Sparkles,
  Activity, Clock
} from 'lucide-react';

const LATIN_WEATHER = {
  clear: { term: "Ser\u0113na", desc: "Caelum purum et lucidum." },
  clouds: { term: "N\u016bbil\u014dsa", desc: "N\u016bb\u0113s caelum tegunt." },
  rain: { term: "Pluit", desc: "Imber cadit." },
  drizzle: { term: "R\u014drat", desc: "Pluvia tenuis." },
  thunderstorm: { term: "Tonat", desc: "Fulgura et tonitrua." },
  snow: { term: "Ningit", desc: "Nix dealbata." },
  mist: { term: "Nebula", desc: "Cal\u012bg\u014d levis." },
  fog: { term: "Nebul\u014dsa", desc: "Caelum obsc\u016br\u0101tur." }
};

const LATIN_DAYS = ["Dies Solis", "Dies Lunae", "Dies Martis", "Dies Mercurii", "Dies Iovis", "Dies Veneris", "Dies Saturni"];

const App = () => {
  const [coords, setCoords] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState("C");
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('standard');

  // ── Fetch weather from Open-Meteo (free, no key) ──
  const fetchWeather = useCallback(async (lat, lon, cityName = null) => {
    setLoading(true);
    setError(null);
    setLastUpdated(new Date());

    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,apparent_temperature,precipitation,weathercode,relative_humidity_2m,wind_speed_10m',
        hourly: 'temperature_2m,weathercode,precipitation_probability',
        daily: 'weathercode,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: 7,
        temperature_unit: unit === 'C' ? 'celsius' : 'fahrenheit',
        wind_speed_unit: 'ms',
        precipitation_unit: 'mm'
      });

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) throw new Error("Caelum n\u014dn inv\u0113n\u012bmus");

      const data = await res.json();

      const getCondition = (code) => {
        if ([0, 1].includes(code)) return { main: 'clear', desc: 'Ser\u0113num' };
        if ([2, 3].includes(code)) return { main: 'clouds', desc: 'N\u016bb\u0113s' };
        if ([51, 53, 55, 61, 63, 65].includes(code)) return { main: 'rain', desc: 'Pluvia' };
        if ([80, 81, 82].includes(code)) return { main: 'rain', desc: 'Imber veh\u0113m\u0113ns' };
        if ([95, 96, 99].includes(code)) return { main: 'thunderstorm', desc: 'Tonitrus' };
        if ([71, 73, 75, 77].includes(code)) return { main: 'snow', desc: 'Nix' };
        if ([45, 48].includes(code)) return { main: 'mist', desc: 'Nebula' };
        return { main: 'unknown', desc: 'Caelum incertum' };
      };

      const current = getCondition(data.current.weathercode);

      const forecast = data.daily.time.map((time, i) => {
        const cond = getCondition(data.daily.weathercode[i]);
        return {
          day: LATIN_DAYS[new Date(time + 'T12:00:00').getDay()],
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          type: cond.main
        };
      });

      let resolvedName = cityName;
      if (!resolvedName) {
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geoData = await geo.json();
          resolvedName = geoData.address?.city || geoData.address?.town || geoData.display_name.split(',')[0];
        } catch {}
      }

      setWeather({
        name: resolvedName || `${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)}`,
        temp: Math.round(data.current.temperature_2m),
        feels_like: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        wind: data.current.wind_speed_10m,
        condition: current,
        forecast
      });
    } catch (err) {
      setError(err.message || "N\u016bllus nexus ad caelum");
    } finally {
      setLoading(false);
    }
  }, [unit]);

  // ── Search: geocode city name then fetch weather ──
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await res.json();
      if (!results.length) return setError('Urbs n\u014dn inventa est.');
      const place = results[0];
      const newCoords = { lat: parseFloat(place.lat), lon: parseFloat(place.lon) };
      setCoords(newCoords);
      fetchWeather(newCoords.lat, newCoords.lon, place.display_name.split(',')[0]);
    } catch {
      setError('Nōn potuit locum invenire.');
    }
  };

  // ── Geolocation ──
  const handleLocate = () => {
    if (!navigator.geolocation) return setError("G\u0113olocāti\u014d n\u014dn suppetit");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(newCoords);
        fetchWeather(newCoords.lat, newCoords.lon);
      },
      () => setError("Permissu locus neg\u0101tur"),
      { enableHighAccuracy: true }
    );
  };

  // ── Re-fetch when unit changes ──
  useEffect(() => {
    if (coords) fetchWeather(coords.lat, coords.lon, weather?.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  // ── Auto-refresh every 10 minutes ──
  useEffect(() => {
    if (!coords) return;
    const interval = setInterval(() => {
      fetchWeather(coords.lat, coords.lon, weather?.name);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [coords, fetchWeather, weather?.name]);

  // ── Initial load: geolocation, fallback to Roma ──
  useEffect(() => {
    const fallbackCoords = { lat: 41.9028, lon: 12.4964 };
    const timer = setTimeout(() => {
      if (!coords) {
        setCoords(fallbackCoords);
        fetchWeather(fallbackCoords.lat, fallbackCoords.lon, 'Roma');
      }
    }, 4000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          const newCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setCoords(newCoords);
          fetchWeather(newCoords.lat, newCoords.lon);
        },
        () => {
          clearTimeout(timer);
          setCoords(fallbackCoords);
          fetchWeather(fallbackCoords.lat, fallbackCoords.lon, 'Roma');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      clearTimeout(timer);
      setCoords(fallbackCoords);
      fetchWeather(fallbackCoords.lat, fallbackCoords.lon, 'Roma');
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conditionKey = weather?.condition?.main?.toLowerCase() || 'unknown';
  const latin = LATIN_WEATHER[conditionKey] || { term: "Ignotum", desc: "\u2014" };

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans text-white transition-all duration-1000
      ${viewMode === 'satellite' ? 'bg-slate-950' : 'bg-gradient-to-br from-indigo-900 via-blue-700 to-purple-900'}`}>

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <Satellite className="w-10 h-10 text-blue-300 animate-pulse" />
          <div>
            <h1 className="text-4xl font-black tracking-tighter">CAELUM \u2205RBIT</h1>
            <p className="text-xs uppercase tracking-widest opacity-70 flex items-center gap-2">
              <Activity size={12} className="text-green-400 animate-pulse" /> TEMPORIS RE\u0100LIS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Urbs vel locus..."
              className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full py-3 px-5 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-60" />
          </div>
          <button onClick={handleLocate} className="p-3 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition">
            <MapPin size={22} />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'standard' ? 'satellite' : 'standard')}
            className={`px-5 py-2.5 rounded-full border text-sm font-bold tracking-wider transition-all flex items-center gap-2
              ${viewMode === 'satellite' ? 'bg-blue-600 border-blue-400' : 'bg-white/10 border-white/30'}`}
          >
            {viewMode === 'satellite' ? <Globe size={16} /> : <Satellite size={16} />}
            {viewMode === 'satellite' ? 'Tellus' : 'Satell\u012bt\u0113s'}
          </button>
          <button
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="px-5 py-2.5 rounded-full border border-white/30 bg-white/10 text-sm font-bold tracking-wider hover:bg-white/20 transition"
          >
            °{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center z-10 py-40">
          <RefreshCw className="w-16 h-16 animate-spin text-blue-300 mb-6" />
          <p className="text-2xl font-serif italic opacity-80">Caelum scrut\u0101tur... \u21ba</p>
        </div>
      ) : error ? (
        <div className="text-center z-10 mt-20 text-red-300 text-xl font-bold">{error}</div>
      ) : weather && (
        <main className="relative z-10 w-full max-w-6xl mx-auto p-4 md:p-8 grid lg:grid-cols-4 gap-8">

          {/* Hero Panel */}
          <section className="lg:col-span-3 space-y-8">
            <div className={`p-10 rounded-3xl border backdrop-blur-xl transition-all duration-1000 shadow-2xl
              ${viewMode === 'satellite' ? 'bg-blue-950/50 border-blue-500/40' : 'bg-white/10 border-white/20'}`}>
              <div className="flex justify-between items-start flex-wrap gap-8">
                <div>
                  <p className="text-sm uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <Navigation size={14} /> {weather.name}
                  </p>
                  <h2 className="text-8xl md:text-9xl font-black tracking-tighter mt-2">
                    {weather.temp}\u00b0{unit}
                  </h2>
                  <p className="text-2xl font-light mt-1 opacity-90">{weather.condition.desc}</p>
                  <p className="text-3xl font-black mt-6">{latin.term}</p>
                  <p className="text-sm opacity-70 italic mt-1">{latin.desc}</p>
                </div>

                <div className="text-right">
                  <div className="text-6xl opacity-90 mb-4">
                    {weather.condition.main === 'clear' ? (
                      <Sun className="inline text-yellow-300 drop-shadow-2xl" />
                    ) : weather.condition.main === 'thunderstorm' ? (
                      <CloudLightning className="inline text-yellow-200" />
                    ) : weather.condition.main.includes('rain') ? (
                      <CloudRain className="inline text-blue-200" />
                    ) : (
                      <Cloud className="inline text-slate-200" />
                    )}
                  </div>
                  <p className="text-xl">S\u0113nsus: {weather.feels_like}\u00b0</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-12">
                <div className="bg-black/20 p-6 rounded-2xl text-center border border-white/10">
                  <Droplets size={28} className="mx-auto mb-2 text-blue-300" />
                  <p className="text-2xl font-black">{weather.humidity}%</p>
                  <p className="text-xs uppercase opacity-60">H\u016bmidit\u0101s</p>
                </div>
                <div className="bg-black/20 p-6 rounded-2xl text-center border border-white/10">
                  <Wind size={28} className="mx-auto mb-2 text-cyan-300" />
                  <p className="text-2xl font-black">{weather.wind} m/s</p>
                  <p className="text-xs uppercase opacity-60">Ventus</p>
                </div>
                <div className="bg-black/20 p-6 rounded-2xl text-center border border-white/10">
                  <Clock size={28} className="mx-auto mb-2 text-purple-300" />
                  <p className="text-lg font-mono">{lastUpdated?.toLocaleTimeString()}</p>
                  <p className="text-xs uppercase opacity-60">Sync</p>
                </div>
              </div>
            </div>

            {/* 7-day Forecast */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {weather.forecast.map((day, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center hover:bg-white/10 transition group">
                  <p className="text-xs uppercase opacity-60 mb-3">{day.day}</p>
                  {day.type === 'clear' ? (
                    <Sun size={32} className="mx-auto text-yellow-300" />
                  ) : day.type === 'thunderstorm' ? (
                    <CloudLightning size={32} className="mx-auto text-yellow-200" />
                  ) : day.type === 'rain' ? (
                    <CloudRain size={32} className="mx-auto text-blue-300" />
                  ) : (
                    <Cloud size={32} className="mx-auto" />
                  )}
                  <p className="text-2xl font-black mt-3">{day.tempMax}\u00b0</p>
                  <p className="text-sm opacity-70">{day.tempMin}\u00b0</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-blue-900/30 border border-blue-500/30 p-6 rounded-3xl backdrop-blur">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Satellite size={16} /> Orbital Pulse
              </h3>
              <p className="text-sm italic opacity-80 mb-4">\"Ex cael\u014d veniunt n\u016bnti\u012b...\"</p>
              <button
                onClick={() => coords && fetchWeather(coords.lat, coords.lon, weather?.name)}
                className="w-full py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> Refresh Oracle
              </button>
            </div>

            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <h3 className="text-xs uppercase tracking-widest opacity-60 mb-4">Status Re\u0101lis</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>API</span><span className="text-green-400">Open-Meteo Live</span></div>
                <div className="flex justify-between"><span>Update</span><span>{lastUpdated?.toLocaleTimeString()}</span></div>
                <div className="flex justify-between"><span>Mode</span><span>{viewMode.toUpperCase()}</span></div>
                <div className="flex justify-between"><span>Unit</span><span>\u00b0{unit}</span></div>
              </div>
            </div>
          </aside>
        </main>
      )}

      <footer className="relative z-10 text-center py-8 text-xs opacity-50 tracking-widest">
        \u29c1 GHOSTLINE CAELUM \u21ba REAL-TIME ORBITAL RESONANCE \u2234
      </footer>
    </div>
  );
};

export default App;
