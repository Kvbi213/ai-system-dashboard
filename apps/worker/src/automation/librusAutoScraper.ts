import { PushbulletDispatcher } from '../pushbullet/dispatcher.js';

export interface LibrusAutoScraperOptions {
  apiGatewayUrl: string;
  dispatcher?: PushbulletDispatcher;
  minIntervalMinutes?: number; // domyślnie 45
  maxIntervalMinutes?: number; // domyślnie 75
}

export interface KnownGradeInfo {
  id: string;
  subject: string;
  value: number;
  displayValue: string;
  category: string;
  weight: number;
  date?: string;
}

export class LibrusAutoScraper {
  private apiGatewayUrl: string;
  private dispatcher?: PushbulletDispatcher;
  private minIntervalMinutes: number;
  private maxIntervalMinutes: number;
  private nextRunTimeout: NodeJS.Timeout | null = null;
  private isScraping: boolean = false;
  private knownGrades = new Map<string, KnownGradeInfo>();
  private isInitialized: boolean = false;
  private lastBreakScrapeTimestamp: number = 0;

  constructor(options: LibrusAutoScraperOptions) {
    this.apiGatewayUrl = options.apiGatewayUrl;
    this.dispatcher = options.dispatcher;
    this.minIntervalMinutes = options.minIntervalMinutes || 45;
    this.maxIntervalMinutes = options.maxIntervalMinutes || 75;
  }

  /**
   * Startuje nieregularny (jittered) harmonogram scrapingu imitujący człowieka.
   */
  public start(): void {
    console.log(
      `[*] LIBRUS SCRAPER :: Inicjalizacja harmonogramu anti-bot z jitterem (${this.minIntervalMinutes}-${this.maxIntervalMinutes} min).`
    );
    // Wykonaj pierwsze pobranie stanu bazy ocen po 5 sekundach od startu
    setTimeout(() => {
      this.performScrape('INITIAL_BOOT');
      this.scheduleNextJitteredRun();
    }, 5000);
  }

  /**
   * Planuje kolejne odpytanie w nieregularnym, losowym odstępie czasu.
   */
  public scheduleNextJitteredRun(): void {
    if (this.nextRunTimeout) {
      clearTimeout(this.nextRunTimeout);
    }

    const range = this.maxIntervalMinutes - this.minIntervalMinutes;
    const randomMinutes = this.minIntervalMinutes + Math.floor(Math.random() * (range + 1));
    const delayMs = randomMinutes * 60 * 1000;

    const nextDate = new Date(Date.now() + delayMs);
    const formattedNext = nextDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    console.log(
      `[*] LIBRUS SCRAPER :: Następne automatyczne sprawdzenie za ${randomMinutes} min (o godz. ${formattedNext}) [Jitter Anti-Bot].`
    );

    this.nextRunTimeout = setTimeout(() => {
      this.performScrape('JITTER_TIMER');
      this.scheduleNextJitteredRun();
    }, delayMs);
  }

  /**
   * Wyzwalacz zdarzeniowy (data-driven): wywoływany np. tuż po zakończeniu lekcji lub w trakcie przerwy.
   * Zabezpieczony cooldownem 10 minut, aby nie przeciążać portalu.
   */
  public async triggerBreakScrape(reason = 'LESSON_BREAK_TRIGGER'): Promise<boolean> {
    const now = Date.now();
    const cooldownMs = 10 * 60 * 1000; // 10 minut odstępu między przerwami
    if (now - this.lastBreakScrapeTimestamp < cooldownMs) {
      console.log(`[*] LIBRUS SCRAPER :: Wyzwalacz przerwy pominięty (aktywny cooldown 10 min).`);
      return false;
    }

    this.lastBreakScrapeTimestamp = now;
    console.log(`[>] LIBRUS SCRAPER :: Uruchomiono wyzwalacz zdarzeniowy (data-driven): "${reason}".`);
    await this.performScrape(reason);
    return true;
  }

  /**
   * Realizuje proces scrapingu, synchronizacji i detekcji nowych ocen.
   */
  public async performScrape(triggerSource = 'MANUAL'): Promise<{ newGradesCount: number; success: boolean }> {
    if (this.isScraping) {
      console.log('[*] LIBRUS SCRAPER :: Scraping już trwa w tle, pomijanie nakładającego się żądania.');
      return { newGradesCount: 0, success: false };
    }

    this.isScraping = true;
    try {
      console.log(`[>] LIBRUS SCRAPER :: Rozpoczęto synchronizację Librusa (źródło: ${triggerSource})...`);

      // 1. Wywołanie POST /school/sync (brama API synchronizuje dane z sesją)
      try {
        const syncRes = await fetch(`${this.apiGatewayUrl}/school/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev-operator-token',
            'x-dev-bypass': 'true'
          }
        });
        if (syncRes.ok) {
          console.log('[+] LIBRUS SCRAPER :: Pomyślnie zsynchronizowano dane w API Gateway.');
        } else {
          console.warn(`[!] LIBRUS SCRAPER :: Brama API zwróciła kod ${syncRes.status} dla /school/sync (kontynuacja inspekcji lokalnej).`);
        }
      } catch (err: any) {
        console.warn(`[!] LIBRUS SCRAPER :: Ostrzeżenie przy wywołaniu /school/sync: ${err.message}`);
      }

      // 2. Pobranie zaktualizowanego wykazu ocen z /school/grades
      const gradesRes = await fetch(`${this.apiGatewayUrl}/school/grades`, {
        headers: {
          'Authorization': 'Bearer dev-operator-token',
          'x-dev-bypass': 'true'
        }
      });

      if (!gradesRes.ok) {
        console.error(`[!] LIBRUS SCRAPER :: Błąd pobierania ocen: HTTP ${gradesRes.status}`);
        return { newGradesCount: 0, success: false };
      }

      const gradesData = (await gradesRes.json()) as any;
      const subjects: any[] = Array.isArray(gradesData?.subjects) ? gradesData.subjects : [];

      // Zbierz wszystkie oceny w spłaszczoną tablicę
      const currentGradeList: KnownGradeInfo[] = [];
      for (const sub of subjects) {
        const grades = Array.isArray(sub.grades) ? sub.grades : [];
        for (const g of grades) {
          const display = (g.displayValue && g.displayValue !== '0')
            ? String(g.displayValue).trim()
            : (g.value === 0 ? '+' : String(g.value));

          currentGradeList.push({
            id: String(g.id),
            subject: String(sub.name || 'Przedmiot'),
            value: Number(g.value || 0),
            displayValue: display,
            category: String(g.category || 'Brak kategorii'),
            weight: Number(g.weight || 1),
            date: g.date
          });
        }
      }

      // 3. Detekcja nowych ocen
      if (!this.isInitialized) {
        // Pierwszy przebieg: zarejestruj istniejące oceny jako bazę odniesienia
        for (const g of currentGradeList) {
          this.knownGrades.set(g.id, g);
        }
        this.isInitialized = true;
        console.log(`[+] LIBRUS SCRAPER :: Zainicjalizowano bazę odniesienia (${this.knownGrades.size} istniejących ocen).`);
        return { newGradesCount: 0, success: true };
      }

      // Kolejne przebiegi: sprawdź czy pojawiły się nowe identyfikatory ocen
      const newlyDiscovered: KnownGradeInfo[] = [];
      for (const g of currentGradeList) {
        if (!this.knownGrades.has(g.id)) {
          this.knownGrades.set(g.id, g);
          newlyDiscovered.push(g);
        }
      }

      if (newlyDiscovered.length > 0) {
        console.log(`[+] LIBRUS SCRAPER :: WYKRYTO NOWE OCENY (${newlyDiscovered.length})!`);
        for (const ng of newlyDiscovered) {
          const title = `NOWA OCENA W LIBRUS :: ${ng.subject.toUpperCase()}`;
          const body = `Otrzymano ocenę: ${ng.displayValue} z przedmiotu ${ng.subject}.\nKategoria: ${ng.category} | Waga: ${ng.weight}${ng.date ? ` | Data: ${ng.date}` : ''}.`;

          console.log(`[+] PUSHBULLET DISPATCH :: "${title}" -> "${body}"`);
          this.dispatcher?.enqueue({
            title,
            body,
            priority: 'HIGH'
          });
        }
      } else {
        console.log(`[*] LIBRUS SCRAPER :: Brak nowych ocen. Łącznie zarejestrowanych: ${this.knownGrades.size}.`);
      }

      return { newGradesCount: newlyDiscovered.length, success: true };
    } catch (error: any) {
      console.error(`[!] LIBRUS SCRAPER :: Błąd wykonania procesu scrapingu: ${error.message}`);
      return { newGradesCount: 0, success: false };
    } finally {
      this.isScraping = false;
    }
  }

  public stop(): void {
    if (this.nextRunTimeout) {
      clearTimeout(this.nextRunTimeout);
      this.nextRunTimeout = null;
    }
  }
}
