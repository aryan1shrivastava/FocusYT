const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API endpoint to get YouTube API key
app.get('/api/config', (req, res) => {
    res.json({
        youtubeApiKey: process.env.YOUTUBE_API_KEY
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 