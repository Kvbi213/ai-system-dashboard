export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const CURATED_MODELS = [
    {
      id: 'openai/gpt-oss-120b',
      active: true,
      context_window: 131072,
      max_completion_tokens: 8192,
      owned_by: 'OpenAI / Groq High-Reasoning'
    },
    {
      id: 'llama-3.3-70b-versatile',
      active: true,
      context_window: 131072,
      max_completion_tokens: 8192,
      owned_by: 'Meta'
    },
    {
      id: 'mixtral-8x7b-32768',
      active: true,
      context_window: 32768,
      max_completion_tokens: 4096,
      owned_by: 'Mistral AI'
    },
    {
      id: 'gemma2-9b-it',
      active: true,
      context_window: 8192,
      max_completion_tokens: 4096,
      owned_by: 'Google'
    }
  ];

  if (req.method === 'POST') {
    const { modelId } = req.body || {};
    const selected = modelId || 'openai/gpt-oss-120b';
    return res.status(200).json({
      success: true,
      activeModel: selected,
      fallbackChain: [selected, 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
    });
  }

  // GET
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  let modelsList = [...CURATED_MODELS];

  if (apiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) {
        const groqData = await response.json();
        if (Array.isArray(groqData.data)) {
          const validGroq = groqData.data
            .filter(m => m.active !== false && !m.id.includes('whisper') && !m.id.includes('guard'))
            .map(m => ({
              id: m.id,
              active: true,
              context_window: m.context_window || 8192,
              max_completion_tokens: m.max_completion_tokens || 4096,
              owned_by: m.owned_by || 'Groq'
            }));

          // Merge: ensure openai/gpt-oss-120b is first
          const existingIds = new Set(validGroq.map(m => m.id));
          CURATED_MODELS.forEach(cm => {
            if (!existingIds.has(cm.id)) {
              validGroq.unshift(cm);
            }
          });
          modelsList = validGroq;
        }
      }
    } catch (err) {
      console.warn('[Vercel API /models] Błąd pobierania z Groq, użycie fallbacku:', err.message);
    }
  }

  return res.status(200).json({
    models: modelsList,
    activeModel: 'openai/gpt-oss-120b',
    fallbackChain: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
  });
}
