export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const now = new Date();
  res.status(200).json({
    status: 'online',
    engine: 'OmniDash Vercel Serverless Gateway',
    model: 'openai/gpt-oss-120b',
    cors: 'enabled',
    timestamp: now.toISOString(),
    server_time: now.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    server_date: now.toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }),
    timezone: 'Europe/Warsaw'
  });
}
