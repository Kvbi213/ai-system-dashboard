import React, { useEffect, useRef } from 'react';
import { RulerWheelPicker } from '../../../components/ui/RulerWheelPicker';
import { Dumbbell, X, Play, CheckCircle2, Trophy, Plus, Minus, Sparkles } from 'lucide-react';

export interface NextSetInfo {
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  reps: number;
  weightKg: number;
  isNewExercise: boolean;
  isWorkoutFinished: boolean;
}

export interface RestTimerOverlayProps {
  isOpen: boolean;
  secondsRemaining: number;
  nextSet: NextSetInfo | null;
  onSetSeconds: (val: number) => void;
  onAdjustSeconds: (delta: number) => void;
  onSkip: () => void;
  onClose: () => void;
}

// Completion audio chime (3 high-pitch harmonic beeps)
function playRestDoneChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playBeep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    playBeep(880, now, 0.12);
    playBeep(880, now + 0.16, 0.12);
    playBeep(1320, now + 0.32, 0.28);
  } catch {
    // Ignored
  }
}

function getSecondsUnit(sec: number): string {
  const abs = Math.abs(sec);
  const lastDigit = abs % 10;
  const lastTwo = abs % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return 'sekund do serii';
  if (lastDigit === 1) return 'sekunda do serii';
  if (lastDigit >= 2 && lastDigit <= 4) return 'sekundy do serii';
  return 'sekund do serii';
}

export const RestTimerOverlay: React.FC<RestTimerOverlayProps> = ({
  isOpen,
  secondsRemaining,
  nextSet,
  onSetSeconds,
  onAdjustSeconds,
  onSkip,
  onClose
}) => {
  const hasChimedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasChimedRef.current = false;
      return;
    }
    if (secondsRemaining === 0 && !hasChimedRef.current) {
      hasChimedRef.current = true;
      playRestDoneChime();
    }
  }, [isOpen, secondsRemaining]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-2xl transition-all duration-300">
      {/* Background ambient liquid glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-sky-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Apple Liquid Glass / OLED Slate Container */}
      <div className="relative w-full max-w-xl bg-slate-950/90 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] text-white overflow-hidden transition-all duration-200">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              PRZERWA MIĘDZY SERIAMI • LIVE
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/5 active:scale-95"
            title="Zamknij nakładkę"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Next Set Card (Co masz za następną serię) */}
        <div className="mt-4 mb-3 p-4 rounded-2xl bg-slate-900/60 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          {nextSet?.isWorkoutFinished ? (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Gratulacje! FBW Ukończony</p>
                <p className="text-sm font-bold text-white mt-0.5">Wszystkie zaplanowane serie zostały zrealizowane.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
                  <span>NASTĘPNA SERIA:</span>
                </div>
                {nextSet?.isNewExercise && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Nowe ćwiczenie
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {nextSet?.exerciseName || 'Kolejna seria'}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Seria {nextSet?.setNumber} z {nextSet?.totalSets}
                  </span>
                  <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-white/5 text-slate-300 border border-white/10">
                    {nextSet?.reps} powt. {nextSet && nextSet.weightKg > 0 ? `• +${nextSet.weightKg} kg` : '• Masa ciała'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3D Ruler Wheel Picker as Live Interactive Countdown */}
        <div className="my-2">
          <RulerWheelPicker
            min={0}
            max={300}
            step={1}
            value={secondsRemaining}
            unit={getSecondsUnit(secondsRemaining)}
            label="Licznik odliczania (przeciągnij by skorygować)"
            onChange={(val) => onSetSeconds(val)}
            accent="cyan"
            className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          />
        </div>

        {/* Quick Time Adjusters */}
        <div className="flex items-center justify-center gap-2 my-4">
          <button
            onClick={() => onAdjustSeconds(-15)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold border border-white/10 transition active:scale-95"
          >
            <Minus className="w-3 h-3 text-slate-400" />
            <span>15s</span>
          </button>
          <button
            onClick={() => onAdjustSeconds(15)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold border border-white/10 transition active:scale-95"
          >
            <Plus className="w-3 h-3 text-slate-400" />
            <span>15s</span>
          </button>
          <button
            onClick={() => onAdjustSeconds(30)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold border border-white/10 transition active:scale-95"
          >
            <Plus className="w-3 h-3 text-slate-400" />
            <span>30s</span>
          </button>
        </div>

        {/* Primary Action Button (Skip / Start Next Set) */}
        <button
          onClick={onSkip}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20 ${
            secondsRemaining === 0
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.35)]'
              : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(56,189,248,0.35)]'
          }`}
        >
          {secondsRemaining === 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Czas minął! Zaczynaj serię</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Jestem gotowy! Pomiń przerwę</span>
            </>
          )}
        </button>

        {/* Bottom subtle hint */}
        <p className="text-center text-[10px] text-slate-400 font-mono mt-3">
          Wibracje haptyczne i synteza Web Audio aktywne przy obrocie bębna 3D
        </p>
      </div>
    </div>
  );
};
