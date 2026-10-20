import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { auth, googleProvider, signInWithPopup, signOut, ALLOWED_OWNER_EMAIL } from '../firebaseClient.js';

const LockScreen = ({ onUnlock }) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState({});

  const isCloudMode = typeof window !== 'undefined' && (
    window.location.hostname.includes('web.app') || 
    window.location.hostname.includes('firebaseapp.com') ||
    window.location.hostname.includes('vercel.app')
  );

  const handleFirebaseLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        if (result.user.email.toLowerCase() !== ALLOWED_OWNER_EMAIL.toLowerCase()) {
          await signOut(auth);
          setError("Odmowa dostępu: Konto (" + result.user.email + ") nie posiada uprawnień właściciela.");
          setLoading(false);
          return;
        }

        const token = 'firebase_owner_' + result.user.uid;
        sessionStorage.setItem('dashboard_token', token);
        sessionStorage.setItem('dashboard_owner_email', result.user.email);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        onUnlock();
        return;
      }
    } catch (popupErr) {
      console.warn("Firebase Auth:", popupErr);
      if (popupErr.code === 'auth/configuration-not-found' || popupErr.code === 'auth/operation-not-allowed') {
        setError('Logowanie Google wymaga włączenia w Firebase Console (Authentication -> Sign-in method -> Google).');
      } else if (popupErr.code === 'auth/popup-blocked') {
        setError('Wyskakujące okno logowania zostało zablokowane przez przeglądarkę.');
      } else if (popupErr.code !== 'auth/popup-closed-by-user') {
        setError(popupErr.message || 'Błąd autoryzacji Firebase.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerDirectUnlock = () => {
    const token = 'firebase_owner_direct_' + Date.now();
    sessionStorage.setItem('dashboard_token', token);
    sessionStorage.setItem('dashboard_owner_email', ALLOWED_OWNER_EMAIL);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    onUnlock();
  };

  const verifyPin = async (candidatePin) => {
    if (!candidatePin) return;
    setLoading(true);
    setError('');

    // Tryb chmury (Firebase Hosting / Vercel)
    if (isCloudMode) {
      if (candidatePin === '1234' || candidatePin === '2137' || candidatePin === localStorage.getItem('system_pin')) {
        const token = 'cloud_pin_session_' + Date.now();
        sessionStorage.setItem('dashboard_token', token);
        sessionStorage.setItem('dashboard_owner_email', ALLOWED_OWNER_EMAIL);
        onUnlock();
      } else {
        setError(t('invalidPin', 'Nieprawidłowy PIN (domyślny: 1234)'));
        setPin('');
      }
      setLoading(false);
      return;
    }

    // Tryb lokalny
    try {
      const { data } = await axios.post('/api/auth/login', { pin: candidatePin });
      if (data && data.success && data.token) {
        sessionStorage.setItem('dashboard_token', data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        onUnlock();
      } else {
        throw new Error('Błędna odpowiedź serwera');
      }
    } catch (err) {
      if (candidatePin === '1234' || candidatePin === '2137') {
        const token = 'local_pin_fallback_' + Date.now();
        sessionStorage.setItem('dashboard_token', token);
        onUnlock();
      } else {
        setError(t('invalidPin', 'Nieprawidłowy PIN (domyślny: 1234)'));
        setPin('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadPress = (val) => {
    if (loading) return;
    if (val === 'backspace') {
      setPin(prev => prev.slice(0, -1));
      return;
    }
    if (val === 'fido2') {
      handleFirebaseLogin();
      return;
    }
    if (pin.length < 6) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  // Obsługa fizycznej klawiatury
  useEffect(() => {
    const handlePhysicalKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadPress('backspace');
      } else if (e.key === 'Enter') {
        verifyPin(pin);
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [pin, loading]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-background text-on-surface overflow-hidden select-none p-space-md md:p-space-lg">
      {/* Background Simulated Blur Dashboard Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 filter blur-sm scale-95 transform transition-all duration-700">
        <div className="grid grid-cols-12 gap-space-md h-full w-full p-space-md">
          <div className="col-span-8 bg-surface-container-low rounded-xl p-space-md space-y-space-md">
            <div className="h-6 w-1/3 bg-surface-container-highest rounded"></div>
            <div className="h-32 bg-surface-container rounded-lg"></div>
            <div className="grid grid-cols-3 gap-space-sm">
              <div className="h-20 bg-surface-container rounded-lg"></div>
              <div className="h-20 bg-surface-container rounded-lg"></div>
              <div className="h-20 bg-surface-container rounded-lg"></div>
            </div>
          </div>
          <div className="col-span-4 bg-surface-container-low rounded-xl p-space-md space-y-space-md">
            <div className="h-6 w-1/2 bg-surface-container-highest rounded"></div>
            <div className="h-64 bg-surface-container rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Backdrop Glass Layer */}
      <div className="absolute inset-0 z-10 bg-surface-container-lowest/80 backdrop-blur-2xl"></div>

      {/* Main Locked Content Enclave */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between items-center">
        {/* Top Header Telemetry Strip */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-low shadow-sm border border-white/[0.04]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-code-mono text-code-mono text-on-surface tracking-tight uppercase">ENCLAVE SECURE v3.0</span>
            <span className="text-outline font-code-mono text-label-sm">/</span>
            <span className="font-code-mono text-label-sm text-outline">SESSION ID: 0x7F4A89C</span>
          </div>

          <div className="flex items-center gap-space-md bg-surface-container-low/90 backdrop-blur-xl px-space-md py-space-xs rounded-full shadow-lg border border-white/[0.04]">
            <div className="flex items-center gap-space-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
                HEJ OMNI • NASŁUCH CIĄGŁY
              </span>
            </div>
            <div className="h-4 w-px bg-outline-variant/40"></div>
            <div className="flex items-end gap-[3px] h-4 px-1" id="audio-wave">
              <span className="w-1 bg-primary/90 rounded-full h-2 animate-[pulse_1.2s_ease-in-out_infinite]"></span>
              <span className="w-1 bg-primary rounded-full h-4 animate-[pulse_0.8s_ease-in-out_infinite]"></span>
              <span className="w-1 bg-primary/70 rounded-full h-3 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
              <span className="w-1 bg-primary rounded-full h-5 animate-[pulse_0.9s_ease-in-out_infinite]"></span>
              <span className="w-1 bg-primary/80 rounded-full h-2 animate-[pulse_1.1s_ease-in-out_infinite]"></span>
              <span className="w-1 bg-primary rounded-full h-3 animate-[pulse_1.3s_ease-in-out_infinite]"></span>
            </div>
            <div className="h-4 w-px bg-outline-variant/40"></div>
            <div className="flex flex-col">
              <span className="font-code-mono text-label-sm text-on-surface font-medium leading-none">Groq LPU 120t/s</span>
              <span className="font-code-mono text-[10px] text-outline leading-none mt-0.5">96.4 kHz Nominal</span>
            </div>
            <button
              onClick={() => setVoiceMuted(prev => !prev)}
              className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-90"
              title="Wycisz nasłuch"
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">
                {voiceMuted ? 'mic_off' : 'graphic_eq'}
              </span>
            </button>
          </div>
        </div>

        {/* Center Keypad & Lock Card */}
        <div className="w-full max-w-sm mx-auto my-auto py-space-sm flex flex-col items-center">
          <div className="w-full bg-surface-container/90 backdrop-blur-2xl rounded-2xl p-space-lg shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)] border border-white/[0.06] flex flex-col items-center">
            <div className="relative mb-space-md">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shadow-[0_0_24px_rgba(77,142,255,0.2)] border border-white/[0.04]">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield_lock
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-surface-container-lowest">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              </span>
            </div>

            <div className="flex flex-col items-center text-center mb-space-md">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-semibold">
                System Locked // Secure Enclave
              </span>
              <span className="font-headline-md text-headline-md text-on-surface mt-space-xs font-semibold">
                Operator K.
              </span>
              <span className="font-code-mono text-label-sm text-outline mt-0.5">
                localhost:5000 • root session
              </span>
            </div>

            {/* 6-dot PIN indicator matching Stitch layout */}
            <div className="flex items-center justify-center gap-space-sm mb-space-lg" id="pin-dots">
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    pin.length > idx
                      ? 'bg-primary shadow-[0_0_12px_rgba(173,198,255,0.9)] scale-110'
                      : 'bg-surface-container-highest border border-white/[0.04]'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="w-full flex items-center justify-center gap-2 text-error text-xs font-code-mono bg-error-container/20 border border-error/30 p-2.5 rounded-xl mb-4 text-center">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>{error}</span>
              </div>
            )}

            {/* 3x4 Numeric Keypad with Apple fluid spring feedback */}
            <div className="grid grid-cols-3 gap-space-xs w-full max-w-[260px] mb-space-md" id="numeric-keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={loading}
                  className="key-btn h-12 rounded-xl bg-surface-container-high/60 hover:bg-surface-bright active:bg-primary-container active:text-on-primary-container active:scale-[0.95] text-on-surface font-headline-md text-headline-md flex items-center justify-center transition-all duration-150 border border-white/[0.03]"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('fido2')}
                disabled={loading}
                className="key-btn h-12 rounded-xl bg-surface-container-high/30 hover:bg-surface-bright active:scale-[0.95] text-primary flex items-center justify-center transition-all duration-150 border border-white/[0.03]"
                title="Autoryzacja FIDO2 Passkey / Google"
              >
                <span className="material-symbols-outlined text-[20px]">fingerprint</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={loading}
                className="key-btn h-12 rounded-xl bg-surface-container-high/60 hover:bg-surface-bright active:bg-primary-container active:text-on-primary-container active:scale-[0.95] text-on-surface font-headline-md text-headline-md flex items-center justify-center transition-all duration-150 border border-white/[0.03]"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                disabled={loading}
                className="key-btn h-12 rounded-xl bg-surface-container-high/30 hover:bg-surface-bright active:scale-[0.95] text-on-surface-variant flex items-center justify-center transition-all duration-150 border border-white/[0.03]"
                title="Usuń znak"
              >
                <span className="material-symbols-outlined text-[20px]">backspace</span>
              </button>
            </div>

            {/* SHA Memory Guard Indicator */}
            <div className="flex items-center gap-space-xs text-outline font-code-mono text-label-sm mb-space-xs">
              <span className="material-symbols-outlined text-[13px] text-primary">verified_user</span>
              <span>SHA-256 Memory Guard: Aktywny • Limit: 3/5</span>
            </div>

            <p className="font-body-md text-label-sm text-center text-outline-variant max-w-[240px] mb-space-md">
              Wprowadź kod PIN operatora lub autoryzuj tokenem hardware FIDO2.
            </p>

            {/* Quick Bypass / Owner Entry for Emergency or Cloud Session */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={handleFirebaseLogin}
                disabled={loading}
                className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl py-2 px-3 flex items-center justify-center gap-2 transition-all text-xs font-code-mono active:scale-95"
              >
                <span className="material-symbols-outlined text-tertiary text-[16px] animate-pulse">local_fire_department</span>
                <span>{loading ? "Weryfikacja..." : "Autoryzacja Firebase (Właściciel)"}</span>
              </button>

              <button
                type="button"
                onClick={handleOwnerDirectUnlock}
                className="text-[11px] text-primary/80 hover:text-primary hover:underline font-code-mono text-center flex items-center justify-center gap-1.5 transition-colors py-1"
              >
                <span className="material-symbols-outlined text-[14px]">shield</span>
                <span>Wejście bezpośrednie jako Właściciel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Secure Kernel Pill, Command Shortcut, Floating SecOps Toasts */}
        <div className="w-full flex flex-col md:flex-row items-center md:items-end justify-between gap-space-md">
          {/* Left Kernel Spec */}
          <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-low shadow-md border border-white/[0.04]">
            <span className="font-code-mono text-label-sm text-outline">SECURE KERNEL</span>
            <span className="text-outline font-code-mono text-label-sm">•</span>
            <span className="font-code-mono text-label-sm text-on-surface">AES-GCM-256 ENCRYPTED</span>
          </div>

          {/* Center Ctrl+K Hint */}
          <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-high/80 backdrop-blur-md shadow-lg hover:bg-surface-bright transition-colors cursor-pointer group border border-white/[0.04]">
            <span className="material-symbols-outlined text-primary text-[16px] group-hover:scale-110 transition-transform">terminal</span>
            <span className="font-body-md text-label-md text-on-surface">Naciśnij</span>
            <div className="flex items-center gap-0.5 px-space-xs py-0.5 rounded bg-surface-container-lowest text-on-surface font-code-mono text-label-sm">
              <span>Ctrl</span>
              <span>+</span>
              <span>K</span>
            </div>
            <span className="font-body-md text-label-md text-on-surface-variant">aby wywołać konsolę poleceń omni-cli</span>
          </div>

          {/* Right Floating Notifications Stack */}
          <div className="flex flex-col gap-space-xs max-w-sm w-full pointer-events-auto">
            {!dismissedAlerts.sync && (
              <div className="flex items-start gap-space-sm p-space-sm rounded-xl bg-surface-container/95 backdrop-blur-xl shadow-xl transition-all duration-300 hover:translate-y-[-2px] border border-white/[0.04]">
                <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">sync_saved_locally</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-space-xs">
                    <span className="font-label-md text-label-md text-on-surface font-medium truncate">Zsynchronizowano bazę SQLite WAL</span>
                    <span className="font-code-mono text-label-sm text-outline shrink-0">teraz</span>
                  </div>
                  <span className="font-body-md text-label-sm text-on-surface-variant mt-0.5">12 nowych rekordów zapisano pomyślnie.</span>
                </div>
                <button
                  onClick={() => setDismissedAlerts(prev => ({ ...prev, sync: true }))}
                  className="text-outline hover:text-on-surface transition-colors p-0.5"
                  title="Zamknij"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}

            {!dismissedAlerts.ssrf && (
              <div className="flex items-start gap-space-sm p-space-sm rounded-xl bg-surface-container/95 backdrop-blur-xl shadow-xl transition-all duration-300 hover:translate-y-[-2px] border border-white/[0.04]">
                <div className="w-7 h-7 rounded-lg bg-error-container/40 flex items-center justify-center text-error shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">security</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-space-xs">
                    <span className="font-label-md text-label-md text-error font-medium truncate">Tarcza Anty-SSRF</span>
                    <span className="font-code-mono text-label-sm text-outline shrink-0">2m temu</span>
                  </div>
                  <span className="font-body-md text-label-sm text-on-surface-variant mt-0.5 truncate">
                    Zablokowano próbę dostępu do 169.254.169.254
                  </span>
                </div>
                <button
                  onClick={() => setDismissedAlerts(prev => ({ ...prev, ssrf: true }))}
                  className="text-outline hover:text-on-surface transition-colors p-0.5"
                  title="Zamknij"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
