const axios = require('axios');
const cheerio = require('cheerio');
const BASE_URL = 'https://backloggd.com';

async function fetchTrendingGames(){
    try {
        const targetUrl = `${BASE_URL}/games/lib/trending`;
        // const url = `https://bypass-cloudflare-production.up.railway.app/?url=${encodeURIComponent(targetUrl)}&apiKey=${process.env.BYPASS_API_KEY}`;
        const response = await axios.get(targetUrl);
        const $ = cheerio.load(response.data);
        const games = [];
        $('.col-cus-5').each((i, el) => {
            const name = $(el).find('.game-text-centered').text().trim();
            const href = $(el).find('a').attr('href');
            const imgSrc = $(el).find('.overflow-wrapper img').attr('src');
            
            if (name && href) {
                games.push({
                    name: name,
                    link: BASE_URL + href,
                    img: imgSrc || ''
                });
            }
        });
        return games;
    } catch (error) {
        console.error("Error fetching trending games:", error);
        return [];
    }
}

async function fetchTopRatedGames(){
    try {
        const targetUrl = `${BASE_URL}/games/lib/top_rated`;
        const url = `https://bypass-cloudflare-production.up.railway.app/?url=${encodeURIComponent(targetUrl)}&apiKey=${process.env.BYPASS_API_KEY}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const games = [];
        $('.col-cus-5').each((i, el) => {
            const name = $(el).find('.game-text-centered').text().trim();
            const href = $(el).find('a').attr('href');
            const imgSrc = $(el).find('.overflow-wrapper img').attr('src');
            
            if (name && href) {
                games.push({
                    name: name,
                    link: BASE_URL + href,
                    img: imgSrc || ''
                });
            }
        });
        return games;
    } catch (error) {
        console.error("Error fetching top rated games:", error);
        return [];
    }
}

module.exports = {fetchTrendingGames,fetchTopRatedGames}
