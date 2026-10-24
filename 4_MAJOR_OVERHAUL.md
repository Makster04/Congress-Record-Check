Here's everything that would change if you build what's in `3_ALT_README.md`, compared with the project today. Nothing has been changed yet.

## WHATS NEW:

**New and a lot more existing data the app would fetch automatically**

- **Cosponsored bills** (Congress.gov, existing key)
- **Individual donors grouped by employer** (FEC, existing key), for the top-20 donor tracking
- **Floor speeches and hearing transcripts** (GovInfo, new key)
- **Issue positions and interest-group ratings** (Vote Smart, new key)
- **State legislative records** (Open States and LegiScan together, two new keys)
- **Officials' public posts** (Bluesky, no key)
- **Campaign-website snapshots** (Wayback Machine, no key)
- **Committee assignments and members' IDs across systems** (congress-legislators, no key)
- **Lobbying filings** (LDA.gov, optional key)
- **Stock trades from three services at once** (Bargo with its late-filing flag, Eulerpool, and Financial Modeling Prep if its free plan includes them; three new keys), checked against the official House and Senate filings
- **Federal contracts to donor companies** (USAspending, no key), matched through companies' federal IDs (SAM.gov, new key)
- **House votes from 2023 on, bill summaries, amendments and CRS reports** (Congress.gov, existing key)
- **Official acts** such as executive orders (Federal Register, no key)
- **Official committee lists** (Senate.gov and House Clerk files, no key), plus Wikidata IDs for candidates who never served (no key)
- **Fact-checks of politicians' claims** and **officials' YouTube videos** (one new Google key for both), and **news coverage** (GDELT, no key, and the New York Times, new key)
- **Committee documents and witness testimony** (House Document Repository, no key)
- **Donor companies' comments on federal rules** (Regulations.gov, new key; the Congress.gov key may work)
- **Ethics leads:** court records (CourtListener, free account token), FEC enforcement records (existing FEC key), DOJ press releases (no key)
- **Company industry codes** for stock trades (SEC EDGAR, no key; asks for a contact email)
- **Groups behind outside spending** (ProPublica Nonprofit Explorer and IRS 527 data, no key) and **foreign lobbying** (FARA, no key)

**New scoring features**
- **Rule 1 weights:** votes, sponsorships, cosponsorships and official acts count 1.0; speeches and statements 0.5.
- **Stock trading in the Ethics grade:** −2 per late disclosure and −1 per committee-conflict trade, each capped at −10. Trades near related votes are flagged but not scored.
- **End-of-term rule:** a promise they could have acted on but didn't counts as contradicted.
- **Promise tags:** separate true commitments from general statements.
- **People over Profit also scores sponsorships,** not only votes.
- **Overlapping sources are merged:** the same trade, state bill or article from several sources appears once, and the official record wins when they disagree; disagreements go to review.
- **Ethics leads are reviewed before scoring:** a court record, enforcement record, DOJ release or news item becomes a scored case only after its status is confirmed from an official record.

**New Money & Influence Analysis** (shown beside the grades, never inside them)
- Top 20 donor organizations by month (PAC plus employees)
- Lobbying matched to the bills they acted on
- Vote Donor Alignment and Speech Donor Alignment
- Timing flags (50% donation swings, position changes, stock overlap)

**New pages and charts**
- **Five score pages** in the top menu, each ranking everyone on one grade, with "Not graded" people shown as grey rows
- **Ethics tab:** a stock-trading section with a filing-delay dot chart, trades by sector, a trade-and-vote timeline, and a case-status timeline; new court, FEC enforcement and DOJ items listed as leads, apart from scored cases
- **People Over Profit tab:** a diverging bar and a top-20 donor tree map
- **Money & Influence tab:** a monthly top-donor chart with vote, speech and trade markers; the nonprofit and 527 filings of groups behind outside spending
- **"Latest official records"** sections on the Promises Delivered tab (speeches, hearings, positions, posts, site snapshots, fact-checks, news) and the Ethics tab (trades, court, enforcement and DOJ items). Today only Money & Influence and Your match have them

**New files and commands**
- `npm run scores:monthly`: the monthly recalculation
- `data/score-log.json`: every score change and why
- `data/committee-sectors.json`: which industries each committee oversees
- `scripts/build-holdings.py`: yearly holdings, blind trusts, and trades older than 3 months, imported by hand with CapitolGains
- Thirteen new keys in `.dev.vars` and in the Cloudflare secrets (GovInfo, Vote Smart, Open States, LegiScan, LDA (optional), Bargo, Eulerpool, Financial Modeling Prep (optional), CourtListener, Google, New York Times, Regulations.gov, SAM.gov), plus an SEC contact line
- Tests for every new rule, measure and data source

## CHANGED (works differently)

- **Your match:** issues backed only by statements count at half importance (today, full importance). Actions are weighted, and cosponsorships and speeches are included.
- **People over Profit:** points from votes and sponsorships, needing 3 scored actions (today: votes only, 3 votes).
- **People/Profit bill marks:** stored once per bill instead of on each vote, so a vote and a sponsorship on the same bill share one mark.
- **Senate vote matching:** uses official LIS IDs instead of surname plus state.
- **House votes:** from 2023 on, they come from Congress.gov's House vote endpoints instead of the House Clerk's files; older votes stay on the Clerk's files.
- **Committee assignments:** from the official Senate and House lists, with congress-legislators kept for IDs and social accounts.
- **Grade timing:** Promises, Ethics and People over Profit are recalculated monthly after review, with a change log. Today they're computed live from the research file. Your match stays live, since it depends on each visitor's answers.
- **Outside spending chart:** split by industry sector and colored People- or Profit-aligned. Today it's split by group type: super PAC, party, other.
- **Ratio badge:** shows "no opposing spending" instead of "all for" when nothing was spent against them.
- **Sponsored bills list:** sponsored and cosponsored bills, up to 100 of each.

## UPDATED (same thing, new content)

- **README.md:** replaced by the contents of `3_ALT_README.md`.
- **Methodology page in the app:** rewritten to match `1_Political_Scorecard_Metholodgy.md` (Rule 1, stock trading, sponsorships, the analysis, the monthly log).
- **`data/config.json`:** each person gains IDs for the new sources (LIS, Open States, Bluesky accounts, campaign-site addresses).
- **`public/research.json`:** a list of marked bills, promise tags, and promises closed at end of term.
- **`.dev.vars.example`:** thirteen new blank key lines and an SEC contact line.
- **Updates screen:** many more sources listed.
- **`src/sources.mjs`:** its approved-sites list grows from 4 sites to about 30.

## DELETED (removed)

- **Senate surname-and-state matching** (replaced by LIS IDs)
- **The per-vote `pvp` field** (moved to the per-bill list)
- **`3_ALT_README.md`,** once it becomes the real README
- **"Money and votes by issue"** on the People Over Profit tab, most likely, since Vote Donor Alignment covers the same ground. The draft doesn't keep it, so you'd need to decide.
- **Not used at all:** the `crec` package and Capitol API, because they repeat work already done (the GovInfo API is used directly, and CapitolGains reads the same filings as Capitol API). Every source with a free key that can run alongside the others is used.
- **Never usable:** sources that are shut down, closing or paid (Google's representative lookup, GovTrack, the Stock Watcher sites, Lambda Finance, Quiver, EODHD, Ballotpedia, Cicero, BallotReady, PACER), listed in `2_API_SOURCES_TO_CONSIDER.md`.

## Stays the same

- The six tabs and their names
- The home-card layout (Report Card, Money & Influence Analysis), portraits, and dark theme
- The My alignment quiz
- The A–F scale and "Not graded" rule
- The current ethics deductions (−20, −15, −5)
- Funder timelines and funders-vs.-votes
- Campaign totals, PAC and outside-spending refreshes
- Old links like `#collins-record`

**Still to decide before building:** several values are placeholders from your "Open decisions" list, including the trading deductions, the 80% rule, the flag thresholds, and who marks bills. Four new ones came from checking the sources: whether to import trades older than Bargo's 3 months (and whether Senate eFD allows automated access), whether CourtListener's free limit of about 125 requests a day is enough, who confirms an ethics lead before it is scored, and whether Financial Modeling Prep's free plan includes congressional trades. Any of those could change the details above.
