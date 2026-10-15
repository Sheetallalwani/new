(function () {
  'use strict';

  var C = window.BDAY || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------- text from config.js ---------- */
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o && o[k]; }, C);
  }
  function fillText() {
    document.querySelectorAll('[data-t]').forEach(function (el) {
      var v = get(el.dataset.t);
      if (typeof v === 'string') el.textContent = v.replace(/\{name\}/g, C.name || '');
    });
    document.title = (C.name ? C.name + "'s Birthday 🎂" : 'Happy Birthday 🎂');
  }

  /* ---------- sound (all synthesized, no audio files) ---------- */
  var ctx = null, muted = false;
  try { muted = localStorage.getItem('bday-muted') === '1'; } catch (e) {}

  function ac() {
    if (muted) return null;
    try {
      if (!ctx) {
        var A = window.AudioContext || window.webkitAudioContext;
        if (!A) return null;
        ctx = new A();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + (when || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq) {
    var c = ac(); if (!c) return;
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var s = c.createBufferSource(); s.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1500;
    var g = c.createGain(); g.gain.value = vol || 0.2;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  }
  var sfx = {
    pop: function () { noise(0.12, 0.5, 1500); tone(500, 0.1, 'sine', 0.15, 0, 120); },
    boom: function () { noise(0.35, 0.6, 700); tone(180, 0.3, 'triangle', 0.3, 0, 50); tone(900, 0.2, 'sine', 0.1, 0.05, 300); },
    chime: function () { [660, 880, 1100, 1320].forEach(function (f, i) { tone(f, 0.35, 'sine', 0.12, i * 0.09); }); },
    tada: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.4, 'triangle', 0.15, i * 0.12); }); tone(1047, 0.9, 'triangle', 0.12, 0.5); },
    pour: function () { noise(2.4, 0.1, 3200); },
    tick: function () { tone(900, 0.05, 'square', 0.04); },
    soft: function () { tone(1300, 0.03, 'sine', 0.015); }
  };
  ['pointerdown', 'keydown'].forEach(function (ev) {
    addEventListener(ev, function () { ac(); }, { once: true, passive: true });
  });

  /* ---------- confetti / particles ---------- */
  var cv = document.createElement('canvas');
  cv.id = 'fx';
  document.body.appendChild(cv);
  var g = cv.getContext('2d');
  var W = 0, H = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  var parts = [], running = false, last = 0;
  var PARTY = ['#FF7EB6', '#FFC93C', '#7ED6FF', '#9BE564', '#FF9F43', '#B28DFF'];

  function burst(x, y, o) {
    o = o || {};
    var n = o.count || 50, colors = o.colors || PARTY, shapes = o.shapes || ['rect', 'circle'];
    for (var i = 0; i < n; i++) {
      var a = rnd(0, Math.PI * 2), sp = rnd(o.min || 2, o.max || 9) * (o.power || 1);
      parts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up == null ? 3 : o.up),
        s: rnd(o.smin || 6, o.smax || 11), r: rnd(0, 6.28), vr: rnd(-0.3, 0.3),
        c: pick(colors), shape: pick(shapes), life: 1, decay: rnd(0.006, 0.014),
        g: o.gravity == null ? 0.22 : o.gravity
      });
    }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  }
  function loop(t) {
    var dt = Math.min((t - last) / 16.67, 3); last = t;
    g.clearRect(0, 0, W, H);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < H + 40; });
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.vy += p.g * dt; p.vx *= Math.pow(0.985, dt); p.vy *= Math.pow(0.99, dt);
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= p.decay * dt;
      g.save();
      g.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
      g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
      if (p.shape === 'circle') {
        g.beginPath(); g.arc(0, 0, p.s / 2, 0, 6.283); g.fill();
      } else if (p.shape === 'heart') {
        var s = p.s / 2;
        g.beginPath(); g.moveTo(0, s * 0.6);
        g.bezierCurveTo(-s * 1.4, -s * 0.2, -s * 0.6, -s * 1.2, 0, -s * 0.4);
        g.bezierCurveTo(s * 0.6, -s * 1.2, s * 1.4, -s * 0.2, 0, s * 0.6);
        g.fill();
      } else {
        g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      }
      g.restore();
    }
    if (parts.length) requestAnimationFrame(loop);
    else { running = false; g.clearRect(0, 0, W, H); }
  }
  function celebrate() {
    for (var i = 0; i < 6; i++) {
      (function (i) {
        setTimeout(function () {
          burst(rnd(W * 0.15, W * 0.85), rnd(H * 0.15, H * 0.5), { count: 60 });
          sfx.pop();
        }, i * 260);
      })(i);
    }
  }

  /* ---------- sunflowers ---------- */
  function sunflowerSVG(size) {
    var p = '', i;
    for (i = 0; i < 14; i++) p += '<ellipse cx="50" cy="19" rx="8" ry="17" fill="#FFB800" transform="rotate(' + (i * 360 / 14) + ' 50 50)"/>';
    for (i = 0; i < 14; i++) p += '<ellipse cx="50" cy="21" rx="7.5" ry="16" fill="#FFD43B" transform="rotate(' + (i * 360 / 14 + 360 / 28) + ' 50 50)"/>';
    var seeds = '';
    for (i = 0; i < 9; i++) {
      var a = i * Math.PI * 2 / 9;
      seeds += '<circle cx="' + (50 + Math.cos(a) * 13).toFixed(1) + '" cy="' + (50 + Math.sin(a) * 13).toFixed(1) + '" r="2" fill="#8a5a2f"/>';
    }
    return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" aria-hidden="true">' + p +
      '<circle cx="50" cy="50" r="19" fill="#5A3318"/><circle cx="50" cy="50" r="10" fill="#3f2210"/>' + seeds + '</svg>';
  }
  function makeField() {
    var el = $('#field'); if (!el) return;
    var n = Math.max(5, Math.round(innerWidth / 105));
    for (var i = 0; i < n; i++) {
      var f = document.createElement('div');
      f.className = 'flower';
      f.style.height = rnd(95, 175) + 'px';
      f.style.animationDelay = (-rnd(0, 4)) + 's';
      f.style.animationDuration = rnd(3.5, 5.5) + 's';
      f.innerHTML = sunflowerSVG(Math.round(rnd(52, 84))) + '<i class="stem"></i>';
      el.appendChild(f);
    }
    var gr = document.createElement('div'); gr.className = 'grass'; el.appendChild(gr);
  }
  function startFalling(list, every) {
    setInterval(function () {
      if (document.hidden) return;
      var e = document.createElement('div');
      e.className = 'fall';
      e.textContent = pick(list);
      e.style.cssText = 'left:' + rnd(0, 100) + '%;font-size:' + rnd(18, 38) + 'px;animation-duration:' + rnd(6, 11) +
        's;--dx:' + rnd(-80, 80) + 'px;--rot:' + rnd(-360, 360) + 'deg';
      e.addEventListener('animationend', function () { e.remove(); });
      document.body.appendChild(e);
    }, every);
  }

  /* ---------- shared UI: mute button, progress dots, page transitions ---------- */
  function injectUI() {
    var btn = document.createElement('button');
    btn.className = 'mute'; btn.type = 'button'; btn.setAttribute('aria-label', 'Toggle sound');
    var set = function () { btn.textContent = muted ? '🔇' : '🔊'; };
    set();
    btn.addEventListener('click', function () {
      muted = !muted;
      try { localStorage.setItem('bday-muted', muted ? '1' : '0'); } catch (e) {}
      set(); if (!muted) sfx.tick();
    });
    document.body.appendChild(btn);

    var step = parseInt(document.body.dataset.step || '0', 10);
    if (step) {
      var d = document.createElement('div'); d.className = 'dots';
      for (var i = 1; i <= 5; i++) {
        var s = document.createElement('i');
        if (i < step) s.className = 'past'; else if (i === step) s.className = 'on';
        d.appendChild(s);
      }
      document.body.appendChild(d);
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.go');
    if (!a) return;
    e.preventDefault();
    sfx.tick();
    document.body.classList.add('leaving');
    setTimeout(function () { location.href = a.href; }, 380);
  });
  addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });

  function splitLetters() {
    document.querySelectorAll('.w').forEach(function (w, wi) {
      var txt = w.textContent;
      w.setAttribute('aria-label', txt);
      w.textContent = '';
      var idx = 0;
      txt.split(' ').forEach(function (word, k) {
        if (k > 0) w.appendChild(document.createTextNode(' '));
        var grp = document.createElement('span');
        grp.className = 'wg';           // keeps a word together so it never breaks mid-word
        Array.from(word).forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'l'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch;
          s.style.animationDelay = (wi * 0.5 + idx * 0.09) + 's';
          idx++;
          grp.appendChild(s);
        });
        w.appendChild(grp);
      });
    });
  }

  /* ---------- PAGE 1: balloons ---------- */
  var BALLOON_COLORS = ['#FF6B9D', '#FFC93C', '#6BCBFF', '#9BE564', '#B28DFF', '#FF9F43', '#FF7A7A'];
  var WORDS = ['yay!', '💛', 'cutie', '🎉', 'wow!', 'hehe', '🌻', 'aww', '✨'];
  var popped = 0, toastEl = null;

  function spawnBalloon(initial) {
    var layer = $('#balloons'); if (!layer) return;
    var b = document.createElement('div');
    b.className = 'balloon';
    var c = pick(BALLOON_COLORS), size = Math.round(rnd(62, 96));
    b.style.cssText = '--c:' + c + ';--s:' + size + 'px;left:' + rnd(2, 86) + '%;animation-duration:' + rnd(9, 15) +
      's;animation-delay:' + (initial ? -rnd(0, 12) : 0) + 's';
    b.innerHTML = '<span class="body"></span><span class="string"></span>';
    b.addEventListener('animationend', function (e) {
      if (e.target !== b) return;
      b.remove(); spawnBalloon(false);
    });
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); popBalloon(b); });
    layer.appendChild(b);
  }
  function popBalloon(b) {
    if (b._popped) return; b._popped = true;
    var r = b.querySelector('.body').getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var c = b.style.getPropertyValue('--c');
    b.remove();
    sfx.pop();
    burst(x, y, { count: 26, colors: [c, '#ffffff', '#FFC93C'], min: 2, max: 8 });
    var w = document.createElement('div');
    w.className = 'word'; w.textContent = pick(WORDS);
    w.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--c:' + c;
    document.body.appendChild(w);
    setTimeout(function () { w.remove(); }, 1000);
    popped++;
    var cnt = $('#count'); if (cnt) cnt.textContent = popped;
    if (popped === 10 && toastEl) {
      toastEl.classList.add('on');
      setTimeout(function () { toastEl.classList.remove('on'); }, 3500);
    }
    setTimeout(function () { spawnBalloon(false); }, 500);
  }
  function initHome() {
    if (!$('#balloons')) return;
    var n = Math.max(8, Math.min(14, Math.round(innerWidth / 70)));
    for (var i = 0; i < n; i++) spawnBalloon(true);
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.textContent = (C.index && C.index.toast) || '';
    document.body.appendChild(toastEl);
    setTimeout(function () { burst(innerWidth / 2, innerHeight * 0.3, { count: 70 }); }, 500);
  }

  /* ---------- PAGE 2: ORS ---------- */
  function bubbles(host) {
    var n = 0;
    var iv = setInterval(function () {
      var b = document.createElement('i');
      b.className = 'bub';
      var s = rnd(4, 10);
      b.style.cssText = 'left:' + rnd(10, 85) + '%;width:' + s + 'px;height:' + s + 'px;animation-duration:' + rnd(1, 2) + 's';
      host.appendChild(b);
      setTimeout(function () { b.remove(); }, 2200);
      if (++n > 28) clearInterval(iv);
    }, 120);
  }
  function initOrs() {
    var sachet = $('#sachet'); if (!sachet) return;
    var water = $('#water'), stream = $('#stream'), tap = $('#tap'),
        done = $('#done'), next = $('#next'), glass = $('.glass');
    var used = false;
    sachet.addEventListener('click', function () {
      if (used) return; used = true;
      tap.classList.add('hide');
      sachet.classList.add('pour');
      sfx.pour();
      setTimeout(function () { stream.classList.add('on'); water.style.height = '82%'; bubbles(glass); }, 500);
      setTimeout(function () { stream.classList.remove('on'); }, 2900);
      setTimeout(function () {
        var r = glass.getBoundingClientRect();
        glass.classList.add('full');
        burst(r.left + r.width / 2, r.top, {
          count: 40, colors: ['#6CC6FF', '#BFE9FF', '#FFC93C', '#FF7EB6'],
          shapes: ['circle', 'heart'], up: 6, max: 7
        });
        sfx.chime();
        done.classList.add('show');
        next.classList.add('show');
      }, 3200);
    });
  }

  /* ---------- PAGES 3 & 4: chocolate blast ---------- */
  function ring(x, y) {
    var r = document.createElement('div');
    r.className = 'ring';
    r.style.left = x + 'px'; r.style.top = y + 'px';
    r.addEventListener('animationend', function () { r.remove(); });
    document.body.appendChild(r);
  }
  function initShot() {
    var btn = $('#choco'); if (!btn) return;
    var card = $('#card'), next = $('#next'), hint = $('#tapHint'), stage = $('.stage');
    var done = false;
    btn.addEventListener('click', function () {
      if (done) return; done = true;
      var r = btn.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + 100;
      if (hint) hint.classList.add('hide');
      btn.classList.add('shake');
      sfx.tick();
      setTimeout(function () {
        btn.classList.remove('shake');
        btn.classList.add('gone');
        sfx.boom();
        stage.classList.add('boom');
        setTimeout(function () { stage.classList.remove('boom'); }, 450);
        burst(x, y, { count: 46, colors: ['#4A2A18', '#7B4A2D', '#a8693f', '#2b160b'], shapes: ['circle'], min: 3, max: 11, smin: 6, smax: 14, up: 2 });
        burst(x, y, { count: 55, power: 1.1 });
        ring(x, y);
        setTimeout(function () {
          card.classList.add('show');
          sfx.chime();
          burst(x, y - 40, { count: 24, colors: ['#FFC93C', '#ff7eb6'], shapes: ['heart', 'circle'], min: 2, max: 6, up: 5, gravity: 0.12 });
        }, 450);
        setTimeout(function () { next.classList.add('show'); }, 1300);
      }, 520);
    });
  }

  /* ---------- PAGE 5: finale ---------- */
  function prep(el, text) {
    el._c = Array.from(text);
    el.innerHTML = '<span class="t"></span><span class="r" style="visibility:hidden"></span>';
    el.querySelector('.r').textContent = text;   // invisible, just reserves the space
  }
  function typeInto(el, speed) {
    return new Promise(function (res) {
      var t = el.querySelector('.t'), r = el.querySelector('.r'), c = el._c, i = 0;
      if (!c.length) return res();
      var iv = setInterval(function () {
        i++;
        t.textContent = c.slice(0, i).join('');
        r.textContent = c.slice(i).join('');
        if (i % 4 === 0) sfx.soft();
        if (i >= c.length) { clearInterval(iv); res(); }
      }, speed);
    });
  }
  function initFinale() {
    var btn = $('#msgBtn'); if (!btn) return;
    var L = C.finale || {};
    startFalling(['🌻', '🌼', '🌻', '💛', '✨', '🌻'], 520);
    setTimeout(celebrate, 500);

    var ps = [['#l1', L.line1], ['#l2', L.line2], ['#l3', L.line3]].map(function (x) {
      var el = $(x[0]); prep(el, x[1] || ''); return el;
    });
    btn.addEventListener('click', function () {
      btn.classList.add('vanish');
      setTimeout(function () { btn.style.display = 'none'; }, 350);
      sfx.tada(); celebrate();
      var letter = $('#letter');
      letter.classList.add('show');
      (async function () {
        await wait(800);
        for (var i = 0; i < ps.length; i++) { await typeInto(ps[i], 45); await wait(450); }
        var r = letter.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, {
          count: 40, colors: ['#ff4f9a', '#ff8fb8', '#FFC93C'], shapes: ['heart'],
          min: 1, max: 6, up: 6, gravity: 0.05, smin: 12, smax: 22
        });
        sfx.chime();
        $('#again').classList.add('show');
      })();
    });
  }

  /* ---------- go ---------- */
  fillText();
  splitLetters();
  injectUI();
  makeField();
  initHome();
  initOrs();
  initShot();
  initFinale();
})();
