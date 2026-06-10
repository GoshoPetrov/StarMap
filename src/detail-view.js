'use strict';

// ══════════════════════════════════════════════
//  OBJECT DETAIL VIEW
// ══════════════════════════════════════════════

function showObjectDetail(target) {
  const { mesh, data } = target;
  const wp = new THREE.Vector3();
  mesh.getWorldPosition(wp);
  const dist = data.radius * 4.5 + 2;
  const camPos = wp.clone().add(new THREE.Vector3(dist*0.7, dist*0.4, dist));
  lerpCameraTo(camPos, wp, 0.8);
  showInfoPanel(data);
}

function showInfoPanel(data) {
  const panel = document.getElementById('info-panel');
  const facts = data.facts || {};
  const funFact = facts.funFact || '';
  const entries = Object.entries(facts).filter(([k]) => k !== 'funFact').slice(0, 4);
  panel.innerHTML = `
    <div class="obj-name">${data.name}</div>
    <div class="obj-type">${data.type || 'celestial body'}</div>
    <div class="separator"></div>
    ${entries.map(([k,v]) => `<div class="fact-row"><span class="fact-key">${k}</span><span class="fact-val">${v}</span></div>`).join('')}
    ${funFact ? `<div class="fun-fact">${funFact}</div>` : ''}
  `;
  panel.classList.add('visible');
}

function hideInfoPanel() {
  document.getElementById('info-panel').classList.remove('visible');
  document.getElementById('info-panel').innerHTML = '';
}