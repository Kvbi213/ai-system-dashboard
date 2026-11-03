import React, { useState } from 'react';
import { Cpu, Volume2, Bot, MapPin, Bell, Smartphone, ShieldCheck } from 'lucide-react';
import { KernelSettings } from './components/KernelSettings';
import { VoiceTtsSettings } from './components/VoiceTtsSettings';
import { AiModelSettings } from './components/AiModelSettings';
import { GeoSettings } from './components/GeoSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { ErgonomicsSettings } from './components/ErgonomicsSettings';
import { SecurityDbSettings } from './components/SecurityDbSettings';

type SettingsTab = 'kernel' | 'voice_tts' | 'ai_models' | 'geo_weather' | 'notifications' | 'ergonomics_ui' | 'database_cloud';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('kernel');

  const tabs = [
    { id: 'kernel', label: 'Kernel & Motyw', icon: Cpu },
    { id: 'voice_tts', label: 'Asystent TTS', icon: Volume2 },
    { id: 'ai_models', label: 'Modele AI', icon: Bot },
    { id: 'geo_weather', label: 'Geo & Radary', icon: MapPin },
    { id: 'notifications', label: 'Powiadomienia', icon: Bell },
    { id: 'ergonomics_ui', label: 'Ergonomia UI', icon: Smartphone },
    { id: 'database_cloud', label: 'Baza & Audyt', icon: ShieldCheck }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl glass-panel shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 border border-sky-500'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="space-y-4">
        {activeTab === 'kernel' && <KernelSettings />}
        {activeTab === 'voice_tts' && <VoiceTtsSettings />}
        {activeTab === 'ai_models' && <AiModelSettings />}
        {activeTab === 'geo_weather' && <GeoSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'ergonomics_ui' && <ErgonomicsSettings />}
        {activeTab === 'database_cloud' && <SecurityDbSettings />}
      </div>
    </div>
  );
};
