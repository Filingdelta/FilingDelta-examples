#!/usr/bin/env python3
"""Print a free FilingDelta sample card. No wallet and no API key.

This talks only to the public free routes (GET /sample/{ticker} and GET /catalog).
It never calls a paid route and never sends a payment header.

Examples:
  python fd_sample.py AAPL
  python fd_sample.py --list
  python fd_sample.py NOSUCH
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_BASE = "https://filingdelta.xyz"
USER_AGENT = "filingdelta-examples-fd-sample/1.0"
TIMEOUT_SECONDS = 30


class SampleError(Exception):
    """A problem talking to the free API, or a response we cannot use."""


def base_url() -> str:
    raw = os.environ.get("FILINGDELTA_BASE", DEFAULT_BASE).strip()
    return (raw or DEFAULT_BASE).rstrip("/")


def normalize_ticker(raw: str) -> str:
    ticker = raw.strip().upper()
    if (
        not ticker
        or any(ch in ticker for ch in "/?#\\ \t")
        or not all(ch.isalnum() or ch in "-." for ch in ticker)
    ):
        raise SampleError(
            "Ticker %r is not a single symbol. Example: python fd_sample.py AAPL" % (raw,)
        )
    return ticker


def sample_url(base: str, ticker: str) -> str:
    return "%s/sample/%s" % (base.rstrip("/"), ticker)


def catalog_url(base: str) -> str:
    return "%s/catalog" % (base.rstrip("/"),)


def get_json(url: str, timeout: float = TIMEOUT_SECONDS):
    """GET url. Returns (status, parsed_json_or_None)."""
    request = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": USER_AGENT},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read()
            status = response.status
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        status = exc.code
    except urllib.error.URLError as exc:
        raise SampleError("Could not reach %s (%s)." % (url, exc.reason)) from exc
    if not raw:
        return status, None
    try:
        return status, json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise SampleError(
            "GET %s returned HTTP %s with a body that is not JSON." % (url, status)
        ) from exc


def covered_tickers(catalog: object) -> list:
    if not isinstance(catalog, dict):
        raise SampleError("/catalog did not return a JSON object.")
    filers = catalog.get("filers")
    if not isinstance(filers, list):
        keys = ", ".join(sorted(str(key) for key in catalog.keys()))
        raise SampleError("/catalog has no filers array. Keys: %s" % keys)
    return [str(item) for item in filers]


def format_summary(card: dict) -> str:
    """Short header for a filing sample. The figures are the server's, not ours."""
    ticker = str(card.get("ticker") or "").strip()
    company = str(card.get("company") or "").strip()
    title = " ".join(part for part in (ticker, company) if part) or "Filing sample"
    meta_bits = []
    if card.get("filing_type"):
        meta_bits.append(str(card["filing_type"]))
    if card.get("period"):
        meta_bits.append(str(card["period"]))
    if card.get("filing_date"):
        meta_bits.append("filed %s" % card["filing_date"])
    changes = card.get("changes")
    if not isinstance(changes, list):
        changes = []
    full = [
        change
        for change in changes
        if isinstance(change, dict) and change.get("access") == "full" and change.get("summary")
    ]
    lines = [title]
    if meta_bits:
        lines.append(", ".join(meta_bits))
    access = card.get("access")
    hidden = card.get("hidden") if isinstance(card.get("hidden"), dict) else {}
    note = "Free sample"
    if access:
        note += " (access: %s)" % access
    change_word = "change" if len(changes) == 1 else "changes"
    if len(full) == 1:
        shown = "1 shown in full"
    else:
        shown = "%d shown in full" % len(full)
    note += ". %d %s in the sample, %s." % (len(changes), change_word, shown)
    if "changes" in hidden:
        note += " hidden.changes=%s." % hidden["changes"]
    note += " Not the full card."
    lines.append(note)
    for change in full:
        lines.append("Shown in full (#%s): %s" % (change.get("id"), change.get("summary")))
    source = card.get("source_url")
    if source:
        lines.append("source_url: %s" % source)
    disclaimer = card.get("disclaimer")
    if disclaimer:
        lines.append(str(disclaimer))
    return "\n".join(lines)


def render_sample(card: dict) -> str:
    body = json.dumps(card, indent=2, ensure_ascii=False)
    return format_summary(card) + "\n\n" + body + "\n"


def format_not_found(ticker: str, body: object) -> str:
    message = "No free sample for this ticker."
    valid = []
    example = ""
    catalog = DEFAULT_BASE + "/catalog"
    if isinstance(body, dict):
        message = str(body.get("message") or body.get("error") or message)
        raw_valid = body.get("valid_tickers")
        if isinstance(raw_valid, list):
            valid = [str(item) for item in raw_valid]
        if body.get("example"):
            example = str(body["example"])
        if body.get("catalog"):
            catalog = str(body["catalog"])
    lines = [
        "No free sample for %r (HTTP 404). You were not charged." % (ticker,),
        message,
    ]
    if valid:
        lines.append("Covered tickers (%d): %s" % (len(valid), ", ".join(valid)))
        lines.append("List them again with: python fd_sample.py --list")
    if example:
        lines.append("Example: %s" % example)
    lines.append("Catalog: %s" % catalog)
    return "\n".join(lines)


def format_ticker_list(tickers: list, catalog: str) -> str:
    noun = "ticker" if len(tickers) == 1 else "tickers"
    header = "%d %s from %s (filers):" % (len(tickers), noun, catalog)
    return header + "\n" + "\n".join(tickers) + "\n"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="fd_sample.py",
        description=(
            "Print a free FilingDelta sample card for one ticker. "
            "No wallet and no API key. Does not call paid routes."
        ),
    )
    parser.add_argument(
        "ticker",
        nargs="?",
        help="Filing ticker, for example AAPL. Case is ignored.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        dest="list_tickers",
        help="Print the filing tickers in /catalog (the filers array).",
    )
    return parser


def cmd_list() -> int:
    url = catalog_url(base_url())
    status, body = get_json(url)
    if status != 200:
        raise SampleError("GET %s returned HTTP %s." % (url, status))
    tickers = covered_tickers(body)
    sys.stdout.write(format_ticker_list(tickers, url))
    return 0


def cmd_sample(raw_ticker: str) -> int:
    ticker = normalize_ticker(raw_ticker)
    url = sample_url(base_url(), ticker)
    status, body = get_json(url)
    if status == 404:
        print(format_not_found(ticker, body), file=sys.stderr)
        return 1
    if status != 200 or not isinstance(body, dict):
        detail = ""
        if body is not None:
            detail = "\n" + json.dumps(body, indent=2, ensure_ascii=False)
        raise SampleError("GET %s returned HTTP %s.%s" % (url, status, detail))
    sys.stdout.write(render_sample(body))
    return 0


def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.list_tickers and args.ticker:
        parser.error("pass a ticker or --list, not both")
    if not args.list_tickers and not args.ticker:
        parser.error("pass a ticker, or --list")
    try:
        if args.list_tickers:
            return cmd_list()
        return cmd_sample(args.ticker)
    except SampleError as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    sys.exit(main())
