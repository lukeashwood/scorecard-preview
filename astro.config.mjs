// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// House style: no en or em dashes anywhere on the site, including text that arrives from the data files.
// Ranges become hyphens ("2022-23"), spaced dashes become spaced hyphens.
const plainDashes = {
  name: 'plain-dashes',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const stack = [fileURLToPath(dir)];
      while (stack.length) {
        const d = stack.pop();
        for (const e of await readdir(d, { withFileTypes: true })) {
          const p = join(d, e.name);
          if (e.isDirectory()) { stack.push(p); continue; }
          if (!/\.(html|csv|json|xml|txt)$/.test(e.name)) continue;
          const s = await readFile(p, 'utf8');
          const t = s.replace(/ ?[\u2013\u2014] ?/g, (m) => (m.length > 1 ? ' - ' : '-'));
          if (t !== s) await writeFile(p, t);
        }
      }
    },
  },
};

// SITE_URL / SITE_BASE let the same build serve a custom domain ("/") or a GitHub Pages preview ("/repo-name/").
const site = process.env.SITE_URL || 'https://govscore.com.au';
const base = process.env.SITE_BASE || '/';

/* Sitemap lastmod. Search engines stop trusting lastmod when every page claims to change on every build, so it is set
   only where it is true: pages built from the daily figures carry the figures' timestamp, each controversy page carries
   the date its entry was last checked, and pages whose text rarely changes carry none. */
const here = fileURLToPath(new URL('.', import.meta.url));
const readJson = (p) => JSON.parse(readFileSync(join(here, p), 'utf8'));
const figuresAt = new Date(readJson('src/data/metrics.json').summary.generated_at).toISOString();
const checkedOn = {};
for (const x of readJson('src/data/controversies.json').items) checkedOn[x.id] = x.verified_on;
for (const x of readJson('src/data/disputes.json').items ?? []) checkedOn[x.id] = x.verified_on;
for (const f of readdirSync(join(here, 'src/lib')).filter((f) => /^disputes-.*\.ts$/.test(f))) {
  const s = readFileSync(join(here, 'src/lib', f), 'utf8');
  const id = s.match(/\bid: '([^']+)'/)?.[1], on = s.match(/verified_on: '(\d{4}-\d{2}-\d{2})'/)?.[1];
  if (id && on) checkedOn[id] = on;
}
const STATIC_PAGES = /^\/(about|classrooms|find|for|learn(\/[^/]+)?|make-your-own-chart|methodology|my)\/$/;
function lastmodFor(pathname) {
  const c = pathname.match(/^\/controversies\/([^/]+)\/$/);
  if (c) return checkedOn[c[1]] ? new Date(`${checkedOn[c[1]]}T00:00:00Z`).toISOString() : figuresAt;
  if (STATIC_PAGES.test(pathname)) return undefined;
  return figuresAt;
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [react(), sitemap({
    filter: (page) => !/\/(subscribe|corrections)\/$/.test(page),
    serialize(item) {
      const p = new URL(item.url).pathname;
      const lastmod = lastmodFor(base !== '/' && p.startsWith(base) ? p.slice(base.replace(/\/$/, '').length) : p);
      if (lastmod) item.lastmod = lastmod; else delete item.lastmod;
      item.changefreq = p === '/' || p.startsWith('/measures/') ? 'daily' : 'weekly';
      item.priority = p === '/' ? 1.0 : /^\/(calculator|budget\/build|targets|in-60-seconds)\/$/.test(p) ? 0.9 : p.startsWith('/measures/') ? 0.8 : 0.6;
      return item;
    },
  }), plainDashes],
  // Pre-bundle the heavier libraries up front so the local dev server never serves a half-optimised copy.
  vite: { plugins: [tailwindcss()], ssr: { external: ['@resvg/resvg-js'] }, optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'd3-scale', 'd3-shape'] } },
});
