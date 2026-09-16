export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Subscription-Token'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = req.method === 'POST' ? req.body?.query : req.query?.q;
  const count = req.method === 'POST' ? (Number(req.body?.count) || 5) : (Number(req.query?.count) || 5);

  if (!query) {
    return res.status(400).json({ error: 'Brak parametru query' });
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY || 'BSAFmBe5BK_uBCgM4Qhrj1HHvsGijhh';

  try {
    const results = [];

    // 1. News search
    try {
      const newsUrl = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=${count}`;
      const newsRes = await fetch(newsUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        }
      });
      if (newsRes.ok) {
        const data = await newsRes.json();
        if (Array.isArray(data.results)) {
          results.push(...data.results);
        }
      }
    } catch (e) {
      console.warn('[Brave News Error]:', e.message);
    }

    // 2. Web search
    try {
      const webUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
      const webRes = await fetch(webUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        }
      });
      if (webRes.ok) {
        const data = await webRes.json();
        if (Array.isArray(data.web?.results)) {
          results.push(...data.web.results);
        }
      }
    } catch (e) {
      console.warn('[Brave Web Error]:', e.message);
    }

    // Deduplicate by URL
    const seen = new Set();
    const unique = [];
    for (const r of results) {
      if (r && r.url && !seen.has(r.url)) {
        seen.add(r.url);
        unique.push({
          title: r.title || 'Brak tytułu',
          url: r.url,
          description: r.description || ''
        });
      }
    }

    return res.status(200).json({
      query,
      count: unique.length,
      results: unique.slice(0, count * 2)
    });
  } catch (err) {
    console.error('[Search API Error]:', err);
    return res.status(500).json({ error: err.message });
  }
}
