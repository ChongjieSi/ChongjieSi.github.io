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

  // 2) 两个 slide 层
  const slideEls = [
    document.getElementById("slide1"),
    document.getElementById("slide2")
  ];

  // 3) 状态：当前索引 & 激活的 slide 层
  let currentIdx = Math.floor(Math.random() * bgImages.length);
  let showing = 0;

  // 4) 初始化显示
  slideEls[0].style.backgroundImage = `url('${bgImages[currentIdx]}')`;
  slideEls[0].classList.add("active");
  slideEls[1].style.backgroundImage = `url('${bgImages[(currentIdx + 1) % bgImages.length]}')`;

  // 5) 切换函数
  function switchBackground() {
    // 随机选取下一张（避开相同）
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * bgImages.length);
    } while (nextIdx === currentIdx && bgImages.length > 1);

    const nextSlide = slideEls[1 - showing];
    nextSlide.style.backgroundImage = `url('${bgImages[nextIdx]}')`;

    // 执行淡入淡出
    slideEls[showing].classList.remove("active");
    nextSlide.classList.add("active");

    // 更新状态
    showing = 1 - showing;
    currentIdx = nextIdx;
  }

  // 6) 设置并管理定时器
  let timerId = setInterval(switchBackground, interval);

  function resetTimer() {
    clearInterval(timerId);
    timerId = setInterval(switchBackground, interval);
  }

  // 7) 点击背景时切换并重置计时
  document.getElementById("large-header")
    .addEventListener("click", () => {
      switchBackground();
      resetTimer();
    });