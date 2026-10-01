import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Rss, ExternalLink, RefreshCw, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { CATEGORY_CONFIG } from '../config/constants';
import { useTranslation } from 'react-i18next';

/**
 * Oblicza bieżący interwał czasowy (slot) dla pobierania wiadomości IT.
 * Harmonogram Brave Search Quota Guard: maks 3 automatyczne pobrania na dobę:
 * - Slot 10:00 (10:00:00 - 14:59:59)
 * - Slot 15:00 (15:00:00 - 19:59:59)
 * - Slot 20:00 (20:00:00 - 09:59:59 dnia następnego)
 */
export const getNewsSlotInfo = (now = new Date()) => {
  const hours = now.getHours();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (hours >= 10 && hours < 15) {
    return { slotId: '10', date: todayStr, slotKey: `${todayStr}_10`, label: '10:00' };
  } else if (hours >= 15 && hours < 20) {
    return { slotId: '15', date: todayStr, slotKey: `${todayStr}_15`, label: '15:00' };
  } else if (hours >= 20) {
    return { slotId: '20', date: todayStr, slotKey: `${todayStr}_20`, label: '20:00' };
  } else {
    // Godziny 00:00 - 09:59 podlegają pod slot wieczorny 20:00 z dnia poprzedniego
    const prev = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const pY = prev.getFullYear();
    const pM = pad(prev.getMonth() + 1);
    const pD = pad(prev.getDate());
    const prevDateStr = `${pY}-${pM}-${pD}`;
    return { slotId: '20', date: prevDateStr, slotKey: `${prevDateStr}_20`, label: '20:00' };
  }
};

/**
 * Pobiera zbuforowane artykuły z pamięci podręcznej przeglądarki dla danej kategorii i slotu
 */
export const getStoredNewsCache = (category, slotKey) => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(`news_cache_${category}_${slotKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.articles) && parsed.articles.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.debug('[News Cache] Błąd odczytu localStorage:', e);
  }
  return null;
};

/**
 * Zapisuje pobrane artykuły do pamięci podręcznej przeglądarki
 */
export const setStoredNewsCache = (category, slotKey, articles) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(`news_cache_${category}_${slotKey}`, JSON.stringify({
      articles,
      timestamp: Date.now(),
      slotKey,
      category
    }));
  } catch (e) {
    console.debug('[News Cache] Błąd zapisu localStorage:', e);
  }
};

const FALLBACK_ARTICLES = {
  ai: [
    { title: 'Nowe możliwości modeli AI w 2026 roku: agenty autonomiczne i reasoning', url: 'https://news.ycombinator.com', source: 'TechNews', time: '1h', description: 'Modele lokalne i architektury reasoning zoptymalizowane pod kątem minimalnego zużycia tokenów.' },
    { title: 'Standardy bezpieczeństwa i audytu w aplikacjach webowych', url: 'https://github.com', source: 'CyberSec', time: '2h', description: 'Izolacja kluczy API, brak ekspozycji poświadczeń oraz rygorystyczne reguły Firestore.' },
    { title: 'Architektura serverless: Firestore, Firebase Hosting i odporność na awarie', url: 'https://firebase.google.com', source: 'Cloud', time: '3h', description: 'Zarządzanie stanem i synchronizacja w czasie rzeczywistym między węzłami.' },
    { title: 'Optymalizacja frontendowa: ochrona interfejsu i redukcja zapytań API', url: 'https://react.dev', source: 'Dev', time: '4h', description: 'Pamięć podręczna na poziomie slotów czasowych redukująca obciążenie serwisów zewnętrznych.' }
  ],
  security: [
    { title: 'Nowe standardy audytu zero-trust i izolacji poświadczeń w architekturach chmurowych', url: 'https://cve.mitre.org', source: 'CyberDefense', time: '2h', description: 'Zalecenia NIST dotyczące ochrony kluczy API i izolacji zmiennych środowiskowych.' },
    { title: 'Analiza bezpieczeństwa protokołów WebAssembly i sandboxing rozszerzeń', url: 'https://owasp.org', source: 'SecOps', time: '5h', description: 'Raport podatności w ekosystemach serwerless i mechanizmy automatycznej mitygacji w locie.' }
  ]
};

const ITNewsTicker = ({ selectedCategories }) => {
  const { t, i18n } = useTranslation();
  const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
  const currentLocale = langMap[i18n.language] || 'pl-PL';
  
  const categories = selectedCategories && selectedCategories.length > 0
    ? selectedCategories
    : ['ai', 'security'];
  const primaryCategory = categories[0] || 'ai';

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState(primaryCategory);
  const [lastFetch, setLastFetch] = useState(null);
  const [slotLabel, setSlotLabel] = useState(() => getNewsSlotInfo().label);
  const [tickerIndex, setTickerIndex] = useState(0);

  const lastSlotRef = useRef(getNewsSlotInfo().slotKey);
  const isCloudMode = typeof window !== 'undefined' && (window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com'));

  /**
   * Pobiera artykuły dla wskazanej kategorii.
   * Jeśli isManual jest fałszem, najpierw sprawdza lokalny bufor slotu.
   */
  const loadCategoryNews = useCallback(async (cat, isManual = false) => {
    const slotInfo = getNewsSlotInfo();
    setSlotLabel(slotInfo.label);

    // 1. Sprawdzenie pamięci podręcznej (dla automatycznych lub nawigacyjnych zapytań)
    if (!isManual) {
      const cached = getStoredNewsCache(cat, slotInfo.slotKey);
      if (cached) {
        setArticles(cached.articles);
        setLastFetch(new Date(cached.timestamp));
        setLoading(false);
        setError(false);
        return;
      }
    }

    setLoading(true);
    setError(false);
    const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['ai'];
    if (!config) {
      setLoading(false);
      return;
    }

    try {
      // 1. Zapytanie do lokalnego lub bieżącego endpointu /api/news
      const queryParam = encodeURIComponent(config.query);
      const catParam = encodeURIComponent(cat);
      const forceParam = isManual ? '&force=true' : '';
      let res = await fetch(`/api/news?q=${queryParam}&category=${catParam}${forceParam}`);
      let ct = res.headers.get('content-type') || '';
      
      // 2. Jeśli jesteśmy w chmurze (Firebase Hosting) i /api/news nie zwraca JSON, odpytaj gateway Vercel
      if ((!res.ok || !ct.includes('application/json')) && isCloudMode) {
        res = await fetch(`https://ai-system-dashboard.vercel.app/api/news?q=${queryParam}&category=${catParam}${forceParam}`);
        ct = res.headers.get('content-type') || '';
      }

      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          setArticles(data.results);
          const fetchTime = new Date();
          setLastFetch(fetchTime);
          setStoredNewsCache(cat, slotInfo.slotKey, data.results);
          return;
        }
      }
      throw new Error('Pobranie rezerwowych danych');
    } catch {
      const fallback = FALLBACK_ARTICLES[cat] || FALLBACK_ARTICLES['ai'] || [
        { title: `${config.label}: Aktualności technologiczne 2026`, url: 'https://news.ycombinator.com', source: 'IntelFeed', time: '1h', description: config.desc }
      ];
      setArticles(fallback);
      setLastFetch(new Date());
      setStoredNewsCache(cat, slotInfo.slotKey, fallback);
    } finally {
      setLoading(false);
    }
  }, [isCloudMode]);

  // Montowanie: Załaduj wyłącznie kategorię główną (pierwszą na dashboardzie)
  useEffect(() => {
    const slotInfo = getNewsSlotInfo();
    lastSlotRef.current = slotInfo.slotKey;
    loadCategoryNews(primaryCategory, false);
  }, [primaryCategory, loadCategoryNews]);

  // Cykliczny strażnik slotów: dokładnie 3 automatyczne pobrania w ciągu dnia (o 10:00, 15:00, 20:00)
  // Weryfikuje wyłącznie pierwszą kategorię pulpitu.
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSlot = getNewsSlotInfo();
      if (currentSlot.slotKey !== lastSlotRef.current) {
        lastSlotRef.current = currentSlot.slotKey;
        // Odświeżenie automatyczne wyłącznie dla pierwszej kategorii widocznej na dashboardzie
        if (activeCategory === primaryCategory) {
          loadCategoryNews(primaryCategory, false);
        } else {
          // Zapisz w tle do pamięci podręcznej dla głównej kategorii bez zmiany aktywnej zakładki
          loadCategoryNews(primaryCategory, false);
        }
      }
    }, 30000); // Odpytanie zegara co 30 sekund
    return () => clearInterval(interval);
  }, [primaryCategory, activeCategory, loadCategoryNews]);

  // Obsługa przełączania kategorii przez użytkownika: pobieranie wyłącznie na żądanie
  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    loadCategoryNews(cat, false);
  };

  // Ręczne wymuszenie odświeżenia wiadomości dla bieżącej kategorii
  const handleManualRefresh = () => {
    loadCategoryNews(activeCategory, true);
  };

  // Rotacja nagłówka ticker bar
  useEffect(() => {
    if (articles.length < 2) return;
    const t = setInterval(() => setTickerIndex(i => (i + 1) % articles.length), 5000);
    return () => clearInterval(t);
  }, [articles.length]);

  const currentCatConfig = CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG['ai'];
  const IconComponent = currentCatConfig.icon;

  return (
    <div className="glass-panel h-full rounded-xl p-4 flex flex-col gap-3 overflow-hidden">
      {/* Nagłówek modułu */}
      <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5" style={{ color: currentCatConfig.color }} />
          <h2 className="font-mono text-sm uppercase tracking-widest text-textMuted">{t('newsTickerTitle')}</h2>
          <span className="w-2 h-2 rounded-full animate-pulse ml-1" style={{ backgroundColor: currentCatConfig.color }} />
        </div>
        <div className="flex items-center gap-2">
          {/* Etykieta slotu z harmonogramem oszczędzania API Brave Search */}
          <div 
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-textMuted hidden sm:flex items-center gap-1.5"
            title="Harmonogram Brave Search: Maksymalnie 3 automatyczne synchronizacje (10:00, 15:00, 20:00) dla kategorii głównej. Pozostałe ładowane wyłącznie po wejściu."
          >
            <Clock className="w-3 h-3 text-accentPrimary" />
            <span>Slot: {slotLabel}</span>
          </div>

          {lastFetch && (
            <span className="font-mono text-[10px] text-textMuted hidden md:block">
              {lastFetch.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          <button
            onClick={handleManualRefresh}
            className="p-1.5 rounded-lg text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10 transition-all cursor-pointer"
            title="Odśwież ręcznie (Wymuszenie zapytania API)"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accentPrimary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Zakładki kategorii: pobieranie następuje dopiero po kliknięciu */}
      <div className="flex gap-1.5 flex-wrap flex-shrink-0">
        {categories.map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          if (!cfg) return null;
          const CatIcon = cfg.icon;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all border cursor-pointer"
              style={{
                backgroundColor: isActive ? `${cfg.color}20` : 'transparent',
                borderColor: isActive ? `${cfg.color}60` : 'rgba(255,255,255,0.05)',
                color: isActive ? cfg.color : 'var(--color-text-muted)',
                boxShadow: isActive ? `0 0 10px ${cfg.color}30` : 'none'
              }}
            >
              <CatIcon className="w-3 h-3" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Pasek Ticker (wyróżniony nagłówek na żywo) */}
      {articles.length > 0 && !loading && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: `${currentCatConfig.color}10`, borderLeft: `2px solid ${currentCatConfig.color}` }}
        >
          <span className="font-mono text-[9px] uppercase tracking-widest flex-shrink-0" style={{ color: currentCatConfig.color }}>{t('newsLive')}</span>
          <p className="font-mono text-xs text-textPrimary truncate">
            {articles[tickerIndex]?.title}
          </p>
        </div>
      )}

      {/* Lista artykułów */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-2 mb-2">
              <div className="animate-pulse h-4 bg-border rounded-md w-3/4" />
              <div className="animate-pulse h-3 bg-border rounded-md w-full" />
              <div className="animate-pulse h-3 bg-border rounded-md w-5/6" />
            </div>
          ))
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <AlertCircle className="w-8 h-8 text-textMuted opacity-40" />
            <p className="text-xs font-mono text-textMuted">{t('newsConnError')}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center text-textMuted text-xs font-mono mt-6">{t('newsNoResults')}</div>
        ) : (
          articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2 p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-surface/50 transition-all duration-200 block"
            >
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-textMuted group-hover:translate-x-0.5 transition-transform" style={{ color: currentCatConfig.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans font-semibold text-textPrimary group-hover:text-accentSecondary transition-colors leading-tight line-clamp-2">
                  {article.title}
                </p>
                {article.description && (
                  <p className="text-[10px] text-textMuted mt-1 leading-relaxed line-clamp-2 font-sans">{article.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {article.source && (
                    <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: currentCatConfig.color }}>
                      {article.source}
                    </span>
                  )}
                  <ExternalLink className="w-2.5 h-2.5 text-textMuted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default ITNewsTicker;
