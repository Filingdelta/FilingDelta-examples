# Free sample captures

Each file is a free `GET` of a FilingDelta sample route, captured on 2026-10-29 at about 19:52 UK (GMT) with HTTP 200, pretty-printed with 4-space indents. Apart from formatting, the content is exactly what was served. Samples are labelled teasers or previous-meeting cards, not paid cards. `generated_at` changes on every request.

| File | Route | Shape |
|---|---|---|
| `amd.json` | `/sample/AMD` | SEC sample: one change in full, the rest as teasers with `magnitude` / `magnitude_basis` where given |
| `msft.json` | `/sample/MSFT` | SEC sample, same shape |
| `macro-cpi.json` | `/sample/macro/CPI` | Macro sample: headline items only, `items_hidden` counts the rest |
| `policy-boe.json` | `/sample/policy/BOE` | Previous-meeting full card plus a `latest` pointer |
| `policy-ecb.json` | `/sample/policy/ECB` | Previous-meeting full card plus a `latest` pointer |
| `policy-fed.json` | `/sample/policy/FED` | Previous-meeting full card plus a `latest` pointer |

`buy_with` objects are kept as served. Live prices and ids are in https://filingdelta.xyz/catalog. Not investment advice.
