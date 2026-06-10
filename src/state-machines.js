'use strict';

// ══════════════════════════════════════════════
//  STATE MACHINES
// ══════════════════════════════════════════════

/* Animation Machine */
const animMachine = {
  state: 'PLAYING',
  timeScale: 1,
  transitions: {
    PAUSED:  { PLAY: 'PLAYING' },
    PLAYING: { PAUSE: 'PAUSED', SPEED_UP: 'FAST' },
    FAST:    { SPEED_DOWN: 'PLAYING', PAUSE: 'PAUSED' },
  },
  send(event) {
    const next = this.transitions[this.state]?.[event];
    if (!next) return;
    this.state = next;
    if (next === 'PLAYING') this.timeScale = 1;
    else if (next === 'FAST') this.timeScale = 10;
    else if (next === 'PAUSED') this.timeScale = 0;
    updateHUDButtons();
  }
};

/* Object Machine factory */
function createObjectMachine(mesh, data, parentData) {
  const obj = {
    state: 'IDLE',
    mesh, data, parentData,
    transitions: {
      IDLE:     { MOUSE_ENTER: 'HOVERED' },
      HOVERED:  { MOUSE_LEAVE: 'IDLE', CLICK: 'SELECTED' },
      SELECTED: { DESELECT: 'IDLE', CLICK: 'SELECTED' },
    },
    send(event) {
      const next = this.transitions[this.state]?.[event];
      if (!next) return;
      this.state = next;
      this.onEnter(next);
    },
    onEnter(state) {
      const mat = this.mesh.material;
      if (state === 'IDLE') {
        if (mat.emissive) { mat.emissive.setHex(0x000000); mat.emissiveIntensity = 0; }
        hideTooltip();
        canvas.classList.remove('hovering');
      } else if (state === 'HOVERED') {
        if (mat.emissive) { mat.emissive.setHex(0xffffff); mat.emissiveIntensity = 0.3; }
        showTooltip(this.data.name, mouseX, mouseY);
        canvas.classList.add('hovering');
      } else if (state === 'SELECTED') {
        if (mat.emissive) { mat.emissive.setHex(0x88ccff); mat.emissiveIntensity = 0.6; }
        viewMachine.send('SELECT_OBJECT', { machine: this });
      }
    }
  };
  return obj;
}

/* View Machine */
const viewMachine = {
  state: 'SOLAR_SYSTEM',
  transitions: {
    GALAXY:        { ENTER_SOLAR_SYSTEM: 'SOLAR_SYSTEM' },
    SOLAR_SYSTEM:  { ZOOM_TO_GALAXY: 'GALAXY', SELECT_OBJECT: 'OBJECT_DETAIL' },
    OBJECT_DETAIL: { BACK: 'SOLAR_SYSTEM', SELECT_OBJECT: 'OBJECT_DETAIL' },
  },
  send(event, payload) {
    const next = this.transitions[this.state]?.[event];
    if (!next) return;
    this.state = next;
    this.onEnter(next, payload);
  },
  onEnter(state, payload) {
    updateNavBtn(state);
    if (state === 'GALAXY') {
      teardownSolarSystem();
      buildGalaxy();
      hideInfoPanel();
      document.getElementById('bottom-hud').classList.add('hidden');
    } else if (state === 'SOLAR_SYSTEM') {
      teardownGalaxy();
      if (!sceneGroup) buildSolarSystem();
      hideInfoPanel();
      document.getElementById('bottom-hud').classList.remove('hidden');
      animMachine.state = 'PLAYING'; animMachine.timeScale = 1;
      updateHUDButtons();
      lerpCameraTo(CAM_SOLAR.pos.clone(), CAM_SOLAR.target.clone(), 1.0);
    } else if (state === 'OBJECT_DETAIL') {
      // Deselect previous
      if (selectedMachine && selectedMachine !== payload.machine) {
        selectedMachine.send('DESELECT');
      }
      selectedMachine = payload.machine;
      detailTarget = { mesh: payload.machine.mesh, data: payload.machine.data };
      animMachine.send('PAUSE');
      showObjectDetail(detailTarget);
    }
  }
};