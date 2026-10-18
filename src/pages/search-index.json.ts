import type { APIRoute } from 'astro';
import { url } from '../config/site';
import { MEASURES, DELIVERIES } from '../lib/measures';
import { CONTROVERSIES } from '../lib/controversies';
import { pairFor } from '../lib/controversy-questions';
import { LESSONS } from '../lib/learn';
import { headlineText } from '../lib/format';
import laws from '../data/laws.json';

/* The search index and the favourites catalogue: one small file the browser loads once. Each item has a type, a stable
   id, a title, a line of context, the page, and the words searched. */
export interface Item { type: 'measure' | 'promise' | 'controversy' | 'law' | 'lesson' | 'page'; id: string; title: string; sub: string; href: string; text: string }
export const GET: APIRoute = () => {
  const items: Item[] = [
    ...MEASURES.map((m) => ({ type: 'measure' as const, id: m.id, title: m.title, sub: `${headlineText(m.headline)} · ${m.sectionTitle}`, href: url(`measures/${m.id}/`), text: `${m.title} ${m.question} ${m.headline.caption} ${m.sectionTitle} ${m.ed.labels.join(' ')}` })),
    ...MEASURES.filter((m) => m.ed.target?.owner === 'government').map((m) => ({ type: 'promise' as const, id: `p-${m.id}`, title: m.ed.target!.commitment, sub: `Promise · ${m.verdict!.verdict.replace('_', ' ')}`, href: url(`measures/${m.id}/`), text: `${m.ed.target!.commitment} ${m.title} promise commitment ${m.ed.target!.ownerLabel}` })),
    ...DELIVERIES.map((d) => ({ type: 'promise' as const, id: d.id, title: d.commitment, sub: `Promise · ${d.verdict.replace('_', ' ')}`, href: url(`targets/#${d.id}`), text: `${d.commitment} ${d.title} ${d.topic} promise commitment ${d.owner}` })),
    ...CONTROVERSIES.map((c) => ({ type: 'controversy' as const, id: c.id, title: pairFor(c.id, c.type).critical, sub: `${c.minister} · ${c.category}`, href: url(`controversies/${c.id}/`), text: `${c.title} ${c.minister} ${c.portfolio} ${c.category} ${c.summary.slice(0, 300)}` })),
    ...(laws as any).laws.map((l: any) => ({ type: 'law' as const, id: l.id, title: l.title, sub: `Law · ${l.status}`, href: url(`laws/#${l.id}`), text: `${l.title} ${l.summary ?? ''} ${l.status}` })),
    ...LESSONS.map((l) => ({ type: 'lesson' as const, id: l.slug, title: l.title, sub: `Learn · ${l.question}`, href: url(`learn/${l.slug}/`), text: `${l.title} ${l.question} ${l.intro.join(' ')}` })),
    { type: 'page', id: 'calculator', title: 'Are you better off?', sub: 'Calculator', href: url('calculator/'), text: 'calculator better off worse off pay take home mortgage rent household cost of living' },
    { type: 'page', id: 'budget-build', title: 'Build your own Federal Budget', sub: 'Interactive', href: url('budget/build/'), text: 'budget simulator deficit debt tax spending build' },
    { type: 'page', id: 'make-your-own-chart', title: 'Make your own chart', sub: 'Download the data', href: url('make-your-own-chart/'), text: 'download csv spreadsheet excel chart data reuse credit source' },
    { type: 'page', id: 'methodology', title: 'Methodology', sub: 'How the site works', href: url('methodology/'), text: 'methodology rules verdicts sources checks selection policy independence' },
    { type: 'page', id: 'classrooms', title: 'For classrooms', sub: 'Teachers and students', href: url('classrooms/'), text: 'teachers students school classroom economics civics lesson' },
    { type: 'page', id: 'latest', title: 'Latest figures', sub: 'What landed, and when', href: url('latest/'), text: 'latest new figures changed updates feed rss' },
  ];
  return new Response(JSON.stringify(items.map((i) => ({ ...i, text: i.text.toLowerCase() }))), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
