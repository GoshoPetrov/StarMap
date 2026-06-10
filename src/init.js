'use strict';

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════

async function init() {
  const loadingBar  = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');

  loadingText.textContent = 'Calibrating orbital mechanics...';
  loadingBar.style.width = '20%';

  updateNavBtn('SOLAR_SYSTEM');
  updateHUDButtons();

  loadingBar.style.width = '40%';
  loadingText.textContent = 'Loading stellar textures...';

  await buildSolarSystem();

  loadingBar.style.width = '90%';
  loadingText.textContent = 'Aligning star charts...';

  document.getElementById('bottom-hud').classList.remove('hidden');

  await new Promise(r => setTimeout(r, 300));
  loadingBar.style.width = '100%';

  setTimeout(() => {
    const loading = document.getElementById('loading');
    loading.classList.add('fade-out');
    setTimeout(() => loading.remove(), 900);
  }, 400);

  animate();
}

init();