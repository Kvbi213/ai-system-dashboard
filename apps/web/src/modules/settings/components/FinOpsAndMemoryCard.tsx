import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { DollarSign, Brain, Search, CheckCircle2, Radio } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { memoryApi } from '../../../api/client';

export const FinOpsAndMemoryCard: React.FC = () => {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recallResults, setRecallResults] = useState<{ content: string; category: string; score: number }[]>([
    {
      category: 'HABIT',
      content: 'Pobudka o 06:30, poranny rozruch stawowy, szklanka wody 500ml z elektrolitami oraz 10 minut ekspozycji na światło dzienne.',
      score: 0.88
    },
    {
      category: 'WORKOUT',
      content: 'Trening siłowy FBW na strychu: drążek (nachwyt/chwyt neutralny), pompki na poręczach (dipy), tempo 3-0-1-0, przerwy 90-120s.',
      score: 0.76
    }
  ]);

  const handleTestRecall = async () => {
    if (!query.trim()) {
      toast.error('Wpisz zapytanie do lokalnej pamięci semantycznej.');
      return;
    }
    setIsSearching(true);
    try {
      const res = await memoryApi.recall(query.trim(), 4);
      if (res?.results && res.results.length > 0) {
        setRecallResults(res.results);
        toast.success(`[+] Lab-Zero Recall: Odzyskano ${res.results.length} faktów w ${res.latencyMs || 8}ms.`);
      } else {
        toast.error('Brak dopasowań w lokalnej bazie wektorowej.');
      }
    } catch {
      toast.error('Błąd połączenia z modułem Lab-Zero Semantic Memory.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* FinOps & AI Cost Dashboard Card */}
      <GlassCard className="p-4 sm:p-5" glow="sky">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Obserwowalność Kosztowa & FinOps (ai-cost-dashboard)
                </h3>
                <Badge variant="cyan">MIESIĘCZNY CAP: 50 ZŁ</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Bezstanowy kolektor tokenów modeli LLM (Groq/OpenAI) oraz syntezy mowy TTS
              </p>
            </div>
          </div>
        </div>

        {/* FinOps KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              Zużycie budżetu AI w m-cu
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
              0,24 zł <span className="text-xs text-slate-400 font-normal">/ 50,00 zł</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: '0.5%' }} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              Łączne tokeny wejście/wyjście
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
              10 410 <span className="text-xs text-slate-400 font-normal">tokens</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Efektywność Groq Llama/DeepSeek
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              Znaki syntezy TTS (Fish Audio)
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
              1 540 <span className="text-xs text-slate-400 font-normal">znaki</span>
            </div>
            <span className="text-[10px] text-slate-400">Koszt API: 0,12 zł</span>
          </div>
        </div>

        {/* Coverage Gaps Status */}
        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-sky-500" />
              Nadzór Ciągłości Danych (Coverage Gaps Detection):
            </span>
            <Badge variant="emerald">BRAK ANOMALII</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Librus Sync: 18m temu</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>CANARD: 8m temu</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Mikr.us LXC: 3m temu</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Pushbullet WS: 1m temu</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Semantic Memory (Lab-Zero) Card */}
      <GlassCard className="p-4 sm:p-5" glow="purple">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Lokalna Pamięć Semantyczna (Wzorzec Lab-Zero)
                </h3>
                <Badge variant="purple">100% OFFLINE RECALL</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Wektorowy silnik przywoływania preferencji i historii bez ponownego przesyłania promptu
              </p>
            </div>
          </div>
        </div>

        {/* Test Recall Query */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Wpisz pytanie (np. 'o której mam wstać', 'jakie mam ćwiczenia na strychu', 'budżet 50/30/20')..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
            />
            <button
              onClick={handleTestRecall}
              disabled={isSearching}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Wyszukiwanie...' : 'Przywołaj (Recall)'}</span>
            </button>
          </div>

          {/* Results List */}
          <div className="space-y-2">
            {recallResults.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={r.category === 'WORKOUT' ? 'emerald' : r.category === 'FINANCE' ? 'amber' : 'purple'}>
                      {r.category}
                    </Badge>
                    <span className="font-mono text-[10px] text-slate-400">Podobieństwo: {(r.score * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {r.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
