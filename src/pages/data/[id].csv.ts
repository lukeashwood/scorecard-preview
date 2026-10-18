import type { APIRoute } from 'astro';
import { MEASURES, GENERATED_AT } from '../../lib/measures';
import { SITE } from '../../config/site';

export function getStaticPaths() { return MEASURES.map((m) => ({ params: { id: m.id } })); }
const q = (s: string) => `"${s.replace(/"/g, '""')}"`;

export const GET: APIRoute = ({ params }) => {
  const m = MEASURES.find((x) => x.id === params.id)!;
  let rows: string[];
  if (m.chart.bars) rows = ['category,value,unit', ...m.chart.bars.map((b) => `${q(b.name)},${b.value},${q(m.chart.unit)}`)];
  else {
    const series = [...(m.chart.series ?? []), ...(m.chart.extra ?? []).map((e) => ({ name: `${e.name} (${e.unit})`, points: e.points }))]; const maps = series.map((s) => new Map(s.points));
    const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p[0])))].sort();
    rows = ['date,' + series.map((s) => q(s.name)).join(',') + ',forecast', ...dates.map((d) => d + ',' + maps.map((mm) => mm.get(d) ?? '').join(',') + ',' + (m.chart.estimateFrom && d >= m.chart.estimateFrom ? 'yes' : 'no'))];
  }
  const head = [`# ${m.title}`, `# Unit: ${m.ed.unitOverride ?? m.chart.unit}`, ...m.sources.map((s) => `# Source: ${s.publisher}, ${s.title}, ${s.url}`), `# Downloaded from ${SITE.name}, https://govscore.com.au/measures/${m.id}/, ${GENERATED_AT.slice(0, 10)}. Credit the sources above and ${SITE.name}.`];
  return new Response([...head, ...rows].join('\n') + '\n', { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
