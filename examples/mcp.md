# Using FilingDelta over MCP

- Registry name: `xyz.filingdelta/filingdelta`
- Endpoint: `https://filingdelta.xyz/mcp` (JSON-RPC 2.0 over HTTP POST)

Add it to an MCP client that supports remote HTTP servers using that URL. Check your client's docs for the exact config format.

## Tools (from `tools/list`)

Free: `list_filers`, `search_coverage`, `whats_new`, `sample_delta`, `sample_policy`, `sample_macro`, `request_data`.

Paid (x402): `get_filing_delta`, `get_policy`, `get_macro`, `get_bundle`. Prices match the HTTP routes ($0.02 filing and policy cards, $0.01 macro and CPI, bundles as in /catalog).

## Paid calls

An unpaid `tools/call` on a paid tool returns a normal result with `isError: true` and the x402 PaymentRequired object in `structuredContent`. Retry the same call with the signed PaymentPayload in `params._meta["x402/payment"]`; the receipt is returned in `result._meta["x402/payment-response"]`. See https://filingdelta.xyz/llms.txt.

## Quick check without a client

```bash
curl -s -X POST https://filingdelta.xyz/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
