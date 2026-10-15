/**
 * Hash free filing samples, cross-check them with /catalog content_hash,
 * and call paidCallOnce for at most one changed ticker.
 * The first sight of a ticker is a baseline and is not paid for.
 * A dry run leaves the previous baseline in place for changed tickers.
 */
import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { filingDeltaBase } from "./budget.js";
import { paidCallOnce } from "./paid-call.js";

type CatalogCard = {
  id?: string;
  content_hash?: string;
};

type Catalog = {
  filers?: string[];
  cards?: CatalogCard[];
};

type Entry = {
  sample_hash: string;
  catalog_content_hash: string;
};

type State = {
  version: 1;
  entries: Record<string, Entry>;
};

function watchTickers(): string[] {
  const raw = process.env.WATCH_TICKERS ?? "AMD,NVDA,TSM";
  const tickers = raw
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter((part) => part.length > 0);
  if (tickers.length === 0) {
    throw new Error("WATCH_TICKERS is empty");
  }
  const seen = new Set<string>();
  for (const ticker of tickers) {
    if (!/^[A-Z]{2,5}$/.test(ticker)) {
      throw new Error(`WATCH_TICKERS entry ${JSON.stringify(ticker)} is not a ticker`);
    }
    if (seen.has(ticker)) {
      throw new Error(`WATCH_TICKERS repeats ${ticker}`);
    }
    seen.add(ticker);
  }
  return tickers;
}

function statePath(): string {
  const raw = process.env.WATCH_STATE?.trim();
  return raw && raw.length > 0 ? raw : ".watch-state.json";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { method: "GET" });
  const text = await response.text();
  if (response.status !== 200) {
    throw new Error(`${url} returned ${response.status}. No payment made. ${text.slice(0, 180)}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${url} was not JSON. No payment made.`);
  }
}

/** Same shape as the catalog note: drop generated_at, compact JSON, sha256, first 12 hex chars. */
function sampleHash(body: Record<string, unknown>): string {
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (key !== "generated_at") {
      copy[key] = body[key];
    }
  }
  return createHash("sha256").update(JSON.stringify(copy), "utf8").digest("hex").slice(0, 12);
}

function catalogEntry(catalog: Catalog, ticker: string): Entry {
  const filers = (catalog.filers ?? []).map((filer) => filer.toUpperCase());
  if (!filers.includes(ticker)) {
    throw new Error(`${ticker} is not in /catalog filers. No payment made.`);
  }
  const card = (catalog.cards ?? []).find((item) => (item.id ?? "").toUpperCase() === ticker);
  const contentHash = card?.content_hash ?? "";
  if (!/^[0-9a-f]{12}$/.test(contentHash)) {
    throw new Error(`${ticker} has no 12-hex content_hash in /catalog. No payment made.`);
  }
  return { sample_hash: "", catalog_content_hash: contentHash };
}

async function snapshot(base: string, catalog: Catalog, ticker: string): Promise<Entry> {
  const fromCatalog = catalogEntry(catalog, ticker);
  const sample = await getJson(`${base}/sample/${ticker}`);
  if (!isRecord(sample)) {
    throw new Error(`/sample/${ticker} was not a JSON object. No payment made.`);
  }
  const sampleTicker = sample.ticker;
  if (typeof sampleTicker !== "string" || sampleTicker.toUpperCase() !== ticker) {
    throw new Error(`/sample/${ticker} ticker field did not match. No payment made.`);
  }
  return {
    sample_hash: sampleHash(sample),
    catalog_content_hash: fromCatalog.catalog_content_hash,
  };
}

async function loadState(path: string): Promise<State | null> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.entries)) {
    throw new Error(`${path} is not a version 1 watch state. No payment made.`);
  }
  const entries: Record<string, Entry> = {};
  for (const [ticker, value] of Object.entries(parsed.entries)) {
    if (!isRecord(value) || typeof value.sample_hash !== "string" || typeof value.catalog_content_hash !== "string") {
      throw new Error(`${path} has a bad entry for ${ticker}. No payment made.`);
    }
    entries[ticker] = {
      sample_hash: value.sample_hash,
      catalog_content_hash: value.catalog_content_hash,
    };
  }
  return { version: 1, entries };
}

async function saveState(path: string, state: State): Promise<void> {
  const temporary = join(dirname(path), `.watch-${process.pid}-${Date.now()}.tmp`);
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

function describe(ticker: string, label: string, entry: Entry): void {
  const relation =
    entry.sample_hash === entry.catalog_content_hash ? "matches" : "differs from";
  console.log(
    `${ticker} (${label}) sample_hash=${entry.sample_hash} ${relation} catalog content_hash=${entry.catalog_content_hash}`,
  );
}

async function main(): Promise<void> {
  const tickers = watchTickers();
  const base = filingDeltaBase();
  const path = statePath();
  const catalogRaw = await getJson(`${base}/catalog`);
  if (!isRecord(catalogRaw)) {
    throw new Error("/catalog was not a JSON object. No payment made.");
  }
  const catalog = catalogRaw as Catalog;
  const previous = await loadState(path);
  const next: State = { version: 1, entries: { ...(previous?.entries ?? {}) } };
  const fresh = new Map<string, Entry>();
  let firstChanged: string | null = null;

  console.log(
    "Cross-check: sample_hash is the free sample with generated_at removed (sha256, first 12 hex chars). catalog content_hash is the paid card. A free sample is trimmed, so the two hashes are recorded separately.",
  );

  for (const ticker of tickers) {
    const entry = await snapshot(base, catalog, ticker);
    fresh.set(ticker, entry);
    const prev = previous?.entries[ticker];
    if (!prev) {
      next.entries[ticker] = entry;
      describe(ticker, "baseline", entry);
      continue;
    }
    const same =
      prev.sample_hash === entry.sample_hash &&
      prev.catalog_content_hash === entry.catalog_content_hash;
    if (same) {
      next.entries[ticker] = entry;
      describe(ticker, "unchanged", entry);
      continue;
    }
    describe(ticker, "CHANGED", entry);
    if (firstChanged === null) {
      firstChanged = ticker;
    }
  }

  if (firstChanged) {
    console.log(`One call for the first changed ticker: /delta/${firstChanged}`);
    const result = await paidCallOnce(`/delta/${firstChanged}`);
    if (result.paid) {
      const updated = fresh.get(firstChanged);
      if (!updated) {
        throw new Error(`Missing snapshot for ${firstChanged}`);
      }
      next.entries[firstChanged] = updated;
    } else {
      console.log("Baseline for changed tickers was left in place.");
    }
  } else if (previous === null) {
    console.log(`Baseline recorded in ${path}. No payment made.`);
  }

  await saveState(path, next);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
