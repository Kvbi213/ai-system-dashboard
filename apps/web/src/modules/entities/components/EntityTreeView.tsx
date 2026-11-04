import React, { useState } from 'react';
import { Network, User, Building, MapPin, Cpu, Search, ArrowRight } from 'lucide-react';
import { EntityItem } from './EntityDetailsModal';
import { Badge } from '../../../components/ui/Badge';

interface EntityTreeViewProps {
  entities: EntityItem[];
  onSelectEntity: (entity: EntityItem) => void;
}

export const EntityTreeView: React.FC<EntityTreeViewProps> = ({ entities, onSelectEntity }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = entities.filter((e) => {
    const matchesType = filterType === 'ALL' || e.type === filterType;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getIcon = (type: EntityItem['type']) => {
    switch (type) {
      case 'PERSON':
        return User;
      case 'ORGANIZATION':
        return Building;
      case 'LOCATION':
      case 'ASSET':
        return MapPin;
      case 'SYSTEM':
        return Cpu;
      default:
        return Network;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj podmiotu, relacji, majątku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Wszystkie' },
            { id: 'PERSON', label: 'Osoby' },
            { id: 'ORGANIZATION', label: 'Organizacje' },
            { id: 'ASSET', label: 'Majątek' },
            { id: 'SYSTEM', label: 'Systemy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                filterType === tab.id
                  ? 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Entity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const Icon = getIcon(item.type);

          return (
            <div
              key={item.id}
              onClick={() => onSelectEntity(item)}
              className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 hover:bg-white dark:hover:bg-slate-900 shadow-sm cursor-pointer transition flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500/20 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-sky-400 transition">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">{item.role}</p>
                    </div>
                  </div>
                  <Badge variant="slate">{item.type}</Badge>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                  {item.notes || 'Brak wpisanych notatek dodatkowych.'}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">{item.relations.length} powiązań w grafie</span>
                <span className="text-sky-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  Szczegóły <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-xs text-slate-500 italic bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
          Brak podmiotów spełniających wybrane kryteria wyszukiwania.
        </div>
      )}
    </div>
  );
};
