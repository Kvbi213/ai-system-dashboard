import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Bot, 
  Play, 
  Square, 
  RefreshCw, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Search
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

const AgentControlWidget = () => {
  const [activeJob, setActiveJob] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [goalInput, setGoalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isSendingPhone, setIsSendingPhone] = useState(false);

  const toast = useToast ? useToast() : null;

  const fetchJobStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/agent/jobs');
      if (res.data) {
        setActiveJob(res.data.active || null);
        setJobHistory(res.data.jobs || []);
      }
    } catch (err) {
      // Ignoruj błędy sieciowe przy wyłączonym serwerze lokalnym
    }
  }, []);

  useEffect(() => {
    fetchJobStatus();
    // Odpytuj częściej (co 4s) gdy zadanie jest aktywne, rzadziej (co 12s) gdy bezczynny
    const intervalTime = activeJob ? 4000 : 12000;
    const timer = setInterval(fetchJobStatus, intervalTime);
    return () => clearInterval(timer);
  }, [fetchJobStatus, activeJob]);

  const handleStartResearch = async (e) => {
    e?.preventDefault();
    if (!goalInput.trim()) return;

    setIsStarting(true);
    try {
      const res = await axios.post('/api/agent/research', {
        goal: goalInput.trim(),
        priority: 'HIGH',
        notify_mode: 'milestones'
      });
      if (res.data?.success) {
        toast?.showSuccess?.('Uruchomiono zadanie badawcze w tle!');
        setGoalInput('');
        fetchJobStatus();
      }
    } catch (err) {
      toast?.showError?.(err.response?.data?.error || 'Nie udało się uruchomić zadania.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleAbort = async () => {
    setIsStopping(true);
    try {
      await axios.post('/api/agent/abort');
      toast?.showSuccess?.('Wysłano polecenie zatrzymania agenta.');
      fetchJobStatus();
    } catch (err) {
      toast?.showError?.('Błąd zatrzymywania agenta.');
    } finally {
      setIsStopping(false);
    }
  };

  const handleSendPhoneStatus = async () => {
    setIsSendingPhone(true);
    try {
      await axios.post('/api/agent/status-inquiry');
      toast?.showSuccess?.('Wysłano raport o stanie na Twój telefon!');
    } catch (err) {
      toast?.showError?.('Nie udało się wysłać raportu na telefon.');
    } finally {
      setIsSendingPhone(false);
    }
  };

  const isExecuting = activeJob && (activeJob.status === 'executing' || activeJob.status === 'queued');

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl text-white flex flex-col justify-between">
      {/* Nagłówek */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isExecuting ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base tracking-wide flex items-center gap-2">
              OmniDaemon 24/7
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isExecuting 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isExecuting ? '● PRACA W TOKU' : '● BEZCZYNNOŚĆ'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Autonomiczny agent ciągły & raportowanie na telefon</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchJobStatus}
            disabled={isLoading}
            title="Odśwież stan agenta"
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Aktywne zadanie lub stan bezczynności */}
      <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/70 mb-4">
        {isExecuting ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                {activeJob.current_step || 'Wykonywanie analizy...'}
              </span>
              <span className="text-xs font-bold text-white bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/50">
                {activeJob.progress_percent || 0}%
              </span>
            </div>

            <p className="text-sm font-medium text-slate-200 mb-3 line-clamp-2">
              {activeJob.goal}
            </p>

            {/* Pasek postępu */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, activeJob.progress_percent || 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Iteracja: {activeJob.iteration_count || 0}/{activeJob.max_iterations || 10}
              </span>
              <span className="text-slate-400">Powiadomienia: Aktywne</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-slate-400 mb-1">Agent nasłuchuje poleceń ze smartfona lub panelu.</p>
            <p className="text-xs text-slate-500">Napisz na telefonie np. <span className="text-slate-300 font-mono">Omni: zbadaj modele AI</span> lub zleć poniżej:</p>
          </div>
        )}
      </div>

      {/* Formularz zlecenia zadania */}
      <form onSubmit={handleStartResearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="Zleć badanie (np. Przyszłość modeli AI)..."
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        <button
          type="submit"
          disabled={isStarting || !goalInput.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isStarting ? 'Planowanie...' : 'Start'}
        </button>
      </form>

      {/* Przyciski kontrolne */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSendPhoneStatus}
          disabled={isSendingPhone}
          title="Wyślij natychmiastowe podsumowanie na telefon przez Pushbullet"
          className="flex-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-medium py-2 px-3 rounded-xl border border-slate-700/50 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          {isSendingPhone ? 'Wysyłanie...' : 'Wyślij Stan na Tel'}
        </button>

        {isExecuting && (
          <button
            onClick={handleAbort}
            disabled={isStopping}
            title="Awaryjne zatrzymanie agenta (Kill Switch)"
            className="bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 hover:text-white text-xs font-medium py-2 px-3 rounded-xl border border-rose-800/60 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            {isStopping ? 'Zatrzymywanie...' : 'Stop'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AgentControlWidget;
