Everything the scoring overhaul changed, built on October 24, 2026, grouped by where each change happens: the site, the scoring methodology, and the repo. Each item appears once. `4_MAJOR_OVERHAUL.md` has the same changes with what is still open.

## 1. The site (what visitors see)

**Added**
- **A Scores menu with five pages,** each ranking everyone on one grade (plus ideology), with "Not graded" people shown as grey rows and the data behind each grade.
- **Money & Influence tab:**
  - The Money & Influence Analysis: Vote Donor Alignment, monthly donations from groups with public positions (with vote markers), timing flags, and from the daily refresh the top 20 donor organizations and the lobbying on bills the person acted on
  - Outside spending split by sector, colored People- or Profit-aligned, with the for-to-against ratio
  - Latest records: donors by employer, lobbying, foreign-agent registrations, rule comments, company IDs, federal contracts and the nonprofits behind outside spending
- **Ethics tab:**
  - A case timeline
  - A stock-trading section with the points each item costs, a filing-delay chart, trades by sector and a trade-and-vote timeline
  - Latest records: trades from three services checked against the official House filings, court records, FEC enforcement records and DOJ press releases, as leads
- **People Over Profit tab:** scored sponsorships, a diverging bar, and a top-20 donor tree map.
- **Promises Delivered tab:** "Promise" and "Vague goal" labels, promises closed at the end of a term, and latest records (floor speeches, hearings and testimony, Vote Smart, fact-checks, videos, Bluesky posts, campaign-site snapshots and news).
- **Your match tab:** cosponsored bills, committee assignments with the sectors each committee oversees, state legislative records, CRS reports, and each action's weight.
- **Updates page:** every source, every key and whether it is set.
- **Each grade tab** says when it was last recalculated.

**Changed**
- **Ratio badge:** says "No opposing spending" instead of "all for".
- **Methodology page:** rewritten for the new rules, with the monthly change log.

**Kept** (the plan left it to you)
- **"Money and votes by issue"** on People Over Profit.

## 2. The methodology (how grades are scored)

**Added**
- **Rule 1 weights:** votes, sponsorships, cosponsorships and official acts count 1.0; speeches and statements count 0.5, only where there's no recorded action. A vote and a sponsorship on the same bill count once.
- **Stock trading in Ethics:** −2 per late disclosure and −1 per committee-conflict trade, each capped at −10. Trades near related votes are flagged, not scored.
- **Promise tags:** only true commitments are scored; vague goals and promises with no related bill yet are left out.
- **End-of-term rule:** a promise they could have acted on but didn't counts as contradicted.
- **Money & Influence Analysis measures:** Vote Donor Alignment and timing flags (50% donation swings within six months, position changes, stock overlap). They're shown beside the grades and never affect them. Speech Donor Alignment waits on speeches being coded.

**Changed**
- **Your match:** issues backed only by statements count at half importance.
- **People over Profit:** scores votes, sponsorships and cosponsorships and needs 3 scored actions.
- **Grade timing:** Promises, Ethics and People over Profit are recalculated monthly after review, with a change log. Your match stays live.

## 3. The repo (code, data and files)

**Added**
- **About 30 new data feeds** in `src/feeds.mjs`, merged in `src/merge.mjs`, with about 1,000 refresh jobs added to existing databases automatically.
- **Thirteen new API keys and an SEC contact line** in `.dev.vars.example` (all blank) and the Cloudflare setup.
- **The monthly scoring command** (`npm run scores:monthly`) and its change log (`public/score-log.json`).
- **Committee files:** `public/committees.json` and the draft `public/committee-sectors.json`, with `public/sectors.js` for industry codes.
- **Scripts run by hand:** `scripts/build-ids.mjs` (IDs and committees) and `scripts/build-holdings.py` (yearly holdings and older trades, for review).
- **More IDs for each person** in `data/config.json` (LIS, Vote Smart, Wikidata and others, social accounts, campaign sites, state legislatures).
- **A per-bill list of People/Profit marks** (`bills`) in `public/research.json`, empty until bills are reviewed.
- **Shared modules** for each person's grades (`public/scoring.js`), the analysis (`public/influence.js`) and the charts (`public/charts.js`).
- **Tests** for every new rule, measure and feed.

**Changed**
- **Senate votes:** matched by official LIS ID instead of surname plus state.
- **Approved-sites list:** grew from 4 sites to 29.
- **`README.md`:** rewritten from the planned README to describe what was built.

**Deleted**
- **The per-vote People/Profit field,** moved to the per-bill list.
- **`3_ALT_README.md`,** now that it has become the README.
- **Sources never added:** the `crec` package and Capitol API, since the GovInfo API and CapitolGains cover them.

**Staying the same:** the six tabs, home-card layout, portraits, dark theme, My alignment quiz, A–F scale, current ethics deductions (−20, −15, −5), funder timelines, the existing money refreshes, and old links.

Several values are still placeholders from your "Open decisions" list (trading deductions, the 80% rule, flag thresholds, who marks bills, the sector lists), so some details above could change.
