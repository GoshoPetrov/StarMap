# Star Map — App Specification
**Version 1.0 | Single-file HTML/CSS/JS application**

---

## 1. Overview

A 3D interactive star map built in a single HTML file using Three.js. The app has two primary scenes:

- **Galaxy View** — a full 3D Milky Way galaxy the user can rotate and zoom freely, with the solar system's position marked.
- **Solar System View** — the Sun, all 8 planets + Pluto, major moons, asteroid belt (particle field), and Saturn's rings, with animated orbits and a speed control HUD.

The user can transition between these scenes and zoom into any individual body (planet, moon, the Sun) to see an **Object Detail View** with a label and key facts.

---

## 2. Tech Stack

| Concern | Technology |
|---|---|
| Rendering | Three.js r128 (loaded from CDN) |
| Camera control | THREE.OrbitControls (from CDN) |
| Markup | Single `.html` file |
| Styling | Inline `<style>` block, dark space theme |
| Logic | Vanilla JavaScript ES6+ |
| Textures | NASA/public domain texture URLs (JPG/PNG via CDN or data URIs) |
| No build step | Everything runs by opening the `.html` file |

**CDN imports:**
```html


```

---

## 3. State Machines

### 3.1 View State Machine

Controls which scene is rendered. Only one view is active at a time.

```
States:   GALAXY | SOLAR_SYSTEM | OBJECT_DETAIL
```

```
Transitions:
  GALAXY          + ENTER_SOLAR_SYSTEM  → SOLAR_SYSTEM
  SOLAR_SYSTEM    + ZOOM_TO_GALAXY      → GALAXY
  SOLAR_SYSTEM    + SELECT_OBJECT       → OBJECT_DETAIL
  OBJECT_DETAIL   + BACK                → SOLAR_SYSTEM
  OBJECT_DETAIL   + SELECT_OBJECT       → OBJECT_DETAIL  (switch to another object)
```

**On state entry:**
- `GALAXY`: dispose solar system scene, build/show galaxy scene, hide solar system HUD
- `SOLAR_SYSTEM`: dispose galaxy scene, build/show solar system scene, show animation HUD
- `OBJECT_DETAIL`: freeze orbit animation, fly camera to target object, show info label overlay

**Implementation pattern:**
```js
const viewMachine = {
  state: 'SOLAR_SYSTEM',
  transitions: {
    GALAXY:         { ENTER_SOLAR_SYSTEM: 'SOLAR_SYSTEM' },
    SOLAR_SYSTEM:   { ZOOM_TO_GALAXY: 'GALAXY', SELECT_OBJECT: 'OBJECT_DETAIL' },
    OBJECT_DETAIL:  { BACK: 'SOLAR_SYSTEM', SELECT_OBJECT: 'OBJECT_DETAIL' },
  },
  send(event, payload) {
    const next = this.transitions[this.state]?.[event];
    if (!next) return;
    this.state = next;
    this.onEnter(next, payload);
  },
  onEnter(state, payload) { /* dispatch to scene builders */ }
};
```

### 3.2 Object State Machine

One instance per interactive 3D object (planets, moons, Sun).

```
States:   IDLE | HOVERED | SELECTED
```

```
Transitions:
  IDLE      + MOUSE_ENTER  → HOVERED
  HOVERED   + MOUSE_LEAVE  → IDLE
  HOVERED   + CLICK        → SELECTED
  SELECTED  + DESELECT     → IDLE
  SELECTED  + CLICK        → SELECTED  (re-enter, payload changes)
```

**On state entry:**
- `IDLE`: restore original material emissive to 0, hide tooltip
- `HOVERED`: set emissive glow (white, low intensity ~0.3), show tooltip (name only), cursor = pointer
- `SELECTED`: set emissive glow (higher intensity ~0.6), trigger viewMachine `SELECT_OBJECT`, show info panel

**Implementation pattern:**
```js
function createObjectMachine(object3D, data) {
  return {
    state: 'IDLE',
    transitions: {
      IDLE:     { MOUSE_ENTER: 'HOVERED' },
      HOVERED:  { MOUSE_LEAVE: 'IDLE', CLICK: 'SELECTED' },
      SELECTED: { DESELECT: 'IDLE', CLICK: 'SELECTED' },
    },
    send(event) { /* same pattern */ }
  };
}
```

### 3.3 Animation State Machine

Controls orbit animation playback.

```
States:   PAUSED | PLAYING | FAST
```

```
Transitions:
  PAUSED   + PLAY          → PLAYING
  PLAYING  + PAUSE         → PAUSED
  PLAYING  + SPEED_UP      → FAST
  FAST     + SPEED_DOWN    → PLAYING
  FAST     + PAUSE         → PAUSED
```

Speed multipliers:
- `PLAYING` → `timeScale = 1`
- `FAST` → `timeScale = 10`
- `PAUSED` → animation loop still runs (for camera movement), but `timeScale = 0`

---

## 4. Scene: Solar System

### 4.1 Coordinate System & Scale

Distances and sizes are **not** to real scale (real scale makes planets invisible). Use a logarithmic/compressed scale optimised for visual clarity:

- **Distance unit**: 1 Three.js unit ≈ 10 million km (compressed)
- **Size unit**: planet radii are exaggerated ~10–50× relative to distance
- The Sun sits at origin `(0, 0, 0)`
- All orbits are in the XZ plane (y=0), with slight inclinations per planet

### 4.2 Hardcoded Solar System Data

Store as a JS array in the source. Each object has:

```js
const SOLAR_SYSTEM = [
  {
    id: 'sun',
    name: 'The Sun',
    type: 'star',
    radius: 5,                   // Three.js units
    color: 0xFDB813,
    emissive: 0xFDB813,
    emissiveIntensity: 1.0,
    textureUrl: 'https://...sun.jpg',
    orbitRadius: 0,
    orbitPeriod: 0,              // Earth years
    axialTilt: 7.25,             // degrees
    facts: {
      diameter: '1,392,700 km',
      mass: '1.989 × 10³⁰ kg',
      surfaceTemp: '5,500 °C',
      type: 'G-type main-sequence star',
      funFact: 'The Sun contains 99.86% of the mass in the solar system.',
    }
  },
  {
    id: 'mercury', name: 'Mercury', type: 'planet',
    radius: 0.38, color: 0xB5B5B5,
    textureUrl: 'https://...mercury.jpg',
    orbitRadius: 8, orbitPeriod: 0.24, axialTilt: 0.03,
    facts: { diameter: '4,879 km', dayLength: '58.6 Earth days',
             distanceFromSun: '57.9M km', moons: 0,
             funFact: 'Mercury has no atmosphere and extreme temperature swings.' }
  },
  {
    id: 'venus', name: 'Venus', type: 'planet',
    radius: 0.95, color: 0xE8C56B,
    textureUrl: 'https://...venus.jpg',
    orbitRadius: 14, orbitPeriod: 0.62, axialTilt: 177.4,
    facts: { diameter: '12,104 km', dayLength: '243 Earth days',
             distanceFromSun: '108.2M km', moons: 0,
             funFact: 'Venus rotates backwards and has the hottest surface in the solar system.' }
  },
  {
    id: 'earth', name: 'Earth', type: 'planet',
    radius: 1.0, color: 0x2E6DB4,
    textureUrl: 'https://...earth.jpg',
    orbitRadius: 20, orbitPeriod: 1.0, axialTilt: 23.44,
    moons: [
      { id: 'moon', name: 'The Moon', radius: 0.27, color: 0xAAAAAA,
        textureUrl: 'https://...moon.jpg',
        orbitRadius: 2.5, orbitPeriod: 0.075,
        facts: { diameter: '3,474 km', distanceFromEarth: '384,400 km',
                 funFact: 'The Moon is slowly drifting away from Earth at ~3.8 cm/year.' } }
    ],
    facts: { diameter: '12,756 km', dayLength: '24 hours',
             distanceFromSun: '149.6M km', moons: 1,
             funFact: 'Earth is the only known planet with life.' }
  },
  {
    id: 'mars', name: 'Mars', type: 'planet',
    radius: 0.53, color: 0xC1440E,
    textureUrl: 'https://...mars.jpg',
    orbitRadius: 28, orbitPeriod: 1.88, axialTilt: 25.19,
    moons: [
      { id: 'phobos', name: 'Phobos', radius: 0.15, color: 0x8A7A6A,
        orbitRadius: 1.4, orbitPeriod: 0.009,
        facts: { diameter: '22.4 km', funFact: 'Phobos will crash into Mars in ~50 million years.' } },
      { id: 'deimos', name: 'Deimos', radius: 0.1, color: 0x9A8A7A,
        orbitRadius: 2.2, orbitPeriod: 0.034,
        facts: { diameter: '12.6 km', funFact: 'Deimos is one of the smallest known moons in the solar system.' } }
    ],
    facts: { diameter: '6,792 km', dayLength: '24.6 hours',
             distanceFromSun: '227.9M km', moons: 2,
             funFact: 'Mars has the tallest volcano in the solar system: Olympus Mons.' }
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'planet',
    radius: 3.5, color: 0xC88B3A,
    textureUrl: 'https://...jupiter.jpg',
    orbitRadius: 52, orbitPeriod: 11.86, axialTilt: 3.13,
    moons: [
      { id: 'io',       name: 'Io',       radius: 0.28, color: 0xFFFF00, orbitRadius: 5,   orbitPeriod: 0.0048,
        facts: { diameter: '3,643 km', funFact: 'Io is the most volcanically active body in the solar system.' } },
      { id: 'europa',   name: 'Europa',   radius: 0.24, color: 0xD4C8A8, orbitRadius: 6.5, orbitPeriod: 0.0097,
        facts: { diameter: '3,122 km', funFact: 'Europa likely has a liquid ocean beneath its icy surface.' } },
      { id: 'ganymede', name: 'Ganymede', radius: 0.41, color: 0x8899AA, orbitRadius: 8.5, orbitPeriod: 0.0196,
        facts: { diameter: '5,268 km', funFact: 'Ganymede is the largest moon in the solar system, bigger than Mercury.' } },
      { id: 'callisto', name: 'Callisto', radius: 0.37, color: 0x667788, orbitRadius: 11,  orbitPeriod: 0.0456,
        facts: { diameter: '4,821 km', funFact: 'Callisto has the most heavily cratered surface of any body in the solar system.' } }
    ],
    facts: { diameter: '142,984 km', dayLength: '9.9 hours',
             distanceFromSun: '778.5M km', moons: 95,
             funFact: 'The Great Red Spot is a storm larger than Earth that has raged for 350+ years.' }
  },
  {
    id: 'saturn', name: 'Saturn', type: 'planet',
    radius: 3.0, color: 0xEAD6A3,
    textureUrl: 'https://...saturn.jpg',
    rings: { innerRadius: 3.8, outerRadius: 6.5, color: 0xC8A96B, opacity: 0.7,
             textureUrl: 'https://...saturn_rings.png' },
    orbitRadius: 88, orbitPeriod: 29.46, axialTilt: 26.73,
    moons: [
      { id: 'titan', name: 'Titan', radius: 0.40, color: 0xE8A030, orbitRadius: 10, orbitPeriod: 0.0436,
        facts: { diameter: '5,151 km', funFact: 'Titan has a thick nitrogen atmosphere and lakes of liquid methane.' } },
      { id: 'enceladus', name: 'Enceladus', radius: 0.18, color: 0xEEEEEE, orbitRadius: 7, orbitPeriod: 0.0130,
        facts: { diameter: '504 km', funFact: 'Enceladus shoots geysers of water ice into space.' } }
    ],
    facts: { diameter: '120,536 km', dayLength: '10.7 hours',
             distanceFromSun: '1.43B km', moons: 146,
             funFact: 'Saturn is less dense than water — it would float if placed in a large enough ocean.' }
  },
  {
    id: 'uranus', name: 'Uranus', type: 'planet',
    radius: 2.0, color: 0x7DE8E8,
    textureUrl: 'https://...uranus.jpg',
    orbitRadius: 120, orbitPeriod: 84.01, axialTilt: 97.77,
    facts: { diameter: '51,118 km', dayLength: '17.2 hours',
             distanceFromSun: '2.87B km', moons: 28,
             funFact: 'Uranus rotates on its side — its axis is tilted nearly 98 degrees.' }
  },
  {
    id: 'neptune', name: 'Neptune', type: 'planet',
    radius: 1.9, color: 0x3F54BA,
    textureUrl: 'https://...neptune.jpg',
    orbitRadius: 152, orbitPeriod: 164.8, axialTilt: 28.32,
    moons: [
      { id: 'triton', name: 'Triton', radius: 0.21, color: 0xCCDDEE, orbitRadius: 4, orbitPeriod: 0.016,
        facts: { diameter: '2,707 km', funFact: 'Triton orbits Neptune backwards and will be torn apart in ~3.6B years.' } }
    ],
    facts: { diameter: '49,528 km', dayLength: '16.1 hours',
             distanceFromSun: '4.50B km', moons: 16,
             funFact: 'Neptune has the fastest winds in the solar system, up to 2,100 km/h.' }
  },
  {
    id: 'pluto', name: 'Pluto', type: 'dwarf_planet',
    radius: 0.18, color: 0xC4A882,
    orbitRadius: 190, orbitPeriod: 248.0, axialTilt: 122.53,
    orbitInclination: 17,
    facts: { diameter: '2,377 km', dayLength: '6.4 Earth days',
             distanceFromSun: '5.9B km (avg)', moons: 5,
             funFact: 'Pluto has a heart-shaped nitrogen ice plain called Tombaugh Regio.' }
  }
];

const ASTEROID_BELT = {
  innerRadius: 35,
  outerRadius: 48,
  count: 2000,
  color: 0x888888,
  sizeRange: [0.05, 0.2],
};
```

### 4.3 Orbit Rendering

- Each planet's orbit path is rendered as a `THREE.Line` using `THREE.EllipseCurve` (circular for simplicity, slight inclination per planet via rotation).
- Orbit lines: thin, semi-transparent white (`opacity: 0.15`), always visible.
- Planet position at time `t`: `x = orbitRadius * cos(angle)`, `z = orbitRadius * sin(angle)` where `angle = (elapsed * timeScale) / orbitPeriod`.
- Moons orbit their parent body using the same formula, with position offset by parent's world position.

### 4.4 Saturn's Rings

- Rendered as `THREE.RingGeometry(innerRadius, outerRadius, 64)`.
- Rotated 90° around X axis to lie flat.
- Material: `THREE.MeshBasicMaterial` with ring texture and `side: THREE.DoubleSide`, `transparent: true`, `opacity: 0.7`.

### 4.5 Asteroid Belt

- Rendered as `THREE.Points` with `THREE.BufferGeometry`.
- 2000 points randomly distributed in a torus region between `innerRadius` and `outerRadius`, random Y offset ±0.5 for thickness.
- Slow collective rotation around Y axis.

### 4.6 Lighting

- `THREE.PointLight` at Sun's position: color `0xFFFFEE`, intensity `2.0`, distance `500`.
- `THREE.AmbientLight`: color `0x111111` (very dim, so dark sides of planets are not pitch black).
- Sun mesh itself: `THREE.MeshBasicMaterial` (unaffected by lighting, always fully bright).

### 4.7 Planet Materials

- All planets: `THREE.MeshPhongMaterial` with loaded texture map.
- Fallback (if texture fails to load): solid `color` from data object.
- Emissive glow on hover/select via `material.emissive` and `material.emissiveIntensity`.

---

## 5. Scene: Galaxy View

### 5.1 Structure

A full 3D Milky Way rendered as layered particle systems:

| Layer | Description | Particle count | Color |
|---|---|---|---|
| Galactic core | Dense bright center | 20,000 | `0xFFEECC` warm yellow-white |
| Spiral arms (×4) | Logarithmic spiral distribution | 80,000 total | `0xAABBFF` blue-white |
| Galactic disk haze | Diffuse disk around arms | 30,000 | `0x334466` dim blue |
| Star field (background) | Distant stars, full sphere | 10,000 | `0xFFFFFF` white |

### 5.2 Solar System Marker

- A pulsing glowing sphere at the solar system's approximate position in the Orion Arm (~26,000 light-years from galactic center, rendered ~60 units from galaxy origin).
- Label: "Solar System" rendered as an HTML overlay (CSS `position: absolute`) positioned via Three.js `Vector3.project()`.
- Clicking the marker triggers `viewMachine.send('ENTER_SOLAR_SYSTEM')`.

### 5.3 Camera

- OrbitControls enabled, no distance limits (user can freely zoom/rotate).
- Initial camera position: top-down slightly tilted view showing the full galaxy.
- `autoRotate: false` (user controls rotation).

---

## 6. Scene: Object Detail View

### 6.1 Behaviour

- Triggered when `viewMachine.state === 'OBJECT_DETAIL'`.
- Camera smoothly animates (TWEEN or manual lerp) to a position ~3× the object's radius away.
- Orbit animation pauses (`animationMachine.send('PAUSE')`).
- The object slowly auto-rotates on its Y axis for visual appeal.
- All other objects fade out (opacity → 0.1 via material transparency).

### 6.2 Info Label

- HTML overlay div positioned in the top-left corner (not as a 3D sprite).
- Contents:
  - Object name (large, white)
  - Type (planet / dwarf planet / moon / star)
  - Up to 4 fact key-value pairs from the `facts` object
  - "← Back" button

---

## 7. UI / HUD

### 7.1 Layout

```
┌──────────────────────────────────────────────┐
│  [☆ STAR MAP]              [🌌 Galaxy View]  │  ← top bar
│                                              │
│                                              │
│           THREE.js canvas                   │
│                                              │
│                                              │
│  ┌──────────────────────────┐               │
│  │ ⏸ Pause  ▶ Play  ⏩ Fast │               │  ← bottom HUD (solar system only)
│  └──────────────────────────┘               │
│                              [+]  [-]  [⟳]  │  ← zoom controls (bottom right)
└──────────────────────────────────────────────┘
```

### 7.2 Top Bar

- App title: "★ STAR MAP" (left)
- **"Galaxy View" button** (right): visible only in `SOLAR_SYSTEM` state → sends `ZOOM_TO_GALAXY`
- **"Solar System" button** (right): visible only in `GALAXY` state → sends `ENTER_SOLAR_SYSTEM`
- **"← Back" button** (right): visible only in `OBJECT_DETAIL` state → sends `BACK`

### 7.3 Animation Controls (Solar System only)

Three buttons mapped to animationMachine:
- `⏸ Pause` → `animationMachine.send('PAUSE')`
- `▶ Play` → `animationMachine.send('PLAY')`
- `⏩ Fast` → `animationMachine.send('SPEED_UP')`

Active state button is highlighted.

### 7.4 Zoom Controls

- `[+]` — programmatically moves camera closer along its current direction
- `[-]` — moves camera further
- `[⟳]` — resets camera to default position for current view

### 7.5 Tooltip

- Small HTML overlay following mouse cursor.
- Shown when an object is in `HOVERED` state.
- Content: object name only.
- Style: dark semi-transparent background, white text, no border.

### 7.6 Styling

- Background: `#000008` (near black with very slight blue tint)
- Font: `'Courier New', monospace` (sci-fi feel)
- All HUD elements: semi-transparent dark backgrounds (`rgba(0,0,10,0.7)`), white text, subtle border `1px solid rgba(100,150,255,0.3)`
- Buttons: no background by default, white border on hover, blue glow (`box-shadow`) on active state

---

## 8. Interaction Model

### 8.1 Mouse

| Action | Result |
|---|---|
| Mouse over planet/moon/sun | Object → `HOVERED`, show tooltip |
| Mouse out | Object → `IDLE`, hide tooltip |
| Click planet/moon/sun | Object → `SELECTED`, viewMachine → `OBJECT_DETAIL` |
| Scroll wheel | Zoom in/out (OrbitControls) |
| Click + drag | Rotate camera (OrbitControls) |
| Click solar system marker (galaxy view) | viewMachine → `SOLAR_SYSTEM` |
| Click empty space | Deselect current object if any |

### 8.2 Raycasting

- Use `THREE.Raycaster` on `mousemove` and `click` events.
- Maintain a flat array `interactableObjects` of all meshes that have an associated `objectMachine`.
- On each `mousemove`: raycast against `interactableObjects`, update hover states.
- On `click`: trigger selection on the first intersected object.

---

## 9. File Structure

The entire app is a **single HTML file**:

```
starmap.html
├── <head>
│   ├── CDN scripts (Three.js, OrbitControls)
│   └── <style> block (all CSS)
└── <body>
    ├── <canvas id="three-canvas">
    ├── <div id="hud"> (top bar, animation controls, zoom buttons)
    ├── <div id="tooltip">
    ├── <div id="info-panel"> (object detail overlay)
    └── <script>
        ├── DATA: SOLAR_SYSTEM array, ASTEROID_BELT config, GALAXY config
        ├── STATE MACHINES: viewMachine, animationMachine, createObjectMachine()
        ├── SCENE BUILDERS: buildSolarSystem(), buildGalaxy(), teardown()
        ├── ANIMATION LOOP: animate() with requestAnimationFrame
        ├── RAYCASTER: setupRaycasting()
        ├── HUD: setupHUD(), updateHUD()
        └── INIT: init()
```

---

## 10. Performance Guidelines

- Use `THREE.Points` (not individual meshes) for asteroid belt and galaxy particles.
- Dispose of geometries, materials, and textures when switching scenes (`scene.clear()` + `.dispose()`).
- Textures: load with `THREE.TextureLoader`, use `.jpg` where possible (smaller than `.png`).
- Orbit lines: reuse `THREE.BufferGeometry`, update positions instead of recreating.
- Cap raycasting to run on `requestAnimationFrame`, not raw `mousemove` (debounce via flag).
- Target: 60fps on a mid-range laptop GPU.

---

## 11. Texture URL Sources

Use publicly accessible NASA/space textures.
```
Exmple resources NASA-3D-Resources: https://github.com/nasa/NASA-3D-Resources
```

For other planets, use:
```
https://www.solarsystemscope.com/textures/
```
(free for non-commercial, direct URL linking permitted)

If textures fail to load, fall back gracefully to solid `MeshPhongMaterial` with the `color` value defined in the data.

---

## 12. Known Simplifications (Intentional)

| Real astronomy | App simplification | Reason |
|---|---|---|
| Elliptical orbits | Circular orbits | Visual clarity |
| True to-scale distances | Logarithmically compressed | Planets would be invisible otherwise |
| True to-scale sizes | Sizes exaggerated 10–50× | Visibility |
| Real orbital inclinations | Minor Y offsets only | Avoids clutter |
| 146 Saturn moons | 2 moons (Titan, Enceladus) | Performance + clarity |
| Pluto's eccentric orbit | Circular orbit in XZ plane | Simplicity |

---

*End of specification.*