import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeStar, raToHms, decToDms } from "../reference/gaia-adapter.js";

test("distance is derived from parallax when distance fields are absent", () => {
  const star = normalizeStar({ source_id: "5853498713190525696", parallax: 768.0665, temperature: 2829.35 });
  assert.ok(Math.abs(star.distance_pc - 1.30197) < 1e-4);
  assert.ok(Math.abs(star.distance_ly - 4.2465) < 1e-3);
  assert.equal(star.temperatureBand, "M");
});

test("missing Teff stays null and is rendered as a dash, not 5000 K", () => {
  const star = normalizeStar({ source_id: "1", parallax: 374.49, temperature: null });
  assert.equal(star.temperature, null);
  assert.equal(star.temp, "—");
});

test("coordinate formatting never produces 60 seconds", () => {
  assert.equal(raToHms(217.39232147), "14h 29m 34s");
  assert.equal(decToDms(-62.67607512), "−62° 40′ 34″");
  assert.equal(raToHms(0.0041666), "00h 00m 01s");
});
