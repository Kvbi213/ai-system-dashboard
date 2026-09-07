import React from 'react';
import { AlertOctagon, RotateCcw, ShieldAlert, Copy, Check } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Przechwycono nieobsłużony wyjątek komponentu:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleResetStorage = () => {
    sessionStorage.clear();
    localStorage.removeItem('system_setup_completed');
    localStorage.removeItem('system_chat_history');
    localStorage.removeItem('system_mentor_history');
    window.location.reload();
  };

  handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack || this.state.error?.stack || 'Brak stosu'}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#0A0B0E] text-white font-sans overflow-auto">
          <div className="max-w-xl w-full bg-[#12141A] border border-red-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="font-mono text-lg font-bold uppercase tracking-wider text-red-400">
                  Wykryto anomalię interfejsu (Crash Guard)
                </h1>
                <p className="text-xs text-gray-400">
                  React przechwycił błąd renderowania komponentu.
                </p>
              </div>
            </div>

            <div className="bg-[#0A0B0E] border border-border/80 rounded-xl p-4 mb-5 overflow-x-auto max-h-48 custom-scrollbar">
              <p className="font-mono text-xs text-red-300 font-semibold mb-1">
                {this.state.error?.toString() || 'Nieznany błąd wykonania'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="font-mono text-[10px] text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-accentPrimary text-black font-mono font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-lg"
              >
                <RotateCcw className="w-4 h-4" /> Przeładuj stronę
              </button>

              <button
                onClick={this.handleResetStorage}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border hover:border-red-500/50 text-textMuted hover:text-white font-mono text-xs rounded-xl transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Reset sesji
              </button>

              <button
                onClick={this.handleCopyError}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border hover:border-accentPrimary/50 text-textMuted hover:text-white font-mono text-xs rounded-xl transition-all"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-accentPrimary" /> Skopiowano
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Kopiuj log
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
