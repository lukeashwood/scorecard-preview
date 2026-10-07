// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdir, readFile, writeFile } from 'node:fs/promises';
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

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [react(), sitemap(), plainDashes],
  // Pre-bundle the heavier libraries up front so the local dev server never serves a half-optimised copy.
  vite: { plugins: [tailwindcss()], optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'd3-scale', 'd3-shape'] } },
});
