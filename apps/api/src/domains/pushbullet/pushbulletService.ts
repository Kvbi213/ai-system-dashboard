import { z } from 'zod';

export const SendPushSchema = z.object({
  title: z.string().min(1, 'Tytuł powiadomienia jest wymagany'),
  body: z.string().min(1, 'Treść powiadomienia jest wymagana'),
  priority: z.enum(['CRITICAL', 'HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  targetEmail: z.string().email().optional(),
  targetDeviceId: z.string().optional()
});

export type SendPushPayload = z.infer<typeof SendPushSchema>;

export interface PushResult {
  success: boolean;
  iden?: string;
  simulated?: boolean;
  message?: string;
  error?: string;
  sentAt: string;
}

export interface VerifyTokenResult {
  valid: boolean;
  user?: {
    name: string;
    email: string;
    iden: string;
  };
  error?: string;
}

export interface PushHistoryEntry {
  id: string;
  title: string;
  body: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  success: boolean;
  simulated: boolean;
  timestamp: string;
}

/**
 * Formatowanie i sanityzacja treści powiadomienia Push na urządzenia mobilne.
 * Usuwa literalne sekwencje \n, formatowanie Markdown nieobsługiwane w natywnych pushach.
 */
export function formatPushText(text: string): string {
  if (!text) return '';
  let clean = String(text)
    .replace(/\\+r\\+n/gi, '\n')
    .replace(/\\+n/gi, '\n')
    .replace(/\\+r/gi, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\\r/g, '\n');

  // Usunięcie znaczników Markdown, które zaśmiecają natywny system powiadomień Android/iOS
  clean = clean
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '');

  return clean.trim();
}

export class PushbulletService {
  private history: PushHistoryEntry[] = [];
  private readonly maxHistorySize = 100;

  /**
   * Zwraca aktywny klucz API z konfiguracji środowiskowej lub pusty ciąg.
   */
  public getApiKey(override?: string): string {
    if (override && override.trim().length > 0) {
      return override.trim();
    }
    const envKey = process.env.PUSHBULLET_API_KEY || '';
    if (envKey === 'twój_klucz_pushbullet_tutaj' || envKey === 'your_pushbullet_api_key') {
      return '';
    }
    return envKey.trim();
  }

  /**
   * Weryfikuje poprawność tokena API przez oficjalny endpoint /v2/users/me.
   */
  public async verifyToken(token?: string): Promise<VerifyTokenResult> {
    const key = this.getApiKey(token);
    if (!key) {
      return {
        valid: false,
        error: 'Brak klucza API w konfiguracji środowiskowej (.env: PUSHBULLET_API_KEY).'
      };
    }

    // Tryb symulacyjny dla testów i atrap dev
    if (key.startsWith('mock_') || key.startsWith('simulated_') || key === 'test_token_valid') {
      return {
        valid: true,
        user: {
          name: 'Jakub Lis (Operator Dev)',
          email: 'operator@omnidash.local',
          iden: 'ujAzK7yZ001'
        }
      };
    }

    try {
      const response = await fetch('https://api.pushbullet.com/v2/users/me', {
        headers: {
          'Access-Token': key
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            valid: false,
            error: 'Odmowa autoryzacji Pushbullet (401 Unauthorized): Nieprawidłowy Access-Token.'
          };
        }
        return {
          valid: false,
          error: `Błąd serwera Pushbullet API (Status: ${response.status}).`
        };
      }

      const data: any = await response.json();
      return {
        valid: true,
        user: {
          name: data.name || 'Użytkownik Pushbullet',
          email: data.email || 'Brak emaila',
          iden: data.iden || 'unknown'
        }
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Błąd połączenia z Pushbullet API: ${err.message}`
      };
    }
  }

  /**
   * Wysyła powiadomienie Pushbullet (lub rejestruje w trybie symulacji gdy brak klucza).
   */
  public async sendPush(payload: SendPushPayload): Promise<PushResult> {
    const validated = SendPushSchema.parse(payload);
    const key = this.getApiKey();
    const formattedTitle = (validated.title || 'OmniDash Alert').trim();
    const formattedBody = formatPushText(validated.body);
    const nowIso = new Date().toISOString();

    // Rejestracja w lokalnej historii z ewizją FIFO
    const recordHistory = (success: boolean, simulated: boolean, iden?: string) => {
      this.history.unshift({
        id: iden || `push_${Date.now()}`,
        title: formattedTitle,
        body: formattedBody,
        priority: validated.priority,
        success,
        simulated,
        timestamp: nowIso
      });
      if (this.history.length > this.maxHistorySize) {
        this.history.pop();
      }
    };

    if (!key) {
      const simulatedId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      recordHistory(true, true, simulatedId);
      console.log(`[*] PUSHBULLET [SIMULATED] :: [${validated.priority}] "${formattedTitle}" -> "${formattedBody}"`);
      return {
        success: true,
        simulated: true,
        iden: simulatedId,
        message: 'Powiadomienie w trybie symulacji (brak aktywnego klucza PUSHBULLET_API_KEY).',
        sentAt: nowIso
      };
    }

    try {
      const requestBody: Record<string, string> = {
        type: 'note',
        title: formattedTitle,
        body: formattedBody
      };

      if (validated.targetEmail) {
        requestBody.email = validated.targetEmail;
      }
      if (validated.targetDeviceId) {
        requestBody.device_iden = validated.targetDeviceId;
      }

      const response = await fetch('https://api.pushbullet.com/v2/pushes', {
        method: 'POST',
        headers: {
          'Access-Token': key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        recordHistory(false, false);
        return {
          success: false,
          error: `Błąd Pushbullet API (${response.status}): ${errorText}`,
          sentAt: nowIso
        };
      }

      const result: any = await response.json();
      recordHistory(true, false, result.iden);
      return {
        success: true,
        simulated: false,
        iden: result.iden,
        message: 'Powiadomienie Push zostało pomyślnie doręczone do chmury Pushbullet.',
        sentAt: nowIso
      };
    } catch (err: any) {
      recordHistory(false, false);
      return {
        success: false,
        error: `Błąd sieciowy podczas wysyłania Pushbullet: ${err.message}`,
        sentAt: nowIso
      };
    }
  }

  /**
   * Zwraca historię ostatnich wysłanych powiadomień.
   */
  public getHistory(): PushHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Czyści historię powiadomień (używane w testach).
   */
  public clearHistory(): void {
    this.history = [];
  }
}

export const pushbulletService = new PushbulletService();
