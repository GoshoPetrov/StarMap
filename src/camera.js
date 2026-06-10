'use strict';

// ══════════════════════════════════════════════
//  CAMERA LERP
// ══════════════════════════════════════════════

let lerpPos = null, lerpTarget = null, lerpDuration = 0, lerpElapsed = 0;

function lerpCameraTo(pos, target, duration) {
  if (duration <= 0) {
    camera.position.copy(pos);
    controls.target.copy(target);
    controls.update();
    return;
  }
  lerpPos = pos; lerpTarget = target;
  lerpDuration = duration; lerpElapsed = 0;
  cameraLerpActive = true;
}