/* Link preview images for the pages that are not a measure or a controversy. Each entry repeats the page's own
   heading and opening line, so the image says nothing the page does not. Figures are never drawn here; the
   promises and in-60-seconds images, which do carry figures, are drawn from the live data in shareImage.ts. */
export interface PageShare { slug: string; eyebrow: string; title: string; text: string; alt: string }

export const PAGE_SHARES: PageShare[] = [
  { slug: 'calculator', eyebrow: 'Are you better off?', title: 'Are you better off than in 2022?',
    text: 'Enter what you earn now, before tax. The calculator works out what the same job paid in 2022-23, takes out tax under each year’s rates, and compares the two in today’s dollars.',
    alt: 'Are you better off than in 2022? Cost of living calculator from Gov Score' },
  { slug: 'budget-build', eyebrow: 'Build your own Budget', title: 'Build your own Federal Budget',
    text: 'You start with the government’s Budget, exactly as published. Move any line, in dollars or as a share of the economy, and watch the deficit, the debt and the interest bill respond.',
    alt: 'Build your own Federal Budget: the Gov Score budget simulator' },
  { slug: 'budget', eyebrow: 'Budget', title: 'Where the money comes from, and where it goes',
    text: 'Every dollar the Commonwealth spends is raised from taxpayers or borrowed. These are the government’s own figures, category by category.',
    alt: 'The Australian Federal Budget explained: where the money comes from and where it goes' },
  { slug: 'learn', eyebrow: 'Learn', title: 'The economy, without the jargon',
    text: 'You don’t need an economics degree to follow how the country is going. Each of these takes two or three minutes and lets you move the numbers yourself.',
    alt: 'The Australian economy explained in plain English: short interactive explainers from Gov Score' },
  { slug: 'methodology', eyebrow: 'Methodology', title: 'How this site works',
    text: 'How figures are collected and checked, how verdicts are reached, and the full text of every rating rule. If a rule changes, the version number changes and the change is logged in public.',
    alt: 'Gov Score methodology: how figures and verdicts are checked' },
  { slug: 'charts', eyebrow: 'Charts', title: 'Every chart, one page',
    text: 'All the charts we track. Switch each one between this government, the last 10 or 20 years, and how Australia compares with the G20 where a fair comparison exists.',
    alt: 'Australian economy charts: every official series on one page' },
  { slug: 'relationships', eyebrow: 'Compare', title: 'Do these move together?',
    text: 'Each chart puts two official series side by side, so you can see whether one rises when the other does, at the same time or a year or two later.',
    alt: 'Compare official Australian series side by side: do they move together?' },
  { slug: 'laws', eyebrow: 'Laws', title: 'What Parliament has passed, and what’s before it',
    text: 'A selection of significant bills, newest first. Each entry says in plain words what the bill does and where it stands, and links to Parliament’s own record.',
    alt: 'Bills and laws passed by the Albanese Government, in plain words' },
  { slug: 'controversies', eyebrow: 'Controversies', title: 'Contested decisions and conduct: the claims, the evidence, and where each stands',
    text: 'Two kinds of entry: policies and decisions whose effects are in dispute, and questions about a minister’s own conduct. Each sets out what happened, what the government says, who is criticising it and on what grounds.',
    alt: 'Albanese Government controversies: the claims, the evidence and where each stands' },
  { slug: 'measures', eyebrow: 'Measures', title: 'Every figure we track',
    text: 'Official series, grouped by topic. Open any one for the full chart, its sources, and a plain-English explanation.',
    alt: 'Every official figure Gov Score tracks, grouped by topic' },
  { slug: 'latest', eyebrow: 'Latest figures', title: 'What landed, and when',
    text: 'Every measure, newest official figure first. Open one for the change since the government took office, the change over the past year, and the source.',
    alt: 'Latest official Australian figures: what landed and when' },
  { slug: 'data', eyebrow: 'Data and downloads', title: 'Take the numbers with you',
    text: 'Every series on the site, free to reuse with credit. Files are rebuilt whenever the data updates.',
    alt: 'Gov Score data and downloads: every series free to reuse with credit' },
  { slug: 'classrooms', eyebrow: 'For classrooms', title: 'Official figures, ready for the classroom',
    text: 'Everything on this site is an official figure from the ABS, the Reserve Bank, Treasury or Parliament, with the source linked. The site gives no score of its own and applies the same published rules whichever party is in government.',
    alt: 'Official Australian figures for Economics and Civics classrooms' },
  { slug: 'make-your-own-chart', eyebrow: 'Make your own chart', title: 'Make your own chart',
    text: 'Every chart on this site can be downloaded as a spreadsheet file and redrawn your way, for a newsletter, a classroom, a report or a post. It takes about 2 minutes and costs nothing.',
    alt: 'Make your own chart from official Australian data' },
  { slug: 'briefing', eyebrow: 'Briefing (3D)', title: 'Every measure, mapped',
    text: 'Each sphere is a topic. Its colour and glow show how many of its measures are worse than when the government took office. The small dots orbiting it are the individual measures.',
    alt: 'The Australian economy in 3D: every measure mapped' },
  { slug: 'about', eyebrow: 'About', title: 'Why you can check everything',
    text: 'Gov Score exists so that anyone, whether a parent at the kitchen table, a journalist on deadline or a student, can find out how the country is going without wading through a dozen government websites, and without being told what to think.',
    alt: 'About Gov Score: why you can check everything' },
  { slug: 'for', eyebrow: 'Who it’s for', title: 'What you get from Gov Score',
    text: 'One set of official figures, used in different ways. Pick the one that sounds like you.',
    alt: 'Who Gov Score is for, and what you get' },
];

export const pageShare = (slug: string) => PAGE_SHARES.find((p) => p.slug === slug)!;

/** The tiles on the in-60-seconds page, in order; the page and its share image read the same list. */
export const IN_60_IDS = ['inflation', 'real_wages', 'unemployment', 'gdp_per_capita', 'household_income', 'mortgage', 'home_prices', 'electricity', 'housing_accord', 'gross_debt', 'spending_gdp', 'migration'];
