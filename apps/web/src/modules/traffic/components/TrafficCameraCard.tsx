import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Camera, Radio } from 'lucide-react';
import { trafficApi } from '../../../api/client';

export interface CameraNode {
  id: string;
  location: string;
  road: string;
  status: 'online' | 'warning' | 'offline';
  speedLimitKmh: number;
  lastUpdated: string;
}

const FALLBACK_NODES: CameraNode[] = [
  { id: 'c1', location: 'Węzeł Miejski Północ (Kamera 01)', road: 'DK / Obwodnica', status: 'online', speedLimitKmh: 50, lastUpdated: '1 min temu' },
  { id: 'c2', location: 'Węzeł Wschodni (Wjazd A1)', road: 'Autostrada A1 / DW', status: 'online', speedLimitKmh: 90, lastUpdated: '2 min temu' },
  { id: 'c3', location: 'Węzeł Tranzytowy Południe', road: 'DK / A1', status: 'warning', speedLimitKmh: 70, lastUpdated: 'Prace drogowe' },
  { id: 'c4', location: 'Odcinkowy Pomiar Zachód', road: 'DK / Trasa Główna', status: 'online', speedLimitKmh: 50, lastUpdated: '5 min temu' }
];

export const TrafficCameraCard: React.FC = () => {
  const [nodes, setNodes] = useState<CameraNode[]>(FALLBACK_NODES);

  useEffect(() => {
    trafficApi.getCameras()
      .then((res) => {
        if (res?.cameras && res.cameras.length > 0) {
          setNodes(res.cameras);
        }
      })
      .catch(() => {
        // Fallback maintained
      });
  }, []);

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <GlassCard key={node.id} className="p-4" glow="none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 shadow-sm">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{node.location}</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {node.road}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Limit: {node.speedLimitKmh} km/h • {node.lastUpdated}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <Badge variant={node.status === 'online' ? 'success' : 'warning'}>
                {node.status === 'online' ? 'Radar aktywny' : 'Utrudnienia'}
              </Badge>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-semibold">
                <Radio className="w-3 h-3 text-emerald-600" />
                CANARD Telemetry
              </span>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};
