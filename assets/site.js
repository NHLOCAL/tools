/* Progressive enhancement: navigation, content and downloads work without JS. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const toast = document.getElementById('toast');
  let toastTimer;

  function announce(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
  }

  function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const systemTheme = matchMedia('(prefers-color-scheme: dark)');
    let explicit = false;
    try { explicit = ['light', 'dark'].includes(localStorage.getItem('theme')); } catch { /* Storage is optional. */ }
    function update() {
      const dark = root.dataset.theme === 'dark';
      toggle.setAttribute('aria-label', dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה');
      toggle.setAttribute('aria-pressed', String(dark));
      document.querySelector('meta[name="theme-color"]').content = dark ? '#19271f' : '#f5f5ef';
    }
    toggle.hidden = false;
    update();
    toggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      explicit = true;
      try { localStorage.setItem('theme', root.dataset.theme); } catch { /* Keep the choice for this page. */ }
      update();
    });
    systemTheme.addEventListener('change', event => {
      if (!explicit) { root.dataset.theme = event.matches ? 'dark' : 'light'; update(); }
    });
  }

  function initNavigation() {
    const menu = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    const mobile = matchMedia('(max-width: 780px)');
    function setOpen(open, returnFocus = false) {
      nav.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'סגירת תפריט ניווט' : 'פתיחת תפריט ניווט');
      if (returnFocus) menu.focus();
    }
    menu.hidden = false;
    menu.addEventListener('click', () => setOpen(menu.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setOpen(false, true);
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.site-header')) setOpen(false);
    });
    mobile.addEventListener('change', () => setOpen(false));
    root.classList.add('js');
  }

  function initCatalog() {
    const input = document.getElementById('tool-search');
    if (!input) return;
    const cards = [...document.querySelectorAll('.tool-item')];
    const sections = [...document.querySelectorAll('.tool-section')];
    const count = document.getElementById('search-count');
    const clear = document.getElementById('clear-search');
    const empty = document.getElementById('empty-state');
    const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f\u0591-\u05c7]/g, '').toLocaleLowerCase('he').trim();
    const searchable = new Map(cards.map(card => [card, normalize(card.dataset.search)]));
    let updateTimer;

    function filter(updateURL = true) {
      const query = input.value.trim().slice(0, 200);
      const terms = normalize(query).split(/\s+/).filter(Boolean);
      let visible = 0;
      for (const card of cards) {
        card.hidden = !terms.every(term => searchable.get(card).includes(term));
        if (!card.hidden) visible++;
      }
      for (const section of sections) {
        const matches = section.querySelectorAll('.tool-item:not([hidden])').length;
        section.hidden = matches === 0;
        section.querySelector('.tool-list').classList.toggle('single-result', matches === 1);
      }
      empty.hidden = visible > 0;
      clear.hidden = !query;
      count.textContent = query ? `${visible} תוצאות מתוך ${cards.length} כלים` : `${cards.length} כלים לבחירה`;
      if (updateURL) {
        const url = new URL(location.href);
        if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
        try { history.replaceState(null, '', url); } catch { /* file:// can restrict history. */ }
      }
    }
    function reset(focus = true) {
      clearTimeout(updateTimer);
      input.value = '';
      filter();
      if (focus) input.focus();
    }
    function revealHash() {
      let target;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
      if (!target?.classList.contains('tool-item')) return;
      if (target.hidden) reset(false);
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
    }
    input.maxLength = 200;
    input.value = new URL(location.href).searchParams.get('q')?.slice(0, 200) || '';
    filter(false);
    input.addEventListener('input', () => {
      clearTimeout(updateTimer);
      updateTimer = setTimeout(filter, 90);
    });
    input.form.addEventListener('submit', event => { event.preventDefault(); clearTimeout(updateTimer); filter(); });
    clear.addEventListener('click', () => reset());
    document.querySelector('[data-reset-search]').addEventListener('click', () => reset());
    document.addEventListener('keydown', event => {
      const editable = event.target.closest('input, textarea, select, [contenteditable="true"]');
      if (event.key === '/' && !editable && !event.ctrlKey && !event.metaKey && !event.altKey && !document.querySelector('dialog[open]')) {
        event.preventDefault(); input.focus(); input.scrollIntoView({ block: 'center' });
      }
      if (event.key === 'Escape' && event.target === input) reset();
    });
    window.addEventListener('hashchange', revealHash);
    window.addEventListener('popstate', () => {
      input.value = new URL(location.href).searchParams.get('q')?.slice(0, 200) || '';
      filter(false); revealHash();
    });
    // Native anchors work without JS; wait for fonts before centering a deep link.
    document.fonts.ready.then(revealHash);
  }

  function initSharing() {
    const dialog = document.getElementById('share-dialog');
    const field = document.getElementById('share-url');
    document.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    document.querySelectorAll('.share-link').forEach(link => {
      link.addEventListener('click', async event => {
        // Leave modified clicks to the browser, including opening the direct link in a tab.
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const url = new URL(link.href);
        url.search = ''; // A shared link must never hide the tool behind a search filter.
        try {
          if (!navigator.clipboard) throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(url.href);
          const card = link.closest('.tool-item');
          card.classList.add('copied');
          announce('הקישור הועתק. אפשר לשתף את הכלי.');
          setTimeout(() => card.classList.remove('copied'), 1800);
        } catch {
          field.value = url.href;
          dialog.showModal();
          field.focus(); field.select();
        }
      });
    });
    const contact = document.getElementById('contact-link');
    if (navigator.userAgent.toLowerCase().includes('win')) {
      contact.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=nh.local11@gmail.com&su=' + encodeURIComponent('פנייה מאתר ארגז הכלים');
      contact.target = '_blank'; contact.rel = 'noopener noreferrer';
    }
  }

  function initDownloads() {
    const pendingPayloads = new Map();
    function localPayload(link) {
      const id = link.dataset.downloadId;
      if (window.NHLocalDownloads?.[id]) return Promise.resolve(window.NHLocalDownloads[id]);
      if (pendingPayloads.has(id)) return pendingPayloads.get(id);
      const pending = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timeout = setTimeout(() => finish(new Error('Download payload timed out')), 20000);
        function finish(error) {
          clearTimeout(timeout);
          script.remove();
          if (error) { pendingPayloads.delete(id); reject(error); }
          else resolve(window.NHLocalDownloads[id]);
        }
        script.onload = () => finish(window.NHLocalDownloads?.[id] ? null : new Error('Missing download payload'));
        script.onerror = () => finish(new Error('Download payload failed to load'));
        script.src = link.dataset.downloadPayload;
        document.head.appendChild(script);
      });
      pendingPayloads.set(id, pending);
      return pending;
    }
    document.querySelectorAll('[data-download-id]').forEach(link => {
      link.addEventListener('click', async event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (link.getAttribute('aria-busy') === 'true') return;
        link.setAttribute('aria-busy', 'true');
        try {
          let bytes;
          if (location.protocol === 'file:') {
            const encoded = await localPayload(link);
            bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
          } else {
            const response = await fetch(link.href, { signal: AbortSignal.timeout(20000) });
            if (!response.ok) throw new Error(`Download failed: ${response.status}`);
            bytes = await response.arrayBuffer();
          }
          const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
          const save = document.createElement('a');
          save.href = url;
          save.download = link.download;
          save.hidden = true;
          document.body.appendChild(save);
          save.click();
          save.remove();
          // Revoking immediately can race the browser's download manager.
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          announce(`הקובץ הועבר להורדה: ${link.download}`);
        } catch {
          announce('ההורדה נכשלה. נסו שוב או פתחו את קוד המקור של הכלי.');
        } finally {
          link.removeAttribute('aria-busy');
        }
      });
    });
  }

  function initMotion() {
    const toolbox = document.querySelector('.toolbox');
    if (!toolbox) return;
    const command = toolbox.querySelector('.terminal-line');
    const original = command.innerHTML;
    for (const drawer of toolbox.querySelectorAll('.drawer')) {
      const showCommand = () => {
        const directory = new URL(drawer.href).pathname.split('/').pop().replace('.html', '');
        command.textContent = `> open ./${directory}`;
      };
      drawer.addEventListener('pointerenter', showCommand);
      drawer.addEventListener('focus', showCommand);
    }
    const restoreCommand = () => { command.innerHTML = original; };
    toolbox.addEventListener('pointerleave', restoreCommand);
    toolbox.addEventListener('focusout', event => { if (!toolbox.contains(event.relatedTarget)) restoreCommand(); });
    if (!reducedMotion.matches) toolbox.classList.add('boot');
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) toolbox.classList.remove('boot'); });
  }

  initTheme();
  initNavigation();
  initCatalog();
  initSharing();
  initDownloads();
  initMotion();
})();
