import React from 'react';
import { X, Network, ExternalLink, MapPin, Building, User } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export interface EntityItem {
  id: string;
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'ASSET' | 'LOCATION' | 'SYSTEM';
  role: string;
  category: string;
  location?: string;
  relations: string[];
  notes?: string;
  obsidianPath?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'MONITORED';
}

interface EntityDetailsModalProps {
  entity: EntityItem | null;
  onClose: () => void;
}

export const EntityDetailsModal: React.FC<EntityDetailsModalProps> = ({ entity, onClose }) => {
  if (!entity) return null;

  const getTypeIcon = () => {
    switch (entity.type) {
      case 'PERSON':
        return User;
      case 'ORGANIZATION':
        return Building;
      case 'LOCATION':
        return MapPin;
      default:
        return Network;
    }
  };

  const Icon = getTypeIcon();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">{entity.name}</h3>
                <Badge variant={entity.status === 'ACTIVE' ? 'success' : 'slate'}>{entity.type}</Badge>
              </div>
              <p className="text-xs text-slate-400">{entity.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Kategoria & Sfera:</span>
            <span className="font-medium text-slate-200">{entity.category}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Lokalizacja / Adres:</span>
            <span className="font-medium text-slate-200">{entity.location || 'Nie określono'}</span>
          </div>
        </div>

        {/* Relations */}
        <div>
          <span className="text-xs font-bold text-slate-400 block mb-1.5">Powiązania w Grafie Relacji:</span>
          <div className="flex flex-wrap gap-1.5">
            {entity.relations.map((rel, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono"
              >
                {rel}
              </span>
            ))}
          </div>
        </div>

        {/* Notes */}
        {entity.notes && (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Notatki & Dokumentacja:</span>
            <p className="text-xs text-slate-300 leading-relaxed">{entity.notes}</p>
          </div>
        )}

        {/* Obsidian Link */}
        {entity.obsidianPath && (
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs text-purple-300">
            <span className="font-mono text-[11px] truncate">{entity.obsidianPath}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
