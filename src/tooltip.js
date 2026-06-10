'use strict';

// ══════════════════════════════════════════════
//  TOOLTIP
// ══════════════════════════════════════════════

function showTooltip(name, x, y) {
  const el = document.getElementById('tooltip');
  el.textContent = name;
  el.style.display = 'block';
  el.style.left = (x + 14) + 'px';
  el.style.top  = (y - 10) + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').style.display = 'none';
}