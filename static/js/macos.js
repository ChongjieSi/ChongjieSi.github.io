(() => {
  const desktop = document.getElementById('desktop');
  const windows = [...document.querySelectorAll('.window')];
  const panels = [...document.querySelectorAll('.floating-panel, .menu-popover')];
  let topZ = 20;
  let activeWindow = document.querySelector('.window.active');

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

  document.querySelectorAll('[data-filter-input]').forEach(input => input.addEventListener('input', () => {
    const type = input.dataset.filterInput;
    const scope = input.closest('.window');
    const query = input.value.trim().toLowerCase();
    scope.querySelectorAll(`[data-filter-item="${type}"]`).forEach(item => item.classList.toggle('is-filtered', !item.dataset.filterText.includes(query)));
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
    if (range.dataset.systemRange === 'volume') document.querySelector('[data-volume-label]').textContent = `${range.value}%`;
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

  document.querySelectorAll('[data-wallpaper]').forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.wallpaper;
    desktop.dataset.wallpaper = value;
    localStorage.setItem('chongjie-wallpaper', value);
    document.querySelectorAll('.wallpaper').forEach(item => item.classList.toggle('is-selected', item === button));
  }));
  const savedWallpaper = localStorage.getItem('chongjie-wallpaper');
  if (savedWallpaper) {
    desktop.dataset.wallpaper = savedWallpaper;
    document.querySelectorAll('.wallpaper').forEach(item => item.classList.toggle('is-selected', item.dataset.wallpaper === savedWallpaper));
  }

  const searchInput = document.getElementById('spotlightInput');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    document.querySelectorAll('#spotlightResults button').forEach(item => item.classList.toggle('is-filtered', !item.dataset.search.includes(query)));
  });
  document.querySelectorAll('.panel-close').forEach(button => button.addEventListener('click', () => closeOverlays()));

  document.addEventListener('keydown', (event) => {
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

  const boot = document.getElementById('bootScreen');
  const finishBoot = () => { boot.classList.add('is-hidden'); sessionStorage.setItem('chongjie-booted', '1'); };
  if (sessionStorage.getItem('chongjie-booted') || matchMedia('(prefers-reduced-motion: reduce)').matches) finishBoot(); else setTimeout(finishBoot, 1250);
  document.getElementById('replayBoot').addEventListener('click', () => { closeOverlays(); boot.classList.remove('is-hidden'); setTimeout(finishBoot, 1250); });
  syncDock();
})();
