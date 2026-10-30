import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { MapPin, Navigation, Radar, Video, Save, Check } from 'lucide-react';

export const GeoSettings: React.FC = () => {
  const [stationName, setStationName] = useState('Ostrołęka (Stacja Główna)');
  const [lat, setLat] = useState('53.0805');
  const [lon, setLon] = useState('21.5721');
  const [radarRadius, setRadarRadius] = useState<number>(15);
  const [cameraInterval, setCameraInterval] = useState<number>(30);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Geolokalizacja, Radary i Telemetria</h3>
            <p className="text-xs text-slate-500 font-medium">Koordynaty stacji, promień CANARD i monitoring kamer</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-1">
            <label className="text-xs font-bold text-slate-700 block mb-1">Nazwa stacji:</label>
            <input
              type="text"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Szerokość (Lat):</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Długość (Lon):</label>
            <input
              type="text"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Radar className="w-4 h-4 text-emerald-600" />
                <span>Promień radaru CANARD:</span>
              </span>
              <span className="font-mono text-emerald-700">{radarRadius} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={radarRadius}
              onChange={(e) => setRadarRadius(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Strefa alertów o kontrolach drogowych i fotoradarach</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-sky-600" />
                <span>Odświeżanie kamer drogowych:</span>
              </span>
              <span className="font-mono text-sky-700">{cameraInterval}s</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={cameraInterval}
              onChange={(e) => setCameraInterval(parseInt(e.target.value, 10))}
              className="w-full accent-sky-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Interwał pobierania klatek ze strumieni GDDKiA</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
          <button
            onClick={() => {
              setLat('53.0805');
              setLon('21.5721');
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <Navigation className="w-3.5 h-3.5 text-slate-400" />
            <span>Wykryj z GPS</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Zapisano współrzędne' : 'Zapisz konfigurację'}</span>
          </button>
        </div>
      </div>
    </GlassCard>
  );
};
