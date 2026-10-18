// Copies the latest pipeline output into this project. Run: npm run sync
// Reads from the original site's GitHub repo (where the daily data run commits), or from the local folder
// ../scorecard-site/data when offline or when SYNC_LOCAL=1.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const to = join(here, '..', 'src', 'data');
const local = join(here, '..', '..', 'scorecard-site', 'data');
const REMOTE = 'https://raw.githubusercontent.com/lukeashwood/the-scorecard/main/data/';
const FILES = ['metrics.json', 'laws.json', 'controversies.json', 'g20.json', 'verification.json'];
const OPTIONAL = new Set(['g20.json', 'verification.json']);
// verification.json is the pipeline's full audit file (every run's source metadata, ~430KB). The site keeps the latest
// run's check-by-check log plus the per-run counts, which is what /data/checks/ shows.
const TRIM = {
  'verification.json': (text) => {
    const d = JSON.parse(text); const l = d.latest ?? {};
    const counts = (x) => ({ generated_at: x.generated_at, checks_total: x.checks_total, checks_passed: x.checks_passed, checks_warn: x.checks_warn, checks_failed: x.checks_failed });
    return JSON.stringify({ ...counts(l), checks: l.checks ?? [], history: (d.history ?? []).map(counts) }, null, 1) + '\n';
  },
};
const save = (f, text) => writeFileSync(join(to, f), TRIM[f] ? TRIM[f](text) : text);

for (const f of FILES) {
  let done = false;
  if (process.env.SYNC_LOCAL !== '1') {
    try {
      const r = await fetch(REMOTE + f, { cache: 'no-store' });
      if (r.ok) { const body = await r.text(); JSON.parse(body); save(f, body); console.log('synced ' + f + ' from GitHub'); done = true; }
      else if (!OPTIONAL.has(f)) console.warn(`GitHub returned ${r.status} for ${f}`);
    } catch (e) { console.warn(`Could not fetch ${f} from GitHub: ${e.message}`); }
  }
  if (!done && existsSync(join(local, f))) { save(f, readFileSync(join(local, f), 'utf8')); console.log('synced ' + f + ' from ' + local); done = true; }
  if (!done && OPTIONAL.has(f)) { if (!existsSync(join(to, f))) writeFileSync(join(to, f), f === 'verification.json' ? '{"checks":[],"history":[]}\n' : '{"indicators":{}}\n'); console.log(`kept existing ${f}`); done = true; }
  if (!done) { console.error('Missing ' + f); process.exit(1); }
}
