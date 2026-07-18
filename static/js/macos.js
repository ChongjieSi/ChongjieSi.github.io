(() => {
  const desktop = document.getElementById('desktop');
  const windows = [...document.querySelectorAll('.window')];
  const panels = [...document.querySelectorAll('.floating-panel, .menu-popover')];
  const boot = document.getElementById('bootScreen');
  const lockScreen = document.getElementById('lockScreen');
  const lockWallpaper = document.getElementById('lockWallpaper');
  let topZ = 20;
  let activeWindow = document.querySelector('.window.active');
  let musicVolume = 0.65;
  let audioPlayer = null;
  const readStorage = (storage, key) => { try { return storage.getItem(key); } catch (_) { return null; } };
  const writeStorage = (storage, key, value) => { try { storage.setItem(key, value); } catch (_) {} };

  // Never let an optional app failure leave the transparent boot layer over the desktop.
  const finishBoot = () => boot?.classList.add('is-hidden');
  window.setTimeout(finishBoot, matchMedia('(prefers-reduced-motion: reduce)').matches ? 320 : 1250);

  const closeOverlays = (except) => panels.forEach(panel => {
    if (panel !== except) panel.classList.remove('is-visible');
  });

  const focusWindow = (win) => {
    if (!win) {
      windows.forEach(item => item.classList.remove('active'));
      activeWindow = null;
      desktop.classList.remove('has-active-window');
      return;
    }
    windows.forEach(item => item.classList.remove('active'));
    win.classList.add('active');
    win.style.zIndex = ++topZ;
    activeWindow = win;
    desktop.classList.toggle('has-active-window', !!win);
    document.getElementById('activeAppName').textContent = win.dataset.title || 'Finder';
  };

  const centerInitialProfile = () => {
    const profile = document.getElementById('window-about');
    if (!profile || innerWidth <= 760) return;
    const width = profile.offsetWidth;
    const height = profile.offsetHeight;
    profile.style.left = `${Math.max(12, (innerWidth - width) / 2)}px`;
    profile.style.top = `${Math.max(44, (innerHeight - height - 34) / 2)}px`;
  };
  const unlockDesktop = () => {
    if (lockScreen?.classList.contains('is-hidden')) return;
    lockScreen.classList.add('is-unlocking');
    window.setTimeout(() => {
      lockScreen.classList.add('is-hidden');
      lockScreen.classList.remove('is-unlocking');
      centerInitialProfile();
      focusWindow(document.getElementById('window-about'));
    }, 430);
  };
  const showLockScreen = () => {
    lockScreen?.classList.remove('is-hidden', 'is-unlocking');
    closeOverlays();
    centerInitialProfile();
  };
  lockScreen?.addEventListener('click', unlockDesktop);

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
    win.classList.remove('is-minimized', 'is-closing', 'is-minimizing');
    focusWindow(win);
    closeOverlays();
    syncDock();
  };

  document.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open]');
    if (open) {
      if (open.classList.contains('desktop-icon') && event.detail < 2) return;
      event.preventDefault();
      if (open.classList.contains('dock-item')) {
        open.classList.remove('is-launching');
        requestAnimationFrame(() => open.classList.add('is-launching'));
        window.setTimeout(() => open.classList.remove('is-launching'), 560);
      }
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
    win.addEventListener('pointerdown', () => {
      desktop.classList.remove('mission-control');
      focusWindow(win);
    });
    win.querySelectorAll('[data-window-action]').forEach(button => button.addEventListener('click', (event) => {
      event.stopPropagation();
      const action = button.dataset.windowAction;
      if (action === 'close' || action === 'minimize') {
        const motionClass = action === 'close' ? 'is-closing' : 'is-minimizing';
        win.classList.add(motionClass);
        window.setTimeout(() => {
          win.classList.remove(motionClass);
          if (action === 'close') win.classList.remove('is-open');
          else win.classList.add('is-minimized');
          syncDock();
        }, action === 'close' ? 210 : 270);
      }
      if (action === 'maximize') win.classList.toggle('is-maximized');
      const next = [...windows].filter(item => item.classList.contains('is-open') && !item.classList.contains('is-minimized') && ((action !== 'close' && action !== 'minimize') || item !== win)).sort((a,b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
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
    if (host.dataset.detailHost === 'notes') renderNoteMath(host);
  };

  const mathOptions = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true }
    ],
    throwOnError: false,
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
  };
  function renderNoteMath(host, attempt = 0) {
    if (typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(host, mathOptions);
      return;
    }
    if (attempt < 20) window.setTimeout(() => renderNoteMath(host, attempt + 1), 100);
  }

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
      if (audioPlayer) audioPlayer.volume = musicVolume;
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

  // Subtle spatial response keeps the desktop feeling dimensional without affecting controls.
  let atmosphereFrame = 0;
  document.addEventListener('pointermove', (event) => {
    if (dragState.active || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cancelAnimationFrame(atmosphereFrame);
    atmosphereFrame = requestAnimationFrame(() => {
      const nx = event.clientX / innerWidth - 0.5;
      const ny = event.clientY / innerHeight - 0.5;
      desktop.style.setProperty('--mx', `${nx * -8}px`);
      desktop.style.setProperty('--my', `${ny * -6}px`);
      desktop.style.setProperty('--px', `${event.clientX}px`);
      desktop.style.setProperty('--py', `${event.clientY}px`);
    });
  });

  const runAction = (action) => {
    if (action === 'mission-control') {
      const openWindows = windows.filter(win => win.classList.contains('is-open'));
      const entering = !desktop.classList.contains('mission-control');
      desktop.classList.toggle('mission-control', entering);
      if (entering && openWindows.length) {
        const columns = Math.ceil(Math.sqrt(openWindows.length));
        const rows = Math.ceil(openWindows.length / columns);
        const gap = 22;
        const width = Math.min(430, (innerWidth - 80 - gap * (columns - 1)) / columns);
        const height = Math.min(310, (innerHeight - 150 - gap * (rows - 1)) / rows);
        const gridWidth = columns * width + (columns - 1) * gap;
        const gridHeight = rows * height + (rows - 1) * gap;
        openWindows.forEach((win, index) => {
          win.style.setProperty('--mission-x', `${(innerWidth - gridWidth) / 2 + (index % columns) * (width + gap)}px`);
          win.style.setProperty('--mission-y', `${62 + (innerHeight - 120 - gridHeight) / 2 + Math.floor(index / columns) * (height + gap)}px`);
          win.style.setProperty('--mission-w', `${width}px`);
          win.style.setProperty('--mission-h', `${height}px`);
        });
      }
    }
    if (action === 'show-desktop') {
      desktop.classList.remove('mission-control');
      windows.forEach(win => win.classList.add('is-minimized'));
    }
    if (action === 'minimize-active' && activeWindow) activeWindow.classList.add('is-minimized');
    if (action === 'maximize-active' && activeWindow) activeWindow.classList.toggle('is-maximized');
    if (action === 'bring-front') windows.filter(win => win.classList.contains('is-open')).forEach(focusWindow);
    closeOverlays(); syncDock();
  };
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => runAction(button.dataset.action)));

  const desktopMenu = document.getElementById('desktopMenu');
  desktop.addEventListener('contextmenu', (event) => {
    if (event.target.closest('.window,.dock,.menu-bar,.floating-panel,.menu-popover')) return;
    event.preventDefault();
    closeOverlays(desktopMenu);
    desktopMenu.style.left = `${Math.min(event.clientX, innerWidth - 235)}px`;
    desktopMenu.style.top = `${Math.min(Math.max(38, event.clientY), innerHeight - 190)}px`;
    desktopMenu.classList.add('is-visible');
  });

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
      if (lockWallpaper) lockWallpaper.style.backgroundImage = `url("${url}")`;
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

  // Local audio library generated from static/audio at build time.
  const musicApp = document.querySelector('.music-app');
  const musicPlay = document.querySelector('[data-music-play]');
  const musicElapsed = document.querySelector('[data-music-elapsed]');
  const musicProgress = document.querySelector('[data-music-progress]');
  const musicDuration = document.querySelector('[data-music-duration]');
  const musicStatus = document.querySelector('.music-status');
  const lyricsPanel = document.querySelector('[data-lyrics-panel]');
  const localTracks = [...document.querySelectorAll('[data-local-track]')];
  let currentTrack = 0;
  let lyricLines = [];
  let activeLyric = -1;
  let lyricRequest = 0;
  audioPlayer = new Audio();
  audioPlayer.preload = 'metadata';
  audioPlayer.volume = musicVolume;

  const formatTime = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00';
  const updateMusicProgress = () => {
    musicElapsed.textContent = formatTime(audioPlayer.currentTime);
    musicDuration.textContent = formatTime(audioPlayer.duration);
    musicProgress.style.width = `${audioPlayer.duration ? audioPlayer.currentTime / audioPlayer.duration * 100 : 0}%`;
  };
  const showLyricsMessage = message => {
    lyricLines = [];
    activeLyric = -1;
    lyricsPanel.classList.remove('has-lyrics');
    const line = document.createElement('p');
    line.textContent = message;
    lyricsPanel.replaceChildren(line);
  };
  const parseLyrics = source => {
    const parsed = [];
    source.split(/\r?\n/).forEach(row => {
      const text = row.replace(/\[[0-9]{1,3}:[0-9]{2}(?:[.:][0-9]{1,3})?\]/g, '').trim();
      if (!text) return;
      for (const match of row.matchAll(/\[([0-9]{1,3}):([0-9]{2})(?:[.:]([0-9]{1,3}))?\]/g)) {
        const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
        parsed.push({ time: Number(match[1]) * 60 + Number(match[2]) + fraction, text });
      }
    });
    return parsed.sort((a, b) => a.time - b.time);
  };
  const loadLyrics = async track => {
    const request = ++lyricRequest;
    if (!track.dataset.lyricsSrc) { showLyricsMessage('No synced lyrics'); return; }
    showLyricsMessage('Loading lyrics…');
    try {
      const response = await fetch(track.dataset.lyricsSrc);
      if (!response.ok) throw new Error('Lyrics unavailable');
      const parsed = parseLyrics(await response.text());
      if (request !== lyricRequest) return;
      if (!parsed.length) { showLyricsMessage('No synced lyrics'); return; }
      lyricLines = parsed;
      activeLyric = -1;
      const fragment = document.createDocumentFragment();
      lyricLines.forEach((entry, index) => {
        const line = document.createElement('p');
        line.textContent = entry.text;
        line.dataset.lyricIndex = index;
        fragment.appendChild(line);
      });
      lyricsPanel.replaceChildren(fragment);
      lyricsPanel.classList.add('has-lyrics');
      lyricsPanel.scrollTop = 0;
    } catch (_) {
      if (request === lyricRequest) showLyricsMessage('Lyrics unavailable');
    }
  };
  const updateActiveLyric = () => {
    if (!lyricLines.length) return;
    let next = -1;
    for (let index = 0; index < lyricLines.length; index += 1) {
      if (lyricLines[index].time <= audioPlayer.currentTime + 0.12) next = index;
      else break;
    }
    if (next === activeLyric) return;
    activeLyric = next;
    lyricsPanel.querySelectorAll('[data-lyric-index]').forEach((line, index) => line.classList.toggle('is-current', index === next));
    lyricsPanel.querySelector(`[data-lyric-index="${next}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const syncMusicState = () => {
    const playing = !audioPlayer.paused;
    musicApp?.classList.toggle('is-playing', playing);
    musicPlay?.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    musicPlay?.querySelector('use')?.setAttribute('href', playing ? '#i-pause' : '#i-play');
    musicStatus.textContent = playing ? 'Playing' : `${localTracks.length} local tracks`;
  };
  const selectLocalTrack = (index, autoplay = false) => {
    if (!localTracks.length) { musicStatus.textContent = 'Add music to static/audio'; return; }
    currentTrack = (index + localTracks.length) % localTracks.length;
    const track = localTracks[currentTrack];
    localTracks.forEach(button => button.classList.toggle('is-selected', button === track));
    document.querySelector('[data-track-title]').textContent = track.dataset.trackName;
    document.querySelector('[data-track-subtitle]').textContent = track.dataset.trackArtist;
    loadLyrics(track);
    if (audioPlayer.getAttribute('src') !== track.dataset.audioSrc) {
      audioPlayer.src = track.dataset.audioSrc;
      audioPlayer.load();
    }
    if (autoplay) audioPlayer.play().catch(() => { musicStatus.textContent = 'Press play to start'; });
    updateMusicProgress(); syncMusicState();
  };
  musicPlay?.addEventListener('click', () => {
    if (!localTracks.length) { musicStatus.textContent = 'Add music to static/audio'; return; }
    if (!audioPlayer.src) selectLocalTrack(currentTrack);
    if (audioPlayer.paused) audioPlayer.play().catch(() => { musicStatus.textContent = 'Audio could not be played'; });
    else audioPlayer.pause();
  });
  localTracks.forEach((button, index) => button.addEventListener('click', () => selectLocalTrack(index, true)));
  document.querySelectorAll('[data-track-step]').forEach(button => button.addEventListener('click', () => selectLocalTrack(currentTrack + Number(button.dataset.trackStep), !audioPlayer.paused)));
  document.querySelector('[data-music-seek]')?.addEventListener('click', event => {
    if (!audioPlayer.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    audioPlayer.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audioPlayer.duration;
  });
  audioPlayer.addEventListener('timeupdate', () => { updateMusicProgress(); updateActiveLyric(); });
  audioPlayer.addEventListener('loadedmetadata', updateMusicProgress);
  audioPlayer.addEventListener('play', syncMusicState);
  audioPlayer.addEventListener('pause', syncMusicState);
  audioPlayer.addEventListener('ended', () => selectLocalTrack(currentTrack + 1, true));
  audioPlayer.addEventListener('error', () => { musicStatus.textContent = 'Audio file unavailable'; syncMusicState(); });
  if (localTracks.length) selectLocalTrack(0);

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
    if (lockScreen && !lockScreen.classList.contains('is-hidden')) {
      if (event.key === 'Enter' || event.key === ' ') unlockDesktop();
      event.preventDefault();
      return;
    }
    const gameDirections = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (activeWindow?.dataset.app === 'game' && gameDirections[event.key]) {
      event.preventDefault();
      moveGame(gameDirections[event.key]);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('spotlight').classList.add('is-visible'); setTimeout(() => searchInput.focus(), 20); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'w' && activeWindow) { event.preventDefault(); activeWindow.classList.remove('is-open'); syncDock(); }
    if ((event.metaKey || event.ctrlKey) && event.key === 'Tab') {
      event.preventDefault();
      const openWindows = windows.filter(win => win.classList.contains('is-open')).sort((a,b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0));
      if (openWindows.length) {
        const current = openWindows.indexOf(activeWindow);
        const next = openWindows[(current + 1) % openWindows.length];
        next.classList.remove('is-minimized');
        desktop.classList.remove('mission-control');
        focusWindow(next); syncDock();
      }
    }
    if (event.altKey && event.key.toLowerCase() === 'd') { event.preventDefault(); runAction('show-desktop'); }
    if (event.key === 'Escape') {
      if (desktop.classList.contains('mission-control')) { desktop.classList.remove('mission-control'); return; }
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
    const lockTime = document.getElementById('lockTime');
    const lockDate = document.getElementById('lockDate');
    if (lockTime) lockTime.textContent = now.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
    if (lockDate) lockDate.textContent = now.toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'});
  };
  updateClock(); setInterval(updateClock, 30000);

  requestAnimationFrame(centerInitialProfile);
  window.addEventListener('resize', () => { if (!lockScreen?.classList.contains('is-hidden')) centerInitialProfile(); });
  document.getElementById('replayBoot')?.addEventListener('click', () => {
    showLockScreen();
    const progress = boot?.querySelector('.boot-track span');
    if (progress) { progress.style.animation = 'none'; void progress.offsetWidth; progress.style.animation = ''; }
    boot?.classList.remove('is-hidden');
    setTimeout(finishBoot, 1250);
  });
  syncDock();
})();
