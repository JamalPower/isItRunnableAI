const express = require('express');
const path = require('path');
const app = express();

const { analyzeHardware, analyzePerformance } = require('../APIs/gemini-api');
const {fetchTrendingGames, fetchTopRatedGames,fetchPopularGames,fetchReleaseGames} = require('../APIs/get-games');
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.render('index', {currentPage:'home'});
});
app.get('/home',(req,res)=>{
    res.render('index', {currentPage:'home'});
})
app.get('/check', (req, res) => {
    res.render('view-options/check',{currentPage:'check'});
});
app.get('/contact', (req, res) => {
    res.render('view-options/contact', {currentPage:'contact'});
});
app.get('/login', (req, res) => {
    res.render('view-options/login', {currentPage:'login'});
});

// --- SEO Routes (Robots & Sitemap) ---
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nAllow: /\nSitemap: https://is-it-runnable-ai.vercel.app/sitemap.xml");
});

app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    const baseUrl = 'https://is-it-runnable-ai.vercel.app';
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
    <url><loc>${baseUrl}/check</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
    <url><loc>${baseUrl}/performance</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
    <url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
</urlset>`;
    res.send(sitemap);
});
// -------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true}));


app.get('/check/analyze', async (req, res) => {
    try {
        const data = JSON.parse(req.query.data);
        const result = await analyzeHardware(data);
        
        res.render('view-options/check-report', {
            result: result,
            specs: data,
            currentPage: 'check'
        });
    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ 
            error: 'Failed to analyze hardware compatibility',
            details: error.message || 'An unexpected error occurred'
        });
    }
});
app.get('/performance', (req, res) => {
    res.render('view-options/performance', { result: null, specs: null ,currentPage:'performance'});
});

app.get('/performance/analyze', async (req, res) => {
    try {
        const data = JSON.parse(req.query.data);
        const result = await analyzePerformance(data);
        
        res.render('view-options/performance-report', {
            result: result,
            specs: data,
            currentPage: 'performance'
        });
    } catch (error) {
        console.error("Performance Analysis Error:", error);
        res.status(500).json({ 
            error: 'Failed to perform performance analysis',
            details: error.message || 'An unexpected error occurred'
        });
    }
});

app.post('/contact', (req, res) => {
    try {
        const { name, email, subject, message, category } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        console.log('='.repeat(60));
        console.log('NEW CONTACT MESSAGE');
        console.log('='.repeat(60));
        console.log(`Name: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Category: ${category || 'Not specified'}`);
        console.log(`Message:\n${message}`);
        console.log('='.repeat(60));
        console.log(`Received at: ${new Date().toISOString()}`);
        console.log('='.repeat(60));

        res.status(200).json({ 
            success: true,
            message: 'Your message has been received. We will get back to you soon!'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }
});
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`http://localhost:${port}`);
    });
}

app.get('/games', async (req, res) => {
   
});
app.get('/games/trending', async (req, res) => {
   try {
    const games = await fetchTrendingGames();
    res.json(games);
   } catch (error) {
    console.error("Trending games error:", error);
    res.status(500).json({ error: 'Failed to fetch trending games' });
   }
});
app.get('/games/top-rated', async (req, res) => {
   try {
    const games = await fetchTopRatedGames();
    res.json(games);
   } catch (error) {
    console.error("Top rated games error:", error);
    res.status(500).json({ error: 'Failed to fetch top rated games' });
   }
});
app.get('/games/popular', async (req, res) => {
   try {
    const games = await fetchPopularGames();
    res.json(games);
   } catch (error) {
    console.error("Popular games error:", error);
    res.status(500).json({ error: 'Failed to fetch popular games' });
   }
});
app.get('/games/release', async (req, res) => {
    const UpOrDown = req.query.order || 'desc';
   try {
    const games = await fetchReleaseGames(UpOrDown);
    res.json(games);
   } catch (error) {
    console.error("Release games error:", error);
    res.status(500).json({ error: 'Failed to fetch release games' });
   }
});

// -----------global error handler for unhandled rejections------------------------
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});
//---------------------------------------------------------------------------------
module.exports = app;