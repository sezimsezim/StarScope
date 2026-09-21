const starData = [
  { name: 'Sirius', designation: 'Alpha Canis Majoris', distance: 8.6, spectralType: 'A1V', magnitude: -1.46, teff: 9940 },
  { name: 'Vega', designation: 'Alpha Lyrae', distance: 25.0, spectralType: 'A0V', magnitude: 0.03, teff: 9600 },
  { name: 'Rigel', designation: 'Beta Orionis', distance: 860, spectralType: 'B8Ia', magnitude: 0.13, teff: 12100 },
  { name: 'Betelgeuse', designation: 'Alpha Orionis', distance: 548, spectralType: 'M1-2Ia', magnitude: 0.5, teff: 3600 },
  { name: 'Arcturus', designation: 'Alpha Boötis', distance: 37, spectralType: 'K1.5III', magnitude: -0.05, teff: 4286 },
  { name: 'Proxima Centauri', designation: 'Alpha Centauri C', distance: 4.24, spectralType: 'M5.5Ve', magnitude: 11.13, teff: 3042 },
  { name: 'Altair', designation: 'Alpha Aquilae', distance: 16.7, spectralType: 'A7V', magnitude: 0.77, teff: 7550 },
  { name: 'Deneb', designation: 'Alpha Cygni', distance: 2615, spectralType: 'A2Ia', magnitude: 1.25, teff: 8525 },
  { name: 'Polaris', designation: 'Alpha Ursae Minoris', distance: 433, spectralType: 'F7Ib', magnitude: 1.97, teff: 6015 },
  { name: 'Antares', designation: 'Alpha Scorpii', distance: 550, spectralType: 'M1.5Iab', magnitude: 1.06, teff: 3500 },
  { name: 'Spica', designation: 'Alpha Virginis', distance: 250, spectralType: 'B1III-IV', magnitude: 0.98, teff: 22500 },
  { name: 'Capella', designation: 'Alpha Aurigae', distance: 42.9, spectralType: 'G8III', magnitude: 0.08, teff: 4970 },
  { name: 'Aldebaran', designation: 'Alpha Tauri', distance: 65, spectralType: 'K5III', magnitude: 0.87, teff: 3910 },
  { name: 'Bellatrix', designation: 'Gamma Orionis', distance: 240, spectralType: 'B2III', magnitude: 1.64, teff: 22000 },
  { name: 'Canopus', designation: 'Alpha Carinae', distance: 310, spectralType: 'A9II', magnitude: -0.74, teff: 7350 },
  { name: 'Mira', designation: 'Omicron Ceti', distance: 200, spectralType: 'M7e', magnitude: 3.5, teff: 3000 },
  { name: 'Alpha Centauri', designation: 'Alpha Centauri A', distance: 4.37, spectralType: 'G2V', magnitude: -0.27, teff: 5790 },
  { name: 'Beta Pictoris', designation: 'Beta Pictoris', distance: 63, spectralType: 'A6V', magnitude: 3.86, teff: 8050 },
  { name: 'Mizar', designation: 'Zeta Ursae Majoris', distance: 78, spectralType: 'A2V', magnitude: 2.04, teff: 9000 },
  { name: 'Epsilon Eridani', designation: 'Epsilon Eridani', distance: 10.5, spectralType: 'K2V', magnitude: 3.73, teff: 5084 }
];

const searchInput = document.getElementById('starSearch');
const searchWrapper = document.getElementById('searchWrapper');
const searchResults = document.getElementById('searchResults');
const hudCard = document.getElementById('starHudCard');
const proceduralStar = document.getElementById('proceduralStarVisual');

const starName = document.getElementById('starName');
const starDesignation = document.getElementById('starDesignation');
const starDistance = document.getElementById('starDistance');
const starSpectral = document.getElementById('starSpectral');
const starMagnitude = document.getElementById('starMagnitude');
const starTeff = document.getElementById('starTeff');

function getSpectralPalette(star) {
  const temp = Number(star.teff || 0);
  const type = String(star.spectralType || '').trim().charAt(0).toUpperCase();

  if (type === 'O' || type === 'B' || temp > 10000) {
    return {
      colors: ['#ffffff 12%', '#4facfe 58%', '#00f2fe 100%'],
      glow: 'rgba(79, 172, 254, 0.8)',
      shadow: 'rgba(79, 172, 254, 0.32)',
      size: 1.06
    };
  }

  if (type === 'A' || type === 'F' || (temp >= 7500 && temp <= 10000)) {
    return {
      colors: ['#ffffff 20%', '#e0c3fc 100%'],
      glow: 'rgba(224, 195, 252, 0.85)',
      shadow: 'rgba(224, 195, 252, 0.28)',
      size: 1.03
    };
  }

  if (type === 'G' || (temp >= 5000 && temp <= 7500)) {
    return {
      colors: ['#ffffff 12%', '#f6d365 45%', '#ffb347 100%'],
      glow: 'rgba(246, 211, 101, 0.8)',
      shadow: 'rgba(246, 211, 101, 0.26)',
      size: 1.02
    };
  }

  if (type === 'K' || (temp >= 3500 && temp < 5000)) {
    return {
      colors: ['#ffe259 18%', '#ffa751 100%'],
      glow: 'rgba(255, 167, 81, 0.8)',
      shadow: 'rgba(255, 167, 81, 0.22)',
      size: 1.0
    };
  }

  return {
    colors: ['#ff0844 18%', '#ffb199 100%'],
    glow: 'rgba(255, 132, 100, 0.8)',
    shadow: 'rgba(255, 132, 100, 0.22)',
    size: 0.98
  };
}

function generateStarVisual(star) {
  const palette = getSpectralPalette(star);
  const magnitude = Number(star.magnitude || 0);
  const brightnessFactor = Math.max(0, Math.min(1, (10 - magnitude) / 12));
  const spread = 18 + brightnessFactor * 62;
  const glowOpacity = 0.25 + brightnessFactor * 0.8;
  const scale = 0.8 + brightnessFactor * 0.28 + palette.size * 0.08;

  proceduralStar.style.background = `radial-gradient(circle at 32% 30%, ${palette.colors.join(', ')})`;
  proceduralStar.style.boxShadow = `0 0 ${spread}px ${palette.glow}, 0 0 ${spread * 2.4}px ${palette.shadow}, 0 0 ${spread * 3}px rgba(255,255,255,${glowOpacity * 0.35}), inset -18px -18px 28px rgba(0, 0, 0, 0.12)`;
  proceduralStar.style.transform = `scale(${scale})`;
  proceduralStar.style.width = `${180 + brightnessFactor * 70}px`;
  proceduralStar.style.height = `${180 + brightnessFactor * 70}px`;
}

function populateHud(star) {
  starName.textContent = star.name;
  starDesignation.textContent = star.designation;
  starDistance.textContent = `${Number(star.distance).toFixed(1)} ly`;
  starSpectral.textContent = star.spectralType;
  starMagnitude.textContent = `${Number(star.magnitude).toFixed(2)}`;
  starTeff.textContent = `${Number(star.teff).toLocaleString()} K`;
  generateStarVisual(star);
}

function filterStars(query) {
  const value = query.trim().toLowerCase();
  if (!value) return [];

  return starData.filter((star) => {
    return [star.name, star.designation, star.spectralType].some((field) =>
      String(field).toLowerCase().includes(value)
    );
  }).slice(0, 8);
}

function renderResults(items) {
  if (!items.length) {
    searchResults.innerHTML = '<li><button class="result-item" type="button">No matches found</button></li>';
    searchResults.classList.remove('is-hidden');
    return;
  }

  searchResults.innerHTML = items.map((star) => {
    const palette = getSpectralPalette(star);
    return `
      <li>
        <button class="result-item" type="button" data-name="${star.name}">
          <span class="result-main">
            <span class="result-dot" style="color:${palette.glow}; background:${palette.glow};"></span>
            <span class="result-copy">
              <span class="result-name">${star.name}</span>
              <span class="result-designation">${star.designation}</span>
            </span>
          </span>
          <span class="result-distance">${Number(star.distance).toFixed(1)} ly</span>
        </button>
      </li>
    `;
  }).join('');

  searchResults.classList.remove('is-hidden');

  searchResults.querySelectorAll('.result-item').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = starData.find((star) => star.name === button.dataset.name);
      if (!selected) return;

      searchResults.classList.add('is-hidden');
      searchWrapper.classList.add('is-active');
      hudCard.classList.remove('is-hidden');
      hudCard.classList.add('is-active');
      populateHud(selected);
    });
  });
}

searchInput.addEventListener('input', (event) => {
  const query = event.target.value;

  if (!query.trim()) {
    searchResults.classList.add('is-hidden');
    return;
  }

  renderResults(filterStars(query));
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('#searchWrapper') && !event.target.closest('.result-item')) {
    searchResults.classList.add('is-hidden');
  }
});
