/* Plain, factual headlines worked out from the data, for chart pages and share images. They state the figure, the
   dates and the change, and never use an adjective. Signs and "then, now" pairs are used instead of words like
   "up" or "worse", because for some measures (a budget balance, say) a rise is good and for others it is bad. */
import { fmtPeriod, headlineText, inferFreq, withUnit } from './format';
import { ratedSeries, TODAY } from './measures';
import { VERDICT_LABEL } from './editorial';
import type { Measure, Point } from './types';

const actualPoints = (m: Measure): Point[] => {
  const rs = ratedSeries(m); if (!rs) return [];
  const est = m.chart.estimateFrom;
  return rs.points.filter((p) => p[0] <= TODAY && (!est || p[0] < est));
};

export function factualHeadline(m: Measure): string {
  const rs = ratedSeries(m);
  // A measure can supply its own wording, with {value} and {period} filled from the latest figure.
  if (m.ed.shareHeadline) return m.ed.shareHeadline.replace('{value}', headlineText(m.headline)).replace('{period}', m.headline.period ?? '');
  const subject = m.ed.subject ?? m.title;
  // Titles that already contain a colon get a full stop instead, so the line never reads "A: B: C".
  const lead = (t: string) => (subject.includes(':') ? `${subject}. ${t.charAt(0).toUpperCase()}${t.slice(1)}` : `${subject}: ${t}`);
  // Plain numbers (people per home, years of pay) carry the headline's own suffix, e.g. " years".
  const val = (v: number) => withUnit(v, rs!.unit, rs!.decimals, { compact: true }) + (rs!.unit === '' && m.headline.suffix ? m.headline.suffix : '');
  // Commitments lead with the verdict; the figure itself sits in the big number underneath.
  if (m.verdict && m.ed.target) {
    const label = m.ed.target.verdictLabels?.[m.verdict.verdict] ?? VERDICT_LABEL[m.verdict.verdict];
    return `${lead(label.toLowerCase())}.`;
  }
  const se = m.sinceElection;
  if (se && rs) {
    const fq = inferFreq(rs.points, m.chart.freq);
    const levelless = rs.unit === 'index';
    return `${lead(levelless
      ? `${se.label} since ${fmtPeriod(se.from[0], fq)}`
      : `${val(se.from[1])} in ${fmtPeriod(se.from[0], fq)}, ${val(se.to[1])} in ${fmtPeriod(se.to[0], fq)}`)}.`;
  }
  const d = m.direction;
  if (d && rs) return `${lead(`${d.changeLabel} over the past year`)}.`;
  return `${m.title}.`;
}

/** "The highest since 1996-97" style context from the full history, or null when nothing notable. */
export function recordLine(m: Measure): string | null {
  const rs = ratedSeries(m);
  if (!rs || m.ed.group === 'context' || rs.unit === 'index') return null;
  const pts = actualPoints(m); if (pts.length < 8) return null;
  // "Lowest" is ambiguous for a balance that crosses zero (a smaller deficit or a bigger one?), so say nothing.
  if (pts.some((p) => p[1] < 0)) return null;
  const fq = inferFreq(pts, m.chart.freq);
  const [ld, lv] = pts[pts.length - 1];
  const earlier = pts.slice(0, -1);
  const yrs = (a: string, b: string) => (+b.slice(0, 4) - +a.slice(0, 4)) + (+b.slice(5, 7) - +a.slice(5, 7)) / 12;
  const span = yrs(pts[0][0], ld);
  const name = rs.unit === '%' || rs.unit === '$bn' || rs.unit === '$' || rs.unit === "$'000" ? 'level' : 'figure';
  for (const [kind, cmp] of [['highest', (v: number) => v > lv], ['lowest', (v: number) => v < lv]] as const) {
    const prev = [...earlier].reverse().find((p) => cmp(p[1]));
    if (!prev) { if (span >= 8) return `The ${kind} ${name} in figures back to ${pts[0][0].slice(0, 4)}.`; continue; }
    if (yrs(prev[0], ld) >= 3) return `The ${kind} ${name} since ${fmtPeriod(prev[0], fq)}.`;
  }
  return null;
}
