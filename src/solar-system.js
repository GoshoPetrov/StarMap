'use strict';

// ══════════════════════════════════════════════
//  SOLAR SYSTEM BUILD
// ══════════════════════════════════════════════

function buildOrbitLine(radius, inclinationDeg, y) {
  const segments = 128;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
  const line = new THREE.Line(geo, mat);
  line.rotation.x = THREE.MathUtils.degToRad(inclinationDeg || 0);
  return line;
}

async function buildSolarSystem() {
  sceneGroup = new THREE.Group();
  scene.add(sceneGroup);

  // Lighting
  const sunLight = new THREE.PointLight(0xFFFFEE, 2.5, 800);
  sunLight.position.set(0,0,0);
  sceneGroup.add(sunLight);
  sceneGroup.add(new THREE.AmbientLight(0x111122, 1));

  // Load textures and build bodies
  for (const data of SOLAR_SYSTEM_DATA) {
    const tex = await loadTexture(data.textureUrl, data.color);
    const isBasic = data.type === 'star';
    const mat = makeMaterial(tex, data.color, data.emissive, data.emissiveIntensity, isBasic);
    const geo = new THREE.SphereGeometry(data.radius, 32, 32);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = THREE.MathUtils.degToRad(data.axialTilt || 0);
    mesh.userData = { orbitAngle: Math.random() * Math.PI * 2 };

    if (data.type === 'star') {
      // Sun glow
      const glowGeo = new THREE.SphereGeometry(data.radius * 1.18, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({ color:0xFFAA00, transparent:true, opacity:0.18, side:THREE.BackSide });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      sceneGroup.add(glow);
    }

    sceneGroup.add(mesh);
    const machine = createObjectMachine(mesh, data, null);
    solarSystemObjects.push({ mesh, data, machine });

    // Orbit line
    if (data.orbitRadius > 0) {
      const line = buildOrbitLine(data.orbitRadius, data.orbitInclination || 0);
      sceneGroup.add(line);
      orbitLines.push(line);
    }

    // Saturn rings
    if (data.rings) {
      const r = data.rings;
      const ringGeo = new THREE.RingGeometry(r.innerRadius, r.outerRadius, 64);
      // Fix UV for ring texture
      const uv = ringGeo.attributes.uv;
      const pos = ringGeo.attributes.position;
      for (let i = 0; i < uv.count; i++) {
        const vx = pos.getX(i), vz = pos.getZ(i);
        const d = Math.sqrt(vx*vx + vz*vz);
        uv.setX(i, (d - r.innerRadius) / (r.outerRadius - r.innerRadius));
      }
      const ringTex = await loadTexture(r.textureUrl, null);
      const ringMat = new THREE.MeshBasicMaterial({
        map: ringTex, color: ringTex ? 0xffffff : r.color,
        side: THREE.DoubleSide, transparent: true, opacity: r.opacity
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      sceneGroup.add(ringMesh);
      data._ringMesh = ringMesh;
    }

    // Moons
    if (data.moons) {
      for (const moonData of data.moons) {
        const mTex = await loadTexture(moonData.textureUrl, moonData.color);
        const mMat = makeMaterial(mTex, moonData.color, 0x000000, 0, false);
        const mGeo = new THREE.SphereGeometry(moonData.radius, 20, 20);
        const mMesh = new THREE.Mesh(mGeo, mMat);
        mMesh.userData = { orbitAngle: Math.random() * Math.PI * 2 };
        sceneGroup.add(mMesh);
        const mMachine = createObjectMachine(mMesh, moonData, data);
        solarSystemObjects.push({ mesh: mMesh, data: moonData, machine: mMachine, parentData: data });
      }
    }
  }

  // Asteroid belt
  {
    const cfg = ASTEROID_BELT_CFG;
    const positions = [];
    for (let i = 0; i < cfg.count; i++) {
      const r = cfg.innerRadius + Math.random() * (cfg.outerRadius - cfg.innerRadius);
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1.2;
      positions.push(Math.cos(a)*r, y, Math.sin(a)*r);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: cfg.color, size: 0.12, sizeAttenuation: true });
    asteroidBelt = new THREE.Points(geo, mat);
    sceneGroup.add(asteroidBelt);
  }

  lerpCameraTo(CAM_SOLAR.pos.clone(), CAM_SOLAR.target.clone(), 0);
}

function teardownSolarSystem() {
  hideVectors();
  solarSystemObjects = [];
  orbitLines = [];
  asteroidBelt = null;
  if (sceneGroup) {
    sceneGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => { if(m.map)m.map.dispose(); m.dispose(); });
        else { if(obj.material.map)obj.material.map.dispose(); obj.material.dispose(); }
      }
    });
    scene.remove(sceneGroup);
    sceneGroup = null;
  }
  hideInfoPanel();
  selectedMachine = null;
  detailTarget = null;
}