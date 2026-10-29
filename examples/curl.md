# curl examples

## 1. Unpaid request: the 402

```bash
curl -i https://filingdelta.xyz/delta/AMD
```

Returns `HTTP/2 402` with a `payment-required` header (base64 JSON). Decoded and trimmed, it looks like this (captured 2026-10-29; `amount` omitted here, read it from the live header or `/catalog`):

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "https://filingdelta.xyz/delta/AMD"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "amount": "<USDC base units, 6 decimals>",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "payTo": "0x6d41a1B675cCF7980a0254d0C1317CccB4b42f2a",
      "maxTimeoutSeconds": 300
    }
  ]
}
```

`amount` is in USDC base units (6 decimals). The `payTo` address is the public one FilingDelta publishes in its 402 responses and /catalog.

Decode it yourself:

```bash
curl -si https://filingdelta.xyz/delta/AMD | grep -i '^payment-required:' | cut -d' ' -f2 | tr -d '\r' | base64 -d | python3 -m json.tool
```

An unknown ticker is a free 404:

```bash
curl -i https://filingdelta.xyz/delta/NOSUCH
```

## 2. Free sample

The sample is labelled and is not the full card: one change in full, the others as teasers (category, section, materiality, and where available `direction`, a `magnitude` bucket and `magnitude_basis`). The paid card has every change in full.

```bash
curl -s https://filingdelta.xyz/sample/AMD
```

Trimmed output (captured 2026-10-29; full file in [samples/amd.json](samples/amd.json)):

```json
{
  "ticker": "AMD",
  "filing_type": "10-Q",
  "filing_date": "2026-08-05",
  "changes": [
    {
      "id": 1,
      "category": "segment",
      "summary": "Data Center revenue $6,718 million vs $3,240 million a year ago (+107%). Segment is now 58% of company revenue.",
      "materiality": "high",
      "access": "full"
    },
    {
      "id": 2,
      "access": "teaser",
      "category": "commitment",
      "magnitude": ">$25B",
      "magnitude_basis": "largest_figure",
      "section": "10-Q commitments / MD&A liquidity",
      "materiality": "high"
    }
  ],
  "access": "teaser",
  "hidden": { "changes": 5, "high_materiality": 3 }
}
```

A policy sample is the previous meeting's full card plus a `latest` object (meeting date, `access: "paid"`, `content_hash`, `buy_with`) and nothing else from the latest meeting:

```bash
curl -s https://filingdelta.xyz/sample/policy/FED
```

Other free samples: `/sample/policy/BOE`, `/sample/policy/ECB`, `/sample/macro/CPI`, `/sample/macro/NFP`, `/sample/macro/GDP`. See [/catalog](https://filingdelta.xyz/catalog) for all ids and [/methodology](https://filingdelta.xyz/methodology) for how cards are built.
