This was the plan for building the rules in `1_Political_Scorecard_Metholodgy.md` and the sources in `2_API_SOURCES_TO_CONSIDER.md`. **It was built on October 24, 2026**, and `README.md` now describes the result. Below is what was added, changed and removed, with notes where the build differs from the plan, and what is still open.

## WHATS NEW:

**New data the app fetches automatically** (each with representative tests; no live response has been checked yet, since the keys are yours)

- **Cosponsored bills** (Congress.gov, existing key)
- **Individual donors grouped by employer** (FEC, existing key), totals and then month by month for the top 20 employers; donors' names are never kept
- **Floor speeches and hearing transcripts** (GovInfo, new key or the Congress.gov key)
- **Issue positions and interest-group ratings** (Vote Smart, new key)
- **State legislative records** (Open States daily and LegiScan weekly together, two new keys)
- **Officials' public posts** (Bluesky, no key), for accounts added by hand, since congress-legislators lists none
- **Campaign-website snapshots** (Wayback Machine, no key)
- **Committee assignments and members' IDs across systems** (congress-legislators, no key), by hand with `scripts/build-ids.mjs`
- **Lobbying filings** (LDA.gov, optional key) for each person's top donor organizations
- **Stock trades from three services at once** (Bargo, Eulerpool and Financial Modeling Prep), checked against the House Clerk's official filing index. Bargo's published description has no late-filing field, so lateness comes from the dates
- **Federal contracts to donor companies** (USAspending, no key), matched through companies' federal IDs (SAM.gov, new key)
- **House votes from 2023 on** (Congress.gov's House vote endpoint when its key is set; the House Clerk stays the fallback), **bill details** (summaries, amendments, CBO estimates, committee reports) for key bills, and **CRS reports** matched to the bills they cover
- **Official acts** (Federal Register, no key), for people given a `federalRegister` setting (Donald Trump, the featured profile)
- **Official committee lists** (Senate.gov and House Clerk files, no key), compared daily with the reviewed list, plus Wikidata IDs for candidates who never served (looked up by FEC ID when Wikidata is reachable)
- **Fact-checks of politicians' claims** and **officials' YouTube videos** (one Google key for both), and **news coverage** (GDELT, no key, and the New York Times, new key)
- **Committee meetings, witnesses and testimony**: through Congress.gov's committee-meeting endpoint, which serves the House Document Repository's files, instead of reading the repository's pages
- **Donor companies' comments on federal rules** (Regulations.gov, new key or the Congress.gov key)
- **Ethics leads:** court records (CourtListener, free account token, weekly), FEC enforcement records (existing FEC key), DOJ press releases (no key)
- **Company industry codes** for stock trades (SEC EDGAR, no key; asks for a contact line)
- **Groups behind outside spending** (ProPublica Nonprofit Explorer, no key) and **foreign lobbying** (FARA, no key). IRS 527 data is a bulk download only, so 527 spenders link to the IRS search instead of refreshing

**New scoring features**
- **Rule 1 weights:** votes, sponsorships, cosponsorships and official acts count 1.0; speeches and statements 0.5, only on issues with no recorded action.
- **Stock trading in the Ethics grade:** −2 per late disclosure and −1 per committee-conflict trade, each capped at −10. Trades near related votes are flagged but not scored. Only reviewed trades count.
- **End-of-term rule:** a promise they could have acted on but didn't counts as contradicted.
- **Promise tags:** `promise: true` for true commitments, `vague: true` for goals left unscored.
- **People over Profit also scores sponsorships and cosponsorships,** from a per-bill list of marks.
- **Overlapping sources are merged:** the same trade, state bill or article from several sources appears once, and the official record wins when they disagree; disagreements go to review.
- **Ethics leads are reviewed before scoring:** listed apart from scored cases.

**New Money & Influence Analysis** (shown beside the grades, never inside them)
- Vote Donor Alignment, from the reviewed funder research (groups that gave and took public positions on votes)
- Monthly donations from those groups since 2019, with vote markers, and from the daily refresh the top 20 donor organizations this cycle (PAC plus employees) and their employees' giving by month
- Timing flags: 50% donation swings around a decision, position changes after a donation shift, stock in a donor
- Who had a stake: lobbying reports from top donors naming bills the person acted on
- **Speech Donor Alignment is not measured yet:** speeches need to be coded by issue and side first

**New pages and charts**
- **Score pages** under a **Scores** menu item (one page per grade plus ideology), with "Not graded" people as grey rows
- **Ethics tab:** case timeline; for reviewed trades a filing-delay dot chart, trades by sector and a trade-and-vote timeline; the latest trades and leads below
- **People Over Profit tab:** a diverging bar and a top-20 donor tree map
- **Money & Influence tab:** the analysis above, and outside spending split by sector, colored People- or Profit-aligned
- **"Latest official records"** on the Promises Delivered and Ethics tabs, as well as Your match and Money & Influence

**New files and commands**
- `npm run scores:monthly` (`scripts/scores-monthly.mjs`): the monthly recalculation
- `public/score-log.json` (not `data/`, so the Methodology page can show it): every score change and why; the first entry is recorded
- `public/committee-sectors.json` (draft) and `public/sectors.js`: which industries each committee oversees, and sectors from SEC industry codes
- `public/committees.json` and `scripts/build-ids.mjs`
- `scripts/build-holdings.py`: yearly holdings, blind trusts and Senate transaction reports, imported by hand with CapitolGains into `data/holdings-review.json`
- `src/feeds.mjs`, `src/merge.mjs`, `public/scoring.js`, `public/influence.js`, `public/charts.js`
- Thirteen new keys plus an SEC contact line in `.dev.vars.example` (all blank) and the Cloudflare secret list
- Tests for every new rule, measure and data source (72 in all)

## CHANGED (works differently)

- **Your match:** issues backed only by statements count at half importance; actions are weighted, and a vote and a sponsorship on the same bill count once.
- **People over Profit:** points from votes, sponsorships and cosponsorships, needing 3 scored actions.
- **People/Profit bill marks:** stored once per bill (`bills` in `public/research.json`) instead of on each vote.
- **Senate vote matching:** official LIS IDs instead of surname plus state.
- **House votes:** from Congress.gov from 2023 on when its key is set; the House Clerk's files otherwise.
- **Committee assignments:** the reviewed list from congress-legislators, with the official Senate and House lists checked daily and differences flagged.
- **Grade timing:** Promises, Ethics and People over Profit are recalculated monthly after review, with a change log. The page still computes grades from the reviewed research, and marks a grade that changed since the last monthly run. Your match stays live.
- **Outside spending chart:** a sector chart, colored People- or Profit-aligned, was added beside the existing group-type charts. Outside spenders' sectors are assigned from their names and need review.
- **Ratio badge:** "No opposing spending" instead of "all for".
- **Sponsored bills list:** sponsored and cosponsored bills, up to 100 of each.
- **Existing databases** gain the jobs for new sources, people and key bills on the next start.

## UPDATED (same thing, new content)

- **README.md:** rewritten from `3_ALT_README.md` to describe what was built.
- **Methodology page in the app:** the new rules, score pages, the analysis, what refreshes and how sources merge, and the latest change-log entries.
- **`data/config.json`:** each person's IDs (LIS, Vote Smart, Wikidata, Ballotpedia and others), social accounts, campaign site, state legislature, `inOffice`, and the `keyBills` list.
- **`public/research.json`:** an empty `bills` list, ready for marks. Promise tags and end-of-term closures are supported but not yet applied to the research.
- **`.dev.vars.example`:** every key, blank.
- **Updates screen:** every source and key, with which keys are set.
- **`src/sources.mjs`:** its approved-sites list grew from 4 sites to 29, each with how its key is sent.

## DELETED (removed)

- **Senate surname-and-state matching** (replaced by LIS IDs)
- **The per-vote `pvp` field** (moved to the per-bill list)
- **`3_ALT_README.md`** (it became `README.md`)
- **Kept, not deleted:** "Money and votes by issue" on the People Over Profit tab, since the plan left it for you to decide.
- **Not used at all:** the `crec` package and Capitol API, because they repeat work already done.
- **Never usable:** sources that are shut down, closing or paid, listed in `2_API_SOURCES_TO_CONSIDER.md`.

## Stays the same

- The six tabs and their names
- The home-card layout (Report Card, Money & Influence Analysis), portraits, and dark theme
- The My alignment quiz
- The A–F scale and "Not graded" rule
- The current ethics deductions (−20, −15, −5)
- Funder timelines and funders-vs.-votes
- Campaign totals, PAC and outside-spending refreshes
- Old links like `#collins-record`

## Still open

- **Placeholders to decide:** the trading deductions, the 80% rule, the flag thresholds (top 20, 50%, 6 months), who marks bills, the committee-sector list and the outside-spender sectors.
- **Reviewed research to add:** People/Profit bill marks with cited analyses, promise tags, end-of-term closures, reviewed trades, Bluesky accounts.
- **Check once your keys are in:** every new source's live response. The least certain formats are Eulerpool's path and fields, the LDA.gov API host, the Senate committee XML, the FEC legal-search fields, the DOJ title filter and the FARA registrant list. A source that answers in an unexpected shape stops with an error on the Updates screen and keeps its last published records.
- **Not built yet:** Speech Donor Alignment, lobbyist contribution reports, OGE disclosures and state campaign finance.
- **Earlier questions still open:** whether Senate eFD's terms allow your use (the holdings script asks you to confirm), whether CourtListener's free limit of about 125 requests a day is enough, who confirms an ethics lead before it is scored, and whether Financial Modeling Prep's free plan includes congressional trades.
