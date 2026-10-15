/**
 * Accept a FilingDelta 402 only when every field is the published Base USDC
 * exact-scheme terms and the amount is at or under the caller's cap.
 */
import type { PaymentRequired, PaymentRequirements } from "@x402/fetch";
import { atomicToUsd } from "./budget.js";

export const BASE_NETWORK = "eip155:8453";
/** Circle USDC on Base. */
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
/** payTo published in FilingDelta 402 responses and /catalog. */
export const FILINGDELTA_PAY_TO = "0x6d41a1B675cCF7980a0254d0C1317CccB4b42f2a";

function rejection(option: PaymentRequirements, maxAtomic: bigint): string {
  const problems: string[] = [];
  if (option.scheme !== "exact") {
    problems.push(`scheme ${option.scheme}`);
  }
  if (option.network !== BASE_NETWORK) {
    problems.push(`network ${option.network}`);
  }
  if (option.asset.toLowerCase() !== BASE_USDC.toLowerCase()) {
    problems.push(`asset ${option.asset}`);
  }
  if (option.payTo.toLowerCase() !== FILINGDELTA_PAY_TO.toLowerCase()) {
    problems.push(`payTo ${option.payTo}`);
  }
  if (!/^\d+$/.test(option.amount)) {
    problems.push(`amount ${option.amount}`);
  } else if (BigInt(option.amount) > maxAtomic) {
    problems.push(
      `amount ${option.amount} ($${atomicToUsd(BigInt(option.amount))}) is above the cap ${maxAtomic.toString()} ($${atomicToUsd(maxAtomic)})`,
    );
  }
  return problems.length === 0 ? "" : `Rejected ${problems.join(", ")}.`;
}

/**
 * Return the single acceptable payment option.
 * Zero or more than one acceptable option is a refusal: the caller does not pay.
 */
export function selectAcceptedOption(
  required: PaymentRequired,
  maxAtomic: bigint,
): PaymentRequirements {
  if (required.x402Version !== 2) {
    throw new Error(`Refusing x402Version ${String(required.x402Version)}. No payment made.`);
  }
  const accepts = required.accepts ?? [];
  if (accepts.length === 0) {
    throw new Error("402 had no payment options. No payment made.");
  }
  const accepted = accepts.filter((option) => rejection(option, maxAtomic) === "");
  if (accepted.length !== 1) {
    const details = accepts.map((option) => rejection(option, maxAtomic)).filter((line) => line !== "");
    throw new Error(
      `Refusing payment terms (${accepted.length} acceptable options of ${accepts.length}). ${details.join(" ")} No payment made.`,
    );
  }
  const chosen = accepted[0];
  if (!chosen) {
    throw new Error("402 had no acceptable payment option. No payment made.");
  }
  return chosen;
}
