import type { APIRoute } from 'astro';
import { SITE, url } from '../config/site';
import { MEASURES, GENERATED_AT } from '../lib/measures';
import { headlineText } from '../lib/format';
import { factualHeadline } from '../lib/headlines';

/* RSS of the latest figures: one item per measure, dated by its newest data point, so feed readers and newsrooms see
   new releases as they land. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const GET: APIRoute = ({ site }) => {
  const base = site?.href ?? 'https://govscore.com.au/';
  const items = MEASURES.filter((m) => m.lastDataDate).sort((a, b) => b.lastDataDate!.localeCompare(a.lastDataDate!)).slice(0, 40).map((m) => {
    const link = new URL(url(`measures/${m.id}/`), base).href;
    return `<item><title>${esc(`${m.title}: ${headlineText(m.headline)}${m.headline.period ? ` (${m.headline.period})` : ''}`)}</title><link>${link}</link><guid isPermaLink="false">${m.id}-${m.lastDataDate}</guid><pubDate>${new Date(m.lastDataDate + 'T00:00:00Z').toUTCString()}</pubDate><description>${esc(`${factualHeadline(m)} ${m.verdict ? `Verdict: ${m.verdict.verdict.replace('_', ' ')}. ` : ''}Source: ${m.sources.map((s) => s.publisher).filter((v, i, a) => a.indexOf(v) === i).join('; ')}.`)}</description></item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE.name)}: latest figures</title><link>${base}</link><description>${esc('New official figures as they land, with the verdict where a commitment applies.')}</description><lastBuildDate>${new Date(GENERATED_AT).toUTCString()}</lastBuildDate>${items.join('')}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
