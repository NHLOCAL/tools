/* A resting grid only redraws on resize/theme changes. Motion is input driven. */
(() => {
  'use strict';
  const canvas = document.getElementById('space-grid');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const wells = [];
  let width = 0, height = 0, spacing = 36, frame = 0, lastTime = 0;
  let ink, activeWell, pointerOrigin;
  let particles = [];

  function palette() {
    ink = getComputedStyle(root).getPropertyValue('--ink').trim();
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    spacing = width < 560 ? 28 : 36;
    palette(); draw();
  }
  function bend(x, y) {
    let offsetX = 0, offsetY = 0;
    for (const well of wells) {
      const dx = x - well.x, dy = y - well.y;
      const pull = Math.exp(-(dx * dx + dy * dy) / (2 * 145 * 145)) * well.strength;
      offsetX -= dx * .55 * pull;
      offsetY += (38 - dy * .55) * pull;
    }
    return [x + offsetX, y + offsetY];
  }
  function drawLine(vertical, offset) {
    ctx.beginPath();
    const end = vertical ? height : width;
    for (let position = -spacing; position <= end + spacing; position += 12) {
      const point = vertical ? bend(offset, position) : bend(position, offset);
      if (position === -spacing) ctx.moveTo(...point); else ctx.lineTo(...point);
    }
    ctx.stroke();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = ink;
    ctx.lineWidth = .7;
    ctx.globalAlpha = root.dataset.theme === 'dark' ? .13 : .15;
    for (let x = 0; x <= width; x += spacing) drawLine(true, x);
    for (let y = 0; y <= height; y += spacing) drawLine(false, y);
    for (const well of wells) {
      ctx.globalAlpha = well.strength * .28;
      ctx.fillStyle = ink;
      ctx.fillRect(well.x - 2, well.y + 38 * well.strength - 2, 4, 4);
    }
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }
  function tick(time) {
    const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
    lastTime = time;
    for (let i = wells.length - 1; i >= 0; i--) {
      const well = wells[i];
      const target = well.held || time - well.created < 260 ? 1 : 0;
      well.strength += (target - well.strength) * (target ? .15 : .065) * delta;
      if (!target && well.strength < .003) wells.splice(i, 1);
    }
    particles = particles.filter(particle => {
      particle.x += particle.vx * delta; particle.y += particle.vy * delta;
      particle.vy += .055 * delta; particle.life -= .012 * delta;
      return particle.life > 0;
    });
    draw();
    if (wells.length || particles.length) frame = requestAnimationFrame(tick);
    else { frame = 0; lastTime = 0; }
  }
  function start() {
    if (!frame && !motion.matches && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function addWell(x, y, held = false) {
    if (motion.matches) return;
    if (wells.length >= 3) wells.shift();
    const well = { x, y, strength: .02, held, created: performance.now() };
    wells.push(well); start(); return well;
  }
  function isBackground(target) {
    return !target.closest('a, button, input, textarea, select, dialog, p, h1, h2, h3, label, .prose, .breadcrumbs, .tool-item, .toolbox, .site-header, .site-footer, [contenteditable]');
  }
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || !isBackground(event.target)) return;
    if (event.pointerType === 'touch') pointerOrigin = { x: event.clientX, y: event.clientY };
    else {
      activeWell = addWell(event.clientX, event.clientY, true);
      if (activeWell) {
        event.preventDefault();
        root.classList.add('grid-dragging');
      }
    }
  });
  document.addEventListener('pointermove', event => {
    if (activeWell) { activeWell.x = event.clientX; activeWell.y = event.clientY; }
  }, { passive: true });
  function release(event) {
    root.classList.remove('grid-dragging');
    if (activeWell) { activeWell.held = false; activeWell = null; }
    if (pointerOrigin && event.type === 'pointerup' && Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y) < 12) {
      addWell(event.clientX, event.clientY);
    }
    pointerOrigin = null;
  }
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });
  window.addEventListener('blur', release);
  function stop() {
    root.classList.remove('grid-dragging');
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    activeWell = null; pointerOrigin = null; wells.length = 0; particles = []; draw();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  motion.addEventListener('change', () => { if (motion.matches) stop(); });
  window.addEventListener('resize', resize, { passive: true });
  new MutationObserver(() => { palette(); draw(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // Easter eggs: G twice, the terminal cat, and a 42 search.
  const egg = document.getElementById('easter-egg');
  let eggTimer;
  function message(text) {
    clearTimeout(eggTimer); egg.textContent = text; egg.hidden = false;
    eggTimer = setTimeout(() => { egg.hidden = true; }, 5000);
  }
  let lastG = null;
  document.addEventListener('keydown', event => {
    if (event.target.closest('input, textarea, select, [contenteditable]') || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape') { stop(); egg.hidden = true; lastG = null; return; }
    if (event.repeat) return;
    if (event.code !== 'KeyG') { lastG = null; return; }
    const now = performance.now();
    if (lastG === null || now - lastG > 1200) { lastG = now; return; }
    lastG = null; message('GG! נוספו 30 חיים לארגז.');
    if (motion.matches) return;
    particles = Array.from({ length: 48 }, (_, index) => ({ x: width / 2, y: Math.min(height / 2, 350), vx: Math.cos(index * 2.399) * (2 + index % 5), vy: Math.sin(index * 2.399) * 5 - 3, size: 3 + index % 3, color: ['#789a37', '#60988f', '#a16f82'][index % 3], life: 1 }));
    addWell(width / 2, Math.min(height / 2, 350)); start();
  });
  const title = document.querySelector('.window-title');
  function showCat() {
    message('מיאו! נמצא חתול בקוד');
    const cat = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    cat.setAttribute('viewBox', '0 0 24 20');
    cat.setAttribute('class', 'pixel-cat');
    cat.setAttribute('role', 'img');
    cat.setAttribute('aria-label', 'חתול פיקסלים');
    cat.innerHTML = '<path fill="currentColor" d="M3 2h4v3h10V2h4v16H3z"/><path fill="var(--accent)" d="M6 8h4v4H6zm8 0h4v4h-4zM9 15h6v1H9z"/><path fill="currentColor" d="M8 9h2v2H8zm6 0h2v2h-2z"/>';
    egg.prepend(cat);
  }
  title?.addEventListener('click', showCat);
  document.querySelector('[data-show-cat]')?.addEventListener('click', showCat);
  const input = document.getElementById('tool-search');
  let found42 = false;
  input?.addEventListener('input', () => {
    if (input.value.trim() === '42' && !found42) { found42 = true; message('42. התשובה כאן. את השאלה נשאיר לכם.'); }
    if (input.value.trim() !== '42') found42 = false;
  });
  resize();
})();
