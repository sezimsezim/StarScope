// Embedded fallback catalog for offline, file://, or CORS-restricted environments
const FALLBACK_GAIA_STARS = [
  {
    "id": "proxima-centauri",
    "name": "Proxima Centauri",
    "source_id": "5853498713190525696",
    "aliases": ["Alpha Centauri C", "GJ 551", "HIP 70890"],
    "ra": 217.4289,
    "dec": -62.6795,
    "parallax": 768.5,
    "temperature": 3042,
    "distance_pc": 1.301,
    "distance_ly": 4.24
  },
  {
    "id": "sirius-a",
    "name": "Sirius A",
    "source_id": "2947050466531873024",
    "aliases": ["Alpha Canis Majoris", "GJ 244", "HIP 32349"],
    "ra": 101.2872,
    "dec": -16.7161,
    "parallax": 379.21,
    "temperature": 9940,
    "distance_pc": 2.637,
    "distance_ly": 8.6
  },
  {
    "id": "canopus",
    "name": "Canopus",
    "source_id": "5297260555318610560",
    "aliases": ["Alpha Carinae", "HD 45348", "HIP 30438"],
    "ra": 95.9879,
    "dec": -52.6957,
    "parallax": 10.43,
    "temperature": 7350,
    "distance_pc": 95.88,
    "distance_ly": 310.0
  },
  {
    "id": "vega",
    "name": "Vega",
    "source_id": "2103525164161884416",
    "aliases": ["Alpha Lyrae", "GJ 721", "HIP 91262"],
    "ra": 279.2347,
    "dec": 38.7837,
    "parallax": 130.23,
    "temperature": 9600,
    "distance_pc": 7.68,
    "distance_ly": 25.04
  },
  {
    "id": "rigel",
    "name": "Rigel",
    "source_id": "3209252067727144448",
    "aliases": ["Beta Orionis", "HIP 24436"],
    "ra": 78.6345,
    "dec": -8.2016,
    "parallax": 3.78,
    "temperature": 12100,
    "distance_pc": 264.55,
    "distance_ly": 860.0
  },
  {
    "id": "betelgeuse",
    "name": "Betelgeuse",
    "source_id": "3226343555462520448",
    "aliases": ["Alpha Orionis", "HIP 27989"],
    "ra": 88.7929,
    "dec": 7.4071,
    "parallax": 5.95,
    "temperature": 3600,
    "distance_pc": 168.07,
    "distance_ly": 548.0
  },
  {
    "id": "arcturus",
    "name": "Arcturus",
    "source_id": "1459468903525942400",
    "aliases": ["Alpha Boötis", "HIP 69673"],
    "ra": 213.9153,
    "dec": 19.1824,
    "parallax": 88.83,
    "distance_pc": 11.26,
    "distance_ly": 36.7,
    "temperature": 4286
  }
];

export async function loadGaiaStars(jsonPath = "./gaia-stars-v2.json") {
  let rawList = null;

  // Multi-path candidates to resolve relative, root, and public paths
  const candidatePaths = [
    jsonPath,
    "./gaia-stars-v2.json",
    "gaia-stars-v2.json",
    "/gaia-stars-v2.json",
    "./public/gaia-stars-v2.json"
  ];

  for (const path of candidatePaths) {
    try {
      const response = await fetch(path);
      if (response && response.ok) {
        rawList = await response.json();
        if (Array.isArray(rawList) && rawList.length > 0) {
          break;
        }
      }
    } catch {
      // Continue to next path candidate or fallback
    }
  }

  // Graceful fallback: If fetch was blocked (e.g. file:/// protocol in VS Code), use embedded catalog
  if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
    console.warn("[GaiaAdapter] Fetch unreachable or blocked by CORS (e.g., file:// protocol). Utilizing embedded Gaia DR3 catalog fallback.");
    rawList = FALLBACK_GAIA_STARS;
  }

  return rawList.map((star) => {
    // Normalization logic continues...