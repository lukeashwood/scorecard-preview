import type { APIRoute } from 'astro';
import { IN_60_IDS, PAGE_SHARES, type PageShare } from '../../../lib/pageShare';
import { LESSONS } from '../../../lib/learn';
import { in60Svg, pageSvg, targetsSvg, toPng } from '../../../lib/shareImage';

/* Link preview images (1200x630) for the pages that are not a measure or a controversy, drawn at build time.
   "targets" and "in-60-seconds" carry live figures; the rest repeat the page's own heading and opening line. */
export function getStaticPaths() {
  return [{ params: { slug: 'targets' }, props: {} }, { params: { slug: 'in-60-seconds' }, props: {} }, ...PAGE_SHARES.map((p) => ({ params: { slug: p.slug }, props: { p } })),
    // One per explainer: its title, its question and its first line, as the page shows them
    ...LESSONS.map((l) => ({ params: { slug: `learn-${l.slug}` }, props: { p: { slug: `learn-${l.slug}`, eyebrow: 'Learn', title: l.title, text: `${l.question} ${l.intro[0]}`, alt: '' } satisfies PageShare } }))];
}
export const GET: APIRoute = ({ params, props }) => {
  const svg = params.slug === 'targets' ? targetsSvg() : params.slug === 'in-60-seconds' ? in60Svg(IN_60_IDS) : pageSvg((props as { p: PageShare }).p);
  return new Response(new Uint8Array(toPng(svg)), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
};
