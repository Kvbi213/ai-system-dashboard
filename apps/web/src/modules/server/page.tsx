import React, { useState } from 'react';
import { DockerContainersGrid } from './components/DockerContainersGrid';
import { MikrusLxcTelemetry } from './components/MikrusLxcTelemetry';
import { DataBackupExportCard } from './components/DataBackupExportCard';
import { Server, Box, Database } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { useToast } from '../../components/ui/Toast';

export const ServerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'docker' | 'mikrus' | 'backup'>('docker');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Pobrano aktualne metryki węzła Docker i Mikr.us');
    }, 600);
  };

  const tabs = [
    { id: 'docker', label: 'Kontenery Docker', icon: Box },
    { id: 'mikrus', label: 'Węzeł Mikr.us LXC', icon: Server },
    { id: 'backup', label: 'Kopia i Baza Danych', icon: Database }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={Server}
        title="Infrastruktura i Serwer Brzegowy"
        subtitle="Mikr.us Debian 12 LXC :: Docker Compose Multi-Node"
        badge="Węzeł 01"
        badgeVariant="cyan"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshLabel="Odśwież stan"
      />

      {/* Unified SubTabBar with liquid pill design */}
      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Panels */}
      {activeTab === 'docker' && <DockerContainersGrid />}
      {activeTab === 'mikrus' && <MikrusLxcTelemetry />}
      {activeTab === 'backup' && <DataBackupExportCard />}
    </div>
  );
};
