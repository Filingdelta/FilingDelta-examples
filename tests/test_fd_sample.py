"""Offline checks for fd_sample. The live manual run is documented in the README."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import fd_sample  # noqa: E402


class FormatTests(unittest.TestCase):
    def test_summary_uses_card_fields(self):
        card = {
            "ticker": "AAPL",
            "company": "Apple Inc.",
            "filing_type": "10-K",
            "period": "FY2026",
            "filing_date": "2026-11-03",
            "access": "teaser",
            "source_url": "https://www.sec.gov/example",
            "disclaimer": "Not investment advice.",
            "hidden": {"changes": 1, "high_materiality": 1},
            "changes": [
                {"id": 1, "access": "teaser", "category": "segment"},
                {
                    "id": 2,
                    "access": "full",
                    "summary": "Commercial paper changed.",
                },
            ],
        }
        text = fd_sample.format_summary(card)
        self.assertIn("AAPL Apple Inc.", text)
        self.assertIn("10-K, FY2026, filed 2026-11-03", text)
        self.assertIn("access: teaser", text)
        self.assertIn("hidden.changes=1", text)
        self.assertIn("Shown in full (#2): Commercial paper changed.", text)
        self.assertIn("source_url: https://www.sec.gov/example", text)
        self.assertIn("Not investment advice.", text)
        rendered = fd_sample.render_sample(card)
        self.assertIn('"ticker": "AAPL"', rendered)

    def test_not_found_message_includes_server_text(self):
        body = {
            "error": "not_found",
            "message": "Sample not available for this ticker. You were not charged.",
            "valid_tickers": ["AAPL", "MSFT"],
            "example": "https://filingdelta.xyz/sample/AMD",
            "catalog": "https://filingdelta.xyz/catalog",
        }
        text = fd_sample.format_not_found("NOSUCH", body)
        self.assertIn("No free sample for 'NOSUCH' (HTTP 404)", text)
        self.assertIn("You were not charged", text)
        self.assertIn("Covered tickers (2): AAPL, MSFT", text)
        self.assertIn("https://filingdelta.xyz/sample/AMD", text)
        self.assertIn("python fd_sample.py --list", text)

    def test_covered_tickers_reads_filers(self):
        self.assertEqual(
            fd_sample.covered_tickers({"filers": ["AAPL", "MSFT"]}),
            ["AAPL", "MSFT"],
        )

    def test_covered_tickers_rejects_missing_filers(self):
        with self.assertRaises(fd_sample.SampleError):
            fd_sample.covered_tickers({"policy": ["FED"]})

    def test_ticker_normalizes_case_and_rejects_paths(self):
        self.assertEqual(fd_sample.normalize_ticker(" aapl "), "AAPL")
        with self.assertRaises(fd_sample.SampleError):
            fd_sample.normalize_ticker("../etc")
        with self.assertRaises(fd_sample.SampleError):
            fd_sample.normalize_ticker("")

    def test_urls_stay_on_free_routes(self):
        self.assertEqual(
            fd_sample.sample_url("https://filingdelta.xyz", "AAPL"),
            "https://filingdelta.xyz/sample/AAPL",
        )
        self.assertEqual(
            fd_sample.catalog_url("https://filingdelta.xyz/"),
            "https://filingdelta.xyz/catalog",
        )
        self.assertNotIn("/delta/", fd_sample.sample_url("https://filingdelta.xyz", "AAPL"))

    def test_list_format(self):
        text = fd_sample.format_ticker_list(
            ["AAPL"], "https://filingdelta.xyz/catalog"
        )
        self.assertTrue(text.startswith("1 ticker from https://filingdelta.xyz/catalog (filers):"))
        self.assertIn("\nAAPL\n", text)


class CliTests(unittest.TestCase):
    def test_help_and_usage(self):
        script = str(ROOT / "fd_sample.py")
        help_run = subprocess.run(
            [sys.executable, script, "--help"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(help_run.returncode, 0)
        self.assertIn("--list", help_run.stdout)
        self.assertIn("No wallet", help_run.stdout)

        missing = subprocess.run(
            [sys.executable, script],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(missing.returncode, 2)

        both = subprocess.run(
            [sys.executable, script, "AAPL", "--list"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(both.returncode, 2)
        self.assertIn("not both", both.stderr)


if __name__ == "__main__":
    unittest.main()
