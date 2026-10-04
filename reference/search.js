/**
 * search.js - pure search logic for StarScope (no DOM access).
 * Keeping it DOM-free makes it testable with `node --test`.
 */

/** Lowercase, strip diacritics (Boötis -> bootis) and separators ("61 Cyg" -> "61cyg"). */
export function normalizeQuery(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s\-_'’.]/g, "");
}

/**
 * Rank stars against a query: exact match (3) > prefix (2) > substring (1).
 * Ties are broken by distance so nearer stars appear first.
 */
export function searchStars(stars, query, limit = 20) {
  const q = normalizeQuery(query);
  if (!q) return stars.slice(0, limit);

  const scored = [];
  for (const star of stars) {
    const keys = [star.name, star.id, star.source_id, ...(star.aliases ?? [])].map(normalizeQuery);
    let score = 0;
    if (keys.some((k) => k === q)) score = 3;
    else if (keys.some((k) => k.startsWith(q))) score = 2;
    else if (keys.some((k) => k.includes(q))) score = 1;
    if (score > 0) scored.push({ star, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (a.star.distance_ly ?? Infinity) - (b.star.distance_ly ?? Infinity)
  );
  return scored.slice(0, limit).map((entry) => entry.star);
}
