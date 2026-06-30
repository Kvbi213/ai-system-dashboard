import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, X, Sparkles, Check, ChevronLeft } from 'lucide-react';

const steps = [
  {
    title: "Inicjalizacja Zakończona",
    content: "Twoje klucze API zostały zabezpieczone. Witaj w głównym centrum dowodzenia! Przejdźmy przez szybki przegląd możliwości systemu.",
    position: "center",
    targetSelector: null,
    route: "/"
  },
  {
    title: "Zarządzanie Czasem i Wiedzą",
    content: "Oto Twój obszar roboczy. Masz tu inteligentną listę zadań i kalendarz, a obok zawsze aktualny strumień wiadomości (IT, AI, Bezpieczeństwo). AI potrafi samo dodawać tu zadania!",
    position: "top-center",
    targetSelector: "#tour-todo",
    route: "/"
  },
  {
    title: "Główna Nawigacja",
    content: "Ten panel pozwala Ci poruszać się po systemie. Gdy złożony, oszczędza miejsce. Po najechaniu myszką, odsłania pełny dostęp m.in. do Narzędzi OSINT, czy Kalendarza.",
    position: "left",
    targetSelector: "#tour-sidebar",
    route: "/"
  },
  {
    title: "Terminal AI (Twój Asystent)",
    content: "To serce systemu. Zamiast 'klikać', możesz tu po prostu poprosić system o modyfikację bazy danych, sprawdzenie logów czy znalezienie informacji w sieci. Tryb Mentor będzie analizował Twoje pomysły.",
    position: "center",
    targetSelector: "#tour-terminal",
    route: "/chat"
  },
  {
    title: "Tryb Wyszukiwania",
    content: "Zintegrowana wyszukiwarka oparta o Brave API pozwala Ci przeglądać Internet z poziomu dashboardu, unikając rozpraszaczy typowych dla zwykłej przeglądarki.",
    position: "center",
    targetSelector: "#tour-search",
    route: "/search"
  },
  {
    title: "Ustawienia i Bezpieczeństwo",
    content: "Tutaj zmienisz wygląd, kolory akcentów oraz włączysz Ghost Mode (Tryb Incognito). Znajdziesz tu też przycisk Factory Reset czyszczący wszystkie ślady z komputera.",
    position: "left",
    targetSelector: "#tour-settings",
    route: "/settings"
  }
];

const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isCompleted = localStorage.getItem('system_onboarding_completed');
    if (!isCompleted) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const step = steps[currentStep];

  // Obsługa śledzenia elementu (Spotlight) i routingu
  useEffect(() => {
    if (!isOpen) return;

    // Przejście na odpowiednią podstronę jeśli to konieczne
    if (location.pathname !== step.route) {
      navigate(step.route);
    }

    const updateRect = () => {
      if (step.targetSelector) {
        const el = document.querySelector(step.targetSelector);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null); // Gdy np. element jeszcze się nie wyrenderował
        }
      } else {
        setTargetRect(null);
      }
    };

    // Opóźnienie na animacje wejścia komponentów
    const timer = setTimeout(updateRect, 300);
    window.addEventListener('resize', updateRect);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep, isOpen, location.pathname, navigate, step]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const finishTour = () => {
    localStorage.setItem('system_onboarding_completed', 'true');
    setIsOpen(false);
    navigate('/'); // Powrót na stronę główną
  };

  const getPositionClasses = (position) => {
    switch (position) {
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'top-center':
        return 'top-32 left-1/2 -translate-x-1/2';
      case 'left':
        return 'top-1/2 left-24 md:left-64 -translate-y-1/2';
      case 'bottom-right':
        return 'bottom-24 right-24';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  // Generowanie wielokąta tnącego (clip-path hole punch)
  const generateClipPath = () => {
    if (!targetRect) return 'none';
    const p = 12; // padding (odstęp od krawędzi)
    const x1 = targetRect.left - p;
    const y1 = targetRect.top - p;
    const x2 = targetRect.right + p;
    const y2 = targetRect.bottom + p;

    // Outer bounding box z wyciętym w środku prostokątem
    return `polygon(
      0% 0%, 
      0% 100%, 
      ${x1}px 100%, 
      ${x1}px ${y1}px, 
      ${x2}px ${y1}px, 
      ${x2}px ${y2}px, 
      ${x1}px ${y2}px, 
      ${x1}px 100%, 
      100% 100%, 
      100% 0%
    )`;
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Tło Hole-Punching */}
      <div 
        className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-auto"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          clipPath: generateClipPath(),
          WebkitClipPath: generateClipPath()
        }}
      />
      
      {/* Karta Samouczka */}
      <div 
        className={`absolute w-[90%] max-w-md pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${getPositionClasses(step.position)}`}
      >
        <div className="glass-panel border border-accentPrimary/40 rounded-2xl shadow-[0_0_50px_rgba(0,255,102,0.15)] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2 text-accentPrimary">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h3 className="font-mono font-bold uppercase tracking-widest text-sm text-shadow-glow">Przewodnik Systemowy</h3>
            </div>
            <button 
              onClick={finishTour}
              className="text-textMuted hover:text-white transition-colors p-1"
              title="Zakończ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-3 tracking-tight">{step.title}</h2>
            <p className="text-textMuted leading-relaxed text-sm">{step.content}</p>
          </div>

          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex gap-1.5">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'bg-accentPrimary w-5 shadow-[0_0_10px_rgba(0,255,102,0.5)]' : 'bg-white/20 w-2'}`}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className="px-4 py-2 rounded-lg font-mono text-xs font-bold text-textMuted hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Wstecz
                </button>
              )}
              <button 
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-accentPrimary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-accentPrimary/90 hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] transition-all flex items-center gap-1.5"
              >
                {currentStep === steps.length - 1 ? (
                  <>Start <Check className="w-4 h-4" /></>
                ) : (
                  <>Dalej <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
