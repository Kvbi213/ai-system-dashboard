import React, { useState } from 'react';
import { PrivateRoutinesCard } from './components/PrivateRoutinesCard';
import { DailyHabitStreaks } from './components/DailyHabitStreaks';
import { PersonalGoalsCard } from './components/PersonalGoalsCard';
import { PrivateJournalCard } from './components/PrivateJournalCard';
import { AutomationScriptsManager } from './components/AutomationScriptsManager';
import { Sun, Target, BookOpen, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { useToast } from '../../components/ui/Toast';

export const PrivatePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routines' | 'goals' | 'journal' | 'automation'>('routines');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Pobrano aktualne nawyki, rutyny, cele i automatyzacje');
    }, 600);
  };

  const tabs = [
    { id: 'routines', label: 'Nawyki i Rutyny Dobowe', icon: Sun },
    { id: 'automation', label: 'Skrypty i Automatyzacje', icon: Sparkles },
    { id: 'goals', label: 'Cele i Projekty Osobiste', icon: Target },
    { id: 'journal', label: 'Dziennik i Refleksje', icon: BookOpen }
  ] as const;

  return (
    <div className="space-y-4 max-w-5xl mx-auto" data-testid="private-hub-page">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={Sun}
        title="Strefa Prywatna i Rozwój"
        subtitle="Zsynchronizowane nawyki, automatyzacje Pushbullet, cele strategiczne i dziennik"
        badge="Prywatne"
        badgeVariant="purple"
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
      {activeTab === 'routines' && (
        <div className="space-y-4">
          <DailyHabitStreaks />
          <PrivateRoutinesCard />
        </div>
      )}
      {activeTab === 'automation' && <AutomationScriptsManager />}
      {activeTab === 'goals' && <PersonalGoalsCard />}
      {activeTab === 'journal' && <PrivateJournalCard />}
    </div>
  );
};
