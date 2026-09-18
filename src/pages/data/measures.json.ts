import type { APIRoute } from 'astro';
import { MEASURES, GENERATED_AT } from '../../lib/measures';
import { SITE } from '../../config/site';

/* Everything the site shows, in one machine-readable file. Stable ids; ISO dates; units stated per series. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify({
    publisher: SITE.name, edition: SITE.edition, generated_at: GENERATED_AT, rules_version: SITE.rulesVersion,
    licence: 'CC BY 4.0. Underlying ABS and RBA data: CC BY 4.0, credit the original publisher.',
    measures: MEASURES.map((m) => ({
      id: m.id, title: m.title, topic: m.sectionTitle, kind: m.ed.group, federal_influence: m.ed.influence,
      latest: { value: m.headline.value, unit: m.headline.unit ?? '', period: m.headline.period ?? null, description: m.headline.caption },
      verdict: m.verdict ? { verdict: m.verdict.verdict, reason: m.verdict.reason, commitment: m.ed.target!.commitment, rule: m.ed.target!.rule } : null,
      change_over_year: m.direction ? { trend: m.direction.trend, change: Number(m.direction.change.toFixed(3)), from: m.direction.prior, to: m.direction.latest } : null,
      labels: m.ed.labels, unit: m.ed.unitOverride ?? m.chart.unit,
      series: m.chart.series ?? [], categories: m.chart.bars ?? [], forecast_from: m.chart.estimateFrom ?? null,
      sources: m.sources.map((s) => ({ publisher: s.publisher, title: s.title, url: s.url, retrieved_at: s.retrieved_at ?? null })),
      method: m.method,
    })),
  }, null, 1), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
