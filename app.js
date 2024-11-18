// Global variables
let API_KEY = '';
let player;
let currentPlaylist = [];
let currentVideoIndex = 0;
let isPlayerReady = false;

// Fetch API key when page loads
async function initializeApp() {
    try {
        const response = await fetch('http://localhost:3000/api/config');
        const config = await response.json();
        API_KEY = config.youtubeApiKey;
    } catch (error) {
        console.error('Error fetching config:', error);
    }
}

// Initialize YouTube player when API is ready
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Add this function
function onPlayerReady(event) {
    isPlayerReady = true;
    console.log('Player is ready');
}

// Handle player state changes
function onPlayerStateChange(event) {
    updatePlayPauseButton(event.data);
    
    // If video ends, play next video
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
    
    // Save progress to localStorage
    if (currentPlaylist.length > 0) {
        localStorage.setItem('lastPlaylistId', getPlaylistIdFromUrl(document.getElementById('playlist-input').value));
        localStorage.setItem('lastVideoIndex', currentVideoIndex);
    }
}

// Extract playlist ID from URL
function getPlaylistIdFromUrl(url) {
    try {
        const urlParams = new URLSearchParams(new URL(url).search);
        return urlParams.get('list');
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}

// Load playlist when button is clicked
document.getElementById('load-playlist').addEventListener('click', () => {
    const playlistUrl = document.getElementById('playlist-input').value;
    console.log('Input URL:', playlistUrl); // Debug log
    
    const playlistId = getPlaylistIdFromUrl(playlistUrl);
    console.log('Extracted playlist ID:', playlistId); // Debug log
    
    if (!playlistId) {
        alert('Please enter a valid YouTube playlist URL\nExample: https://www.youtube.com/playlist?list=PLAYLIST_ID');
        return;
    }
    
    loadPlaylist(playlistId);
});

// Load playlist videos using YouTube Data API
async function loadPlaylist(playlistId) {
    try {
        console.log('Loading playlist:', playlistId); // Debug log
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`;
        
        console.log('Fetching from:', apiUrl); // Debug log
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData); // Debug log
            throw new Error(`API Error: ${errorData.error.message}`);
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log

        if (!data.items || data.items.length === 0) {
            throw new Error('Playlist is empty or not found');
        }

        currentPlaylist = data.items.map(item => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title
        }));

        currentVideoIndex = 0;
        
        // Add a check here
        if (!player || !isPlayerReady) {
            console.log('Waiting for player to initialize...');
            setTimeout(() => playVideo(currentVideoIndex), 1000);
        } else {
            playVideo(currentVideoIndex);
        }
        
        updateProgress();

    } catch (error) {
        console.error('Error loading playlist:', error);
        alert(`Error loading playlist: ${error.message}`);
    }
}

// Play video at specified index
function playVideo(index) {
    if (!isPlayerReady) {
        console.log('Player not ready yet');
        setTimeout(() => playVideo(index), 1000); // Try again in 1 second
        return;
    }
    
    if (index >= 0 && index < currentPlaylist.length) {
        currentVideoIndex = index;
        player.loadVideoById(currentPlaylist[index].id);
        document.getElementById('current-video-title').textContent = currentPlaylist[index].title;
        updateProgress();
    }
}

// Update progress display
function updateProgress() {
    const progress = document.getElementById('progress');
    progress.textContent = `Video ${currentVideoIndex + 1} of ${currentPlaylist.length}`;
}

// Control button event listeners
document.getElementById('prev').addEventListener('click', () => {
    playVideo(currentVideoIndex - 1);
});

document.getElementById('next').addEventListener('click', () => {
    playVideo(currentVideoIndex + 1);
});

document.getElementById('play-pause').addEventListener('click', () => {
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
});

// Update play/pause button text based on player state
function updatePlayPauseButton(playerState) {
    const playPauseButton = document.getElementById('play-pause');
    playPauseButton.textContent = playerState === YT.PlayerState.PLAYING ? 'Pause' : 'Play';
}

// Play next video automatically
function playNextVideo() {
    if (currentVideoIndex < currentPlaylist.length - 1) {
        playVideo(currentVideoIndex + 1);
    }
}

// Load last played playlist on page load
window.addEventListener('load', () => {
    const lastPlaylistId = localStorage.getItem('lastPlaylistId');
    if (lastPlaylistId) {
        const input = document.getElementById('playlist-input');
        input.value = `https://www.youtube.com/playlist?list=${lastPlaylistId}`;
    }
});

// Call initializeApp when document loads
document.addEventListener('DOMContentLoaded', initializeApp);
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

// Make sure YouTube API is loaded
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Initialize everything when document loads
document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeAPI();
    
    document.getElementById('load-playlist').addEventListener('click', () => {
        const playlistUrl = document.getElementById('playlist-input').value;
        const playlistId = getPlaylistIdFromUrl(playlistUrl);
        
        if (!playlistId) {
            alert('Please enter a valid YouTube playlist URL\nExample: https://www.youtube.com/playlist?list=PLAYLIST_ID');
            return;
        }
        
        loadPlaylist(playlistId);
    });
});
