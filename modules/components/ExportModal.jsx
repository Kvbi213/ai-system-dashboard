import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Printer, Download, Sparkles, Database, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  exportFinancesToCSV,
  exportTasksToCSV,
  exportWorkoutsToCSV,
  exportTimetableToCSV,
  openPrintableReport
} from '../services/exportService';
import { calculateFinanceStats } from '../services/budgetCalculator';

export default function ExportModal({ isOpen, onClose, finances = [], tasks = [], workouts = [], timetable = [], settings = null }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('finances');

  const getFinanceSettings = () => {
    if (settings) {
      return {
        targetNeeds: settings.needs_percent !== undefined ? Number(settings.needs_percent) : 50,
        targetWants: settings.wants_percent !== undefined ? Number(settings.wants_percent) : 30,
        targetSavings: settings.savings_percent !== undefined ? Number(settings.savings_percent) : 20,
        monthlyIncome: settings.monthly_income !== undefined ? Number(settings.monthly_income) : 0
      };
    }
    try {
      const saved = localStorage.getItem('system_finance_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          targetNeeds: parsed.needs_percent !== undefined ? Number(parsed.needs_percent) : 50,
          targetWants: parsed.wants_percent !== undefined ? Number(parsed.wants_percent) : 30,
          targetSavings: parsed.savings_percent !== undefined ? Number(parsed.savings_percent) : 20,
          monthlyIncome: parsed.monthly_income !== undefined ? Number(parsed.monthly_income) : 0
        };
      }
    } catch {}
    return { targetNeeds: 50, targetWants: 30, targetSavings: 20, monthlyIncome: 0 };
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportCSV = (type) => {
    try {
      if (type === 'finances') {
        exportFinancesToCSV(finances);
        toast.success('Pomyślnie wyeksportowano transakcje finansowe do formatu CSV.', 'Eksport CSV');
      } else if (type === 'tasks') {
        exportTasksToCSV(tasks);
        toast.success('Pomyślnie wyeksportowano listę zadań do formatu CSV.', 'Eksport CSV');
      } else if (type === 'workouts') {
        exportWorkoutsToCSV(workouts);
        toast.success('Pomyślnie wyeksportowano historię treningów do formatu CSV.', 'Eksport CSV');
      } else if (type === 'timetable') {
        exportTimetableToCSV(timetable);
        toast.success('Pomyślnie wyeksportowano plan zajęć do formatu CSV.', 'Eksport CSV');
      }
    } catch (err) {
      toast.error(`Wystąpił błąd podczas eksportu CSV: ${err.message}`, 'Błąd Eksportu');
    }
  };

  const handlePrintFinances = () => {
    try {
      const finCfg = getFinanceSettings();
      const stats = calculateFinanceStats(finances, finCfg);
      const valid = finances.filter(t => t && !t.is_settings && t.id !== 'finance_settings');

      const summaryCards = `
        <div class="cards-grid">
          <div class="card">
            <div class="card-label">Suma Przychodów</div>
            <div class="card-val" style="color: #059669;">+${stats.income.toFixed(2)} PLN</div>
          </div>
          <div class="card">
            <div class="card-label">Suma Wydatków</div>
            <div class="card-val" style="color: #dc2626;">-${stats.expenses.toFixed(2)} PLN</div>
          </div>
          <div class="card">
            <div class="card-label">Bilans Netto</div>
            <div class="card-val" style="color: ${stats.net >= 0 ? '#059669' : '#dc2626'};">${stats.net.toFixed(2)} PLN</div>
          </div>
          <div class="card">
            <div class="card-label">Koperta Potrzeby (${finCfg.targetNeeds}%)</div>
            <div class="card-val">${stats.available.needs.toFixed(2)} PLN</div>
          </div>
          <div class="card">
            <div class="card-label">Koperta Zachcianki (${finCfg.targetWants}%)</div>
            <div class="card-val">${stats.available.wants.toFixed(2)} PLN</div>
          </div>
          <div class="card">
            <div class="card-label">Koperta Oszczędności (${finCfg.targetSavings}%)</div>
            <div class="card-val">${stats.available.savings.toFixed(2)} PLN</div>
          </div>
        </div>
      `;

      const tableRows = valid.map(t => `
        <tr>
          <td>${t.transaction_date || ''}</td>
          <td><strong>${t.title || 'Bez tytułu'}</strong></td>
          <td><span style="color: ${t.type === 'income' ? '#059669' : (t.type === 'transfer' ? '#2563eb' : '#dc2626')}">${t.type.toUpperCase()}</span></td>
          <td>${Number(t.amount || 0).toFixed(2)} PLN</td>
          <td>${t.bucket || t.category || '-'}</td>
        </tr>
      `).join('');

      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tytuł</th>
              <th>Typ</th>
              <th>Kwota</th>
              <th>Kategoria / Koperta</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      `;

      openPrintableReport({
        title: 'Zestawienie Finansowe i Alokacja Kopertowa',
        sections: [
          {
            title: 'Kluczowe Wskaźniki Budżetowe',
            summaryHtml: summaryCards
          },
          {
            title: 'Rejestr Operacji Finansowych',
            tableHtml
          }
        ]
      });

      toast.success('Otwarto okno podglądu wydruku / zapisu do PDF.', 'Raport PDF');
    } catch (err) {
      toast.error(`Błąd generowania raportu do druku: ${err.message}`, 'Błąd');
    }
  };

  const handlePrintAll = () => {
    try {
      const finCfg = getFinanceSettings();
      const stats = calculateFinanceStats(finances, finCfg);
      const completedTasks = tasks.filter(t => t.status === 'completed').length;

      const summaryHtml = `
        <div class="cards-grid">
          <div class="card">
            <div class="card-label">Bilans Finansowy Netto</div>
            <div class="card-val">${stats.net.toFixed(2)} PLN</div>
          </div>
          <div class="card">
            <div class="card-label">Wykonane Zadania</div>
            <div class="card-val">${completedTasks} / ${tasks.length}</div>
          </div>
          <div class="card">
            <div class="card-label">Zarejestrowane Treningi</div>
            <div class="card-val">${workouts.length}</div>
          </div>
          <div class="card">
            <div class="card-label">Pozycje Planu Lekcji</div>
            <div class="card-val">${timetable.length}</div>
          </div>
        </div>
      `;

      const tasksRows = tasks.slice(0, 15).map(t => `
        <tr>
          <td><strong>${t.title}</strong></td>
          <td>${t.priority || 'MEDIUM'}</td>
          <td>${t.status || 'pending'}</td>
          <td>${t.target_date || '-'}</td>
        </tr>
      `).join('');

      openPrintableReport({
        title: 'Całościowy Raport Zbiorczy Systemu OmniDash',
        sections: [
          {
            title: 'Ogólne Podsumowanie Ekosystemu',
            summaryHtml
          },
          {
            title: 'Aktywne Zadania i Cele Operacyjne',
            tableHtml: `
              <table>
                <thead>
                  <tr><th>Zadanie</th><th>Priorytet</th><th>Status</th><th>Termin</th></tr>
                </thead>
                <tbody>${tasksRows}</tbody>
              </table>
            `
          }
        ]
      });
      toast.success('Wygenerowano całościowy raport zbiorczy do druku/PDF.', 'Raport Główny');
    } catch (err) {
      toast.error(`Błąd generowania raportu: ${err.message}`, 'Błąd');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e131f] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border/50 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Centrum Eksportu i Raportów</h3>
              <p className="text-xs text-textMuted">Pobierz dane w formacie CSV lub wygeneruj zoptymalizowany raport do PDF/Druku.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/40 px-5 pt-3 gap-2 bg-black/20 overflow-x-auto">
          {[
            { id: 'finances', label: 'Finanse', count: finances.length },
            { id: 'tasks', label: 'Zadania', count: tasks.length },
            { id: 'workouts', label: 'Treningi', count: workouts.length },
            { id: 'timetable', label: 'Plan Lekcji', count: timetable.length },
            { id: 'summary', label: 'Raport Zbiorczy', count: 'ALL' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-textMuted hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 text-textMuted">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'finances' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-border/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Transakcje i Alokacje Finansowe</h4>
                  <p className="text-xs text-textMuted mt-0.5">Eksportuj wszystkie zarejestrowane wydatki, przychody oraz transfery między kopertami.</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                  {finances.length} pozycji
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleExportCSV('finances')}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border/60 bg-white/5 hover:bg-cyan-500/15 hover:border-cyan-500/40 text-white font-medium text-xs transition-all shadow-sm group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Pobierz Arkusz CSV</span>
                </button>
                <button
                  onClick={handlePrintFinances}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-medium text-xs transition-all shadow-sm group"
                >
                  <Printer className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Drukuj / Zapisz jako PDF</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-border/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Zadania i Cele Operacyjne</h4>
                  <p className="text-xs text-textMuted mt-0.5">Eksport kompletnego rejestru zadań z priorytetami, statusami i terminami wykonania.</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                  {tasks.length} zadań
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleExportCSV('tasks')}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border/60 bg-white/5 hover:bg-cyan-500/15 hover:border-cyan-500/40 text-white font-medium text-xs transition-all shadow-sm group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Pobierz Arkusz CSV (To-Do)</span>
                </button>
                <button
                  onClick={handlePrintAll}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-medium text-xs transition-all shadow-sm group"
                >
                  <Printer className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Generuj Raport Zadań (PDF)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'workouts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-border/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Dziennik Aktywności Fizycznej</h4>
                  <p className="text-xs text-textMuted mt-0.5">Zestawienie odbytych sesji treningowych, czasów trwania i wykonanych ćwiczeń.</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                  {workouts.length} treningów
                </span>
              </div>
              <button
                onClick={() => handleExportCSV('workouts')}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border/60 bg-white/5 hover:bg-cyan-500/15 hover:border-cyan-500/40 text-white font-medium text-xs transition-all shadow-sm group"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Pobierz Dziennik Treningowy (.CSV)</span>
              </button>
            </div>
          )}

          {activeTab === 'timetable' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-border/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Harmonogram Planu Lekcji</h4>
                  <p className="text-xs text-textMuted mt-0.5">Eksport siatki godzinowej zajęć, sal wykładowych i przypisanych nauczycieli.</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                  {timetable.length} godzin
                </span>
              </div>
              <button
                onClick={() => handleExportCSV('timetable')}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border/60 bg-white/5 hover:bg-cyan-500/15 hover:border-cyan-500/40 text-white font-medium text-xs transition-all shadow-sm group"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Pobierz Plan Zajęć (.CSV)</span>
              </button>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-500/30">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">Zintegrowany Raport Systemowy</h4>
                </div>
                <p className="text-xs text-textMuted leading-relaxed">
                  Generuje całościowy, elegancko sformatowany dokument zawierający kluczowe statystyki finansowe, postęp realizacji zadań, logi aktywności oraz podsumowanie ekosystemu przygotowany do natychmiastowego druku lub eksportu do pliku PDF.
                </p>
              </div>
              <button
                onClick={handlePrintAll}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-white font-bold text-xs tracking-wide transition-all shadow-lg group"
              >
                <Printer className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                <span>Otwórz Pełny Raport Zbiorczy (PDF / Druk)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-white/[0.02] flex items-center justify-between text-xs text-textMuted font-mono">
          <span>Strefa: Europe/Warsaw</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-border/50 hover:bg-white/5 text-textPrimary transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
