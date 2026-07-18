(() => {
  const desktop = document.getElementById('desktop');
  const windows = [...document.querySelectorAll('.window')];
  const panels = [...document.querySelectorAll('.floating-panel, .menu-popover')];
  const boot = document.getElementById('bootScreen');
  let topZ = 20;
  let activeWindow = document.querySelector('.window.active');
  let musicVolume = 0.65;
  let ambientMaster = null;
  const readStorage = (storage, key) => { try { return storage.getItem(key); } catch (_) { return null; } };
  const writeStorage = (storage, key, value) => { try { storage.setItem(key, value); } catch (_) {} };

  // Never let an optional app failure leave the transparent boot layer over the desktop.
  const finishBoot = () => {
    boot?.classList.add('is-hidden');
    writeStorage(sessionStorage, 'chongjie-booted', '1');
  };
  if (readStorage(sessionStorage, 'chongjie-booted') || matchMedia('(prefers-reduced-motion: reduce)').matches) finishBoot();
  else window.setTimeout(finishBoot, 1250);

  const closeOverlays = (except) => panels.forEach(panel => {
    if (panel !== except) panel.classList.remove('is-visible');
  });

  const focusWindow = (win) => {
    if (!win) return;
    windows.forEach(item => item.classList.remove('active'));
    win.classList.add('active');
    win.style.zIndex = ++topZ;
    activeWindow = win;
    document.getElementById('activeAppName').textContent = win.dataset.title || 'Finder';
  };

  const syncDock = () => {
    document.querySelectorAll('.dock-item[data-open]').forEach(item => {
      const win = document.getElementById(`window-${item.dataset.open}`);
      item.classList.toggle('is-running', !!win && win.classList.contains('is-open'));
    });
  };

  const openApp = (name) => {
    const win = document.getElementById(`window-${name}`);
    if (!win) return;
    win.classList.add('is-open');
    win.classList.remove('is-minimized');
    focusWindow(win);
    closeOverlays();
    syncDock();
  };

  document.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open]');
    if (open) {
      if (open.classList.contains('desktop-icon') && event.detail < 2) return;
      event.preventDefault();
      openApp(open.dataset.open);
      return;
    }

    const menuTrigger = event.target.closest('[data-menu]');
    if (menuTrigger) {
      event.stopPropagation();
      const menu = document.getElementById(menuTrigger.dataset.menu);
      const willShow = !menu.classList.contains('is-visible');
      closeOverlays(menu);
      document.querySelectorAll('[data-menu]').forEach(item => item.classList.remove('is-active'));
      menu.classList.toggle('is-visible', willShow);
      menuTrigger.classList.toggle('is-active', willShow);
      return;
    }

    const panelTrigger = event.target.closest('[data-panel]');
    if (panelTrigger) {
      event.stopPropagation();
      const panel = document.getElementById(panelTrigger.dataset.panel);
      const willShow = !panel.classList.contains('is-visible');
      closeOverlays(panel);
      panel.classList.toggle('is-visible', willShow);
      if (willShow && panel.id === 'spotlight') setTimeout(() => document.getElementById('spotlightInput').focus(), 30);
      return;
    }

    if (!event.target.closest('.floating-panel,.menu-popover')) closeOverlays();
    document.querySelectorAll('[data-menu]').forEach(item => item.classList.remove('is-active'));
  });

  windows.forEach(win => {
    win.addEventListener('pointerdown', () => focusWindow(win));
    win.querySelectorAll('[data-window-action]').forEach(button => button.addEventListener('click', (event) => {
      event.stopPropagation();
      const action = button.dataset.windowAction;
      if (action === 'close') win.classList.remove('is-open');
      if (action === 'minimize') win.classList.add('is-minimized');
      if (action === 'maximize') win.classList.toggle('is-maximized');
      const next = [...windows].filter(item => item.classList.contains('is-open') && !item.classList.contains('is-minimized')).sort((a,b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
      focusWindow(next);
      if (!next) document.getElementById('activeAppName').textContent = 'Finder';
      syncDock();
    }));
  });

  document.querySelectorAll('.sidebar [data-tab]').forEach(tab => tab.addEventListener('click', () => {
    const shell = tab.closest('.window');
    shell.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('selected', item === tab));
    shell.querySelectorAll('[data-tab-panel]').forEach(panel => panel.classList.toggle('is-visible', panel.dataset.tabPanel === tab.dataset.tab));
  }));

  // In-app master/detail libraries.
  const showTemplate = (templateId, host, shell) => {
    const template = document.getElementById(templateId);
    if (!template || !host) return;
    host.replaceChildren(template.content.cloneNode(true));
    shell?.classList.add('is-reading');
    host.scrollTop = 0;
  };

  document.querySelectorAll('[data-detail]').forEach(item => item.addEventListener('click', () => {
    const shell = item.closest('[data-library]');
    shell.querySelectorAll('[data-detail]').forEach(other => other.classList.toggle('is-selected', other === item));
    showTemplate(item.dataset.detail, shell.querySelector('[data-detail-host]'), shell);
  }));

  document.querySelectorAll('[data-note]').forEach(note => note.addEventListener('click', () => {
    const shell = note.closest('.notes-shell');
    showTemplate(note.dataset.note, shell.querySelector('[data-detail-host="notes"]'), shell);
  }));

  let renderPaperPage = () => {};
  const paperPagination = document.querySelector('[data-pagination="paper"]');
  if (paperPagination) {
    const paperList = paperPagination.closest('.library-master').querySelector('.paper-list');
    const paperItems = [...paperList.querySelectorAll('[data-filter-item="paper"]')];
    const pageSize = 6;
    let currentPage = 0;
    renderPaperPage = (reset = false) => {
      if (reset) currentPage = 0;
      const matches = paperItems.filter(item => !item.classList.contains('is-filtered'));
      const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
      currentPage = Math.min(currentPage, pageCount - 1);
      paperItems.forEach(item => { item.hidden = true; });
      matches.slice(currentPage * pageSize, (currentPage + 1) * pageSize).forEach(item => { item.hidden = false; });
      paperPagination.querySelector('[data-page-current]').textContent = currentPage + 1;
      paperPagination.querySelector('[data-page-total]').textContent = pageCount;
      paperPagination.querySelector('[data-page-prev]').disabled = currentPage === 0;
      paperPagination.querySelector('[data-page-next]').disabled = currentPage >= pageCount - 1;
      paperList.scrollTop = 0;
    };
    paperPagination.querySelector('[data-page-prev]').addEventListener('click', () => { currentPage -= 1; renderPaperPage(); });
    paperPagination.querySelector('[data-page-next]').addEventListener('click', () => { currentPage += 1; renderPaperPage(); });
    renderPaperPage();
  }

  document.querySelectorAll('[data-filter-input]').forEach(input => input.addEventListener('input', () => {
    const type = input.dataset.filterInput;
    const scope = input.closest('.window');
    const query = input.value.trim().toLowerCase();
    scope.querySelectorAll(`[data-filter-item="${type}"]`).forEach(item => item.classList.toggle('is-filtered', !item.dataset.filterText.includes(query)));
    if (type === 'paper') renderPaperPage(true);
  }));

  document.querySelectorAll('[data-note-filter]').forEach(button => button.addEventListener('click', () => {
    const shell = button.closest('.notes-shell');
    shell.querySelectorAll('[data-note-filter]').forEach(item => item.classList.toggle('selected', item === button));
    const kind = button.dataset.noteFilter;
    shell.querySelectorAll('[data-note-kind]').forEach(note => note.hidden = kind !== 'all' && note.dataset.noteKind !== kind);
  }));

  document.querySelectorAll('[data-album]').forEach(album => album.addEventListener('click', () => {
    const win = album.closest('.window');
    const browser = win.querySelector('[data-photo-browser]');
    const host = win.querySelector('[data-detail-host="photos"]');
    showTemplate(album.dataset.album, host);
    browser.classList.add('is-hidden');
    host.classList.add('is-visible');
  }));

  document.querySelectorAll('[data-photo-view]').forEach(button => button.addEventListener('click', () => {
    const win = button.closest('.window');
    win.querySelectorAll('[data-photo-view]').forEach(item => item.classList.toggle('is-selected', item === button));
    win.querySelector('[data-photo-grid]').classList.toggle('is-mosaic', button.dataset.photoView === 'mosaic');
  }));

  document.addEventListener('click', (event) => {
    const back = event.target.closest('[data-reader-back]');
    if (back) {
      const library = back.closest('[data-library]');
      if (library) library.classList.remove('is-reading');
      const notes = back.closest('.notes-shell');
      if (notes) notes.classList.remove('is-reading');
      const photos = back.closest('.window');
      if (photos?.querySelector('[data-photo-browser]')) {
        photos.querySelector('[data-photo-browser]').classList.remove('is-hidden');
        photos.querySelector('[data-detail-host="photos"]').classList.remove('is-visible');
      }
      return;
    }

    const image = event.target.closest('[data-lightbox]');
    if (image) openLightbox(image);
  });

  let lightboxItems = [];
  let lightboxIndex = 0;
  const renderLightbox = () => {
    const lightbox = document.querySelector('[data-lightbox-host]');
    if (!lightboxItems.length) return;
    lightbox.querySelector('img').src = lightboxItems[lightboxIndex];
    lightbox.querySelector('.lightbox-count').textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
  };
  const openLightbox = (button) => {
    const album = button.closest('.album-view');
    lightboxItems = [...album.querySelectorAll('[data-lightbox]')].map(item => item.dataset.lightbox);
    lightboxIndex = Math.max(0, lightboxItems.indexOf(button.dataset.lightbox));
    const lightbox = button.closest('.window').querySelector('[data-lightbox-host]');
    lightbox.classList.add('is-visible');
    renderLightbox();
  };
  document.querySelector('.lightbox-close').addEventListener('click', () => document.querySelector('[data-lightbox-host]').classList.remove('is-visible'));
  document.querySelector('.lightbox-prev').addEventListener('click', () => { lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length; renderLightbox(); });
  document.querySelector('.lightbox-next').addEventListener('click', () => { lightboxIndex = (lightboxIndex + 1) % lightboxItems.length; renderLightbox(); });

  document.querySelectorAll('[data-resume-view]').forEach(button => button.addEventListener('click', () => {
    const shell = button.closest('.resume-shell') || button.closest('.window').querySelector('.resume-shell');
    const view = button.dataset.resumeView;
    shell.querySelector('[data-resume-view-panel="profile"]').classList.toggle('is-hidden', view === 'pdf');
    shell.querySelector('[data-resume-view-panel="pdf"]').classList.toggle('is-visible', view === 'pdf');
  }));

  const systemState = { wifi: true, bluetooth: true, focus: false };
  document.querySelectorAll('[data-system-toggle]').forEach(tile => tile.addEventListener('click', () => {
    const key = tile.dataset.systemToggle;
    systemState[key] = !systemState[key];
    tile.classList.toggle('is-on', systemState[key]);
    const label = document.querySelector(`[data-system-label="${key}"]`);
    if (label) label.textContent = systemState[key] ? (key === 'wifi' ? 'Portfolio Network' : 'On') : 'Off';
    if (key === 'wifi') desktop.classList.toggle('wifi-off', !systemState[key]);
    if (key === 'focus') desktop.classList.toggle('focus-on', systemState[key]);
  }));

  document.querySelectorAll('[data-system-range]').forEach(range => range.addEventListener('input', () => {
    if (range.dataset.systemRange === 'brightness') desktop.style.filter = `brightness(${range.value}%)`;
    if (range.dataset.systemRange === 'volume') {
      musicVolume = Number(range.value) / 100;
      document.querySelector('[data-volume-label]').textContent = `${range.value}%`;
      if (ambientMaster) ambientMaster.gain.setTargetAtTime(musicVolume * 0.12, ambientMaster.context.currentTime, 0.06);
    }
  }));

  const dragState = { active: false };
  document.querySelectorAll('.drag-handle').forEach(handle => handle.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button,a')) return;
    const win = handle.closest('.window');
    if (win.classList.contains('is-maximized') || innerWidth < 761) return;
    const rect = win.getBoundingClientRect();
    Object.assign(dragState, {active:true, win, dx:event.clientX-rect.left, dy:event.clientY-rect.top});
    handle.setPointerCapture(event.pointerId);
  }));
  document.addEventListener('pointermove', (event) => {
    if (!dragState.active) return;
    const x = Math.max(0, Math.min(innerWidth - 120, event.clientX - dragState.dx));
    const y = Math.max(36, Math.min(innerHeight - 90, event.clientY - dragState.dy));
    dragState.win.style.left = `${x}px`;
    dragState.win.style.top = `${y}px`;
  });
  document.addEventListener('pointerup', () => { dragState.active = false; });

  const runAction = (action) => {
    if (action === 'show-desktop') windows.forEach(win => win.classList.add('is-minimized'));
    if (action === 'minimize-active' && activeWindow) activeWindow.classList.add('is-minimized');
    if (action === 'maximize-active' && activeWindow) activeWindow.classList.toggle('is-maximized');
    if (action === 'bring-front') windows.filter(win => win.classList.contains('is-open')).forEach(focusWindow);
    closeOverlays(); syncDock();
  };
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => runAction(button.dataset.action)));

  const wallpaperCurrent = document.getElementById('wallpaperCurrent');
  const wallpaperNext = document.getElementById('wallpaperNext');
  let wallpaperRequest = 0;
  const applyWallpaper = (value, animate = true) => {
    const request = ++wallpaperRequest;
    const url = `/images/background/bg${value}.webp`;
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      if (request !== wallpaperRequest) return;
      desktop.dataset.wallpaper = value;
      if (!animate) {
        wallpaperCurrent.style.backgroundImage = `url("${url}")`;
        wallpaperNext.classList.remove('is-visible');
        wallpaperNext.style.backgroundImage = '';
        return;
      }
      wallpaperNext.style.backgroundImage = `url("${url}")`;
      requestAnimationFrame(() => wallpaperNext.classList.add('is-visible'));
      window.setTimeout(() => {
        if (request !== wallpaperRequest) return;
        wallpaperCurrent.style.backgroundImage = `url("${url}")`;
        wallpaperNext.classList.remove('is-visible');
        window.setTimeout(() => { if (request === wallpaperRequest) wallpaperNext.style.backgroundImage = ''; }, 750);
      }, 760);
    };
    const image = new Image();
    image.onload = commit;
    image.onerror = () => console.warn(`Wallpaper could not be loaded: ${url}`);
    image.src = url;
    if (image.complete && image.naturalWidth) commit();
    writeStorage(localStorage, 'chongjie-wallpaper', value);
    document.querySelectorAll('.wallpaper').forEach(item => item.classList.toggle('is-selected', item.dataset.wallpaper === String(value)));
  };
  const savedWallpaper = readStorage(localStorage, 'chongjie-wallpaper');
  if (savedWallpaper) applyWallpaper(savedWallpaper, false);
  document.querySelector('.wallpaper-options')?.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-wallpaper]');
    if (!choice) return;
    event.preventDefault();
    event.stopPropagation();
    applyWallpaper(choice.dataset.wallpaper);
  });

  // A small, fully local Web Audio soundscape engine.
  const musicApp = document.querySelector('.music-app');
  const musicPlay = document.querySelector('[data-music-play]');
  const musicElapsed = document.querySelector('[data-music-elapsed]');
  const musicProgress = document.querySelector('[data-music-progress]');
  const musicStatus = document.querySelector('.music-status');
  const soundscapes = [
    { title: 'Glass Horizon', subtitle: 'Warm keys for a clear mind', frequencies: [130.81, 196, 261.63, 329.63], type: 'sine', cutoff: 1250 },
    { title: 'Night Drive', subtitle: 'Low pulses under neon skies', frequencies: [82.41, 123.47, 164.81, 246.94], type: 'triangle', cutoff: 760 },
    { title: 'Deep Work', subtitle: 'Minimal motion, steady focus', frequencies: [110, 165, 220, 330], type: 'sine', cutoff: 540 }
  ];
  let audioContext = null;
  let ambientNodes = [];
  let musicPlaying = false;
  let currentSoundscape = 0;
  let elapsedSeconds = 0;
  let elapsedTimer = null;

  const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const updateMusicProgress = () => {
    musicElapsed.textContent = formatTime(elapsedSeconds);
    musicProgress.style.width = `${(elapsedSeconds % 60) / 60 * 100}%`;
  };
  const destroyAmbientGraph = () => {
    ambientNodes.forEach(node => { try { node.stop?.(); } catch (_) {} try { node.disconnect?.(); } catch (_) {} });
    ambientNodes = [];
    if (ambientMaster) { try { ambientMaster.disconnect(); } catch (_) {} ambientMaster = null; }
  };
  const buildAmbientGraph = () => {
    destroyAmbientGraph();
    const track = soundscapes[currentSoundscape];
    ambientMaster = audioContext.createGain();
    ambientMaster.gain.setValueAtTime(0.0001, audioContext.currentTime);
    ambientMaster.connect(audioContext.destination);
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = track.cutoff;
    filter.Q.value = 0.7;
    filter.connect(ambientMaster);
    ambientNodes.push(filter);
    track.frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const voiceGain = audioContext.createGain();
      oscillator.type = track.type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = (index - 1.5) * 3.5;
      voiceGain.gain.value = 0.18 / track.frequencies.length;
      oscillator.connect(voiceGain).connect(filter);
      oscillator.start();
      ambientNodes.push(oscillator, voiceGain);
    });
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.frequency.value = currentSoundscape === 1 ? 0.13 : 0.07;
    lfoGain.gain.value = currentSoundscape === 2 ? 80 : 150;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    ambientNodes.push(lfo, lfoGain);
    ambientMaster.gain.exponentialRampToValueAtTime(Math.max(0.006, musicVolume * 0.12), audioContext.currentTime + 0.8);
  };
  const setMusicPlaying = async shouldPlay => {
    if (!musicApp || !musicPlay) return;
    if (shouldPlay) {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) { musicStatus.textContent = 'Audio unavailable'; return; }
      audioContext ||= new AudioEngine();
      await audioContext.resume();
      buildAmbientGraph();
      musicPlaying = true;
      elapsedTimer ||= window.setInterval(() => { if (musicPlaying) { elapsedSeconds += 1; updateMusicProgress(); } }, 1000);
    } else {
      musicPlaying = false;
      if (ambientMaster && audioContext) ambientMaster.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
      window.setTimeout(() => { if (!musicPlaying) destroyAmbientGraph(); }, 450);
    }
    musicApp.classList.toggle('is-playing', musicPlaying);
    musicPlay.setAttribute('aria-label', musicPlaying ? 'Pause' : 'Play');
    musicPlay.querySelector('use').setAttribute('href', musicPlaying ? '#i-pause' : '#i-play');
    musicStatus.textContent = musicPlaying ? 'Playing locally' : 'Paused';
  };
  const selectSoundscape = index => {
    currentSoundscape = (index + soundscapes.length) % soundscapes.length;
    elapsedSeconds = 0;
    updateMusicProgress();
    const track = soundscapes[currentSoundscape];
    document.querySelector('[data-track-title]').textContent = track.title;
    document.querySelector('[data-track-subtitle]').textContent = track.subtitle;
    document.querySelectorAll('[data-soundscape]').forEach(button => button.classList.toggle('is-selected', Number(button.dataset.soundscape) === currentSoundscape));
    if (musicPlaying) buildAmbientGraph();
  };
  musicPlay?.addEventListener('click', () => setMusicPlaying(!musicPlaying));
  document.querySelectorAll('[data-soundscape]').forEach(button => button.addEventListener('click', () => selectSoundscape(Number(button.dataset.soundscape))));
  document.querySelectorAll('[data-track-step]').forEach(button => button.addEventListener('click', () => selectSoundscape(currentSoundscape + Number(button.dataset.trackStep))));

  // Complete 2048 implementation: keyboard, swipe, scoring, best score and game-over state.
  const gameBoard = document.querySelector('[data-game-board]');
  const gameCells = [...document.querySelectorAll('.game-cell')];
  const gameScore = document.querySelector('[data-game-score]');
  const gameBest = document.querySelector('[data-game-best]');
  const gameMessage = document.querySelector('[data-game-message]');
  let board = Array(16).fill(0);
  let score = 0;
  let bestScore = Number(readStorage(localStorage, 'chongjie-2048-best') || 0);
  let newTileIndex = -1;
  const renderGame = () => {
    gameCells.forEach((cell, index) => {
      const value = board[index];
      cell.textContent = value || '';
      if (value) cell.dataset.value = value; else delete cell.dataset.value;
      cell.classList.toggle('is-new', index === newTileIndex);
    });
    gameScore.textContent = score;
    bestScore = Math.max(bestScore, score);
    writeStorage(localStorage, 'chongjie-2048-best', bestScore);
    gameBest.textContent = bestScore;
  };
  const addRandomTile = () => {
    const empty = board.map((value, index) => value ? -1 : index).filter(index => index >= 0);
    if (!empty.length) return;
    newTileIndex = empty[Math.floor(Math.random() * empty.length)];
    board[newTileIndex] = Math.random() < 0.9 ? 2 : 4;
  };
  const mergeLine = line => {
    const values = line.filter(Boolean);
    const merged = [];
    for (let index = 0; index < values.length; index += 1) {
      if (values[index] === values[index + 1]) {
        const value = values[index] * 2;
        merged.push(value);
        score += value;
        index += 1;
      } else merged.push(values[index]);
    }
    return [...merged, ...Array(4 - merged.length).fill(0)];
  };
  const canGameMove = () => board.some(value => !value) || board.some((value, index) => (index % 4 < 3 && value === board[index + 1]) || (index < 12 && value === board[index + 4]));
  const moveGame = direction => {
    const before = board.join(',');
    const next = Array(16).fill(0);
    for (let lineIndex = 0; lineIndex < 4; lineIndex += 1) {
      const indices = direction === 'left' || direction === 'right'
        ? [0, 1, 2, 3].map(column => lineIndex * 4 + column)
        : [0, 1, 2, 3].map(row => row * 4 + lineIndex);
      if (direction === 'right' || direction === 'down') indices.reverse();
      const merged = mergeLine(indices.map(index => board[index]));
      indices.forEach((index, offset) => { next[index] = merged[offset]; });
    }
    board = next;
    if (board.join(',') === before) return false;
    addRandomTile();
    renderGame();
    gameMessage.classList.toggle('is-visible', !canGameMove());
    return true;
  };
  const newGame = () => {
    board = Array(16).fill(0);
    score = 0;
    gameMessage.classList.remove('is-visible');
    addRandomTile(); addRandomTile(); renderGame();
  };
  document.querySelectorAll('[data-game-new]').forEach(button => button.addEventListener('click', newGame));
  let swipeStart = null;
  gameBoard?.addEventListener('pointerdown', event => { swipeStart = { x: event.clientX, y: event.clientY }; gameBoard.setPointerCapture(event.pointerId); });
  gameBoard?.addEventListener('pointerup', event => {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    moveGame(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  newGame();

  const searchInput = document.getElementById('spotlightInput');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    document.querySelectorAll('#spotlightResults button').forEach(item => item.classList.toggle('is-filtered', !item.dataset.search.includes(query)));
  });
  document.querySelectorAll('.panel-close').forEach(button => button.addEventListener('click', () => closeOverlays()));

  document.addEventListener('keydown', (event) => {
    const gameDirections = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (activeWindow?.dataset.app === 'game' && gameDirections[event.key]) {
      event.preventDefault();
      moveGame(gameDirections[event.key]);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('spotlight').classList.add('is-visible'); setTimeout(() => searchInput.focus(), 20); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'w' && activeWindow) { event.preventDefault(); activeWindow.classList.remove('is-open'); syncDock(); }
    if (event.altKey && event.key.toLowerCase() === 'd') { event.preventDefault(); runAction('show-desktop'); }
    if (event.key === 'Escape') {
      const lightbox = document.querySelector('[data-lightbox-host]');
      if (lightbox.classList.contains('is-visible')) lightbox.classList.remove('is-visible');
      else closeOverlays();
    }
    if (event.key === 'ArrowLeft' && document.querySelector('[data-lightbox-host]').classList.contains('is-visible')) document.querySelector('.lightbox-prev').click();
    if (event.key === 'ArrowRight' && document.querySelector('[data-lightbox-host]').classList.contains('is-visible')) document.querySelector('.lightbox-next').click();
  });

  const updateClock = () => {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
    const time = now.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
    document.getElementById('clock').textContent = `${date}  ${time}`;
  };
  updateClock(); setInterval(updateClock, 30000);

  document.getElementById('replayBoot')?.addEventListener('click', () => { closeOverlays(); boot?.classList.remove('is-hidden'); setTimeout(finishBoot, 1250); });
  syncDock();
})();
