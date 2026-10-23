Here's the whole list again, grouped by where each change happens: the site, the scoring methodology, and the repo. Each item appears once.

## 1. The site (what visitors see)

**Added**
- **Five score pages in the top menu**, each ranking everyone on one grade, with "Not graded" people shown as grey rows.
- **Money & Influence tab:**
  - Top-20 donor monthly chart, with markers for related votes, speeches and stock trades
  - Vote and Speech Donor Alignment percentages
  - Timing flags
  - Federal contracts to those donors
- **Ethics tab:**
  - Stock-trading section with the points each item costs
  - Filing-delay chart, trades by sector, and a trade-and-vote timeline
  - Timeline of each case's status changes
- **People Over Profit tab:** scored sponsorships, a diverging bar, and a top-20 donor tree map.
- **Promises Delivered tab:** recent floor speeches, hearings, Vote Smart positions, Bluesky posts and campaign-website snapshots.
- **Your match tab:** cosponsored bills, committee assignments, state legislative records, and each action's weight.
- **Updates page:** the new sources and their refresh status.

**Changed**
- **Outside spending charts:** colored by industry, People- or Profit-aligned, instead of by group type (super PAC, party, other).
- **Ratio badge:** says "no opposing spending" instead of "all for".
- **Methodology page:** rewritten to match the new rules below.

**Deleted**
- **"Money and votes by issue"** on People Over Profit, which the donor alignment measures would replace. This is your call.

## 2. The methodology (how grades are scored)

**Added**
- **Rule 1 weights:** votes, sponsorships, cosponsorships and official acts count 1.0; speeches and statements count 0.5, only where there's no recorded action.
- **Stock trading in Ethics:** −2 per late disclosure and −1 per committee-conflict trade, each capped at −10. Trades near related votes are flagged, not scored.
- **Promise tags:** only true commitments are scored; vague goals are left out.
- **End-of-term rule:** a promise they could have acted on but didn't counts as contradicted.
- **Money & Influence Analysis measures:** donor alignment and timing flags (50% donation swings within six months, position changes, stock overlap). They're shown beside the grades and never affect them.

**Changed**
- **Your match:** issues backed only by statements count at half importance (today, full).
- **People over Profit:** scores votes and sponsorships with Rule 1 weights and needs 3 scored actions (today: votes only, 3 votes).
- **Grade timing:** Promises, Ethics and People over Profit are recalculated monthly after review, with a change log. Today they update as soon as the research file changes. Your match stays live.

## 3. The repo (code, data and files)

**Added**
- **Eleven new data feeds:** cosponsorships, donors by employer, speeches, hearings, Vote Smart, Open States, Bluesky, the Wayback Machine, congress-legislators, lobbying, stock trades and federal contracts.
- **Five new API keys** in `.dev.vars.example` and the Cloudflare setup.
- **The monthly scoring command** and its change log file.
- **A file of the industries each committee oversees.**
- **A script that imports yearly stock holdings by hand.**
- **More IDs for each person** in `data/config.json` (LIS, Open States, Bluesky accounts, campaign-site addresses).
- **Promise tags and a per-bill list of People/Profit marks** in `public/research.json`.
- **Tests** for every new rule and feed.

**Changed**
- **Senate votes:** matched by official LIS ID instead of surname plus state.
- **Approved-sites list:** grows from 4 sites to about 12.
- **`README.md`:** replaced by `ALT_README.md`.

**Deleted**
- **The per-vote People/Profit field,** moved to the per-bill list.
- **`ALT_README.md`,** once it becomes the README.
- **Sources never added:** LegiScan, the `crec` package and the backup stock-trade APIs, since Open States, GovInfo and Bargo cover them.

**Staying the same:** the six tabs, home-card layout, portraits, dark theme, My alignment quiz, A–F scale, current ethics deductions (−20, −15, −5), funder timelines, the existing money refreshes, and old links.

Several values are still placeholders from your "Open decisions" list (trading deductions, the 80% rule, flag thresholds, who marks bills), so some details above could change.
