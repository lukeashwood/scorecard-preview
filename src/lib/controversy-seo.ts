/* Search titles and descriptions for controversy pages. The page heading is the pair of questions; the search title
   is a short, plain statement of what the entry is about, written to match how people search for it. Each stays under
   about 48 characters so Base.astro can add " | Gov Score" and the whole title fits what Google shows. */
import type { Controversy } from './controversies';
import { clip, clipSentence } from './seo';

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

/* Search descriptions. Most summaries open with a sentence longer than the 155 characters a search result shows, so a
   plain word cut left them ending mid-sentence. Each entry below condenses the summary's own facts into whole
   sentences, in the same words where possible: what happened, who said what, and the outcome where it is settled.
   Entries without one fall back to the summary cut at a sentence end. */
export const CONTROVERSY_DESC: Record<string, string> = {
  'speaker-visas-incite-discord': "Since July 2024 Home Affairs has refused or cancelled visas for foreign speakers, including Candace Owens, on the ground they risk 'inciting discord'.",
  'albanese-takaichi-melons-podcast': "On the Bush Deep podcast Albanese described PM Takaichi's gift of two crown melons as 'pretty strange' but 'quite good'. Angus Taylor demanded an apology.",
  'albanese-kylie-minogue-shag-marry-date': "Asked on the Bush Deep podcast to play 'shag, marry, date' with Kylie Minogue, Albanese answered 'all of the above'. He later apologised unequivocally.",
  'conroy-defence-procurement-hunter-frigates': "A task force found $29 billion in cost overruns on defence projects before contracts were signed. Conroy called the system 'broken'. Frigates cut to 6.",
  'rae-aged-care-assessment-algorithm': "An algorithm sets Support at Home funding and assessors lost the power to overrule it. 132 people were reassessed by June 2026; 1,000 reviews were lodged.",
  'bowen-international-travel-cop31': "IPEA data showed Bowen and staff spent $345,000 over 46 days of overseas travel in 2025-26, and department staff were authorised $485,602 for COP31 trips.",
  'keogh-invictus-australia-funding-cut': "The May 2026 Budget did not renew $9 million over 3 years for Invictus Australia, which runs sport-based recovery for veterans. Reversed on 28 May 2026.",
  'keogh-veterans-allied-health-cap': "The May 2026 Budget set a $5,000 annual cap on DVA-funded allied health for veterans from July 2027. After a backlash it was withdrawn in September 2026.",
  'king-inland-rail-consolidated-2026': "In May 2026 Catherine King cut Inland Rail back to Beveridge to Parkes by 2027, citing a cost above $45 billion. The Queensland legs have no date.",
  'oneil-1-2-million-homes-target': "The 1.2 million homes target was 77,000 homes behind pace by April 2026. O'Neil conceded it may not be met but defended it as 'bold and ambitious'.",
  'marles-wong-iran-strikes-legality': "After US and Israeli strikes on Iran in early 2026, Marles and Wong declined to say whether they were lawful: 'a matter for' those countries, Marles said.",
  'albanese-grace-tame-difficult': "In a word-association game on 25 February 2026 Albanese answered 'difficult' to Grace Tame's name. He apologised; Tame called it a 'patronising cop out'.",
  'chalmers-philip-lowe-persistent-critic': "After Philip Lowe wrote that 'handouts' would keep rates higher, Chalmers called the ex-RBA governor 'a fairly persistent critic' since losing the job.",
  'albanese-herzog-invitation': "Albanese had Israeli President Herzog invited to visit in February 2026 after the Bondi attack. Over 1,000 Jewish signatories urged him to rescind it.",
  'marles-defence-estate-sell-off-victoria-barracks': "In February 2026 Marles said Defence would sell up to 86 'underutilised' sites worth about $3 billion, including Sydney's 176-year-old Victoria Barracks.",
  'rowland-hate-laws-israel-genocide-groups': "Asked on 7.30 if a group saying Israel was committing genocide could be banned under the 2026 hate laws, Rowland said 'if those criteria are satisfied'.",
  'albanese-bondi-vigil-booed-apology': "A week after the 14 December 2025 Bondi attack that killed 15 people, Albanese was booed at the vigil. The next day he apologised to the Jewish community.",
  'rowland-perth-family-trip-repayment': "Rowland billed over $21,000 for a July 2023 Perth trip that ended in a family holiday. IPEA found part of it outside the rules; she repaid about $10,000.",
  'farrell-family-travel-highest-spender': "ABC analysis of IPEA data found Farrell, who sets MPs' expense rules, was the largest user of family travel in 2024-25 at $48,178. No breach was alleged.",
  'wells-sporting-events-family-travel-ipea-audit': "Wells self-referred 3.5 years of travel claims after reports of family trips to sporting events. IPEA's audit found four breaches and she repaid $10,116.",
  'wells-new-york-un-trip-flights': "Business-class flights for Wells and two staff to the UN General Assembly in September 2025 cost $94,828. IPEA's May 2026 audit found the trip compliant.",
  'chalmers-super-tax-unrealised-gains-retreat': "On 13 October 2025 Chalmers dropped the tax on unrealised gains in super balances above $3 million after 2 years defending it, and indexed the threshold.",
  'wells-optus-triple-zero-outage-handling': "An Optus upgrade on 18 September 2025 caused about 600 triple-zero calls to fail for 13 hours, with 4 deaths linked. Wells was criticised for her response.",
  'burke-nauru-408m-nzyq-deal': "On an unannounced visit on 29 August 2025 Burke signed a deal paying Nauru $408 million up front plus about $70 million a year to take NZYQ cohort members.",
  'albanese-palestine-recognition-netanyahu-weak': "After Australia moved to recognise Palestine in August 2025, Netanyahu called Albanese 'a weak politician who betrayed Israel'. Recognition: 21 September.",
  'gallagher-pwc-contracts-ban-lifted': "In August 2025 Finance ended PwC's 16-month pause on bidding for federal contracts after the tax-leaks scandal. Greens senator Barbara Pocock: 'gutless'.",
  'collins-live-sheep-package-under-the-radar': "Collins announced the $139.7 million live sheep export transition package at Muchea on 15 July 2025. WA industry bodies said they were not told or invited.",
  'clare-childcare-safety-should-have-been-fixed': "After a Melbourne childcare worker was charged with over 70 offences, Clare said a national Working with Children Check 'should have been fixed yesterday'.",
  'watt-north-west-shelf-approval': "Watt gave final approval in September 2025 for Woodside's North West Shelf gas plant to run to 2070, with rock art conditions. Court challenges followed.",
  'marles-factional-assassin-husic-dreyfus-dumped': "After Husic and Dreyfus were dropped from the frontbench in May 2025, Husic said a deputy prime minister should be 'a statesman, not a factional assassin'.",
  'albanese-plibersek-salmon-epbc-amendment': "In March 2025 Albanese introduced a bill in his own name removing the minister's power to reconsider old approvals, protecting Tasmanian salmon farms.",
  'albanese-chinese-live-fire-notice-claim': "After Chinese live-fire drills in the Tasman on 21 February 2025, Albanese indicated notice had been given. Estimates heard a Virgin pilot found out first.",
  'albanese-qantas-upgrades-joyce-chairmans-lounge-book': "Joe Aston's book alleged Albanese received at least 22 free Qantas upgrades and dealt directly with Alan Joyce. Upgrades were declared; no NACC referral.",
  'albanese-copacabana-house-purchase': "On 15 October 2024 it was reported Albanese was buying a $4.3 million clifftop house at Copacabana, NSW, during the debate over housing affordability.",
  'marles-chief-of-staff-tarnawsky-bullying-complaint': "Jo Tarnawsky, Marles' chief of staff, said she was sidelined after raising a bullying complaint in April 2024. She went to the Federal Court in November.",
  'shorten-speechwriter-620k-contract': "Senate estimates in June 2024 revealed Services Australia paid about $620,499 over two years for a speechwriter working for the agency and for Shorten.",
  'giles-direction-99-visa-reinstatements': "Direction 99, issued by Giles in 2023, told decision-makers to weigh ties to Australia. The AAT cited it to reinstate offenders' visas. Replaced June 2024.",
  'pm-no-more-rally-canberra-2024': "At the 'No More' rally on 28 April 2024, organiser Sarah Williams said Albanese had not offered to speak. He took the microphone and said he had asked.",
  'albanese-stage-3-tax-cuts-broken-promise': "Having promised to keep the stage 3 tax cuts unchanged ('my word is my bond'), Albanese restructured them in January 2024. The Coalition: a broken promise.",
  'oneil-giles-nzyq-detainee-releases': "After the High Court's November 2023 NZYQ ruling, about 140 people were released from detention. O'Neil corrected her remark about 'legal advice'.",
  'husic-gaza-collective-punishment-remarks': "On 19 October 2023 Husic said Palestinians were 'being collectively punished' for Hamas' barbarism. Sussan Ley said he was 'freelancing on foreign policy'.",
  'albanese-son-qantas-chairmans-lounge': "In 2023 it was reported Qantas had granted Chairman's Lounge membership to the Prime Minister's adult son, which other MPs' family members do not receive.",
  'marles-raaf-vip-flights': "Marles' office spent $3.6 million on 155 RAAF special purpose flights from April 2022 to June 2023, second only to the PM, with 70-plus via Avalon.",
  'gallagher-higgins-knowledge-senate-statement': "Leaked messages indicated Higgins and Sharaz contacted Gallagher before the allegation went public. She had told the Senate 'no one had any knowledge'.",
  'rowland-sportsbet-donations': "Sportsbet paid about $8,960 for a March 2022 dinner for Rowland's campaign and gave $10,000 days before the election. She now regulates online gambling.",
  'dreyfus-higgins-settlement-nacc': "The Commonwealth settled Brittany Higgins' claim for $2.4 million in December 2022. Reynolds referred Dreyfus to the NACC: 'no corruption issue arises'.",
  'plibersek-dutton-voldemort-remark': "Days after the May 2022 election Plibersek said Peter Dutton 'looks a bit like Voldemort' on 4BC. She apologised; Dutton: 'water off a duck's back'.",
};

export function controversyDescription(c: Controversy): string {
  return CONTROVERSY_DESC[c.id] ?? clipSentence(c.summary, 155);
}

/** Short label for prev/next links. */
export function shortLabel(c: Controversy): string {
  return controversyTitle(c);
}
