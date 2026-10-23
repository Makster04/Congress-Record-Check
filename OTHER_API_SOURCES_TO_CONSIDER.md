**Stock trades and holdings**
- **House Clerk disclosures**: official yearly downloads, with trades as PDFs. [disclosures-clerk.house.gov/FinancialDisclosure](https://disclosures-clerk.house.gov/FinancialDisclosure)
- **Senate eFD**: official search portal, no API. [efdsearch.senate.gov](https://efdsearch.senate.gov)
- **CapitolGains**: free Python package for trades, holdings and blind trusts from both chambers. [pypi.org/project/capitolgains](https://pypi.org/project/capitolgains/)
- **Capitol API**: open-source and self-hostable. Its GitHub repo is crnicholson/capitol-api, and the page I found it on is [an archived copy](https://archive.hackclub.com/archive/8ODyA/mhtml/html).
- **Bargo Congress Trades API**: free with limits, and includes a late-filing flag.
    - API: [bargo.ai/free-apis/congress/v1](https://www.bargo.ai/free-apis/congress/v1)
    - Free key: [bargo.ai/free-apis/dash](https://www.bargo.ai/free-apis/dash)
- **Eulerpool**: free tier of 100,000 requests a month.
    - Docs: [eulerpool.com/financial-data-api/congress-trading-data](https://eulerpool.com/financial-data-api/congress-trading-data)
    - Free key: [eulerpool.com/developers/register](https://eulerpool.com/developers/register)
- **Financial Modeling Prep**: has a free plan, but check whether it includes congressional trades. [Senate trading API docs](https://site.financialmodelingprep.com/developer/docs/senate-trading-api)

**Supporting data**
- **LDA.gov**: official lobbying disclosures and API. [lda.gov](https://lda.gov)
- **OpenFEC**: official donations and outside spending API, with a free key. [api.open.fec.gov/developers](https://api.open.fec.gov/developers)
- **congress-legislators**: members and committee assignments.
    - Project: [github.com/unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators)
    - Current members file: [legislators-current.json](https://unitedstates.github.io/congress-legislators/legislators-current.json)

A few of these I built from paths the sites list rather than opened directly: the Eulerpool docs, LDA.gov, and the congress-legislators project page. If one doesn't load, the site's home page will get you there.
