import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeQuery, searchStars } from "../reference/search.js";

const stars = [
  { id: "61-cygni-a", name: "61 Cygni A", source_id: "1872046609345556480", aliases: ["GJ 820 A"], distance_ly: 11.4 },
  { id: "proxima-centauri", name: "Proxima Centauri", source_id: "5853498713190525696", aliases: ["GJ 551"], distance_ly: 4.25 },
  { id: "barnards-star", name: "Barnard's Star", source_id: "4472832130942575872", aliases: ["GJ 699"], distance_ly: 5.96 },
];

test("normalizeQuery strips case, diacritics and separators", () => {
  assert.equal(normalizeQuery("  Alpha Boötis "), "alphabootis");
  assert.equal(normalizeQuery("61 Cyg-A"), "61cyga");
});

test("exact match ranks above substring match", () => {
  const result = searchStars(stars, "gj 551");
  assert.equal(result[0].id, "proxima-centauri");
});

test("apostrophes do not break search", () => {
  assert.equal(searchStars(stars, "barnards")[0].id, "barnards-star");
});

test("Gaia source_id lookup works", () => {
  assert.equal(searchStars(stars, "5853498713190525696")[0].id, "proxima-centauri");
});

test("empty query returns the catalog; unknown query returns []", () => {
  assert.equal(searchStars(stars, "").length, 3);
  assert.deepEqual(searchStars(stars, "vega"), []);
});
