export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    // Jeśli CRON_SECRET jest zdefiniowany, weryfikuj nagłówek
    console.warn('[Vercel Cron] Nieautoryzowane wywołanie crona');
  }

  const timestamp = new Date().toISOString();
  console.log(`[*] VERCEL CRON TICK :: ${timestamp}`);

  return res.status(200).json({
    status: 'ok',
    service: 'OmniDaemon Vercel Cron Runner',
    timestamp,
    message: 'Cron tick przetworzony pomyślnie.'
  });
}
