import { useEffect, useRef, useState } from 'react';
import { scaleLinear, scaleBand } from 'd3-scale';
import { line as d3line } from 'd3-shape';
import { fmtPeriod } from '../lib/format';

type Pt = [string, number];
interface Props { priv: Pt[]; pub: Pt[]; infl: Pt[]; term: string }

function useWidth() {
  const ref = useRef<HTMLDivElement>(null); const [w, setW] = useState(0);
  useEffect(() => { if (!ref.current) return; setW(Math.round(ref.current.getBoundingClientRect().width)); const ro = new ResizeObserver((e) => setW(Math.round(e[0].contentRect.width))); ro.observe(ref.current); return () => ro.disconnect(); }, []);
  return [ref, w] as const;
}

const RANGES = [{ label: 'Last 5 years', q: 20 }, { label: 'Last 10 years', q: 40 }, { label: 'Since 2000', q: 999 }];
const pct = (v: number) => `${v.toFixed(1)}%`;
const pts = (v: number) => `${v.toFixed(1)} pts`;
/** A round tick step (1, 2 or 5 times a power of ten) giving about 5 steps across the range. */
function niceStep(range: number) { const raw = Math.max(range, 1e-6) / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }

/** Grouped bars: how much private and public demand each added to GDP growth over the year to each quarter (left scale), with
    annual inflation as a line over them (right scale). The two scales are built so their zero lines and gridlines match. */
export default function DemandChart({ priv, pub, infl, term }: Props) {
  const [ri, setRi] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth();
  const pm = new Map(pub), im = new Map(infl);
  const all = priv.map(([d, v]) => ({ d, priv: v, pub: pm.get(d), infl: im.get(d) })).filter((r) => r.pub != null) as { d: string; priv: number; pub: number; infl?: number }[];
  const rows = all.slice(-Math.min(RANGES[ri].q, all.length));
  const H = 360, m = { t: 14, r: 56, b: 30, l: 56 }, iw = Math.max(240, W - m.l - m.r), ih = H - m.t - m.b;
  const bars = rows.flatMap((r) => [r.priv, r.pub, 0]), lines = rows.map((r) => r.infl ?? 0).concat(0);
  const sL = niceStep(Math.max(...bars) - Math.min(...bars)), sR = niceStep(Math.max(...lines) - Math.min(...lines));
  const up = Math.max(Math.ceil(Math.max(...bars) / sL), Math.ceil(Math.max(...lines) / sR), 1);
  const dn = Math.max(Math.ceil(-Math.min(...bars) / sL), Math.ceil(-Math.min(...lines) / sR), 0);
  const y = scaleLinear().domain([-dn * sL, up * sL]).range([ih, 0]);
  const yr = scaleLinear().domain([-dn * sR, up * sR]).range([ih, 0]);
  const steps = Array.from({ length: up + dn + 1 }, (_, i) => i - dn);
  const x = scaleBand<string>().domain(rows.map((r) => r.d)).range([0, iw]).paddingInner(0.18).paddingOuter(0.05);
  const bw = x.bandwidth() / 2;
  const line = d3line<{ d: string; infl?: number }>().defined((r) => r.infl != null).x((r) => (x(r.d) ?? 0) + x.bandwidth() / 2).y((r) => yr(r.infl!));
  const dense = rows.length > 45;
  const tickEvery = Math.ceil(rows.length / Math.max(3, Math.floor(iw / 74)));
  const tx = rows.findIndex((r) => r.d >= term);
  const h = hover != null ? rows[hover] : null;
  const on = { background: 'var(--ink)', color: 'var(--paper)' };
  return (
    <figure className="m-0">
      <div className="no-print mb-3 flex flex-wrap gap-1" role="group" aria-label="Time range">
        {RANGES.map((r, i) => <button key={r.label} type="button" className="btn btn-sm btn-quiet" aria-pressed={i === ri} onClick={() => { setRi(i); setHover(null); }} style={i === ri ? on : undefined}>{r.label}</button>)}
      </div>
      <div ref={ref} className="relative">
        {W > 0 && <svg width={W} height={H} role="img" aria-label={`Private and public demand contributions to GDP growth (left scale) and inflation (right scale), ${fmtPeriod(rows[0].d, 'q')} to ${fmtPeriod(rows[rows.length - 1].d, 'q')}. Latest quarter: private ${pts(rows[rows.length - 1].priv)}, public ${pts(rows[rows.length - 1].pub)}${rows[rows.length - 1].infl != null ? `, inflation ${pct(rows[rows.length - 1].infl!)}` : ''}.`} className="block" onPointerLeave={() => setHover(null)}>
          <g transform={`translate(${m.l},${m.t})`}>
            {tx >= 0 && <rect x={(x(rows[tx].d) ?? 0) - x.step() * 0.1} y={0} width={Math.max(0, iw - (x(rows[tx].d) ?? 0) + x.step() * 0.1)} height={ih} fill="var(--brand-tint)" opacity={0.6} />}
            {steps.map((k) => <g key={k}><line x1={0} x2={iw} y1={y(k * sL)} y2={y(k * sL)} stroke={k === 0 ? 'var(--ink-3)' : 'var(--grid)'} /><text x={-8} y={y(k * sL)} dy="0.32em" textAnchor="end" fontSize="12" fill="var(--ink-3)">{+(k * sL).toFixed(2)}%</text><text x={iw + 8} y={yr(k * sR)} dy="0.32em" fontSize="12" fill="var(--ink)">{+(k * sR).toFixed(2)}%</text></g>)}
            <text transform={`translate(${-44},${ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fontWeight={600} fill="var(--ink-2)">Contribution to GDP growth (% points)</text>
            <text transform={`translate(${iw + 46},${ih / 2}) rotate(90)`} textAnchor="middle" fontSize="12" fontWeight={600} fill="var(--ink)">Inflation (annual %)</text>
            {rows.map((r, i) => {
              const x0 = x(r.d) ?? 0;
              return <g key={r.d} onPointerEnter={() => setHover(i)}>
                <rect x={x0 - x.step() * 0.05} y={0} width={x.step()} height={ih} fill="transparent" />
                <rect x={x0} y={Math.min(y(0), y(r.priv))} width={Math.max(1, bw - (dense ? 0 : 1))} height={Math.max(0.5, Math.abs(y(r.priv) - y(0)))} fill="var(--c1)" opacity={hover == null || hover === i ? 1 : 0.55} />
                <rect x={x0 + bw} y={Math.min(y(0), y(r.pub))} width={Math.max(1, bw - (dense ? 0 : 1))} height={Math.max(0.5, Math.abs(y(r.pub) - y(0)))} fill="var(--c4)" opacity={hover == null || hover === i ? 1 : 0.55} />
                {i % tickEvery === 0 && <text x={x0 + bw} y={ih + 20} textAnchor="middle" fontSize="12" fill="var(--ink-3)">{r.d.slice(0, 4)}{ri === 2 ? '' : ` ${['Mar', 'Jun', 'Sep', 'Dec'][Math.floor((+r.d.slice(5, 7) - 1) / 3)]}`}</text>}
              </g>;
            })}
            <path d={line(rows) ?? ''} fill="none" stroke="var(--ink)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" pointerEvents="none" />
            {!dense && rows.map((r) => r.infl != null && <circle key={r.d} cx={(x(r.d) ?? 0) + bw} cy={yr(r.infl)} r={3} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1} pointerEvents="none" />)}
          </g>
        </svg>}
        {h && <div role="status" className="pointer-events-none absolute right-2 top-2 rounded-lg border border-rule bg-surface p-2 text-[13px] shadow-card"><b>{fmtPeriod(h.d, 'q')}</b><br />Private demand: {pts(h.priv)} of GDP growth<br />Public demand: {pts(h.pub)} of GDP growth<br />{h.infl != null ? `Inflation: ${pct(h.infl)}` : 'Inflation: not yet published'}</div>}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: 'var(--c1)' }} />Private demand (left scale)</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: 'var(--c4)' }} />Public demand (left scale)</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-[3px] w-5 rounded" style={{ background: 'var(--ink)' }} />Inflation (right scale)</li>
        <li className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-5 rounded-sm" style={{ background: 'var(--brand-tint)' }} />This government</li>
      </ul>
      <p className="meta mt-2">Each bar is the percentage points that part of demand added to GDP growth over the year to that quarter. Inflation is the annual rate. Private demand is household spending plus private investment in homes and business; public demand is federal, state and local government spending and investment together.</p>
    </figure>
  );
}
