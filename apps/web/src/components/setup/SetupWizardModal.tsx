import React, { useState } from 'react';
import { Sparkles, Shield, Bell, Wallet, Calendar, Check, ArrowRight, Loader2 } from 'lucide-react';
import { systemApi, pushbulletApi } from '../../api/client';
import { useToast } from '../ui/Toast';

interface SetupWizardModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ isOpen, onComplete }) => {
  const toast = useToast();
  const [step, setStep] = useState<number>(1);
  const [operatorName, setOperatorName] = useState('Jakub Lis');
  const [schoolClass, setSchoolClass] = useState('2 Ti-gr1');
  const [pushbulletKey, setPushbulletKey] = useState('');
  const [isTestingPushbullet, setIsTestingPushbullet] = useState(false);
  const [pushbulletStatus, setPushbulletStatus] = useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState('2000');
  const [timetableHtml, setTimetableHtml] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTestPushbullet = async () => {
    if (!pushbulletKey.trim()) {
      toast.error('Wprowadź token API Pushbullet');
      return;
    }
    setIsTestingPushbullet(true);
    setPushbulletStatus(null);
    try {
      const res = await pushbulletApi.testToken(pushbulletKey.trim());
      if (res?.valid || res?.success) {
        setPushbulletStatus(`Zweryfikowano: ${res.user?.name || res.user?.email || 'OK'}`);
        toast.success('Klucz Pushbullet jest poprawny');
      } else {
        setPushbulletStatus(`Błąd weryfikacji: ${res?.error || 'Nieprawidłowy token'}`);
        toast.error('Nieprawidłowy token Pushbullet');
      }
    } catch (err: any) {
      setPushbulletStatus(`Błąd połączenia: ${err.message}`);
      toast.error('Błąd połączenia z Pushbullet API');
    } finally {
      setIsTestingPushbullet(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await systemApi.setupInitialize({
        operatorName: operatorName.trim(),
        schoolClass: schoolClass.trim(),
        pushbulletKey: pushbulletKey.trim() || undefined,
        monthlyIncome: parseFloat(monthlyIncome) || 2000,
        timetableHtml: timetableHtml.trim() || undefined
      });
      toast.success('Konfiguracja systemu ukończona pomyślnie!');
      onComplete();
    } catch (err: any) {
      toast.error(`Błąd konfiguracji: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const incomeVal = parseFloat(monthlyIncome) || 0;
  const needsVal = Math.round(incomeVal * 0.5);
  const wantsVal = Math.round(incomeVal * 0.3);
  const savingsVal = Math.round(incomeVal * 0.2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-cyan-950/40 via-sky-950/30 to-indigo-950/40 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Kreator Pierwszej Konfiguracji (Setup Wizard)</h2>
                <p className="text-xs text-slate-400 font-medium">Inicjalizacja relacyjnej bazy SQLite i profilu operatora</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-cyan-400">
              Krok {step} / 3
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>1. Profil Operatora i Identyfikacja Szkolna</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Imię i Nazwisko Operatora</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                    placeholder="np. Jakub Lis"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Klasa Szkolna (Profil Technikum)</label>
                  <input
                    type="text"
                    value={schoolClass}
                    onChange={(e) => setSchoolClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                    placeholder="np. 2 Ti-gr1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>2. Powiadomienia na Smartfon (Pushbullet API)</span>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Podaj swój prywatny Access Token z konta Pushbullet (ustawienia konta / Create Access Token), aby odbierać alerty przed dzwonkiem szkolnym i zmiany sal.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Access-Token Pushbullet</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={pushbulletKey}
                      onChange={(e) => setPushbulletKey(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      placeholder="o.abcdef123456789..."
                    />
                    <button
                      type="button"
                      onClick={handleTestPushbullet}
                      disabled={isTestingPushbullet || !pushbulletKey.trim()}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 disabled:opacity-50 transition flex items-center gap-1.5"
                    >
                      {isTestingPushbullet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Testuj</span>
                    </button>
                  </div>
                  {pushbulletStatus && (
                    <p className="text-xs mt-1.5 text-slate-300 font-mono bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                      {pushbulletStatus}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>3. Konfiguracja Budżetu 50/30/20 & Harmonogramu</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Miesięczny Dochód / Budżet Bazowy (PLN)</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold"
                    placeholder="2000"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/80 text-center">
                  <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-800/60">
                    <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Potrzeby (50%)</p>
                    <p className="text-sm font-mono font-bold text-white mt-1">{needsVal} PLN</p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/60">
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Zachcianki (30%)</p>
                    <p className="text-sm font-mono font-bold text-white mt-1">{wantsVal} PLN</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Oszczędności (20%)</p>
                    <p className="text-sm font-mono font-bold text-white mt-1">{savingsVal} PLN</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                    <span>Import Planu Lekcji z Librusa (opcjonalnie HTML)</span>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </label>
                  <textarea
                    value={timetableHtml}
                    onChange={(e) => setTimetableHtml(e.target.value)}
                    rows={3}
                    placeholder="Wklej źródło HTML strony z planem lekcji Librus..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Wstecz
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-cyan-600/20"
            >
              <span>Dalej</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Zainicjalizuj System OmniDash</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
