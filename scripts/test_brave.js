import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const url = `https://api.search.brave.com/res/v1/news/search?q=AI&count=5`;
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY
        }
    });
    console.log(response.status);
    const data = await response.json();
    console.log(data);
}
test();
