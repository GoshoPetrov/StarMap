'use strict';

// ══════════════════════════════════════════════
//  RAYCASTING
// ══════════════════════════════════════════════

function doRaycast(isClick) {
  if (viewMachine.state === 'GALAXY') {
    // Check galaxy marker
    if (galaxyMarkerMesh) {
      mouseVec.set((mouseX/window.innerWidth)*2-1, -(mouseY/window.innerHeight)*2+1);
      raycaster.setFromCamera(mouseVec, camera);
      const hits = raycaster.intersectObject(galaxyMarkerMesh);
      if (hits.length > 0) {
        if (isClick) viewMachine.send('ENTER_SOLAR_SYSTEM');
        canvas.classList.add('hovering');
        showTooltip('Solar System', mouseX, mouseY);
        return;
      } else {
        canvas.classList.remove('hovering');
        hideTooltip();
      }
    }
    return;
  }

  if (!solarSystemObjects.length) return;
  mouseVec.set((mouseX/window.innerWidth)*2-1, -(mouseY/window.innerHeight)*2+1);
  raycaster.setFromCamera(mouseVec, camera);
  const meshes = solarSystemObjects.map(o => o.mesh);
  const hits = raycaster.intersectObjects(meshes, false);

  if (hits.length > 0) {
    const hit = hits[0];
    const found = solarSystemObjects.find(o => o.mesh === hit.object);
    if (found) {
      if (isClick) {
        found.machine.send('CLICK');
      } else {
        if (currentHoveredMachine && currentHoveredMachine !== found.machine) {
          currentHoveredMachine.send('MOUSE_LEAVE');
        }
        if (found.machine.state === 'IDLE') found.machine.send('MOUSE_ENTER');
        currentHoveredMachine = found.machine;
        // Update tooltip position
        if (found.machine.state === 'HOVERED') showTooltip(found.data.name, mouseX, mouseY);
      }
    }
  } else {
    if (currentHoveredMachine) {
      currentHoveredMachine.send('MOUSE_LEAVE');
      currentHoveredMachine = null;
      hideTooltip();
      canvas.classList.remove('hovering');
    }
    if (isClick) {
      // Click empty = deselect
      if (viewMachine.state === 'OBJECT_DETAIL') {
        document.getElementById('nav-btn').click();
      }
    }
  }
}