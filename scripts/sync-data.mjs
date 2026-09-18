// Copies the latest pipeline output from the original site into this project. Run: npm run sync
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, '..', '..', 'scorecard-site', 'data'), to = join(here, '..', 'src', 'data');
for (const f of ['metrics.json', 'laws.json', 'controversies.json']) {
  if (!existsSync(join(from, f))) { console.error('Missing ' + join(from, f)); process.exit(1); }
  copyFileSync(join(from, f), join(to, f)); console.log('synced ' + f);
}
