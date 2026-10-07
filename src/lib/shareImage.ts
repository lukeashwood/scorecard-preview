/* Share images for every measure, drawn as SVG at build time and turned into PNG with resvg.
   2 sizes: "wide" (1200x630, the link preview on Facebook, X, LinkedIn, iMessage) and "tall" (1080x1350, for
   Instagram and Facebook feeds). Neutral wording only: the figure, the change, the source. The web address sits in a
   quiet footer so every copy that travels carries it, without shouting. */
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { fmtPeriod, headlineText, inferFreq, parseDate, withUnit } from './format';
import { ratedSeries } from './measures';
import { factualHeadline, recordLine } from './headlines';
import type { Measure, Point } from './types';

const C = { bg: '#ffffff', ink: '#1d1640', ink2: '#4a4466', ink3: '#7a7590', rule: '#e7e3f1', brand: '#4a2d9c', brandTint: '#f3f0fb', muted: '#c9c3da', est: '#9a8fc4' };
const FONT_DIR = join(process.cwd(), 'src/assets/fonts');
const FONTS = ['Public-Sans-wght-400.ttf', 'Public-Sans-wght-600.ttf', 'Public-Sans-wght-700.ttf'].map((f) => join(FONT_DIR, f));
const SANS = 'Public Sans', SERIF = 'Public Sans';
const TERM_START = '2022-05-23';

// The font has no arrow glyph, so "June 2022 → March 2026" becomes "June 2022 to March 2026".
const esc = (s: string) => s.replace(/\s*→\s*/g, ' to ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Rough wrap by character budget (Public Sans averages about 0.53em per character). */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s*→\s*/g, ' to ').split(/\s+/); const lines: string[] = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] = keep[maxLines - 1].replace(/[,.;:]?$/, '') + '…'; return keep; }
  return lines;
}
function textLines(lines: string[], x: number, y: number, lh: number, attrs: string): string {
  return lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" ${attrs}>${esc(l)}</text>`).join('');
}
const shortSource = (m: Measure) => [...new Set(m.sources.map((s) => s.publisher.replace(/^Australian Bureau of Statistics$/, 'ABS').replace(/^Reserve Bank of Australia$/, 'RBA').replace(/\s*\(.*?\)\s*/g, ' ').trim()))].slice(0, 2).join(', ');

/** The little bar-chart mark from the site header, then the address. Right-aligned at (x, y). */
function brandFooter(xRight: number, y: number, size: number): string {
  const label = 'govscore.com.au'; const w = label.length * size * 0.56; const s = size * 1.05;
  const x0 = xRight - w - s - size * 0.45;
  return `<g transform="translate(${x0},${y - s * 0.82})"><rect width="${s}" height="${s}" rx="${s * 0.26}" fill="${C.brand}"/>
    <rect x="${s * 0.23}" y="${s * 0.53}" width="${s * 0.13}" height="${s * 0.24}" rx="${s * 0.04}" fill="#fff"/>
    <rect x="${s * 0.43}" y="${s * 0.38}" width="${s * 0.13}" height="${s * 0.39}" rx="${s * 0.04}" fill="#fff"/>
    <rect x="${s * 0.63}" y="${s * 0.23}" width="${s * 0.13}" height="${s * 0.54}" rx="${s * 0.04}" fill="#fff"/></g>
    <text x="${xRight}" y="${y}" text-anchor="end" font-family="${SANS}" font-weight="600" font-size="${size}" fill="${C.ink}" letter-spacing="0.2">${label}</text>`;
}

interface Box { x: number; y: number; w: number; h: number }

/** Short label for a line. Brackets are dropped, unless 2 lines share the same name, when the bracket tells them apart. */
function seriesLabel(name: string, others: string[]): string {
  const strip = (n: string) => n.replace(/\s*\(.*?\)/g, '').split(',')[0].trim();
  const inner = name.match(/\(([^)]+)\)/)?.[1];
  const clash = others.some((o) => strip(o) === strip(name));
  return clash && inner ? inner.charAt(0).toUpperCase() + inner.slice(1) : strip(name);
}

/** Line, step or bar chart of the measure, last ~12 years, with the government's term shaded and labels on the lines. */
function chartSvg(m: Measure, box: Box, opts: { labelSize: number }): string {
  const rs = ratedSeries(m); const ed = m.ed; const fs = opts.labelSize;
  // Horizontal bar charts (prices vs wages, emissions target and the like)
  if (m.chart.kind === 'hbar' && m.chart.bars?.length) {
    const bars = m.chart.bars.slice(0, 8); const max = Math.max(...bars.map((b) => Math.abs(b.value)), 1e-9);
    const rowH = Math.min(box.h / bars.length, fs * 2.6); const labW = box.w * 0.42; const barW = box.w - labW - fs * 4.2;
    return bars.map((b, i) => {
      const y = box.y + i * rowH; const w = Math.max(2, (Math.abs(b.value) / max) * barW);
      const fill = b.role === 'accent' || b.role === 'primary' || b.role === 'good' ? C.brand : C.muted;
      return `<text x="${box.x}" y="${y + rowH * 0.62}" font-family="${SANS}" font-size="${fs}" fill="${C.ink2}">${esc(wrap(b.name, Math.floor(labW / (fs * 0.53)), 1)[0])}</text>
        <rect x="${box.x + labW}" y="${y + rowH * 0.2}" width="${w}" height="${rowH * 0.6}" rx="3" fill="${fill}"/>
        <text x="${box.x + labW + w + fs * 0.4}" y="${y + rowH * 0.62}" font-family="${SANS}" font-weight="600" font-size="${fs}" fill="${C.ink}">${esc(withUnit(b.value, m.chart.unit, m.chart.decimals, { compact: true }))}</text>`;
    }).join('');
  }
  if (!rs || rs.points.length < 2) return '';
  const unit = rs.unit, dec = rs.decimals;
  const last = rs.points[rs.points.length - 1][0];
  // Long-history measures can ask for a longer view on the image; otherwise the last 12 years.
  const startCut = ed.shareFrom ?? `${+last.slice(0, 4) - 12}${last.slice(4)}`;
  const main = rs.points.filter((p) => p[0] >= startCut);
  // Other series on the same chart (e.g. public vs private wages), muted, only when they share the unit.
  const others = ed.useExtra != null ? [] : (m.chart.series ?? []).filter((s, i) => i !== (ed.seriesIndex ?? 0) && s.points.length > 1).slice(0, 2)
    .map((s) => ({ name: s.name, points: s.points.filter((p) => p[0] >= startCut) }));
  const all = [main, ...others.map((o) => o.points)].flat();
  if (!all.length) return '';
  const t = (d: string) => parseDate(d).getTime();
  const x0 = Math.min(...all.map((p) => t(p[0]))), x1 = Math.max(...all.map((p) => t(p[0])));
  const isBar = m.chart.kind === 'bar';
  let lo = Math.min(...all.map((p) => p[1])), hi = Math.max(...all.map((p) => p[1]));
  if (isBar || (lo > 0 && lo < hi * 0.35)) lo = Math.min(0, lo);
  const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.1 || 1; hi += pad; if (lo !== 0) lo -= pad;
  // Nice ticks
  const span = hi - lo; const step0 = span / 4; const mag = 10 ** Math.floor(Math.log10(step0)); const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => k >= step0) ?? step0;
  const tlo = Math.floor(lo / step) * step, thi = Math.ceil(hi / step) * step;
  const ticks: number[] = []; for (let v = tlo; v <= thi + step / 2; v += step) ticks.push(+v.toFixed(10));
  const tickDec = Number.isInteger(+step.toFixed(10)) ? 0 : step * 10 === Math.round(step * 10) ? 1 : 2;
  const axisW = fs * 4.4; const labelW = fs * 9.5;
  const px = box.x + axisW, pw = box.w - axisW - labelW, py = box.y, ph = box.h - fs * 1.8;
  const X = (d: string) => px + ((t(d) - x0) / Math.max(1, x1 - x0)) * pw;
  const Y = (v: number) => py + ph - ((v - tlo) / (thi - tlo)) * ph;
  let s = '';
  // Government term shading
  if (t(TERM_START) < x1) {
    const xs = Math.max(px, X(TERM_START));
    s += `<rect x="${xs}" y="${py}" width="${px + pw - xs}" height="${ph}" fill="${C.brandTint}"/>`;
    s += `<text x="${xs + 6}" y="${py + fs * 1.05}" font-family="${SANS}" font-weight="600" font-size="${fs * 0.78}" fill="${C.brand}" letter-spacing="0.6">CURRENT GOVERNMENT</text>`;
  }
  // Reference lines (e.g. average household size), dashed, labelled at the right
  let refLab = ''; // drawn after the series so the line never runs through the words
  for (const r of m.chart.ref ?? []) {
    if (r.value < tlo || r.value > thi) continue;
    const y = Y(r.value);
    s += `<line x1="${px}" x2="${px + pw}" y1="${y}" y2="${y}" stroke="${C.ink3}" stroke-width="1.3" stroke-dasharray="6 5"/>`;
    if (r.label) { const t = wrap(r.label, 40, 1)[0]; refLab += `<rect x="${px + 2}" y="${y - 6 - fs * 0.85}" width="${t.length * fs * 0.78 * 0.56 + 10}" height="${fs * 1.05}" rx="3" fill="#ffffff" fill-opacity="0.92"/><text x="${px + 6}" y="${y - 6}" font-family="${SANS}" font-weight="600" font-size="${fs * 0.78}" fill="${C.ink2}">${esc(t)}</text>`; }
  }
  // Grid
  for (const v of ticks) {
    const y = Y(v);
    s += `<line x1="${px}" x2="${px + pw}" y1="${y}" y2="${y}" stroke="${v === 0 ? C.ink3 : C.rule}" stroke-width="${v === 0 ? 1.2 : 1}"/>`;
    s += `<text x="${px - 8}" y="${y + fs * 0.35}" text-anchor="end" font-family="${SANS}" font-size="${fs * 0.85}" fill="${C.ink3}">${esc(withUnit(v, unit, tickDec, { compact: true }))}</text>`;
  }
  // Year labels, across the whole drawn range
  const y0 = new Date(x0).getUTCFullYear(), y1 = new Date(x1).getUTCFullYear();
  const every = y1 - y0 > 8 ? 4 : 2;
  for (let yr = Math.ceil(y0 / every) * every; yr <= y1; yr += every) {
    const x = X(`${yr}-01-01`); if (x < px || x > px + pw) continue;
    s += `<text x="${x}" y="${py + ph + fs * 1.35}" text-anchor="middle" font-family="${SANS}" font-size="${fs * 0.85}" fill="${C.ink3}">${yr}</text>`;
  }
  const est = m.chart.estimateFrom;
  const path = (pts: Point[], step = false) => pts.map((p, i) => {
    const x = X(p[0]), y = Y(p[1]);
    if (i === 0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
    return step ? `H${x.toFixed(1)}V${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`;
  }).join('');
  // Where the main line ends, so companion labels can keep clear of its label
  const act0 = est ? main.filter((p) => p[0] < est) : main; const mainEnd = act0[act0.length - 1] ?? main[main.length - 1];
  const mainLabelY = Y(mainEnd[1]);
  // Muted companion series first
  for (const o of others) {
    if (o.points.length < 2) continue;
    s += `<path d="${path(o.points)}" fill="none" stroke="${C.muted}" stroke-width="${fs * 0.2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const lp = o.points[o.points.length - 1];
    let ly = Y(lp[1]) + fs * 0.35;
    if (Math.abs(ly - mainLabelY) < fs * 2.6) ly = ly >= mainLabelY ? mainLabelY + fs * 2.7 : mainLabelY - fs * 1.6;
    s += `<text x="${X(lp[0]) + 8}" y="${ly}" font-family="${SANS}" font-size="${fs * 0.85}" fill="${C.ink3}">${esc(wrap(seriesLabel(o.name, [rs.name]), 22, 1)[0])}</text>`;
  }
  if (est && isBar) s += `<text x="${px + pw}" y="${py - fs * 0.6}" text-anchor="end" font-family="${SANS}" font-size="${fs * 0.8}" fill="${C.ink3}">Paler bars: Budget estimates</text>`;
  if (isBar) {
    const n = main.length; const bw = Math.max(3, (pw / Math.max(n, 1)) * 0.68);
    for (const p of main) {
      const x = X(p[0]) - bw / 2, ya = Y(Math.max(0, p[1])), yb = Y(Math.min(0, p[1]));
      const inTerm = p[0] >= TERM_START; const isEst = est && p[0] >= est;
      s += `<rect x="${x.toFixed(1)}" y="${ya.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, yb - ya).toFixed(1)}" rx="2" fill="${isEst ? C.est : inTerm ? C.brand : C.muted}"${isEst ? ' fill-opacity="0.55"' : ''}/>`;
    }
  } else {
    const actual = est ? main.filter((p) => p[0] < est) : main; const fut = est ? main.filter((p) => p[0] >= est) : [];
    s += `<path d="${path(actual, m.chart.kind === 'step')}" fill="none" stroke="${C.brand}" stroke-width="${fs * 0.24}" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (fut.length && actual.length) s += `<path d="${path([actual[actual.length - 1], ...fut], m.chart.kind === 'step')}" fill="none" stroke="${C.est}" stroke-width="${fs * 0.2}" stroke-dasharray="${fs * 0.5} ${fs * 0.4}"/>`;
  }
  s += refLab;
  // Direct label on the latest actual value
  const act = est ? main.filter((p) => p[0] < est) : main; const lp = act[act.length - 1] ?? main[main.length - 1];
  if (isBar) {
    // Bars: the value sits on top of the latest actual bar, clear of any later estimate bars
    const yTop = Y(Math.max(0, lp[1])) - fs * 0.5;
    s += `<text x="${X(lp[0])}" y="${yTop}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="${fs * 1.05}" fill="${C.brand}">${esc(withUnit(lp[1], unit, dec, { compact: true }))}</text>`;
    return s;
  }
  s += `<circle cx="${X(lp[0])}" cy="${Y(lp[1])}" r="${fs * 0.36}" fill="${C.brand}" stroke="#fff" stroke-width="2"/>`;
  s += `<text x="${X(lp[0]) + fs * 0.7}" y="${Y(lp[1]) - fs * 0.15}" font-family="${SANS}" font-weight="700" font-size="${fs * 1.05}" fill="${C.brand}">${esc(withUnit(lp[1], unit, dec, { compact: true }))}</text>`;
  const who = others.length ? `${wrap(seriesLabel(rs.name, others.map((o) => o.name)), 22, 1)[0]} · ` : '';
  s += `<text x="${X(lp[0]) + fs * 0.7}" y="${Y(lp[1]) + fs * 1.05}" font-family="${SANS}" font-size="${fs * 0.8}" fill="${C.ink3}">${esc(who + fmtPeriod(lp[0], inferFreq(act, m.chart.freq)))}</text>`;
  return s;
}

function frame(w: number, h: number, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${C.bg}"/>${inner}</svg>`;
}

function footer(m: Measure, w: number, h: number, pad: number, fs: number): string {
  const y = h - pad * 0.62; const src = shortSource(m);
  const asAt = m.lastDataDate ? `Data to ${fmtPeriod(m.lastDataDate, inferFreq(ratedSeries(m)?.points ?? [], m.chart.freq))}` : '';
  // Keep the source line clear of the web address on the right
  const room = Math.floor((w - 2 * pad - fs * 1.15 * 11.5) / (fs * 0.52));
  let line = `Source: ${src}${asAt ? ` · ${asAt}` : ''}`;
  if (line.length > room) line = `Source: ${src}`;
  if (line.length > room) line = line.slice(0, room - 1).replace(/[\s,·]+\S*$/, '') + '…';
  return `<line x1="${pad}" x2="${w - pad}" y1="${h - pad * 1.25}" y2="${h - pad * 1.25}" stroke="${C.rule}" stroke-width="1.5"/>
    <text x="${pad}" y="${y}" font-family="${SANS}" font-size="${fs}" fill="${C.ink3}">${esc(line)}</text>
    ${brandFooter(w - pad, y, fs * 1.15)}`;
}

export function wideSvg(m: Measure): string {
  const W = 1200, H = 630, P = 56;
  const head = wrap(factualHeadline(m), 46, 2);
  const rec = recordLine(m);
  let s = `<text x="${P}" y="${P + 4}" font-family="${SANS}" font-weight="600" font-size="17" fill="${C.brand}" letter-spacing="1.6">${esc(`AUSTRALIA · ${m.sectionTitle.toUpperCase()}`)}</text>`;
  s += textLines(head, P, P + 52, 50, `font-family="${SERIF}" font-weight="600" font-size="44" fill="${C.ink}"`);
  const top = P + 52 + head.length * 50;
  // Left: key figure
  s += `<text x="${P}" y="${top + 62}" font-family="${SANS}" font-weight="700" font-size="64" fill="${C.ink}" letter-spacing="-1">${esc(headlineText(m.headline))}</text>`;
  s += textLines(wrap(`${m.headline.caption}${m.headline.period ? `, ${m.headline.period}` : ''}`, 30, rec ? 3 : 4), P, top + 96, 26, `font-family="${SANS}" font-size="20" fill="${C.ink2}"`);
  if (rec) s += textLines(wrap(rec, 32, 2), P, top + 190, 24, `font-family="${SANS}" font-weight="600" font-size="18" fill="${C.brand}"`);
  // Right: chart
  s += chartSvg(m, { x: 430, y: top + 10, w: W - 430 - P, h: H - top - 10 - 100 }, { labelSize: 16 });
  s += footer(m, W, H, P, 17);
  return frame(W, H, s);
}

export function tallSvg(m: Measure): string {
  const W = 1080, H = 1350, P = 72;
  const head = wrap(factualHeadline(m), 30, 3);
  const rec = recordLine(m);
  let s = `<text x="${P}" y="${P + 10}" font-family="${SANS}" font-weight="600" font-size="24" fill="${C.brand}" letter-spacing="2">${esc(`AUSTRALIA · ${m.sectionTitle.toUpperCase()}`)}</text>`;
  s += textLines(head, P, P + 88, 72, `font-family="${SERIF}" font-weight="600" font-size="64" fill="${C.ink}"`);
  let y = P + 88 + head.length * 72 + 30;
  // Then and now, when there is a comparable figure from when the government took office
  const se = m.sinceElection; const rs = ratedSeries(m);
  if (se && rs) {
    const f = (p: Point) => withUnit(p[1], rs.unit, rs.decimals, { compact: true });
    const fq = inferFreq(rs.points, m.chart.freq);
    const colW = (W - 2 * P - 40) / 2;
    [[`THEN · ${fmtPeriod(se.from[0], fq)}`, f(se.from), C.ink3], [`NOW · ${fmtPeriod(se.to[0], fq)}`, f(se.to), C.brand]].forEach(([lab, val, col], i) => {
      const x = P + i * (colW + 40);
      s += `<rect x="${x}" y="${y}" width="${colW}" height="190" rx="18" fill="${i ? C.brandTint : '#f6f5f9'}"/>`;
      s += `<text x="${x + 32}" y="${y + 50}" font-family="${SANS}" font-weight="600" font-size="22" fill="${col}" letter-spacing="1.2">${esc(lab.toUpperCase())}</text>`;
      s += `<text x="${x + 32}" y="${y + 140}" font-family="${SANS}" font-weight="700" font-size="76" fill="${i ? C.brand : C.ink}" letter-spacing="-1">${esc(val)}</text>`;
    });
    y += 190 + 34;
    s += textLines(wrap(`${rs.name.replace(/\s*\(.*?\)/g, '')}. Change: ${se.label}.`, 54, 2), P, y + 10, 36, `font-family="${SANS}" font-size="28" fill="${C.ink2}"`);
    y += 90;
  } else {
    s += `<text x="${P}" y="${y + 80}" font-family="${SANS}" font-weight="700" font-size="96" fill="${C.ink}" letter-spacing="-1.5">${esc(headlineText(m.headline))}</text>`;
    s += textLines(wrap(`${m.headline.caption}${m.headline.period ? `, ${m.headline.period}` : ''}`, 50, 2), P, y + 130, 38, `font-family="${SANS}" font-size="30" fill="${C.ink2}"`);
    y += 220;
  }
  if (rec) { s += textLines(wrap(rec, 52, 2), P, y + 6, 36, `font-family="${SANS}" font-weight="600" font-size="28" fill="${C.brand}"`); y += 70; }
  s += chartSvg(m, { x: P - 6, y: y + 20, w: W - 2 * P + 6, h: H - y - 20 - 150 }, { labelSize: 24 });
  s += footer(m, W, H, P, 24);
  return frame(W, H, s);
}

export function toPng(svg: string): Buffer {
  const r = new Resvg(svg, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: SANS }, fitTo: { mode: 'original' } });
  return r.render().asPng();
}
