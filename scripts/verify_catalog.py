#!/usr/bin/env python3
"""
verify_catalog.py
=================
StarScope - catalog honesty check.

Takes a StarScope catalog JSON file (array of star objects with "source_id")
and compares every entry against the official Gaia DR3 archive (ESA TAP).

For each star it reports:
  MISSING   - the source_id does not exist in gaiadr3.gaia_source
  MISMATCH  - the source_id exists, but parallax / teff in the file differ
              from Gaia DR3 by more than the tolerance
  OK        - the values in the file match Gaia DR3

Exit code is 1 if any star is MISSING or MISMATCH, so this script can later
be used in CI (GitHub Actions) to block fake data from entering the catalog.

Usage:
  python scripts/verify_catalog.py public/data/gaia-stars.json

No third-party dependencies (standard library only).
"""

import csv
import io
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

GAIA_TAP_SYNC = "https://gea.esac.esa.int/tap-server/tap/sync"

# Relative tolerance for parallax (0.5 %) and absolute tolerance for Teff (K).
PARALLAX_REL_TOL = 0.005
TEFF_ABS_TOL = 5.0


def query_gaia(source_ids: list[str]) -> dict[str, dict]:
    """Fetch parallax / teff / G magnitude for the given source_ids from Gaia DR3."""
    # source_id is a BIGINT; only digits are allowed, which also prevents ADQL injection.
    safe_ids = [sid for sid in source_ids if sid.isdigit()]
    if not safe_ids:
        return {}

    adql = (
        "SELECT source_id, ra, dec, parallax, phot_g_mean_mag, teff_gspphot "
        "FROM gaiadr3.gaia_source "
        f"WHERE source_id IN ({','.join(safe_ids)})"
    )
    body = urllib.parse.urlencode(
        {"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": adql}
    ).encode()

    with urllib.request.urlopen(GAIA_TAP_SYNC, body, timeout=90) as resp:
        text = resp.read().decode("utf-8")

    return {row["source_id"]: row for row in csv.DictReader(io.StringIO(text))}


def as_float(value) -> float | None:
    """Convert a CSV/JSON value to float, returning None for empty values."""
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/verify_catalog.py <catalog.json>")
        return 2

    path = Path(sys.argv[1])
    stars = json.loads(path.read_text(encoding="utf-8-sig"))
    ids = [str(s.get("source_id", "")) for s in stars]
    gaia = query_gaia(ids)

    problems = 0
    for star in stars:
        sid = str(star.get("source_id", ""))
        name = star.get("name", "?")
        row = gaia.get(sid)

        if row is None:
            print(f"MISSING   {name:<20} source_id={sid} is not in Gaia DR3")
            problems += 1
            continue

        issues = []
        file_plx, gaia_plx = as_float(star.get("parallax")), as_float(row["parallax"])
        if file_plx is not None and gaia_plx is not None:
            if abs(file_plx - gaia_plx) > abs(gaia_plx) * PARALLAX_REL_TOL:
                issues.append(f"parallax file={file_plx} gaia={gaia_plx:.4f}")

        file_teff, gaia_teff = as_float(star.get("temperature")), as_float(row["teff_gspphot"])
        if file_teff is not None and gaia_teff is None:
            issues.append(f"teff file={file_teff} but Gaia teff_gspphot is NULL")
        elif file_teff is not None and abs(file_teff - gaia_teff) > TEFF_ABS_TOL:
            issues.append(f"teff file={file_teff} gaia={gaia_teff:.1f}")

        if issues:
            print(f"MISMATCH  {name:<20} " + "; ".join(issues))
            problems += 1
        else:
            print(f"OK        {name:<20} G={as_float(row['phot_g_mean_mag']):.2f}")

    print(f"\n{len(stars) - problems}/{len(stars)} stars verified against Gaia DR3.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
