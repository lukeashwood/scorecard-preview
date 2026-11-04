import type { APIRoute } from 'astro';
import { MEASURES } from '../../../lib/measures';
import { postSvg, toPng } from '../../../lib/shareImage';
import type { Measure } from '../../../lib/types';

// 1080x1080 image for social posts (LinkedIn feed): chart across the top, the key figure and its caption underneath.
export function getStaticPaths() { return MEASURES.map((m) => ({ params: { id: m.id }, props: { m } })); }
export const GET: APIRoute = ({ props }) => new Response(new Uint8Array(toPng(postSvg((props as { m: Measure }).m))), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
