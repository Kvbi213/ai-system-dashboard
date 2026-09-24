/**
 * Kontroler tras Express dla Google Cloud Pub/Sub & Billing Budget Guard
 */

import express from 'express';
import {
  getGcpBudgetStatus,
  processBudgetNotification,
  simulateBudgetAlert
} from '../services/gcpBudgetService.js';

const router = express.Router();

/**
 * Webhook odbioru wiadomości z Google Cloud Pub/Sub Push Subscription
 * Format żądania: POST z ciałem { message: { data: "base64...", messageId: "..." } }
 */
router.post('/budget-webhook', async (req, res) => {
  try {
    const result = await processBudgetNotification(req.body);
    // Google Cloud Pub/Sub wymaga kodu 200 lub 204 aby potwierdzić odbiór (ACK)
    return res.status(200).json({ status: 'ACK', budget: result });
  } catch (err) {
    console.error('[!] ERROR: Błąd przetwarzania webhooka GCP Pub/Sub:', err.message);
    // Zwracamy 400 jeśli dane były uszkodzone, aby Pub/Sub nie retry'ował w nieskończoność
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Pobiera bieżący stan budżetu i limitów GCP
 */
router.get('/budget-status', async (req, res) => {
  try {
    const status = await getGcpBudgetStatus();
    return res.json({ success: true, budget: status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Ręczne wywołanie symulacji alertu budżetowego z poziomu UI (diagnostyka)
 */
router.post('/simulate-alert', async (req, res) => {
  try {
    const { costAmount = 45.5, budgetAmount = 50.0, threshold = 0.9 } = req.body;
    const result = await simulateBudgetAlert(costAmount, budgetAmount, threshold);
    return res.json({ success: true, budget: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Informacje konfiguracyjne i komendy integracyjne
 */
router.get('/config', (req, res) => {
  res.json({
    projectId: 'void-potato-7721',
    projectName: 'OmniDash Production (Void Potato Matrix)',
    topicName: 'projects/void-potato-7721/topics/omni-budget-alerts',
    subscriptionName: 'projects/void-potato-7721/subscriptions/omni-budget-push',
    pushEndpointUrl: 'https://void-potato-7721.web.app/api/gcp/budget-webhook',
    billingConsoleUrl: 'https://console.cloud.google.com/billing/budgets?project=void-potato-7721',
    pubsubConsoleUrl: 'https://console.cloud.google.com/cloudpubsub/topic/list?project=void-potato-7721',
    setupSteps: [
      '1. Włącz interfejs Cloud Pub/Sub: gcloud services enable pubsub.googleapis.com --project=void-potato-7721',
      '2. Utwórz temat Pub/Sub: gcloud pubsub topics create omni-budget-alerts --project=void-potato-7721',
      '3. Utwórz subskrypcję Push: gcloud pubsub subscriptions create omni-budget-push --topic=omni-budget-alerts --push-endpoint=https://void-potato-7721.web.app/api/gcp/budget-webhook --project=void-potato-7721',
      '4. W Google Cloud Billing -> Budżety i alerty -> utwórz budżet i połącz go z tematem omni-budget-alerts.'
    ]
  });
});

export default router;
