import React, { useState } from 'react';
import { SystemDirectivesCard } from './components/SystemDirectivesCard';
import { CognitiveFactsList } from './components/CognitiveFactsList';
import { Brain, ShieldCheck } from 'lucide-react';

export const MemoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directives' | 'facts'>('directives');

  const tabs = [
    { id: 'directives', label: 'Dyrektywy Systemowe', icon: ShieldCheck },
    { id: 'facts', label: 'Baza Faktów & Pamięć AI', icon: Brain }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto" data-testid="memory-hub-page">
      {/* Category Pills Header */}
      <div className="flex gap-2 p-1.5 rounded-2xl glass-panel shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 border border-sky-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'directives' && <SystemDirectivesCard />}
      {activeTab === 'facts' && <CognitiveFactsList />}
    </div>
  );
};
