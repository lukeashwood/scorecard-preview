/* Which measures a controversy is about, so each controversy page points at the figures and each measure page points
   at the disputes over it. Internal links only; the text of both pages is unchanged. An entry is listed only where the
   measure's series is the figure the dispute turns on. */
import { CONTROVERSIES, type Controversy } from './controversies';
import { MEASURES } from './measures';
import type { Measure } from './types';

export const CONTROVERSY_MEASURES: Record<string, string[]> = {
  'spending-inflation-rate-rises': ['spending_gdp', 'inflation', 'interest_rates'],
  'five-percent-deposit-scheme': ['home_prices', 'price_to_earnings'],
  'bowen-275-power-bill-promise-2026': ['power_bills', 'electricity'],
  'oneil-1-2-million-homes-target': ['housing_accord', 'people_per_home'],
  'chalmers-rba-smashing-the-economy': ['interest_rates', 'mortgage'],
  'chalmers-philip-lowe-persistent-critic': ['spending_gdp', 'inflation'],
  'albanese-stage-3-tax-cuts-broken-promise': ['income_tax_shares', 'tax_take'],
  'chalmers-super-tax-unrealised-gains-retreat': ['tax_take', 'budget_balance'],
  'conroy-defence-procurement-hunter-frigates': ['defence_spending'],
  'marles-defence-estate-sell-off-victoria-barracks': ['defence_spending'],
  'gallagher-pwc-contracts-ban-lifted': ['consultancy_contracts'],
  'shorten-speechwriter-620k-contract': ['consultancy_contracts', 'aps_headcount'],
  'albanese-copacabana-house-purchase': ['home_prices'],
  'watt-north-west-shelf-approval': ['emissions_target'],
};

/** Measures a controversy page should link to, in the order listed. */
export function measuresFor(c: Controversy): Measure[] {
  return (CONTROVERSY_MEASURES[c.id] ?? []).map((id) => MEASURES.find((m) => m.id === id)).filter((m): m is Measure => !!m);
}

/** Controversies a measure page should link to, newest first (CONTROVERSIES is already sorted that way). */
export function controversiesFor(m: Measure): Controversy[] {
  return CONTROVERSIES.filter((c) => (CONTROVERSY_MEASURES[c.id] ?? []).includes(m.id));
}
