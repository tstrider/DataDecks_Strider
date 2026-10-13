/* DataDecks_Strider. Landing page. Plain JS, no build step.
   Slide images are real renders of real .pptx files. data.js holds what was read from those files. */
(function () {
  'use strict';

  var D = window.DD_DATA;
  if (!D) return;
  var V = '6';
  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]static=1/.test(location.search);
  var G = D.grid;
  var brand = 'northlight';
  if (reduce) root.classList.add('no-motion');

  function $(s, el) { return (el || doc).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function src(key) { return 'assets/slides/' + brand + '/' + key + '.webp?v=' + V; }
  function setSlide(img, key) { img.setAttribute('data-s', key); img.src = src(key); }
  function el(tag, cls, html) { var n = doc.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; }
  function press(btns, on) { btns.forEach(function (b) { var is = b === on; b.classList.toggle('is-on', is); b.setAttribute('aria-pressed', is ? 'true' : 'false'); }); }
  function pct(v) { return (v * 100).toFixed(3) + '%'; }
  function onSeen(node, ratio, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: ratio });
    io.observe(node);
  }

  // A slide image that fails to load gets three more tries.
  doc.addEventListener('error', function (e) {
    var im = e.target;
    if (!im || im.tagName !== 'IMG' || !im.getAttribute('data-s')) return;
    var n = +(im.getAttribute('data-try') || 0);
    if (n >= 3) return;
    im.setAttribute('data-try', n + 1);
    setTimeout(function () { im.src = src(im.getAttribute('data-s')) + '&r=' + (n + 1); }, 350 * (n + 1));
  }, true);

  var NAMES = {
    title: 'title', scorecard: 'scorecard', bridge: 'revenue bridge', lob: 'lines of business',
    table: 'variance table', divider: 'section divider', channels: 'channels', closing: 'closing'
  };

  /* ---------- 1. hero: the deck, and the handle ---------- */
  var track = $('#flow-track'), ui = $('#flow-ui'), line = $('#cmp-line'), pinsEl = $('#pins');
  var hudBar = $('#hud-bar'), fxN = $('#fx-n'), fxOf = $('#fx-of'), hudFix = $('#hud-fix');
  var ids = D.before;
  var flow = { c: 0, p: 1, w: 0, raf: 0, tw: 0, faults: [], pins: [], segs: [], n: -1 };

  var cards = ids.map(function (id, i) {
    var c = el('div', 'fs');
    var at = function (k) { return i ? 'data-late="1"' : 'src="' + src(k) + '"'; };
    c.innerHTML = '<img class="fs-before" data-s="b-' + id + '" ' + at('b-' + id) + ' width="1600" height="900" alt="" draggable="false">' +
      '<img class="fs-after" data-s="a-' + id + '" ' + at('a-' + id) + ' width="1600" height="900" alt="The ' + NAMES[id] + ' slide." draggable="false"' + (i ? '' : ' fetchpriority="high"') + '><i class="fs-dim"></i>';
    c.addEventListener('click', function () { if (i !== flow.c) flowGo(i); });
    track.appendChild(c);
    return { node: c, after: c.querySelector('.fs-after') };
  });

  function flowPlace() {
    var n = cards.length;
    cards.forEach(function (c, i) {
      var pos = ((i - flow.c + n + 2) % n) - 2;
      var prev = c.node.hasAttribute('data-pos') ? +c.node.getAttribute('data-pos') : pos;
      if (Math.abs(pos - prev) > 2) {
        c.node.classList.add('is-jump');
        requestAnimationFrame(function () { requestAnimationFrame(function () { c.node.classList.remove('is-jump'); }); });
      }
      c.node.setAttribute('data-pos', pos);
      c.node.classList.toggle('is-center', pos === 0);
      c.node.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
    });
  }
  function cmpDraw() {
    flow.raf = 0;
    cards[flow.c].after.style.clipPath = 'inset(0 ' + ((1 - flow.p) * 100).toFixed(2) + '% 0 0)';
    line.style.transform = 'translate3d(' + (flow.p * flow.w).toFixed(1) + 'px,0,0)';
    cmpCount();
  }
  function cmpSet(v) {
    flow.p = Math.max(0, Math.min(1, v));
    if (!flow.raf) flow.raf = requestAnimationFrame(cmpDraw);
  }
  function cmpCount() {
    var n = 0, total = flow.faults.length, x = flow.p * G.w, last = null;
    for (var i = 0; i < total; i++) {
      var f = flow.faults[i], fixed = f.x < x;
      if (fixed) { n++; last = f; }
      if (f.fixed !== fixed) { f.fixed = fixed; flow.pins[i].classList.toggle('is-fixed', fixed); flow.segs[i].classList.toggle('is-on', fixed); }
    }
    if (n === flow.n) return;
    flow.n = n;
    fxN.textContent = n;
    fxOf.textContent = 'of ' + total + ' faults fixed';
    hudFix.innerHTML = !last ? 'Drag the handle across the slide.' : n === total ? 'Drag the handle left to see what it fixed.' : '<s>' + esc(last.name) + '</s> &rarr; <b>' + esc(last.fix) + '</b>';
    line.setAttribute('aria-valuenow', Math.round(flow.p * 100));
    line.setAttribute('aria-valuetext', n + ' of ' + total + ' faults fixed');
  }
  function cmpBuild() {
    var id = ids[flow.c];
    flow.faults = D.faults[id].slice().sort(function (a, b) { return a.x - b.x; }).map(function (f) { return { x: f.x, y: f.y, name: f.name, fix: f.fix, fixed: null }; });
    pinsEl.textContent = ''; hudBar.textContent = '';
    flow.pins = []; flow.segs = []; flow.n = -1;
    flow.faults.forEach(function (f, i) {
      var px = f.x / G.w, py = f.y / G.h;
      var pin = el('button', 'pin' + (px < 0.2 ? ' pin--l' : px > 0.72 ? ' pin--r' : '') + (py < 0.18 ? ' pin--t' : ''), (i + 1) + '<span class="pin-tip">' + esc(f.name) + '</span>');
      pin.type = 'button';
      pin.style.left = pct(px); pin.style.top = pct(py);
      pin.setAttribute('aria-label', 'Fault ' + (i + 1) + ': ' + f.name + '. ' + f.fix);
      pinsEl.appendChild(pin); flow.pins.push(pin);
      var seg = el('i'); hudBar.appendChild(seg); flow.segs.push(seg);
    });
  }
  function tweenStop() { if (flow.tw) { cancelAnimationFrame(flow.tw); flow.tw = 0; } }
  function tweenTo(to, dur, delay) {
    tweenStop();
    if (reduce) { cmpSet(to); return; }
    var t0 = 0, from = flow.p;
    function step(t) {
      if (!t0) t0 = t + (delay || 0);
      var k = Math.max(0, Math.min(1, (t - t0) / dur));
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cmpSet(from + (to - from) * e);
      flow.tw = k < 1 ? requestAnimationFrame(step) : 0;
    }
    flow.tw = requestAnimationFrame(step);
  }
  function flowGo(i) {
    var n = cards.length;
    i = (i + n) % n;
    if (i === flow.c) return;
    tweenStop();
    cards[flow.c].after.style.clipPath = '';
    flow.c = i;
    flowPlace(); cmpBuild();
    flow.p = 1; cmpDraw();
  }

  new ResizeObserver(function (es) { flow.w = es[0].contentRect.width; cmpDraw(); }).observe(ui);

  var drag = null;
  ui.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest('.pin')) return;
    tweenStop();
    var r = ui.getBoundingClientRect();
    drag = { id: e.pointerId, left: r.left, w: r.width };
    try { ui.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    ui.classList.add('is-drag', 'is-used');
    if (e.pointerType !== 'touch') cmpSet((e.clientX - drag.left) / drag.w);
  });
  ui.addEventListener('pointermove', function (e) { if (drag && e.pointerId === drag.id) cmpSet((e.clientX - drag.left) / drag.w); });
  function endDrag(e) { if (!drag || (e && e.pointerId !== drag.id)) return; drag = null; ui.classList.remove('is-drag'); }
  ui.addEventListener('pointerup', endDrag);
  ui.addEventListener('pointercancel', endDrag);
  line.addEventListener('keydown', function (e) {
    var d = { ArrowLeft: -0.02, ArrowRight: 0.02, ArrowDown: -0.02, ArrowUp: 0.02, PageDown: -0.1, PageUp: 0.1 }[e.key];
    if (e.key === 'Home') d = -1; else if (e.key === 'End') d = 1;
    if (d === undefined) return;
    e.preventDefault(); tweenStop(); ui.classList.add('is-used'); cmpSet(flow.p + d);
  });
  $('#flow-prev').addEventListener('click', function () { flowGo(flow.c - 1); });
  $('#flow-next').addEventListener('click', function () { flowGo(flow.c + 1); });

  function loadLate() { $$('img[data-late]').forEach(function (im) { im.removeAttribute('data-late'); im.src = src(im.getAttribute('data-s')); }); }
  if (doc.readyState === 'complete') loadLate(); else window.addEventListener('load', loadLate, { once: true });
  flowPlace(); cmpBuild(); cmpDraw();
  /* ---------- 2. the grid, seen through a lens ---------- */
  var lens = $('#lens'), lensBp = $('#lens-bp'), lensImg = $('#lens-img'), lensRing = $('#lens-ring'), lensN = $('#lens-n'), lensOf = $('#lens-of');
  var LZ = { w: 0, h: 0, r: 0, x: 0.3, y: 0.46, raf: 0, auto: !reduce, seen: false, loop: 0, tw: 0, mode: 'after' };
  var LENS_ID = 'scorecard';
  function lensDraw() {
    LZ.raf = 0;
    var px = LZ.x * LZ.w, py = LZ.y * LZ.h;
    lens.style.setProperty('--lx', px.toFixed(1) + 'px');
    lens.style.setProperty('--ly', py.toFixed(1) + 'px');
    lens.style.setProperty('--lr', LZ.r.toFixed(1) + 'px');
    lensRing.style.transform = 'translate3d(' + (px - LZ.r).toFixed(1) + 'px,' + (py - LZ.r).toFixed(1) + 'px,0)';
  }
  function lensSet(x, y) {
    LZ.x = Math.max(0, Math.min(1, x)); LZ.y = Math.max(0, Math.min(1, y));
    if (!LZ.raf) LZ.raf = requestAnimationFrame(lensDraw);
  }
  function lensRender() {
    var all = D.geo[LZ.mode][LENS_ID].filter(function (e) { return e.k !== 'page'; });
    setSlide(lensImg, (LZ.mode === 'after' ? 'a-' : 'b-') + LENS_ID);
    lensImg.alt = 'The scorecard slide ' + (LZ.mode === 'after' ? 'built with the skill' : 'built without the skill') + '. A round lens shows the grid columns and the outline of every box.';
    lensBp.textContent = '';
    for (var i = 0; i < G.cols; i++) {
      var c = el('i', 'col');
      c.style.left = pct((G.margin + i * (G.colW + G.gutter)) / G.w); c.style.width = pct(G.colW / G.w);
      lensBp.appendChild(c);
    }
    var m = el('i', 'mar');
    m.style.left = m.style.right = pct(G.margin / G.w); m.style.top = m.style.bottom = pct(G.margin / G.h);
    lensBp.appendChild(m);
    var off = 0, n = 0;
    all.forEach(function (e) {
      var bad = !e.inside && Math.abs(e.off) > 0.006;
      if (!e.inside) { n++; if (bad) off++; }
      var b = el('i', 'wb' + (e.inside ? ' is-in' : '') + (bad ? ' is-off' : '') + (e.h < 0.45 ? ' is-thin' : ''));
      b.style.left = pct((e.x + e.ml) / G.w); b.style.top = pct(e.y / G.h);
      b.style.width = pct(Math.max(e.w - e.ml - e.mr, 0.04) / G.w); b.style.height = pct(Math.max(e.h, 0.05) / G.h);
      if (!e.inside && e.h >= 0.16 && e.w > 1.2) b.appendChild(el('span', 'wl', bad ? (e.off > 0 ? '+' : '−') + Math.abs(e.off).toFixed(2) + ' in off' : 'x ' + (e.x + e.ml).toFixed(2) + ' in'));
      lensBp.appendChild(b);
    });
    lensN.textContent = off;
    lensOf.textContent = 'of ' + n + ' left edges off the grid';
    lensN.parentNode.classList.toggle('is-bad', off > 0);
  }
  function lensTo(x, y) {
    if (LZ.tw) cancelAnimationFrame(LZ.tw);
    if (reduce) { lensSet(x, y); return; }
    var x0 = LZ.x, y0 = LZ.y, t0 = 0;
    (function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 320), e = 1 - Math.pow(1 - k, 3);
      lensSet(x0 + (x - x0) * e, y0 + (y - y0) * e);
      LZ.tw = k < 1 ? requestAnimationFrame(step) : 0;
    })(performance.now());
  }
  function lensStopAuto() { LZ.auto = false; if (LZ.loop) { cancelAnimationFrame(LZ.loop); LZ.loop = 0; } }
  function lensLoop(t) {
    if (!LZ.auto || !LZ.seen) { LZ.loop = 0; return; }
    lensSet(0.5 + 0.3 * Math.sin(t / 2600), 0.5 + 0.2 * Math.sin(t / 1900 + 1));
    LZ.loop = requestAnimationFrame(lensLoop);
  }
  new ResizeObserver(function () { LZ.w = lens.clientWidth; LZ.h = lens.clientHeight; LZ.r = lensRing.offsetWidth / 2; lensDraw(); }).observe(lens);
  lens.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    lensStopAuto();
    var r = lens.getBoundingClientRect();
    lensSet((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  lens.addEventListener('click', function (e) {
    lensStopAuto();
    var r = lens.getBoundingClientRect();
    lensTo((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  if ('IntersectionObserver' in window && !reduce) {
    new IntersectionObserver(function (es) {
      LZ.seen = es[0].isIntersecting;
      if (LZ.seen && LZ.auto && !LZ.loop) LZ.loop = requestAnimationFrame(lensLoop);
    }, { threshold: 0.3 }).observe(lens);
  }
  var lensBtns = $$('#lens-seg [data-mode]');
  lensBtns.forEach(function (b) { b.addEventListener('click', function () { LZ.mode = b.getAttribute('data-mode'); press(lensBtns, b); lensRender(); }); });
  lensRender();

  /* ---------- 3. axis ---------- */
  var T = { prior: 7.3, plan: 8.0, actual: 8.4, max: 10 };
  var AX = {
    bar: { keys: D.floors.map(function (f, i) { return 'x' + i; }), ticks: D.floors.map(function (f) { return f < 0 ? '−' + (-f) : String(f); }), skill: D.floors.indexOf(0), start: D.floors.indexOf(0) },
    fall: { keys: ['x-bridge-zero', 'a-bridge'], ticks: ['From zero', 'Close to the data'], skill: 1, start: 1 }
  };
  var axHost = $('#ax-frames'), axRange = $('#ax-range'), axTicks = $('#ax-ticks'), axSay = $('.ax-say'), axN = $('#ax-n'), axL = $('#ax-l');
  var axMode = 'bar', axImgs = {};
  Object.keys(AX).forEach(function (m) {
    axImgs[m] = AX[m].keys.map(function (k) {
      var im = el('img'); im.width = 1400; im.height = 788; im.loading = 'lazy'; im.alt = '';
      setSlide(im, k); axHost.appendChild(im); return im;
    });
  });
  function axSet() {
    var i = +axRange.value, A = AX[axMode], n, l, ok = false;
    Object.keys(axImgs).forEach(function (m) { axImgs[m].forEach(function (im, j) { im.classList.toggle('is-on', m === axMode && j === i); }); });
    $$('span', axTicks).forEach(function (t, j) { t.classList.toggle('is-on', j === i); });
    if (axMode === 'bar') {
      var f = D.floors[i];
      if (f < 0) { n = Math.round(-f / (T.max - f) * 100) + '%'; l = 'of the chart is empty space below zero.'; }
      else if (f === 0) { n = '5%'; l = 'taller than plan. The true gap. The skill builds this axis.'; ok = true; }
      else { n = Math.round(((T.actual - f) / (T.plan - f) - 1) * 100) + '%'; l = 'taller than plan on screen. The true gap is 5%.'; }
      axImgs.bar[i].alt = 'A bar chart of prior year 7.3, plan 8.0 and actual 8.4, with the axis starting at ' + f + '.';
      axRange.setAttribute('aria-valuetext', 'Axis starts at ' + f);
    } else {
      ok = i === 1;
      n = ok ? '53%' : '12%';
      l = 'of the axis shows the four changes.' + (ok ? ' The skill builds this axis.' : '');
      axImgs.fall[i].alt = 'A waterfall chart from 7.8 to 8.4 with the axis ' + (ok ? 'starting close to the data.' : 'starting at zero.');
      axRange.setAttribute('aria-valuetext', A.ticks[i]);
    }
    axN.textContent = n; axL.textContent = l; axSay.classList.toggle('is-ok', ok);
  }
  function axBuild(mode) {
    axMode = mode;
    var A = AX[mode];
    axRange.max = A.keys.length - 1; axRange.value = A.start;
    axTicks.textContent = '';
    axTicks.classList.toggle('is-ends', mode === 'fall');
    A.ticks.forEach(function (t, j) { axTicks.appendChild(el('span', '', esc(t) + (j === A.skill ? '<em>The skill</em>' : ''))); });
    axSet();
  }
  axRange.addEventListener('input', axSet);
  var axBtns = $$('#ax-mode [data-ax]');
  axBtns.forEach(function (b) { b.addEventListener('click', function () { press(axBtns, b); axBuild(b.getAttribute('data-ax')); }); });
  axBuild('bar');

  /* ---------- 4. storyboard, build, check ---------- */
  var SB = [
    { id: 'title', purpose: 'Open on the result', headline: 'September closed ahead of plan', content: 'Two new accounts lifted net revenue to $8.4M.', layout: 'title', visual: 'One stat card', aesthetic: 'Dark background. "ahead of plan" in the accent.', data: 'Net revenue 8.4 against plan 8.0.' },
    { id: 'scorecard', purpose: 'The month in four numbers', headline: 'Net revenue beat plan by 5% and margin held', content: 'Net revenue, gross margin, EBITDA, operating cost. Three notes.', layout: 'KPI scorecard', visual: 'Four stat cards and a trend line', aesthetic: 'Light background. Cost variance in the negative color.', data: 'Monthly net revenue: 7.1, 7.3, 7.4, 7.6, 7.8, 8.4.' },
    { id: 'bridge', purpose: 'What moved revenue', headline: 'Two new accounts more than covered churn', content: '+$0.6M from August. Three notes on the drivers.', layout: 'chart-led: chart in 8 columns, notes in 4', visual: 'Waterfall from $7.8M to $8.4M', aesthetic: 'Light background. Gains and losses colored by sign.', data: '7.8 + 0.9 + 0.3 - 0.4 - 0.2 = 8.4' },
    { id: 'lob', purpose: 'Which lines carried it', headline: 'Paid media carried the beat while analytics fell short', content: 'Actual, plan, and prior year for four lines.', layout: 'chart-led: chart at full width', visual: 'Clustered columns, one legend', aesthetic: 'Light background. Actual leads. Prior year stays neutral.', data: 'Actual 3.6, 2.1, 1.5, 1.2. Plan 3.2, 2.0, 1.7, 1.1.' },
    { id: 'table', purpose: 'The variance, line by line', headline: 'Analytics is the only line behind plan', content: 'Two analysts left in July and were not replaced.', layout: 'table', visual: 'Variance table with a total row', aesthetic: 'Light background. Variance colored by sign.', data: 'Total: 8.4 against 8.0, +0.4, +5.0%.' },
    { id: 'divider', purpose: 'Turn to marketing', headline: 'Where the marketing dollars worked', content: 'Paid media spend in September: $1.15M.', layout: 'section divider', visual: 'One stat card', aesthetic: 'Dark background.', data: '0.42 + 0.31 + 0.18 + 0.24 = 1.15' },
    { id: 'channels', purpose: 'Return by channel', headline: 'Search returned the most for every dollar spent', content: '4.2x on search. Display is below break-even.', layout: 'chart-led: chart in 7 columns, notes in 5', visual: 'Bars sorted by return', aesthetic: 'Light background. The accent on one bar.', data: 'Return on ad spend: 4.2, 3.1, 2.4, 0.9.' },
    { id: 'closing', purpose: 'The ask', headline: 'Approve two analytics hires to get back to plan', content: 'Three facts and a decision date.', layout: 'closing', visual: 'Three stat cards', aesthetic: 'Dark background. The ask in the accent.', data: 'Analytics 1.5 against plan 1.7.' }
  ];
  var FIELDS = [['headline', 'Headline'], ['content', 'Content'], ['layout', 'Layout'], ['visual', 'Visual'], ['aesthetic', 'Aesthetic'], ['data', 'Data note']];
  var CHECKS = {
    title: ['Checked', 'net revenue 8.4 against plan 8.0 is +5.0%'],
    scorecard: ['Checked', 'the trend ends on the scorecard figure, 8.4'],
    bridge: ['Ties out', '7.8 + 0.9 + 0.3 - 0.4 - 0.2 = 8.4'],
    lob: ['Ties out', 'actual 3.6 + 2.1 + 1.5 + 1.2 = 8.4'],
    table: ['Ties out', '8.4 - 8.0 = +0.4, which is +5.0% of plan'],
    divider: ['Ties out', '0.42 + 0.31 + 0.18 + 0.24 = 1.15'],
    channels: ['Checked', 'bars sorted by value: 4.2, 3.1, 2.4, 0.9'],
    closing: ['Checked', 'analytics 1.5 against plan 1.7 is -0.2']
  };
  var DARK = { title: 1, divider: 1, closing: 1 };
  var stSlide = $('#st-slide'), stImg = $('#st-img'), stPieces = $('#st-pieces'), stHl = $('#st-hl'), stRows = $('#st-rows'), stFile = $('#st-file'), stCheck = $('#st-check'), stNav = $('#st-nav');
  var stPh = $$('#st-phases li'), st = { i: 2, timers: [], groups: {}, rows: [], thumbs: [] };

  function stGroup(e) {
    if (e.k === 'label' || e.k === 'title') return 'headline';
    if (e.k === 'chart' || e.k === 'table' || e.k === 'shape') return 'visual';
    if (e.k === 'source' || e.k === 'page') return 'data';
    return 'content';
  }
  function stBoxes(id, field) {
    if (field === 'aesthetic') return [{ x: 0.1, y: 0.1, w: G.w - 0.2, h: G.h - 0.2 }];
    var all = D.geo.after[id].filter(function (e) { return !e.inside; });
    var pick = field === 'layout' ? all.filter(function (e) { return e.k !== 'source' && e.k !== 'page'; })
      : all.filter(function (e) { return stGroup(e) === field && e.k !== 'page'; });
    if (!pick.length && field === 'data') pick = all.filter(function (e) { return stGroup(e) === 'visual'; });
    return pick.map(function (e) { return { x: e.x - 0.07, y: e.y - 0.07, w: e.w + 0.14, h: e.h + 0.14 }; });
  }
  function stShow(field) {
    stHl.textContent = '';
    if (!field) return;
    stBoxes(SB[st.i].id, field).forEach(function (b) {
      var i = el('i');
      i.style.left = pct(b.x / G.w); i.style.top = pct(b.y / G.h); i.style.width = pct(b.w / G.w); i.style.height = pct(b.h / G.h);
      stHl.appendChild(i);
    });
  }
  function stPhase(n) { stPh.forEach(function (li, j) { li.classList.toggle('is-on', j <= n); }); }
  function stRender() {
    var s = SB[st.i], url = src('a-' + s.id);
    stFile.innerHTML = 'Slide ' + (st.i + 1) + ' of ' + SB.length + ' &middot; <b>' + esc(s.purpose) + '</b>';
    stRows.textContent = ''; st.rows = [];
    FIELDS.forEach(function (f) {
      var row = el('button', 'st-row', '<span>' + f[1] + '</span><span>' + esc(s[f[0]]) + '</span>');
      row.type = 'button';
      var on = function () { st.rows.forEach(function (r) { r.classList.remove('is-hot'); }); row.classList.add('is-hot'); stShow(f[0]); };
      var off = function () { row.classList.remove('is-hot'); stShow(); };
      row.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') on(); });
      row.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') off(); });
      row.addEventListener('focus', on); row.addEventListener('blur', off); row.addEventListener('click', on);
      stRows.appendChild(row); st.rows.push(row);
    });
    stSlide.style.background = DARK[s.id] ? 'var(--dark)' : 'var(--light)';
    setSlide(stImg, 'a-' + s.id);
    stImg.alt = 'Slide ' + (st.i + 1) + ': ' + s.headline + '.';
    stPieces.textContent = ''; st.groups = { headline: [], visual: [], content: [], data: [] };
    D.geo.after[s.id].forEach(function (e) {
      if (e.inside) return;
      var pad = 0.16, x = Math.max(0, e.x - pad), y = Math.max(0, e.y - pad);
      var w = Math.min(G.w - x, e.w + 2 * pad), h = Math.min(G.h - y, e.h + 2 * pad), wf = w / G.w, hf = h / G.h;
      var p = el('i', 'st-piece');
      p.style.left = pct(x / G.w); p.style.top = pct(y / G.h); p.style.width = pct(wf); p.style.height = pct(hf);
      p.style.backgroundImage = 'url("' + url + '")';
      p.style.backgroundSize = (100 / wf).toFixed(2) + '% ' + (100 / hf).toFixed(2) + '%';
      p.style.backgroundPosition = (wf > 0.999 ? 0 : (x / G.w) / (1 - wf) * 100).toFixed(2) + '% ' + (hf > 0.999 ? 0 : (y / G.h) / (1 - hf) * 100).toFixed(2) + '%';
      stPieces.appendChild(p); st.groups[stGroup(e)].push(p);
    });
    stCheck.innerHTML = '<span><b>' + CHECKS[s.id][0] + ':</b> ' + esc(CHECKS[s.id][1]) + '</span>';
    st.thumbs.forEach(function (t, j) { t.classList.toggle('is-on', j === st.i); t.setAttribute('aria-selected', j === st.i ? 'true' : 'false'); });
    stShow();
  }
  function stPlay(i, instant) {
    st.timers.forEach(clearTimeout); st.timers = [];
    st.i = i;
    stSlide.classList.remove('is-built', 'is-scan'); stCheck.classList.remove('is-in');
    stRender();
    var at = function (ms, fn) { st.timers.push(setTimeout(fn, ms)); };
    var allIn = function () { Object.keys(st.groups).forEach(function (g) { st.groups[g].forEach(function (p) { p.classList.add('is-in'); }); }); };
    if (instant || reduce) {
      st.rows.forEach(function (r) { r.classList.add('is-in'); });
      allIn(); stSlide.classList.add('is-built'); stCheck.classList.add('is-in'); stPhase(2);
      return;
    }
    stPhase(0);
    st.rows.forEach(function (r, j) { at(120 + j * 190, function () { r.classList.add('is-in'); }); });
    var t1 = 120 + st.rows.length * 190 + 260;
    at(t1, function () { stPhase(1); });
    ['headline', 'visual', 'content', 'data'].forEach(function (g, j) {
      st.groups[g].forEach(function (p, k) { at(t1 + 120 + j * 300 + k * 70, function () { p.classList.add('is-in'); }); });
    });
    var t2 = t1 + 120 + 4 * 300 + 500;
    at(t2 - 200, function () { stSlide.classList.add('is-built'); });
    at(t2 + 150, function () { stPhase(2); stSlide.classList.add('is-scan'); });
    at(t2 + 1150, function () { stCheck.classList.add('is-in'); stSlide.classList.remove('is-scan'); });
  }
  SB.forEach(function (s, i) {
    var t = el('button', 'st-t', '<img data-s="t-' + s.id + '" src="' + src('t-' + s.id) + '" width="400" height="225" alt="" loading="lazy">');
    t.type = 'button'; t.setAttribute('role', 'tab'); t.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + s.headline);
    t.addEventListener('click', function () { stPlay(i); });
    stNav.appendChild(t); st.thumbs.push(t);
  });
  stPlay(2, true);
  if (!reduce) onSeen($('#st'), 0.3, function () { stPlay(st.i); });

  /* ---------- 5. brand: the deck laid flat ---------- */
  var brPick = $('#br-pick'), brBtns = {}, bentoEl = $('#bento');
  var BRAND_FILE = { northlight: 'assets/example-brand.json', kelpline: 'kelpline.json', plumwick: 'plumwick.json' };
  var bento = { main: 1, cells: [], tile: null };
  (function build() {
    for (var i = 0; i < D.after.length; i++) {
      var c = el(i ? 'button' : 'div', 'bc' + (i ? '' : ' bc--main'), '<img width="1600" height="900" alt="" loading="lazy">');
      if (i) c.type = 'button';
      (function (cell, slot) { if (slot) cell.addEventListener('click', function () { bento.main = +cell.getAttribute('data-i'); bentoRender(); }); })(c, i);
      bentoEl.appendChild(c); bento.cells.push(c);
    }
    bento.tile = el('div', 'b-tile'); bentoEl.appendChild(bento.tile);
  })();
  function bentoOrder() { var o = [bento.main]; D.after.forEach(function (id, i) { if (i !== bento.main) o.push(i); }); return o; }
  function bentoTile() {
    var B = D.brands[brand], R = B.roles;
    bento.tile.innerHTML = '<p>' + BRAND_FILE[brand] + '</p><b>' + esc(B.name.replace(' (example)', '')) + '</b>' +
      '<span class="b-sw">' + [R.darkBackground, R.positive, R.accent, R.negative, R.neutral].map(function (c) { return '<i style="background:#' + c + '"></i>'; }).join('') + '</span>' +
      '<p>' + esc(B.display) + '</p>';
  }
  function bentoRender() {
    bentoOrder().forEach(function (idx, slot) {
      var c = bento.cells[slot], id = D.after[idx], im = c.querySelector('img');
      c.setAttribute('data-i', idx);
      c.classList.toggle('bc--dark', !!DARK[id]);
      im.src = src('a-' + id);
      im.alt = 'Slide ' + (idx + 1) + ': ' + SB[idx].headline + '.';
      if (slot) c.setAttribute('aria-label', 'Show slide ' + (idx + 1) + ' large');
    });
    bentoTile();
  }
  function bentoWipe() {
    bentoTile();
    bento.cells.forEach(function (c, slot) {
      var id = D.after[+c.getAttribute('data-i')], url = src('a-' + id), old = c.querySelector('img');
      if (reduce) { old.src = url; return; }
      $$('img.is-new', c).forEach(function (n) { n.remove(); });
      var im = el('img', 'is-new'); im.width = 1600; im.height = 900; im.alt = old.alt;
      im.addEventListener('load', function () {
        setTimeout(function () {
          im.classList.add('is-wipe');
          setTimeout(function () { $$('img', c).forEach(function (n) { if (n !== im) n.remove(); }); im.className = ''; }, 800);
        }, 40 + slot * 70);
      }, { once: true });
      c.appendChild(im); im.src = url;
    });
  }
  function applyBrand(b) {
    var R = D.brands[b].roles, s = root.style;
    brand = b;
    s.setProperty('--dark', '#' + R.darkBackground);
    s.setProperty('--dark-alt', '#' + R.darkBackgroundAlt);
    s.setProperty('--light', '#' + R.lightBackground);
    s.setProperty('--ink', '#' + R.textOnLight);
    s.setProperty('--accent', '#' + R.accent);
    s.setProperty('--accent-2', '#' + R.accentAlt);
    s.setProperty('--pos', '#' + R.positive);
    s.setProperty('--neg', '#' + R.negative);
    s.setProperty('--neutral', '#' + R.neutral);
    s.setProperty('--line', '#' + R.gridline);
    s.setProperty('--muted', '#' + R.axisLabel);
    s.setProperty('--display', /arial/i.test(D.brands[b].display) ? '"Helvetica Neue", Helvetica, Arial, sans-serif' : 'Cambria, Georgia, "Times New Roman", serif');
    $$('img[data-s]').forEach(function (im) { if (!im.hasAttribute('data-late')) im.src = src(im.getAttribute('data-s')); });
    bentoWipe();
    stPlay(st.i, true);
    Object.keys(brBtns).forEach(function (k) { brBtns[k].classList.toggle('is-on', k === b); brBtns[k].setAttribute('aria-pressed', k === b ? 'true' : 'false'); });
  }
  Object.keys(D.brands).forEach(function (b) {
    var R = D.brands[b].roles;
    var sw = [R.darkBackground, R.positive, R.accent, R.negative].map(function (c) { return '<i style="background:#' + c + '"></i>'; }).join('');
    var btn = el('button', 'br-b' + (b === brand ? ' is-on' : ''), '<span class="br-sw" aria-hidden="true">' + sw + '</span><span>' + esc(D.brands[b].name.replace(' (example)', '')) + '</span>');
    btn.type = 'button'; btn.setAttribute('aria-pressed', b === brand ? 'true' : 'false');
    btn.addEventListener('click', function () { if (brand !== b) applyBrand(b); });
    brPick.appendChild(btn); brBtns[b] = btn;
  });
  bentoRender();

  /* ---------- 6. install ---------- */
  // A download button starts the download, then shows the steps for what to do with the file.
  $$('a.dl').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.closest('#install')) return;
      setTimeout(function () { $('#install').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 500);
    });
  });
  var copy = $('#copy');
  copy.addEventListener('click', function () {
    var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy'; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText($('#install-code').textContent).then(done, function () {});
  });
})();
