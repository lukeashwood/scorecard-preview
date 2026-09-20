/* Visa refusals for foreign speakers. Every quote here was checked against the page it is attributed to. */
import type { Controversy } from './controversies';

export const SPEAKER_VISAS: Controversy = {
  id: 'speaker-visas-incite-discord', featured: true, date: '2025-10-15', type: 'policy', category: 'Visas and free speech',
  title: 'Visas refused for foreign speakers: protecting social cohesion, or deciding what Australians may hear?',
  minister: 'Tony Burke', portfolio: 'Minister for Home Affairs and Immigration',
  summary: 'Since Tony Burke took the Home Affairs portfolio in July 2024, he and his department have refused or cancelled visas for a string of foreign commentators, politicians and entertainers on the ground that they risk “inciting discord” in the community. The best-known case is the American conservative commentator Candace Owens, refused in October 2024 before a national speaking tour. Critics say this lets a minister decide which opinions Australians may hear in person. The government says a visa is a privilege, not a right, and the High Court has upheld the power unanimously.',
  points: [
    { heading: 'Candace Owens: refused by the minister, upheld by the High Court', standing: 'established',
      body: 'Owens applied in September 2024 for a visa for a November speaking tour. On 25 October 2024 Mr Burke personally refused it under section 501 of the Migration Act, on the character-test ground that there was a risk she would “incite discord in the Australian community or in a segment of that community”. He said she could “incite discord in almost every direction”, citing her remarks about the Holocaust and about Muslims. Owens challenged the decision, arguing the law breached the Constitution’s implied freedom of political communication. On 15 October 2025 the High Court unanimously rejected her case (Farmer v Minister for Home Affairs [2025] HCA 38), finding the law valid and noting that the implied freedom is a limit on law-making power, not a personal right.',
      sources: [
        { title: 'High Court of Australia: judgment summary, Farmer v Minister for Home Affairs [2025] HCA 38', url: 'https://www.hcourt.gov.au/sites/default/files/judgment-summaries/2025-10/hca-38-2025-10-15.pdf' },
        { title: 'ABC News: Candace Owens refused entry ahead of national speaking tour, 27 October 2024', url: 'https://www.abc.net.au/news/2024-10-27/candace-owens-refused-visa-for-right-wing-speaking-tour/104524074' },
        { title: 'ABC News: High Court upholds minister’s decision to block visa for Candace Owens, 15 October 2025', url: 'https://www.abc.net.au/news/2025-10-15/high-court-upholds-ministers-block-visa-candace-owens/105893248' },
      ] },
    { heading: 'Claim: Donald Trump Jr and Tucker Carlson were blocked too', standing: 'unverified',
      body: 'The record doesn’t support this, and neither case involved Mr Burke. Donald Trump Jr’s July 2023 tour was postponed after the organisers, Turning Point Australia, said his visa “was only received late afternoon of Wednesday 5 July”, a day before he was due to fly. The visa was granted. The ministers then responsible, Clare O’Neil and Andrew Giles, said the postponement was about ticket sales, and Ms O’Neil called him “a big baby” in posts she later deleted. The organisers’ allegation of a deliberate delay has never been substantiated. Tucker Carlson toured Australia in June 2024, a month before Mr Burke took the portfolio; we found no record of any attempt to refuse or restrict his visa.',
      sources: [
        { title: 'SBS News: minister’s “big baby” dig at Donald Trump Jr over tour postponement, 5 July 2023', url: 'https://www.sbs.com.au/news/article/donald-trump-jr-cancels-australian-tour-blaming-late-visa/kdabc9cso' },
      ] },
    { heading: 'Is the power used only against the right?', standing: 'established',
      body: 'No. The same ground has been used across the spectrum, and several of those refused were pro-Israel figures invited by Jewish community organisations. In October 2024 the visa of Khaled Beydoun, a pro-Palestinian American academic, was cancelled after he called the anniversary of the 7 October attack a day of “considerable celebration”. In November 2024 the former Israeli justice minister Ayelet Shaked was refused; she accused the Australian Government of anti-Semitism. In June 2025 the Israeli-American activist Hillel Fuld was barred, drawing criticism from the US ambassador to Israel. In July 2025 Mr Burke revealed that Kanye West’s visa had been cancelled over an antisemitic song. In August 2025 the Israeli MP Simcha Rothman’s visa was cancelled, and in January 2026 that of an Israeli influencer accused of spreading hatred. Some of these were decisions by departmental officials rather than the minister personally.',
      sources: [
        { title: 'The Guardian, 16 October 2024, as republished: Australia cancels visa of pro-Palestine academic', url: 'https://www.senatorpaterson.com.au/news/australia-cancels-visa-of-pro-palestine-academic-who-called-7-october-day-of-considerable-celebration' },
        { title: 'ABC News: minister says he denied Ayelet Shaked’s visa over social cohesion concerns, 1 December 2024', url: 'https://www.abc.net.au/news/2024-12-01/ayelet-shaked-visa-burke-social-cohesion/104669788' },
        { title: 'The Times of Israel: Australia blocks visit by Israel activist Hillel Fuld, June 2025', url: 'https://www.timesofisrael.com/australia-blocks-visit-by-israel-activist-hillel-fuld-causing-diplomatic-uproar/' },
        { title: 'ABC News: Kanye West denied entry to Australia after antisemitic song, 2 July 2025', url: 'https://www.abc.net.au/news/2025-07-02/kanye-west-denied-entry-to-australia-after-antisemitic-song/105487620' },
        { title: 'ABC News: far-right Israeli politician’s visa cancelled ahead of speaking tour, 18 August 2025', url: 'https://www.abc.net.au/news/2025-08-18/simcha-rothman-visa-cancelled/105668088' },
        { title: 'Al Jazeera: Australia cancels visa of Israeli influencer accused of spreading hatred, 27 January 2026', url: 'https://www.aljazeera.com/news/2026/1/27/australia-cancels-visa-of-israeli-influencer-accused-of-spreading-hatred' },
      ] },
    { heading: 'The free-speech argument', standing: 'contested',
      body: 'The legal question is settled: the power is valid. The argument that remains is about how it is used. Critics point out that “a risk of inciting discord” is a broad test that turns on a minister’s judgement of someone’s opinions, that none of those refused had been convicted of anything in Australia, and that Australians can read and watch the same people online anyway, so a ban mainly stops a live audience from hearing them. Owens’s lawyers argued the refusal burdened political communication. Supporters, including Jewish community bodies in the Owens case, say the country is entitled to keep out people who trade in racial or religious hatred, and that nobody has a right to a visa.',
      sources: [
        { title: 'ABC News: High Court upholds minister’s decision (arguments put by Owens’s lawyers), 15 October 2025', url: 'https://www.abc.net.au/news/2025-10-15/high-court-upholds-ministers-block-visa-candace-owens/105893248' },
        { title: 'The Nightly: Candace Owens’ refused entry shows the limits of free speech, 15 October 2025', url: 'https://thenightly.com.au/australia/political-commentator-candace-owens-refused-entry-to-australia-demonstrating-the-limits-of-free-speech-c-20356773' },
      ] },
  ],
  response: 'Mr Burke says a visa is a privilege: “If you are coming to Australia to spread a message of hate and division, we don’t want you here.” On Kanye West: “We have enough problems in this country already without deliberately importing bigotry.” On Owens, he said she could “incite discord in almost every direction”. He says the test is applied whichever side a speaker is on.',
  outcome: 'The High Court upheld the power unanimously in October 2025, and it continues to be used. No independent review of how the “incite discord” test is applied has been announced.',
  status: 'ongoing',
  sources: [
    { title: 'Migration Act 1958, section 501 (character test)', url: 'https://www.legislation.gov.au/C1958A00062/latest/text' },
  ],
  verified_on: '2026-09-21',
};
