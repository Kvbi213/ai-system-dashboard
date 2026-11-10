import { dbStore } from '../../db/store.js';
import { sqliteStore, EveningDigestRecord } from '../../db/sqliteStore.js';
import { llmGateway } from '../ai/llmGateway.js';
import { pushbulletService } from '../pushbullet/pushbulletService.js';
import { getWarsawTime } from './timeUtils.js';

export interface DailyDigestInputEvents {
  emails?: Array<{ subject: string; from: string; date?: string; category?: string }>;
  pushNotifications?: Array<{ title: string; body: string; type?: string; amount?: number }>;
  transactions?: Array<{ title: string; amount: number; envelope?: string; category?: string }>;
  tasks?: Array<{ title: string; completed?: boolean; priority?: string }>;
  schoolAlerts?: Array<{ subject: string; raw?: string }>;
}

export interface EveningDigestResult {
  success: boolean;
  digest: EveningDigestRecord;
  pushResult?: {
    success: boolean;
    simulated: boolean;
    iden?: string;
    error?: string;
  };
}

export class EveningDigestService {
  /**
   * Generuje wieczorne podsumowanie AI z całego dnia (zgodnie z życzeniem operatora: około godziny 22:00).
   */
  public async generateDigest(options?: {
    customEvents?: DailyDigestInputEvents;
    sendPush?: boolean;
    simulatedDate?: Date;
  }): Promise<EveningDigestResult> {
    const targetDate = options?.simulatedDate || new Date();
    const warsaw = getWarsawTime(targetDate);
    const dateKey = warsaw.dateKey; // YYYY-MM-DD
    const sendPush = options?.sendPush ?? true;

    // 1. Zbieranie faktów i danych z całego dnia
    const dayData = this.collectDayData(dateKey, options?.customEvents);

    // 2. Budowa zwięzłego promptu analitycznego dla silnika AI
    const prompt = this.buildPromptForLLM(warsaw.formattedTime, dateKey, dayData);

    let summaryText = '';
    let provider = 'local';
    let model = 'omnidash-deterministic-core-v4';

    try {
      const aiResponse = await llmGateway.complete({
        message: prompt,
        userId: 'operator-system-core',
        temperature: 0.5,
        maxTokens: 4000
      });

      summaryText = aiResponse.reply.trim();
      provider = aiResponse.provider;
      model = aiResponse.model;
    } catch (err: unknown) {
      console.warn('[!] EveningDigest: Błąd LLM Gateway, przejście do silnika deterministycznego:', err);
      summaryText = this.buildDeterministicSummary(warsaw.formattedTime, dayData);
      provider = 'local-fallback';
      model = 'deterministic-triage-v4';
    }

    if (!summaryText || summaryText.length < 20) {
      summaryText = this.buildDeterministicSummary(warsaw.formattedTime, dayData);
    }

    // 3. Wypchnięcie przez Pushbullet na smartfon operatora (jeśli włączone)
    let pushResult: { success: boolean; simulated: boolean; iden?: string; error?: string } | undefined;
    if (sendPush) {
      try {
        const pushTitle = `🌙 Wieczorny Przegląd Dnia (${warsaw.formattedTime})`;
        const res = await pushbulletService.sendPush({
          title: pushTitle,
          body: summaryText,
          priority: 'NORMAL'
        });
        pushResult = {
          success: res.success,
          simulated: res.simulated,
          iden: res.iden,
          error: res.error
        };
      } catch (pushErr: any) {
        console.error('[!] EveningDigest: Błąd wysyłania powiadomienia Pushbullet:', pushErr);
        pushResult = {
          success: false,
          simulated: false,
          error: pushErr instanceof Error ? pushErr.message : 'Pushbullet error'
        };
      }
    }

    // 4. Trwały zapis w bazie SQLite
    const savedRecord = sqliteStore.saveEveningDigest({
      date: dateKey,
      summaryText,
      provider,
      model,
      sentToPushbullet: Boolean(pushResult?.success),
      rawPayloadJson: JSON.stringify({
        collectedCounts: {
          emails: dayData.emails.length,
          transactions: dayData.transactions.length,
          tasks: dayData.tasks.length,
          schoolAlerts: dayData.schoolAlerts.length
        },
        pushResult
      })
    });

    console.log(`[+] SUCCESS :: Wygenerowano i zapisano wieczorny digest AI [${savedRecord.id}] (${provider}/${model}).`);

    return {
      success: true,
      digest: savedRecord,
      pushResult
    };
  }

  /**
   * Zwraca ostatnio wygenerowany wieczorny digest z bazy danych.
   */
  public getLatestDigest(): EveningDigestRecord | null {
    return sqliteStore.getLatestEveningDigest();
  }

  /**
   * Zwraca historię ostatnich digestów.
   */
  public getHistory(limit = 10): EveningDigestRecord[] {
    return sqliteStore.getEveningDigests(limit);
  }

  /**
   * Agreguje dane z bazy i zdarzeń wejściowych z całego dnia.
   */
  private collectDayData(dateKey: string, customEvents?: DailyDigestInputEvents) {
    // Transakcje finansowe
    const dbTransactions = sqliteStore.getTransactions()
      .filter((t) => (t.date && t.date.startsWith(dateKey)))
      .map((t) => ({
        title: t.title,
        amount: t.amount,
        envelope: t.envelope,
        category: t.category
      }));

    const allTransactions = [
      ...dbTransactions,
      ...(customEvents?.transactions || [])
    ];

    // Zadania
    const dbTasks = sqliteStore.getTasks().map((t) => ({
      title: t.title,
      completed: Boolean(t.completed),
      priority: t.priority
    }));

    const allTasks = [
      ...dbTasks.slice(-10),
      ...(customEvents?.tasks || [])
    ];

    // Wydarzenia szkolne / sprawdziany
    const schoolEvents = dbStore.getEvents().filter((e) => e.date === dateKey);

    // E-maile
    const emails = customEvents?.emails || [];

    // Powiadomienia mobilne / notatki
    const pushNotifications = customEvents?.pushNotifications || [];

    // Alerty szkolne
    const schoolAlerts = customEvents?.schoolAlerts || [];

    return {
      dateKey,
      transactions: allTransactions,
      tasks: allTasks,
      schoolEvents,
      schoolAlerts,
      emails,
      pushNotifications
    };
  }

  /**
   * Buduje wyspecjalizowany prompt dla modelu językowego.
   */
  private buildPromptForLLM(
    timeFormatted: string,
    dateKey: string,
    data: ReturnType<typeof this.collectDayData>
  ): string {
    const totalSpent = data.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

    return `Jesteś osobistym, inteligentnym asystentem operatora (OmniDash AI). Jest godzina ${timeFormatted} (${dateKey}) – czas na wieczorne podsumowanie całego dnia (zamiast uciążliwych powiadomień co 15 minut).

Twoim celem jest przygotować inteligentny, życiowy, zwięzły i czytelny przegląd mijającego dnia.
Zasady:
1. Pisz po polsku, bezpośrednio, w życzliwym, wyważonym tonie.
2. Zamiast pustych technicznych tabelek, podsumuj dzień syntetycznie i po ludzku.
3. Podziel treść na logiczne sekcje:
   - 📬 Poczta i Ważne Wiadomości (jeśli były ważne maile, wskaż sedno, od kogo i o co chodzi)
   - 💰 Finanse i Wydatki (łączna suma wydatków z dnia: ${totalSpent.toFixed(2)} PLN, najważniejsze pozycje)
   - 📚 Szkoła i Sprawy Edukacyjne (sprawdziany, oceny, zastępstwa)
   - ✅ Zadania i Postępy (co zostało zrobione, co czeka na jutro)
   - 🌙 Zakończenie dnia (jedno naturalne zdanie z życzeniem odpoczynku i spokojnego wieczoru)
4. Jeśli w danej kategorii nie było żadnych zdarzeń, wspomnij o tym w jednym krótkim, naturalnym zdaniu (np. "Brak nowych pilnych wiadomości w skrzynce").
5. Ogranicz tekst do około 150-250 słów, tak aby idealnie czytało się to jako jedno powiadomienie Push na smartfonie.

DANE Z CAŁEGO DNIA:
- E-MAILE (${data.emails.length}):
${data.emails.length > 0 ? data.emails.map((e) => `  * [${e.category || 'INFO'}] "${e.subject}" od: ${e.from}`).join('\n') : '  Brak zarejestrowanych maili'}

- TRANSAKCJE (${data.transactions.length}, suma: ${totalSpent.toFixed(2)} PLN):
${data.transactions.length > 0 ? data.transactions.map((t) => `  * ${t.title}: ${t.amount.toFixed(2)} PLN (${t.envelope || 'INNE'})`).join('\n') : '  Brak wydatków w dniu dzisiejszym'}

- ZADANIA (${data.tasks.length}):
${data.tasks.length > 0 ? data.tasks.map((t) => `  * [${t.completed ? 'UKOŃCZONE' : 'DO ZROBIENIA'}] ${t.title} (priorytet: ${t.priority})`).join('\n') : '  Brak zadań w toku'}

- SZKOŁA / LIBRUS (${data.schoolEvents.length + data.schoolAlerts.length}):
${data.schoolEvents.length > 0 ? data.schoolEvents.map((e) => `  * Wydarzenie: ${e.title} (${e.type})`).join('\n') : ''}
${data.schoolAlerts.length > 0 ? data.schoolAlerts.map((a) => `  * Alert: ${a.subject}`).join('\n') : ''}
${data.schoolEvents.length === 0 && data.schoolAlerts.length === 0 ? '  Brak nowych alertów szkolnych' : ''}

- POWIADOMIENIA ZE SMARTFONA (${data.pushNotifications.length}):
${data.pushNotifications.length > 0 ? data.pushNotifications.map((p) => `  * ${p.title}: ${p.body}`).join('\n') : '  Brak'}

Przygotuj teraz ostateczną treść wieczornego podsumowania.`;
  }

  /**
   * Deterministyczny generator podsumowania w przypadku braku połączenia z API LLM.
   */
  private buildDeterministicSummary(
    timeFormatted: string,
    data: ReturnType<typeof this.collectDayData>
  ): string {
    const totalSpent = data.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const lines: string[] = [];

    lines.push(`🌙 Wieczorny Przegląd Dnia (${timeFormatted})`);
    lines.push('');

    // Poczta
    if (data.emails.length > 0) {
      lines.push(`📬 Poczta: ${data.emails.length} odebranych wiadomości.`);
      for (const e of data.emails.slice(0, 3)) {
        lines.push(`• ${e.subject} (od: ${e.from})`);
      }
    } else {
      lines.push('📬 Poczta: Skrzynka spokojna, brak pilnych wiadomości.');
    }
    lines.push('');

    // Finanse
    if (data.transactions.length > 0) {
      lines.push(`💰 Finanse: Wydano dzisiaj łącznie ${totalSpent.toFixed(2)} PLN (${data.transactions.length} transakcji).`);
      for (const t of data.transactions.slice(0, 3)) {
        lines.push(`• ${t.title}: ${t.amount.toFixed(2)} PLN [${t.envelope || 'INNE'}]`);
      }
    } else {
      lines.push('💰 Finanse: Dziś portfel odpoczywał – brak zarejestrowanych wydatków.');
    }
    lines.push('');

    // Szkoła
    if (data.schoolEvents.length > 0 || data.schoolAlerts.length > 0) {
      lines.push('📚 Szkoła & Librus:');
      for (const e of data.schoolEvents) {
        lines.push(`• ${e.title} (${e.type})`);
      }
      for (const a of data.schoolAlerts) {
        lines.push(`• ${a.subject}`);
      }
    } else {
      lines.push('📚 Szkoła: Brak zaległych alertów i nieprzewidzianych zmian.');
    }
    lines.push('');

    // Zadania
    const pendingTasks = data.tasks.filter((t) => !t.completed);
    if (pendingTasks.length > 0) {
      lines.push(`✅ Zadania: ${pendingTasks.length} oczekujących na jutro.`);
      for (const t of pendingTasks.slice(0, 2)) {
        lines.push(`• ${t.title}`);
      }
    } else {
      lines.push('✅ Zadania: Wszystkie bieżące sprawy pod kontrolą.');
    }
    lines.push('');
    lines.push('Dobrej nocy i regenerującego odpoczynku!');

    return lines.join('\n');
  }
}

export const eveningDigestService = new EveningDigestService();
