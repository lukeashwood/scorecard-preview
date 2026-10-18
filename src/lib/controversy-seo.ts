/* Search titles and descriptions for controversy pages. The page heading is the pair of questions; the search title
   is a short, plain statement of what the entry is about, written to match how people search for it. Each stays under
   about 48 characters so Base.astro can add " | Gov Score" and the whole title fits what Google shows. */
import type { Controversy } from './controversies';
import { clip } from './seo';

export const CONTROVERSY_SEO: Record<string, string> = {
  'spending-inflation-rate-rises': 'Is government spending driving inflation?',
  'five-percent-deposit-scheme': '5% deposit scheme: is it pushing up prices?',
  'speaker-visas-incite-discord': 'Candace Owens visa and the "incite discord" test',
  'albanese-takaichi-melons-podcast': "Albanese's 'melons' remark about PM Takaichi",
  'bowen-275-power-bill-promise-2026': 'Bowen and the unmet $275 power bill promise',
  'albanese-kylie-minogue-shag-marry-date': "Albanese's Kylie Minogue podcast apology",
  'conroy-defence-procurement-hunter-frigates': 'Hunter frigates and $29bn defence cost blowouts',
  'rae-aged-care-assessment-algorithm': 'Aged care funding algorithm with no human override',
  'bowen-international-travel-cop31': "Chris Bowen's overseas travel bill and COP31",
  'keogh-invictus-australia-funding-cut': 'Invictus Australia funding cut and reversal',
  'keogh-veterans-allied-health-cap': "Veterans' $5,000 allied health cap scrapped",
  'king-inland-rail-consolidated-2026': 'Inland Rail cut back: Queensland leg shelved',
  'oneil-1-2-million-homes-target': '1.2 million homes target: 77,000 behind',
  'marles-wong-iran-strikes-legality': 'Were the US and Israeli strikes on Iran lawful?',
  'albanese-grace-tame-difficult': "Albanese calls Grace Tame 'difficult'",
  'chalmers-philip-lowe-persistent-critic': 'Chalmers questions Philip Lowe\'s motives',
  'albanese-herzog-invitation': "Herzog's visit to Australia after the Bondi attack",
  'marles-defence-estate-sell-off-victoria-barracks': 'Defence sell-off: Victoria Barracks and 85 sites',
  'rowland-hate-laws-israel-genocide-groups': 'Hate laws and criticism of Israel: Rowland on 7.30',
  'albanese-bondi-vigil-booed-apology': 'Albanese booed at the Bondi vigil, then apologises',
  'rowland-perth-family-trip-repayment': "Rowland repays $10,000 for Perth family trip",
  'farrell-family-travel-highest-spender': "Don Farrell's $48,178 family travel claims",
  'wells-sporting-events-family-travel-ipea-audit': "Anika Wells' sporting travel: IPEA audit result",
  'wells-new-york-un-trip-flights': "Anika Wells' $94,828 New York flights",
  'chalmers-super-tax-unrealised-gains-retreat': 'Chalmers drops the unrealised gains super tax',
  'wells-optus-triple-zero-outage-handling': 'Optus triple zero outage: the minister\'s response',
  'burke-nauru-408m-nzyq-deal': 'The $408m Nauru deal for the NZYQ cohort',
  'albanese-palestine-recognition-netanyahu-weak': "Palestine recognition and Netanyahu's 'weak' jibe",
  'gallagher-pwc-contracts-ban-lifted': 'PwC cleared to bid for government work again',
  'collins-live-sheep-package-under-the-radar': 'Live sheep export package: the WA announcement',
  'clare-childcare-safety-should-have-been-fixed': "Childcare safety: 'should have been fixed yesterday'",
  'watt-north-west-shelf-approval': 'North West Shelf gas approval to 2070',
  'marles-factional-assassin-husic-dreyfus-dumped': "Husic, Dreyfus dumped: 'factional assassin' row",
  'albanese-plibersek-salmon-epbc-amendment': 'Tasmanian salmon law change and the Maugean skate',
  'albanese-chinese-live-fire-notice-claim': 'Chinese live-fire drills: did China give notice?',
  'albanese-qantas-upgrades-joyce-chairmans-lounge-book': "Albanese's Qantas upgrades and Alan Joyce",
  'albanese-copacabana-house-purchase': "Albanese's $4.3m Copacabana house purchase",
  'marles-chief-of-staff-tarnawsky-bullying-complaint': "Marles' chief of staff bullying complaint",
  'albanese-burke-gaza-visas-asio-vetting-claim': 'Gaza visas: were applicants vetted by ASIO?',
  'chalmers-rba-smashing-the-economy': "Chalmers: rate rises 'smashing the economy'",
  'rowland-gambling-ad-ban-shelved': 'Gambling ad ban shelved after the Murphy inquiry',
  'shorten-speechwriter-620k-contract': "Bill Shorten's $620,000 speechwriter contract",
  'giles-direction-99-visa-reinstatements': 'Direction 99 and reinstated visas for offenders',
  'pm-no-more-rally-canberra-2024': "Albanese at the 'No More' rally in Canberra",
  'albanese-stage-3-tax-cuts-broken-promise': "Stage 3 tax cuts: 'my word is my bond' broken",
  'oneil-giles-nzyq-detainee-releases': 'NZYQ detainee releases after the High Court ruling',
  'husic-gaza-collective-punishment-remarks': "Husic's 'collectively punished' Gaza remarks",
  'king-qatar-airways-decision-senate-inquiry': 'Qatar Airways flights decision and Qantas lobbying',
  'albanese-son-qantas-chairmans-lounge': "Albanese's son and the Qantas Chairman's Lounge",
  'marles-raaf-vip-flights': "Marles' $3.6m in RAAF VIP flights",
  'gallagher-higgins-knowledge-senate-statement': 'Gallagher, Higgins and the Senate statement',
  'rowland-sportsbet-donations': "Rowland's Sportsbet dinner and $10,000 donation",
  'dreyfus-higgins-settlement-nacc': 'The $2.4m Higgins settlement and the NACC',
  'plibersek-dutton-voldemort-remark': "Plibersek's 'Voldemort' remark about Dutton",
};

/** Cut at a word boundary so a fallback title stays whole. */
function trimTitle(s: string, max = 48): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, '').replace(/[\s,:;'"]+$/, '');
}

export function controversyTitle(c: Controversy): string {
  return CONTROVERSY_SEO[c.id] ?? trimTitle(c.title);
}

export function controversyDescription(c: Controversy): string {
  return clip(c.summary, 155);
}

/** Short label for prev/next links. */
export function shortLabel(c: Controversy): string {
  return controversyTitle(c);
}
