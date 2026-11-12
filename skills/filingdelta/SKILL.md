---
name: filingdelta
description: >
  Fetch FilingDelta's cited JSON cards: what changed in a company's latest SEC
  filing, central-bank rate decisions, US macro and CPI releases, from
  filingdelta.xyz. Use when the user asks what changed between filings, wants a
  central-bank decision card, or asks how to call FilingDelta over HTTP or MCP
  or how to pay for it (x402 in USDC on Base, or an X-API-Key credit key).
  Start with the free /catalog and /sample routes. Never pay without the
  user's say-so. Not investment advice.
license: MIT
---

# FilingDelta

FilingDelta (https://filingdelta.xyz) sells small JSON cards that say what changed in an official document and cite the source: SEC filings (the change against the prior period, each change cited to EDGAR) and central-bank decisions (decision, rate, change in basis points, vote and dissent where published, next decision date, source link). It also has US macro (CPI, nonfarm payrolls, GDP), CPI by area, and a few other card families. Cards summarise published documents. They are not investment advice and not a trading signal.

Do not rely on this file for prices, ids or counts. Read them from the live service (steps 1 and 3).

## When to use

- The user wants the material changes in a company's latest 10-Q, 10-K, 20-F or 6-K, plus newer 8-K items that matter, with citations.
- The user wants a central bank's latest rate decision as structured data with a source link.
- The user wants US macro or CPI release cards.
- The user asks how to connect to FilingDelta over MCP, or how to pay for a card.

## When not to use

- The company or bank is not in the catalog. Say so; do not guess an id. The `request_data` MCP tool (or `POST /request`) lets the user ask for coverage.
- The user wants raw financial statement rows, prices or a full text diff. Cards highlight the changes that matter; they are not a full text diff.
- The user wants a buy or sell recommendation. A card describes a document; it does not give advice.

## 1. Browse the catalog (free)

`GET https://filingdelta.xyz/catalog` returns JSON with no payment and no account:

- `filers`: tickers with SEC filing cards.
- `policy`: central-bank ids.
- `macro`, `cpi_ids`, `bundles`, and other families (`guidance`, `insider`, `window`, `saydo`).
- `prices`: the price of each paid route, with `amount_base_units`.
- `cards`: per card, `as_of`, `next_update` and `content_hash`.

Ask for JSON with `Accept: application/json`. Use only ids that appear in the catalog.

## 2. Try a free sample (free)

Every card family has a free sample route. No payment, no key:

- `GET /sample/{ticker}`, for example `/sample/AMD`: the filing card trimmed to one change in full, with the other changes as teasers (category, section, materiality). The `comparison_basis` field says how many changes the paid card has.
- `GET /sample/policy/{id}`, for example `/sample/policy/BOE`: the bank's previous meeting as a full card in the same schema as the paid card, plus a `latest` object with the current meeting's date and `content_hash`.
- `GET /sample/macro/{id}` (ids from `macro` in the catalog) and `GET /sample/cpi/{id}` (ids from `cpi_ids`): trimmed views.
- `GET /sample/{family}/{ticker}` for `guidance`, `insider`, `window` and `saydo`, with tickers from the catalog.

Use the sample to check the schema before paying. An unknown id returns a free 404 whose JSON body lists the valid ids and an example URL. A lowercase id for a known card gets a 301 to the uppercase id, with no charge.

## 3. Paid cards: ask the user first

Paid routes are `GET /delta/{ticker}`, `/policy/{id}`, `/macro/{id}`, `/cpi/{id}`, `/guidance/{ticker}`, `/insider/{ticker}`, `/window/{ticker}`, `/saydo/{ticker}` and `/bundle/{id}`. A bundle returns several cards in one call at a lower total price.

**Before any payment, tell the user the route and the price and get an explicit yes.** Spend only from the user's own wallet or credit key. Never invent, borrow or reuse a wallet or key.

Check what a card costs with an unpaid request. It costs nothing:

```
curl -s -D - -o /dev/null https://filingdelta.xyz/delta/AMD
```

The reply is HTTP 402 with the x402 PaymentRequired object, base64, in the `PAYMENT-REQUIRED` header. Decode it and read `accepts[0].amount` (USDC base units, 6 decimals; 50000 is $0.05 at the time of writing), `asset`, `network` (`eip155:8453`, Base mainnet) and `payTo`. Use the values from the live reply, not from this file. A paid call for an id that is not in the catalog returns 404 before any payment.

### Pay per card with x402 (USDC on Base)

1. Request the paid route. You get the 402 above.
2. Sign an x402 v2 `exact` payment for that amount to the `payTo` in the reply, using the user's wallet and an x402 client library.
3. Retry the same request with the header `PAYMENT-SIGNATURE: <base64 PaymentPayload>`.
4. The card comes back as JSON. The settlement receipt is in the `PAYMENT-RESPONSE` header.

### Pay with a credit key (X-API-Key)

If the user has no wallet, they can buy a credit pack by card at https://filingdelta.xyz/buy. The key is shown once, so they must save it. The user completes the card purchase themselves.

Send the key as a header on any paid route:

```
curl -s -H "X-API-Key: $FILINGDELTA_KEY" https://filingdelta.xyz/policy/BOE
```

The response is the same card JSON as an x402 payment. Each card uses 1 credit, and a bundle uses 1 credit per card in it. Credits do not expire. A missing or unrecognised key gets the normal 402. A recognised key that does not have enough credits for the card (none left, or fewer than a bundle needs) gets HTTP 402 with a JSON body whose `error` is `credits_exhausted`, not the x402 PaymentRequired reply, and no credit is used. Then buy a new pack at /buy, or pay with x402 and send no key. Read the key from an environment variable or secret store. Never print it, log it or put it in a URL or a file you commit.

Re-buy only if the card changed: compare the card's `content_hash` in the catalog with the one you already have.

## 4. MCP

- Endpoint: `https://filingdelta.xyz/mcp` (Streamable HTTP, JSON-RPC 2.0 over POST). A browser GET shows an error because it only speaks POST. The Official MCP Registry name is `xyz.filingdelta/filingdelta`.
- In a client that supports remote HTTP MCP servers, add a server with that URL. Example config, the same shape as the one in the FilingDelta examples repo:

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

- Call `tools/list` for the current tools. At the time of writing:
  - Free (no payment): `list_filers`, `search_coverage`, `whats_new`, `sample_delta`, `sample_policy`, `sample_macro`, `sample_cpi`, `request_data`.
  - Paid: `get_filing_delta`, `get_policy`, `get_macro`, `get_cpi`, `get_bundle`, `get_guidance`, `get_insider`, `get_window`, `get_saydo`.
- Start with `list_filers` (coverage and prices) and the matching `sample_*` tool.

### Sending a credit key on the MCP connection

The MCP server forwards an `X-API-Key` header that it receives on the MCP connection to the paid routes. To use a credit key this way, configure your client to send the key as an `X-API-Key` HTTP header on the MCP connection, for example in the `headers` setting of a remote server entry, with the value read from a secret store, then call the paid tool. The key is read from the HTTP header only; a key placed in tool arguments or in `_meta` is not used. If a paid tool still returns the x402 PaymentRequired, pay with x402 as below, or call the HTTP route with the key.

### Paid MCP tools with x402

An unpaid call to a paid tool returns a normal result with `isError: true` and the x402 PaymentRequired in `structuredContent` (the same object as the `PAYMENT-REQUIRED` header of the matching HTTP route). Retry the same `tools/call` with the signed PaymentPayload in `params._meta["x402/payment"]`, or with the `PAYMENT-SIGNATURE` header. The receipt is in `result._meta["x402/payment-response"]`. An unknown id returns 404 with no charge.

## 5. Errors

| Status | Meaning | Charged? |
|---|---|---|
| 200 | Free route, or paid route after valid payment or a valid key | Only on the paid route |
| 301 | Lowercase or padded id of a known card: use the canonical URL in `Location` | No |
| 402 | Paid route called without payment: read the price, ask the user, then pay | No |
| 404 | Id or path not served: the JSON body lists valid ids and an example URL | No |

## 6. Citing and limits

- Each card carries a `source_url` (SEC filing on EDGAR, or the central bank's own statement). Cite it when you use a card.
- State the card's date (`as_of` in the catalog, `filing_date` or the meeting date in the card). Cards describe a published document at a point in time.
- Terms: https://filingdelta.xyz/terms. Docs: https://filingdelta.xyz/docs. Agent notes: https://filingdelta.xyz/llms.txt. OpenAPI: https://filingdelta.xyz/openapi.json.
- Not investment advice. FilingDelta summarises published documents.
