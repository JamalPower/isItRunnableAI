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
app.get('/contact', (req, res) => {
    res.render('view-options/contact', {currentPage:'contact'});
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
        // Return error as JSON for frontend to display in modal
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
        // Return error as JSON for frontend to display in modal
        res.status(500).json({ 
            error: 'Failed to perform performance analysis',
            details: error.message || 'An unexpected error occurred'
        });
    }
});

// Contact Form Handler
app.post('/contact', (req, res) => {
    try {
        const { name, email, subject, message, category } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Log the contact message (in production, this would save to database or send email)
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

        // In production, integrate with email service here
        // Example: await sendEmail({ to: 'support@isitrunnable.ai', ...})

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

// Global error handler for unhandled rejections
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

module.exports = app;