Here's everything that would change if you build what's in `ALT_README.md`, compared with the project today. Nothing has been changed yet.

## WHATS NEW:

**New data the app would fetch automatically**
- **Cosponsored bills** (Congress.gov, existing key)
- **Individual donors grouped by employer** (FEC, existing key), for the top-20 donor tracking
- **Floor speeches and hearing transcripts** (GovInfo, new key)
- **Issue positions and interest-group ratings** (Vote Smart, new key)
- **State legislative records** (Open States, new key)
- **Officials' public posts** (Bluesky, no key)
- **Campaign-website snapshots** (Wayback Machine, no key)
- **Committee assignments and members' IDs across systems** (congress-legislators, no key)
- **Lobbying filings** (LDA.gov, optional key)
- **Stock trades with late-filing flags** (Bargo, new key)
- **Federal contracts to donor companies** (USAspending, no key)

**New scoring features**
- **Rule 1 weights:** votes, sponsorships, cosponsorships and official acts count 1.0; speeches and statements 0.5.
- **Stock trading in the Ethics grade:** −2 per late disclosure and −1 per committee-conflict trade, each capped at −10. Trades near related votes are flagged but not scored.
- **End-of-term rule:** a promise they could have acted on but didn't counts as contradicted.
- **Promise tags:** separate true commitments from general statements.
- **People over Profit also scores sponsorships,** not only votes.

**New Money & Influence Analysis** (shown beside the grades, never inside them)
- Top 20 donor organizations by month (PAC plus employees)
- Lobbying matched to the bills they acted on
- Vote Donor Alignment and Speech Donor Alignment
- Timing flags (50% donation swings, position changes, stock overlap)

**New pages and charts**
- **Five score pages** in the top menu, each ranking everyone on one grade, with "Not graded" people shown as grey rows
- **Ethics tab:** a stock-trading section with a filing-delay dot chart, trades by sector, a trade-and-vote timeline, and a case-status timeline
- **People Over Profit tab:** a diverging bar and a top-20 donor tree map
- **Money & Influence tab:** a monthly top-donor chart with vote, speech and trade markers
- **"Latest official records"** sections on the Promises Delivered and Ethics tabs (today only Money & Influence and Your match have them)

**New files and commands**
- `npm run scores:monthly`: the monthly recalculation
- `data/score-log.json`: every score change and why
- `data/committee-sectors.json`: which industries each committee oversees
- `scripts/build-holdings.py`: yearly holdings and blind trusts, imported by hand with CapitolGains
- Five new keys in `.dev.vars` and in the Cloudflare secrets
- Tests for every new rule, measure and data source

## CHANGED (works differently)

- **Your match:** issues backed only by statements count at half importance (today, full importance). Actions are weighted, and cosponsorships and speeches are included.
- **People over Profit:** points from votes and sponsorships, needing 3 scored actions (today: votes only, 3 votes).
- **People/Profit bill marks:** stored once per bill instead of on each vote, so a vote and a sponsorship on the same bill share one mark.
- **Senate vote matching:** uses official LIS IDs instead of surname plus state.
- **Grade timing:** Promises, Ethics and People over Profit are recalculated monthly after review, with a change log. Today they're computed live from the research file. Your match stays live, since it depends on each visitor's answers.
- **Outside spending chart:** split by industry sector and colored People- or Profit-aligned. Today it's split by group type: super PAC, party, other.
- **Ratio badge:** shows "no opposing spending" instead of "all for" when nothing was spent against them.
- **Sponsored bills list:** sponsored and cosponsored bills, up to 100 of each.

## UPDATED (same thing, new content)

- **README.md:** replaced by the contents of `ALT_README.md`.
- **Methodology page in the app:** rewritten to match `Political_Scorecard_Metholodgy.md` (Rule 1, stock trading, sponsorships, the analysis, the monthly log).
- **`data/config.json`:** each person gains IDs for the new sources (LIS, Open States, Bluesky accounts, campaign-site addresses).
- **`public/research.json`:** a list of marked bills, promise tags, and promises closed at end of term.
- **`.dev.vars.example`:** five new blank key lines.
- **Updates screen:** many more sources listed.
- **`src/sources.mjs`:** its approved-sites list grows from 4 sites to about 12.

## DELETED (removed)

- **Senate surname-and-state matching** (replaced by LIS IDs)
- **The per-vote `pvp` field** (moved to the per-bill list)
- **`ALT_README.md`,** once it becomes the real README
- **"Money and votes by issue"** on the People Over Profit tab, most likely, since Vote Donor Alignment covers the same ground. The draft doesn't keep it, so you'd need to decide.
- **Not used at all:** LegiScan, the `crec` package, and the backup stock-trade APIs (Eulerpool, Capitol API, Financial Modeling Prep). Open States, the GovInfo API and Bargo cover them.

## Stays the same

- The six tabs and their names
- The home-card layout (Report Card, Money & Influence Analysis), portraits, and dark theme
- The My alignment quiz
- The A–F scale and "Not graded" rule
- The current ethics deductions (−20, −15, −5)
- Funder timelines and funders-vs.-votes
- Campaign totals, PAC and outside-spending refreshes
- Old links like `#collins-record`

**Still to decide before building:** several values are placeholders from your "Open decisions" list, including the trading deductions, the 80% rule, the flag thresholds, and who marks bills. Any of those could change the details above.
