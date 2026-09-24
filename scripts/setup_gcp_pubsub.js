/**
 * Skrypt konfiguracyjny i diagnostyczny dla Google Cloud Console, Cloud Billing i Pub/Sub
 * Uruchomienie: node scripts/setup_gcp_pubsub.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('[*] OMNIDASH :: GOOGLE CLOUD CONSOLE & PUB/SUB BUDGET SETUP');
console.log('================================================================');

const saPath = path.resolve(rootDir, 'firebase-service-account.json');
let projectId = 'void-potato-7721';
let clientEmail = 'nieznany';

if (fs.existsSync(saPath)) {
  try {
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    projectId = sa.project_id || projectId;
    clientEmail = sa.client_email || clientEmail;
    console.log(`[+] SUCCESS: Znaleziono poświadczenia Google Service Account.`);
    console.log(`    • Projekt GCP: ${projectId}`);
    console.log(`    • Konto serwisowe: ${clientEmail}`);
  } catch (err) {
    console.warn(`[!] Ostrzeżenie przy odczycie service account: ${err.message}`);
  }
} else {
  console.log(`[*] Używanie domyślnego identyfikatora projektu: ${projectId}`);
}

const TOPIC_NAME = 'omni-budget-alerts';
const SUBSCRIPTION_NAME = 'omni-budget-push';
const PUSH_ENDPOINT = 'https://void-potato-7721.web.app/api/gcp/budget-webhook';

console.log('\n--- PARAMETRY ARCHITEKTURY PUB/SUB ---');
console.log(`• ID Projektu GCP:              ${projectId}`);
console.log(`• Temat Pub/Sub:                projects/${projectId}/topics/${TOPIC_NAME}`);
console.log(`• Subskrypcja Push:             projects/${projectId}/subscriptions/${SUBSCRIPTION_NAME}`);
console.log(`• Punkt Końcowy Push Webhook:   ${PUSH_ENDPOINT}`);

console.log('\n--- POLECENIA GCLOUD CLI (SKOPIUJ I WKLEJ W TERMINALU) ---');
console.log(`# 1. Ustaw aktywny projekt w gcloud CLI:`);
console.log(`gcloud config set project ${projectId}\n`);

console.log(`# 2. Włącz wymagane API Google Cloud (Pub/Sub oraz Billing Budgets):`);
console.log(`gcloud services enable pubsub.googleapis.com billingbudgets.googleapis.com --project=${projectId}\n`);

console.log(`# 3. Utwórz temat Cloud Pub/Sub:`);
console.log(`gcloud pubsub topics create ${TOPIC_NAME} --project=${projectId}\n`);

console.log(`# 4. Utwórz subskrypcję typu Push przekierowującą powiadomienia do OmniDash:`);
console.log(`gcloud pubsub subscriptions create ${SUBSCRIPTION_NAME} \\`);
console.log(`  --topic=${TOPIC_NAME} \\`);
console.log(`  --push-endpoint=${PUSH_ENDPOINT} \\`);
console.log(`  --ack-deadline=30 \\`);
console.log(`  --project=${projectId}\n`);

console.log('# 5. Nadaj uprawnienia kontu Cloud Billing do publikowania w Twoim temacie:');
console.log(`gcloud pubsub topics add-iam-policy-binding ${TOPIC_NAME} \\`);
console.log(`  --member="serviceAccount:billing-export@${projectId}.iam.gserviceaccount.com" \\`);
console.log(`  --role="roles/pubsub.publisher" \\`);
console.log(`  --project=${projectId}\n`);

console.log('--- LINKI DO GOOGLE CLOUD CONSOLE ---');
console.log(`• Pulpit Projektu GCP:     https://console.cloud.google.com/home/dashboard?project=${projectId}`);
console.log(`• Budżety i Alerty:        https://console.cloud.google.com/billing/budgets?project=${projectId}`);
console.log(`• Tematy Pub/Sub:          https://console.cloud.google.com/cloudpubsub/topic/list?project=${projectId}`);
console.log(`• Subskrypcje Pub/Sub:     https://console.cloud.google.com/cloudpubsub/subscription/list?project=${projectId}`);

console.log('\n================================================================');
console.log('[+] SUCCESS: Skrypt konfiguracyjny wygenerowany pomyślnie.');
console.log('================================================================');
