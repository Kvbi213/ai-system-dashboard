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
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {DAYS.map((day) => {
        const isActive = selectedDay === day.id;
        return (
          <button
            key={day.id}
            onClick={() => onSelectDay(day.id)}
            className={`py-2 px-1 sm:px-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isActive
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25 border border-sky-500 font-bold'
                : 'glass-panel text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <span className="text-xs tracking-tight">{day.label}</span>
            <span
              className={`text-[10px] mt-0.5 font-mono ${
                isActive ? 'text-sky-100 font-semibold' : 'text-slate-400'
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
