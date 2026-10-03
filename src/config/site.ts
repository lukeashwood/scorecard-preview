/* One place for everything that changes between editions (Australia now; NZ, UK, Canada, US later). */
export const SITE = {
  name: 'Gov Score',
  edition: 'Australia',
  tagline: 'Holding the federal government to account, in its own numbers.',
  description:
    'Holding the Australian Government to account with official figures: what it promised, what it delivered, and what has changed since it took office. Sourced, dated and tested daily, in plain English.',
  locale: 'en-AU',
  currency: 'AUD',
  government: {
    name: 'Albanese Government',
    swornIn: '2022-05-23',
    // Elections shown as markers on every time-series chart.
    elections: [
      { date: '2022-05-21', label: '2022 election' },
      { date: '2025-05-03', label: '2025 election' },
    ],
  },
  /* Who publishes the site, who pays for it, and any political affiliation. Left null until the publisher supplies the
     facts; the About page and footer say so plainly rather than inventing details or implying independence. If the
     publisher is a party, candidate or associated entity, `authorisation` carries the "Authorised by …" line that
     electoral law generally requires on material intended to influence votes. */
  publisher: null as null | { name: string; statement: string; funding: string; contact: string; authorisation: string },
  rulesVersion: '2.1',
  rulesDate: '2026-09-18',
  repo: 'https://github.com/lukeashwood',
  // Formspree form that receives sign-ups and error reports (emailed to the publisher).
  formEndpoint: 'https://formspree.io/f/xnpnqgvj',
} as const;

/* The site is organised around 3 questions. The top bar shows the main pages; the rest sit under "More". */
export const NAV_GROUPS = [
  { q: 'What did they promise?', items: [{ href: 'targets/', label: 'Promises', top: true }] },
  { q: 'What happened?', items: [{ href: 'measures/', label: 'Results', top: true }, { href: 'charts/', label: 'Charts', top: true }, { href: 'in-60-seconds/', label: 'In 60 seconds', top: false }] },
  { q: 'Why did it happen?', items: [{ href: 'relationships/', label: 'Connections', top: true }, { href: 'budget/', label: 'Budget', top: true }, { href: 'laws/', label: 'Laws', top: false }] },
  { q: 'More', items: [{ href: 'controversies/', label: 'Controversies', top: false }, { href: 'learn/', label: 'Learn', top: false }, { href: 'briefing/', label: 'Briefing (3D)', top: false }] },
] as const;
export const NAV = NAV_GROUPS.flatMap((g) => g.items);

export const FOOTER_NAV = [
  { href: 'methodology/', label: 'Methodology' },
  { href: 'about/', label: 'About & funding' },
  { href: 'corrections/', label: 'Corrections' },
  { href: 'data/', label: 'Data & downloads' },
  { href: 'subscribe/', label: 'Email updates' },
] as const;

/** Prefix an internal path with the deploy base ("/" on a custom domain, "/repo/" on GitHub Pages). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return base + path.replace(/^\//, '');
}
