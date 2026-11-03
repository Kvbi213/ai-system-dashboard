import React, { useState } from 'react';
import { TimetablePage } from '../timetable/page';
import { GradesPage } from '../grades/page';
import { AttendanceCard } from './components/AttendanceCard';
import { SchoolExamsList } from './components/SchoolExamsList';
import { Clock, GraduationCap, CalendarCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { useToast } from '../../components/ui/Toast';

export const SchoolPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'grades' | 'attendance'>('timetable');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Pobrano aktualne dane z systemu Librus Synergia');
    }, 600);
  };

  const tabs = [
    { id: 'timetable', label: 'Plan lekcji', icon: Clock },
    { id: 'grades', label: 'Oceny i Średnie', icon: GraduationCap },
    { id: 'attendance', label: 'Frekwencja i Terminarz', icon: CalendarCheck }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={GraduationCap}
        title="Centrum Edukacji i Librus Synergia"
        subtitle="Plan lekcji 1:1, dziennik ocen, frekwencja oraz terminarz sprawdzianów"
        badge="Synergia Sync"
        badgeVariant="cyan"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshLabel="Odśwież Librus"
      />

      {/* Unified SubTabBar with liquid pill design */}
      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Panels */}
      {activeTab === 'timetable' && <TimetablePage />}
      {activeTab === 'grades' && <GradesPage />}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <AttendanceCard />
          <SchoolExamsList />
        </div>
      )}
    </div>
  );
};
