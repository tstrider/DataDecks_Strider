/*
 * grid.js: the DataDecks layout engine for pptxgenjs.
 *
 * Usage:
 *   const pptxgen = require("pptxgenjs");
 *   const { makeGrid } = require("./assets/grid.js");
 *   const pres = new pptxgen();
 *   const g = makeGrid(pres, require("./assets/example-brand.json"));
 *   const s = g.slide("light");
 *   let y = g.stack(s, [
 *     { type: "label", text: "Month-end" },
 *     { type: "title", text: "Net revenue beat plan by 11%" },
 *     { type: "body",  text: "Two new wins and one key account carried the month." },
 *   ]);
 *   g.table(s, rows, { y });
 *
 * Every helper places elements on one 12-column grid on a 13.333 x 7.5 in
 * slide, reads colors by role from the brand profile, and returns the next
 * free y (in inches) so the caller never hardcodes a y under wrapping text.
 *
 * Columns are 1-based: g.col(1, 12) is the full content width,
 * g.col(1, 6) and g.col(7, 6) are the two halves.
 */

"use strict";

const path = require("path");

// ---------- slide geometry (inches) ----------
const W = 13.333;
const H = 7.5;
const MARGIN = 0.6; // outer margin on all four sides, never below 0.5
const COLS = 12;
const GUTTER = 0.25;
const CONTENT_W = W - 2 * MARGIN;
const COL_W = (CONTENT_W - (COLS - 1) * GUTTER) / COLS;
const TOP = MARGIN;
const BOTTOM = H - MARGIN;

// ---------- type scale (points) ----------
const TYPE = {
  display: 44, // title and closing slides
  title: 30, // slide headline
  subtitle: 20,
  body: 16,
  small: 12,
  label: 11, // small all-caps section label
  caption: 10, // source lines, footnotes
  stat: 54, // big number in a stat callout
};

// ---------- vertical spacing sizes (inches) ----------
const GAP = {
  tight: 0.12, // label to headline, number to its label
  block: 0.3, // headline to body, body to chart
  section: 0.55, // between unrelated groups
};

const LINE = 1.2; // rendered height of one line, as a multiple of font size (single spacing)

// Arial advance widths (share of one em). Used to estimate wrapping.
const ARIAL = {
  " ": 0.278, " ": 0.278, "!": 0.278, '"': 0.355, "#": 0.556, "$": 0.556, "%": 0.889,
  "&": 0.667, "'": 0.191, "(": 0.333, ")": 0.333, "*": 0.389, "+": 0.584, ",": 0.278,
  "-": 0.333, ".": 0.278, "/": 0.278, ":": 0.278, ";": 0.278, "<": 0.584, "=": 0.584,
  ">": 0.584, "?": 0.556, "@": 1.015, "[": 0.278, "]": 0.278, "_": 0.556, "|": 0.26,
  a: 0.556, b: 0.556, c: 0.5, d: 0.556, e: 0.556, f: 0.278, g: 0.556, h: 0.556,
  i: 0.222, j: 0.222, k: 0.5, l: 0.222, m: 0.833, n: 0.556, o: 0.556, p: 0.556,
  q: 0.556, r: 0.333, s: 0.5, t: 0.278, u: 0.556, v: 0.5, w: 0.722, x: 0.5,
  y: 0.5, z: 0.5,
  A: 0.667, B: 0.667, C: 0.722, D: 0.722, E: 0.667, F: 0.611, G: 0.778, H: 0.722,
  I: 0.278, J: 0.5, K: 0.667, L: 0.556, M: 0.833, N: 0.722, O: 0.778, P: 0.667,
  Q: 0.778, R: 0.722, S: 0.667, T: 0.611, U: 0.722, V: 0.667, W: 0.944, X: 0.667,
  Y: 0.667, Z: 0.611,
};
const DIGIT = 0.556;

// Fallbacks for optional roles a brand profile may leave out.
const ROLE_FALLBACK = {
  darkBackgroundAlt: "darkBackground",
  lightBackgroundAlt: "FFFFFF",
  bodyOnLight: "textOnLight",
  bodyOnDark: "textOnDark",
  accentAlt: "accent",
  neutral: "9AA6C2",
  gridline: "D9E0EC",
  axisLabel: "6B7391",
};

const REQUIRED_ROLES = [
  "darkBackground", "lightBackground", "textOnDark", "textOnLight",
  "accent", "dataSeries", "positive", "negative",
];

function makeGrid(pres, brand) {
  if (!pres) throw new Error("makeGrid(pres, brand): pass the pptxgenjs presentation first.");
  if (brand === undefined) brand = path.join(__dirname, "example-brand.json");
  if (typeof brand === "string") brand = require(path.resolve(brand));

  const roles = brand.roles || {};
  const colors = brand.colors || {};
  const missing = REQUIRED_ROLES.filter((r) => roles[r] === undefined);
  if (missing.length) {
    throw new Error(
      "Brand profile is missing roles: " + missing.join(", ") +
      ". Copy the shape of assets/example-brand.json."
    );
  }

  // Wide layout must be set before any slide is added.
  pres.layout = "LAYOUT_WIDE";

  const typo = brand.typography || {};
  const fonts = {
    display: typo.displayFont || "Arial",
    body: typo.bodyFont || typo.displayFont || "Arial",
  };
  const displayBold = (typo.displayWeight || "bold") === "bold";
  // Non-Arial brand fonts may substitute at render time; leave width slack.
  const slack = (f) => (/^arial$/i.test(f) ? 1.0 : 1.1);
  pres.theme = { headFontFace: fonts.display, bodyFontFace: fonts.body };

  // ---------- color ----------
  function hx(role, seen) {
    if (role === undefined || role === null) throw new Error("g.hx(): no role given.");
    let v = String(role).replace(/^#/, "");
    if (/^[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
    seen = seen || [];
    if (seen.includes(v)) throw new Error("g.hx(): role loop at " + v);
    if (roles[v] !== undefined && v !== "dataSeries") return hx(roles[v], seen.concat(v));
    if (colors[v] !== undefined) return hx(colors[v], seen.concat(v));
    if (ROLE_FALLBACK[v] !== undefined) return hx(ROLE_FALLBACK[v], seen.concat(v));
    throw new Error(
      'g.hx("' + role + '"): not a role, a brand color name, or a 6-digit hex. Roles: ' +
      Object.keys(roles).filter((k) => k !== "comment").join(", ")
    );
  }
  const series = () => [].concat(roles.dataSeries).map((c) => hx(c));

  function tone(slide) {
    return (slide && slide.__ddTone) || "light";
  }
  function ink(slide) {
    return tone(slide) === "dark" ? hx("textOnDark") : hx("textOnLight");
  }
  function bodyInk(slide) {
    return tone(slide) === "dark" ? hx("bodyOnDark") : hx("bodyOnLight");
  }
  function muted(slide) {
    return tone(slide) === "dark" ? hx("neutral") : hx("axisLabel");
  }

  // ---------- geometry ----------
  function col(start, span) {
    start = start || 1;
    span = span || COLS - start + 1;
    if (start < 1 || span < 1 || start + span - 1 > COLS) {
      throw new Error("g.col(" + start + ", " + span + "): columns run 1 to 12.");
    }
    return {
      x: MARGIN + (start - 1) * (COL_W + GUTTER),
      w: span * COL_W + (span - 1) * GUTTER,
    };
  }

  // Accepts {col:[start,span]} or {x,w}; defaults to full width.
  function box(o) {
    o = o || {};
    if (o.x !== undefined && o.w !== undefined) return { x: o.x, w: o.w };
    const c = o.col || [1, COLS];
    return col(c[0], c[1]);
  }

  // ---------- text measurement ----------
  function charW(ch) {
    if (ARIAL[ch] !== undefined) return ARIAL[ch];
    if (/[0-9]/.test(ch)) return DIGIT;
    if (/[A-Z]/.test(ch)) return 0.7;
    return 0.56;
  }
  function textW(str, size, bold, font) {
    let em = 0;
    for (const ch of str) em += charW(ch);
    return (em * size * (bold ? 1.07 : 1) * slack(font || fonts.body)) / 72;
  }
  // Greedy word wrap. Returns the number of lines a string takes in width w.
  function countLines(str, size, w, bold, font) {
    let lines = 0;
    for (const para of String(str).split("\n")) {
      const words = para.split(" ").filter((x) => x.length);
      if (!words.length) { lines += 1; continue; }
      let n = 1;
      let cur = 0;
      const space = textW(" ", size, bold, font);
      for (const word of words) {
        const ww = textW(word, size, bold, font);
        if (cur === 0) cur = ww;
        else if (cur + space + ww <= w) cur += space + ww;
        else { n += 1; cur = ww; }
      }
      lines += n;
    }
    return lines;
  }
  function measure(text, size, w, o) {
    o = o || {};
    const str = Array.isArray(text) ? text.map((t) => (typeof t === "string" ? t : t.text)).join("\n") : String(text);
    const lines = countLines(str, size, w, o.bold, o.font);
    const paraGap = Array.isArray(text) ? (text.length - 1) * (o.paraSpaceAfter || 0) / 72 : 0;
    return { lines, h: (lines * size * LINE) / 72 + paraGap };
  }

  // Glue the last two words so a headline never leaves one word alone.
  function bindLast(str) {
    const s = String(str).trim();
    const i = s.lastIndexOf(" ");
    if (i < 0) return s;
    const head = s.slice(0, i);
    const tail = s.slice(i + 1);
    if (!head.includes(" ") && head.length + tail.length > 24) return s;
    return head + " " + tail;
  }

  function addTextBox(slide, text, o) {
    const opts = Object.assign(
      { margin: 0, valign: "top", isTextBox: true, fit: "none", lineSpacingMultiple: 1.0 },
      o
    );
    slide.addText(text, opts);
  }

  // ---------- slides ----------
  function slide(t) {
    t = t || "light";
    const s = pres.addSlide();
    s.background = { color: t === "dark" ? hx("darkBackground") : hx("lightBackground") };
    s.__ddTone = t;
    return s;
  }

  function label(s, text, o) {
    o = o || {};
    const b = box(o);
    const size = o.size || TYPE.label;
    const y = o.y !== undefined ? o.y : TOP;
    const str = String(text).toUpperCase();
    const h = measure(str, size, b.w, { bold: true }).h;
    addTextBox(s, str, {
      x: b.x, y, w: b.w, h, fontFace: fonts.body, fontSize: size, bold: true,
      charSpacing: 1.5, color: o.color ? hx(o.color) : muted(s), align: o.align || "left",
    });
    return y + h;
  }

  // Headline. o.emphasis: a word or phrase to set in the accent color.
  function title(s, text, o) {
    o = o || {};
    const b = box(o);
    const size = o.size || TYPE.title;
    const y = o.y !== undefined ? o.y : TOP;
    const str = bindLast(text);
    const h = measure(str, size, b.w, { bold: displayBold, font: fonts.display }).h;
    const base = {
      fontFace: fonts.display, fontSize: size, bold: displayBold,
      color: o.color ? hx(o.color) : ink(s),
    };
    let runs = str;
    if (o.emphasis) {
      const at = str.replace(/ /g, " ").indexOf(o.emphasis);
      if (at >= 0) {
        const end = at + o.emphasis.length;
        runs = [
          { text: str.slice(0, at), options: {} },
          { text: str.slice(at, end), options: { color: hx(o.emphasisColor || "accent") } },
          { text: str.slice(end), options: {} },
        ].filter((r) => r.text.length);
      }
    }
    addTextBox(s, runs, Object.assign({ x: b.x, y, w: b.w, h, align: o.align || "left", lineSpacingMultiple: 0.95 }, base));
    return y + h;
  }

  // Body copy. Pass a string, or an array of strings for bullets / paragraphs.
  function body(s, text, o) {
    o = o || {};
    const b = box(o);
    const size = o.size || TYPE.body;
    const y = o.y !== undefined ? o.y : TOP;
    const isList = Array.isArray(text);
    const bullets = isList && o.bullets !== false;
    const paraSpaceAfter = o.paraSpaceAfter !== undefined ? o.paraSpaceAfter : isList ? 6 : 0;
    const indent = bullets ? 0.25 : 0;
    const h = measure(text, size, b.w - indent, { paraSpaceAfter, font: fonts.body }).h;
    const color = o.color ? hx(o.color) : bodyInk(s);
    const content = isList
      ? text.map((t, i) => ({
          text: t,
          options: Object.assign(
            { paraSpaceAfter },
            bullets ? { bullet: { indent: 18 } } : {},
            i < text.length - 1 ? { breakLine: true } : {}
          ),
        }))
      : String(text);
    addTextBox(s, content, {
      x: b.x, y, w: b.w, h, fontFace: fonts.body, fontSize: size, color,
      bold: !!o.bold, align: o.align || "left",
    });
    return y + h;
  }

  // Flow stacked text blocks top-down with uniform gaps.
  // blocks: [{ type: "label"|"title"|"subtitle"|"body", text, gapAfter?, ...opts }]
  // Returns the next free y for whatever sits below (chart, table, image).
  function stack(s, blocks, o) {
    o = o || {};
    let y = o.y !== undefined ? o.y : TOP;
    const shared = { col: o.col, x: o.x, w: o.w, align: o.align };
    blocks.forEach((blk, i) => {
      const opts = Object.assign({}, shared, blk, { y });
      let bottom;
      if (blk.type === "label") bottom = label(s, blk.text, opts);
      else if (blk.type === "title") bottom = title(s, blk.text, opts);
      else if (blk.type === "subtitle") bottom = body(s, blk.text, Object.assign({ size: TYPE.subtitle }, opts));
      else bottom = body(s, blk.text, opts);
      const next = blocks[i + 1];
      let gap = blk.gapAfter;
      if (gap === undefined) gap = blk.type === "label" ? GAP.tight : GAP.block;
      y = next ? bottom + gap : bottom;
    });
    return y + (o.after !== undefined ? o.after : GAP.block);
  }

  // Rounded card. Returns the inner box {x, y, w, h} after padding.
  function card(s, o) {
    o = o || {};
    const b = box(o);
    const y = o.y !== undefined ? o.y : TOP;
    const h = o.h || 2;
    const fill = o.fill ? hx(o.fill) : tone(s) === "dark" ? hx("darkBackgroundAlt") : hx("lightBackgroundAlt");
    const shape = {
      x: b.x, y, w: b.w, h, fill: { color: fill }, line: { type: "none" },
      rectRadius: o.radius !== undefined ? o.radius : 0.2,
    };
    if (o.shadow !== false) {
      shape.shadow = { type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 };
    }
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, shape);
    const pad = o.pad !== undefined ? o.pad : 0.3;
    return { x: b.x + pad, y: y + pad, w: b.w - 2 * pad, h: h - 2 * pad, bottom: y + h };
  }

  // Sign of a delta: +1, -1, or 0. Reads "+4%", "-2.1", "(3.0)", numbers.
  function signOf(v) {
    if (typeof v === "number") return Math.sign(v);
    const t = String(v).trim();
    if (/^[-−(]/.test(t)) return -1;
    if (/^\+/.test(t)) return 1;
    return 0;
  }

  // One big number with its label and an optional signed delta.
  // o.good: override whether the delta is favorable (for costs, down is good).
  function statCallout(s, o) {
    o = o || {};
    const b = box(o);
    let y = o.y !== undefined ? o.y : TOP;
    const size = o.size || TYPE.stat;
    const align = o.align || "left";
    const vh = (size * LINE) / 72;
    addTextBox(s, String(o.value), {
      x: b.x, y, w: b.w, h: vh, fontFace: fonts.display, fontSize: size, bold: displayBold,
      color: o.color ? hx(o.color) : ink(s), align,
    });
    y += vh + GAP.tight / 2;
    if (o.label) {
      y = body(s, o.label, { x: b.x, w: b.w, y, size: o.labelSize || TYPE.small + 2, color: o.labelColor || undefined, align });
    }
    if (o.delta !== undefined && o.delta !== null && o.delta !== "") {
      const sg = signOf(o.delta);
      const good = o.good !== undefined ? o.good : sg >= 0;
      const role = sg === 0 ? "neutral" : good ? "positive" : "negative";
      y += GAP.tight / 2;
      y = body(s, String(o.delta), { x: b.x, w: b.w, y, size: TYPE.small, bold: true, color: role, align });
    }
    return y;
  }

  // Row of 3 to 5 stat callouts, each in its own card, equal widths.
  function kpiRow(s, items, o) {
    o = o || {};
    if (!items || items.length < 1) throw new Error("g.kpiRow: pass 3 to 5 items.");
    const n = items.length;
    const y = o.y !== undefined ? o.y : TOP;
    const whole = box(o);
    const w = (whole.w - (n - 1) * GUTTER) / n;
    const size = o.size || (n >= 5 ? 40 : n === 4 ? 46 : TYPE.stat);
    let bottom = y;
    let h = o.h;
    if (!h) {
      // tallest content decides the card height so every card matches
      const inner = w - 0.6;
      h = 0.6 + (size * LINE) / 72 + GAP.tight / 2;
      h += Math.max(...items.map((it) => (it.label ? measure(it.label, TYPE.small + 2, inner).h : 0)));
      if (items.some((it) => it.delta)) h += GAP.tight / 2 + (TYPE.small * LINE) / 72;
    }
    items.forEach((it, i) => {
      const x = whole.x + i * (w + GUTTER);
      const inner = o.card === false ? { x, y, w } : card(s, { x, w, y, h, fill: o.fill, shadow: o.shadow });
      statCallout(s, Object.assign({ size }, it, { x: inner.x, w: inner.w, y: inner.y }));
      bottom = y + h;
    });
    return bottom;
  }

  // ---------- tables ----------
  const NUMERIC = /^[\s(+\-−$€£¥]*[\d.,]+\s*(%|x|pts|bps|[KMB]|k|m|bn)?\)?\s*$/;
  function isNum(v) {
    if (typeof v === "number") return true;
    if (v && typeof v === "object") v = v.text;
    return typeof v === "string" && NUMERIC.test(v) && /\d/.test(v);
  }
  function cellText(v) {
    return v && typeof v === "object" ? String(v.text) : String(v);
  }

  // rows: array of arrays. First row is the header unless o.header === false.
  // o.total: true marks the last row as a total (bold, rule above).
  // o.variance: index of the variance column, colored by sign.
  // o.goodWhenNegative: array of row indexes (body rows) where down is good.
  function table(s, rows, o) {
    o = o || {};
    const b = box(o);
    const y = o.y !== undefined ? o.y : TOP;
    const size = o.fontSize || TYPE.small + 1;
    const rowH = o.rowH || Math.max(0.36, (size * 2.1) / 72);
    const header = o.header !== false;
    const body0 = header ? 1 : 0;
    const nCols = Math.max(...rows.map((r) => r.length));
    const bodyRows = rows.slice(body0);
    const numeric = [];
    for (let c = 0; c < nCols; c++) {
      const vals = bodyRows.map((r) => r[c]).filter((v) => v !== undefined && v !== "" && v !== null);
      numeric[c] = vals.length > 0 && vals.every(isNum);
    }
    // Column widths fill the span exactly, weighted by content length.
    let weights = o.colWeights;
    if (!weights) {
      weights = [];
      for (let c = 0; c < nCols; c++) {
        const longest = Math.max(...rows.map((r) => (r[c] === undefined ? 0 : cellText(r[c]).length)));
        weights[c] = numeric[c] ? Math.max(6, longest) : Math.max(10, longest * 1.15);
      }
    }
    const sumW = weights.reduce((a, v) => a + v, 0);
    const colW = weights.map((v) => (v / sumW) * b.w);

    const text = hx("textOnLight");
    const zebra = hx(o.zebra || "lightBackground");
    const plain = hx("lightBackgroundAlt");
    const none = { type: "none" };
    const rule = { type: "solid", pt: 1, color: text };
    const lastIdx = rows.length - 1;

    const out = rows.map((r, ri) => {
      const isHead = header && ri === 0;
      const isTotal = o.total && ri === lastIdx && !isHead;
      const bodyIdx = ri - body0;
      return Array.from({ length: nCols }, (_, c) => {
        const raw = r[c] === undefined ? "" : r[c];
        const extra = raw && typeof raw === "object" ? raw.options || {} : {};
        const opts = {
          fontFace: fonts.body, fontSize: size, valign: "middle",
          align: numeric[c] ? "right" : "left",
          margin: [0.04, 0.12, 0.04, 0.12],
          border: [isTotal ? rule : none, none, none, none],
          color: text,
        };
        if (isHead) {
          Object.assign(opts, { fill: { color: hx("darkBackground") }, color: hx("textOnDark"), bold: true });
        } else {
          opts.fill = { color: isTotal ? plain : bodyIdx % 2 === 1 ? zebra : plain };
          if (isTotal) opts.bold = true;
          if (o.variance === c) {
            const sg = signOf(raw && typeof raw === "object" ? raw.text : raw);
            const flip = (o.goodWhenNegative || []).includes(bodyIdx);
            if (sg !== 0) opts.color = hx((sg > 0) !== flip ? "positive" : "negative");
            opts.bold = true;
          }
        }
        return { text: cellText(raw), options: Object.assign(opts, extra) };
      });
    });
    s.addTable(out, { x: b.x, y, w: b.w, colW, rowH, autoPage: false });
    return y + rowH * rows.length;
  }

  // ---------- charts ----------
  function niceStep(range, ticks) {
    if (!(range > 0)) return 1;
    const raw = range / (ticks || 5);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / mag;
    const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nf * mag;
  }
  function flat(values) {
    const out = [];
    (function walk(v) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object" && Array.isArray(v.values)) walk(v.values);
      else if (typeof v === "number" && isFinite(v)) out.push(v);
    })(values);
    return out;
  }

  // Value axis bounds. Floors at 0 unless the data has negatives.
  // Accepts numbers, arrays of numbers, or pptxgenjs chart data [{values}].
  function valAxis(values, o) {
    o = o || {};
    const v = flat(values);
    if (!v.length) return {};
    const lo = Math.min(...v);
    const hi = Math.max(...v);
    const minBase = lo < 0 ? lo : 0;
    const maxBase = hi > 0 ? hi : 0;
    const step = niceStep((maxBase - minBase) * 1.08 || 1, o.ticks || 5);
    const min = lo < 0 ? Math.floor(lo / step) * step : 0;
    let max = hi > 0 ? Math.ceil((hi * 1.04) / step) * step : 0;
    if (max === min) max = min + step;
    return { valAxisMinVal: min, valAxisMaxVal: max, valAxisMajorUnit: step };
  }

  // A quiet chart frame on brand. Merge with type-specific options:
  //   s.addChart(pres.charts.BAR, data, { ...g.col(1,12), y, h, ...g.chartStyle({ values: data }) })
  function chartStyle(o) {
    o = o || {};
    const dark = o.dark !== undefined ? o.dark : o.slide ? tone(o.slide) === "dark" : false;
    const labelColor = dark ? hx("neutral") : hx("axisLabel");
    const lineColor = dark ? hx("axisLabel") : hx("gridline");
    const style = {
      chartColors: o.colors ? o.colors.map((c) => hx(c)) : series(),
      showTitle: false,
      showLegend: !!o.legend,
      legendPos: "b",
      legendFontFace: fonts.body,
      legendFontSize: 11,
      legendColor: labelColor,
      catAxisLabelColor: labelColor,
      valAxisLabelColor: labelColor,
      catAxisLabelFontFace: fonts.body,
      valAxisLabelFontFace: fonts.body,
      catAxisLabelFontSize: 11,
      valAxisLabelFontSize: 10,
      catAxisLineShow: true,
      catAxisLineColor: lineColor,
      valAxisLineShow: false,
      valGridLine: { color: lineColor, size: 0.75 },
      catGridLine: { style: "none" },
      dataLabelFontFace: fonts.body,
      dataLabelFontSize: 11,
      dataLabelColor: dark ? hx("textOnDark") : hx("textOnLight"),
      barGapWidthPct: 60,
      lineSize: 2.5,
      lineDataSymbol: "none",
    };
    if (o.values !== undefined) Object.assign(style, valAxis(o.values));
    if (o.shadow) {
      const sh = o.shadow === true ? {} : o.shadow;
      style.shadow = {
        type: "outer", color: "000000", angle: 90,
        opacity: sh.opacity !== undefined ? sh.opacity : 0.2,
        blur: sh.blur !== undefined ? sh.blur : 4,
        offset: Math.max(0, sh.offset !== undefined ? sh.offset : 3),
      };
    }
    return style;
  }

  // Variance bridge built as a stacked bar with an invisible base series.
  // steps: [{ label, value, total? }]. The first step must be a total.
  //   A total's value is the level itself and must equal the running sum.
  //   Other steps are signed deltas.
  // o.prefix / o.suffix / o.decimals format the labels (e.g. "$", "M", 1).
  // o.goodWhenNegative: true for cost bridges, where a decrease is favorable.
  // The axis floor focuses on the band of change so small deltas stay legible.
  function waterfall(s, steps, o) {
    o = o || {};
    if (!steps || !steps.length || !steps[0].total) {
      throw new Error("g.waterfall: the first step must be a total, e.g. { label: 'Q2', value: 40, total: true }.");
    }
    const b = box(o);
    const y = o.y !== undefined ? o.y : TOP;
    const h = o.h || BOTTOM - y;
    const tol = o.tolerance !== undefined ? o.tolerance : 0.005;

    const labels = [];
    const base = [];
    const tot = [];
    const up = [];
    const down = [];
    const tops = [];
    const kinds = [];
    const levels = [];
    let run = 0;
    steps.forEach((st, i) => {
      labels.push(st.label);
      if (st.total) {
        if (i > 0 && Math.abs(st.value - run) > Math.max(tol, Math.abs(run) * 1e-6)) {
          throw new Error(
            'g.waterfall: "' + st.label + '" is ' + st.value + " but the steps before it sum to " +
            +run.toFixed(6) + ". The bridge does not tie out."
          );
        }
        run = st.value;
        base.push(0); tot.push(st.value); up.push(0); down.push(0);
        tops.push(st.value); kinds.push("total"); levels.push(st.value);
      } else {
        const before = run;
        run += st.value;
        base.push(Math.min(before, run));
        tot.push(0);
        up.push(st.value > 0 ? st.value : 0);
        down.push(st.value < 0 ? -st.value : 0);
        tops.push(Math.max(before, run));
        kinds.push(st.value >= 0 ? "up" : "down");
        levels.push(before, run);
      }
    });
    if (Math.min(...levels) < 0) {
      throw new Error("g.waterfall: running totals must stay at or above 0. Split the bridge or chart it as a column of deltas.");
    }

    // Focus band: when the opening level dwarfs the deltas, lift the floor.
    const lo = Math.min(...levels);
    const hi = Math.max(...levels);
    let floor = 0;
    if (o.focus !== false && lo > 0 && (hi - lo) / hi < 0.5) {
      const step = niceStep(hi - lo, 4);
      floor = Math.max(0, Math.floor((lo - (hi - lo) * 0.6) / step) * step);
    }
    const top = hi + (hi - floor) * 0.14;

    const totalColor = hx(o.totalColor || (tone(s) === "dark" ? "neutral" : "darkBackground"));
    // Cost bridges: an increase is unfavorable, so it takes the negative color.
    const upColor = o.goodWhenNegative ? hx("negative") : hx("positive");
    const downColor = o.goodWhenNegative ? hx("positive") : hx("negative");

    // Plot area is pinned so labels can be placed over each bar exactly.
    const L = { x: 0.01, y: 0.02, w: 0.98, h: 0.84 };
    const gapPct = o.gap !== undefined ? o.gap : 45;
    const style = chartStyle({ slide: s });
    s.addChart(
      pres.charts.BAR,
      [
        { name: "base", labels, values: base },
        { name: "total", labels, values: tot },
        { name: "increase", labels, values: up },
        { name: "decrease", labels, values: down },
      ],
      Object.assign(style, {
        x: b.x, y, w: b.w, h,
        barDir: "col",
        barGrouping: "stacked",
        chartColors: ["transparent", totalColor, upColor, downColor],
        barGapWidthPct: gapPct,
        showValue: false,
        showLegend: false,
        valAxisHidden: true,
        valAxisMinVal: floor,
        valAxisMaxVal: top,
        valGridLine: { style: "none" },
        layout: L,
      })
    );

    const dec = o.decimals !== undefined ? o.decimals : 1;
    const fmt = (v, signed) => {
      const sign = v < 0 ? "-" : signed ? "+" : "";
      const num = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      return sign + (o.prefix || "") + num + (o.suffix || "");
    };
    const n = steps.length;
    const plotX = b.x + L.x * b.w;
    const plotW = L.w * b.w;
    const plotY = y + L.y * h;
    const plotH = L.h * h;
    const slot = plotW / n;
    const size = o.labelSize || 12;
    const lh = (size * LINE) / 72;
    steps.forEach((st, i) => {
      const vy = plotY + plotH * (1 - (tops[i] - floor) / (top - floor));
      const color = kinds[i] === "total" ? ink(s) : kinds[i] === "up" ? upColor : downColor;
      addTextBox(s, fmt(st.value, kinds[i] !== "total"), {
        x: plotX + i * slot, y: vy - lh - 0.04, w: slot, h: lh,
        fontFace: fonts.body, fontSize: size, bold: true, color, align: "center",
      });
    });
    return y + h;
  }

  // Source line or footnote, pinned above the bottom margin.
  function source(s, text, o) {
    o = o || {};
    const b = box(o);
    const size = o.size || TYPE.caption;
    const h = measure(text, size, b.w).h;
    const y = o.y !== undefined ? o.y : BOTTOM - h;
    addTextBox(s, String(text), { x: b.x, y, w: b.w, h, fontFace: fonts.body, fontSize: size, color: muted(s) });
    return y + h;
  }

  // Small page number in the bottom-right corner.
  function pageNumber(s, n) {
    addTextBox(s, String(n), {
      x: W - MARGIN - 1, y: H - MARGIN + 0.12, w: 1, h: 0.25,
      fontFace: fonts.body, fontSize: TYPE.caption, color: muted(s), align: "right",
    });
  }

  // How much vertical room is left from y down to the bottom margin.
  function room(y) {
    return BOTTOM - y;
  }

  return {
    // geometry
    W, H, MARGIN, COLS, GUTTER, COL_W, CONTENT_W, TOP, BOTTOM,
    TYPE, GAP, fonts, brand,
    col, room, measure,
    // color
    hx, series,
    // slides and text
    slide, label, title, body, stack, source, pageNumber,
    // containers and numbers
    card, statCallout, kpiRow, table,
    // charts
    chartStyle, valAxis, waterfall,
  };
}

module.exports = { makeGrid };
