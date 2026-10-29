// Minimal x402 client example for FilingDelta.
// Pattern: wrap fetch with @x402/fetch so a 402 is paid and retried automatically.
// This file pays as soon as PRIVATE_KEY is set. It has no CONFIRM_PAY dry run
// and does not read MAX_USD. @x402/fetch's default spend cap on this client is $1.
// paid-call.ts is the capped dry-run client (EVM_PRIVATE_KEY, CONFIRM_PAY, $0.10).
//
//   npm install
//   PRIVATE_KEY=<your funded Base wallet key> node examples/node-pay.mjs
//
// Use a dedicated wallet holding a small amount of USDC on Base. Never commit a key.

import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const privateKey = process.env.PRIVATE_KEY; // 0x-prefixed hex, supplied by you at runtime
if (!privateKey) {
  console.error("Set PRIVATE_KEY in the environment (a dedicated wallet with a little USDC on Base).");
  process.exit(1);
}

const signer = privateKeyToAccount(privateKey);
const client = new x402Client();
registerExactEvmScheme(client, { signer });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Paid in USDC on Base (price: https://filingdelta.xyz/catalog). Replace AMD with any ticker in https://filingdelta.xyz/catalog
const res = await fetchWithPayment("https://filingdelta.xyz/delta/AMD");
console.log(res.status);
console.log(JSON.stringify(await res.json(), null, 2));
