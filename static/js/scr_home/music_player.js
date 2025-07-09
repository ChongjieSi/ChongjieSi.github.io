const playMusicElement = document.getElementById('play-music');
const musicPlayer = document.getElementById('music-player');

playMusicElement.addEventListener('click', function() {
  if (musicPlayer.paused) {
    musicPlayer.play();
  } else {
    musicPlayer.pause();
  }
});