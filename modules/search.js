import dotenv from 'dotenv';
dotenv.config();

/**
 * Executes a live web search using Brave Search API
 * @param {string} query - The search query term
 * @returns {Promise<Array>} - Cleaned array of search results (title, description, url)
 */
export async function executeWebSearch(query) {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
        console.error(' [SEARCH ERROR] Missing BRAVE_SEARCH_API_KEY in environment configuration.');
        return [];
    }

    const url = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=5`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Subscription-Token': apiKey,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Brave API responded with status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();
        
        // Extract and map only critical data points to optimize context window space
        return data.results?.map(result => ({
            title: result.title,
            description: result.description,
            url: result.url
        })) || [];

    } catch (error) {
        console.error(' [SEARCH EXCEPTION] Failed to retrieve live web data:', error);
        return [];
    }
}
