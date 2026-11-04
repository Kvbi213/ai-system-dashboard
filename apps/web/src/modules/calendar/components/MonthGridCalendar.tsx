import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Trash2, BookOpen, AlertCircle, UserX } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export interface CalendarEventItem {
  id: string | number;
  title: string;
  date: string;
  category?: string;
  type?: string;
  teacher?: string;
  description?: string;
  subject?: string;
  time?: string;
}

interface MonthGridCalendarProps {
  events: CalendarEventItem[];
  onSelectDate: (dateStr: string) => void;
  selectedDate: string;
  onDeleteEvent?: (id: string | number) => void;
}

export const MonthGridCalendar: React.FC<MonthGridCalendarProps> = ({
  events,
  onSelectDate,
  selectedDate,
  onDeleteEvent
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Obliczenie pierwszego dnia miesiąca i liczby dni
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Poniedziałek = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyPrefix = Array.from({ length: firstDayIndex }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date === dayStr);
  };

  const selectedDayEvents = events.filter((e) => e.date === selectedDate);

  const getCategoryBadge = (cat = '', type = '') => {
    const c = (cat || type).toLowerCase();
    if (c.includes('sprawdzian') || c.includes('exam')) {
      return { variant: 'rose' as const, label: 'Sprawdzian', icon: AlertCircle };
    }
    if (c.includes('kartkówka') || c.includes('quiz')) {
      return { variant: 'amber' as const, label: 'Kartkówka', icon: BookOpen };
    }
    if (c.includes('nieobecność') || c.includes('absence')) {
      return { variant: 'purple' as const, label: 'Nieobecność', icon: UserX };
    }
    return { variant: 'sky' as const, label: 'Wydarzenie', icon: CalendarIcon };
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-sky-500" />
          <span className="text-sm font-bold text-slate-800 dark:text-white">
            {monthNames[month]} {year}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
            {events.length} zaplanowanych
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Dziś
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-slate-400 py-1">
        <span>Pn</span>
        <span>Wt</span>
        <span>Śr</span>
        <span>Cz</span>
        <span>Pt</span>
        <span className="text-amber-500/70">Sb</span>
        <span className="text-rose-500/70">Nd</span>
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyPrefix.map((_, idx) => (
          <div key={`empty_${idx}`} className="h-20 rounded-2xl bg-transparent" />
        ))}

        {daysArray.map((day) => {
          const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dayDateStr;
          const dayEvents = getEventsForDay(day);
          const isToday = dayDateStr === new Date().toISOString().slice(0, 10);

          return (
            <button
              key={`day_${day}`}
              onClick={() => onSelectDate(dayDateStr)}
              className={`h-20 p-1.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-sky-500/15 border-sky-500/40 ring-2 ring-sky-500/20'
                  : isToday
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold font-mono ${
                  isSelected ? 'text-sky-400' : isToday ? 'text-amber-400 font-black' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                )}
              </div>

              {/* Event Mini Dots / Labels */}
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((ev, eIdx) => {
                  const meta = getCategoryBadge(ev.category, ev.type);
                  return (
                    <div
                      key={eIdx}
                      className={`text-[9px] truncate px-1 py-0.5 rounded font-medium ${
                        meta.variant === 'rose'
                          ? 'bg-rose-500/20 text-rose-300'
                          : meta.variant === 'amber'
                          ? 'bg-amber-500/20 text-amber-300'
                          : meta.variant === 'purple'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <span className="text-[8px] text-slate-500 font-mono block">+{dayEvents.length - 2} więcej</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Agenda View */}
      <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Agenda dla dnia: {selectedDate}
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {selectedDayEvents.length} zdarzeń
          </span>
        </div>

        {selectedDayEvents.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">Brak zaplanowanych wydarzeń i sprawdzianów w tym dniu.</p>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents.map((ev, idx) => {
              const meta = getCategoryBadge(ev.category, ev.type);
              const Icon = meta.icon;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start justify-between gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      meta.variant === 'rose'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : meta.variant === 'amber'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : meta.variant === 'purple'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{ev.title}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                      {ev.teacher && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Prowadzący: <span className="font-medium text-slate-700 dark:text-slate-300">{ev.teacher}</span>
                        </p>
                      )}
                      {ev.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {onDeleteEvent && (
                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="Usuń z terminarza"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
