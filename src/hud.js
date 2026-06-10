'use strict';

// ══════════════════════════════════════════════
//  HUD
// ══════════════════════════════════════════════

function updateNavBtn(state) {
  const btn = document.getElementById('nav-btn');
  if (state === 'SOLAR_SYSTEM') {
    btn.style.display = 'block';
    btn.textContent = '🌌 Galaxy View';
    btn.onclick = () => viewMachine.send('ZOOM_TO_GALAXY');
  } else if (state === 'GALAXY') {
    btn.style.display = 'block';
    btn.textContent = '☀ Solar System';
    btn.onclick = () => viewMachine.send('ENTER_SOLAR_SYSTEM');
  } else if (state === 'OBJECT_DETAIL') {
    btn.style.display = 'block';
    btn.textContent = '← Back';
    btn.onclick = () => {
      if (selectedMachine) { selectedMachine.send('DESELECT'); selectedMachine = null; }
      hideInfoPanel();
      viewMachine.state = 'SOLAR_SYSTEM';
      updateNavBtn('SOLAR_SYSTEM');
      animMachine.send('PLAY');
      lerpCameraTo(CAM_SOLAR.pos.clone(), CAM_SOLAR.target.clone(), 0.8);
      document.getElementById('bottom-hud').classList.remove('hidden');
    };
  }
}

function updateHUDButtons() {
  ['btn-pause','btn-play','btn-fast'].forEach(id => document.getElementById(id).classList.remove('active'));
  if (animMachine.state === 'PAUSED') document.getElementById('btn-pause').classList.add('active');
  else if (animMachine.state === 'PLAYING') document.getElementById('btn-play').classList.add('active');
  else if (animMachine.state === 'FAST') document.getElementById('btn-fast').classList.add('active');
}