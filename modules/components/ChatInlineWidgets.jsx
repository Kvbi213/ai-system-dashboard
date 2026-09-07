import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Clock, MapPin, User, ArrowUpRight, 
  Wallet, TrendingUp, TrendingDown, PieChart, 
  Dumbbell, Flame, Calendar as CalendarIcon, Tag, CheckCircle2, Trash2 
} from 'lucide-react';
import { subscribeCollection, deleteCloudDocument } from '../services/cloudSync';

const DAY_MAP = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

const DAY_NAMES = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela'
};

/**
 * Widżet Planu Lekcji w oknie czatu AI
 */
export const TimetableChatWidget = () => {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(() => {
    try {
      const cached = localStorage.getItem('cloud_cache_timetable');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const unsub = subscribeCollection('timetable', (data) => {
      if (Array.isArray(data)) setTimetable(data);
    });

    const handler = (e) => {
      if (e.detail?.collection === 'timetable') {
        try {
          const cached = localStorage.getItem('cloud_cache_timetable');
          if (cached) setTimetable(JSON.parse(cached));
        } catch {}
      }
    };
    window.addEventListener('cloudDataChanged', handler);
    return () => {
      unsub();
      window.removeEventListener('cloudDataChanged', handler);
    };
  }, []);

  const todayId = DAY_MAP[new Date().getDay()];
  const isWeekend = todayId === 'saturday' || todayId === 'sunday';
  
  // Jeśli weekend, sprawdź zajęcia na poniedziałek jako nadchodzące
  const targetDayId = isWeekend ? 'monday' : todayId;
  const targetDayName = DAY_NAMES[targetDayId] || targetDayId;

  const dayLessons = useMemo(() => {
    return timetable
      .filter(l => l.day === targetDayId || l.day?.toLowerCase() === targetDayName.toLowerCase())
      .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));
  }, [timetable, targetDayId, targetDayName]);

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-border/80 bg-surface/90 shadow-xl w-full sm:w-[360px] md:w-[390px] flex flex-col gap-3.5 pointer-events-auto">
      <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-textPrimary">Plan Lekcji</h4>
            <span className="text-[11px] text-textMuted">{targetDayName} {isWeekend ? '(Najbliższy dzień)' : '(Dziś)'}</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/timetable')}
          className="flex items-center gap-1 text-[11px] font-mono text-accentPrimary hover:underline"
        >
          Otwórz <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {dayLessons.length === 0 ? (
        <div className="py-4 text-center text-textMuted text-xs font-sans">
          <p>Brak zaplanowanych zajęć na {targetDayName}.</p>
          <span className="text-[11px] text-accentSecondary/80">Czas wolny lub brak wpisów w bazie.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
          {dayLessons.slice(0, 4).map((lesson, idx) => (
            <div key={lesson.id || idx} className="p-2.5 rounded-xl border border-border/60 bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-textPrimary truncate">{lesson.subject}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-accentPrimary">
                  {lesson.time_start || '08:00'} - {lesson.time_end || '09:30'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-textMuted">
                {lesson.room && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-textMuted/70" /> {lesson.room}
                  </span>
                )}
                {lesson.teacher && (
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-textMuted/70" /> {lesson.teacher}
                  </span>
                )}
              </div>
            </div>
          ))}
          {dayLessons.length > 4 && (
            <span className="text-[10px] text-center text-textMuted font-mono">
              + jeszcze {dayLessons.length - 4} zajęć w planie
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Widżet Finansów i Budżetu 50/30/20 w oknie czatu AI
 */
export const FinanceChatWidget = () => {
  const navigate = useNavigate();
  const [finances, setFinances] = useState(() => {
    try {
      const cached = localStorage.getItem('cloud_cache_finances');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState({
    needs_percent: 50,
    wants_percent: 30,
    savings_percent: 20
  });

  useEffect(() => {
    const unsub = subscribeCollection('finances', (data) => {
      if (Array.isArray(data)) {
        const settingsDoc = data.find(d => d && (d.id === 'finance_settings' || d.is_settings));
        if (settingsDoc) {
          setSettings({
            needs_percent: Number(settingsDoc.needs_percent) || 50,
            wants_percent: Number(settingsDoc.wants_percent) || 30,
            savings_percent: Number(settingsDoc.savings_percent) || 20
          });
        }
        const txs = data.filter(d => d && d.id !== 'finance_settings' && !d.is_settings && d.amount !== undefined);
        setFinances(txs);
      }
    });

    const handler = (e) => {
      if (e.detail?.collection === 'finances') {
        try {
          const cached = localStorage.getItem('cloud_cache_finances');
          if (cached) {
            const parsed = JSON.parse(cached);
            setFinances(parsed.filter(d => d && d.id !== 'finance_settings' && !d.is_settings));
          }
        } catch {}
      }
    };
    window.addEventListener('cloudDataChanged', handler);
    return () => {
      unsub();
      window.removeEventListener('cloudDataChanged', handler);
    };
  }, []);

  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let buckets = { needs: 0, wants: 0, savings: 0 };

    finances.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'income') {
        income += amt;
      } else {
        expenses += amt;
        const b = (item.bucket || '').toLowerCase();
        if (b === 'wants' || b === 'zachcianki') buckets.wants += amt;
        else if (b === 'savings' || b === 'oszczędności' || b === 'oszczednosci') buckets.savings += amt;
        else buckets.needs += amt;
      }
    });

    const balance = income - expenses;
    const needsPct = expenses > 0 ? Math.min(100, Math.round((buckets.needs / expenses) * 100)) : 0;
    const wantsPct = expenses > 0 ? Math.min(100, Math.round((buckets.wants / expenses) * 100)) : 0;
    const savingsPct = expenses > 0 ? Math.min(100, Math.round((buckets.savings / expenses) * 100)) : 0;

    return { income, expenses, balance, buckets, needsPct, wantsPct, savingsPct };
  }, [finances]);

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-border/80 bg-surface/90 shadow-xl w-full sm:w-[360px] md:w-[390px] flex flex-col gap-3.5 pointer-events-auto">
      <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-textPrimary">Stan Budżetu</h4>
            <span className="text-[11px] text-textMuted">Zasada 50/30/20</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/finances')}
          className="flex items-center gap-1 text-[11px] font-mono text-accentPrimary hover:underline"
        >
          Finanse <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-xl border border-border/60 bg-white/[0.02] flex flex-col">
          <span className="text-[10px] font-mono text-textMuted uppercase">Saldo Bieżące</span>
          <span className={`text-base font-bold font-mono mt-0.5 ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(2)} <span className="text-[11px]">PLN</span>
          </span>
        </div>
        <div className="p-2.5 rounded-xl border border-border/60 bg-white/[0.02] flex flex-col">
          <span className="text-[10px] font-mono text-textMuted uppercase">Wydatki</span>
          <span className="text-base font-bold font-mono mt-0.5 text-rose-400">
            -{stats.expenses.toFixed(2)} <span className="text-[11px]">PLN</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-border/40 text-[11px] font-mono">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-textMuted">
            <span>Potrzeby ({settings.needs_percent}%)</span>
            <span className="text-textPrimary">{stats.buckets.needs.toFixed(2)} PLN ({stats.needsPct}%)</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${stats.needsPct}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-textMuted">
            <span>Zachcianki ({settings.wants_percent}%)</span>
            <span className="text-textPrimary">{stats.buckets.wants.toFixed(2)} PLN ({stats.wantsPct}%)</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${stats.wantsPct}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-textMuted">
            <span>Oszczędności ({settings.savings_percent}%)</span>
            <span className="text-textPrimary">{stats.buckets.savings.toFixed(2)} PLN ({stats.savingsPct}%)</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${stats.savingsPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Widżet Treningów w oknie czatu AI
 */
export const WorkoutsChatWidget = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState(() => {
    try {
      const cached = localStorage.getItem('cloud_cache_workouts');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const unsub = subscribeCollection('workouts', (data) => {
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setWorkouts(sorted);
      }
    });

    const handler = (e) => {
      if (e.detail?.collection === 'workouts') {
        try {
          const cached = localStorage.getItem('cloud_cache_workouts');
          if (cached) setWorkouts(JSON.parse(cached));
        } catch {}
      }
    };
    window.addEventListener('cloudDataChanged', handler);
    return () => {
      unsub();
      window.removeEventListener('cloudDataChanged', handler);
    };
  }, []);

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-border/80 bg-surface/90 shadow-xl w-full sm:w-[350px] md:w-[380px] flex flex-col gap-3.5 pointer-events-auto">
      <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-textPrimary">Aktywność Fizyczna</h4>
            <span className="text-[11px] text-textMuted">Zarejestrowano: {workouts.length} sesji</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/workouts')}
          className="flex items-center gap-1 text-[11px] font-mono text-accentPrimary hover:underline"
        >
          Treningi <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="py-4 text-center text-textMuted text-xs font-sans">
          <p>Brak zapisanych treningów w rejestrze.</p>
          <span className="text-[11px] text-accentSecondary/80">Wpisz "dodaj trening" aby zarejestrować aktywność.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
          {workouts.slice(0, 3).map((w, idx) => (
            <div key={w.id || idx} className="p-2.5 rounded-xl border border-border/60 bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-semibold text-xs text-textPrimary truncate">{w.title}</span>
                <span className="text-[10px] text-textMuted font-mono">{w.date || 'ostatnio'} • {w.type || 'Siłowy'}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                {w.type || 'Trening'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Widżet Kalendarza w oknie czatu AI
 */
export const CalendarChatWidget = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState(() => {
    try {
      const cached = localStorage.getItem('cloud_cache_calendar');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const unsub = subscribeCollection('calendar', (data) => {
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => new Date(a.event_date || a.date || 0) - new Date(b.event_date || b.date || 0));
        setEvents(sorted);
      }
    });

    const handler = (e) => {
      if (e.detail?.collection === 'calendar') {
        try {
          const cached = localStorage.getItem('cloud_cache_calendar');
          if (cached) setEvents(JSON.parse(cached));
        } catch {}
      }
    };
    window.addEventListener('cloudDataChanged', handler);
    return () => {
      unsub();
      window.removeEventListener('cloudDataChanged', handler);
    };
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(e => (e.event_date || e.date || '') >= today)
      .slice(0, 4);
  }, [events]);

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-border/80 bg-surface/90 shadow-xl w-full sm:w-[350px] md:w-[380px] flex flex-col gap-3.5 pointer-events-auto">
      <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-textPrimary">Kalendarz</h4>
            <span className="text-[11px] text-textMuted">Nadchodzące wydarzenia</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-1 text-[11px] font-mono text-accentPrimary hover:underline"
        >
          Kalendarz <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="py-4 text-center text-textMuted text-xs font-sans">
          <p>Brak zaplanowanych wydarzeń w najbliższym czasie.</p>
          <span className="text-[11px] text-accentSecondary/80">Wpisz "dodaj wydarzenie [data]" aby zaplanować termin.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
          {upcomingEvents.map((ev, idx) => (
            <div key={ev.id || idx} className="p-2.5 rounded-xl border border-border/60 bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-semibold text-xs text-textPrimary truncate">{ev.title}</span>
                <span className="text-[10px] text-textMuted font-mono">
                  {ev.event_date || ev.date} {ev.event_time ? `• ${ev.event_time}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  ev.priority === 'HIGH' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                  ev.priority === 'LOW' ? 'bg-slate-500/15 text-slate-400 border-slate-500/30' :
                  'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                }`}>
                  {ev.priority || 'MED'}
                </span>
                <button
                  onClick={() => {
                    deleteCloudDocument('calendar', ev.id);
                    setEvents(prev => prev.filter(x => x.id !== ev.id));
                    window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'calendar' } }));
                  }}
                  className="p-1 rounded text-textMuted hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                  title="Usuń to wydarzenie"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
