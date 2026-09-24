/**
 * Google Cloud Billing & Pub/Sub Budget Guard Service
 * Zarządzanie budżetem, limitami wydatków i powiadomieniami Pub/Sub dla Google Cloud / Firebase.
 * Projekt bazowy: omnidash-509607 (OmniDash Production).
 */

import { executeQuery, executeRun } from '../database.js';
import { getFirestoreDb, isFirebaseConnected, FIREBASE_PROJECT_ID } from '../firebase.js';
import { sendPushNotificationClient, getPushbulletApiKey } from './pushbulletService.js';

const ACTIVE_GCP_PROJECT = FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'omnidash-509607';

// Domyślny stan budżetu
const DEFAULT_BUDGET_STATE = {
  projectId: ACTIVE_GCP_PROJECT,
  budgetDisplayName: 'OmniDash Monthly Budget Guard',
  costAmount: 0.0,
  budgetAmount: 50.0,
  currencyCode: 'PLN',
  alertThresholdExceeded: 0.0,
  percentage: 0.0,
  status: 'OK', // OK | WARNING | CRITICAL
  isBudgetThrottled: false,
  topicName: `projects/${ACTIVE_GCP_PROJECT}/topics/omni-budget-alerts`,
  subscriptionName: `projects/${ACTIVE_GCP_PROJECT}/subscriptions/omni-budget-push`,
  lastUpdated: new Date().toISOString()
};

let currentBudgetState = { ...DEFAULT_BUDGET_STATE };

/**
 * Inicjalizacja tabeli SQLite dla logów budżetowych GCP
 */
export async function initGcpBudgetDb() {
  try {
    await executeRun(`
      CREATE TABLE IF NOT EXISTS gcp_budget_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budget_display_name TEXT,
        cost_amount REAL,
        budget_amount REAL,
        currency TEXT DEFAULT 'PLN',
        alert_threshold REAL,
        raw_payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[+] SUCCESS: Tabela gcp_budget_logs zainicjalizowana.');
  } catch (err) {
    console.error('[!] ERROR: Inicjalizacja gcp_budget_logs nie powiodła się:', err.message);
  }
}

/**
 * Odczytuje aktualny stan budżetu z pamięci, Firestore lub SQLite
 */
export async function getGcpBudgetStatus() {
  if (isFirebaseConnected()) {
    try {
      const db = getFirestoreDb();
      if (db) {
        const docRef = db.collection('system_budget').doc('gcp_status');
        const snap = await docRef.get();
        if (snap.exists) {
          const data = snap.data();
          currentBudgetState = { ...DEFAULT_BUDGET_STATE, ...data };
          return currentBudgetState;
        }
      }
    } catch (err) {
      console.warn('[!] WARN: Odczyt budżetu z Firestore niedostępny:', err.message);
    }
  }

  try {
    const rows = await executeQuery(
      'SELECT * FROM gcp_budget_logs ORDER BY id DESC LIMIT 1'
    );
    if (rows && rows.length > 0) {
      const last = rows[0];
      const cost = Number(last.cost_amount) || 0;
      const budget = Number(last.budget_amount) || 50;
      const pct = budget > 0 ? (cost / budget) * 100 : 0;
      currentBudgetState = {
        ...currentBudgetState,
        budgetDisplayName: last.budget_display_name || currentBudgetState.budgetDisplayName,
        costAmount: cost,
        budgetAmount: budget,
        currencyCode: last.currency || 'PLN',
        alertThresholdExceeded: Number(last.alert_threshold) || 0,
        percentage: Number(pct.toFixed(1)),
        status: pct >= 100 ? 'CRITICAL' : pct >= 90 ? 'WARNING' : 'OK',
        isBudgetThrottled: pct >= 100,
        lastUpdated: last.created_at
      };
    }
  } catch {}

  return currentBudgetState;
}

/**
 * Parsuje komunikat z Google Cloud Pub/Sub Push Subscription
 * Format wejściowy z Pub/Sub Push:
 * {
 *   "message": {
 *     "data": "base64EncodedJsonString",
 *     "messageId": "...",
 *     "publishTime": "..."
 *   }
 * }
 * LUB bezpośredni obiekt JSON powiadomienia Billing Budget
 */
export function parsePubSubMessage(body) {
  if (!body) {
    throw new Error('Brak treści żądania (body jest puste).');
  }

  let payload = body;

  // Sprawdź czy to wrapper Google Cloud Pub/Sub Push
  if (body.message && body.message.data) {
    try {
      const decodedStr = Buffer.from(body.message.data, 'base64').toString('utf8');
      payload = JSON.parse(decodedStr);
    } catch (err) {
      throw new Error(`Błąd dekodowania Base64 wiadomości Pub/Sub: ${err.message}`);
    }
  } else if (typeof body === 'string') {
    try {
      payload = JSON.parse(body);
    } catch (err) {
      throw new Error(`Błąd parsowania ciągu JSON: ${err.message}`);
    }
  }

  const costAmount = Number(payload.costAmount ?? payload.cost_amount ?? 0);
  const budgetAmount = Number(payload.budgetAmount ?? payload.budget_amount ?? 50);
  const currencyCode = payload.currencyCode || payload.currency || 'PLN';
  const alertThreshold = Number(payload.alertThresholdExceeded ?? payload.alert_threshold ?? 0);
  const budgetDisplayName = payload.budgetDisplayName || payload.name || 'OmniDash Budget Guard';

  const percentage = budgetAmount > 0 ? Number(((costAmount / budgetAmount) * 100).toFixed(1)) : 0;
  const isCritical = percentage >= 100;
  const isWarning = percentage >= 90;

  return {
    budgetDisplayName,
    costAmount,
    budgetAmount,
    currencyCode,
    alertThresholdExceeded: alertThreshold,
    percentage,
    status: isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'OK',
    isBudgetThrottled: isCritical,
    lastUpdated: new Date().toISOString(),
    raw: payload
  };
}

/**
 * Rejestruje nowe powiadomienie budżetowe, zapisuje w bazie i rozsyła alerty
 */
export async function processBudgetNotification(body) {
  const parsed = parsePubSubMessage(body);

  currentBudgetState = {
    ...currentBudgetState,
    ...parsed
  };

  console.log(
    `[*] GCP BUDGET: Otrzymano powiadomienie. Koszt: ${parsed.costAmount} ${parsed.currencyCode} / ${parsed.budgetAmount} ${parsed.currencyCode} (${parsed.percentage}%)`
  );

  // 1. Zapis w SQLite
  try {
    await executeRun(
      `INSERT INTO gcp_budget_logs (budget_display_name, cost_amount, budget_amount, currency, alert_threshold, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        parsed.budgetDisplayName,
        parsed.costAmount,
        parsed.budgetAmount,
        parsed.currencyCode,
        parsed.alertThresholdExceeded,
        JSON.stringify(parsed.raw)
      ]
    );
  } catch (err) {
    console.warn('[!] WARN: Nie udało się zapisać gcp_budget_logs w SQLite:', err.message);
  }

  // 2. Zapis w Cloud Firestore
  if (isFirebaseConnected()) {
    try {
      const db = getFirestoreDb();
      if (db) {
        await db.collection('system_budget').doc('gcp_status').set({
          ...parsed,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        console.log('[+] SUCCESS: Zaktualizowano stan budżetu GCP w Firestore.');
      }
    } catch (err) {
      console.warn('[!] WARN: Błąd zapisu budżetu w Firestore:', err.message);
    }
  }

  // 3. Wysłanie powiadomienia Pushbullet jeśli przekroczono próg >= 80%
  if (parsed.percentage >= 80) {
    const pushKey = getPushbulletApiKey();
    if (pushKey) {
      const alertType = parsed.percentage >= 100 ? '[!] KRYTYCZNY LIMIT BUDŻETU' : '[!] OSTRZEŻENIE BUDŻETU';
      const title = `${alertType}: Google Cloud (${parsed.percentage}%)`;
      const targetProj = currentBudgetState.projectId || ACTIVE_GCP_PROJECT;
      const body = `Koszty projektu ${targetProj} osiągnęły ${parsed.costAmount.toFixed(2)} ${parsed.currencyCode} z zaplanowanego budżetu ${parsed.budgetAmount.toFixed(2)} ${parsed.currencyCode}.\nStatus: ${parsed.status}.`;

      try {
        await sendPushNotificationClient(title, body);
        console.log('[+] SUCCESS: Wysłano alert budżetowy GCP na telefon przez Pushbullet.');
      } catch (err) {
        console.warn('[!] WARN: Błąd wysyłania powiadomienia Pushbullet:', err.message);
      }
    }
  }

  return currentBudgetState;
}

/**
 * Symulacja zdarzenia budżetowego dla celów diagnostycznych i testowych
 */
export async function simulateBudgetAlert(costAmount = 45.5, budgetAmount = 50.0, threshold = 0.9) {
  const simulatedPayload = {
    budgetDisplayName: 'OmniDash Monthly Budget Guard',
    costAmount: Number(costAmount),
    budgetAmount: Number(budgetAmount),
    currencyCode: 'PLN',
    alertThresholdExceeded: Number(threshold),
    costIntervalStart: new Date().toISOString()
  };

  return await processBudgetNotification(simulatedPayload);
}
