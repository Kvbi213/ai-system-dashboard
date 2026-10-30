import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Calendar, Clock, CheckCircle2, CircleDot, Sparkles, ArrowRight } from 'lucide-react';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  category: string;
  status: 'done' | 'current' | 'upcoming';
  room?: string;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: '1', time: '07:15 - 07:45', title: 'Tranzyt & Monitoring tras drogowych', category: 'Logistyka', status: 'done' },
  { id: '2', time: '08:00 - 13:20', title: 'Blok zajęć: Systemy operacyjne & sieci', category: 'Edukacja', status: 'current', room: 'A-204' },
  { id: '3', time: '14:00 - 14:45', title: 'Trening siłowy FBW (Kalistenika)', category: 'Sport', status: 'upcoming' },
  { id: '4', time: '16:00 - 17:30', title: 'Sprint projektowy & przegląd finansów', category: 'Dev', status: 'upcoming' },
  { id: '5', time: '19:00 - 20:30', title: 'Literatura techniczna & kognitywistyka', category: 'Wiedza', status: 'upcoming' }
];

export const DailyTimelineWidget: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GlassCard className="p-3 sm:p-4" glow="sky">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Oś Czasu Dnia (Timeline)</h3>
            <p className="text-xs text-slate-500 font-medium">Harmonogram dobowy</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            5 bloków
          </span>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-xs transition"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Czat AI</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {TIMELINE_EVENTS.map((event) => {
          const isDone = event.status === 'done';
          const isCurrent = event.status === 'current';

          return (
            <div key={event.id} className="relative flex items-start gap-3 pl-1 group">
              {/* Node Indicator */}
              <div className="relative z-10 shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 bg-white rounded-full" />
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-sky-400 opacity-75"></span>
                    <CircleDot className="w-5 h-5 text-sky-600 bg-white rounded-full relative" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center" />
                )}
              </div>

              {/* Event Content Box */}
              <div
                className={`flex-1 p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-sky-50/90 border-sky-300 shadow-sm'
                    : isDone
                    ? 'bg-slate-50/70 border-slate-200 opacity-80'
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-500">{event.time}</span>
                  <div className="flex items-center gap-1.5">
                    {event.room && (
                      <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                        {event.room}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isCurrent
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isCurrent ? 'Trwa teraz' : event.category}
                    </span>
                  </div>
                </div>

                <div className={`text-xs font-bold mt-1 ${isCurrent ? 'text-sky-950 font-extrabold' : 'text-slate-800'}`}>
                  {event.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
