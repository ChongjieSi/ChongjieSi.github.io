// 1) Image list and interval
const bgImages = [
  "/images/background/bg1.webp",
  "/images/background/bg2.webp",
  "/images/background/bg3.webp",
  "/images/background/bg4.webp",
  "/images/background/bg5.webp",
  "/images/background/bg6.webp",
  "/images/background/bg7.webp",
  "/images/background/bg8.webp",
  "/images/background/bg9.webp",
  "/images/background/bg10.webp",
  "/images/background/bg11.webp",
  "/images/background/bg13.webp",
];

const interval = 5000; // 5 秒切换一次

function preloadImages() {
  bgImages.forEach(imgSrc => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => console.log(`Preloaded: ${imgSrc}`);
  });
}

// 初始化时预加载所有图片
preloadImages();

// 2) 两个 slide 层
const slideEls = [
  document.getElementById("slide1"),
  document.getElementById("slide2")
];

// 3) 状态：当前索引 & 激活的 slide 层
let currentIdx = Math.floor(Math.random() * bgImages.length);
let showing = 0;
let isSwitching = false;
let lastSwitchTime = 0;

// 4) 初始化显示
slideEls[0].style.backgroundImage = `url('${bgImages[currentIdx]}')`;
slideEls[0].classList.add("active");
slideEls[0].dataset.loaded = 'true';
slideEls[1].style.backgroundImage = `url('${bgImages[(currentIdx + 1) % bgImages.length]}')`;
slideEls[1].dataset.loaded = 'true';

// 5) 切换函数
function switchBackground(manual = false) {
  if (isSwitching) return;
  
  isSwitching = true;
  
  // 重置计时器（如果是手动点击）
  if (manual) {
    resetTimer();
  }
  
  // 获取下一张图片索引
  const nextIdx = getNextIndex();
  const nextSlide = slideEls[1 - showing];
  
  // 更新背景图片
  nextSlide.style.backgroundImage = `url('${bgImages[nextIdx]}')`;
  nextSlide.dataset.loaded = 'true';
  
  // 重置新slide的动画
  resetSlideAnimation(nextSlide);
  
  // 执行切换
  performSwitch(nextIdx);
  
  // 动画结束后重置状态
  setTimeout(() => {
    isSwitching = false;
  }, 1000);
}

// 新添加：重置slide动画
function resetSlideAnimation(slide) {
  // 添加重置类
  slide.classList.add("reset-animation");
  
  // 触发重绘
  void slide.offsetWidth;
  
  // 移除重置类，重新应用动画
  slide.classList.remove("reset-animation");
}

function getNextIndex() {
  // 创建可用图片索引数组（排除当前图片）
  let availableIndices = [];
  for (let i = 0; i < bgImages.length; i++) {
    if (i !== currentIdx) {
      availableIndices.push(i);
    }
  }
  
  // 随机选择
  return availableIndices[Math.floor(Math.random() * availableIndices.length)];
}

function performSwitch(nextIdx) {
  // 添加过渡效果类
  slideEls[showing].classList.add("transitioning");
  slideEls[1 - showing].classList.add("transitioning");
  
  slideEls[showing].classList.remove("active");
  slideEls[1 - showing].classList.add("active");
  
  // 移除过渡效果类
  setTimeout(() => {
    slideEls[showing].classList.remove("transitioning");
    slideEls[1 - showing].classList.remove("transitioning");
  }, 1200);
  
  showing = 1 - showing;
  currentIdx = nextIdx;
}

// 6) 设置并管理定时器
let timerId = setInterval(() => switchBackground(false), interval);

function resetTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => switchBackground(false), interval);
}

// 7) 点击背景时切换并重置计时
document.getElementById("large-header").addEventListener("click", () => {
  // 防止频繁点击（至少间隔1秒）
  if (Date.now() - lastSwitchTime > 1000) {
    switchBackground(true); // 传入 true 表示手动切换
    lastSwitchTime = Date.now();
  }
});