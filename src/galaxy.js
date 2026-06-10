'use strict';

// ══════════════════════════════════════════════
//  GALAXY BUILD
// ══════════════════════════════════════════════

function buildGalaxy() {
  const group = new THREE.Group();
  scene.add(group);
  galaxyObjects.push(group);

  function makeParticles(count, colorHex, builder) {
    const positions = [];
    for (let i = 0; i < count; i++) builder(positions);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: colorHex, size: 0.4, sizeAttenuation: true, transparent: true, opacity: 0.85 });
    return new THREE.Points(geo, mat);
  }

  // Galactic core
  const core = makeParticles(20000, 0xFFEECC, pos => {
    const r = Math.pow(Math.random(), 2) * 25;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI * 0.15 * (1 - r/25);
    pos.push(r*Math.cos(theta)*Math.cos(phi), r*Math.sin(phi)*3, r*Math.sin(theta)*Math.cos(phi));
  });
  group.add(core);

  // 4 spiral arms
  const armColors = [0xAABBFF, 0x99AAFF, 0xBBCCFF, 0xAABBFF];
  for (let arm = 0; arm < 4; arm++) {
    const armOffset = (arm / 4) * Math.PI * 2;
    const pts = makeParticles(20000, armColors[arm], pos => {
      const t = Math.random();
      const r = 8 + t * 120;
      const spread = (1 - t) * 3 + t * 18;
      const a = armOffset + t * 4.5 + (Math.random() - 0.5) * 0.6;
      const x = r * Math.cos(a) + (Math.random()-0.5)*spread;
      const z = r * Math.sin(a) + (Math.random()-0.5)*spread;
      const y = (Math.random()-0.5) * (1 + t*6);
      pos.push(x, y, z);
    });
    group.add(pts);
  }

  // Disk haze
  const haze = makeParticles(30000, 0x334466, pos => {
    const r = 15 + Math.random() * 100;
    const a = Math.random() * Math.PI * 2;
    const y = (Math.random()-0.5) * (4 + r*0.06);
    pos.push(r*Math.cos(a), y, r*Math.sin(a));
  });
  haze.material.opacity = 0.4;
  group.add(haze);

  // Background stars
  const stars = makeParticles(10000, 0xffffff, pos => {
    const r = 200 + Math.random() * 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2*Math.random()-1);
    pos.push(r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi));
  });
  stars.material.size = 0.3; stars.material.opacity = 0.6;
  group.add(stars);

  // Solar system marker (pulsing sphere)
  const markerGeo = new THREE.SphereGeometry(1.2, 16, 16);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0x7ef4ff, transparent: true, opacity: 0.9 });
  galaxyMarkerMesh = new THREE.Mesh(markerGeo, markerMat);
  galaxyMarkerMesh.position.set(60, 4, 10);
  group.add(galaxyMarkerMesh);
  galaxyObjects.push(galaxyMarkerMesh);

  lerpCameraTo(CAM_GALAXY.pos.clone(), CAM_GALAXY.target.clone(), 0);

  document.getElementById('galaxy-marker-label').style.display = 'block';
  document.getElementById('bottom-hud').classList.add('hidden');
}

function teardownGalaxy() {
  document.getElementById('galaxy-marker-label').style.display = 'none';
  galaxyMarkerMesh = null;
  for (const obj of galaxyObjects) {
    if (obj.traverse) {
      obj.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    scene.remove(obj);
  }
  galaxyObjects = [];
}