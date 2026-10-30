import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeStar, raToHms, decToDms } from "../gaia-adapter.js";
import { getStellarAppearance } from "../js/stellar-color.js";

test("distance is derived from parallax when distance fields are absent", () => {
  const star = normalizeStar({ source_id: "5853498713190525696", parallax: 768.0665, temperature: 2829.35 });
  assert.ok(Math.abs(star.distance_pc - 1.30197) < 1e-4);
  assert.ok(Math.abs(star.distance_ly - 4.2465) < 1e-3);
  assert.equal(star.temperatureBand, "M");
});

test("missing Teff stays null and is rendered as a dash, not 5000 K", () => {
  const star = normalizeStar({
    source_id: "1",
    parallax: null,
    temperature: null,
    phot_g_mean_mag: null
  });
  assert.equal(star.temperature, null);
  assert.equal(star.temp, "—");
  assert.equal(star.parallax, null);
  assert.equal(star.distance_pc, null);
  assert.equal(star.distance_ly, null);
  assert.equal(star.dist, "—");
  assert.equal(star.parallaxDisplay, "—");
  assert.equal(star.gmag, "—");
  assert.equal(star.temperatureBand, "?");
  assert.equal(star.colorSource, "unknown");
});

test("stellar hue follows temperature and BP-RP is only the documented fallback", () => {
  const cool = getStellarAppearance(3000, 0);
  const hot = getStellarAppearance(11000, 3.5);
  assert.equal(cool.source, "teff");
  assert.equal(hot.source, "teff");
  assert.ok(parseInt(hot.color.slice(1, 3), 16) < parseInt(cool.color.slice(1, 3), 16));
  assert.ok(parseInt(hot.color.slice(5, 7), 16) > parseInt(cool.color.slice(5, 7), 16));

  const photometricFallback = getStellarAppearance(null, 2.5);
  assert.equal(photometricFallback.source, "bp_rp");
  assert.match(photometricFallback.label, /Teff unavailable/);
  assert.equal(getStellarAppearance(null, null).source, "unknown");
  assert.equal(getStellarAppearance(0, null).source, "unknown");
  assert.equal(getStellarAppearance(null, 99).source, "unknown");
});

test("normalized stars carry the same data-driven color used by the map", () => {
  const star = normalizeStar({ temperature: 3000, bp_rp: 3.5 });
  assert.equal(star.colorSource, "teff");
  assert.equal(star.dotColor, getStellarAppearance(3000, 3.5).color);
  assert.equal(star.bp_rp, 3.5);
  assert.equal(normalizeStar({ temperature: 0, bp_rp: null }).temperature, null);
});

test("coordinate formatting never produces 60 seconds", () => {
  assert.equal(raToHms(217.39232147), "14h 29m 34s");
  assert.equal(decToDms(-62.67607512), "-62° 40′ 34″");
  assert.equal(raToHms(0.0041666), "00h 00m 01s");
});