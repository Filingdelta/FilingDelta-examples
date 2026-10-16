# curl examples

## 1. Unpaid request: the 402

```bash
curl -i https://filingdelta.xyz/delta/AMD
```

Returns `HTTP/2 402` with a `payment-required` header (base64 JSON). Decoded and trimmed, it looks like this (captured 2026-10-15):

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
      "amount": "20000",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "payTo": "0x6d41a1B675cCF7980a0254d0C1317CccB4b42f2a",
      "maxTimeoutSeconds": 300
    }
  ]
}
```

Amount is in USDC base units (6 decimals), so `20000` is $0.02. The `payTo` address is the public one FilingDelta publishes in its 402 responses and /catalog.

Decode it yourself:

```bash
curl -si https://filingdelta.xyz/delta/AMD | grep -i '^payment-required:' | cut -d' ' -f2 | tr -d '\r' | base64 -d | python3 -m json.tool
```

An unknown ticker is a free 404:

```bash
curl -i https://filingdelta.xyz/delta/NOSUCH
```

## 2. Free sample

The sample is a labelled, trimmed example; the paid card has every change.

```bash
curl -s https://filingdelta.xyz/sample/AMD
```

Trimmed output (full file in [samples/amd.json](samples/amd.json)):

```json
{
  "ticker": "AMD",
  "source_url": "https://www.sec.gov/Archives/edgar/data/2488/000000248826000123/0000002488-26-000123-index.htm",
  "company": "Advanced Micro Devices, Inc.",
  "period": "Q2 FY2026",
  "period_end": "2026-06-27",
  "filing_type": "10-Q",
  "filing_date": "2026-08-05",
  "accession": "0000002488-26-000123",
  "comparison_basis": "FREE SAMPLE, trimmed: 3 highest-materiality changes of 6 in the latest filing. The paid card has all 6 changes, each with a source line. year-ago quarter and prior disclosure set",
  "changes": [
    {
      "id": 1,
      "category": "segment",
      "summary": "Data Center revenue $6,718 million vs $3,240 million a year ago (+107%). Segment is now 58% of company revenue.",
      "materiality": "high",
      "citation": "Q2 2026 10-Q segment note / earnings release; 58% share: 8-K Ex. 99.1, 4 Aug 2026",
      "why_it_matters": "The business mix has shifted hard into AI/data center; company-level growth is no longer a client/gaming story."
    }
  ],
  "new_material_items_count": 6,
  "high_materiality_count": 4,
  "generated_at": "2026-10-15T09:46:07.187Z"
}
```

Other free samples: `/sample/policy/BOE`, `/sample/macro/CPI`, `/sample/macro/NFP`, `/sample/macro/GDP`. See [/catalog](https://filingdelta.xyz/catalog) for all ids.
