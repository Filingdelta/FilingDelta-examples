# filingdelta-examples

**What changed in the filing, in one call. Cited. Prices and ids: https://filingdelta.xyz/catalog**

Example agent calls for [FilingDelta](https://filingdelta.xyz): free samples, one capped x402 paid call, an earnings watch and an MCP config. Payments are USDC on Base mainnet over [x402](https://github.com/coinbase/x402) v2.

## What is a card?

A card is one JSON object listing the material changes in a company's latest SEC filing, a central-bank decision or a US macro release. Each change has a materiality rating, a citation and a "why it matters" line. `source_url` points at the filing.

Excerpt from the free `GET https://filingdelta.xyz/sample/AMD` (fetched and checked 29 Oct 2026, cut to the one change the sample shows in full):

```json
{
  "ticker": "AMD",
  "source_url": "https://www.sec.gov/Archives/edgar/data/2488/000000248826000123/0000002488-26-000123-index.htm",
  "company": "Advanced Micro Devices, Inc.",
  "period": "Q2 FY2026",
  "filing_type": "10-Q",
  "filing_date": "2026-08-05",
  "changes": [
    {
      "id": 1,
      "category": "segment",
      "summary": "Data Center revenue $6,718 million vs $3,240 million a year ago (+107%). Segment is now 58% of company revenue.",
      "materiality": "high",
      "citation": "Q2 2026 10-Q (acc. 0000002488-26-000123), Part I Item 2 MD&A, segment net revenue table and Data Center discussion; 58% share calculated from the same table (6,718 / 11,536)",
      "why_it_matters": "The business mix has shifted hard into AI/data center; company-level growth is no longer a client/gaming story."
    }
  ]
}
```

Free samples are labelled and are not the full card. Filing samples show one change in full and the rest as teasers (`access: "teaser"`) with category, section and materiality, plus `direction`, a `magnitude` size bucket and `magnitude_basis` (for example `largest_figure` or `prior_period_pair`) where the paid card's figures give them; `hidden` counts what is gated. Macro samples are headline only (`items_hidden` counts the rest). Policy samples are the previous meeting's full card (`sample_of: "previous_meeting"`) plus a `latest` object with only the latest meeting date, `access: "paid"`, its `content_hash` and `buy_with`. How cards are built: [/methodology](https://filingdelta.xyz/methodology). The files in `examples/samples/` were re-captured from the live free samples on 29 Oct 2026; see [examples/samples/README.md](examples/samples/README.md). See [examples/curl.md](examples/curl.md) for a decoded 402. Cards summarise filings and are not investment advice.

## Routes

Prices and the full id lists are in the `prices` map and id arrays of the live [`/catalog`](https://filingdelta.xyz/catalog) (checked 29 Oct 2026); that is the source of truth and it grows over time. All routes run on Base mainnet (`eip155:8453`), with USDC, scheme `exact`.

| Route | What | Free sample |
|---|---|---|
| `GET /delta/:ticker` | SEC filing-change card (tickers in `/catalog` `filers`) | `/sample/:ticker` |
| `GET /policy/:id` | Central-bank decision (ids in `/catalog` `policy`) | `/sample/policy/:id` |
| `GET /macro/:id` | US macro release. NFP, GDP, CPI | `/sample/macro/:id` |
| `GET /cpi/US` | CPI card (ids in `/catalog` `cpi_ids`) | `/sample/cpi/US` |
| `GET /guidance/:ticker` | Guidance card (ids in `/catalog` `guidance`) | `/sample/guidance/:ticker` |
| `GET /insider/:ticker` | Insider card (ids in `/catalog` `insider`) | `/sample/insider/:ticker` |
| `GET /bundle/:id` | Discounted bundles: SEMIS, CENTRALBANKS, BRICS (ids and discount in `/catalog` `bundles`) | none |
| `GET /sample/history/AMD` | Free filing-history sample, AMD only (other tickers return 404). No paid history route | itself |

Free routes: `/catalog`, `/methodology`, `/updates`, `/status.json`, `/llms.txt`, `/openapi.json`, `/.well-known/x402`. Unknown ids return a free 404 before any payment. Ids are case-insensitive. `/catalog` lists a `content_hash` for every card.

## Repo layout

| Path | What it does |
|---|---|
| `examples/curl-free-sample.sh` | Free tour with no wallet. GETs `/catalog`, `/sample/AMD`, `/sample/policy/FED`, `/sample/history/AMD` and `/updates` (expects 200 from each), then checks that unpaid `/delta/AMD` returns 402 with a `PAYMENT-REQUIRED` header. Needs curl. |
| `examples/paid-call.ts` | `paidCallOnce(path)` makes **one** capped paid call and never loops or retries. It is a dry run unless `CONFIRM_PAY=yes`. |
| `examples/earnings-watch.ts` | Hashes free samples for `WATCH_TICKERS`, cross-checks them against `/catalog`, and pays for **at most one** changed card per run. |
| `examples/x402terms.ts` | Reads the free 402 terms and accepts only scheme `exact`, Base USDC, FilingDelta's payTo, at or under the cap. |
| `examples/budget.ts` | Shared spend cap: `MAX_USD` (default $0.10), with a hard ceiling of $0.10 per call. Compare it with the live prices in https://filingdelta.xyz/catalog before paying. |
| `examples/curl.md` | The unpaid 402 and a free sample call, including a decoded header captured 29 Oct 2026. |
| `examples/node-pay.mjs` | Short `@x402/fetch` client. Uses `PRIVATE_KEY` (not `EVM_PRIVATE_KEY`) and pays the 402 immediately. No `CONFIRM_PAY` dry run and no `MAX_USD` check. The library default cap on that client is $1. |
| `examples/samples/` | Free sample JSON captured 29 Oct 2026: `amd.json`, `msft.json`, `macro-cpi.json`, `policy-boe.json`, `policy-ecb.json`, `policy-fed.json`. See `examples/samples/README.md`. |
| `examples/mcp.md` | MCP endpoint, tool names, and a `tools/list` curl. |
| `mcp/config.json` | MCP client config for `https://filingdelta.xyz/mcp`. |
| `.env.example` | Environment variables (see below). |
| `tsconfig.json` | Used by `npm run typecheck`. |

## Quickstart

Needs Node.js and npm. Pinned dependencies: `@x402/fetch` 2.28.0, `@x402/evm` 2.28.0, `viem` 2.57.7. Dev tools: `tsx`, `typescript`.

```bash
npm install
```

### 1. Free tour (no wallet, no payment)

```bash
npm run free          # bash examples/curl-free-sample.sh
```

### 2. Read the paid terms (dry run, no payment)

```bash
npm run paid          # tsx examples/paid-call.ts, defaults to /delta/AMD
npm run paid -- /policy/BOE
```

Without `CONFIRM_PAY=yes` this prints the terms and `Dry run: set CONFIRM_PAY=yes to pay. No payment made.`

### 3. Pay for ONE card

```bash
cp .env.example .env    # fill in EVM_PRIVATE_KEY; .env is git-ignored
set -a; . ./.env; set +a   # the scripts read process.env and do not load .env themselves
CONFIRM_PAY=yes npm run paid -- /delta/AMD
```

The card JSON and the decoded `PAYMENT-RESPONSE` receipt are printed.

### 4. Earnings watch

```bash
npm run watch         # tsx examples/earnings-watch.ts
```

The first run records a baseline in `.watch-state.json` (git-ignored; override the path with `WATCH_STATE`). Later runs report `(unchanged)` or `(CHANGED)` for each ticker. If any changed, the script calls `paidCallOnce` for the first changed ticker only, and that call is still a dry run unless `CONFIRM_PAY=yes`. A dry run leaves the previous baseline in place for changed tickers, so a later run with `CONFIRM_PAY=yes` still sees the change. The baseline for that ticker advances after the paid call returns 200. A ticker seen for the first time is recorded and is not paid for on that run.

`sample_hash` is the sha256 of the free sample with `generated_at` removed (first 12 hex chars). `/catalog` `content_hash` is the paid card, computed the same way. The watch stores both. A trimmed sample does not hash to the paid card.

### Typecheck

```bash
npm run typecheck     # tsc --noEmit
```

## Environment variables

From `.env.example`:

| Variable | Default | Meaning |
|---|---|---|
| `EVM_PRIVATE_KEY` | (empty) | Key for a fresh wallet holding only a few cents of USDC on Base. Must be `0x` plus 64 hex characters. Never commit it. Read by `paid-call.ts`. |
| `CONFIRM_PAY` | `no` | Must be `yes` before any payment is made. |
| `MAX_USD` | `0.10` | Per-call cap in USD. Values above $0.10 are refused. Live prices: https://filingdelta.xyz/catalog. |
| `WATCH_TICKERS` | `AMD,NVDA,TSM` | Tickers for `npm run watch`. |
| `FILINGDELTA_BASE` | `https://filingdelta.xyz` | API base URL. |

`WATCH_STATE` (optional, default `.watch-state.json`) is read by `earnings-watch.ts`.

`examples/node-pay.mjs` reads `PRIVATE_KEY` instead, and it pays without `CONFIRM_PAY`.

## MCP

`mcp/config.json`:

```json
{ "mcpServers": { "filingdelta": { "type": "http", "url": "https://filingdelta.xyz/mcp" } } }
```

The server is `filingdelta` v0.5.0, JSON-RPC 2.0 over **POST only** at `https://filingdelta.xyz/mcp` (a GET returns 405). It is listed in the official MCP Registry as `xyz.filingdelta/filingdelta`. A live `tools/list` (29 Oct 2026) returns these tools; prices for paid tools match the HTTP routes in `/catalog`:

| Tool | Cost | What |
|---|---|---|
| `list_filers` | free | Every ticker, policy id, macro id and bundle |
| `search_coverage` | free | Find which ids cover a name, ticker or topic |
| `whats_new` | free | Cards whose as_of date is on or after `since` (YYYY-MM-DD) |
| `sample_delta` | free | Labelled sample of the latest filing-change card (one change in full, the rest teasers) |
| `sample_policy` | free | Previous-meeting central-bank card plus a `latest` pointer |
| `sample_macro` | free | Headline-only sample of the latest macro card (CPI, payrolls, GDP) |
| `request_data` | free | Ask FilingDelta to add a ticker, bank or release |
| `get_filing_delta` | paid | SEC filing changes in a company's latest filing |
| `get_policy` | paid | Central-bank interest rate decision card |
| `get_macro` | paid | US CPI, nonfarm payrolls and GDP release cards |
| `get_cpi` | paid | CPI card |
| `get_bundle` | paid | Discounted bundles (see `/catalog` `bundles`) |

An unpaid call to a paid tool returns a normal tool result with `isError: true` and the x402 PaymentRequired terms in `structuredContent` (a JSON copy is in `content[0].text`; it is the same object as the `PAYMENT-REQUIRED` header of the matching HTTP route). Retry the same `tools/call` with the PaymentPayload in `params._meta["x402/payment"]` (or the `PAYMENT-SIGNATURE` header). The receipt is in `result._meta["x402/payment-response"]`. See [llms.txt](https://filingdelta.xyz/llms.txt). These examples don't make paid MCP calls.

The free sample tools return the labelled sample described above: `sample_delta` and `sample_macro` are teasers, and `sample_policy` is the previous meeting. [examples/mcp.md](examples/mcp.md) has the same tool names and a `tools/list` curl.

## Safety notes

- **One call at a time.** `paid-call.ts` makes exactly one paid request and never retries. `earnings-watch.ts` pays for at most one card per run. Don't wrap either in a loop.
- **Spend cap.** `budget.ts` refuses a `MAX_USD` above $0.10, and `x402terms.ts` refuses any option above the cap, on another network or asset, or to a different payTo.
- **Dry run by default.** Nothing is paid unless `CONFIRM_PAY=yes`. `examples/node-pay.mjs` is the exception: it pays as soon as `PRIVATE_KEY` is set, and it does not use this cap.
- **Check before paying again.** Compare `content_hash` (free in `/catalog`) with the card you already have.
- **Mainnet only.** FilingDelta has no testnet route. Use a fresh, low-balance wallet. To practise x402 on testnet, use the coinbase/x402 examples.

## Links

- https://filingdelta.xyz · [catalog](https://filingdelta.xyz/catalog) · [llms.txt](https://filingdelta.xyz/llms.txt) · [OpenAPI](https://filingdelta.xyz/openapi.json) · [x402 discovery](https://filingdelta.xyz/.well-known/x402) · [updates](https://filingdelta.xyz/updates)
- [allagents.app listing](https://allagents.app/agent/filingdelta)
- x402: https://github.com/coinbase/x402

## Licence

MIT. See [LICENSE](LICENSE) (Copyright (c) 2026 FilingDelta).
