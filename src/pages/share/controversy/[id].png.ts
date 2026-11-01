import type { APIRoute } from 'astro';
import { CONTROVERSIES, type Controversy } from '../../../lib/controversies';
import { controversySvg, toPng } from '../../../lib/shareImage';

/* Link preview image for each controversy page (1200x630), drawn at build time like the measure share images. */
export function getStaticPaths() { return CONTROVERSIES.map((c) => ({ params: { id: c.id }, props: { c } })); }
export const GET: APIRoute = ({ props }) => new Response(new Uint8Array(toPng(controversySvg((props as { c: Controversy }).c))), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
