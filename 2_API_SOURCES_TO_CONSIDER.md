# These APIs were all stated as Free

Checked October 23, 2026. Details marked *(unconfirmed)* come from third-party pages rather than the source's own site, so check them before relying on them.

**How the plan uses them:** every source here with a free key or no key that can run alongside the others is used at the same time (see [3_ALT_README.md](3_ALT_README.md)). Where several cover the same thing, such as the three stock-trade services, their records are merged and the official record wins when they disagree. Only the `crec` package and Capitol API are left out, because they repeat work other sources already do.

## **Already using**
### Refreshed automatically while the app runs (see Updates in the app)
- **FEC API:** campaign totals (including how much came from individual donors, as a total), PAC contributions and outside spending. It does not collect individual donors' names or employers yet. Needs a free key **(Federal only)**. [api.open.fec.gov/developers](https://api.open.fec.gov/developers/)
- **Congress.gov API:** bills each member sponsored in the current Congress. Needs a free key **(Federal only)**.
    - Key: [api.congress.gov/sign-up](https://api.congress.gov/sign-up/)
    - Docs: [github.com/LibraryOfCongress/api.congress.gov](https://github.com/LibraryOfCongress/api.congress.gov)
- **House Clerk roll calls:** official House votes, with no key **(Federal only)**. [clerk.house.gov/Votes](https://clerk.house.gov/Votes)
- **Senate roll calls:** official Senate votes, with no key **(Federal only)**. [senate.gov roll call lists](https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_2.htm)

### Imported once and rebuilt by hand
- **FEC bulk files:** each researched group's money to each candidate since 2019, for the funder timelines (`scripts/build-funder-history.mjs`) **(Federal only)**. [fec.gov bulk data](https://www.fec.gov/data/browse-data/?tab=bulk-data)
- **Voteview:** DW-NOMINATE ideology scores, copied into the research file and not refreshed **(Federal only)**. [voteview.com](https://voteview.com)
- **unitedstates/images:** official public-domain congressional portraits (`scripts/build-portraits.py`). Candidates who never served in Congress use photos supplied for the site instead **(Federal only)**. [github.com/unitedstates/images](https://github.com/unitedstates/images)

## **New: floor speeches**
- **Congress.gov Congressional Record endpoints:** daily and bound Record, using your existing key **(Federal only)**. [Endpoint docs](https://github.com/LibraryOfCongress/api.congress.gov/blob/main/Documentation/DailyCongressionalRecordEndpoint.md)
- **GovInfo API:** the Congressional Record broken into individual speeches. It uses a free api.data.gov key, so your Congress.gov key may work **(Federal only)**.
    - Docs: [api.govinfo.gov/docs](https://api.govinfo.gov/docs)
    - Key: [govinfo.gov/api-signup](https://www.govinfo.gov/api-signup)
- **crec:** free Python package that turns GovInfo's Record into a table of speeches with dates **(Federal only)**. [crec.readthedocs.io](https://crec.readthedocs.io)
- **YouTube Data API:** videos from officials' own channels (speeches, town halls), with a free Google key and 10,000 units a day. A search costs about 100 units, so roughly 100 searches a day **(State and federal)**. [Docs](https://developers.google.com/youtube/v3/getting-started)

## **New: hearings**
- **GovInfo API:** congressional hearing transcripts, with the same key and docs as above **(Federal only)**. [api.govinfo.gov/docs](https://api.govinfo.gov/docs)
- **House Document Repository:** committee meeting documents and witness testimony, in PDF and XML where available, with no key **(Federal only)**. [docs.house.gov/committee](https://docs.house.gov/committee/Help.aspx)
- **Congress.gov committee-meeting endpoint:** hearing and markup schedules, using your existing key **(Federal only)**. [Docs](https://github.com/LibraryOfCongress/api.congress.gov)

## **New: statements and issue positions**
- **Vote Smart API:** candidates' issue positions, votes and interest-group ratings. It needs a free key and doesn't allow bulk requests. A 2020 report said API access was limited to select organizations, so confirm you can get a key **(State and federal)**. [votesmart.org/services_api.php](http://votesmart.org/services_api.php)
- **Google Fact Check Tools API:** published fact-checks of politicians' claims (PolitiFact, FactCheck.org and others), with a free Google key. Google's page doesn't state the quota **(State and federal)**. [Docs](https://developers.google.com/fact-check-tools)
- **GDELT DOC API:** news coverage search back to 2017, with no key. It sometimes refuses requests briefly, so it needs retries **(State and federal)**. [Announcement](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
- **New York Times Article Search API:** the news archive, with a free key, capped at 1,000 results per search **(State and federal)**. [developer.nytimes.com](https://developer.nytimes.com/)
- **Bluesky public API:** officials' public posts, with no login or key **(State and federal)**. [Docs](https://docs.bsky.app/docs/category/http-reference)
- **congress-legislators:** each member's official social media accounts, so you know which feeds to follow **(Federal only)**. [github.com/unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators)

## **New: campaign promises**
- **Wayback Machine:** every archived snapshot of a campaign website, to capture promises before they're edited or deleted. It's free with no key **(State and federal)**.
    - Docs: [Wayback CDX server](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)
    - Endpoint: [web.archive.org/cdx/search/cdx](https://web.archive.org/cdx/search/cdx)

## **New: more from Congress.gov (existing key)**
- **Cosponsored-legislation endpoint:** the bills each member co-sponsored, which Rule 1 counts **(Federal only)**. [Docs](https://github.com/LibraryOfCongress/api.congress.gov)
- **House roll-call vote endpoints:** official House votes from 2023 on, added in May 2025. They could replace reading the House Clerk's files for those years **(Federal only)**. [Announcement](https://blogs.loc.gov/law/2025/08/congress-gov-enhanced-access-to-house-roll-call-votes-is-now-available/)
- **Bill summaries, amendments, committee reports and CRS Reports:** would fill in the bill details that are currently written by hand **(Federal only)**. [Docs](https://github.com/LibraryOfCongress/api.congress.gov)

## **New: official acts**
- **Federal Register API:** executive orders, rules and other official acts, with no key, for Rule 1's "official act" by federal executive officials **(Federal only)**. [federalregister.gov/developers](https://www.federalregister.gov/developers/documentation/api/v1)

## **New: committees and member IDs**
- **congress-legislators:** current committee assignments, plus each member's IDs across systems (Bioguide, FEC, Senate ID and others) for matching data **(Federal only)**.
    - Project: [github.com/unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators)
    - Current members file: [legislators-current.json](https://unitedstates.github.io/congress-legislators/legislators-current.json)
- **Senate.gov and House Clerk member files:** the official current committee assignments for each chamber, with no key **(Federal only)**.
    - Senate: [senate.gov XML feeds](https://www.senate.gov/general/XML.htm)
    - House: [MemberData user guide](https://xml.house.gov/MemberData/MemberData_UserGuide.pdf)
- **Wikidata:** cross-references IDs for candidates who never served in Congress, which congress-legislators doesn't cover, with no key **(State and federal)**. [wikidata.org](https://www.wikidata.org/)

## **New: state officials' records**
- **Open States API:** state bills, votes, sponsorships, legislators, committees and governors for all 50 states, DC and Puerto Rico, with a free key **(State only)**.
    - Docs: [v3.openstates.org/docs](https://v3.openstates.org/docs/)
    - Key: [openstates.org/accounts/signup](https://openstates.org/accounts/signup/)
    - Bulk downloads, public domain, for when the API's quota runs out: [Open States bulk data](https://open.pluralpolicy.com/data/legislator-csv/)
- **LegiScan:** legislation in all 50 states and Congress, with a free key and a monthly query cap. Its weekly bulk files don't count against the cap **(State and federal)**. [legiscan.com/legiscan](https://legiscan.com/legiscan)
- **State campaign-finance portals:** some states publish free data feeds, for example Washington's, updated daily. There's no single national source, and Washington's data bans commercial use **(State only)**. [Washington PDC open data](https://pdc.wa.gov/node/140)

## **New: lobbying**
- **LDA.gov:** official lobbying registrations, quarterly activity reports and lobbyist contribution reports, with an API. A free key raises the limit from 15 to 120 requests a minute. The same API also runs at lda.senate.gov **(Federal only)**. [lda.gov](https://lda.gov/) · [Terms and limits](https://lda.senate.gov/api/tos)
- **FARA API:** registrations of people lobbying for foreign governments and companies, reportedly limited to 5 requests per 10 seconds *(unconfirmed)* **(Federal only)**. [efile.fara.gov/api](https://efile.fara.gov/api)
- **Regulations.gov API:** donor companies' public comments on federal rules, with a free api.data.gov key and 1,000 requests an hour **(Federal only)**. [open.gsa.gov/api/regulationsgov](https://open.gsa.gov/api/regulationsgov/)

## **New: stock trades and holdings**
- **House Clerk disclosures:** official yearly downloads, with trades as PDFs **(Federal only)**. [disclosures-clerk.house.gov/FinancialDisclosure](https://disclosures-clerk.house.gov/FinancialDisclosure)
- **Senate eFD:** official search portal, no API. I couldn't find its terms of use, so check whether automated access is allowed before scripting it **(Federal only)**. [efdsearch.senate.gov](https://efdsearch.senate.gov/)
- **CapitolGains:** free Python package for trades, holdings and blind trusts from both chambers **(Federal only)**. [pypi.org/project/capitolgains](https://pypi.org/project/capitolgains/)
- **Capitol API:** open-source and self-hostable **(Federal only)**. Its GitHub repo is crnicholson/capitol-api, and the page I found it on is [an archived copy](https://archive.hackclub.com/archive/8ODyA/mhtml/html).
- **Bargo Congress Trades API:** free with limits, and includes a late-filing flag. The free tier covers only the last 3 months of trades, at 100 requests and 1,000 rows a day with a free key *(unconfirmed)*, so older trades need the official filings **(Federal only)**.
    - API: [bargo.ai/free-apis/congress/v1](https://www.bargo.ai/free-apis/congress/v1)
    - Free key: [bargo.ai/free-apis/dash](https://www.bargo.ai/free-apis/dash)
- **Eulerpool:** free tier of 100,000 requests a month, with party and committee filters **(Federal only)**.
    - Docs: [eulerpool.com/financial-data-api/congress-trading-data](https://eulerpool.com/financial-data-api/congress-trading-data)
    - Free key: [eulerpool.com/developers/register](https://eulerpool.com/developers/register)
- **Financial Modeling Prep:** has a free plan, but check whether it includes congressional trades **(Federal only)**. [Senate trading API docs](https://site.financialmodelingprep.com/developer/docs/senate-trading-api)
- **SEC EDGAR:** company tickers and industry codes, with no key (it asks for a contact in each request and about 10 requests a second), to sort trades by sector for the committee-conflict rule **(Federal only)**. [SEC developer resources](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)

## **New: federal contracts to donor companies**
- **USAspending API:** federal contracts and grants by company, with no key or quota **(Federal only)**. [api.usaspending.gov](https://api.usaspending.gov/)
- **SAM.gov Entity API:** companies' federal IDs (UEI) and industry codes, with a free key, to match donors to contracts reliably **(Federal only)**. [open.gsa.gov/api/entity-api](https://open.gsa.gov/api/entity-api)

## **New: groups funding outside spending ("dark money")**
- **ProPublica Nonprofit Explorer API:** nonprofits' tax filings, including groups that spend in races, with no key. Unlike ProPublica's Congress API, it still appears to work **(Federal only)**. [Announcement](https://www.propublica.org/nerds/announcing-the-nonprofit-explorer-api)
- **IRS political organization (527) data:** bulk downloads of Forms 8871 and 8872 for groups that report to the IRS instead of the FEC, updated weekly, with no key **(Federal only)**. [IRS political organizations](https://www.irs.gov/node/471)

## **New: ethics and legal cases**
- **CourtListener API:** court opinions and dockets, with a free account. Since May 2026, free accounts reportedly get about 5 requests a minute, 50 an hour and 125 a day *(unconfirmed)*; paid memberships get more, and students and legal-aid groups can get free tiers. Pulling new documents from PACER also costs PACER's fees **(State and federal)**. [API docs](https://www.courtlistener.com/help/api/rest/) · [May 2026 change](https://free.law/2026/05/07/api-included-in-memberships/)
- **FEC enforcement records:** closed enforcement cases (MURs), advisory opinions and fines, using your existing FEC key. The API path is confirmed only through a third-party tool **(Federal only)**. [FEC legal search](https://www.fec.gov/legal-resources/how-to-use-fec-legal-search-systems)
- **DOJ press releases API:** indictments, plea deals and settlements announced by the Justice Department, with no key **(Federal only)**. [R client documenting it](https://cran.r-universe.dev/usdoj)
- **Office of Government Ethics:** executive-branch financial disclosures, for candidates who held federal executive posts. No API, so by hand **(Federal only)**. [OGE Form 278e](https://oge.gov/web/278eGuide.nsf/Overview)

## **New: profile photos**
- **Wikimedia Commons:** freely licensed photos for candidates without an official portrait, with no key. Check each photo's license and credit line before using it **(State and federal)**. [commons.wikimedia.org](https://commons.wikimedia.org/)

## **Don't use (shut down, closing or not free)**
- **ProPublica Congress API:** no longer available and no new keys **(Federal only)**. [Shutdown notice](https://projects.propublica.org/api-docs/congress-api/)
- **OpenSecrets API:** reported switched off in 2025. Use FEC data directly instead. Its bulk data is unreliable too: users report sign-up requests going unanswered **(Federal only)**. [Forum thread](https://groups.google.com/g/opensecrets-open-data/c/LN8enXEzeDc)
- **Google Civic Information API, representative lookup:** shut down in April 2025 (its elections and divisions parts still work) **(State and federal)**. [Turndown notice](https://groups.google.com/g/google-civicinfo-api/c/9fwFn-dhktA/m/ftUoL83mAwAJ)
- **GovTrack API and bulk data:** ended in 2017 **(Federal only)**. [Notice](https://congressionaldata.org/ending-govtracks-bulk-data-and-api/)
- **House Stock Watcher and Senate Stock Watcher:** reportedly offline *(unconfirmed)* **(Federal only)**.
- **Lambda Finance:** its congressional-trading API shuts down August 31, 2026 **(Federal only)**. [lambdafin.com](https://www.lambdafin.com/congressional-trading-api)
- **Paid only:** Quiver Quantitative (about $25–30 a month), EODHD congressional trades, Ballotpedia, Cicero and BallotReady.
- **PACER:** charges per page; check CourtListener's free archive first **(Federal only)**.
- **Couldn't confirm:** whether Finnhub's congressional trades are on its free plan.

A few of these links I built from paths the sites list rather than opened directly: voteview.com, the Eulerpool docs, LDA.gov, the congress-legislators project page, the Federal Register, SEC and New York Times developer pages, Wikidata and Wikimedia Commons. If one doesn't load, the site's home page will get you there.
