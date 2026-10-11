const GREEK_NAMES = {
  "α": "alpha",
  "β": "beta",
  "γ": "gamma",
  "δ": "delta",
  "ε": "epsilon",
  "ζ": "zeta",
  "η": "eta",
  "θ": "theta",
  "ι": "iota",
  "κ": "kappa",
  "λ": "lambda",
  "μ": "mu",
  "ν": "nu",
  "ξ": "xi",
  "ο": "omicron",
  "π": "pi",
  "ρ": "rho",
  "σ": "sigma",
  "ς": "sigma",
  "τ": "tau",
  "υ": "upsilon",
  "φ": "phi",
  "χ": "chi",
  "ψ": "psi",
  "ω": "omega"
};

export function normalizeQuery(value) {
  return String(value ?? "")
    .toLocaleLowerCase("en")
    .replace(/[α-ως]/g, (letter) => GREEK_NAMES[letter] ?? letter)
    .replace(/\bcyg(?=[\s._-]|$)/g, "cygni")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function getSearchKeys(star) {
  return [
    star.name,
    star.id,
    star.source_id,
    star.designation,
    star.desig,
    ...(Array.isArray(star.aliases) ? star.aliases : [])
  ].map(normalizeQuery).filter(Boolean);
}

function getMatchRank(keys, query) {
  if (keys.some((key) => key === query)) return 3;
  if (keys.some((key) => key.startsWith(query))) return 2;
  if (keys.some((key) => key.includes(query))) return 1;
  return 0;
}

export function searchStars(stars, query, limit = 20) {
  const normalizedQuery = normalizeQuery(query);
  const maxResults = Math.max(0, Number.isFinite(limit) ? Math.floor(limit) : 20);
  if (maxResults === 0) return [];
  if (!normalizedQuery) return stars.slice(0, maxResults);

  return stars
    .map((star) => ({ star, rank: getMatchRank(getSearchKeys(star), normalizedQuery) }))
    .filter((result) => result.rank > 0)
    .sort((left, right) => {
      const rankDifference = right.rank - left.rank;
      if (rankDifference !== 0) return rankDifference;

      const leftDistance = Number(left.star.distance_ly);
      const rightDistance = Number(right.star.distance_ly);
      const a = Number.isFinite(leftDistance) ? leftDistance : Infinity;
      const b = Number.isFinite(rightDistance) ? rightDistance : Infinity;
      return a - b;
    })
    .slice(0, maxResults)
    .map(({ star }) => star);
}
