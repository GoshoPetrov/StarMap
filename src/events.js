'use strict';

// ══════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════

canvas.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  raycasterDirty = true;
  // update tooltip pos if visible
  const tt = document.getElementById('tooltip');
  if (tt.style.display !== 'none') {
    tt.style.left = (e.clientX+14)+'px';
    tt.style.top  = (e.clientY-10)+'px';
  }
});

canvas.addEventListener('click', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  doRaycast(true);
});

document.getElementById('btn-pause').addEventListener('click', () => animMachine.send('PAUSE'));
document.getElementById('btn-play').addEventListener('click',  () => animMachine.send('PLAY'));
document.getElementById('btn-fast').addEventListener('click',  () => animMachine.send('SPEED_UP'));

document.getElementById('btn-zoom-in').addEventListener('click', () => {
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.addScaledVector(dir, -camera.position.distanceTo(controls.target) * 0.2);
  controls.update();
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.addScaledVector(dir, camera.position.distanceTo(controls.target) * 0.2);
  controls.update();
});
document.getElementById('btn-reset-cam').addEventListener('click', () => {
  const st = viewMachine.state;
  if (st === 'SOLAR_SYSTEM' || st === 'OBJECT_DETAIL') lerpCameraTo(CAM_SOLAR.pos.clone(), CAM_SOLAR.target.clone(), 0.8);
  else lerpCameraTo(CAM_GALAXY.pos.clone(), CAM_GALAXY.target.clone(), 0.8);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});