import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, X, Lock } from 'lucide-react';
import { Badge } from './Badge';

export interface HumanCheckpointProps {
  isOpen: boolean;
  title: string;
  description: string;
  impactType: 'FINANCE' | 'OSINT' | 'KERNEL' | 'SECURITY';
  payloadSummary: { label: string; value: string }[];
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const HumanCheckpointModal: React.FC<HumanCheckpointProps> = ({
  isOpen,
  title,
  description,
  impactType,
  payloadSummary,
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  const [countdown, setCountdown] = useState(3);
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setCanConfirm(false);
      return;
    }

    setCountdown(3);
    setCanConfirm(false);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanConfirm(true);
          return 0;
        }
        return prev - 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!canConfirm || isProcessing) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([10, 30, 20]);
    }
    onConfirm();
  };

  const getImpactBadge = () => {
    switch (impactType) {
      case 'FINANCE':
        return <Badge variant="amber">PUNKT KONTROLNY :: FINANSE</Badge>;
      case 'OSINT':
        return <Badge variant="purple">PUNKT KONTROLNY :: WYWIAD SIECIOWY</Badge>;
      case 'KERNEL':
        return <Badge variant="rose">PUNKT KONTROLNY :: KONFIGURACJA JĄDRA</Badge>;
      case 'SECURITY':
        return <Badge variant="rose">PUNKT KONTROLNY :: BEZPIECZEŃSTWO</Badge>;
      default:
        return <Badge variant="sky">PUNKT KONTROLNY</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-2xl bg-slate-950 border border-amber-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkpoint-title"
      >
        {/* Glow ambient background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="mb-1">{getImpactBadge()}</div>
              <h3 id="checkpoint-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Description */}
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed mb-4 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Wymagana jawna autoryzacja człowieka (Human Checkpoint):</p>
            <p>{description}</p>
          </div>
        </div>

        {/* Parameters Table */}
        {payloadSummary.length > 0 && (
          <div className="mb-5 rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-2 text-xs">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Weryfikacja parametrów dyspozycji:
            </div>
            <div className="divide-y divide-slate-800">
              {payloadSummary.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1.5 text-slate-300">
                  <span className="text-slate-400">{item.label}:</span>
                  <span className="font-mono font-bold text-white text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 border border-slate-700 transition"
          >
            [-] Anuluj dyspozycję
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isProcessing}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
              canConfirm && !isProcessing
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <span>Wykonywanie...</span>
            ) : canConfirm ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>[+] Autoryzuj i zatwierdź</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Blokada czasowa ({countdown}s)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
