// Copies the latest pipeline output into this project. Run: npm run sync
// Reads from the original site's GitHub repo (where the daily data run commits), or from the local folder
// ../scorecard-site/data when offline or when SYNC_LOCAL=1.
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const to = join(here, '..', 'src', 'data');
const local = join(here, '..', '..', 'scorecard-site', 'data');
const REMOTE = 'https://raw.githubusercontent.com/lukeashwood/the-scorecard/main/data/';
const FILES = ['metrics.json', 'laws.json', 'controversies.json', 'g20.json'];
const OPTIONAL = new Set(['g20.json']);

for (const f of FILES) {
  let done = false;
  if (process.env.SYNC_LOCAL !== '1') {
    try {
      const r = await fetch(REMOTE + f, { cache: 'no-store' });
      if (r.ok) { const body = await r.text(); JSON.parse(body); writeFileSync(join(to, f), body); console.log('synced ' + f + ' from GitHub'); done = true; }
      else if (!OPTIONAL.has(f)) console.warn(`GitHub returned ${r.status} for ${f}`);
    } catch (e) { console.warn(`Could not fetch ${f} from GitHub: ${e.message}`); }
  }
  if (!done && existsSync(join(local, f))) { copyFileSync(join(local, f), join(to, f)); console.log('synced ' + f + ' from ' + local); done = true; }
  if (!done && OPTIONAL.has(f)) { if (!existsSync(join(to, f))) writeFileSync(join(to, f), '{"indicators":{}}\n'); console.log(`kept existing ${f}`); done = true; }
  if (!done) { console.error('Missing ' + f); process.exit(1); }
}
