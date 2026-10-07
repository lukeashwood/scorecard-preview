import type { APIRoute } from 'astro';
import { MEASURES } from '../../../lib/measures';
import { wideSvg, toPng } from '../../../lib/shareImage';
import type { Measure } from '../../../lib/types';

export function getStaticPaths() { return MEASURES.map((m) => ({ params: { id: m.id }, props: { m } })); }
export const GET: APIRoute = ({ props }) => new Response(new Uint8Array(toPng(wideSvg((props as { m: Measure }).m))), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
