/**
 * Vercel Serverless Function: Google Cloud Pub/Sub Budget Push Webhook
 * Odbiera powiadomienia budżetowe wysyłane przez Google Cloud Pub/Sub Push Subscription.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Google Cloud Pub/Sub Budget Webhook',
      targetProject: 'void-potato-7721'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Dozwolona wyłącznie metoda POST' });
  }

  try {
    const body = req.body || {};
    let payload = body;

    // Obsługa formatu Google Cloud Pub/Sub Push
    if (body.message && body.message.data) {
      const decodedStr = Buffer.from(body.message.data, 'base64').toString('utf8');
      payload = JSON.parse(decodedStr);
    } else if (typeof body === 'string') {
      payload = JSON.parse(body);
    }

    const costAmount = Number(payload.costAmount ?? payload.cost_amount ?? 0);
    const budgetAmount = Number(payload.budgetAmount ?? payload.budget_amount ?? 50);
    const currencyCode = payload.currencyCode || payload.currency || 'PLN';
    const alertThreshold = Number(payload.alertThresholdExceeded ?? payload.alert_threshold ?? 0);
    const budgetDisplayName = payload.budgetDisplayName || 'OmniDash Budget Guard';

    const percentage = budgetAmount > 0 ? Number(((costAmount / budgetAmount) * 100).toFixed(1)) : 0;
    const isCritical = percentage >= 100;
    const isWarning = percentage >= 90;

    const budgetStatus = {
      budgetDisplayName,
      costAmount,
      budgetAmount,
      currencyCode,
      alertThresholdExceeded: alertThreshold,
      percentage,
      status: isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'OK',
      isBudgetThrottled: isCritical,
      lastUpdated: new Date().toISOString()
    };

    console.log('[*] GCP BUDGET PUSH:', JSON.stringify(budgetStatus));

    // Jeśli skonfigurowany jest klucz Pushbullet, wyślij alert przy >= 80%
    const pushKey = process.env.PUSHBULLET_API_KEY;
    if (pushKey && percentage >= 80) {
      try {
        const alertType = isCritical ? '[!] KRYTYCZNY LIMIT BUDŻETU' : '[!] OSTRZEŻENIE BUDŻETU';
        await fetch('https://api.pushbullet.com/v2/pushes', {
          method: 'POST',
          headers: {
            'Access-Token': pushKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'note',
            title: `${alertType}: Google Cloud (${percentage}%)`,
            body: `Projekt void-potato-7721 osiągnął ${costAmount.toFixed(2)} ${currencyCode} z ${budgetAmount.toFixed(2)} ${currencyCode}.\nStatus: ${budgetStatus.status}.`
          })
        });
      } catch (pushErr) {
        console.warn('[!] Pushbullet send error in serverless handler:', pushErr.message);
      }
    }

    // Odpowiedź ACK wymagana przez Google Cloud Pub/Sub
    return res.status(200).json({ status: 'ACK', budget: budgetStatus });
  } catch (err) {
    console.error('[!] Błąd parsowania webhooka GCP:', err.message);
    return res.status(400).json({ error: err.message });
  }
}
