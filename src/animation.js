'use strict';

// ══════════════════════════════════════════════
//  ANIMATION LOOP
// ══════════════════════════════════════════════

const clock = new THREE.Clock();
let pulseT = 0;

function animate() {
  rafId = requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // Camera lerp
  if (cameraLerpActive) {
    lerpElapsed += dt;
    const t = Math.min(lerpElapsed / lerpDuration, 1);
    const et = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // ease in-out
    camera.position.lerp(lerpPos, et * 0.12 + dt * 2);
    controls.target.lerp(lerpTarget, et * 0.12 + dt * 2);
    if (t >= 1) cameraLerpActive = false;
  }

  controls.update();

  // Orbit animation
  if (sceneGroup && animMachine.timeScale > 0) {
    elapsed += dt * animMachine.timeScale;
    for (const obj of solarSystemObjects) {
      const { mesh, data, parentData } = obj;
      if (data.orbitRadius > 0) {
        const period = data.orbitPeriod * (parentData ? 0.1 : 1);
        const speed = (1 / (period > 0 ? period : 1)) * 0.5;
        mesh.userData.orbitAngle += dt * animMachine.timeScale * speed;
        const a = mesh.userData.orbitAngle;
        if (parentData) {
          // Moon: find parent mesh position
          const parentObj = solarSystemObjects.find(o => o.data.id === parentData.id);
          if (parentObj) {
            const pp = new THREE.Vector3();
            parentObj.mesh.getWorldPosition(pp);
            mesh.position.set(
              pp.x + Math.cos(a) * data.orbitRadius,
              pp.y,
              pp.z + Math.sin(a) * data.orbitRadius
            );
          }
        } else {
          const inc = THREE.MathUtils.degToRad(data.orbitInclination || 0);
          mesh.position.set(
            Math.cos(a) * data.orbitRadius,
            Math.sin(inc) * Math.sin(a) * data.orbitRadius * 0.3,
            Math.sin(a) * data.orbitRadius
          );
        }
        // Saturn rings follow planet
        if (data._ringMesh) {
          data._ringMesh.position.copy(mesh.position);
        }
      }
      // Axial rotation
      mesh.rotation.y += dt * animMachine.timeScale * 0.3;
    }
    // Asteroid belt slow rotation
    if (asteroidBelt) asteroidBelt.rotation.y += dt * 0.005;
  } else if (sceneGroup && viewMachine.state === 'OBJECT_DETAIL' && detailTarget) {
    // Slow rotate selected object
    detailTarget.mesh.rotation.y += dt * 0.3;
  }

  // Galaxy marker pulse
  if (galaxyMarkerMesh) {
    pulseT += dt * 2;
    const s = 1 + Math.sin(pulseT) * 0.25;
    galaxyMarkerMesh.scale.setScalar(s);
    galaxyMarkerMesh.material.opacity = 0.5 + Math.sin(pulseT) * 0.4;

    // Update label position
    const labelEl = document.getElementById('galaxy-marker-label');
    if (labelEl.style.display !== 'none') {
      const wp = galaxyMarkerMesh.position.clone().project(camera);
      const x = (wp.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-wp.y * 0.5 + 0.5) * window.innerHeight;
      labelEl.style.left = x + 'px';
      labelEl.style.top  = y + 'px';
    }
  }

  // Lazy raycasting
  if (raycasterDirty) {
    raycasterDirty = false;
    doRaycast(false);
  }

  renderer.render(scene, camera);
}