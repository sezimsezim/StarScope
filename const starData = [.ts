const starData = [
  {
    name: 'Sirius',
    designation: 'Alpha Canis Majoris',
    distance: 8.6,
    spectralType: 'A1V',
    magnitude: -1.46,
    teff: 9940
  },
  {
    name: 'Vega',
    designation: 'Alpha Lyrae',
    distance: 25.0,
    spectralType: 'A0V',
    magnitude: 0.03,
    teff: 9600
  },
  {
    name: 'Rigel',
    designation: 'Beta Orionis',
    distance: 860,
    spectralType: 'B8Ia',
    magnitude: 0.13,
    teff: 12100
  },
  {
    name: 'Betelgeuse',
    designation: 'Alpha Orionis',
    distance: 548,
    spectralType: 'M1-2Ia',
    magnitude: 0.5,
    teff: 3600
  },
  {
    name: 'Arcturus',
    designation: 'Alpha Boötis',
    distance: 37,
    spectralType: 'K1.5III',
    magnitude: -0.05,
    teff: 4286
  },
  {
    name: 'Proxima Centauri',
    designation: 'Alpha Centauri C',
    distance: 4.24,
    spectralType: 'M5.5Ve',
    magnitude: 11.13,
    teff: 3042
  },
  {
    name: 'Altair',
    designation: 'Alpha Aquilae',
    distance: 16.7,
    spectralType: 'A7V',
    magnitude: 0.77,
    teff: 7550
  },
  {
    name: 'Deneb',
    designation: 'Alpha Cygni',
    distance: 2615,
    spectralType: 'A2Ia',
    magnitude: 1.25,
    teff: 8525
  },
  {
    name: 'Polaris',
    designation: 'Alpha Ursae Minoris',
    distance: 433,
    spectralType: 'F7Ib',
    magnitude: 1.97,
    teff: 6015
  },
  {
    name: 'Antares',
    designation: 'Alpha Scorpii',
    distance: 550,
    spectralType: 'M1.5Iab',
    magnitude: 1.06,
    teff: 3500
  },
  {
    name: 'Spica',
    designation: 'Alpha Virginis',
    distance: 250,
    spectralType: 'B1III-IV',
    magnitude: 0.98,
    teff: 22500
  },
  {
    name: 'Capella',
    designation: 'Alpha Aurigae',
    distance: 42.9,
    spectralType: 'G8III',
    magnitude: 0.08,
    teff: 4970
  },
  {
    name: 'Aldebaran',
    designation: 'Alpha Tauri',
    distance: 65,
    spectralType: 'K5III',
    magnitude: 0.87,
    teff: 3910
  },
  {
    name: 'Bellatrix',
    designation: 'Gamma Orionis',
    distance: 240,
    spectralType: 'B2III',
    magnitude: 1.64,
    teff: 22000
  },
  {
    name: 'Canopus',
    designation: 'Alpha Carinae',
    distance: 310,
    spectralType: 'A9II',
    magnitude: -0.74,
    teff: 7350
  },
  {
    name: 'Mira',
    designation: 'Omicron Ceti',
    distance: 200,
    spectralType: 'M7e',
    magnitude: 3.5,
    teff: 3000
  },
  {
    name: 'Alpha Centauri',
    designation: 'Alpha Centauri A',
    distance: 4.37,
    spectralType: 'G2V',
    magnitude: -0.27,
    teff: 5790
  },
  {
    name: 'Beta Pictoris',
    designation: 'Beta Pictoris',
    distance: 63,
    spectralType: 'A6V',
    magnitude: 3.86,
    teff: 8050
  },
  {
    name: 'Mizar',
    designation: 'Zeta Ursae Majoris',
    distance: 78,
    spectralType: 'A2V',
    magnitude: 2.04,
    teff: 9000
  },
  {
    name: 'Epsilon Eridani',
    designation: 'Epsilon Eridani',
    distance: 10.5,
    spectralType: 'K2V',
    magnitude: 3.73,
    teff: 5084
  }
];

const searchWrapper = document.getElementById('searchWrapper');
const searchTrigger = document.getElementById('searchTrigger');
const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('starSearch');
const searchResults = document.getElementById('searchResults');
const searchClose = document.getElementById('searchClose');

const hudCard = document.getElementById('starHudCard');
const proceduralStar = document.getElementById('proceduralStarVisual');

const starName = document.getElementById('starName');
const starDesignation = document.getElementById('starDesignation');
const starDistance = document.getElementById('starDistance');
const starSpectral = document.getElementById('starSpectral');
const starMagnitude = document.getElementById('starMagnitude');
const starTeff = document.getElementById('starTeff');

const targetId = document.getElementById('targetId');
const catalogStatus = document.getElementById('catalogStatus');


let selectedStar = null;


/* =========================
   SPECTRAL VISUAL SYSTEM
========================= */

function getSpectralPalette(star) {
  const temp = Number(star.teff || 0);
  const type = String(star.spectralType || '')
    .trim()
    .charAt(0)
    .toUpperCase();

  if (type === 'O' || type === 'B' || temp > 10000) {
    return {
      core: '#ffffff',
      mid: '#8cc9ff',
      outer: '#4facfe',
      glow: 'rgba(79, 172, 254, 0.82)',
      shadow: 'rgba(79, 172, 254, 0.28)',
      size: 1.06
    };
  }

  if (
     ||
    return {
      ||

  if (
    type === 'G' ||
    (temp >= 5000 && temp < 7500)
  ) {
    return {
      core: '#fffef5',
      mid: '#f6d365',
      outer: '#ffb347',
      glow: 'rgba(246, 211, 101, 0.78)',
      shadow: 'rgba(246, 211, 101, 0.24)',
      size: 1.02
    };
  }

  if (
    type === 'K' ||
    (temp >= 3500 && temp < 5000)
  ) {
    return {
      core: '#fff7db',
      mid: '#ffb15f',
      outer: '#f38b4a',
      glow: 'rgba(255, 167, 81, 0.78)',
      shadow: 'rgba(255, 167, 81, 0.22)',
      size: 1
    };
  }

  return {
    core: '#fff0ea',
    mid: '#ff9c7f',
    outer: '#ff6f61',
    glow: 'rgba(255, 121, 92, 0.78)',
    shadow: 'rgba(255, 121, 92, 0.22)',
    size: 0.98
  };
}


/* =========================
   STAR VISUAL
========================= */

function generateStarVisual(star) {
  const palette = getSpectralPalette(star);

  const magnitude = Number(star.magnitude ?? 0);

  /*
   * Brightness is intentionally capped.
   * It is a visual representation, not a physical luminosity model.
   */
  const brightnessFactor = Math.max(
    0,
    Math.min(1, (10 - magnitude) / 12)
  );

  const spread = 20 + brightnessFactor * 58;

  const size = Math.round(
    (188 + brightnessFactor * 84) * palette.size
  );

  const glowAlpha = (
    0.28 + brightnessFactor * 0.55
  ).toFixed(2);

  proceduralStar.style.width = `${size}px`;
  proceduralStar.style.height = `${size}px`;

  proceduralStar.style.background = `
    radial-gradient(
      circle at 32% 30%,
      ${palette.core} 8%,
      ${palette.mid} 42%,
      ${palette.outer} 100%
    )
  `;

  proceduralStar.style.boxShadow = `
    0 0 ${spread}px ${palette.glow},
    0 0 ${spread * 2.4}px ${palette.shadow},
    0 0 ${spread * 3.2}px rgba(255, 255, 255, ${glowAlpha}),
    inset -18px -20px 28px rgba(0, 0, 0, 0.16)
  `;

  proceduralStar.style.setProperty(
    '--star-glow',
    palette.glow
  );

  proceduralStar.style.setProperty(
    '--star-core',
    palette.core
  );
}


/* =========================
   POPULATE HUD
========================= */

function populateHud(star, index) {
  selectedStar = star;

  starName.textContent = star.name;

  starDesignation.textContent =
    star.designation;

  starDistance.textContent =
    `${Number(star.distance).toFixed(1)} ly`;

  starSpectral.textContent =
    star.spectralType;

  starMagnitude.textContent =
    Number(star.magnitude).toFixed(2);
zz
  starTeff.textContent =
    `${Number(star.teff).toLocaleString()} K`;

  targetId.textContent =
    String(index + 1).padStart(3, '0');

  generateStarVisual(star);

  document
    .querySelectorAll('.result-item')
    .forEach((button) => {
      button.classList.toggle(
        'is-selected',
        button.dataset.name === star.name
      );
    });
}


/* =========================
   SEARCH
========================= */

function filterStars(query) {
  const value = query
    .trim()
    .toLowerCase();

  if (!value) {
    return [];
  }

  return starData
    .filter((star) => {
      const fields = [
        star.name,
        star.designation,
        star.spectralType
      ];

      return fields.some((field) =>
        String(field)
          .toLowerCase()
          .includes(value)
      );
    })
    .slice(0, 8);
}


function renderResults(items) {
  searchResults.innerHTML = '';

  if (!items.length) {
    searchResults.innerHTML = `
      <li class="result-empty">
        <span>NO TARGET FOUND</span>
      </li>
    `;

    searchResults.classList.remove('is-hidden');

    return;
  }

  items.forEach((star) => {
    const palette = getSpectralPalette(star);

    const button = document.createElement('button');

    button.type = 'button';

    button.className = 'result-item';

    button.dataset.name = star.name;

    if (
      selectedStar &&
      selectedStar.name === star.name
    ) {
      button.classList.add('is-selected');
    }

    button.innerHTML = `
      <span class="result-main">

        <span
          class="result-dot"
          style="
            color:${palette.glow};
            background:${palette.glow};
          "
        ></span>

        <span class="result-copy">

          <span class="result-name">
           ${palette.glow};
            background:${palette.glow};
          "
        ></span>

    button.addEventListener(
      'click',
      () => selectStar(star)
    );

    const item = document.createElement('li');

    item.appendChild(button);

    searchResults.appendChild(item);
  });

  searchResults.classList.remove('is-hidden');
}


==== */zz

function selectStar(star) {
  const index = starData.indexOf(star);

  hudCard.classList.remove('is-visible');

  window.setTimeout(() => {
    populateHud(star, index);

    hudCard.classList.add('is-visible');

    closeSearch();
  }, 120);
}


/* =========================
   SEARCH PANEL
========================= */

function openSearch() {
  searchWrapper.classList.add('is-open');

  searchTrigger.setAttribute(
    'aria-expanded',
    'true'
  );

  window.setTimeout(() => {
    searchInput.focus();
  }, 80);
}


function closeSearch() {
  searchWrapper.classList.remove('is-open');

  searchTrigger.setAttribute(
    'aria-expanded',
    'false'
  );

  searchInput.value = '';

  searchResults.innerHTML = '';

  searchResults.classList.add('is-hidden');
}


searchTrigger.addEventListener(
  'click',
  () => {
    if (
      searchWrapper.classList.contains('is-open')
    ) {
      closeSearch();
      return;
    }

    openSearch();
  }
);


searchClose.addEventListener(
  'click',
  closeSearch
);


/* =========================
   INPUT
========================= */

searchInput.addEventListener(
  'input',
  (event) => {
    const query = event.target.value;

    if (!query.trim()) {
      searchResults.innerHTML = '';

      searchResults.classList.add(
        'is-hidden'
      );

      return;
    }

    renderResults(
      filterStars(query)
    );
  }
);


/* =========================
   KEYBOARD
========================= */

searchInput.addEventListener(
  'keydown',
  (event) => {

    if (event.key === 'Escape') {
      closeSearch();
      searchTrigger.focus();
    }

    if (
      event.key === 'Enter' &&
      filterStars(searchInput.value).length
    ) {
      const firstMatch =
        filterStars(searchInput.value)[0];

      selectStar(firstMatch);
    }
  }
);


/* =========================
   OUTSIDE CLICK
========================= */

document.addEventListener(
  'click',
  (event) => {

    if (
      searchWrapper.classList.contains('is-open') &&
      !searchWrapper.contains(event.target)
    ) {
      closeSearch();
    }

  }
);


/* =========================
   INITIAL STATE
========================= */

if (starData.length > 0) {
  populateHud(starData[0], 0);
}

catalogStatus.textContent =
  `${starData.length} TARGETS AVAILABLE`