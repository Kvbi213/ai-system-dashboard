import React, { useState } from 'react';
import { Cpu, Volume2, Bot, MapPin, Bell, Smartphone, ShieldCheck, Brain } from 'lucide-react';
import { KernelSettings } from './components/KernelSettings';
import { VoiceTtsSettings } from './components/VoiceTtsSettings';
import { AiModelSettings } from './components/AiModelSettings';
import { GeoSettings } from './components/GeoSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { ErgonomicsSettings } from './components/ErgonomicsSettings';
import { SecurityDbSettings } from './components/SecurityDbSettings';
import { FinOpsAndMemoryCard } from './components/FinOpsAndMemoryCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { useToast } from '../../components/ui/Toast';

type SettingsTab = 'kernel' | 'finops_memory' | 'voice_tts' | 'ai_models' | 'geo_weather' | 'notifications' | 'ergonomics_ui' | 'database_cloud';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('kernel');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Przeładowano konfigurację środowiska Zero-Trust');
    }, 500);
  };

  const tabs = [
    { id: 'kernel', label: 'Kernel & Motyw', icon: Cpu },
    { id: 'finops_memory', label: 'FinOps & Pamięć', icon: Brain },
    { id: 'voice_tts', label: 'Asystent TTS', icon: Volume2 },
    { id: 'ai_models', label: 'Modele AI', icon: Bot },
    { id: 'geo_weather', label: 'Geo & Radary', icon: MapPin },
    { id: 'notifications', label: 'Powiadomienia', icon: Bell },
    { id: 'ergonomics_ui', label: 'Ergonomia UI', icon: Smartphone },
    { id: 'database_cloud', label: 'Baza & Audyt', icon: ShieldCheck }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={ShieldCheck}
        title="Konfiguracja Jądra i Ustawienia Zero-Trust"
        subtitle="Zarządzanie motywem, modelami AI, TTS, geolokalizacją i bezpieczeństwem"
        badge="Kernel v4.0"
        badgeVariant="slate"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshLabel="Odśwież"
      />

      {/* Unified SubTabBar with liquid pill design */}
      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Active Tab Content */}
      <div className="space-y-4">
        {activeTab === 'kernel' && <KernelSettings />}
        {activeTab === 'finops_memory' && <FinOpsAndMemoryCard />}
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
