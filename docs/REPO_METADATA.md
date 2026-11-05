# Repository metadata (set by hand)

Suggestions for the GitHub **About** section of this repository. This file does not change any GitHub settings. The owner applies the description and topics in the repository settings.

Checked against the live catalog on 5 Nov 2026: `filers` has 28 SEC-filing tickers (the list includes TSM and ASML), and `paid_price` / `prices["/delta/:ticker"].price` is `$0.05`. Wording below follows https://filingdelta.xyz/llms.txt and https://filingdelta.xyz/catalog.

## Description

350 characters is the GitHub limit. This text is 292 characters:

```
Examples for FilingDelta (https://filingdelta.xyz): cited JSON cards on what changed in SEC filings and central-bank decisions. Includes a free no-wallet Python CLI (GET /sample/{ticker}) and MCP client config. Full cards are $0.05 USDC on Base via x402. Informational, not investment advice.
```

## Website

Set the GitHub About **Website** field, next to that description, to:

```
https://filingdelta.xyz
```

## Topics

Twelve topics. GitHub topics are lowercase. Suggested set:

- `x402`
- `mcp`
- `model-context-protocol`
- `sec-edgar`
- `sec-filings`
- `central-banks`
- `financial-data`
- `ai-agents`
- `base`
- `usdc`
- `python`
- `json`

`base` is the Base network named in `/catalog` (`network`: `Base mainnet`). `usdc` is the catalog `asset`. The remote MCP server is `https://filingdelta.xyz/mcp` (server card name `xyz.filingdelta/filingdelta`).
