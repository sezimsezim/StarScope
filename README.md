# StarScope

**Explore nearby stars through an interactive Gaia DR3 observatory.**

StarScope is a small, browser-based star explorer built around a searchable 3D map and a clear, observatory-style interface. Inspect a curated sample of Gaia DR3 sources, compare stellar measurements, and open the selected source in SIMBAD, VizieR, or the Gaia archive.

## What you can do

- Search the sample by common name, alias, or Gaia source ID.
- Explore the stars in a 3D map; switch between the nearby sample and the full catalog.
- Inspect parallax, apparent magnitude, temperature, and BP − RP when available.
- See distances derived from parallax, with missing measurements shown explicitly.
- Follow links to the astronomical archives for the selected source.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. To check the project before shipping:

```bash
npm test
npm run build
```

The optional catalog check queries the ESA Gaia archive and needs an internet connection:

```bash
python scripts/verify_catalog.py public/data/gaia-stars.json
```

## Data notes

The explorer loads its static sample from [`public/data/gaia-stars.json`](public/data/gaia-stars.json). Measurements come from Gaia DR3; displayed distance is calculated as `1000 / parallax` parsecs. A blank Gaia measurement stays blank rather than being replaced with an estimate.

The landing page's featured targets are a separate, small reference display. The searchable catalog and 3D map on the Explore page are the Gaia DR3 sample.

## Hackathon submission

> StarScope is an interactive Gaia DR3 explorer that turns a curated sample of real stellar measurements into a searchable, three-dimensional map. Search by star name, alias, or Gaia source ID; inspect parallax, temperature, and photometry; and jump directly to SIMBAD, VizieR, or the ESA Gaia archive. Distances are derived from parallax, and unavailable measurements are clearly left blank.

## Ship checklist

- [ ] Run `npm test` and `npm run build`.
- [ ] Open both the landing page and Explore page from the built site.
- [ ] Try a known star, an alias, a Gaia source ID, and a query with no match.
- [ ] Check the 3D map controls and archive links on desktop and a narrow/mobile viewport.
- [ ] Run the Gaia catalog verification and confirm the result before claiming the sample is verified.
- [ ] Add the deployed demo URL and one current screenshot to the hackathon submission.
