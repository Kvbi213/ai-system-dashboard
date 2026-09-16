import dotenv from 'dotenv';
dotenv.config();

/**
 * Executes a live web search using Brave Search API
 * @param {string} query - The search query term
 * @returns {Promise<Array>} - Cleaned array of search results (title, description, url)
 */
export async function executeWebSearch(query, options = {}) {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
        console.error(' [SEARCH ERROR] Missing BRAVE_SEARCH_API_KEY in environment configuration.');
        return [];
    }

    const count = options.count || 5;
    const mode = options.mode || 'auto'; // 'auto', 'web', 'news'

    const headers = {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
        'Cache-Control': 'no-cache'
    };

    let allResults = [];

    // 1. Wyszukiwanie Web (lub News jeśli sprecyzowano)
    if (mode === 'news' || mode === 'auto') {
        try {
            const newsUrl = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=${count}`;
            const newsRes = await fetch(newsUrl, { method: 'GET', headers });
            if (newsRes.ok) {
                const data = await newsRes.json();
                const items = data.results?.map(r => ({
                    title: r.title,
                    description: r.description,
                    url: r.url,
                    source: 'news'
                })) || [];
                allResults.push(...items);
            }
        } catch (err) {
            console.warn('[SEARCH WARN] Błąd pobierania Brave News:', err.message);
        }
    }

    // 2. Jeśli brakuje wyników lub tryb ogólny, pobierz z ogólnego Web Search
    if (allResults.length < 3 || mode === 'web') {
        try {
            const webUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
            const webRes = await fetch(webUrl, { method: 'GET', headers });
            if (webRes.ok) {
                const data = await webRes.json();
                const items = data.web?.results?.map(r => ({
                    title: r.title,
                    description: r.description,
                    url: r.url,
                    source: 'web'
                })) || [];
                allResults.push(...items);
            }
        } catch (err) {
            console.warn('[SEARCH WARN] Błąd pobierania Brave Web:', err.message);
        }
    }

    // Deduplikacja po URL
    const seenUrls = new Set();
    const unique = [];
    for (const item of allResults) {
        if (!item.url || seenUrls.has(item.url)) continue;
        seenUrls.add(item.url);
        unique.push(item);
    }

    return unique.slice(0, count * 2);
}
