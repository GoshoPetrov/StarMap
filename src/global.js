'use strict';

// ══════════════════════════════════════════════
//  GLOBAL STATE
// ══════════════════════════════════════════════

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000008, 1);

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.01, 10000);
const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1;
controls.maxDistance = 2000;

const textureLoader = new THREE.TextureLoader();

let solarSystemObjects   = [];  // {mesh, data, machine, parentData?}
let orbitLines           = [];
let galaxyObjects        = [];
let asteroidBelt         = null;
let galaxyMarkerMesh     = null;
let sceneGroup           = null;
let elapsed              = 0;
let rafId                = null;
let mouseMoved           = false;
let mouseX               = 0, mouseY = 0;
let raycasterDirty       = false;
const raycaster          = new THREE.Raycaster();
const mouseVec           = new THREE.Vector2();
let currentHoveredMachine = null;
let selectedMachine       = null;
let detailTarget          = null; // {mesh, data}
let cameraTargetPos       = null;
let cameraLerpActive      = false;

// Default camera positions
const CAM_SOLAR  = { pos: new THREE.Vector3(0, 80, 160), target: new THREE.Vector3(0,0,0) };
const CAM_GALAXY = { pos: new THREE.Vector3(0, 220, 80), target: new THREE.Vector3(0,0,0) };