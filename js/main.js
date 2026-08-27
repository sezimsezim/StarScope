const canvas = document.getElementById("starfield");
if (!canvas) {
  // Landing-page script; skip on other screens.
} else {
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, stars = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const count = reducedMotion ? 90 : Math.min(220, Math.floor((W * H) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8
    }));
  }

  window.addEventListener("resize", resize);
  resize();

  let parallaxX = 0;
  let parallaxY = 0;
  window.addEventListener("mousemove", (e) => {
    if (reducedMotion) return;
    parallaxX = (e.clientX / W - 0.5) * 10;
    parallaxY = (e.clientY / H - 0.5) * 10;
  });

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(parallaxX, parallaxY);
    for (const s of stars) {
      const tw = reducedMotion ? 1 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
      ctx.globalAlpha = tw;
      ctx.fillStyle = "#e7edf5";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    t++;
    requestAnimationFrame(draw);
  }
  draw();

  const tRA = document.getElementById("tRA");
  if (tRA) {
    setInterval(() => {
      const s = Math.floor(Math.random() * 60).toString().padStart(2, "0");
      tRA.textContent = `05h 14m ${s}s`;
    }, 1400);
  }

  let audioCtx = null;
  let soundOn = true;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function teffToFreq(teff) {
    const min = 2800;
    const max = 13000;
    const fMin = 180;
    const fMax = 760;
    const clamped = Math.max(min, Math.min(max, teff));
    return fMin + ((clamped - min) / (max - min)) * (fMax - fMin);
  }

  function playStarTone(teff) {
    if (!soundOn) return;
    const ctxA = ensureAudio();
    const now = ctxA.currentTime;
    const freq = teffToFreq(teff);
    const isHot = teff > 7000;

    const osc1 = ctxA.createOscillator();
    const osc2 = ctxA.createOscillator();
    const gain = ctxA.createGain();
    const filter = ctxA.createBiquadFilter();

    osc1.type = isHot ? "sine" : "triangle";
    osc2.type = isHot ? "square" : "sine";
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 2.01;
    filter.type = "lowpass";
    filter.frequency.value = isHot ? 6000 : 1800;

    const gain2 = ctxA.createGain();
    gain2.gain.value = isHot ? 0.06 : 0.02;

    osc1.connect(filter);
    osc2.connect(gain2).connect(filter);
    filter.connect(gain).connect(ctxA.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.95);
    osc2.stop(now + 0.95);
  }

  function playHoverTick() {
    if (!soundOn) return;
    const ctxA = ensureAudio();
    const now = ctxA.currentTime;
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain).connect(ctxA.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  const toggle = document.getElementById("soundToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      soundOn = !soundOn;
      toggle.dataset.on = soundOn;
      toggle.setAttribute("aria-pressed", soundOn);
      const label = document.getElementById("soundLabel");
      if (label) label.textContent = "AUDIO: " + (soundOn ? "ON" : "OFF");
      if (soundOn) ensureAudio();
    });
  }

  const FEATURED = [
    { name: "Sirius", desig: "α Canis Majoris A", x: 22, y: 32, dist: "8.6 ly", spec: "A1V", mag: "−1.46", teff: 9940 },
    { name: "Vega", desig: "α Lyrae", x: 76, y: 24, dist: "25 ly", spec: "A0V", mag: "0.03", teff: 9600 },
    { name: "Rigel", desig: "β Orionis", x: 14, y: 66, dist: "~860 ly", spec: "B8Ia", mag: "0.13", teff: 12100 },
    { name: "Betelgeuse", desig: "α Orionis", x: 85, y: 70, dist: "~550 ly", spec: "M1-2Ia", mag: "~0.5 (var.)", teff: 3600 },
    { name: "Arcturus", desig: "α Boötis", x: 50, y: 16, dist: "37 ly", spec: "K1.5III", mag: "−0.05", teff: 4286 },
    { name: "Proxima Centauri", desig: "α Centauri C", x: 63, y: 82, dist: "4.24 ly", spec: "M5.5Ve", mag: "11.13", teff: 3042 }
  ];

  const layer = document.getElementById("featuredLayer");
  const panel = document.getElementById("infoPanel");

  function openPanel(star, btn) {
    document.getElementById("pName").textContent = star.name;
    document.getElementById("pDesig").textContent = star.desig;
    document.getElementById("pDist").textContent = star.dist;
    document.getElementById("pSpec").textContent = star.spec;
    document.getElementById("pMag").textContent = star.mag;
    document.getElementById("pTeff").textContent = star.teff.toLocaleString() + " K";

    const rect = btn.getBoundingClientRect();
    const panelW = 260;
    let left = rect.left + 24;
    let top = rect.top - 10;
    if (left + panelW > window.innerWidth - 20) left = rect.left - panelW - 24;
    if (top + 220 > window.innerHeight) top = window.innerHeight - 240;
    if (top < 20) top = 20;
    panel.style.left = left + "px";
    panel.style.top = top + "px";
    panel.classList.add("open");
  }

  if (layer && panel) {
    FEATURED.forEach((star) => {
      const btn = document.createElement("button");
      btn.className = "featured-star";
      btn.style.left = star.x + "vw";
      btn.style.top = star.y + "vh";
      btn.setAttribute("aria-label", "Identify " + star.name);
      btn.innerHTML = `<span class="tag">${star.name.toUpperCase()}</span><span class="ring"></span><span class="core"></span>`;

      btn.addEventListener("mouseenter", playHoverTick);
      btn.addEventListener("click", (e) => {
        playStarTone(star.teff);
        openPanel(star, btn);
        e.stopPropagation();
      });
      layer.appendChild(btn);
    });

    const infoClose = document.getElementById("infoClose");
    if (infoClose) {
      infoClose.addEventListener("click", () => panel.classList.remove("open"));
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") panel.classList.remove("open");
    });

    document.addEventListener("click", (e) => {
      if (panel.classList.contains("open") && !panel.contains(e.target) && !e.target.closest(".featured-star")) {
        panel.classList.remove("open");
      }
    });
  }
}
