import { useEffect, useRef, useState } from 'react';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line as d3line } from 'd3-shape';
import { withUnit, fmtPeriod, parseDate } from '../lib/format';

type Row = [string, number, number];
interface Side { label: string; unit: string; decimals: number }
interface Props {
  title: string; freq: 'q' | 'fy'; x: Side; y: Side;
  xSeries: [string, number][]; ySeries: [string, number][];
  byLag: { lag: number; rows: Row[]; r: number; slope: number; intercept: number }[];
  term: string;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null); const [w, setW] = useState(0);
  useEffect(() => { if (!ref.current) return; setW(Math.round(ref.current.getBoundingClientRect().width)); const ro = new ResizeObserver((e) => setW(Math.round(e[0].contentRect.width))); ro.observe(ref.current); return () => ro.disconnect(); }, []);
  return [ref, w] as const;
}

/** Plain-English strength of a correlation. */
export function describe(r: number) {
  if (!Number.isFinite(r)) return 'not enough data';
  const a = Math.abs(r);
  const s = a < 0.2 ? 'little or no' : a < 0.4 ? 'a weak' : a < 0.6 ? 'a moderate' : a < 0.8 ? 'a strong' : 'a very strong';
  if (a < 0.2) return 'little or no link';
  return `${s} ${r > 0 ? 'positive' : 'negative'} link`;
}

export default function RelationshipChart({ title, freq, x, y, xSeries, ySeries, byLag, term }: Props) {
  const [li, setLi] = useState(0);
  const [view, setView] = useState<'time' | 'scatter'>('time');
  const cur = byLag[li];
  const lagWord = (l: number) => (l === 0 ? 'Same time' : freq === 'fy' ? `${l} year${l > 1 ? 's' : ''} later` : `${l / 4} year${l > 4 ? 's' : ''} later`);
  const on = { background: 'var(--ink)', color: 'var(--paper)' };
  const fx = (v: number) => withUnit(v, x.unit, x.decimals, { compact: true }), fy = (v: number) => withUnit(v, y.unit, y.decimals, { compact: true });
  return (
    <figure className="m-0">
      <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <button type="button" className="btn btn-sm btn-quiet" aria-pressed={view === 'time'} onClick={() => setView('time')} style={view === 'time' ? on : undefined}>Over time</button>
          <button type="button" className="btn btn-sm btn-quiet" aria-pressed={view === 'scatter'} onClick={() => setView('scatter')} style={view === 'scatter' ? on : undefined}>Side by side</button>
        </div>
        {byLag.length > 1 && <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Compare with"><span className="meta mr-1">Compare with {y.label.split(',')[0].replace(/^\w/, (c) => c.toLowerCase())}:</span>
          {byLag.map((l, i) => <button key={l.lag} type="button" className="btn btn-sm btn-ghost" aria-pressed={i === li} onClick={() => setLi(i)} style={i === li ? on : undefined}>{lagWord(l.lag)}</button>)}</div>}
      </div>
      <p className="text-[15px]"><b>{Number.isFinite(cur.r) ? `r = ${cur.r.toFixed(2)}` : ''}</b> <span className="text-ink-2">({describe(cur.r)}, {cur.rows.length} {freq === 'fy' ? 'years' : 'quarters'}, {fmtPeriod(cur.rows[0][0], freq)} to {fmtPeriod(cur.rows[cur.rows.length - 1][0], freq)}).</span></p>
      {view === 'time' ? <Dual x={x} y={y} xs={xSeries} ys={ySeries} fx={fx} fy={fy} freq={freq} term={term} title={title} /> : <Scatter cur={cur} x={x} y={y} fx={fx} fy={fy} freq={freq} term={term} title={title} />}
      <p className="meta mt-2">r runs from −1 to 1. Near 0 means the two don’t move together; near 1 they rise and fall together; near −1 one rises as the other falls. A link on its own does not show that one causes the other.</p>
    </figure>
  );
}

function Dual({ x, y, xs, ys, fx, fy, freq, term, title }: { x: Side; y: Side; xs: [string, number][]; ys: [string, number][]; fx: (v: number) => string; fy: (v: number) => string; freq: 'q' | 'fy'; term: string; title: string }) {
  const [ref, W] = useWidth(); const H = 300, m = { t: 16, r: 58, b: 28, l: 58 }, iw = Math.max(200, W - m.l - m.r), ih = H - m.t - m.b;
  const start = [xs[0]?.[0], ys[0]?.[0]].filter(Boolean).sort().pop()!;
  const X = xs.filter((p) => p[0] >= start), Y = ys.filter((p) => p[0] >= start);
  const all = [...X, ...Y].map((p) => p[0]).sort();
  const t = scaleTime().domain([parseDate(all[0]), parseDate(all[all.length - 1])]).range([0, iw]);
  const yl = scaleLinear().domain(ext(X.map((p) => p[1]))).nice(5).range([ih, 0]);
  const yr = scaleLinear().domain(ext(Y.map((p) => p[1]))).nice(5).range([ih, 0]);
  const lx = d3line<[string, number]>().x((p) => t(parseDate(p[0]))).y((p) => yl(p[1]));
  const ly = d3line<[string, number]>().x((p) => t(parseDate(p[0]))).y((p) => yr(p[1]));
  const tx = t(parseDate(term));
  const years = []; for (let yy = parseDate(all[0]).getUTCFullYear(); yy <= parseDate(all[all.length - 1]).getUTCFullYear(); yy++) years.push(yy);
  const step = Math.ceil(years.length / Math.max(3, Math.floor(iw / 70)));
  return (
    <div ref={ref} className="mt-2">
      {W > 0 && <svg width={W} height={H} role="img" aria-label={`${title}: ${x.label} and ${y.label} over time`} className="block">
        <g transform={`translate(${m.l},${m.t})`}>
          {tx > 0 && tx < iw && <rect x={tx} y={0} width={iw - tx} height={ih} fill="var(--brand-tint)" opacity={0.6} />}
          {yl.ticks(5).map((v) => <g key={'l' + v}><line x1={0} x2={iw} y1={yl(v)} y2={yl(v)} stroke="var(--grid)" /><text x={-8} y={yl(v)} dy="0.32em" textAnchor="end" fontSize="12" fill="var(--c1)">{fx(v)}</text></g>)}
          {yr.ticks(5).map((v) => <text key={'r' + v} x={iw + 8} y={yr(v)} dy="0.32em" fontSize="12" fill="var(--c2)">{fy(v)}</text>)}
          {years.filter((_, i) => i % step === 0).map((yy) => { const xx = t(parseDate(`${yy}-01-01`)); return xx >= 0 && xx <= iw ? <text key={yy} x={xx} y={ih + 20} textAnchor="middle" fontSize="12" fill="var(--ink-3)">{yy}</text> : null; })}
          <path d={lx(X)!} fill="none" stroke="var(--c1)" strokeWidth={2.4} strokeLinejoin="round" />
          <path d={ly(Y)!} fill="none" stroke="var(--c2)" strokeWidth={2.4} strokeLinejoin="round" />
        </g>
      </svg>}
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-[3px] w-5 rounded" style={{ background: 'var(--c1)' }} />{x.label} (left scale)</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-[3px] w-5 rounded" style={{ background: 'var(--c2)' }} />{y.label} (right scale)</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-5 rounded-sm" style={{ background: 'var(--brand-tint)' }} />This government</li>
      </ul>
    </div>
  );
}

function Scatter({ cur, x, y, fx, fy, freq, term, title }: { cur: { rows: Row[]; slope: number; intercept: number }; x: Side; y: Side; fx: (v: number) => string; fy: (v: number) => string; freq: 'q' | 'fy'; term: string; title: string }) {
  const [ref, W] = useWidth(); const [hover, setHover] = useState<number | null>(null);
  const H = 320, m = { t: 14, r: 16, b: 44, l: 62 }, iw = Math.max(200, W - m.l - m.r), ih = H - m.t - m.b;
  const sx = scaleLinear().domain(ext(cur.rows.map((r) => r[1]))).nice(5).range([0, iw]);
  const sy = scaleLinear().domain(ext(cur.rows.map((r) => r[2]))).nice(5).range([ih, 0]);
  const [d0, d1] = sx.domain();
  const h = hover != null ? cur.rows[hover] : null;
  return (
    <div ref={ref} className="relative mt-2">
      {W > 0 && <svg width={W} height={H} role="img" aria-label={`${title}: each point is one ${freq === 'fy' ? 'year' : 'quarter'}`} className="block">
        <g transform={`translate(${m.l},${m.t})`}>
          {sy.ticks(5).map((v) => <g key={'y' + v}><line x1={0} x2={iw} y1={sy(v)} y2={sy(v)} stroke="var(--grid)" /><text x={-8} y={sy(v)} dy="0.32em" textAnchor="end" fontSize="12" fill="var(--ink-3)">{fy(v)}</text></g>)}
          {sx.ticks(5).map((v) => <text key={'x' + v} x={sx(v)} y={ih + 18} textAnchor="middle" fontSize="12" fill="var(--ink-3)">{fx(v)}</text>)}
          <text x={iw / 2} y={ih + 38} textAnchor="middle" fontSize="12.5" fill="var(--ink-2)" fontWeight={600}>{x.label}</text>
          <text transform={`translate(${-48},${ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="12.5" fill="var(--ink-2)" fontWeight={600}>{y.label}</text>
          {Number.isFinite(cur.slope) && <line x1={sx(d0)} x2={sx(d1)} y1={sy(cur.intercept + cur.slope * d0)} y2={sy(cur.intercept + cur.slope * d1)} stroke="var(--ink-2)" strokeDasharray="5 4" strokeWidth={1.4} />}
          {cur.rows.map((r, i) => { const inT = r[0] >= term; return <circle key={r[0]} cx={sx(r[1])} cy={sy(r[2])} r={i === hover ? 6 : 4.2} fill={inT ? 'var(--c1)' : 'var(--c4)'} opacity={inT ? 0.95 : 0.5} stroke="var(--surface)" strokeWidth={1} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />; })}
        </g>
      </svg>}
      {h && <div role="status" className="pointer-events-none absolute right-2 top-2 rounded-lg border border-rule bg-surface p-2 text-[13px] shadow-card"><b>{fmtPeriod(h[0], freq)}</b><br />{x.label.split(',')[0]}: {fx(h[1])}<br />{y.label.split(',')[0]}: {fy(h[2])}</div>}
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--c1)' }} />Under this government</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full opacity-50" style={{ background: 'var(--c4)' }} />Earlier</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block w-5" style={{ borderTop: '2px dashed var(--ink-2)' }} />Line of best fit</li>
      </ul>
    </div>
  );
}

function ext(v: number[]): [number, number] { const lo = Math.min(...v), hi = Math.max(...v); const p = (hi - lo || 1) * 0.06; return [lo - p, hi + p]; }
