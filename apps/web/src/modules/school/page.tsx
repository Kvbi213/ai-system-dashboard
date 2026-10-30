import React, { useState } from 'react';
import { TimetablePage } from '../timetable/page';
import { GradesPage } from '../grades/page';
import { AttendanceCard } from './components/AttendanceCard';
import { SchoolExamsList } from './components/SchoolExamsList';
import { Clock, GraduationCap, CalendarCheck } from 'lucide-react';

export const SchoolPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'grades' | 'attendance'>('timetable');

  const tabs = [
    { id: 'timetable', label: 'Plan lekcji', icon: Clock },
    { id: 'grades', label: 'Oceny i Średnie', icon: GraduationCap },
    { id: 'attendance', label: 'Frekwencja i Terminarz', icon: CalendarCheck }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Category Sub-Tabs with Liquid Glass Pill Design */}
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
