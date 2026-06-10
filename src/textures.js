'use strict';

// ══════════════════════════════════════════════
//  TEXTURE LOADING HELPERS
// ══════════════════════════════════════════════

function loadTexture(url, fallbackColor) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return; }
    textureLoader.load(url, tex => resolve(tex), undefined, () => resolve(null));
  });
}

function makeMaterial(tex, color, emissive, emissiveIntensity, isBasic) {
  if (isBasic) {
    return new THREE.MeshBasicMaterial({ map: tex || null, color: tex ? 0xffffff : color });
  }
  const mat = new THREE.MeshPhongMaterial({
    map: tex || null,
    color: tex ? 0xffffff : color,
    shininess: 8,
  });
  if (emissive !== undefined) {
    mat.emissive = new THREE.Color(emissive);
    mat.emissiveIntensity = emissiveIntensity || 0;
  }
  return mat;
}