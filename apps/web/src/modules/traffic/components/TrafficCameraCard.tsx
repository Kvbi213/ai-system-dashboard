import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Camera, Radio } from 'lucide-react';

export interface CameraNode {
  id: string;
  location: string;
  road: string;
  status: 'online' | 'warning' | 'offline';
  speedLimitKmh: number;
  lastUpdated: string;
}

const NODES: CameraNode[] = [
  { id: 'c1', location: 'Starogard Gdański (Centrum)', road: 'DK22', status: 'online', speedLimitKmh: 50, lastUpdated: '1 min temu' },
  { id: 'c2', location: 'Węzeł Stanisławie (Wjazd A1)', road: 'A1 / DW224', status: 'online', speedLimitKmh: 90, lastUpdated: '2 min temu' },
  { id: 'c3', location: 'Węzeł Swarożyn', road: 'DK22 / A1', status: 'warning', speedLimitKmh: 70, lastUpdated: 'Prace drogowe' },
  { id: 'c4', location: 'Czarna Woda (Odcinkowy pomiar)', road: 'DK22', status: 'online', speedLimitKmh: 50, lastUpdated: '5 min temu' }
];

export const TrafficCameraCard: React.FC = () => {
  return (
    <div className="space-y-3">
      {NODES.map((node) => (
        <GlassCard key={node.id} className="p-4" glow="none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100">{node.location}</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    {node.road}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Limit: {node.speedLimitKmh} km/h • {node.lastUpdated}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <Badge variant={node.status === 'online' ? 'success' : 'warning'}>
                {node.status === 'online' ? 'Radar aktywny' : 'Utrudnienia'}
              </Badge>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" />
                CANARD Telemetry
              </span>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};
