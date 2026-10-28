import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3line } from 'd3-shape';
import { withUnit, fmtDate } from '../lib/format';

export interface G20Ind {
  key: string; title: string; unit: string; decimals: number; better: 'higher' | 'lower' | 'none'; note: string;
  /** Annual series: calendar years. Monthly series (freq "M"): YYYYMM integers, e.g. 202609. */
  latest_year: number; points: Record<string, [number, number][]>; countries: Record<string, string>;
  freq?: 'M'; before?: number; latest_window?: number;
  source: { publisher: string; url: string; retrieved_at?: string };
}

const BEFORE_YEAR = 2021; // the last full year before the government took office (May 2022)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ORD = (n: number) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

const monthly = (ind: G20Ind) => ind.freq === 'M';
/** Period as a label: "2021" for annual series, "September 2026" for monthly ones. */
function periodLabel(ind: G20Ind, p: number, short = false) {
  if (!monthly(ind)) return String(p);
  const m = MONTHS[(p % 100) - 1] ?? '';
  return `${short ? m.slice(0, 3) : m} ${Math.floor(p / 100)}`;
}
/** Period as a number on a time axis: 2026.67 for September 2026. */
const toX = (ind: G20Ind, p: number) => (monthly(ind) ? Math.floor(p / 100) + ((p % 100) - 1) / 12 : p);
/** Months between two YYYYMM periods. */
const monthsApart = (a: number, b: number) => (Math.floor(a / 100) - Math.floor(b / 100)) * 12 + (a % 100) - (b % 100);
const beforeOf = (ind: G20Ind) => ind.before ?? (monthly(ind) ? 202204 : BEFORE_YEAR);

function valueAt(ind: G20Ind, c: string, p: number) { return ind.points[c]?.find((x) => x[0] === p)?.[1]; }

/** Each country's newest figure, provided it is recent enough to count as current. */
function latestOf(ind: G20Ind, c: string) {
  const pts = ind.points[c]; if (!pts?.length) return undefined;
  const last = pts[pts.length - 1];
  if (monthly(ind) && monthsApart(ind.latest_year, last[0]) > (ind.latest_window ?? 6)) return undefined;
  return last;
}

/** Where Australia sits among the G20 countries on one indicator, in one period. For a monthly series at its latest
 *  period, each country is taken at its own most recent month, since countries publish on different days. */
function ranking(ind: G20Ind, period: number) {
  const useLatest = monthly(ind) && period === ind.latest_year;
  const rows = Object.keys(ind.points).map((c) => {
    const pt = useLatest ? latestOf(ind, c) : ([period, valueAt(ind, c, period)] as [number, number | undefined]);
    return { c, name: ind.countries[c] ?? c, v: pt?.[1], p: pt?.[0] ?? period };
  }).filter((r) => r.v != null) as { c: string; name: string; v: number; p: number }[];
  // Best first where there is an agreed better direction; otherwise highest first.
  rows.sort((a, b) => (ind.better === 'lower' ? a.v - b.v : b.v - a.v));
  const pos = rows.findIndex((r) => r.c === 'AUS') + 1;
  const aus = rows.find((r) => r.c === 'AUS');
  return { rows, pos, n: rows.length, med: rows.length ? median(rows.map((r) => r.v)) : NaN, aus };
}

export default function G20Panel({ indicators, csvName }: { indicators: G20Ind[]; csvName: string }) {
  const [k, setK] = useState(0);
  const ind = indicators[Math.min(k, indicators.length - 1)];
  const before = beforeOf(ind);
  const periods = useMemo(() => [before, ind.latest_year].filter((y, i, a) => a.indexOf(y) === i && y <= ind.latest_year), [ind, before]);
  const [period, setPeriod] = useState(ind.latest_year);
  const yr = periods.includes(period) ? period : ind.latest_year;
  const [view, setView] = useState<'rank' | 'trend'>('rank');
  const r = ranking(ind, yr);
  const then = ranking(ind, before);
  const f = (v: number) => withUnit(v, ind.unit, ind.decimals);
  const word = ind.better === 'lower' ? 'lowest' : 'highest';
  const on = { background: 'var(--ink)', color: 'var(--paper)' };
  const isLatest = yr === ind.latest_year;
  const mixedMonths = monthly(ind) && isLatest && r.rows.some((x) => x.p !== ind.latest_year);

  function csv() {
    const ps = [...new Set(Object.values(ind.points).flatMap((p) => p.map((x) => x[0])))].sort((a, b) => a - b);
    const cs = Object.keys(ind.points);
    const head = (monthly(ind) ? 'month' : 'year') + ',' + cs.map((c) => `"${ind.countries[c] ?? c}"`).join(',');
    const key = (p: number) => (monthly(ind) ? `${Math.floor(p / 100)}-${String(p % 100).padStart(2, '0')}` : String(p));
    const rows = [head, ...ps.map((p) => key(p) + ',' + cs.map((c) => valueAt(ind, c, p) ?? '').join(','))];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = `${csvName}-g20-${ind.key}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {indicators.length > 1 && indicators.map((x, i) => <button key={x.key} type="button" className="btn btn-sm btn-ghost" aria-pressed={i === k} onClick={() => setK(i)} style={i === k ? on : undefined}>{x.title.split(' (')[0].replace(', % of GDP', '')}</button>)}
          <button type="button" className="btn btn-sm btn-ghost" aria-pressed={view === 'rank'} onClick={() => setView('rank')} style={view === 'rank' ? on : undefined}>Ranking</button>
          <button type="button" className="btn btn-sm btn-ghost" aria-pressed={view === 'trend'} onClick={() => setView('trend')} style={view === 'trend' ? on : undefined}>Australia vs G20 over time</button>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={csv}>Download CSV</button>
      </div>

      <p className="text-[15px] font-semibold">{ind.title}</p>
      {r.pos > 0 && r.aus && <p className="mt-1 text-[15px] text-ink-2">
        Australia: <b className="text-ink">{f(r.aus.v)}</b> in {periodLabel(ind, r.aus.p)}, <b className="text-ink">{r.pos === 1 ? `the ${word}` : `${ORD(r.pos)} ${word}`}</b> of {r.n} G20 countries (G20 median {f(r.med)}{mixedMonths ? ', each country at its latest month' : ''}).
        {yr !== before && then.pos > 0 && <> In {periodLabel(ind, before)}, before this government, it was {ORD(then.pos)} of {then.n}.</>}
      </p>}

      {view === 'rank' ? <>
        {periods.length > 1 && <div className="mt-3 flex gap-1" role="group" aria-label={monthly(ind) ? 'Month' : 'Year'}>{periods.map((p) => <button key={p} type="button" className="btn btn-sm btn-quiet" aria-pressed={p === yr} onClick={() => setPeriod(p)} style={p === yr ? on : undefined}>{p === before ? `${periodLabel(ind, p)} (before this government)` : monthly(ind) ? 'Latest' : `${p} (latest)`}</button>)}</div>}
        <Bars ind={ind} rows={r.rows} med={r.med} f={f} showMonth={mixedMonths} />
      </> : <Trend ind={ind} f={f} />}

      <p className="meta mt-3 max-w-[80ch]">{ind.note} {ind.better === 'none' ? 'Whether higher or lower is better is a matter of opinion, so countries are listed from highest to lowest.' : `Listed from ${word} (generally better) down.`} The European Union and African Union are G20 members but not countries, so they are not shown.</p>
      <p className="meta mt-1">Source: <a href={ind.source.url} rel="noopener">{ind.source.publisher}</a>{ind.source.retrieved_at ? `, retrieved ${fmtDate(ind.source.retrieved_at)}` : ''}.</p>
    </div>
  );
}

function Bars({ ind, rows, med, f, showMonth }: { ind: G20Ind; rows: { c: string; name: string; v: number; p: number }[]; med: number; f: (v: number) => string; showMonth: boolean }) {
  const lo = Math.min(0, ...rows.map((r) => r.v)), hi = Math.max(0, ...rows.map((r) => r.v)), span = hi - lo || 1;
  const pos = (v: number) => ((v - lo) / span) * 100;
  return (
    <ul className="mt-3 grid gap-1.5" role="img" aria-label={`${ind.title}: G20 ranking. ${rows.map((r) => `${r.name} ${f(r.v)}${showMonth ? ` (${periodLabel(ind, r.p, true)})` : ''}`).join(', ')}`}>
      {rows.map((r, i) => { const aus = r.c === 'AUS'; const a = pos(Math.min(0, r.v)), w = Math.abs(pos(r.v) - pos(0)); return (
        <li key={r.c} className={'grid items-center gap-2 text-[13.5px] ' + (showMonth ? 'grid-cols-[22px_minmax(84px,26%)_1fr_auto_auto]' : 'grid-cols-[22px_minmax(84px,26%)_1fr_auto]')}>
          <span className="num text-right text-ink-3">{i + 1}</span>
          <span className={aus ? 'font-bold text-brand' : 'text-ink-2'}>{r.name}</span>
          <span className="relative h-[18px] rounded bg-panel">
            <span className="absolute top-0 h-[18px] rounded" style={{ left: `${a}%`, width: `${Math.max(0.6, w)}%`, background: aus ? 'var(--c1)' : 'var(--c4)', opacity: aus ? 1 : 0.5 }} />
            {Number.isFinite(med) && <span aria-hidden className="absolute -top-0.5 h-[22px] w-[2px] bg-ink" style={{ left: `${pos(med)}%` }} />}
          </span>
          <b className={'num min-w-[58px] text-right ' + (aus ? 'text-brand' : '')}>{f(r.v)}</b>
          {showMonth && <span className="num min-w-[64px] text-right text-[12px] text-ink-3">{periodLabel(ind, r.p, true)}</span>}
        </li>); })}
      <li className="meta mt-1 flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-[2px] bg-ink" /> G20 median</li>
    </ul>
  );
}

function Trend({ ind, f }: { ind: G20Ind; f: (v: number) => string }) {
  // Annual series start in 2004. Monthly series start where Australia's monthly figures do, so the line and band cover the same stretch.
  const ausFrom = monthly(ind) ? (ind.points.AUS?.[0]?.[0] ?? 200401) : 2004;
  const periods = [...new Set(Object.values(ind.points).flatMap((p) => p.map((x) => x[0])))].filter((p) => p >= ausFrom).sort((a, b) => a - b);
  const aus = periods.map((p) => [p, valueAt(ind, 'AUS', p)] as const).filter((p) => p[1] != null) as [number, number][];
  const band = periods.map((p) => { const vs = Object.keys(ind.points).map((c) => valueAt(ind, c, p)).filter((v) => v != null) as number[]; return vs.length >= 10 ? { p, med: median(vs), lo: quant(vs, 0.25), hi: quant(vs, 0.75) } : null; }).filter(Boolean) as { p: number; med: number; lo: number; hi: number }[];
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null); const [bw, setBw] = useState(640);
  useEffect(() => { if (!box.current) return; setBw(box.current.getBoundingClientRect().width); const ro = new ResizeObserver((e) => setBw(e[0].contentRect.width)); ro.observe(box.current); return () => ro.disconnect(); }, []);
  const W = Math.max(300, Math.round(bw)), H = 300, m = { t: 16, r: 16, b: 28, l: 52 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const all = [...aus.map((p) => p[1]), ...band.flatMap((b) => [b.lo, b.hi])];
  const y = scaleLinear().domain([Math.min(0, ...all), Math.max(...all)]).nice(5).range([ih, 0]);
  const tx = (p: number) => toX(ind, p);
  const x = scaleLinear().domain([tx(periods[0]), tx(periods[periods.length - 1])]).range([0, iw]);
  const ln = d3line<[number, number]>().x((p) => x(tx(p[0]))).y((p) => y(p[1]));
  const area = band.map((b) => `${x(tx(b.p))},${y(b.hi)}`).join(' ') + ' ' + [...band].reverse().map((b) => `${x(tx(b.p))},${y(b.lo)}`).join(' ');
  const hp = hover != null ? periods[hover] : null;
  // Year labels: every year for annual series; for monthly ones, each January that fits.
  const yearTicks = monthly(ind) ? [...new Set(periods.map((p) => Math.floor(p / 100)))].filter((yy) => yy * 100 + 1 >= periods[0]) : periods;
  const step = Math.ceil(yearTicks.length / Math.max(3, Math.floor(iw / 70)));
  const termStart = monthly(ind) ? 2022 + 4 / 12 : 2022; // May 2022 for monthly series, the 2022 point for annual ones
  return (
    <div className="mt-3" ref={box}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`${ind.title}: Australia compared with the G20 median, ${periodLabel(ind, periods[0])} to ${periodLabel(ind, periods[periods.length - 1])}`}
        onPointerMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const mx = ((e.clientX - r.left) / r.width) * W - m.l; let b = 0, bd = Infinity; periods.forEach((pp, i) => { const d = Math.abs(x(tx(pp)) - mx); if (d < bd) { bd = d; b = i; } }); setHover(b); }}
        onPointerLeave={() => setHover(null)}>
        <g transform={`translate(${m.l},${m.t})`}>
          {x(termStart) > 0 && <rect x={x(termStart)} y={0} width={iw - x(termStart)} height={ih} fill="var(--brand-tint)" opacity={0.6} />}
          {y.ticks(5).map((t) => <g key={t}><line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--ink-3)' : 'var(--grid)'} /><text x={-8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="12" fill="var(--ink-3)">{f(t)}</text></g>)}
          {yearTicks.filter((_, i) => i % step === 0).map((yy) => <text key={yy} x={x(yy)} y={ih + 20} textAnchor="middle" fontSize="12" fill="var(--ink-3)">{yy}</text>)}
          {band.length > 1 && <polygon points={area} fill="var(--c4)" opacity={0.18} />}
          {band.length > 1 && <path d={ln(band.map((b) => [b.p, b.med]))!} fill="none" stroke="var(--c4)" strokeWidth={2} strokeDasharray="5 4" />}
          <path d={ln(aus)!} fill="none" stroke="var(--c1)" strokeWidth={2.6} strokeLinejoin="round" />
          {hp != null && <line x1={x(tx(hp))} x2={x(tx(hp))} y1={0} y2={ih} stroke="var(--ink-3)" />}
        </g>
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-[3px] w-5 rounded" style={{ background: 'var(--c1)' }} />Australia</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-[2px] w-5" style={{ borderTop: '2px dashed var(--c4)' }} />G20 median</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-5 rounded-sm" style={{ background: 'var(--c4)', opacity: 0.25 }} />Middle half of G20 countries</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-5 rounded-sm" style={{ background: 'var(--brand-tint)' }} />This government</li>
      </ul>
      {hp != null && <p className="meta mt-1">{periodLabel(ind, hp)}: Australia {valueAt(ind, 'AUS', hp) != null ? f(valueAt(ind, 'AUS', hp)!) : 'no figure'}{band.find((b) => b.p === hp) ? `, G20 median ${f(band.find((b) => b.p === hp)!.med)}` : ''}</p>}
    </div>
  );
}

function quant(xs: number[], q: number) { const a = [...xs].sort((p, r) => p - r); const i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); }
