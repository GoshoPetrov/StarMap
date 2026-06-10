'use strict';

// ══════════════════════════════════════════════
//  MATHEMATICAL VECTOR VISUALIZATION
//  Shows radius vec, velocity vec, acceleration
//  vec, and angular momentum vec on hover.
// ══════════════════════════════════════════════

const SCENE_TO_KM = 7.48e6; // 1 scene unit ≈ 7.48 million km

// Real orbital velocities (km/s) — computed from 2πr/T
const ORBITAL_VELOCITIES = {
  mercury:  47.87, venus: 35.02, earth: 29.78, mars: 24.07,
  jupiter:  13.07, saturn: 9.69, uranus: 6.81, neptune: 5.43, pluto: 4.67
};

// Real masses in kg
const PLANET_MASSES = {
  sun:      { val: 1.989e30, label: '1.989 × 10³⁰ kg' },
  mercury:  { val: 3.301e23, label: '3.301 × 10²³ kg' },
  venus:    { val: 4.867e24, label: '4.867 × 10²⁴ kg' },
  earth:    { val: 5.972e24, label: '5.972 × 10²⁴ kg' },
  mars:     { val: 6.417e23, label: '6.417 × 10²³ kg' },
  jupiter:  { val: 1.898e27, label: '1.898 × 10²⁷ kg' },
  saturn:   { val: 5.683e26, label: '5.683 × 10²⁶ kg' },
  uranus:   { val: 8.681e25, label: '8.681 × 10²⁵ kg' },
  neptune:  { val: 1.024e26, label: '1.024 × 10²⁶ kg' },
  pluto:    { val: 1.309e22, label: '1.309 × 10²² kg' },
  moon:     { val: 7.342e22, label: '7.342 × 10²² kg' },
  io:       { val: 8.932e22, label: '8.932 × 10²² kg' },
  europa:   { val: 4.800e22, label: '4.800 × 10²² kg' },
  ganymede: { val: 1.482e23, label: '1.482 × 10²³ kg' },
  callisto: { val: 1.076e23, label: '1.076 × 10²³ kg' },
  titan:    { val: 1.345e23, label: '1.345 × 10²³ kg' },
  enceladus:{ val: 1.080e20, label: '1.080 × 10²⁰ kg' },
  triton:   { val: 2.139e22, label: '2.139 × 10²² kg' },
  phobos:   { val: 1.060e16, label: '1.060 × 10¹⁶ kg' },
  deimos:   { val: 1.476e15, label: '1.476 × 10¹⁵ kg' }
};

// ── COLOR PALETTE ──
const COLOR_RADIUS   = 0xff3333;
const COLOR_VELOCITY = 0x4488ff;
const COLOR_ACCEL    = 0x44ff44;
const COLOR_ANGULAR  = 0xaa55ff;

// ── ACTIVE VECTOR STATE ──
let vectorActive  = false;
let vectorTarget  = null;   // { data, mesh, parentData? }
let vectorArrows  = [];     // [{ arrow, kind }]
let vectorLabels  = [];     // [{ el, worldPos }]

// ═══════════════════════════════════════════
//  CREATE / SHOW VECTORS
// ═══════════════════════════════════════════

function showVectors(targetObj) {
  hideVectors();

  const { data, mesh, parentData } = targetObj;
  if (!data.orbitRadius || data.orbitRadius <= 0) return;

  vectorActive = true;
  vectorTarget = targetObj;

  // 1. Radius arrow
  const rArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1,
    COLOR_RADIUS, 0.5, 0.3
  );
  sceneGroup.add(rArrow);
  vectorArrows.push({ arrow: rArrow, kind: 'radius' });

  // 2. Velocity arrow
  const vArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1,
    COLOR_VELOCITY, 0.45, 0.25
  );
  sceneGroup.add(vArrow);
  vectorArrows.push({ arrow: vArrow, kind: 'velocity' });

  // 3. Acceleration arrow
  const aArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1,
    COLOR_ACCEL, 0.35, 0.2
  );
  sceneGroup.add(aArrow);
  vectorArrows.push({ arrow: aArrow, kind: 'accel' });

  // 4. Angular momentum arrow
  const lArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1,
    COLOR_ANGULAR, 0.4, 0.22
  );
  sceneGroup.add(lArrow);
  vectorArrows.push({ arrow: lArrow, kind: 'angular' });

  // Create 4 label elements
  const labelDefs = [
    { color: '#ff5555' },
    { color: '#66aaff' },
    { color: '#55ff55' },
    { color: '#bb77ff' }
  ];
  const container = document.getElementById('vector-labels-container');
  for (const ld of labelDefs) {
    const el = document.createElement('div');
    el.className = 'vector-label';
    el.style.color = ld.color;
    el.style.textShadow = `0 0 8px ${ld.color}, 0 0 16px ${ld.color}44`;
    container.appendChild(el);
    vectorLabels.push({ el, worldPos: new THREE.Vector3() });
  }

  // Immediately update to correct positions
  updateVectorArrows();
  updateVectorLabels();
}

// ═══════════════════════════════════════════
//  HIDE / DESTROY VECTORS
// ═══════════════════════════════════════════

function hideVectors() {
  vectorActive = false;
  vectorTarget = null;

  for (const va of vectorArrows) {
    sceneGroup.remove(va.arrow);
    if (va.arrow.line) {
      va.arrow.line.geometry.dispose();
      va.arrow.line.material.dispose();
    }
    if (va.arrow.cone) {
      va.arrow.cone.geometry.dispose();
      va.arrow.cone.material.dispose();
    }
  }
  vectorArrows = [];

  const container = document.getElementById('vector-labels-container');
  for (const vl of vectorLabels) {
    if (vl.el.parentNode) vl.el.parentNode.removeChild(vl.el);
  }
  vectorLabels = [];
}

// ═══════════════════════════════════════════
//  UPDATE ARROW DIRECTIONS EACH FRAME
// ═══════════════════════════════════════════

function updateVectorArrows() {
  if (!vectorActive || !vectorTarget || vectorArrows.length === 0) return;

  const { data, mesh, parentData } = vectorTarget;

  // Origin
  let origin = new THREE.Vector3(0, 0, 0);
  if (parentData) {
    const parentObj = solarSystemObjects.find(o => o.data.id === parentData.id);
    if (parentObj) parentObj.mesh.getWorldPosition(origin);
  }

  // Planet position
  const planetPos = new THREE.Vector3();
  mesh.getWorldPosition(planetPos);

  // Geometry
  const dir = planetPos.clone().sub(origin);
  const distScene = dir.length();
  const dirNorm = dir.clone().normalize();

  const inc = THREE.MathUtils.degToRad(data.orbitInclination || 0);
  const a = mesh.userData.orbitAngle || 0;
  const tanDir = new THREE.Vector3(
    -Math.sin(a),
    Math.sin(inc) * Math.cos(a) * 0.3,
    Math.cos(a)
  ).normalize();

  // Real values
  const distKm = distScene * SCENE_TO_KM;
  const velKmS = getOrbitalVelocity(data);
  const vMS = velKmS * 1000;
  const rM = distKm * 1000;
  const accel = vMS * vMS / rM;
  const massInfo = PLANET_MASSES[data.id];
  const massKg = massInfo ? massInfo.val : 0;
  const lMag = massKg * vMS * rM;

  // Update each arrow
  for (const va of vectorArrows) {
    switch (va.kind) {
      case 'radius': {
        const len = distScene * 0.85;
        va.arrow.position.copy(origin);
        va.arrow.setDirection(dirNorm);
        va.arrow.setLength(len, Math.min(0.5, len * 0.06), Math.min(0.3, len * 0.04));
        break;
      }
      case 'velocity': {
        const len = Math.max(1.5, Math.min(8, distScene * 0.25));
        va.arrow.position.copy(planetPos);
        va.arrow.setDirection(tanDir);
        va.arrow.setLength(len, Math.min(0.45, len * 0.06), Math.min(0.25, len * 0.04));
        break;
      }
      case 'accel': {
        const len = Math.max(0.8, Math.min(4, distScene * 0.12));
        const accelDir = dirNorm.clone().multiplyScalar(-1);
        va.arrow.position.copy(planetPos);
        va.arrow.setDirection(accelDir);
        va.arrow.setLength(len, Math.min(0.35, len * 0.06), Math.min(0.2, len * 0.04));
        break;
      }
      case 'angular': {
        const len = Math.max(1.5, Math.min(6, distScene * 0.2));
        const lDir = dirNorm.clone().cross(tanDir).normalize();
        if (lDir.y < 0) lDir.multiplyScalar(-1);
        va.arrow.position.copy(planetPos);
        va.arrow.setDirection(lDir);
        va.arrow.setLength(len, Math.min(0.4, len * 0.06), Math.min(0.22, len * 0.04));
        break;
      }
    }
  }

  // Update label world positions and text
  if (vectorLabels.length >= 4) {
    const rLen = distScene * 0.85;
    const vLen = Math.max(1.5, Math.min(8, distScene * 0.25));
    const aLen = Math.max(0.8, Math.min(4, distScene * 0.12));
    const lLen = Math.max(1.5, Math.min(6, distScene * 0.2));
    const aDir = dirNorm.clone().multiplyScalar(-1);
    const lDir = dirNorm.clone().cross(tanDir).normalize();
    if (lDir.y < 0) lDir.multiplyScalar(-1);

    // Radius label: midpoint
    vectorLabels[0].worldPos.copy(
      origin.clone().add(dir.clone().multiplyScalar(0.5))
    );
    vectorLabels[0].el.textContent = formatDistance(distKm);

    // Velocity label
    vectorLabels[1].worldPos.copy(
      planetPos.clone().add(tanDir.clone().multiplyScalar(vLen * 1.2))
    );
    vectorLabels[1].el.textContent =
      `${velKmS.toFixed(1)} km/s  |  ${massInfo ? massInfo.label : '?'}`;

    // Acceleration label
    vectorLabels[2].worldPos.copy(
      planetPos.clone().add(aDir.clone().multiplyScalar(aLen * 1.4))
    );
    vectorLabels[2].el.textContent = formatAccel(accel);

    // Angular momentum label
    vectorLabels[3].worldPos.copy(
      planetPos.clone().add(lDir.clone().multiplyScalar(lLen * 1.3))
    );
    vectorLabels[3].el.textContent = formatAngularMomentum(lMag);
  }
}

// ═══════════════════════════════════════════
//  UPDATE LABEL SCREEN POSITIONS EACH FRAME
// ═══════════════════════════════════════════

function updateVectorLabels() {
  if (!vectorActive || vectorLabels.length === 0) return;

  for (const vl of vectorLabels) {
    const wp = vl.worldPos.clone();
    wp.project(camera);

    if (wp.z > 1) {
      vl.el.style.display = 'none';
      continue;
    }

    const x = (wp.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-wp.y * 0.5 + 0.5) * window.innerHeight;
    vl.el.style.display = 'block';
    vl.el.style.left = x + 'px';
    vl.el.style.top  = y + 'px';
  }
}

// ═══════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════

function getOrbitalVelocity(data) {
  if (ORBITAL_VELOCITIES[data.id]) return ORBITAL_VELOCITIES[data.id];
  const distKm = data.orbitRadius * SCENE_TO_KM;
  const periodSec = (data.orbitPeriod || 1) * 365.25 * 24 * 3600;
  return (2 * Math.PI * distKm) / periodSec;
}

function formatDistance(km) {
  if (km >= 1e9) return (km / 1e9).toFixed(2) + 'B km';
  if (km >= 1e6) return (km / 1e6).toFixed(1) + 'M km';
  return km.toFixed(0) + ' km';
}

function formatAccel(ms2) {
  if (ms2 < 0.01) return ms2.toExponential(1) + ' m/s²';
  return ms2.toFixed(4) + ' m/s²';
}

function formatAngularMomentum(lMag) {
  if (lMag >= 1e40) return (lMag / 1e40).toFixed(2) + '×10⁴⁰ kg·m²/s';
  if (lMag >= 1e38) return (lMag / 1e38).toFixed(2) + '×10³⁸ kg·m²/s';
  if (lMag >= 1e36) return (lMag / 1e36).toFixed(2) + '×10³⁶ kg·m²/s';
  return lMag.toExponential(1) + ' kg·m²/s';
}

// ═══════════════════════════════════════════
//  INIT CONTAINER
// ═══════════════════════════════════════════

(function ensureVectorLabelContainer() {
  if (!document.getElementById('vector-labels-container')) {
    const c = document.createElement('div');
    c.id = 'vector-labels-container';
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:180;';
    document.body.appendChild(c);
  }
})();
