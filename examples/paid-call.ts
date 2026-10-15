/**
 * paidCallOnce(path) makes one capped call.
 * It GETs the route, reads the free 402, and stops unless CONFIRM_PAY=yes.
 * The paid request is a single GET with PAYMENT-SIGNATURE. There is no retry.
 */
import { pathToFileURL } from "node:url";
import {
  decodePaymentResponseHeader,
  x402Client,
  x402HTTPClient,
  type PaymentRequired,
  type PaymentRequirements,
} from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { atomicToUsd, filingDeltaBase, readMaxAtomic } from "./budget.js";
import { selectAcceptedOption } from "./x402terms.js";

export type PaidCallResult = {
  paid: boolean;
};

function resolvePath(resourcePath: string): URL {
  if (
    !resourcePath.startsWith("/") ||
    resourcePath.startsWith("//") ||
    resourcePath.includes("?") ||
    resourcePath.includes("#") ||
    resourcePath.includes("\\") ||
    resourcePath.includes("..")
  ) {
    throw new Error(`Path must look like /delta/AMD, got ${JSON.stringify(resourcePath)}`);
  }
  return new URL(resourcePath, `${filingDeltaBase()}/`);
}

function readPrivateKey(): `0x${string}` {
  const key = process.env.EVM_PRIVATE_KEY ?? "";
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "Refusing to pay: EVM_PRIVATE_KEY must be 0x plus 64 hex characters. No payment made.",
    );
  }
  return key as `0x${string}`;
}

function printTerms(url: URL, required: PaymentRequired, chosen: PaymentRequirements): void {
  console.log(`GET ${url.href}`);
  console.log(`402 ${required.error ?? "Payment Required"}`);
  console.log(`x402Version: ${required.x402Version}`);
  console.log(`scheme: ${chosen.scheme}`);
  console.log(`network: ${chosen.network}`);
  console.log(`amount: ${chosen.amount} ($${atomicToUsd(BigInt(chosen.amount))})`);
  console.log(`asset: ${chosen.asset}`);
  console.log(`payTo: ${chosen.payTo}`);
  console.log(`resource: ${required.resource.url}`);
}

export async function paidCallOnce(resourcePath: string): Promise<PaidCallResult> {
  const maxAtomic = readMaxAtomic();
  const url = resolvePath(resourcePath);
  const response = await fetch(url, { method: "GET" });
  const text = await response.text();
  let body: unknown;
  if (text.length > 0) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }
  if (response.status !== 402) {
    throw new Error(
      `${url.pathname} returned ${response.status}, not 402. No payment made. Body: ${text.slice(0, 300)}`,
    );
  }

  const httpClient = new x402HTTPClient(new x402Client());
  const required = httpClient.getPaymentRequiredResponse((name) => response.headers.get(name), body);
  const chosen = selectAcceptedOption(required, maxAtomic);
  printTerms(url, required, chosen);

  if (process.env.CONFIRM_PAY !== "yes") {
    console.log("Dry run: set CONFIRM_PAY=yes to pay. No payment made.");
    return { paid: false };
  }

  const account = privateKeyToAccount(readPrivateKey());
  const client = new x402Client();
  registerExactEvmScheme(client, { signer: account, networks: ["eip155:8453"] });
  client.setSpendControls({ maxAmountPerPayment: `$${atomicToUsd(maxAtomic)}` });
  const paying = new x402HTTPClient(client);
  const narrowed: PaymentRequired = { ...required, accepts: [chosen] };
  const payload = await client.createPaymentPayload(narrowed);
  const headers = new Headers();
  for (const [key, value] of Object.entries(paying.encodePaymentSignatureHeader(payload))) {
    headers.set(key, value);
  }

  const paid = await fetch(url, { method: "GET", headers });
  const paidText = await paid.text();
  let paidBody: unknown = paidText;
  if (paidText.length > 0) {
    try {
      paidBody = JSON.parse(paidText) as unknown;
    } catch {
      paidBody = paidText;
    }
  }
  console.log(JSON.stringify(paidBody, null, 2));
  const receiptHeader = paid.headers.get("PAYMENT-RESPONSE");
  if (receiptHeader) {
    console.log(JSON.stringify(decodePaymentResponseHeader(receiptHeader), null, 2));
  } else {
    console.log("No PAYMENT-RESPONSE header.");
  }
  if (paid.status !== 200) {
    throw new Error(`Paid call returned ${paid.status}. Not retried.`);
  }
  return { paid: true };
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
  const resourcePath = process.argv[2] ?? "/delta/AMD";
  paidCallOnce(resourcePath).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
