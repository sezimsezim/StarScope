import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeQuery, searchStars } from "../js/search.js";

const stars = [
  { id: "61-cygni-a", name: "61 Cygni A", source_id: "1872046609345556480", aliases: ["GJ 820 A"], distance_ly: 11.4 },
  { id: "proxima-centauri", name: "Proxima Centauri", source_id: "5853498713190525696", aliases: ["GJ 551"], distance_ly: 4.25 },
  { id: "proxima-companion", name: "Proxima Companion", source_id: "2", aliases: ["GJ 551 extra"], distance_ly: 1 },
  { id: "barnards-star", name: "Barnard's Star", source_id: "4472832130942575872", aliases: ["GJ 699"], distance_ly: 5.96 },
  { id: "arcturus", name: "Arcturus", source_id: "3", aliases: ["α Boötis"], distance_ly: 36.7 },
];

test("normalizeQuery strips case, diacritics and separators", () => {
  assert.equal(normalizeQuery("  Alpha Boötis "), "alphabootis");
  assert.equal(normalizeQuery("61 Cyg-A"), "61cygnia");
});

test("exact match ranks above substring match", () => {
  const result = searchStars(stars, "gj 551");
  assert.equal(result[0].id, "proxima-centauri");
  assert.equal(result[1].id, "proxima-companion");
});

test("apostrophes and prefix matches work", () => {
  assert.equal(searchStars(stars, "barnards")[0].id, "barnards-star");
});

test("aliases normalize separators and Greek letter names", () => {
  assert.equal(searchStars(stars, "61 Cyg-A")[0].id, "61-cygni-a");
  assert.equal(searchStars(stars, "Alpha Boötis")[0].id, "arcturus");
});

test("Gaia source_id lookup works", () => {
  assert.equal(searchStars(stars, "5853498713190525696")[0].id, "proxima-centauri");
});

test("empty query returns the catalog; unknown query returns []", () => {
  assert.equal(searchStars(stars, "").length, stars.length);
  assert.deepEqual(searchStars(stars, "vega"), []);
});
