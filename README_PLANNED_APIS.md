# Planned README: with the new data sources

> **Draft, not current.** This is how the README's setup and refresh sections will read once the new sources in [OTHER_API_SOURCES_TO_CONSIDER.md](OTHER_API_SOURCES_TO_CONSIDER.md) are built. None of the new sources are connected yet. For what the app does today, see [README.md](README.md). For the whole README once the methodology's rules are also built, see [README_PLANNED_RULES.md](README_PLANNED_RULES.md).

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

When hosting on Cloudflare, each new key also needs its own `npx wrangler secret put <NAME>` step, like the two existing keys in the README.

## Choices behind this draft

- **State records: Open States only.** It covers the same state bills and votes as LegiScan without a monthly query cap, so LegiScan isn't used.
- **Speeches: the GovInfo API directly.** The refresher runs in JavaScript, so the `crec` Python package isn't needed for automatic updates.
- **Stock trades: one source, Bargo,** because it includes the late-filing flag the Ethics rule needs (−2 per late report). Eulerpool, Capitol API and Financial Modeling Prep are backups.
- **Senate votes switch to LIS IDs** from congress-legislators, replacing today's surname-and-state matching.
- **Donor names stay hidden:** FEC rules restrict reusing individual contributors' information, so donors are grouped by employer and names are never shown.
