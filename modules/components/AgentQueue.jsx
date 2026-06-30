import React, { useState, useEffect } from 'react';
import { ListTree, Clock, Activity, Loader2 } from 'lucide-react';
import axios from 'axios';

const AgentQueue = () => {
  const [scheduleData, setScheduleData] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data } = await axios.get('/api/schedule');
        setScheduleData(data);
      } catch (err) {
        console.error("Błąd pobierania /api/schedule", err);
        setScheduleData({ jobs: [], count: 0 });
      }
    };
    
    fetchSchedule();
    const iv = setInterval(fetchSchedule, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="glass-panel p-5 rounded-xl border border-border flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center gap-3 mb-5 border-b border-border/50 pb-3">
        <div className="p-2 rounded-lg bg-accentPrimary/10 border border-accentPrimary/20">
          <ListTree className="w-5 h-5 text-accentPrimary" />
        </div>
        <div>
          <h3 className="font-mono text-sm font-bold text-textPrimary">Agent Task Queue</h3>
          <p className="text-[10px] text-textMuted uppercase tracking-wider">
            {scheduleData ? `ZAPLANOWANE: ${scheduleData.count}` : 'Ładowanie danych...'}
          </p>
        </div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {!scheduleData && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="w-6 h-6 text-accentPrimary animate-spin" />
          </div>
        )}

        {scheduleData && scheduleData.jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
            <Activity className="w-6 h-6 text-textMuted" />
            <p className="text-xs font-mono text-textMuted">Kolejka pusta. System nasłuchuje.</p>
          </div>
        )}

        {scheduleData && scheduleData.jobs.map((job, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-accentPrimary/30 bg-accentPrimary/5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs font-bold text-accentPrimary flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> {job.title}
              </span>
              <span className="font-mono text-[10px] text-textPrimary uppercase bg-black/40 px-2 py-0.5 rounded">
                {job.type}
              </span>
            </div>
            <p className="text-[10px] text-textMuted flex items-center gap-1.5 mt-2">
              <Clock className="w-3 h-3" />
              Oczekuje na wykonanie {job.type === 'daily' ? `o ${job.hour.toString().padStart(2, '0')}:${job.minute.toString().padStart(2, '0')}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentQueue;
