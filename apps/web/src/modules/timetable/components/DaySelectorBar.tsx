import React from 'react';

interface DaySelectorBarProps {
  selectedDay: number; // 1 = Poniedziałek, 5 = Piątek
  onSelectDay: (day: number) => void;
}

export const getDynamicDays = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Obliczenie poniedziałku bieżącego tygodnia roboczego
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const monthsPl = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  const dayNames = [
    { label: 'Pon', full: 'Poniedziałek' },
    { label: 'Wt', full: 'Wtorek' },
    { label: 'Śr', full: 'Środa' },
    { label: 'Czw', full: 'Czwartek' },
    { label: 'Pt', full: 'Piątek' }
  ];

  return dayNames.map((d, index) => {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + index);
    const isToday =
      targetDate.getDate() === now.getDate() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getFullYear() === now.getFullYear();

    return {
      id: index + 1,
      label: d.label,
      full: d.full,
      date: `${targetDate.getDate()} ${monthsPl[targetDate.getMonth()]}`,
      isToday
    };
  });
};

export const DaySelectorBar: React.FC<DaySelectorBarProps> = ({ selectedDay, onSelectDay }) => {
  const days = getDynamicDays();

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {days.map((day) => {
        const isActive = selectedDay === day.id;
        return (
          <button
            key={day.id}
            onClick={() => onSelectDay(day.id)}
            className={`py-2 px-1 sm:px-3 rounded-2xl flex flex-col items-center justify-center transition-all relative ${
              isActive
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25 border border-sky-500 font-bold'
                : 'glass-panel text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {day.isToday && (
              <span
                className={`absolute -top-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold uppercase tracking-wider ${
                  isActive ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-sky-600 text-white shadow-xs'
                }`}
              >
                DZIŚ
              </span>
            )}
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
