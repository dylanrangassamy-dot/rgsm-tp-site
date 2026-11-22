/* =========================================================
   RGSM TP — Guadeloupe · interactions & animations
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Seeded random (stable art) ---------- */
  const rng = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ---------- Text splitting ---------- */
  function splitWords(el, baseDelay = .25, step = .07) {
    let i = 0;
    const walk = node => [...node.childNodes].map(n => {
      if (n.nodeType === 3) {
        return n.textContent.split(/(\s+)/).map(t => {
          if (!t.trim()) return t;
          return `<span class="w"><span style="--d:${(baseDelay + i++ * step).toFixed(2)}s">${t}</span></span>`;
        }).join('');
      }
      return n.nodeName === 'BR' ? '<br>' : n.outerHTML;
    }).join('');
    el.innerHTML = walk(el);
  }
  function splitChars(el) {
    let i = 0;
    el.innerHTML = [...el.childNodes].map(n => {
      if (n.nodeName === 'BR') return '<br>';
      return n.textContent.split(/(\s+)/).map(word => {
        if (!word.trim()) return ' ';
        return `<span class="wd">${[...word].map(ch => `<span class="c" style="--i:${i++}">${ch}</span>`).join('')}</span>`;
      }).join('');
    }).join('');
  }
  splitWords($('.hero-title'));
  $$('.split-chars').forEach(splitChars);

  /* ---------- Loader ---------- */
  const loader = $('.loader'), bar = $('.loader-bar i'), pct = $('.loader-pct');
  const t0 = performance.now(), dur = reduce ? 10 : 1300;
  (function load(now) {
    const p = clamp((now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    bar.style.width = (e * 100) + '%';
    pct.textContent = String(Math.round(e * 100)).padStart(3, '0');
    if (p < 1) return requestAnimationFrame(load);
    loader.classList.add('done');
    document.body.classList.remove('is-loading');
    setTimeout(() => document.body.classList.add('ready'), 250);
    setTimeout(startTyping, 1600);
  })(t0);

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    if (en.target.dataset.count !== undefined) count(en.target);
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('.reveal, .split-chars, .stat-num').forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  function count(el) {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', start = performance.now(), d = reduce ? 1 : 1800;
    (function tick(now) {
      const p = clamp((now - start) / d), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- Custom cursor ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  if (fine && !reduce) {
    const dot = $('.cursor'), ring = $('.cursor-ring'), r = { x: mouse.x, y: mouse.y };
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; dot.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; });
    (function loop() {
      r.x = lerp(r.x, mouse.x, .16); r.y = lerp(r.y, mouse.y, .16);
      ring.style.transform = `translate(${r.x}px,${r.y}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', e => ring.classList.toggle('hover', !!e.target.closest('a, button, .card, .tile, .chips label, .palette-list li, ')));
  } else {
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduce) $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      b.style.setProperty('--mx', ((x - r.width / 2) * .25) + 'px');
      b.style.setProperty('--my', ((y - r.height / 2) * .35) + 'px');
      b.style.setProperty('--bx', x + 'px'); b.style.setProperty('--by', y + 'px');
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });

  /* ---------- Spotlight + tilt ---------- */
  $$('.spot').forEach(c => {
    const tilt = c.classList.contains('tilt') && fine && !reduce;
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
      if (tilt) { c.style.setProperty('--ty', ((x - .5) * 8) + 'deg'); c.style.setProperty('--tx', ((.5 - y) * 8) + 'deg'); }
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--tx', '0deg'); c.style.setProperty('--ty', '0deg'); });
  });

  /* ---------- Nav ---------- */
  const nav = $('.nav'), links = $$('.nav-links a'), ind = $('.nav-indicator'), burger = $('.burger'), menu = $('.nav-links');
  function moveIndicator(a) {
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  links.forEach(a => {
    a.addEventListener('pointerenter', () => moveIndicator(a));
    a.addEventListener('click', () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
  });
  menu.addEventListener('pointerleave', () => moveIndicator($('.nav-links a.active')));
  burger.addEventListener('click', () => {
    const o = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
  });
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);

  /* ---------- Hero topo contour lines ---------- */
  const topo = $('.topo');
  if (topo) {
    const R = rng(971); let html = '';
    const peaks = [[380, 300, 1], [820, 360, .8], [600, 520, .6]];
    for (let k = 0; k < 3; k++) {
      const [cx, cy, s] = peaks[k];
      for (let i = 1; i <= 9; i++) {
        const rad = i * 34 * s, pts = [];
        const seedA = R() * 6, seedB = R() * 6;
        for (let a = 0; a <= 64; a++) {
          const t = a / 64 * Math.PI * 2;
          const n = 1 + .18 * Math.sin(t * 3 + seedA) + .1 * Math.sin(t * 5 + seedB);
          pts.push([cx + Math.cos(t) * rad * 1.5 * n, cy + Math.sin(t) * rad * n]);
        }
        const d = pts.map((p, j) => (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + 'Z';
        html += `<path d="${d}" class="${(i === 4 && k === 0) || (i === 3 && k === 1) ? 'hl' : ''}" style="--len:3000"/>`;
      }
    }
    topo.innerHTML = html;
    if (!reduce) $$('path', topo).forEach((p, i) => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      p.style.transition = `stroke-dashoffset 2.6s cubic-bezier(.22,1,.36,1) ${.4 + i * .04}s`;
      setTimeout(() => { p.style.strokeDashoffset = 0; }, 1400);
    });
  }

  /* ---------- Dust particles ---------- */
  const cv = $('.dust');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let W, H, parts = [];
    const size = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      W = cv.offsetWidth; H = cv.offsetHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: Math.round(W * H / 14000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .3, vx: Math.random() * .3 + .05, vy: -Math.random() * .2 - .03, a: Math.random() * .5 + .1, c: Math.random() < .25 }));
    };
    size(); addEventListener('resize', size);
    let heroVisible = true;
    new IntersectionObserver(([e]) => heroVisible = e.isIntersecting).observe($('.hero'));
    (function draw() {
      requestAnimationFrame(draw);
      if (!heroVisible) return;
      ctx.clearRect(0, 0, W, H);
      const rect = cv.getBoundingClientRect();
      for (const p of parts) {
        const dx = p.x - mouse.x, dy = p.y - (mouse.y - rect.top), d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const f = (14000 - d2) / 14000 * .9; p.x += dx / Math.sqrt(d2 + 1) * f; p.y += dy / Math.sqrt(d2 + 1) * f; }
        p.x += p.vx; p.y += p.vy;
        if (p.x > W) p.x = 0; if (p.y < 0) p.y = H;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = p.c ? `rgba(240,70,60,${p.a})` : `rgba(230,230,230,${p.a * .6})`;
        ctx.fill();
      }
    })();
  }

  /* ---------- Command palette: typing + selection ---------- */
  const typed = $('.typed'), items = $$('.palette-list li');
  const queries = [['terrassement', 0], ['vrd lotissement', 1], ['déboisement parcelle', 2], ['plateforme maison', 3], ['lotissement pro', 4]];
  let manual = false;
  const select = i => items.forEach((li, j) => li.classList.toggle('active', i === j));
  items.forEach((li, i) => {
    li.addEventListener('pointerenter', () => { manual = true; select(i); });
    li.addEventListener('click', () => location.hash = i >= 3 ? '#contact' : '#services');
  });
  $('.palette-list').addEventListener('pointerleave', () => manual = false);
  async function startTyping() {
    if (reduce) { typed.textContent = queries[0][0]; return; }
    const wait = ms => new Promise(r => setTimeout(r, ms));
    for (let q = 0; ; q = (q + 1) % queries.length) {
      const [txt, idx] = queries[q];
      for (let i = 1; i <= txt.length; i++) { typed.textContent = txt.slice(0, i); await wait(55 + Math.random() * 60); }
      if (!manual) select(idx);
      await wait(1800);
      for (let i = txt.length; i >= 0; i--) { typed.textContent = txt.slice(0, i); await wait(22); }
      await wait(300);
    }
  }

  /* ---------- Marquee (scroll-velocity driven) ---------- */
  const track = $('.marquee-track');
  track.innerHTML += track.innerHTML;
  let mqX = 0, vel = 0, lastY = scrollY;

  /* ---------- Strata art (cards + works) ---------- */
  const palettes = [
    ['#2a0f10', '#5a1d1d', '#a33a35', '#e5262b', '#ff8a7a'],
    ['#02193b', '#143ca3', '#2b5fd1', '#63a1ff', '#e5262b'],
    ['#0b1a14', '#163a2b', '#2b6b4c', '#59d499', '#e6e6e6'],
    ['#1b1c1e', '#452324', '#8a3b2f', '#e5262b', '#ff9b94']
  ];
  function strata(el, pal, seed, w = 600, h = 450, layers = 7) {
    const R = rng(seed + 1); let s = '';
    const sky = `<defs><linearGradient id="g${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="#040506"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g${seed})"/>`;
    for (let i = 0; i < layers; i++) {
      const base = h * (.25 + i * (.7 / layers)), amp = 18 + R() * 40, f1 = 1 + R() * 2.5, ph = R() * 6;
      let d = `M0 ${h} L0 ${base}`;
      for (let x = 0; x <= w; x += 20) d += ` L${x} ${(base + Math.sin(x / w * Math.PI * f1 + ph) * amp + Math.sin(x / 37 + ph) * 4).toFixed(1)}`;
      d += ` L${w} ${h}Z`;
      const col = pal[Math.min(pal.length - 1, Math.floor((i / layers) * pal.length * 1.2))];
      s += `<path d="${d}" fill="${col}" fill-opacity="${(.25 + i / layers * .6).toFixed(2)}" stroke="rgba(255,255,255,.12)" stroke-width="1" style="--lift:${-(layers - i) * 2}px"/>`;
    }
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${sky}${s}</svg>`;
  }
  $$('.strata').forEach((el, i) => strata(el, palettes[3], 40 + i, 600, 300, 6));
  $$('.work').forEach((el, i) => strata($('.work-art', el), palettes[+el.dataset.hue], 7 + i * 13));

  /* ---------- Form ---------- */
  const form = $('.form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', form).forEach(i => {
      i.classList.remove('err'); void i.offsetWidth;
      if (!i.value.trim()) { i.classList.add('err'); ok = false; }
    });
    if (!ok) return;
    const fd = new FormData(form), types = fd.getAll('type').join(', ') || '—';
    const body = `Bonjour RGSM TP, je souhaite un devis.\n\nProfil : ${fd.get('profil')}\nNom : ${fd.get('nom')}\nTéléphone : ${fd.get('tel')}\nCommune : ${fd.get('commune') || '—'}\nTravaux : ${types}\n\n${fd.get('message') || ''}`;
    // Envoi via WhatsApp (0690 52 27 37) : le message pré-rempli s'ouvre dans l'appli
    const url = `https://wa.me/590690522737?text=${encodeURIComponent(body)}`;
    form.classList.add('sent');
    $('.btn-block span', form).innerHTML = 'Message prêt dans WhatsApp ✓';
    if (!window.open(url, '_blank', 'noopener')) location.href = url;
  });
  $('.year').textContent = new Date().getFullYear();

  /* =========================================================
     Main scroll / frame loop
     ========================================================= */
  const progress = $('.progress i'), palette = $('.palette'), hero = $('.hero');
  const depthEls = $$('[data-depth]');
  const pm = { x: 0, y: 0 };
  let lastNavY = 0;

  function frame() {
    const y = scrollY, vh = innerHeight, docH = document.documentElement.scrollHeight - vh;

    // progress bar
    progress.style.transform = `scaleX(${clamp(y / docH)})`;

    // nav state
    nav.classList.toggle('scrolled', y > 40);
    if (Math.abs(y - lastNavY) > 6) { nav.classList.toggle('hide', y > lastNavY && y > 500 && !menu.classList.contains('open')); lastNavY = y; }

    // active link
    let active = null;
    sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top < vh * .4 && r.bottom > vh * .4) active = links[i]; });
    links.forEach(a => a.classList.toggle('active', a === active));
    if (!menu.matches(':hover')) moveIndicator(active);

    if (!reduce) {
      // hero parallax (mouse + scroll)
      pm.x = lerp(pm.x, (mouse.x / innerWidth - .5), .06);
      pm.y = lerp(pm.y, (mouse.y / vh - .5), .06);
      if (y < vh * 1.5) depthEls.forEach(el => {
        const d = +el.dataset.depth;
        el.style.transform = `translate3d(${pm.x * d}px, ${pm.y * d + y * d / 120}px, 0) rotate(${el.classList.contains('glow-blue') ? 0 : -18}deg)`;
      });

      // palette 3D unfold
      const pr = palette.getBoundingClientRect();
      const pp = clamp(1 - (pr.top - vh * .25) / (vh * .6));
      palette.style.setProperty('--rx', (28 * (1 - pp)) + 'deg');
      palette.style.setProperty('--sc', (.9 + .1 * pp).toFixed(3));

      // marquee with velocity
      vel = lerp(vel, y - lastY, .1); lastY = y;
      mqX -= 0.6 + Math.abs(vel) * .4;
      const half = track.scrollWidth / 2;
      if (-mqX >= half) mqX += half;
      track.style.transform = `translate3d(${mqX}px,0,0) skewX(${clamp(-vel * .3, -10, 10)}deg)`;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
