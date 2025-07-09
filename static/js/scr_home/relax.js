var images = ['/images/bg_home.webp','/images/bg_404.webp', ]; // 图像数组
var currentIndex = 0;
var backgroundContainer = document.getElementById('large-header');
var intervalId; // 用于存储轮播的间隔ID

function changeBackgroundImage() {
  currentIndex = (currentIndex + 1) % images.length;
  var nextImage = new Image();
  nextImage.src = images[currentIndex];
  nextImage.onload = function() {
    backgroundContainer.style.backgroundImage = 'url(' + nextImage.src + ')';
    backgroundContainer.style.opacity = '1';
  };
  backgroundContainer.style.opacity = '0';
}

  function startSlideshow() {
    if (intervalId) return; // 如果轮播已经在进行中，则不执行任何操作

    var musicPlayer = document.getElementById('music-player');
    if (musicPlayer.paused) {
      musicPlayer.play();
      intervalId = setInterval(changeBackgroundImage, 3550); // 开始轮播，并存储间隔ID
    }
  }

  function stopSlideshow() {
    var musicPlayer = document.getElementById('music-player');
    if (!musicPlayer.paused) {
      musicPlayer.pause();
      clearInterval(intervalId); // 停止轮播
      intervalId = null; // 重置间隔ID
      backgroundContainer.style.opacity = '1'; // 设置当前背景透明度为1
    }
  }

  var playMusicLink = document.getElementById('play-music');
  playMusicLink.addEventListener('click', function() {
    if (playMusicLink.classList.contains('playing')) {
      playMusicLink.classList.remove('playing');
      //stopSlideshow();
      if (!musicPlayer.paused) {
        musicPlayer.pause();}
    } else {
      playMusicLink.classList.add('playing');
      //startSlideshow();
      if (musicPlayer.paused) {
        musicPlayer.play();}
    }
  });
