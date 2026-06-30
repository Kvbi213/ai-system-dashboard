import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Trash2, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for calendar grid navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for the right panel (selected day)
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchEvents = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/calendar');
      setEvents(data);
    } catch (err) {
      console.error('Błąd pobierania kalendarza', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/calendar/${id}`);
      fetchEvents();
    } catch (err) {
      console.error('Błąd usuwania wydarzenia', err);
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
    const dayEvents = events.filter(e => e.event_date === dateString);
    const hasEvents = dayEvents.length > 0;
    
    const isSelected = formatDateString(selectedDate) === dateString;
    const isToday = formatDateString(new Date()) === dateString;

    gridCells.push(
      <button 
        key={`day-${i}`}
        onClick={() => setSelectedDate(iterDate)}
        className={`relative min-h-[80px] p-2 flex flex-col items-start justify-start border transition-all duration-200 
          ${isSelected ? 'border-accentPrimary bg-accentPrimary/10 shadow-[inset_0_0_10px_rgba(var(--color-accent-primary),0.2)]' : 'border-border/50 glass-panel hover:bg-surface'}
        `}
      >
        <span className={`text-sm font-mono font-bold ${isToday ? 'text-accentPrimary' : 'text-textPrimary'}`}>
          {i}
        </span>
        
        {hasEvents && (
          <div className="absolute top-2 right-2 flex gap-1">
            {dayEvents.map((_, idx) => (
              <div key={idx} className="w-2 h-2 rounded-full bg-accentPrimary shadow-[0_0_5px_rgba(var(--color-accent-primary),0.8)]"></div>
            ))}
          </div>
        )}

        <div className="mt-2 w-full flex flex-col gap-1 overflow-hidden">
          {dayEvents.slice(0, 2).map((ev) => (
            <div key={ev.id} className="text-[10px] uppercase font-mono tracking-wider truncate text-accentPrimary/80 bg-accentPrimary/10 px-1 rounded">
              {ev.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-[10px] text-textMuted font-mono">+{dayEvents.length - 2} więcej</div>
          )}
        </div>
      </button>
    );
  }

  // Right panel logic
  const selectedDateString = formatDateString(selectedDate);
  const selectedDayEvents = events.filter(e => e.event_date === selectedDateString);

  // Bottom panel logic
  const todayString = formatDateString(new Date());
  const upcomingEvents = events.filter(e => e.event_date >= todayString).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  return (
    <div className="w-full h-full flex flex-col relative z-10 animate-fade-in overflow-hidden">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-accentPrimary/20 flex items-center justify-center border border-accentPrimary shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)]">
          <CalendarIcon className="w-6 h-6 text-accentPrimary" />
        </div>
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight text-textPrimary">Terminarz</h1>
          <p className="text-textMuted text-sm tracking-widest uppercase">System zarządzania czasem</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
        
        {/* LIFT: MAIN CALENDAR GRID */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2">
          
          {/* Header Kalendarza (Nawigacja) */}
          <div className="glass-panel p-4 rounded-t-2xl border border-border border-b-0 flex items-center justify-between shrink-0">
            <h2 className="text-2xl font-bold font-mono text-accentPrimary tracking-tight">
              {monthNames[currentMonth]} <span className="text-textPrimary">{currentYear}</span>
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 font-mono text-sm uppercase glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors">
                Dziś
              </button>
              <button onClick={nextMonth} className="p-2 glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dni tygodnia */}
          <div className="grid grid-cols-7 glass-panel border-x border-t border-border/50 shrink-0">
            {dayNames.map(day => (
              <div key={day} className="py-2 text-center text-xs font-mono font-bold tracking-widest text-textMuted uppercase border-b border-border/50">
                {day}
              </div>
            ))}
          </div>

          {/* Siatka Dni */}
          <div className="grid grid-cols-7 glass-panel border border-border/50 rounded-b-2xl overflow-hidden shrink-0">
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
        <div className="w-full xl:w-96 glass-panel rounded-2xl border border-border flex flex-col shrink-0 h-[400px] xl:h-auto overflow-hidden">
          <div className="p-6 border-b border-border bg-surface/30">
            <h3 className="font-mono text-sm tracking-widest text-textMuted uppercase mb-1">Wybrana Data</h3>
            <div className="text-2xl font-bold text-accentPrimary">
              {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </div>
            {formatDateString(selectedDate) === formatDateString(new Date()) && (
              <div className="inline-block mt-2 px-2 py-1 bg-accentPrimary/20 text-accentPrimary text-xs font-mono rounded uppercase tracking-wider border border-accentPrimary/30">
                Dzisiaj
              </div>
            )}
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {selectedDayEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-textMuted font-mono space-y-4 opacity-50">
                <CalendarIcon className="w-12 h-12" />
                <p className="text-sm">Brak aktywności tego dnia.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedDayEvents.map(ev => (
                  <div key={`det-${ev.id}`} className="p-4 rounded-xl bg-surface/50 border border-border group relative">
                    <button 
                      onClick={() => deleteEvent(ev.id)} 
                      className="absolute top-4 right-4 text-textMuted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
