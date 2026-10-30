import React from 'react';

interface DaySelectorBarProps {
  selectedDay: number; // 1 = Poniedziałek, 5 = Piątek
  onSelectDay: (day: number) => void;
}

const DAYS = [
  { id: 1, label: 'Pon', full: 'Poniedziałek', date: '30 paź' },
  { id: 2, label: 'Wt', full: 'Wtorek', date: '31 paź' },
  { id: 3, label: 'Śr', full: 'Środa', date: '1 lis' },
  { id: 4, label: 'Czw', full: 'Czwartek', date: '2 lis' },
  { id: 5, label: 'Pt', full: 'Piątek', date: '3 lis' }
];

export const DaySelectorBar: React.FC<DaySelectorBarProps> = ({ selectedDay, onSelectDay }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {DAYS.map((day) => {
        const isActive = selectedDay === day.id;
        return (
          <button
            key={day.id}
            onClick={() => onSelectDay(day.id)}
            className={`flex-1 min-w-[70px] py-2 px-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isActive
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400'
                : 'glass-card text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className="text-xs font-bold tracking-tight">{day.label}</span>
            <span
              className={`text-[10px] mt-0.5 font-mono ${
                isActive ? 'text-sky-100 font-semibold' : 'text-slate-500'
              }`}
            >
              {day.date}
            </span>
          </button>
        );
      })}
    </div>
  );
};
