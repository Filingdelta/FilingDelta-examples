# FilingDelta

Know what changed in the filing or the decision, with the source link, not just the numbers.

FilingDelta (https://filingdelta.xyz) sells paid JSON cards that say what changed in a published document and cite the source. The [catalog](https://filingdelta.xyz/catalog) covers central-bank rate decisions, SEC filings, US macro and CPI releases, and the other card families listed there, plus bundles of those cards. Pay per card in USDC on Base via x402, or with a credit key from a pack bought by card at [/buy](https://filingdelta.xyz/buy). A card is a summary of published documents. It is not investment advice and not a trading signal. FilingDelta is not affiliated with or endorsed by the Bank of England.

Base URL: `https://filingdelta.xyz`. Every route returns JSON unless noted. Ids are uppercase. Prices, ids and `content_hash` values are in `/catalog`. The figures below are from the catalog, the docs and unpaid calls on 12 Nov 2026.

## Central-bank decisions

`GET /policy/:id` is one bank’s latest rate decision: hike, hold or cut, the policy rate, the change in basis points, vote and dissent where published, the next decision date, and a link to the bank’s own statement.

[llms.txt](https://filingdelta.xyz/llms.txt) lists the fields `id`, `institution`, `body`, `card_type`, `decision`, `bank_rate`, `bank_rate_unit`, `previous_bank_rate`, `change_bps`, `vote`, `dissent`, `meeting_ended`, `published`, `next_decision`, `inflation`, `inflation_target`, `summary`, `why_it_matters`, `source_url` and `generated_at`.

On 12 Nov 2026, `/catalog` `policy` had 22 ids (BOE, FED, ECB, BOJ, RBA, BOC, SNB, NOR, SWE, MEX, BOK, TUR, IND, ZAF, CHN, IDN, ETH, RUS, EGY, IRN, BCB, NZL). Example: `GET /policy/BOE`.

A sample needs no payment and no key. `GET /sample/policy/:id` is the previous meeting as a full card (`sample_of` `previous_meeting`, `access` `full`), plus `latest` with the current meeting date, `access` `paid`, `content_hash` and `buy_with`.

```bash
curl -sS https://filingdelta.xyz/sample/policy/BOE
```

Checked 12 Nov 2026: HTTP 200, `id` `BOE`, `sample_of` `previous_meeting`.

Bundles of these cards are in `/catalog` `bundles`: `CENTRALBANKS` (BOE, FED, ECB, BOJ, RBA, BOC, SNB) and `BRICS` (BCB, IND, ZAF, CHN, RUS, IDN, ETH, EGY, IRN). Bundles have no sample route.

[llms.txt](https://filingdelta.xyz/llms.txt) also lists two Bank of England / PRA summaries that need no payment, in FilingDelta’s own wording, with source links: [/free/uk/PRA-POLICY](https://filingdelta.xyz/free/uk/PRA-POLICY) and [/free/uk/BOE-FPC](https://filingdelta.xyz/free/uk/BOE-FPC).

An unknown id returns HTTP 404 before any payment. The JSON lists the valid ids and an example URL. A lowercase or padded id of a known card returns 301 to the canonical uppercase id before the paywall, with no charge.

## SEC filing deltas

`GET /delta/:ticker` is the SEC filing card. The [docs](https://filingdelta.xyz/docs) describe it as the material changes in a company’s latest 10-Q, 10-K, 20-F or 6-K, plus newer 8-K items that matter. Each change has a materiality rating, why it matters, and an EDGAR citation. `source_url` points at the filing.

On 12 Nov 2026, `/catalog` `filers` had 28 tickers (AMD, MRVL, NVDA, AVGO, TSM, MU, AMAT, AAPL, MSFT, META, TSLA, ORCL, INTC, ASML, MSTR, JPM, BAC, GS, WFC, NFLX, JNJ, BRK, PLTR, SPCX, GOOGL, LLY, LRCX, BA). Example: `GET /delta/AAPL`.

`GET /sample/:ticker` needs no payment. [llms.txt](https://filingdelta.xyz/llms.txt) describes it as one change in full, as in the paid card, and every other change as a teaser. Checked 12 Nov 2026: [/sample/AAPL](https://filingdelta.xyz/sample/AAPL) returned HTTP 200 with `access` `teaser`.

```bash
curl -sS https://filingdelta.xyz/sample/AAPL
```

The catalog bundle `SEMIS` is AMD, MRVL, NVDA, AVGO, TSM, MU, AMAT, INTC, ASML.

The same catalog lists US macro (`NFP`, `GDP`, `CPI`), CPI ids (`US`, `UK`, `EA`, `JP`), and the `guidance`, `insider`, `window` and `saydo` families. The [docs](https://filingdelta.xyz/docs) describe `GET /macro/NFP` as the latest nonfarm payrolls, GDP or CPI release (five items with verbatim official figures from BLS or BEA, and the next release date) and `GET /cpi/US` as consumer-price cards for the US, UK, euro area HICP and Japan. Samples: `/sample/macro/NFP`, `/sample/cpi/US`. Ids and prices for every family are in `/catalog`.

`content_hash` for every card is in `/catalog`. The docs say a card only changes when its source does, so buy again only when the hash has changed.

## Quick start

These commands were run on 12 Nov 2026. None of them pays.

### Pay per card with x402 (Base USDC)

An unpaid request returns HTTP 402. The price is in the `PAYMENT-REQUIRED` header (base64 JSON) and in the body.

```bash
curl -si https://filingdelta.xyz/policy/BOE
```

Checked: HTTP 402, body `"error": "payment_required"`, header `PAYMENT-REQUIRED` present. Decoded `accepts[0]`:

| Field | Value |
|---|---|
| `scheme` | `exact` |
| `network` | `eip155:8453` (Base) |
| `amount` | `50000` (USDC base units, 6 decimals; the docs say `50000` is $0.05) |
| `asset` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| `payTo` | `0x6d41a1B675cCF7980a0254d0C1317CccB4b42f2a` |
| `maxTimeoutSeconds` | `300` |

`x402Version` was `2`. The same scheme, network, amount, asset and `payTo` came back on an unpaid `GET /delta/AAPL`.

Decode the header:

```bash
curl -si https://filingdelta.xyz/policy/BOE | grep -i '^payment-required:' | cut -d' ' -f2 | tr -d '\r' | base64 -d | python3 -m json.tool
```

Sign an x402 v2 exact payment of that amount to `payTo`, then retry the same URL with header `PAYMENT-SIGNATURE` set to the base64 PaymentPayload. The card comes back as JSON. The receipt is in `PAYMENT-RESPONSE`.

This repo’s capped client is [examples/paid-call.ts](examples/paid-call.ts). It prints the 402 and stops unless `CONFIRM_PAY=yes`. A decoded 402 for a filing card is in [examples/curl.md](examples/curl.md). Discovery: [/.well-known/x402](https://filingdelta.xyz/.well-known/x402).

### Pay with a credit key

Buy a pack by card at [/buy](https://filingdelta.xyz/buy). On 12 Nov 2026 that page offered **$5 for 100 cards** and **$20 for 450 cards (includes 50 bonus cards)**. Card payments are processed by Stripe. FilingDelta never sees your card number. The key is shown once on the page you return to, so copy it then.

Send it as `X-API-Key` on any paid route. The response is the same card JSON as an x402 payment. Each card uses 1 credit. A bundle uses 1 credit per card in it. Credits do not expire.

```bash
curl -sS -H "X-API-Key: fdk_YOUR_KEY" https://filingdelta.xyz/policy/BOE
```

Checked with that placeholder: HTTP 402, `"error": "payment_required"`, and a `PAYMENT-REQUIRED` header. Replace `fdk_YOUR_KEY` with the key from `/buy`. Read it from an environment variable. Do not commit it.

```bash
curl -sS -H "X-API-Key: $FILINGDELTA_KEY" https://filingdelta.xyz/policy/BOE
```

`GET /buy/balance` with a valid key returns `{"credits_remaining": …}`. Checked with `X-API-Key: fdk_YOUR_KEY`: HTTP 401, `"error": "unauthorized"`.

The [skill](https://filingdelta.xyz/.well-known/skills/default/skill.md) says a recognised key with too few credits returns HTTP 402 with `"error": "credits_exhausted"`, and no credit is used. The MCP server forwards an `X-API-Key` header on the MCP connection to the paid routes. A key placed in tool arguments or in `_meta` is not used.

Use a key you already have at [/credits](https://filingdelta.xyz/credits), a click-only page for using your credits.

### MCP

Endpoint: `https://filingdelta.xyz/mcp`, Streamable HTTP (JSON-RPC 2.0 over POST). The free tools need no sign-in. In an MCP client that supports remote servers, add a custom server with that URL. Opening it in a browser shows an error because it only speaks POST. Checked 12 Nov 2026: `GET /mcp` returned HTTP 405 with `Allow: POST`. The Official MCP Registry name is `xyz.filingdelta/filingdelta`.

```bash
curl -s https://filingdelta.xyz/mcp \
    -H 'content-type: application/json' \
    -H 'accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
         "params":{"name":"sample_delta","arguments":{"ticker":"AMD"}}}'
```

Checked: HTTP 200. The same call for `sample_policy` with `{"id":"BOE"}` also returned HTTP 200.

[mcp/config.json](mcp/config.json) is the client entry from the [skill](https://filingdelta.xyz/.well-known/skills/default/skill.md):

```json
{
  "mcpServers": {
    "filingdelta": {
      "type": "http",
      "url": "https://filingdelta.xyz/mcp"
    }
  }
}
```

Send `tools/list` for the current names. On 12 Nov 2026, `tools/list` returned the 17 names in the skill:

- No payment: `list_filers`, `search_coverage`, `whats_new`, `sample_delta`, `sample_policy`, `sample_macro`, `sample_cpi`, `request_data`
- Paid: `get_filing_delta`, `get_policy`, `get_macro`, `get_cpi`, `get_bundle`, `get_guidance`, `get_insider`, `get_window`, `get_saydo`

An unpaid `tools/call` on a paid tool returns a normal result with `isError: true` and the x402 PaymentRequired object in `structuredContent` (a JSON copy in `content[0].text`). Checked: `get_policy` for `BOE` did that, with `accepts[0].scheme` `exact`, `network` `eip155:8453` and `amount` `50000`. Retry the same `tools/call` with the PaymentPayload in `params._meta["x402/payment"]`, or with header `PAYMENT-SIGNATURE`. The receipt is in `result._meta["x402/payment-response"]`.

Client notes and another `tools/list` curl: [examples/mcp.md](examples/mcp.md).

## Links

- [Buy a credit pack](https://filingdelta.xyz/buy)
- [Use your credits](https://filingdelta.xyz/credits) — click-only page for a key you already have
- [Catalog](https://filingdelta.xyz/catalog) — JSON at [/catalog?format=json](https://filingdelta.xyz/catalog?format=json) or `Accept: application/json`
- [Docs](https://filingdelta.xyz/docs)
- [Updates](https://filingdelta.xyz/updates)
- [llms.txt](https://filingdelta.xyz/llms.txt)
- [OpenAPI](https://filingdelta.xyz/openapi.json) (OpenAPI 3.1; linked from llms.txt and the docs)
- [Agent skill](https://filingdelta.xyz/.well-known/skills/default/skill.md) — live markdown. The copy in this repo is [skills/filingdelta/SKILL.md](skills/filingdelta/SKILL.md)
- [x402 discovery](https://filingdelta.xyz/.well-known/x402)

Install the skill from this repo:

```bash
npx skills add Filingdelta/FilingDelta-examples --skill filingdelta
```

Checked 12 Nov 2026, after that file landed on `main`: the command installed the `filingdelta` skill.

## Pricing

Card prices are the `/catalog` `prices` map. On 12 Nov 2026 that map, `paid_price`, `network` and `asset` were:

| Route | price | amount_base_units |
|---|---|---|
| `/delta/:ticker` | $0.05 | 50000 |
| `/policy/:id` | $0.05 | 50000 |
| `/macro/:id` | $0.05 | 50000 |
| `/cpi/US` | $0.05 | 50000 |
| `/guidance/:ticker` | $0.05 | 50000 |
| `/insider/:ticker` | $0.05 | 50000 |
| `/window/:ticker` | $0.05 | 50000 |
| `/saydo/:ticker` | $0.05 | 50000 |
| `/bundle/SEMIS` | $0.30 | 300000 |
| `/bundle/CENTRALBANKS` | $0.20 | 200000 |
| `/bundle/BRICS` | $0.20 | 200000 |

`paid_price` was `$0.05`, `network` was `Base mainnet`, `asset` was `USDC`, and `payTo` was `0x6d41a1B675cCF7980a0254d0C1317CccB4b42f2a`. `cpi_ids` were `US`, `UK`, `EA`, `JP`, and `paid_cpi_price` was `$0.05`. The `prices` key for CPI is `/cpi/US`.

Credit-pack labels are on [/buy](https://filingdelta.xyz/buy). On 12 Nov 2026 they were $5 for 100 cards, and $20 for 450 cards (includes 50 bonus cards). One credit pays for one card. A bundle spends one credit per card inside it.

If this table and the live catalog disagree, use the catalog.

## Examples in this repo

`examples/paid-call.ts` and `examples/earnings-watch.ts` pay only when `CONFIRM_PAY=yes`. [examples/node-pay.mjs](examples/node-pay.mjs) pays as soon as `PRIVATE_KEY` is set.

### Python CLI

[`fd_sample.py`](fd_sample.py) uses the standard library. It calls `GET /sample/{ticker}` and, with `--list`, `GET /catalog`. It does not call a paid route and does not send a wallet or an API key. `FILINGDELTA_BASE` overrides the host (default `https://filingdelta.xyz`).

```bash
python3 fd_sample.py AAPL
python3 fd_sample.py --list
python3 fd_sample.py NOSUCH
python3 -m unittest discover -s tests -v
```

The unit tests do not call filingdelta.xyz.

### Node

Pinned in [package.json](package.json): `@x402/fetch` 2.28.0, `@x402/evm` 2.28.0, `viem` 2.57.7.

```bash
npm install
npm run free          # bash examples/curl-free-sample.sh
npm run paid          # tsx examples/paid-call.ts, default path /delta/AMD
npm run paid -- /policy/BOE
npm run watch         # tsx examples/earnings-watch.ts
npm run typecheck
```

`npm run free` expects HTTP 200 from `/catalog`, `/sample/AMD`, `/sample/policy/FED`, `/sample/history/AMD` and `/updates`, then HTTP 402 with `PAYMENT-REQUIRED` on `/delta/AMD`.

`npm run paid` prints the 402 and `Dry run: set CONFIRM_PAY=yes to pay. No payment made.` To pay for one card:

```bash
cp .env.example .env
set -a; . ./.env; set +a
CONFIRM_PAY=yes npm run paid -- /policy/BOE
```

The scripts read `process.env`. They do not load `.env` themselves. `.env` is git-ignored.

| Path | What it does |
|---|---|
| [`fd_sample.py`](fd_sample.py) | Sample CLI. No wallet and no API key. |
| [`tests/test_fd_sample.py`](tests/test_fd_sample.py) | Offline tests for that CLI. |
| [`examples/curl-free-sample.sh`](examples/curl-free-sample.sh) | `npm run free`. |
| [`examples/paid-call.ts`](examples/paid-call.ts) | One paid call. Dry run unless `CONFIRM_PAY=yes`. No retry. |
| [`examples/earnings-watch.ts`](examples/earnings-watch.ts) | Hashes free samples, checks `/catalog` `content_hash`, and calls `paidCallOnce` for at most one changed ticker. The first sight of a ticker is a baseline and is not paid for. |
| [`examples/x402terms.ts`](examples/x402terms.ts) | Accepts a 402 only for scheme `exact`, Base USDC, FilingDelta’s `payTo`, at or under the cap. |
| [`examples/budget.ts`](examples/budget.ts) | `MAX_USD` defaults to `0.10` and refuses a value above $0.10. |
| [`examples/curl.md`](examples/curl.md) | Unpaid 402 and sample curls. |
| [`examples/node-pay.mjs`](examples/node-pay.mjs) | `@x402/fetch` client. Pays when `PRIVATE_KEY` is set, with the library default cap of $1. |
| [`examples/mcp.md`](examples/mcp.md) | MCP curl and client notes. |
| [`examples/samples/`](examples/samples/) | Sample JSON captured 29 Oct 2026. See [examples/samples/README.md](examples/samples/README.md). Current samples are the live `/sample` routes. |
| [`mcp/config.json`](mcp/config.json) | Remote MCP URL. |
| [`skills/filingdelta/SKILL.md`](skills/filingdelta/SKILL.md) | Installable agent skill. |
| [`.env.example`](.env.example) | Variable names. No secrets. |
| [`docs/REPO_METADATA.md`](docs/REPO_METADATA.md) | Suggested GitHub description and topics, for the owner to set by hand. |

| Variable | Default | Meaning |
|---|---|---|
| `EVM_PRIVATE_KEY` | empty | Wallet key for `paid-call.ts`. `0x` plus 64 hex characters. |
| `CONFIRM_PAY` | `no` | Set to `yes` before `paid-call.ts` pays. |
| `MAX_USD` | `0.10` | Per-call cap. Values above $0.10 are refused. |
| `WATCH_TICKERS` | `AMD,NVDA,TSM` | Tickers for `npm run watch`. |
| `FILINGDELTA_BASE` | `https://filingdelta.xyz` | API base URL. Also read by `fd_sample.py`. |
| `PRIVATE_KEY` | unset | Used only by `examples/node-pay.mjs`. |

`WATCH_STATE` (optional, default `.watch-state.json`) is read by `earnings-watch.ts`.

Paid calls in the live API are on Base mainnet (`eip155:8453`). Compare `content_hash` in `/catalog` with a card you already have before paying again.

## Licence

MIT. See [LICENSE](LICENSE) (Copyright (c) 2026 FilingDelta).
