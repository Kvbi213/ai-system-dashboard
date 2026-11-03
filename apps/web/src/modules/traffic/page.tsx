import React, { useState } from 'react';
import { TrafficCameraCard } from './components/TrafficCameraCard';
import { SpeedCameraList } from './components/SpeedCameraList';
import { RouteAlertsCard } from './components/RouteAlertsCard';
import { Camera, Radio, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { useToast } from '../../components/ui/Toast';

export const TrafficPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cameras' | 'radars' | 'routes'>('cameras');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Zaktualizowano telemetrię drogową GDDKiA i CANARD');
    }, 600);
  };

  const tabs = [
    { id: 'cameras', label: 'Kamery GDDKiA', icon: Camera },
    { id: 'radars', label: 'Radary CANARD', icon: Radio },
    { id: 'routes', label: 'Trasy i Utrudnienia', icon: AlertTriangle }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={Radio}
        title="Radary CANARD i Kamery GDDKiA"
        subtitle="Monitoring korytarzy tranzytowych DK22, A1 i węzłów drogowych"
        badge="CANARD LIVE"
        badgeVariant="rose"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshLabel="Odśwież telemetrię"
      />

      {/* Unified SubTabBar with liquid pill design */}
      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Panels */}
      {activeTab === 'cameras' && <TrafficCameraCard />}
      {activeTab === 'radars' && <SpeedCameraList />}
      {activeTab === 'routes' && <RouteAlertsCard />}
    </div>
  );
};
