const express = require('express');
const path = require('path');
const app = express();

const { analyzeHardware, analyzePerformance } = require('../APIs/gemini-api');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
        res.redirect('/check?error=failed');
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
        res.redirect('/performance?error=failed');
    }
});
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`http://localhost:${port}`);
    });
}

module.exports = app;