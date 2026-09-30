/* G20 comparisons (IMF and World Bank, fetched by the daily data run into g20.json). */
import raw from '../data/g20.json';

export interface G20Indicator {
  key: string; title: string; unit: string; decimals: number; better: 'higher' | 'lower' | 'none'; measures: string[]; note: string;
  latest_year: number; points: Record<string, [number, number][]>;
  source: { publisher: string; url: string; data_url?: string; retrieved_at?: string };
}
const data = raw as unknown as { countries?: Record<string, string>; indicators?: Record<string, Omit<G20Indicator, 'key'>> };
export const G20_COUNTRIES: Record<string, string> = data.countries ?? {};
export const G20_INDICATORS: G20Indicator[] = Object.entries(data.indicators ?? {}).map(([key, v]) => ({ key, ...v }))
  .filter((i) => i.points?.AUS?.length);

/** The comparisons that fit a measure, most direct first. */
export function g20For(measureId: string): (G20Indicator & { countries: Record<string, string> })[] {
  return G20_INDICATORS.filter((i) => i.measures.includes(measureId))
    .sort((a, b) => a.measures.indexOf(measureId) - b.measures.indexOf(measureId))
    .map((i) => ({ ...i, countries: G20_COUNTRIES }));
}
