/** Shared spend cap. MAX_USD defaults to $0.10 and cannot be set higher. Live prices: https://filingdelta.xyz/catalog (single cards are $0.01-$0.02). */

const USDC_ATOMIC_PER_DOLLAR = 1_000_000n;

/** $0.10 in USDC base units (6 decimals). */
export const HARD_CAP_ATOMIC = 100_000n;

/**
 * Parse a dollar string into USDC base units.
 * More than 6 decimal places is refused so the value is never rounded up.
 */
export function parseUsdToAtomic(usd: string): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(usd.trim());
  if (!match) {
    throw new Error(
      `MAX_USD must be a positive decimal with at most 6 places, got ${JSON.stringify(usd)}`,
    );
  }
  const whole = match[1] ?? "";
  const frac = match[2] ?? "";
  if (whole.length > 1 && whole.startsWith("0")) {
    throw new Error("MAX_USD must not have leading zeros");
  }
  if (frac.length > 6) {
    throw new Error("MAX_USD has more than 6 decimal places");
  }
  const atomic =
    BigInt(whole) * USDC_ATOMIC_PER_DOLLAR + BigInt(frac.padEnd(6, "0") || "0");
  if (atomic <= 0n) {
    throw new Error("MAX_USD must be greater than 0");
  }
  return atomic;
}

/** Read MAX_USD. Missing means $0.10. Above $0.10 throws before any request. */
export function readMaxAtomic(): bigint {
  const raw = process.env.MAX_USD ?? "0.10";
  const atomic = parseUsdToAtomic(raw);
  if (atomic > HARD_CAP_ATOMIC) {
    throw new Error(`MAX_USD ${raw} is above the $0.10 hard ceiling. No payment made.`);
  }
  return atomic;
}

/** Format USDC base units as a dollar string without trailing zeros. */
export function atomicToUsd(amount: bigint): string {
  if (amount < 0n) {
    throw new Error("amount is negative");
  }
  const whole = amount / USDC_ATOMIC_PER_DOLLAR;
  let frac = (amount % USDC_ATOMIC_PER_DOLLAR).toString().padStart(6, "0").replace(/0+$/, "");
  if (frac.length < 2) {
    frac = frac.padEnd(2, "0");
  }
  return `${whole.toString()}.${frac}`;
}

/** API origin from FILINGDELTA_BASE, defaulting to the public site. */
export function filingDeltaBase(): string {
  const raw = (process.env.FILINGDELTA_BASE ?? "https://filingdelta.xyz").trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("FILINGDELTA_BASE is not a URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("FILINGDELTA_BASE must be http or https");
  }
  if (url.username !== "" || url.password !== "") {
    throw new Error("FILINGDELTA_BASE must not include credentials");
  }
  if (url.search !== "" || url.hash !== "") {
    throw new Error("FILINGDELTA_BASE must not include a query or hash");
  }
  const path = url.pathname.replace(/\/$/, "");
  return `${url.origin}${path}`;
}
