# FilingDelta examples

[FilingDelta](https://filingdelta.xyz) sells small, cited JSON "what changed" cards for agents: SEC filings for 19 tickers, rate decisions from 7 central banks, and US macro releases (CPI, GDP, nonfarm payrolls). Each call is paid per request in USDC on Base mainnet using the [x402](https://www.x402.org) protocol. No account or API key.

This repo holds copy-paste examples. Nothing here is investment advice, and the cards describe what filings say, not what to do about it.

## Prices (as shown in [/catalog](https://filingdelta.xyz/catalog))

| Route | Price |
|---|---|
| `/delta/:ticker` SEC filing card | $0.10 |
| `/policy/:id` central-bank decision card | $0.10 |
| `/macro/:id` (NFP, GDP, CPI) and `/cpi/US` | $0.05 |
| `/bundle/SEMIS` (9 chip filing cards) | $0.63 (individual total $0.90) |
| `/bundle/CENTRALBANKS` (7 cards) | $0.49 (individual total $0.70) |
| `/catalog`, `/sample/...`, `/llms.txt`, `/openapi.json`, `/updates` | free |

Unknown tickers and ids return a free 404 before any payment. Prices may change; the live `/catalog` is the source of truth.

## Free samples are trimmed examples

The `/sample/...` routes are free, labelled examples. Filing and macro samples are trimmed views of the paid card (fewer changes or items). Policy samples are the previous meeting's card, not the latest decision. **The paid card is the full latest card.** The files in `examples/samples/` are captured from the live site on 2026-10-15 and will age.

## How an x402 request works

1. `GET https://filingdelta.xyz/delta/AMD` with no payment returns `402 Payment Required`.
2. The `PAYMENT-REQUIRED` header holds base64 JSON: scheme `exact`, network `eip155:8453` (Base), USDC amount and the `payTo` address.
3. Your x402 client signs a USDC authorisation with your wallet.
4. It retries the same request with a `PAYMENT-SIGNATURE` header.
5. You get `200` with the card JSON, and a receipt in the `PAYMENT-RESPONSE` header.

## Contents

- [examples/curl.md](examples/curl.md): the unpaid 402 and a free sample call
- [examples/node-pay.mjs](examples/node-pay.mjs): a short Node client using `@x402/fetch`
- [examples/samples/](examples/samples): real free sample responses (AMD filing, CPI macro, BOE policy)
- [examples/mcp.md](examples/mcp.md): using FilingDelta over MCP

## Links

- Site: https://filingdelta.xyz
- Catalog: https://filingdelta.xyz/catalog
- LLM-readable summary: https://filingdelta.xyz/llms.txt
- OpenAPI: https://filingdelta.xyz/openapi.json
- MCP registry name: `xyz.filingdelta/filingdelta`

## License

MIT, see [LICENSE](LICENSE).
