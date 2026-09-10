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

  const apiKey = process.env.PUSHBULLET_API_KEY || req.body?.customApiKey;

  if (req.method === 'GET') {
    const isConfigured = Boolean(apiKey && apiKey !== 'your_pushbullet_api_key' && apiKey !== 'twój_klucz_pushbullet_tutaj');
    return res.status(200).json({
      service: 'pushbullet',
      configured: isConfigured,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    const { title, body } = req.body || {};
    if (!body) {
      return res.status(400).json({ error: 'Treść wiadomości (body) jest wymagana.' });
    }

    if (!apiKey || apiKey === 'your_pushbullet_api_key' || apiKey === 'twój_klucz_pushbullet_tutaj') {
      return res.status(400).json({ error: 'Brak klucza PUSHBULLET_API_KEY w konfiguracji Vercel.' });
    }

    try {
      const response = await fetch('https://api.pushbullet.com/v2/pushes', {
        method: 'POST',
        headers: {
          'Access-Token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'note',
          title: title || 'OmniDash System',
          body: body
        })
      });

      const data = await response.json();
      if (response.ok) {
        return res.status(200).json({
          success: true,
          iden: data.iden,
          message: 'Pomyślnie wysłano powiadomienie Push na smartfon.'
        });
      } else {
        return res.status(response.status).json({
          success: false,
          error: data.error?.message || 'Błąd dostarczenia Pushbullet API.'
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Wewnętrzny błąd serwera podczas wysyłki do Pushbullet.',
        details: err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
