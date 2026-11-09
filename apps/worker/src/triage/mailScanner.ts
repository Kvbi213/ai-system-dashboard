import * as tls from 'node:tls';
import * as net from 'node:net';

export interface MailScannerConfig {
  host: string;
  port: number;
  user?: string;
  password?: string;
  useTls: boolean;
  timeoutMs?: number;
}

export type MailCategory = 'IMPORTANT' | 'NORMAL' | 'SPAM_NEWSLETTER';

export interface ScannedEmailItem {
  id: string;
  subject: string;
  from: string;
  date?: string;
  category: MailCategory;
  categoryReason: string;
}

export interface MailTriageResult {
  totalUnread: number;
  importantCount: number;
  normalCount: number;
  spamNewsletterCount: number;
  importantMessages: Array<{ subject: string; from: string; date?: string; reason: string }>;
  isConfigured: boolean;
  scannedAt: number;
  items: ScannedEmailItem[];
}

/**
 * Dekoduje nagłówki MIME RFC 2047 (=?charset?encoding?encoded_text?=).
 * Obsługuje B (Base64) oraz Q (Quoted-Printable).
 */
export function decodeMimeHeader(input: string): string {
  if (!input || !input.includes('=?')) {
    return input;
  }

  const mimeRegex = /=\?([^?]+)\?([bBqQ])\?([^?]+)\?=/g;
  return input.replace(mimeRegex, (_, charset, encoding, text) => {
    try {
      const enc = encoding.toUpperCase();
      if (enc === 'B') {
        return Buffer.from(text, 'base64').toString(charset.toLowerCase() === 'utf-8' ? 'utf-8' : 'latin1');
      } else if (enc === 'Q') {
        const decoded = text
          .replace(/_/g, ' ')
          .replace(/=([A-Fa-f0-9]{2})/g, (__, hex) => String.fromCharCode(parseInt(hex, 16)));
        return decoded;
      }
    } catch {
      return text;
    }
    return text;
  });
}

/**
 * Klasyfikuje wiadomość e-mail na podstawie nagłówków (Subject, From, List-Unsubscribe, Precedence).
 */
export function classifyEmailHeaders(headers: {
  subject: string;
  from: string;
  listUnsubscribe?: string;
  precedence?: string;
}): { category: MailCategory; reason: string } {
  const subject = decodeMimeHeader(headers.subject || '').trim();
  const from = decodeMimeHeader(headers.from || '').trim();
  const combined = `${subject} ${from}`.toLowerCase();

  // 1. Sprawdzenie nagłówków masowych / spam / newsletter
  if (headers.listUnsubscribe && headers.listUnsubscribe.trim().length > 0) {
    return {
      category: 'SPAM_NEWSLETTER',
      reason: 'Nagłówek List-Unsubscribe obecny w wiadomości'
    };
  }

  const precedence = (headers.precedence || '').toLowerCase();
  if (precedence === 'bulk' || precedence === 'list' || precedence === 'junk') {
    return {
      category: 'SPAM_NEWSLETTER',
      reason: `Nagłówek Precedence: ${precedence}`
    };
  }

  const spamKeywords = [
    'newsletter', 'promocj', 'wyprzedaż', 'wyprzedaz', 'rabat', 'kod rabatowy',
    'okazja', 'oferta specjalna', 'supercena', 'black friday', 'cyber monday',
    'wypisz się', 'rezygnuj z subskrypcji', 'subskrypcj', 'ostatnia szansa',
    'newslettera', 'sale', 'discount', 'promotions', 'marketing'
  ];

  for (const kw of spamKeywords) {
    if (combined.includes(kw)) {
      return {
        category: 'SPAM_NEWSLETTER',
        reason: `Słowo kluczowe marketingu/newslettera: "${kw}"`
      };
    }
  }

  // 2. Sprawdzenie kategorii WAŻNE / PILNE
  // Domeny i nadawcy o wysokim priorytecie:
  const importantSenders = [
    'librus', 'szkola', 'szkoła', 'edu.pl', 'uodo', 'gov.pl',
    'mikrus', 'srv.mikr.us', 'cloudflare', 'github', 'ovh', 'hetzner', 'digitalocean',
    'mbank', 'santander', 'pkobp', 'pko bp', 'ing', 'millennium', 'alior', 'revolut',
    'paypal', 'payu', 'przelewy24', 'allegro finanse', 'faktura', 'inpost'
  ];

  for (const senderPattern of importantSenders) {
    if (from.toLowerCase().includes(senderPattern)) {
      return {
        category: 'IMPORTANT',
        reason: `Zaufany / kluczowy nadawca: "${senderPattern}"`
      };
    }
  }

  // Słowa kluczowe w temacie wskazujące na wysoki priorytet lub zobowiązania
  const importantKeywords = [
    'faktura', 'invoice', 'rachunek', 'opłata', 'oplata', 'do zapłaty', 'termin płatności',
    'pilne', 'urgent', 'alert', 'awaria', 'ostrzeżenie', 'warning', 'bezpieczeństwo', 'security',
    'kod weryfikacyjny', 'hasło', 'reset hasła', 'autoryzacja', 'potwierdzenie transakcji',
    'sprawdzian', 'kartkówka', 'ocena', 'zebranie', 'wywiadówka', 'nieobecność', 'egzamin'
  ];

  for (const kw of importantKeywords) {
    if (combined.includes(kw)) {
      return {
        category: 'IMPORTANT',
        reason: `Słowo kluczowe krytyczne w temacie/treści: "${kw}"`
      };
    }
  }

  // 3. Kategoria domyślna: Zwykła korespondencja
  return {
    category: 'NORMAL',
    reason: 'Standardowa korespondencja bezpośrednia'
  };
}

/**
 * Klient IMAP RFC 3501 oparty o natywne gniazda Node.js TLS/Net.
 * Brak zależności od zewnętrznych modułów pnpm/npm.
 */
export class MailScanner {
  private config: MailScannerConfig;

  constructor(customConfig?: Partial<MailScannerConfig>) {
    this.config = {
      host: customConfig?.host || process.env.IMAP_HOST || 'imap.gmail.com',
      port: customConfig?.port || parseInt(process.env.IMAP_PORT || '993', 10),
      user: customConfig?.user || process.env.IMAP_USER,
      password: customConfig?.password || process.env.IMAP_PASSWORD,
      useTls: customConfig?.useTls ?? (process.env.IMAP_TLS !== 'false'),
      timeoutMs: customConfig?.timeoutMs || 15000
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.user && this.config.password && this.config.user.trim().length > 0);
  }

  /**
   * Skanuje skrzynkę odbiorczą (INBOX) pod kątem nieprzeczytanych wiadomości (UNSEEN).
   * W razie braku konfiguracji zachowuje graceful degradation.
   */
  public async scanInbox(): Promise<MailTriageResult> {
    if (!this.isConfigured()) {
      console.log('[*] MAIL_SCANNER :: Brak poświadczeń IMAP (IMAP_USER / IMAP_PASSWORD). Tryb pasywny.');
      return {
        totalUnread: 0,
        importantCount: 0,
        normalCount: 0,
        spamNewsletterCount: 0,
        importantMessages: [],
        isConfigured: false,
        scannedAt: Date.now(),
        items: []
      };
    }

    try {
      const items = await this.executeImapSession();
      let importantCount = 0;
      let normalCount = 0;
      let spamCount = 0;
      const importantMessages: Array<{ subject: string; from: string; date?: string; reason: string }> = [];

      for (const item of items) {
        if (item.category === 'IMPORTANT') {
          importantCount++;
          importantMessages.push({
            subject: item.subject,
            from: item.from,
            date: item.date,
            reason: item.categoryReason
          });
        } else if (item.category === 'SPAM_NEWSLETTER') {
          spamCount++;
        } else {
          normalCount++;
        }
      }

      console.log(`[+] SUCCESS :: Zeskanowano IMAP: ${items.length} nieprzeczytanych (Ważne: ${importantCount}, Zwykłe: ${normalCount}, Spam: ${spamCount}).`);

      return {
        totalUnread: items.length,
        importantCount,
        normalCount,
        spamNewsletterCount: spamCount,
        importantMessages,
        isConfigured: true,
        scannedAt: Date.now(),
        items
      };
    } catch (err) {
      console.error('[!] MAIL_SCANNER :: Błąd podczas sesji IMAP:', err);
      return {
        totalUnread: 0,
        importantCount: 0,
        normalCount: 0,
        spamNewsletterCount: 0,
        importantMessages: [],
        isConfigured: true,
        scannedAt: Date.now(),
        items: []
      };
    }
  }

  /**
   * Wykonuje deterministyczną sesję IMAP za pośrednictwem gniazda TLS.
   */
  private executeImapSession(): Promise<ScannedEmailItem[]> {
    return new Promise((resolve, reject) => {
      let socket: net.Socket | tls.TLSSocket;
      let tagCounter = 1;
      let buffer = '';
      const items: ScannedEmailItem[] = [];
      let isDone = false;

      const nextTag = () => `A${tagCounter++}`;

      const finish = (result?: ScannedEmailItem[], error?: Error) => {
        if (isDone) return;
        isDone = true;
        try {
          socket.end();
          socket.destroy();
        } catch {
          // cichy cleanup
        }
        if (error) {
          reject(error);
        } else {
          resolve(result || items);
        }
      };

      const timer = setTimeout(() => {
        finish(undefined, new Error(`[MAIL_SCANNER_TIMEOUT] Przekroczono limit czasu operacji IMAP (${this.config.timeoutMs}ms)`));
      }, this.config.timeoutMs);

      const connectOpts: tls.ConnectionOptions = {
        host: this.config.host,
        port: this.config.port,
        rejectUnauthorized: false
      };

      try {
        if (this.config.useTls) {
          socket = tls.connect(connectOpts);
        } else {
          socket = net.connect({ host: this.config.host, port: this.config.port });
        }
      } catch (err) {
        clearTimeout(timer);
        return reject(err);
      }

      socket.setEncoding('utf-8');

      // Maszyna stanów IMAP
      let currentState: 'WAIT_GREETING' | 'WAIT_LOGIN' | 'WAIT_SELECT' | 'WAIT_SEARCH' | 'WAIT_FETCH' | 'LOGOUT' = 'WAIT_GREETING';
      let activeTag = '';
      let unseenIds: string[] = [];

      const sendCommand = (cmd: string): string => {
        const tag = nextTag();
        activeTag = tag;
        socket.write(`${tag} ${cmd}\r\n`);
        return tag;
      };

      socket.on('data', (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || ''; // Zachowaj niedokończoną linię

        for (const line of lines) {
          if (currentState === 'WAIT_GREETING') {
            if (line.startsWith('* OK')) {
              currentState = 'WAIT_LOGIN';
              const cleanUser = (this.config.user || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
              const cleanPass = (this.config.password || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
              sendCommand(`LOGIN "${cleanUser}" "${cleanPass}"`);
            }
          } else if (currentState === 'WAIT_LOGIN') {
            if (line.startsWith(`${activeTag} OK`)) {
              currentState = 'WAIT_SELECT';
              sendCommand('SELECT INBOX');
            } else if (line.startsWith(`${activeTag} NO`) || line.startsWith(`${activeTag} BAD`)) {
              clearTimeout(timer);
              return finish(undefined, new Error(`[IMAP_AUTH_FAILED] Błąd uwierzytelnienia: ${line}`));
            }
          } else if (currentState === 'WAIT_SELECT') {
            if (line.startsWith(`${activeTag} OK`)) {
              currentState = 'WAIT_SEARCH';
              sendCommand('SEARCH UNSEEN');
            } else if (line.startsWith(`${activeTag} NO`) || line.startsWith(`${activeTag} BAD`)) {
              clearTimeout(timer);
              return finish(undefined, new Error(`[IMAP_SELECT_FAILED] Nie można wybrać INBOX: ${line}`));
            }
          } else if (currentState === 'WAIT_SEARCH') {
            if (line.startsWith('* SEARCH')) {
              const rawIds = line.substring(8).trim().split(/\s+/).filter(Boolean);
              unseenIds = rawIds;
            }
            if (line.startsWith(`${activeTag} OK`)) {
              if (unseenIds.length === 0) {
                // Brak nieprzeczytanych wiadomości
                currentState = 'LOGOUT';
                sendCommand('LOGOUT');
                clearTimeout(timer);
                return finish([]);
              } else {
                // Ogranicz do ostatnich 25 wiadomości, aby uniknąć przeciążenia pamięci
                const fetchIds = unseenIds.slice(-25).join(',');
                currentState = 'WAIT_FETCH';
                sendCommand(`FETCH ${fetchIds} (BODY.PEEK[HEADER.FIELDS (SUBJECT FROM DATE LIST-UNSUBSCRIBE PRECEDENCE)])`);
              }
            }
          } else if (currentState === 'WAIT_FETCH') {
            if (line.startsWith(`${activeTag} OK`)) {
              currentState = 'LOGOUT';
              sendCommand('LOGOUT');
              clearTimeout(timer);
              return finish(items);
            }
          } else if (currentState === 'LOGOUT') {
            if (line.startsWith(`${activeTag} OK`) || line.startsWith('* BYE')) {
              clearTimeout(timer);
              return finish(items);
            }
          }
        }

        // Jeżeli jesteśmy w stanie WAIT_FETCH, parsowanie nagłówków w locie z bufora
        if (currentState === 'WAIT_FETCH') {
          this.parseFetchHeadersChunk(lines, items);
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timer);
        finish(undefined, err);
      });

      socket.on('close', () => {
        clearTimeout(timer);
        finish(items);
      });
    });
  }

  /**
   * Pomocnicza metoda parsowania zwróconych nagłówków z polecenia FETCH.
   */
  private parseFetchHeadersChunk(lines: string[], targetItems: ScannedEmailItem[]): void {
    let currentId = '';
    let currentSubject = '';
    let currentFrom = '';
    let currentDate = '';
    let currentUnsubscribe = '';
    let currentPrecedence = '';
    let inHeaderBlock = false;

    for (const line of lines) {
      const fetchStart = line.match(/^\*\s+(\d+)\s+FETCH/i);
      if (fetchStart) {
        currentId = fetchStart[1];
        currentSubject = '';
        currentFrom = '';
        currentDate = '';
        currentUnsubscribe = '';
        currentPrecedence = '';
        inHeaderBlock = true;
        continue;
      }

      if (inHeaderBlock) {
        if (line.startsWith(')')) {
          inHeaderBlock = false;
          if (currentId && !targetItems.some((i) => i.id === currentId)) {
            const classified = classifyEmailHeaders({
              subject: currentSubject,
              from: currentFrom,
              listUnsubscribe: currentUnsubscribe,
              precedence: currentPrecedence
            });

            targetItems.push({
              id: currentId,
              subject: decodeMimeHeader(currentSubject || '(Brak tematu)'),
              from: decodeMimeHeader(currentFrom || '(Nieznany nadawca)'),
              date: currentDate || undefined,
              category: classified.category,
              categoryReason: classified.reason
            });
          }
          continue;
        }

        const lower = line.toLowerCase();
        if (lower.startsWith('subject:')) {
          currentSubject = line.substring(8).trim();
        } else if (lower.startsWith('from:')) {
          currentFrom = line.substring(5).trim();
        } else if (lower.startsWith('date:')) {
          currentDate = line.substring(5).trim();
        } else if (lower.startsWith('list-unsubscribe:')) {
          currentUnsubscribe = line.substring(17).trim();
        } else if (lower.startsWith('precedence:')) {
          currentPrecedence = line.substring(11).trim();
        } else if (line.startsWith(' ') || line.startsWith('\t')) {
          // Kontynuacja poprzedniego nagłówka (RFC 822 unfolding)
          if (currentSubject && !currentFrom && !currentDate) {
            currentSubject += ' ' + line.trim();
          }
        }
      }
    }
  }
}
