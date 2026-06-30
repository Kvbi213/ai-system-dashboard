import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, AlertTriangle, Droplets, Eye } from 'lucide-react';

const WMO_ICONS = {
  0: { icon: Sun, label: 'Słonecznie' },
  1: { icon: Sun, label: 'Głównie słonecznie' },
  2: { icon: Cloud, label: 'Częściowe zachmurzenie' },
  3: { icon: Cloud, label: 'Zachmurzenie' },
  45: { icon: Eye, label: 'Mgła' },
  51: { icon: CloudRain, label: 'Mżawka' },
  61: { icon: CloudRain, label: 'Lekki deszcz' },
  63: { icon: CloudRain, label: 'Deszcz' },
  80: { icon: CloudRain, label: 'Przelotne opady' },
};

const getWeatherIcon = (code) => {
  if (!code && code !== 0) return { icon: Cloud, label: 'Brak danych' };
  const entry = WMO_ICONS[code] || (code <= 3 ? WMO_ICONS[0] : code <= 67 ? WMO_ICONS[61] : WMO_ICONS[80]);
  return entry || { icon: Cloud, label: '' };
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const query = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
        const res = await fetch(`/api/weather/raw${query}`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        if (data?.current_weather) {
          setWeather(data.current_weather);
          const currentHour = new Date().getHours();
          const hours = data.hourly?.time || [];
          const temps = data.hourly?.temperature_2m || [];
          const precips = data.hourly?.precipitation_probability || [];
          const codes = data.hourly?.weathercode || [];
          const mini = [];
          for (let offset = 1; offset <= 3; offset++) {
            const idx = currentHour + offset;
            if (idx < hours.length) {
              mini.push({ hour: idx, temp: temps[idx], precip: precips[idx], code: codes[idx] });
            }
          }
          setForecast(mini);
        } else {
          setWeather({ error: true });
        }
      } catch {
        setWeather({ error: true });
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.log('Brak dostępu do lokalizacji, używam domyślnej.', err);
          fetchWeather();
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather();
    }

    const iv = setInterval(() => {
      if ('geolocation' in navigator) {
         navigator.geolocation.getCurrentPosition(
           (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
           () => fetchWeather()
         );
      } else {
         fetchWeather();
      }
    }, 900000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return <div className="h-8 w-28 skeleton rounded" />;
  if (!weather || weather.error) {
    return (
      <div className="flex items-center gap-2 text-red-400 font-mono opacity-80">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-xs">Brak danych</span>
      </div>
    );
  }

  const { icon: WeatherIcon, label } = getWeatherIcon(weather.weathercode);

  return (
    <div className="flex flex-col items-end gap-1.5 animate-fade-in-up">
      {/* Current weather */}
      <div className="flex items-center gap-2.5 text-accentSecondary font-mono">
        <WeatherIcon className="w-5 h-5" />
        <span className="text-xl font-bold">{Math.round(weather.temperature)}°C</span>
        <span className="text-xs text-textMuted hidden sm:flex items-center gap-1">
          <Wind className="w-3 h-3" />{weather.windspeed} km/h
        </span>
      </div>
      <span className="text-[10px] text-textMuted font-mono">{label}</span>
      {/* Mini 3h forecast */}
      {forecast.length > 0 && (
        <div className="flex gap-3 mt-0.5">
          {forecast.map((f, i) => {
            const { icon: FIcon } = getWeatherIcon(f.code);
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[9px] text-textMuted">{f.hour}:00</span>
                <FIcon className="w-3 h-3 text-accentSecondary/70" />
                <span className="font-mono text-[9px] text-textPrimary">{Math.round(f.temp)}°</span>
                {f.precip > 0 && (
                  <span className="font-mono text-[8px] text-blue-400 flex items-center gap-0.5">
                    <Droplets className="w-2 h-2" />{f.precip}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
