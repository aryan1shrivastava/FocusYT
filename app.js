// Global variables
let player;
let currentPlaylist = [];
let currentVideoIndex = 0;

// Initialize YouTube player when API is ready
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1
        },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
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
    const regex = /[?&]list=([^#\&\?]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Load playlist when button is clicked
document.getElementById('load-playlist').addEventListener('click', async () => {
    const playlistUrl = document.getElementById('playlist-input').value;
    const playlistId = getPlaylistIdFromUrl(playlistUrl);
    
    if (!playlistId) {
        alert('Please enter a valid YouTube playlist URL');
        return;
    }
    
    try {
        await loadPlaylist(playlistId);
    } catch (error) {
        console.error('Error loading playlist:', error);
        alert('Error loading playlist. Please try again.');
    }
});

// Load playlist videos using YouTube Data API
async function loadPlaylist(playlistId) {
    // Note: In a production environment, API calls should be made through your backend
    // This is a simplified version for demonstration
    const API_KEY = process.env.YOUTUBE_API_KEY;
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`);
    const data = await response.json();
    
    currentPlaylist = data.items.map(item => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title
    }));
    
    // Load last played video index from localStorage
    const lastPlaylistId = localStorage.getItem('lastPlaylistId');
    if (lastPlaylistId === playlistId) {
        currentVideoIndex = parseInt(localStorage.getItem('lastVideoIndex')) || 0;
    } else {
        currentVideoIndex = 0;
    }
    
    playVideo(currentVideoIndex);
    updateProgress();
}

// Play video at specified index
function playVideo(index) {
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
