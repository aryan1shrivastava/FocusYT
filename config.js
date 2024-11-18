const config = {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || ''
};

if (!config.YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing! Please check your .env file');
}

export default config; 