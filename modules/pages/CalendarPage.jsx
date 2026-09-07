import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Trash2, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument } from '../services/cloudSync.js';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for calendar grid navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for the right panel (selected day)
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isCloudMode = typeof window !== 'undefined' && (window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com'));

  const getFallbackEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: '1', title: 'Start Systemu OmniDash', event_date: today, event_time: '09:00', priority: 'HIGH' }
    ];
  };

  useEffect(() => {
    const unsubscribe = subscribeCollection('calendar', (cloudEvents) => {
      if (Array.isArray(cloudEvents)) {
        setEvents(cloudEvents);
        setIsLoading(false);
      }
    }, getFallbackEvents());

    if (!isCloudMode) {
      axios.get('/api/calendar')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setEvents(res.data);
            res.data.forEach(e => saveCloudDocument('calendar', e.id, e));
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }

    return () => unsubscribe();
  }, [isCloudMode]);

  const deleteEvent = async (id) => {
    setEvents(prev => (Array.isArray(prev) ? prev : []).filter(e => e.id !== id));
    await deleteCloudDocument('calendar', id);
    if (!isCloudMode) {
      try {
        await axios.delete(`/api/calendar/${id}`);
      } catch (err) {
        console.warn('Błąd usuwania wydarzenia:', err.message);
      }
    }
  };

  // Helper to format date as YYYY-MM-DD
  const formatDateString = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
  const dayNames = ["Pon", "Wto", "Śro", "Czw", "Pią", "Sob", "Nie"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const jumpToDate = (dateString) => {
    const targetDate = new Date(dateString);
    setCurrentDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    setSelectedDate(targetDate);
  };

  const safeEvents = Array.isArray(events) ? events : [];

  // Generate grid cells
  const gridCells = [];
  // Empty cells before the 1st
  for (let i = 0; i < startDay; i++) {
    gridCells.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const iterDate = new Date(currentYear, currentMonth, i);
    const dateString = formatDateString(iterDate);
    const dayEvents = safeEvents.filter(e => e.event_date === dateString);
    const hasEvents = dayEvents.length > 0;
    
    const isSelected = formatDateString(selectedDate) === dateString;
    const isToday = formatDateString(new Date()) === dateString;

    gridCells.push(
      <button 
        key={`day-${i}`}
        onClick={() => setSelectedDate(iterDate)}
        className={`relative min-h-[44px] sm:min-h-[56px] md:min-h-[62px] p-1 sm:p-1.5 flex flex-col items-start justify-start border transition-all duration-200 active:scale-95 
          ${isSelected ? 'border-accentPrimary bg-accentPrimary/10 shadow-[inset_0_0_10px_rgba(var(--color-accent-primary),0.2)]' : 'border-border/50 glass-panel hover:bg-surface'}
        `}
      >
        <span className={`text-xs sm:text-sm font-mono font-bold ${isToday ? 'text-accentPrimary' : 'text-textPrimary'}`}>
          {i}
        </span>
        
        {hasEvents && (
          <div className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 flex gap-0.5 sm:gap-1">
            {dayEvents.map((_, idx) => (
              <div key={idx} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accentPrimary shadow-[0_0_5px_rgba(var(--color-accent-primary),0.8)]"></div>
            ))}
          </div>
        )}

        <div className="hidden sm:flex mt-1 w-full flex-col gap-0.5 overflow-hidden">
          {dayEvents.slice(0, 2).map((ev) => (
            <div key={ev.id} className="text-[9px] uppercase font-mono tracking-wider truncate text-accentPrimary/90 bg-accentPrimary/10 px-1 rounded">
              {ev.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-[9px] text-textMuted font-mono">+{dayEvents.length - 2} więcej</div>
          )}
        </div>
      </button>
    );
  }

  // Right panel logic
  const selectedDateString = formatDateString(selectedDate);
  const selectedDayEvents = safeEvents.filter(e => e.event_date === selectedDateString);

  // Bottom panel logic
  const todayString = formatDateString(new Date());
  const upcomingEvents = safeEvents.filter(e => e.event_date >= todayString).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  return (
    <div className="w-full h-full flex flex-col gap-4 sm:gap-6 relative z-10 animate-soft-enter overflow-y-auto custom-scrollbar pb-24 md:pb-8">
      <header className="glass-panel p-4 sm:p-5 rounded-xl border border-border flex items-center gap-3 sm:gap-4 flex-shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
          <CalendarIcon className="w-5 h-5 text-textPrimary" />
        </div>
        <div className="flex flex-col">
          <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
            <span className="flex items-center text-base sm:text-lg font-medium text-textMuted/70">OmniDash</span>
            <span className="shrink-0 text-base sm:text-lg font-medium text-textMuted/70">/</span>
            <span className="flex items-center text-base sm:text-lg font-medium text-textPrimary">Kalendarz</span>
          </nav>
          <p className="font-sans text-xs text-textMuted mt-0.5">System zarządzania czasem</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col xl:flex-row gap-4 sm:gap-6 min-h-0">
        
        {/* LIFT: MAIN CALENDAR GRID */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-0 sm:pr-2">
          
          {/* Header Kalendarza (Nawigacja) */}
          <div className="glass-panel p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl border border-border border-b-0 flex items-center justify-between shrink-0">
            <h2 className="text-lg sm:text-2xl font-bold font-mono text-accentPrimary tracking-tight">
              {monthNames[currentMonth]} <span className="text-textPrimary">{currentYear}</span>
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button onClick={prevMonth} className="p-1.5 sm:p-2 glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors active:scale-95">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-xs sm:text-sm uppercase glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors active:scale-95">
                Dziś
              </button>
              <button onClick={nextMonth} className="p-1.5 sm:p-2 glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors active:scale-95">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Dni tygodnia */}
          <div className="grid grid-cols-7 glass-panel border-x border-t border-border/50 shrink-0">
            {dayNames.map(day => (
              <div key={day} className="py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-mono font-bold tracking-wider text-textMuted uppercase border-b border-border/50">
                {day}
              </div>
            ))}
          </div>

          {/* Siatka Dni */}
          <div className="grid grid-cols-7 glass-panel border border-border/50 rounded-b-xl sm:rounded-b-2xl overflow-hidden shrink-0">
            {gridCells}
          </div>

          {/* Nadchodzące Wydarzenia pod siatką */}
          <div className="mt-6 flex flex-col shrink-0 mb-6">
             <h3 className="text-lg font-mono font-bold tracking-widest uppercase text-textMuted mb-4 flex items-center gap-2">
               <AlertCircle className="w-5 h-5" />
               Najbliższe Wydarzenia
             </h3>
             {upcomingEvents.length === 0 ? (
               <div className="p-4 glass-panel rounded-xl border border-border/50 text-textMuted font-mono text-sm">
                 Brak zaplanowanych wydarzeń w przyszłości.
               </div>
             ) : (
               <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                 {upcomingEvents.map(ev => (
                   <button 
                     key={`upc-${ev.id}`} 
                     onClick={() => jumpToDate(ev.event_date)}
                     className="shrink-0 w-64 p-4 glass-panel border border-border hover:border-accentPrimary/50 rounded-xl text-left transition-all group"
                   >
                     <div className="flex items-center gap-2 text-accentPrimary font-mono text-xs mb-2">
                       <Clock className="w-3 h-3" />
                       {ev.event_date}
                     </div>
                     <h4 className="font-bold text-textPrimary truncate group-hover:text-accentPrimary transition-colors">{ev.title}</h4>
                   </button>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* RIGHT: SELECTED DAY DETAILS */}
        <div className="w-full xl:w-96 glass-panel rounded-2xl border border-border flex flex-col shrink-0 min-h-[260px] xl:h-auto overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border bg-surface/30">
            <h3 className="font-mono text-xs sm:text-sm tracking-widest text-textMuted uppercase mb-1">Wybrana Data</h3>
            <div className="text-xl sm:text-2xl font-bold text-accentPrimary">
              {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </div>
            {formatDateString(selectedDate) === formatDateString(new Date()) && (
              <div className="inline-block mt-2 px-2 py-0.5 sm:py-1 bg-accentPrimary/20 text-accentPrimary text-xs font-mono rounded uppercase tracking-wider border border-accentPrimary/30">
                Dzisiaj
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            {selectedDayEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-textMuted font-mono space-y-3 py-6 opacity-50">
                <CalendarIcon className="w-8 h-8 sm:w-12 sm:h-12" />
                <p className="text-xs sm:text-sm">Brak aktywności tego dnia.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4">
                {selectedDayEvents.map(ev => (
                  <div key={`det-${ev.id}`} className="p-3 sm:p-4 rounded-xl bg-surface/50 border border-border group relative">
                    <button 
                      onClick={() => deleteEvent(ev.id)} 
                      className="absolute top-3 sm:top-4 right-3 sm:right-4 text-textMuted hover:text-red-500 transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100 p-1"
                      title="Usuń wydarzenie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className="font-bold text-textPrimary pr-6 mb-2">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-sm text-textMuted leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarPage;
