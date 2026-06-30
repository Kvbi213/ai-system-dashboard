import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Activity, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s temu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h temu`;
  return `${Math.floor(diff / 86400)}d temu`;
}

const NewsFeed = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/logs');
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const iv = setInterval(fetchLogs, 60000);
    const tickIv = setInterval(() => setTick(t => t + 1), 30000);
    return () => { clearInterval(iv); clearInterval(tickIv); };
  }, [fetchLogs]);

  return (
    <div className="glass-panel h-full rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3 border-b border-border pb-2.5 flex-shrink-0">
        <Activity className="text-accentSecondary w-4 h-4" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-textMuted flex-1">System Intel Log</h2>
        <span className="w-2 h-2 rounded-full bg-accentSecondary/60 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {loading ? (
          <div className="h-16 skeleton rounded w-full" />
        ) : logs.length === 0 ? (
          <div className="text-center text-textMuted text-xs font-mono mt-4">Oczekiwanie na pierwszy cykl AI...</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="group border-l-2 border-border hover:border-accentSecondary pl-3 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-textMuted flex-shrink-0" />
                <span className="text-[10px] font-mono text-textMuted">{timeAgo(log.created_at)}</span>
              </div>
              <div className="text-xs font-sans text-textPrimary/80 group-hover:text-textPrimary transition-colors leading-relaxed prose prose-xs prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ ...props }) => <p className="mb-0.5" {...props} />,
                    a: ({ ...props }) => <a className="text-accentSecondary underline" target="_blank" rel="noreferrer" {...props} />,
                    strong: ({ ...props }) => <strong className="text-textPrimary font-semibold" {...props} />,
                  }}
                >
                  {log.content}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
