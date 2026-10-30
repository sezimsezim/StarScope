import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function getPosition(star) {
  if ([star.x, star.y, star.z].every((value) => Number.isFinite(Number(value)))) {
    return new THREE.Vector3(Number(star.x), Number(star.y), Number(star.z));
  }

  const distancePc = Number(star.distance_pc)
    || (Number(star.parallax) > 0 ? 1000 / Number(star.parallax) : NaN);
  const ra = THREE.MathUtils.degToRad(Number(star.ra));
  const dec = THREE.MathUtils.degToRad(Number(star.dec));

  if (!Number.isFinite(distancePc) || !Number.isFinite(ra) || !Number.isFinite(dec)) {
    return null;
  }

  return new THREE.Vector3(
    distancePc * Math.cos(dec) * Math.cos(ra),
    distancePc * Math.cos(dec) * Math.sin(ra),
    distancePc * Math.sin(dec)
  );
}

function createSelectionTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.shadowColor = "#ffffff";
  context.shadowBlur = 8;
  context.beginPath();
  context.arc(32, 32, 24, 0, Math.PI * 2);
  context.stroke();

  return new THREE.CanvasTexture(canvas);
}

export function createStarMap({ container, stars, onSelect, onModeChange, getSelectedId }) {
  const entries = stars
    .map((star) => ({ star, position: getPosition(star) }))
    .filter((entry) => entry.position && starId(entry.star))
    .sort((left, right) => Number(right.star.selection === "nearest") - Number(left.star.selection === "nearest"));

  const nearestCount = entries.filter((entry) => entry.star.selection === "nearest").length;
  const maxRadius = Math.max(1, ...entries.map((entry) => entry.position.length()));
  const indexById = new Map(entries.map((entry, index) => [starId(entry.star), index]));
  const positions = new Float32Array(entries.length * 3);
  const colors = new Float32Array(entries.length * 3);
  const magnitudes = new Float32Array(entries.length);

  entries.forEach(({ star, position }, index) => {
    position.toArray(positions, index * 3);
    const color = new THREE.Color(star.dotColor || "#dce8f5");
    color.toArray(colors, index * 3);
    const magnitude = star.phot_g_mean_mag;
    magnitudes[index] = Number.isFinite(magnitude) ? magnitude : 99;
  });

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "star-map-canvas";
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("aria-label", "Interactive three-dimensional Gaia star map");
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, maxRadius * 8 + 100);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aMagnitude", new THREE.BufferAttribute(magnitudes, 1));
  geometry.setDrawRange(0, nearestCount || entries.length);

  const pointMaterial = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: `
      uniform float uPixelRatio;
      attribute vec3 color;
      attribute float aMagnitude;
      varying vec3 vColor;
      varying float vBrightness;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        vBrightness = aMagnitude < 90.0 ? clamp((12.0 - aMagnitude) / 9.0, 0.08, 1.0) : 0.35;
        gl_PointSize = clamp(24.0 / sqrt(max(1.0, -viewPosition.z)), 2.0, 12.0) * uPixelRatio;
        vColor = color;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vBrightness;

      void main() {
        float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
        float core = 1.0 - smoothstep(0.12, 0.55, radius);
        float halo = 1.0 - smoothstep(0.28, 1.0, radius);
        float alpha = max(core, halo * 0.4) * mix(0.24, 1.0, vBrightness);
        vec3 color = mix(vColor, vec3(1.0), core * 0.45);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(
    geometry,
    pointMaterial
  );
  scene.add(points);

  const markerMaterial = new THREE.SpriteMaterial({
    map: createSelectionTexture(),
    transparent: true,
    depthTest: false
  });
  const marker = new THREE.Sprite(markerMaterial);
  marker.visible = false;
  marker.renderOrder = 2;
  scene.add(marker);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.25;
  controls.maxDistance = maxRadius * 5 + 50;
  controls.listenToKeyEvents(window);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let mode = nearestCount ? "nearby" : "catalog";
  let pointerStart = null;
  let disposed = false;

  function starId(star) {
    return star.source_id ? String(star.source_id) : star.id ? String(star.id) : null;
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    renderer.setSize(width, height, false);
    pointMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function updateMarker() {
    const selectedId = getSelectedId?.();
    const index = selectedId === null ? undefined : indexById.get(selectedId);
    if (index === undefined || (mode === "nearby" && index >= nearestCount)) {
      marker.visible = false;
      return;
    }

    marker.position.fromArray(positions, index * 3);
    markerMaterial.color.set(entries[index].star.dotColor || "#aab7c8");
    const distance = camera.position.distanceTo(controls.target);
    const worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const markerSize = worldHeight / Math.max(1, container.clientHeight) * 26;
    marker.scale.set(markerSize, markerSize, 1);
    marker.visible = true;
  }

  function resetView() {
    controls.target.set(0, 0, 0);
    camera.position.set(0, 0, mode === "nearby" ? 8 : maxRadius * 2.8);
    controls.update();
    updateMarker();
  }

  function setMode(nextMode) {
    mode = nextMode === "nearby" && nearestCount ? "nearby" : "catalog";
    geometry.setDrawRange(0, mode === "nearby" ? nearestCount : entries.length);
    updateMarker();
    onModeChange?.(mode);
  }

  function setSelectedStar(id, { focus = true } = {}) {
    const index = id ? indexById.get(String(id)) : undefined;

    if (focus && index !== undefined) {
      if (mode === "nearby" && index >= nearestCount) setMode("catalog");

      const target = new THREE.Vector3().fromArray(positions, index * 3);
      const direction = camera.position.clone().sub(controls.target).normalize();
      if (direction.lengthSq() === 0) direction.set(0, 0, 1);
      const distance = mode === "nearby"
        ? 6
        : THREE.MathUtils.clamp(Math.sqrt(target.length()) * 1.7, 6, 48);

      controls.target.copy(target);
      camera.position.copy(target).addScaledVector(direction, distance);
      controls.update();
    }

    updateMarker();
  }

  function onPointerDown(event) {
    pointerStart = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event) {
    if (!pointerStart) return;
    const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    pointerStart = null;
    if (moved > 6) return;

    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.params.Points.threshold = THREE.MathUtils.clamp(
      camera.position.distanceTo(controls.target) * 0.004,
      0.08,
      3
    );
    raycaster.setFromCamera(pointer, camera);

    const hit = raycaster.intersectObject(points)[0];
    if (!hit || hit.index === undefined) return;

    const entry = entries[hit.index];
    if (!entry) return;
    onSelect?.(entry.star);
  }

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  resetView();

  renderer.setAnimationLoop(() => {
    if (disposed) return;
    controls.update();
    updateMarker();
    renderer.render(scene, camera);
  });

  return {
    setMode,
    setSelectedStar,
    resetView,
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      geometry.dispose();
      pointMaterial.dispose();
      markerMaterial.map.dispose();
      markerMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
