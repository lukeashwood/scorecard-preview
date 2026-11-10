import { useEffect, useRef, useState } from 'react';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line as d3line } from 'd3-shape';
import { fmtPeriod, parseDate } from '../lib/format';

type Pt = [string, number];
interface Props { priv: Pt[]; pub: Pt[]; infl: Pt[]; term: string; coverage: string; next: string[] }

const PRIV = '#0b5d46', PUB = '#d4a017', INF = '#a63a2f';

function useWidth() {
  const ref = useRef<HTMLDivElement>(null); const [w, setW] = useState(0);
  useEffect(() => { if (!ref.current) return; setW(Math.round(ref.current.getBoundingClientRect().width)); const ro = new ResizeObserver((e) => setW(Math.round(e[0].contentRect.width))); ro.observe(ref.current); return () => ro.disconnect(); }, []);
  return [ref, w] as const;
}

const RANGES = [{ label: 'This government', from: '2022-06-01' }, { label: 'Last 10 years', from: '2016-09-01' }, { label: 'Since 2000', from: '2000-01-01' }];
const pct = (v: number) => `${v.toFixed(1)}%`;
const pp = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} pts`;
const DAY = 86400000;
/** A round tick step (1, 2 or 5 times a power of ten) giving about 5 steps across the range. */
function niceStep(range: number) { const raw = Math.max(range, 1e-6) / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }

/** Bars: how many percentage points private and public demand each added to GDP growth in the quarter (left scale), with
    annual inflation as a dotted line over them (right scale). Inflation is monthly where the ABS publishes it, so the
    horizontal axis is a time axis. The two vertical scales share their zero line and gridlines. */
export default function DemandChart({ priv, pub, infl, term, coverage, next }: Props) {
  const [ri, setRi] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth();
  const from = RANGES[ri].from;
  const pm = new Map(pub), im = new Map(infl);
  const q = priv.filter(([d]) => d >= from && pm.has(d)).map(([d, v]) => ({ d, priv: v, pub: pm.get(d)!, infl: im.get(d) }));
  const inf = infl.filter(([d]) => d >= from);
  const lastDemand = q[q.length - 1].d, lastInf = inf.length ? inf[inf.length - 1] : null;
  const t0 = parseDate(q[0].d).getTime() - 50 * DAY;
  const endT = Math.max(parseDate(lastDemand).getTime(), lastInf ? parseDate(lastInf[0]).getTime() : 0) + 40 * DAY;
  const gap = lastInf != null && parseDate(lastInf[0]).getTime() > parseDate(lastDemand).getTime() + 20 * DAY;

  const H = 400, m = { t: 14, r: 58, b: 34, l: 58 }, iw = Math.max(260, W - m.l - m.r), ih = H - m.t - m.b;
  const x = scaleTime().domain([t0, endT]).range([0, iw]);
  const bars = q.flatMap((r) => [r.priv, r.pub]).concat(0), lines = inf.map((p) => p[1]).concat(0);
  const sL = niceStep(Math.max(...bars) - Math.min(...bars)), sR = niceStep(Math.max(...lines) - Math.min(...lines));
  const upL = Math.ceil(Math.max(...bars) / sL + 0.12), upR = Math.ceil(Math.max(...lines) / sR + 0.12);
  const dnL = Math.ceil(-Math.min(...bars) / sL - 1e-9), dnR = Math.ceil(-Math.min(...lines) / sR - 1e-9);
  const up = Math.max(upL, upR, 1), dn = Math.max(dnL, dnR, 0);
  const y = scaleLinear().domain([-dn * sL, up * sL]).range([ih, 0]);
  const yr = scaleLinear().domain([-dn * sR, up * sR]).range([ih, 0]);
  const steps = Array.from({ length: up + dn + 1 }, (_, i) => i - dn);
  const fmtTick = (v: number) => +v.toFixed(2);

  const qw = x(parseDate('2000-04-01')) - x(parseDate('2000-01-01'));   // about 3 months of width
  const gw = Math.max(3, qw * (q.length > 60 ? 0.9 : 0.72)), bw = gw / 2;
  const line = d3line<Pt>().x((p) => x(parseDate(p[0]))).y((p) => yr(p[1]));
  const tx = parseDate(term).getTime();
  const showTerm = from < term;
  const stepQ = Math.max(1, Math.ceil(78 / Math.max(1, qw)));
  const ticks = ri === 0 ? q.filter((_, i) => (q.length - 1 - i) % stepQ === 0) : q.filter((r) => r.d.slice(5, 7) === '06' && (+r.d.slice(0, 4)) % Math.max(1, Math.ceil(70 / Math.max(1, qw * 4))) === 0);
  const h = hover != null ? q[hover] : null;
  const on = { background: 'var(--ink)', color: 'var(--paper)' };
  const last = q[q.length - 1];
  const callX = lastInf ? x(parseDate(lastInf[0])) : 0, callY = lastInf ? yr(lastInf[1]) : 0;
  return (
    <figure className="m-0">
      <div className="no-print mb-3 flex flex-wrap gap-1" role="group" aria-label="Time range">
        {RANGES.map((r, i) => <button key={r.label} type="button" className="btn btn-sm btn-quiet" aria-pressed={i === ri} onClick={() => { setRi(i); setHover(null); }} style={i === ri ? on : undefined}>{r.label}</button>)}
      </div>
      <div ref={ref} className="relative">
        {W > 0 && <svg width={W} height={H} role="img" aria-label={`Contribution of private and public demand to quarterly GDP growth in percentage points (left scale) and annual inflation (right scale), ${fmtPeriod(q[0].d, 'm')} to ${fmtPeriod(lastInf ? lastInf[0] : last.d, 'm')}. Latest quarter, ${fmtPeriod(last.d, 'q')}: private ${pp(last.priv)}, public ${pp(last.pub)}${lastInf ? `. Latest inflation, ${fmtPeriod(lastInf[0], 'm')}: ${pct(lastInf[1])}` : ''}.`} className="block" onPointerLeave={() => setHover(null)}>
          <g transform={`translate(${m.l},${m.t})`}>
            {showTerm && x(tx) < iw && <rect x={Math.max(0, x(tx))} y={0} width={iw - Math.max(0, x(tx))} height={ih} fill="var(--brand-tint)" opacity={0.6} />}
            {gap && <g><rect x={x(parseDate(lastDemand).getTime() + 46 * DAY)} y={0} width={Math.max(0, iw - x(parseDate(lastDemand).getTime() + 46 * DAY))} height={ih} fill="var(--ink-3)" opacity={0.14} />
              <text x={iw - 6} y={16} textAnchor="end" fontSize="11.5" fill="var(--ink-2)">Demand data</text><text x={iw - 6} y={30} textAnchor="end" fontSize="11.5" fill="var(--ink-2)">not released</text></g>}
            {steps.map((k) => <g key={k}><line x1={0} x2={iw} y1={y(k * sL)} y2={y(k * sL)} stroke={k === 0 ? 'var(--ink-3)' : 'var(--grid)'} /><text x={-8} y={y(k * sL)} dy="0.32em" textAnchor="end" fontSize="12" fill="var(--ink-3)">{fmtTick(k * sL)}</text>{k >= -dnR && <text x={iw + 8} y={yr(k * sR)} dy="0.32em" fontSize="12" fill={INF}>{fmtTick(k * sR)}</text>}</g>)}
            <text transform={`translate(${-44},${ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fontWeight={600} fill="var(--ink-2)">Contribution to GDP growth (percentage points)</text>
            <text transform={`translate(${iw + 46},${ih / 2}) rotate(90)`} textAnchor="middle" fontSize="12" fontWeight={600} fill={INF}>Annual CPI inflation (%)</text>
            {q.map((r, i) => {
              const cx = x(parseDate(r.d)); const o = hover == null || hover === i ? 1 : 0.55;
              return <g key={r.d} onPointerEnter={() => setHover(i)}>
                <rect x={cx - qw / 2} y={0} width={qw} height={ih} fill="transparent" />
                <rect x={cx - bw} y={Math.min(y(0), y(r.priv))} width={bw} height={Math.max(0.5, Math.abs(y(r.priv) - y(0)))} fill={PRIV} opacity={o} />
                <rect x={cx} y={Math.min(y(0), y(r.pub))} width={bw} height={Math.max(0.5, Math.abs(y(r.pub) - y(0)))} fill={PUB} opacity={o} />
              </g>;
            })}
            {ticks.map((r) => <text key={r.d} x={x(parseDate(r.d))} y={ih + 20} textAnchor="middle" fontSize="12" fill="var(--ink-3)">{ri === 0 ? fmtPeriod(r.d, 'm') : r.d.slice(0, 4)}</text>)}
            <path d={line(inf) ?? ''} fill="none" stroke={INF} strokeWidth={3} strokeDasharray="0.1 6" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
            {lastInf && <g pointerEvents="none">
              <circle cx={callX} cy={callY} r={3.5} fill={INF} />
              <line x1={callX - 5} y1={callY - 5} x2={callX - 30} y2={callY - 22} stroke={INF} strokeWidth={1} />
              <text x={callX - 34} y={callY - 22} textAnchor="end" fontSize="12.5" fontWeight={700} fill={INF} stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" strokeLinejoin="round">{pct(lastInf[1])}  {fmtPeriod(lastInf[0], 'm')}</text>
            </g>}
          </g>
        </svg>}
        {h && <div role="status" className="pointer-events-none absolute right-2 top-2 rounded-lg border border-rule bg-surface p-2 text-[13px] shadow-card"><b>{fmtPeriod(h.d, 'q')}</b><br />Private demand: {pp(h.priv)} of GDP growth<br />Public demand: {pp(h.pub)} of GDP growth<br />{h.infl != null ? `Inflation: ${pct(h.infl)}` : 'Inflation: not yet published'}</div>}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: PRIV }} />Private demand (left scale)</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: PUB }} />Public demand, government (left scale)</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block w-6" style={{ borderTop: `3px dotted ${INF}` }} />Annual CPI inflation (right scale)</li>
        {showTerm && <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-5 rounded-sm" style={{ background: 'var(--brand-tint)' }} />This government</li>}
      </ul>
      <p className="meta mt-2">{coverage}{next.length > 0 && ` Next releases: ${next.join('; ')}.`}</p>
      <p className="meta mt-1">Each bar is the percentage points that part of demand added to GDP growth in that quarter. Private demand is household spending plus private investment in homes and business; public demand is federal, state and local government spending and investment together. Inventories and net exports make up the rest of GDP growth.</p>
    </figure>
  );
}
