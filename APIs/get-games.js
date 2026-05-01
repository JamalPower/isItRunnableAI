const axios = require('axios');
const cheerio = require('cheerio');
const BASE_URL = 'https://backloggd.com';

async function fetchTrendingGames(){
    try {
        const targetUrl = `${BASE_URL}/games/lib/trending/release_platform:win`;
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
        console.error("Error fetching trending games:", error);
        return [];
    }
}

async function fetchTopRatedGames(){
    try {
        const targetUrl = `${BASE_URL}/games/lib/rating/release_platform:win`;
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
async function fetchPopularGames() {
    try {
        const targetUrl = `${BASE_URL}/games/lib/popular/release_platform:win`;
        const url = `https://bypass-cloudflare-production.up.railway.app/?url=${encodeURIComponent(targetUrl)}&apiKey=${process.env.BYPASS_API_KEY}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const games = [];
        $('.col-cus-5').each((i, el) => {
            const name = $(el).find('.game-text-centered').text().trim();
            const href = $(el).find('a').attr('href');
            const imgSrc = $(el).find('.overflow-wrapper img').attr('src');
            const rating = $(el).find('.mb-0').text().trim();
            
            if (name && href) {
                games.push({
                    name: name,
                    link: BASE_URL + href,
                    img: imgSrc || '',
                    rating: rating
                });
            }
        });
        return games;
    } catch (error) {
        console.error("Error fetching popular games:", error);
        return [];
    }
}
async function fetchReleaseGames(UpOrDown = 'desc') {
    try {
        const targetUrl = `${BASE_URL}/games/lib/release:${UpOrDown}/release_platform:win`;
        const url = `https://bypass-cloudflare-production.up.railway.app/?url=${encodeURIComponent(targetUrl)}&apiKey=${process.env.BYPASS_API_KEY}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const games = [];
        $('.col-cus-5').each((i, el) => {
            const name = $(el).find('.game-text-centered').text().trim();
            const href = $(el).find('a').attr('href');
            const imgSrc = $(el).find('.overflow-wrapper img').attr('src');
            const year = $(el).find('.release-below').text().trim();
            
            if (name && href) {
                games.push({
                    name: name,
                    link: BASE_URL + href,
                    img: imgSrc || '',
                    year: year
                });
            }
        });
        return games;
    } catch (error) {
        console.error("Error fetching upcoming games:", error);
        return [];
    }
}

module.exports = {fetchTrendingGames,fetchTopRatedGames,fetchPopularGames,fetchReleaseGames}
