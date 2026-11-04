import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Brain, CheckSquare, DollarSign, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { memoryApi, tasksApi, financeApi, schoolApi } from '../../api/client';

interface SearchResultItem {
  id: string;
  category: 'PAMIĘĆ AI' | 'ZADANIA' | 'FINANSE' | 'SZKOŁA' | 'HARMONOGRAM';
  title: string;
  snippet: string;
  targetPath: string;
}

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const matched: SearchResultItem[] = [];
      const q = query.toLowerCase();

      try {
        // 1. Pamięć Lab-Zero
        try {
          const memRes = await memoryApi.recall(query, 3, 0.2);
          if (memRes && memRes.results) {
            memRes.results.forEach((r, idx) => {
              matched.push({
                id: `mem_${idx}`,
                category: 'PAMIĘĆ AI',
                title: `Fakt kognitywny (${r.category})`,
                snippet: r.content,
                targetPath: '/memory'
              });
            });
          }
        } catch {}

        // 2. Zadania
        try {
          const tasksRes = await tasksApi.getAll();
          if (tasksRes && tasksRes.tasks) {
            tasksRes.tasks
              .filter((t) => t.title.toLowerCase().includes(q))
              .forEach((t) => {
                matched.push({
                  id: `task_${t.id}`,
                  category: 'ZADANIA',
                  title: t.title,
                  snippet: `Priorytet: ${t.priority} | Kategoria: ${t.category} | ${t.completed ? 'Ukończone' : 'Do zrobienia'}`,
                  targetPath: '/'
                });
              });
          }
        } catch {}

        // 3. Finanse
        try {
          const finRes = await financeApi.getTransactions();
          if (finRes && finRes.transactions) {
            finRes.transactions
              .filter((tx) => tx.title.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q))
              .forEach((tx) => {
                matched.push({
                  id: `tx_${tx.id}`,
                  category: 'FINANSE',
                  title: tx.title,
                  snippet: `Kwota: ${tx.amount} PLN | Koperta: ${tx.envelope} | Kategoria: ${tx.category}`,
                  targetPath: '/finance'
                });
              });
          }
        } catch {}

        // 4. Szkoła & Oceny
        try {
          const gradesRes = await schoolApi.getGrades();
          if (gradesRes && gradesRes.grades) {
            gradesRes.grades
              .filter((g) => g.subject.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
              .forEach((g) => {
                matched.push({
                  id: `grade_${g.id}`,
                  category: 'SZKOŁA',
                  title: `${g.subject}: Ocena ${g.grade}`,
                  snippet: `Waga: ${g.weight} | Opis: ${g.description} | Nauczyciel: ${g.teacher || 'Brak'}`,
                  targetPath: '/grades'
                });
              });
          }
        } catch {}

        setResults(matched);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = results.filter((r) => {
    if (activeCategory === 'ALL') return true;
    return r.category === activeCategory;
  });

  const getCategoryBadge = (cat: SearchResultItem['category']) => {
    switch (cat) {
      case 'PAMIĘĆ AI':
        return { variant: 'purple' as const, icon: Brain };
      case 'ZADANIA':
        return { variant: 'sky' as const, icon: CheckSquare };
      case 'FINANSE':
        return { variant: 'amber' as const, icon: DollarSign };
      case 'SZKOŁA':
        return { variant: 'rose' as const, icon: BookOpen };
      default:
        return { variant: 'slate' as const, icon: Clock };
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <PageHeader
        icon={Search}
        title="Uniwersalna Wyszukiwarka Systemowa"
        subtitle="Szybkie przeszukiwanie pamięci AI, zadań, transakcji finansowych i ocen"
        badge="Omnibox v4.0"
        badgeVariant="sky"
      />

      {/* Search Input Bar */}
      <div className="p-4 rounded-3xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Wpisz szukaną frazę (np. drążek, sprawdzian, kawa, librus)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm font-sans text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-inner"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'Wszystkie' },
            { id: 'PAMIĘĆ AI', label: 'Pamięć AI' },
            { id: 'ZADANIA', label: 'Zadania' },
            { id: 'FINANSE', label: 'Finanse' },
            { id: 'SZKOŁA', label: 'Oceny & Szkoła' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                activeCategory === tab.id
                  ? 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-2.5">
        {filteredResults.map((item) => {
          const meta = getCategoryBadge(item.category);
          const Icon = meta.icon;

          return (
            <div
              key={item.id}
              onClick={() => navigate(item.targetPath)}
              className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 hover:bg-white dark:hover:bg-slate-900 shadow-sm cursor-pointer transition flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-sky-400 group-hover:bg-sky-500/10 transition mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-400 transition">
                      {item.title}
                    </h4>
                    <Badge variant={meta.variant}>{item.category}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {item.snippet}
                  </p>
                </div>
              </div>

              <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-sky-400 group-hover:translate-x-1 transition">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          );
        })}

        {query.trim().length > 0 && filteredResults.length === 0 && !isSearching && (
          <div className="p-8 text-center text-xs text-slate-500 italic bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            Brak wyników pasujących do zapytania "{query}".
          </div>
        )}

        {query.trim().length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Zacznij pisać, aby przeszukać bazę wiedzy, zadania, oceny i finanse w czasie rzeczywistym.
          </div>
        )}
      </div>
    </div>
  );
};
