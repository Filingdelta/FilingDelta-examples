# Using FilingDelta over MCP

Checked 5 Nov 2026:

- Registry name: `xyz.filingdelta/filingdelta` (`GET /mcp/server-card`)
- Endpoint: `https://filingdelta.xyz/mcp`, JSON-RPC 2.0 over HTTP POST. A GET of that URL returns 405.
- Server card remote type: `streamable-http`. `initialize` reported protocol `2025-11-25` and server version `0.5.0` (`serverInfo.name`: `filingdelta`).

Copy-paste client setup is in the README under "MCP".

- Cursor: a remote `url` in `mcp.json` (https://cursor.com/docs/mcp). No local process.
- Claude Desktop: paste `https://filingdelta.xyz/mcp` as a custom connector (Customize → Connectors → Add → Custom → Web). `claude_desktop_config.json` is for local stdio servers, so that file needs the `npx mcp-remote` bridge with `--transport http-only` (Node.js 18+). The server does not use OAuth.

## Tools (from `tools/list`)

Free: `list_filers`, `search_coverage`, `whats_new`, `sample_delta`, `sample_policy`, `sample_macro`, `request_data`.

Paid (x402): `get_filing_delta`, `get_policy`, `get_macro`, `get_cpi`, `get_bundle`. Prices match the HTTP routes; see https://filingdelta.xyz/catalog.

## Paid calls

An unpaid `tools/call` on a paid tool returns a normal result with `isError: true` and the x402 PaymentRequired object in `structuredContent`. Retry the same call with the signed PaymentPayload in `params._meta["x402/payment"]`; the receipt is returned in `result._meta["x402/payment-response"]`. See https://filingdelta.xyz/llms.txt.

## Quick check without a client

```bash
curl -s -X POST https://filingdelta.xyz/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
