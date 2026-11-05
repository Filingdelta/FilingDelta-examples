# FilingDelta examples

**Cited JSON cards on what changed in SEC filings and central-bank decisions.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/downloads/)
[![filingdelta.xyz](https://img.shields.io/badge/site-filingdelta.xyz-111111)](https://filingdelta.xyz)

Free samples need no wallet. The full card is a paid HTTP call. Prices and ids: https://filingdelta.xyz/catalog

FilingDelta cards are informational and educational summaries of published documents. They are not investment advice and not a trading signal. The live [llms.txt](https://filingdelta.xyz/llms.txt) also says FilingDelta is not affiliated with or endorsed by the Bank of England.

## Quick start (no wallet)

`GET https://filingdelta.xyz/sample/{ticker}` returns a labelled free sample for a ticker in the catalog. Checked 5 Nov 2026: `curl -s` returns HTTP 200 and one JSON object. It is printed compact; the object below is that response, pretty-printed. `generated_at` on this fetch was `2026-11-04T23:56:07.596Z`. A second GET in the same session returned the same value.

```bash
curl -s https://filingdelta.xyz/sample/AAPL
```

```json
{
  "ticker": "AAPL",
  "source_url": "https://www.sec.gov/Archives/edgar/data/320193/000032019326000026/0000320193-26-000026-index.htm",
  "company": "Apple Inc.",
  "period": "FY2026",
  "period_end": "2026-09-26",
  "filing_type": "10-K",
  "filing_date": "2026-11-03",
  "accession": "0000320193-26-000026",
  "comparison_basis": "FREE SAMPLE: one change in full (item 7, as in the paid card, with the disclaimer moved to the card-level disclaimer field), the others as teasers with category, section and materiality, plus direction, a size bucket and magnitude_basis where the paid card's own figures give them. The paid card has every change in full, each with figures and a source line.",
  "changes": [
    {
      "id": 1,
      "access": "teaser",
      "category": "segment",
      "direction": "increase",
      "magnitude": ">$25B",
      "magnitude_basis": "prior_period_pair",
      "section": "10-K",
      "materiality": "high"
    },
    {
      "id": 2,
      "access": "teaser",
      "category": "segment",
      "direction": "increase",
      "magnitude": "$5B-$25B",
      "magnitude_basis": "prior_period_pair",
      "section": "Segment Operating Performance",
      "materiality": "high"
    },
    {
      "id": 3,
      "access": "teaser",
      "category": "commitment",
      "magnitude": ">$25B",
      "magnitude_basis": "single_level",
      "direction": "new",
      "section": "Note on Shareholders' Equity",
      "materiality": "high"
    },
    {
      "id": 4,
      "access": "teaser",
      "category": "other",
      "direction": "increase",
      "magnitude": "<10%",
      "magnitude_basis": "prior_period_pair",
      "section": "10-K",
      "materiality": "high"
    },
    {
      "id": 5,
      "access": "teaser",
      "category": "other",
      "direction": "increase",
      "magnitude": "$5B-$25B",
      "magnitude_basis": "prior_period_pair",
      "section": "10-K",
      "materiality": "high"
    },
    {
      "id": 6,
      "access": "teaser",
      "category": "other",
      "direction": "increase",
      "magnitude": "$5B-$25B",
      "magnitude_basis": "prior_period_pair",
      "section": "10-K",
      "materiality": "high"
    },
    {
      "id": 7,
      "category": "commitment",
      "summary": "At 26 Sep 2026, commercial paper was $2.0 billion vs $8.0 billion at 27 Sep 2025 (-75%, calculated); non-current term debt $68.2 billion vs $78.3 billion (-13%, calculated); current term debt $9.9 billion vs $12.4 billion (-20%, calculated).",
      "materiality": "medium",
      "citation": "FY2026 10-K (acc. 0000320193-26-000026), Consolidated Balance Sheets",
      "why_it_matters": "Apple reduced short- and long-term borrowing over the year.",
      "access": "full"
    },
    {
      "id": 8,
      "access": "teaser",
      "category": "legal",
      "section": "10-K",
      "materiality": "medium"
    }
  ],
  "new_material_items_count": 8,
  "high_materiality_count": 6,
  "generated_at": "2026-11-04T23:56:07.596Z",
  "access": "teaser",
  "gated_fields": [
    "changes[].summary",
    "changes[].citation",
    "changes[].why_it_matters"
  ],
  "hidden": {
    "changes": 7,
    "high_materiality": 6
  },
  "buy_with": {
    "tool": "get_filing_delta",
    "args": {
      "ticker": "AAPL"
    },
    "price_usd": 0.05
  },
  "disclaimer": "Not investment advice."
}
```

An unknown ticker is a free 404, before any payment. `curl -s https://filingdelta.xyz/sample/NOSUCH` returns JSON with `"error": "not_found"` and a `valid_tickers` array.

The full filing card is `GET /delta/{ticker}` (for example `GET https://filingdelta.xyz/delta/AAPL`). On 5 Nov 2026, `/catalog` `paid_price` is `$0.05` and `prices["/delta/:ticker"]` is `$0.05` (`amount_base_units` `50000`), `network` is `Base mainnet`, and `asset` is `USDC`. [llms.txt](https://filingdelta.xyz/llms.txt) describes that call as x402 v2, scheme `exact`, network `eip155:8453`, $0.05 per card. An unpaid call returns 402. This repository's paid examples do not run unless you opt in. See [Node examples](#node-examples) below.

## Python CLI

[`fd_sample.py`](fd_sample.py) is a standard-library client (`urllib`). It has no dependencies, no API key, and no wallet. It only calls `GET /sample/{ticker}` and, with `--list`, `GET /catalog`. It never calls `/delta` or any other paid route.

Python 3.9 or newer. The run recorded below used `python3` on Python 3.12.3 (`python` was not on `PATH` in that environment). Use `python` where that command is Python 3.

```bash
python3 fd_sample.py AAPL
python3 fd_sample.py --list
python3 fd_sample.py NOSUCH
```

`FILINGDELTA_BASE` overrides the host (default `https://filingdelta.xyz`), same as the other examples.

`python3 fd_sample.py AAPL` prints a short summary, `source_url`, the card's `disclaimer`, then the pretty-printed JSON. Run on 5 Nov 2026, the summary was:

```text
AAPL Apple Inc.
10-K, FY2026, filed 2026-11-03
Free sample (access: teaser). 8 changes in the sample, 1 shown in full. hidden.changes=7. Not the full card.
Shown in full (#7): At 26 Sep 2026, commercial paper was $2.0 billion vs $8.0 billion at 27 Sep 2025 (-75%, calculated); non-current term debt $68.2 billion vs $78.3 billion (-13%, calculated); current term debt $9.9 billion vs $12.4 billion (-20%, calculated).
source_url: https://www.sec.gov/Archives/edgar/data/320193/000032019326000026/0000320193-26-000026-index.htm
Not investment advice.
```

The JSON after that blank line was the object in the quick start above, including the same `generated_at`.

`python3 fd_sample.py --list` reads the `filers` array. Output on 5 Nov 2026:

```text
28 tickers from https://filingdelta.xyz/catalog (filers):
AMD
MRVL
NVDA
AVGO
TSM
MU
AMAT
AAPL
MSFT
META
TSLA
ORCL
INTC
ASML
MSTR
JPM
BAC
GS
WFC
NFLX
JNJ
BRK
PLTR
SPCX
GOOGL
LLY
LRCX
BA
```

`python3 fd_sample.py NOSUCH` exits 1 and prints the server's 404 message. Output on 5 Nov 2026:

```text
No free sample for 'NOSUCH' (HTTP 404). You were not charged.
Sample not available for this ticker. You were not charged. Valid ids are listed below and in /catalog.
Covered tickers (28): AMD, MRVL, NVDA, AVGO, TSM, MU, AMAT, AAPL, MSFT, META, TSLA, ORCL, INTC, ASML, MSTR, JPM, BAC, GS, WFC, NFLX, JNJ, BRK, PLTR, SPCX, GOOGL, LLY, LRCX, BA
List them again with: python fd_sample.py --list
Example: https://filingdelta.xyz/sample/AMD
Catalog: https://filingdelta.xyz/catalog
```

Offline checks (no network) and the help text:

```bash
python3 -m unittest discover -s tests -v
python3 fd_sample.py --help
```

The live commands above are the manual run. The unit tests do not call filingdelta.xyz.

## MCP

The remote server is `https://filingdelta.xyz/mcp`. Checked 5 Nov 2026:

- `GET https://filingdelta.xyz/mcp/server-card` returned HTTP 200. `name` is `xyz.filingdelta/filingdelta`, `version` is `0.5.0`, and the remote type is `streamable-http` with protocol `2025-11-25`.
- `POST https://filingdelta.xyz/mcp` with `{"jsonrpc":"2.0","id":1,"method":"tools/list"}` returned HTTP 200 and 12 tools (names below). `Accept: application/json, text/event-stream` was set. A prior `initialize` was not required for that `tools/list`.
- `initialize` returned `protocolVersion` `2025-11-25` and `serverInfo` `filingdelta` `0.5.0`.
- `GET https://filingdelta.xyz/mcp` returned HTTP 405.

```bash
curl -s -X POST https://filingdelta.xyz/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Same curl is in [examples/mcp.md](examples/mcp.md). These examples do not make paid MCP calls.

### Cursor

Cursor's MCP docs describe a remote server as a `url` in `mcp.json` (project `.cursor/mcp.json` or global `~/.cursor/mcp.json`): https://cursor.com/docs/mcp. No local process and no auth header. The FilingDelta server does not use OAuth. Paid tools return x402 terms inside the tool result.

```json
{
  "mcpServers": {
    "filingdelta": {
      "url": "https://filingdelta.xyz/mcp"
    }
  }
}
```

[`mcp/config.json`](mcp/config.json) is the same URL with `"type": "http"` added. Cursor's documented remote example uses `url` alone.

### Claude Desktop

Claude Desktop's supported way to add a public HTTP MCP server is a custom connector, not a `url` field. Anthropic's help center: [custom connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) and [connectors](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities).

1. Customize → Connectors → Add → Custom → Web.
2. Name it `FilingDelta`.
3. Paste `https://filingdelta.xyz/mcp`.
4. Choose no sign-in. The server does not use OAuth. There is no API key.

`claude_desktop_config.json` is a separate mechanism for local stdio servers (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`). It does not take a remote URL. To point that file at this server, bridge with [`mcp-remote`](https://github.com/punkpeye/mcp-remote) (Node.js 18 or newer). `--transport http-only` matches the server card (`streamable-http`) and avoids the SSE fallback. The default `http-first` strategy falls back to SSE when HTTP returns 404; this server's GET is 405, and it speaks HTTP POST.

```json
{
  "mcpServers": {
    "filingdelta": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://filingdelta.xyz/mcp",
        "--transport",
        "http-only"
      ]
    }
  }
}
```

Restart Claude Desktop after editing the file. The custom connector is the path that does not need Node.

### Tools

`tools/list` on 5 Nov 2026 returned these 12 tools. Paid tool titles say `$0.05` except `get_bundle`, whose price is the bundle price in `/catalog`.

| Tool | Cost | What |
|---|---|---|
| `list_filers` | free | Coverage and prices |
| `search_coverage` | free | Find which ids cover a name, ticker or topic |
| `whats_new` | free | Cards whose as_of date is on or after `since` (YYYY-MM-DD) |
| `sample_delta` | free | Labelled sample of the latest filing-change card |
| `sample_policy` | free | Previous-meeting central-bank card plus a `latest` pointer |
| `sample_macro` | free | Headline-only sample of the latest macro card (CPI, payrolls, GDP) |
| `request_data` | free | Ask FilingDelta to add a ticker, bank or release |
| `get_filing_delta` | $0.05 | SEC filing changes in a company's latest filing |
| `get_policy` | $0.05 | Central-bank interest rate decision card |
| `get_macro` | $0.05 | US CPI, nonfarm payrolls and GDP release cards |
| `get_cpi` | $0.05 | CPI card |
| `get_bundle` | paid | Discounted bundles (see `/catalog` `bundles`) |

An unpaid call to a paid tool returns a normal tool result with `isError: true` and the x402 PaymentRequired terms in `structuredContent` (a JSON copy is in `content[0].text`). Retry the same `tools/call` with the PaymentPayload in `params._meta["x402/payment"]` (or the `PAYMENT-SIGNATURE` header). The receipt is in `result._meta["x402/payment-response"]`. See [llms.txt](https://filingdelta.xyz/llms.txt).

## Links

Checked 5 Nov 2026: `/llms.txt`, `/catalog` and `/openapi.json` each returned HTTP 200.

- https://filingdelta.xyz
- [llms.txt](https://filingdelta.xyz/llms.txt)
- [catalog](https://filingdelta.xyz/catalog)
- [OpenAPI](https://filingdelta.xyz/openapi.json)
- [methodology](https://filingdelta.xyz/methodology)
- [x402 discovery](https://filingdelta.xyz/.well-known/x402)
- [updates](https://filingdelta.xyz/updates)
- [allagents.app listing](https://allagents.app/agent/filingdelta)
- x402: https://github.com/coinbase/x402

On that catalog fetch, `filers` had 28 tickers (the `--list` output above), `policy` had 22 ids, and `macro` was `NFP`, `GDP`, `CPI`. [llms.txt](https://filingdelta.xyz/llms.txt) says the same: SEC filings for 28 tickers at $0.05 USDC, and 22 central banks at $0.05 USDC.

## What is a card?

A card is one JSON object listing the material changes in a company's latest SEC filing, a central-bank decision or a US macro release. Each change has a materiality rating, a citation and a "why it matters" line. `source_url` points at the filing.

The AAPL object in the quick start is a current free sample. Free samples are labelled and are not the full card. Filing samples show one change in full and the rest as teasers (`access: "teaser"`) with category, section and materiality, plus `direction`, a `magnitude` size bucket and `magnitude_basis` (for example `largest_figure` or `prior_period_pair`) where the paid card's figures give them; `hidden` counts what is gated. Macro samples are headline only (`items_hidden` counts the rest). Policy samples are the previous meeting's full card (`sample_of: "previous_meeting"`) plus a `latest` object with only the latest meeting date, `access: "paid"`, its `content_hash` and `buy_with`. How cards are built: [/methodology](https://filingdelta.xyz/methodology).

The files in `examples/samples/` were captured from the live free samples on 29 Oct 2026. See [examples/samples/README.md](examples/samples/README.md). Excerpt from the stored `GET https://filingdelta.xyz/sample/AMD` (fetched 29 Oct 2026, cut to the one change that sample showed in full). `/catalog` on 5 Nov 2026 lists AMD `filing_date` `2026-11-04` (10-Q, accession `0000002488-26-000191`), so this excerpt is the stored capture, not the current AMD card. Fetch `GET /sample/AMD` for the current sample.

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

See [examples/curl.md](examples/curl.md) for a decoded 402. Cards summarise filings and are not investment advice.

## Routes

Prices and the full id lists are in the `prices` map and id arrays of the live [`/catalog`](https://filingdelta.xyz/catalog). That is the source of truth and it grows over time. Re-checked 5 Nov 2026: `paid_price` is `$0.05`, `network` is `Base mainnet`, and `asset` is `USDC`. [llms.txt](https://filingdelta.xyz/llms.txt) describes the paid calls as scheme `exact` on `eip155:8453`.

| Route | What | Free sample |
|---|---|---|
| `GET /delta/:ticker` | SEC filing-change card (tickers in `/catalog` `filers`). `$0.05` | `/sample/:ticker` |
| `GET /policy/:id` | Central-bank decision (ids in `/catalog` `policy`). `$0.05` | `/sample/policy/:id` |
| `GET /macro/:id` | US macro release. NFP, GDP, CPI. `$0.05` | `/sample/macro/:id` |
| `GET /cpi/:id` | CPI card (ids in `/catalog` `cpi_ids`: US, UK, EA, JP). `$0.05` | `/sample/cpi/US` |
| `GET /guidance/:ticker` | Guidance card (ids in `/catalog` `guidance`). `$0.05` | `/sample/guidance/:ticker` |
| `GET /insider/:ticker` | Insider card (ids in `/catalog` `insider`). `$0.05` | `/sample/insider/:ticker` |
| `GET /bundle/:id` | Discounted bundles: SEMIS `$0.30`, CENTRALBANKS `$0.20`, BRICS `$0.20` (ids and discount in `/catalog` `bundles`) | none |
| `GET /sample/history/AMD` | Free filing-history sample, AMD only (other tickers return 404). Catalog `history`: paid history is not available | itself |

Free routes: `/catalog`, `/methodology`, `/updates`, `/status.json`, `/llms.txt`, `/openapi.json`, `/.well-known/x402`. Unknown ids return a free 404 before any payment. Ids are case-insensitive. `/catalog` lists a `content_hash` for every card.

## Repo layout

| Path | What it does |
|---|---|
| `fd_sample.py` | Free sample CLI. No wallet. `python3 fd_sample.py AAPL` or `--list`. |
| `tests/test_fd_sample.py` | Offline unit tests for that CLI. |
| `docs/REPO_METADATA.md` | Suggested GitHub description and topics for the owner to set by hand. |
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

## Node examples

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
| `FILINGDELTA_BASE` | `https://filingdelta.xyz` | API base URL. Also read by `fd_sample.py`. |

`WATCH_STATE` (optional, default `.watch-state.json`) is read by `earnings-watch.ts`.

`examples/node-pay.mjs` reads `PRIVATE_KEY` instead, and it pays without `CONFIRM_PAY`.

## Safety notes

- **One call at a time.** `paid-call.ts` makes exactly one paid request and never retries. `earnings-watch.ts` pays for at most one card per run. Don't wrap either in a loop.
- **Spend cap.** `budget.ts` refuses a `MAX_USD` above $0.10, and `x402terms.ts` refuses any option above the cap, on another network or asset, or to a different payTo.
- **Dry run by default.** Nothing is paid unless `CONFIRM_PAY=yes`. `examples/node-pay.mjs` is the exception: it pays as soon as `PRIVATE_KEY` is set, and it does not use this cap.
- **Check before paying again.** Compare `content_hash` (free in `/catalog`) with the card you already have.
- **Mainnet only.** FilingDelta has no testnet route. Use a fresh, low-balance wallet. To practise x402 on testnet, use the coinbase/x402 examples.
- **`fd_sample.py` does not pay.** It never sends a wallet or a payment header.

## Licence

MIT. See [LICENSE](LICENSE) (Copyright (c) 2026 FilingDelta).
