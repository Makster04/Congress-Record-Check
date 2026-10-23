# Congress Record Check

> **Draft, not current.** This is how the whole README will read once the rules in [Political_Scorecard_Metholodgy.md](Political_Scorecard_Metholodgy.md) are built into the app, together with the new data sources they need (see [README_PLANNED_APIS.md](README_PLANNED_APIS.md)). Most of it is not built yet. For what the app does today, see [README.md](README.md). Names marked † are placeholders for files and commands that don't exist yet. Values the methodology lists under "Open decisions" are marked *(placeholder)*.

**What changes from today's README**

- **Grades follow Rule 1:** every vote, sponsorship, cosponsorship and official act counts 1.0, and a speech or statement 0.5, only on issues with no recorded action. Your match and People over profit use these weights; statement-only issues count at half importance.
- **People over profit scores sponsorships as well as votes**, from bills marked People or Profit with a cited CBO, JCT or Tax Policy Center analysis.
- **Promises delivered** counts tagged commitments, and scores a promise never acted on by the end of a term as contradicted.
- **Ethics adds stock trading:** late or missing disclosures and trades in sectors the member's committees oversee lose points; trades near related votes are flagged, not scored.
- **Money & Influence Analysis:** each politician's top 20 donor organizations by month, matched to lobbying on bills they acted on, with two alignment measures and timing flags. It is shown beside the grades, never inside them.
- **Score pages:** each grade gets its own page ranking everyone, with "Not graded" people shown as grey rows.
- **Scores are recalculated monthly** after review, with a log of every change; the data underneath still refreshes daily.
- **New data sources:** cosponsorships, the Congressional Record, hearings, Vote Smart, Bluesky, the Wayback Machine, Open States, congress-legislators, LDA.gov lobbying, stock trades and USAspending.

## Run locally

Requires Node.js 22.13 or later. On a Mac (or Linux), open Terminal in this folder, run `npm ci` the first time, then `npm start`, and visit **http://127.0.0.1:8787**. On Windows, open **Start Congress Record Check.cmd** instead; it installs dependencies if needed. Python 3 is needed only for the by-hand import scripts listed under "Not refreshed automatically".

The local server binds only to your computer. It uses `.local/records.sqlite` and checks the refresh queue once a minute while running. Closing it stops the checks; saved data survives restarts. Nothing has been deployed or subscribed to.

## Enable automatic updates

1. Get the free keys below. Each key unlocks only its own sources, and the app runs without any of them.
2. Copy `.dev.vars.example` to `.dev.vars` in this directory.
3. Enter each key after its name. Keep this file private.
4. Restart the local server. Open **Updates** to see progress.

| Key in `.dev.vars` | Get it at | Unlocks |
|---|---|---|
| `FEC_API_KEY` | [api.open.fec.gov/developers](https://api.open.fec.gov/developers/) | Campaign totals, donors grouped by employer, PAC contributions, outside spending, campaign-committee lookup |
| `CONGRESS_API_KEY` | [api.congress.gov/sign-up](https://api.congress.gov/sign-up/) | Sponsored and cosponsored bills, the Congressional Record |
| `GOVINFO_API_KEY` | [govinfo.gov/api-signup](https://www.govinfo.gov/api-signup) | Floor speeches and hearing transcripts. Leave it blank to try the Congress.gov key; both are api.data.gov keys |
| `VOTESMART_API_KEY` | [votesmart.org/services_api.php](http://votesmart.org/services_api.php) | Issue positions and interest-group ratings |
| `OPENSTATES_API_KEY` | [openstates.org/accounts/signup](https://openstates.org/accounts/signup/) | State legislators' bills, votes and sponsorships |
| `LDA_API_KEY` (optional) | [lda.gov](https://lda.gov/) | Lobbying filings. Works without a key at a lower rate limit |
| `STOCK_TRADES_API_KEY` | [bargo.ai/free-apis/dash](https://www.bargo.ai/free-apis/dash) | Members' stock trades, with late-filing flags |

No key is needed for House and Senate roll calls, Bluesky posts, the congress-legislators files, the Wayback Machine or USAspending. Sources whose key is missing wait on the Updates screen as "Awaiting API keys", and the app shows the reviewed research. The Updates screen distinguishes setup requirements, queued work, successful refreshes, and retrying failures. The button runs the next eight source pages; a large source can require several batches. Frontend keys are never used, and saved request URLs exclude credentials.

## What refreshes

**Money**

- **Campaign totals:** FEC principal committee summaries, on their own reporting dates.
- **Donors by employer:** itemized FEC individual contributions (over $200), grouped by the donor's employer into donor organizations for the top-20 donor tracking. Donors' names are used only for grouping and are never shown, as FEC rules on reusing contributor data require.
- **Campaign committee:** for a candidate whose principal committee is not configured, the FEC candidate-committee lookup, rechecked weekly.
- **PAC contributions:** processed FEC Form 3, Schedule A line 11C, in the selected two-year period. Memo entries are excluded. These contributions are part of campaign receipts.
- **Outside spending:** processed Schedule E with `most_recent=true`. Only general-election entries directly naming the candidate, with dissemination dates within the window, enter the current totals. Support and opposition are separate; opposition to another candidate is not credited to this person. Negative corrections remain. Exact repeated transactions are deduplicated; different transaction IDs remain distinct. Primary/special/unspecified elections, memo entries, future dates and missing dates are separately counted as exclusions.
- **Lobbying:** LDA.gov registrations, quarterly activity reports and lobbyist contribution reports for the tracked donor organizations.
- **Federal contracts:** USAspending contracts and grants to the tracked donor organizations, matched by the company's federal ID (UEI), with uncertain name matches left for review.
- **Stock trades:** members' Periodic Transaction Reports, with trade and filing dates so late reports are flagged. Each trade links to the original House Clerk or Senate eFD filing.

**Record**

- **Legislation:** current-Congress bills and resolutions each member sponsored or cosponsored, from Congress.gov, with official links. Recently updated earlier-Congress bills are excluded. The interface shows up to 100 of each; raw published records are retained.
- **Votes:** the original 50 selected roll calls, the latest 30 Senate roll calls discovered from the official index, and subsequent House roll calls discovered sequentially after the latest House roll in the supplied snapshot. This is not a complete historical voting archive. House positions use Bioguide IDs; Senate positions use LIS IDs from congress-legislators. An unmatched person produces no inferred vote.
- **State legislative records:** Open States bills, votes and sponsorships for profiled people who serve or served in a state legislature, matched by their Open States ID.
- **Committees and member IDs:** the congress-legislators current-members and committee files: committee assignments, plus each member's IDs across systems (Bioguide, FEC, LIS and others), used to match people between sources.

**Statements**

- **Floor speeches:** the Congressional Record from GovInfo, split into individual speeches and matched to members by Bioguide ID.
- **Hearings:** GovInfo hearing transcripts in which a profiled member spoke.
- **Issue positions:** Vote Smart positions and interest-group ratings, requested one person at a time because bulk requests aren't allowed.
- **Social posts:** public Bluesky posts from each member's official accounts in congress-legislators, plus campaign accounts listed in `data/config.json`.
- **Campaign websites:** each new Wayback Machine snapshot of each campaign site, so a promise can be compared with earlier versions after it is edited or deleted.

**Nothing new changes a grade by itself.** New votes, bills, speeches, posts, positions, trades and filings are listed for review; a grade changes only when the reviewed research is updated.

Each source is scheduled again 24 hours after completion, except individual roll calls: a published vote is final and is not fetched again. Vote Smart requests are paced to stay within its limits. All pages must succeed before new records publish. Full replacements pick up revised totals, amendments and removed records instead of appending forever. Failed runs leave the last published snapshot intact and retry with backoff; source `Retry-After` is respected. A database lock prevents overlapping refreshers. The UI provides on-page failure/staleness notices and a refresh history; external email or push alerts are not configured.

Some snapshots can have different check and coverage dates. In particular, checking the FEC today does not create a newer campaign filing. Imported comparisons stay labeled as research snapshots; refreshed records appear separately, under **Latest official records** at the bottom of each profile's tabs, so different reporting windows are not silently mixed:

- **Money & Influence:** campaign totals, donors by employer, PAC contributions, outside spending, lobbying and federal contracts
- **Your match:** sponsored and cosponsored bills, roll calls, state legislative records and committee assignments
- **Promises Delivered:** floor speeches, hearings, issue positions, social posts and campaign-site snapshots
- **Ethics:** stock trades and late-filing flags

**Not refreshed automatically.** These are imported once and rebuilt by hand, so they change only when someone reruns them:

- **Voteview DW-NOMINATE scores**, with the rest of the reviewed research in `public/research.json` (biographies, race ratings, ethics, statement checks, issue coding).
- **Portraits**, from [unitedstates/images](https://github.com/unitedstates/images) plus supplied photos, built by `scripts/build-portraits.py` (see Portraits in the README).
- **Funder timelines**, from FEC bulk files, built by `scripts/build-funder-history.mjs` (see Money and votes over time in the README).
- **Yearly financial disclosures** (holdings and blind trusts), from the House Clerk's yearly downloads and Senate eFD, read with the CapitolGains Python package by `scripts/build-holdings.py` (planned name). Senate eFD has no API, so each import is checked by hand.

## Bundled snapshot

`data/seed.json`, when present, holds published snapshots from a completed refresh, so a new install shows campaign, PAC, outside-spending, legislation and vote data immediately instead of waiting hours, and works without API keys. **None has been committed yet**, so a new install currently starts empty and fills as the refresh runs. The file is loaded only when `.local/records.sqlite` is new; an existing database is never overwritten. Seeded records keep their original check dates, so with API keys an old seed refreshes in the background on the normal schedule. A seed made for a different cycle, Congress or session is ignored.

To update it, let the local server finish its refresh (every job on **Updates** has completed at least once), then run `npm run seed:export` and commit `data/seed.json`. The export stops if any job has not completed yet (`npm run seed:export -- --partial` exports what has), and refuses to write a file containing an API key.

## Scoring rules

The full rules, formulas and worked examples are in [Political_Scorecard_Metholodgy.md](Political_Scorecard_Metholodgy.md), and the Methodology page in the app states the same rules. Every weight, threshold and deduction lives in one place, `public/grades.js`, so changing a value there changes every page, and `npm test` checks each rule.

**Rule 1: actions count more than words.** Sponsoring or cosponsoring a bill, voting on it, and an official act (for officials who don't vote in Congress) each weigh 1.0. A floor speech or public statement weighs 0.5 and is used only on an issue with no recorded action; once a vote, sponsorship or official act exists, it replaces earlier statements. Sponsoring a bill and then voting for it counts once. A Yea or a sponsorship takes the bill's marked side and a Nay the other; missed votes are not counted; if someone says one thing and votes the other way, only the vote is scored. A person who never held federal office but held a state office is scored on that state record, with the same weights.

| Grade | What it measures | Minimum evidence |
|---|---|---|
| **Your match** | How closely the record matches the positions the visitor chose, weighted by the importance they gave each issue. Issues with no evidence are left out; statement-only issues count at half importance | 3 issues with evidence, covering half of the visitor's total importance |
| **Promises delivered** | Whether what they committed to matches what they did: supported 1, partly supported or changed position ½, contradicted 0. Ambiguous and outcome checks, and promises with no related bill yet, are left out. A promise they could have acted on but didn't by the end of the term counts as contradicted | 3 counted checks |
| **Ethics** | Starts at 100. Each case counts once, at its current status: confirmed finding −20, open investigation −15, investigation ended without a finding −5, allegation 0. Stock trading: −2 per late or missing disclosure (up to −10) and −1 per trade in a sector their committees oversee (up to −10) *(placeholder)*. Never below 0 | None: "none located" scores 100% |
| **People over profit** | People-leaning points ÷ (People + Profit points), from votes and sponsorships on bills marked People or Profit, each at its Rule 1 weight. A higher grade means their record works more for lower- and middle-income households | 3 scored actions |

Grades: A 90–100, B 80–89, C 70–79, D 60–69, F below 60, after rounding to a whole percentage. Too little evidence shows "Not graded", never a zero or a guess.

**Not graded:** the ideological position ("More conservative than 48% of the Senate", from Voteview's DW-NOMINATE, Congress only) and the key-vote position ("Conservative side on 4 of 9 marked bills").

## Marking and tagging the reviewed research

These judgments are made by people and stored in `public/research.json`, never by the refresher:

- **Bills marked People or Profit:** each mark is stored once per bill (`bills[]`†) with its side, a short reason and the cited CBO, JCT or Tax Policy Center analysis, so a vote and a sponsorship on the same bill share it: `{"id": "119-hr-1", "pvp": "profit", "why": "...", "src": {"t": "...", "u": "..."}}`. A bill whose analysis shows no clear winner is left unmarked. A tax bill counts as favoring the wealthy when the analysis shows 80% or more of its benefit going to the highest-income households and large corporations *(placeholder)*.
- **Bills marked liberal or conservative:** `liberalSide` / `leanNote` on each issue, as today, for the key-vote position.
- **Promises:** a statement check that is a true commitment carries `"promise": true`†, so vague goals ("fight for families") are not scored. A promise left unacted at the end of the term is closed as contradicted, with the date and reason.
- **Ethics cases:** `status` (allegation, investigation or finding) and, for investigations, `stage` (open or closed). When a case changes, its status is updated rather than a new entry added, so it counts once.
- **Committee sectors:** which industries each committee oversees, for committee-conflict trades, in `data/committee-sectors.json`†.

Who assigns People/Profit and liberal/conservative marks, and how disagreements are settled, is an open decision in the methodology.

## Update process

The data underneath refreshes daily (see What refreshes). Scores are recalculated once a month, after review, matching the monthly donation data:

1. Review everything new since the last update on **Updates**: votes, sponsorships, floor speeches, statements and campaign-site changes, ethics case changes, stock-trade disclosures, donation and lobbying filings.
2. Mark new bills People or Profit from a cited analysis, with the reason.
3. Match new actions to existing promises, and replace earlier statements with votes where Rule 1 applies.
4. Run `npm run scores:monthly`† to recalculate all four scores and rerun the Money & Influence flags.
5. It writes `data/score-log.json`†: which score moved, by how much and why. The Methodology page shows the latest entries.

## Profile tabs

Each profile has six tabs: **Overview**; one tab per grade (**Your match**, **Promises Delivered**, **Ethics**, **People Over Profit**), each opening with its letter, percentage and arithmetic, then the evidence; and **Money & Influence**. Older links such as `#collins-record` or `#collins-funding` open the tab that now holds that content.

- **Overview:** the four grades (each opens its tab), where the campaign's money comes from, outside money for and against, how the record compares with your choices, where they sit politically, whether their words match their actions, and a short ethics list.
- **Your match:** the comparison with the positions you chose, issue by issue, with each action's weight (votes, sponsorships and cosponsorships 1.0; speeches and statements 0.5), sorted by the importance you gave; then the record it is drawn from (ideology, key votes, bills, state record) and the latest official records.
- **Promises Delivered:** each tagged promise and stated position next to what the record shows, with its credit; a stacked bar of supported, partly supported, changed and contradicted, using raw counts.
- **Ethics:** every case, most serious first, with its status and deduction, and a timeline of status changes. A stock-trading section lists late or missing disclosures and committee-conflict trades with their deductions, and shows a filing-delay dot chart (days from trade to disclosure, with a line at 45 days), trades by sector (committee-overseen sectors highlighted), and a trade-and-vote timeline with flagged trades. Spouse and dependent-child trades are labeled. Returns are not scored or ranked. State-only officials show "No trading data".
- **People Over Profit:** every scored vote and sponsorship with the bill's mark, reason and source; a diverging bar centered at 50%; a tree map of the top 20 donors (People-aligned, Profit-aligned, Other); and what their funders wanted next to how they voted.
- **Money & Influence:** the Money & Influence Analysis (below), then where the campaign's money comes from, outside money for and against (by sector, colored People- or Profit-aligned, with the for-to-against ratio), every PAC contribution and outside-spending item, and the latest official filings.

## Money & Influence Analysis

Shown beside the grades, never inside them. It shows timing and alignment, not proof that money caused a decision.

- **Top donors by month:** the politician's top 20 donor organizations in the current cycle, combining each organization's PAC and its employees' contributions (FEC itemized receipts, grouped by employer; donors' names are never shown), grouped by organization and industry.
- **Who had a stake:** organizations that lobbied on each bill, from LDA.gov reports, matched to the bills the politician acted on.
- **Vote Donor Alignment:** of the votes and sponsorships on bills a top donor lobbied on, the share that went the donor's way. **Speech Donor Alignment:** the same for speeches on issues the donor lobbied on.
- **Timing flags** (for review, not scored), within a 6-month window *(placeholder)*: donations from an organization rose 50% or more around a decision in its favor, or fell 50% or more after one against it; the politician changed position after a 50% shift in donations from an organization that lobbied on the issue; or the politician held or traded stock in an organization that also donated and lobbied on a bill they acted on. Each flag lists the organization, its monthly totals, the decision and the dates.
- **Federal contracts** to the top donor organizations, from USAspending, as context.
- **Chart:** monthly donations from each top donor, with markers for related votes, speeches and stock trades, and flagged moments highlighted.

Outside spending is shown as a plain number, not a grade: the politician cannot legally coordinate with those groups, and the amounts mostly reflect how competitive the race was.

## Score pages

Each grade has its own page† in the top menu, ranking every politician. Each shows how many data points sit behind every grade, and people who are "Not graded" appear as grey rows rather than being left out. Gauges, pie charts and radar charts are not used.

- **Your match:** ranked bars by match, colored by grade.
- **Promises delivered:** a stacked bar per politician, in raw counts, so a grade built on 3 checks looks different from one built on 20.
- **Ethics:** stacked bars of points lost (findings, open and closed investigations, late disclosures, committee-conflict trades) for people with deductions, and "X of 59 have no recorded cases".
- **People over profit:** a diverging bar centered at 50%, and People over profit plotted against DW-NOMINATE position to spot outliers.
- **Ideological position:** the whole chamber on the DW-NOMINATE scale, with the selected politician highlighted.

## Home cards

Each card has a **Report Card** (the four grades) and a **Money & Influence Analysis** section: campaign funds raised, outside money for and against, and outside money by month with the for-to-against ratio, for example "2.1 : 1" (more for) or "1 : 2.1" (more against), or "no opposing spending" when nothing was spent against them.

## Portraits

Home cards show a cut-out portrait standing in a party-colored circle; anyone without a photo shows initials in the same circle. Photos are official congressional portraits (public domain) from the [unitedstates/images](https://github.com/unitedstates/images) project, plus photos supplied for use here, kept in `data/portraits/` and listed with their credit in `scripts/portrait-extra.json` (these take precedence over the official one). `scripts/build-portraits.py` downloads the official photos, removes the background with MediaPipe, scales and places every face the same way, and writes `public/portraits/<id>.webp` plus `public/portraits/index.json` (who has a photo, its source and credit). To rebuild:

```
python3 -m venv .local/pv
.local/pv/bin/pip install mediapipe==0.10.14 pillow
.local/pv/bin/python scripts/build-portraits.py            # add --refresh to download the photos again
.local/pv/bin/python scripts/build-portraits.py --only osborn,alme   # rebuild just those people
```

To add or replace a photo, save one you have permission to use as `data/portraits/<id>.jpg`, list it in `scripts/portrait-extra.json` with its credit, and rebuild: `"talarico": {"file": "data/portraits/talarico.jpg", "credit": "Photo: Talarico campaign, used with permission"}`. If a cut-out keeps a light halo from a bright background, add `"tighten": true` and `"choke": 2` to that entry (as for El-Sayed and Jackson) and rebuild. If something wider than the frame, like a hat brim, is cut off on one side, `"nudge": <px>` moves the portrait sideways, and `"zoom": 0.85` shrinks it when it is wider than the whole frame (as for Byrd). A photo that is already a transparent PNG cut-out keeps its own outline.

## Money and votes over time

On the People Over Profit tab, each funder comparison has a timeline of that organization's money to or about the candidate since January 2019, with the compared votes on the same axis. `public/funder-history.json` holds the month-by-month figures. Rebuild it with `node scripts/build-funder-history.mjs` (downloads about 90 MB of FEC bulk files into `.local/fec-bulk/`; add `--refresh` to fetch newer files). The Money & Influence Analysis's monthly top-donor figures come from the daily FEC refresh instead, and the bulk build remains for the history before 2025.

## Reviewed research

`public/research.json` contains the original researched snapshot, including biographies, race ratings, Voteview scores, ethics, statements, industry classifications and alignment coding. Edit this file to publish reviewed changes; refresh jobs never rewrite it. Its contents were preserved from the supplied document, not independently fact-checked by this conversion.

`data/config.json` defines source identifiers and the election/Congress to track. Coverage is fixed to the supplied 2026 candidate set until reviewed and updated. Review candidate/committee relationships and election-cycle configuration before moving to a new cycle. `scripts/import-original.mjs` is a one-time extraction tool; rerunning it overwrites the imported frontend/research files.

Job definitions are seeded on the first launch. Changing the tracked population or cycle also requires migrating the existing job definitions or starting a new database after backing up `.local/`. Editing research prose does not require a database reset.

## Current status

Before grades go public: review every ethics tag and open/closed label and the liberal/conservative marks, fact-check the original research file, add People over profit bills with cited analyses, and tag true campaign promises. The checklist and the open decisions (deduction values, weights, partial credit, the 80% rule, flag thresholds, who marks bills, state bills, trading deductions) are in [Political_Scorecard_Metholodgy.md](Political_Scorecard_Metholodgy.md).

## Checks

Run `npm test` for the refresher (pagination, transaction deduplication, negative corrections, API identity validation, precision-safe IDs, stale-data preservation, atomic publication, never re-fetching a published vote, the bundled seed, refresh locking and request protection), for every scoring rule (Rule 1 weights and one credit per bill, statement-only issues at half importance, end-of-term promises, each Ethics deduction and cap, People over profit points, the money ratio), for the Money & Influence measures and flags, and for the reviewed data (ideology marks, Overview inputs, funder timelines, portraits). Run `npm run check` for syntax and import validation.

Each new source's adapter is covered by representative response tests. Authenticated live refreshes require your API keys; they are not claimed as verified without them.

## Deploy later to Cloudflare

The local and Cloudflare servers share the same refresh and API implementation. There is no separate frontend build.

1. `npx wrangler login`
2. `npx wrangler d1 create congress-record-check`
3. Put the returned database ID in `wrangler.jsonc`.
4. `npm run db:migrate`
5. `npx wrangler secret put FEC_API_KEY`, then the same for `CONGRESS_API_KEY`, `GOVINFO_API_KEY`, `VOTESMART_API_KEY`, `OPENSTATES_API_KEY`, `LDA_API_KEY` and `STOCK_TRADES_API_KEY` (skip any you don't use)
6. `npm run cloudflare:deploy`

The hosted cron checks every five minutes, processing up to eight source pages per invocation. Use the Workers paid plan for the configured CPU allowance. D1 and Worker usage may incur charges beyond included allowances; this project does not enable billing or create any cloud resources by itself. The hosted database begins empty and fills from official sources; the reviewed snapshot is bundled with the static assets. Local SQLite files and API keys are excluded from deployment.

Deployment remains a later manual step because this version was requested to stay local.

## Planned `.dev.vars.example`

Leave every key blank in the example file. Real keys go only in your own `.dev.vars`, which Git ignores.

```
# Save a copy as .dev.vars. Keep this file on your computer; never commit actual keys.
# Leave a key blank to skip its sources; the app still runs on the reviewed research.

# FEC: campaign totals, donors by employer, PAC contributions, outside spending
# https://api.open.fec.gov/developers/
FEC_API_KEY=
# Congress.gov: sponsored and cosponsored bills, the Congressional Record
# https://api.congress.gov/sign-up/
CONGRESS_API_KEY=
# GovInfo: floor speeches and hearing transcripts. Leave blank to try the Congress.gov key.
# https://www.govinfo.gov/api-signup
GOVINFO_API_KEY=
# Vote Smart: issue positions and interest-group ratings
# http://votesmart.org/services_api.php
VOTESMART_API_KEY=
# Open States: state legislators' bills, votes and sponsorships
# https://openstates.org/accounts/signup/
OPENSTATES_API_KEY=
# Optional. LDA.gov: lobbying filings (works without a key at a lower rate limit)
# https://lda.gov/
LDA_API_KEY=
# Bargo: members' stock trades, with late-filing flags
# https://www.bargo.ai/free-apis/dash
STOCK_TRADES_API_KEY=

# No key needed: House and Senate roll calls, Bluesky, congress-legislators,
# Wayback Machine, USAspending.

# Local refresh runs automatically while npm start is running.
LOCAL_AUTORUN=true
# Optional: change the local port.
PORT=8787
```

When hosting on Cloudflare, each key also needs its own `npx wrangler secret put` step (see Deploy later to Cloudflare).

## Files

- `public/` — the site: `app.js` (pages), `live.js` (Updates and latest official records), `grades.js` (every scoring rule, weight and threshold, and the outside-money ratio), `lean.js` (liberal/conservative bill marks), `research.json` (reviewed research), `funder-history.json`, `portraits/`
- `src/sources.mjs` — official-source adapters and validation, one per source
- `src/refresh.mjs` — persistent jobs, staging and publication
- `src/worker.mjs` — Cloudflare API and scheduled handler
- `scripts/local.mjs` — localhost server using the same backend
- `scripts/scores-monthly.mjs`† — the monthly recalculation and change log (`npm run scores:monthly`)
- `scripts/build-funder-history.mjs`, `scripts/build-portraits.py`, `scripts/build-holdings.py`† — rebuilt by hand
- `scripts/export-seed.mjs` — writes `data/seed.json` (`npm run seed:export`)
- `data/config.json` — who and which election and Congress are tracked, with each person's IDs; `data/committee-sectors.json`† — sectors each committee oversees; `data/score-log.json`† — every score change; `data/portraits/` and `scripts/portrait-extra.json` — supplied photos and their credits
- `migrations/` — portable SQLite/D1 schema
- `test/` — regression tests
- `Political_Scorecard_Metholodgy.md` — the scoring methodology; `OTHER_API_SOURCES_TO_CONSIDER.md` — free data sources

Sources: [FEC API](https://api.open.fec.gov/developers/) and [bulk files](https://www.fec.gov/data/browse-data/?tab=bulk-data), [Congress.gov API](https://github.com/LibraryOfCongress/api.congress.gov), [GovInfo](https://api.govinfo.gov/docs), [Senate roll calls](https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_2.htm), [House Clerk](https://clerk.house.gov/Votes), [Voteview](https://voteview.com), [Vote Smart](http://votesmart.org/services_api.php), [Bluesky](https://docs.bsky.app/docs/category/http-reference), [Wayback Machine](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server), [Open States](https://v3.openstates.org/docs/), [congress-legislators](https://github.com/unitedstates/congress-legislators), [LDA.gov](https://lda.gov/), [Bargo](https://www.bargo.ai/free-apis/congress/v1), [USAspending](https://api.usaspending.gov/), [unitedstates/images](https://github.com/unitedstates/images); People over profit marks from the [Congressional Budget Office](https://www.cbo.gov), the [Joint Committee on Taxation](https://www.jct.gov) and the [Tax Policy Center](https://www.taxpolicycenter.org).

# Public Ledger
### Follow the money. Check the record. Find your alignment.

<img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/fa265870-665c-41b5-8ec7-2bce1c1c7391" />

Public Ledger helps voters understand **who funds their elected officials, how they vote, and whether their actions match their promises**.

The platform brings complex public records into one easy-to-read **candidate scorecard**, helping users explore:

- **Campaign Funding:** Who financially supports a candidate and how funding patterns relate to their legislative record.
- **Legislative Record:** Bills introduced, sponsored, and voted on, with plain-language summaries of their purpose and potential effects.
- **Promises vs. Actions:** How campaign promises and public statements compare with documented actions.
- **Ethics & Accountability:** Documented ethics history, clearly distinguishing ongoing investigations from confirmed violations.
- **Funder–Legislation Connections:** Compare funders’ public positions on bills with the actions of politicians they support, highlighting shared interests and potential influence without assuming causation.
- **Voter Alignment:** How candidates’ records and stated positions align with users’ policy priorities.

Our goal is to **make political accountability accessible** through clear, source-backed information that helps voters make informed choices.
