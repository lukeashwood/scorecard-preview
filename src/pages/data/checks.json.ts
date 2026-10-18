import type { APIRoute } from 'astro';
import { RUN, CHECK_LOG, RUN_HISTORY } from '../../lib/checks';
import { SITE } from '../../config/site';

/* The latest data run's check-by-check log, machine-readable. Same content as /data/checks/. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify({
    publisher: SITE.name, rules_version: SITE.rulesVersion,
    run: RUN,
    statuses: { pass: 'The test passed.', warn: 'Worth a look, but the figure stands (a slow source, a revision, a re-check falling due).', fail: 'The figure was held back: the last verified value stays on the page, marked under review.' },
    checks: CHECK_LOG,
    history: RUN_HISTORY,
  }, null, 1), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
