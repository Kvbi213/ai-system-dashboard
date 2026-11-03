import React, { useState } from 'react';
import { SystemDirectivesCard } from './components/SystemDirectivesCard';
import { CognitiveFactsList } from './components/CognitiveFactsList';
import { Brain, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { useToast } from '../../components/ui/Toast';

export const MemoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directives' | 'facts'>('directives');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Pamięć kognitywna AI zsynchronizowana');
    }, 500);
  };

  const tabs = [
    { id: 'directives', label: 'Dyrektywy Systemowe', icon: ShieldCheck },
    { id: 'facts', label: 'Baza Faktów & Pamięć AI', icon: Brain }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto" data-testid="memory-hub-page">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={Brain}
        title="Pamięć Kognitywna AI"
        subtitle="Dyrektywy systemowe, baza faktów użytkownika i wektory semantyczne"
        badge="Wiedza AI"
        badgeVariant="cyan"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Unified SubTabBar with liquid pill design */}
      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Panels */}
      {activeTab === 'directives' && <SystemDirectivesCard />}
      {activeTab === 'facts' && <CognitiveFactsList />}
    </div>
  );
};
