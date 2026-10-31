<div align="center">

# StarScope

### A small observatory for exploring our stellar neighborhood.

Search real Gaia DR3 sources, explore them in 3D, and inspect the measurements behind each star.

[Open the live demo](https://starscope-three.vercel.app/)

**Vanilla JavaScript · Vite · Three.js · ESA Gaia DR3**

</div>

<!--
HERO GIF — place directly below the intro:
1. Save a short (8–15 sec), compressed screen recording as docs/media/starscope-demo.gif.
2. Show: open Explore → search Barnard's Star → select the result → rotate the map.
3. Then replace this comment with:
<p align="center">
  <img src="docs/media/starscope-demo.gif" alt="StarScope: search for a Gaia star and explore it in the interactive 3D map" width="900">
</p>
-->

StarScope turns a curated sample of nearby stars into a clear, interactive sky-exploration experience. The Landing page introduces the observatory; Explore lets you search by star name, alias, or Gaia source ID, then inspect a source in the 3D map and follow links to astronomical archives.

## Explore the interface

<!--
SCREENSHOTS — add these after this paragraph, in the order shown:
Save current captures under docs/media/ using these filenames, then uncomment the table.

| Landing — desktop | Explore — selected star |
|:---:|:---:|
| ![StarScope Landing page](docs/media/landing-desktop.png) | ![Explore page with a selected Gaia star](docs/media/explore-selected-star.png) |

| Landing — mobile | Explore — mobile |
|:---:|:---:|
| ![StarScope on a phone](docs/media/landing-mobile.png) | ![StarScope Explore on a phone](docs/media/explore-mobile.png) |
-->

The Landing page features stars from the same Gaia sample used by Explore. Its marker positions are decorative, not a to-scale sky projection; the displayed measurements and coordinates come from the catalog.

## What you can do

- Search the sample by common name, alias, or Gaia source ID.
- Switch the 3D map between the nearby subset and the full sample.
- Select stars from the map or search results and inspect their Gaia measurements.
- Open the selected source in SIMBAD, VizieR, or the ESA Gaia archive.
- Hear a quiet ambient pad and gentle star tones after interacting with the page; audio can be switched off.

## Data, clearly labeled

Explore loads a static, curated sample from [`public/data/gaia-stars.json`](public/data/gaia-stars.json) — **25 Gaia DR3 sources**, including the nearby subset shown in the default map view.

- Parallax, apparent G magnitude, effective temperature, and BP − RP are shown when available in the catalog.
- Distance is derived from parallax: `distance_pc = 1000 / parallax_mas`; it is not presented as a directly measured Gaia field.
- Missing measurements remain blank (`—`) rather than being filled with invented values.
- Star colors are a visualization based primarily on effective temperature; they are not literal photographs or measured visible-light colors.

To check the catalog against the ESA Gaia archive, run the optional verifier. It requires an internet connection:

```bash
python scripts/verify_catalog.py public/data/gaia-stars.json
```

## Run locally

**Requirements:** Node.js 20.19+ or 22.12+.

```bash
git clone https://github.com/sezimsezim/StarScope.git
cd StarScope
npm ci
npm run dev
```

Open the local URL printed by Vite. To test and build the production version:

```bash
npm test
npm run build
npm run preview
```

## Project layout

```text
index.html                 Landing page
explore.html               Gaia catalog explorer
explore.css                Explore page styles
js/main.js                 Landing interactions, markers, and audio
js/search.js               Catalog search and ranking
js/star-map.js             Interactive Three.js star map
js/stellar-color.js        Data-driven star color mapping
gaia-adapter.js            Gaia catalog normalization and formatting
public/data/gaia-stars.json Static catalog used by both pages
scripts/verify_catalog.py  Optional ESA Gaia archive check
tests/                     Search and catalog unit tests
```

## Hackathon submission

> StarScope is an interactive Gaia DR3 explorer for a curated sample of nearby stars. Search by name, alias, or Gaia source ID; explore sources in a 3D map; inspect catalog measurements; and jump directly to SIMBAD, VizieR, or the ESA Gaia archive. Distances are labeled as parallax-derived, and unavailable measurements stay visibly blank.

