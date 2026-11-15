import * as THREE from 'three';

const canvas = document.querySelector('#game');
const ui = {
  clockText: document.querySelector('#clockText'),
  timeToggle: document.querySelector('#timeToggle'),
  soundToggle: document.querySelector('#soundToggle'),
  pauseButton: document.querySelector('#pauseButton'),
  missionProgress: document.querySelector('#missionProgress'),
  missionCount: document.querySelector('#missionCount'),
  vehicleState: document.querySelector('#vehicleState'),
  speedValue: document.querySelector('#speedValue'),
  engineBar: document.querySelector('#engineBar'),
  engineValue: document.querySelector('#engineValue'),
  boostBar: document.querySelector('#boostBar'),
  boostValue: document.querySelector('#boostValue'),
  chargeValue: document.querySelector('#chargeValue'),
  healthBar: document.querySelector('#healthBar'),
  healthValue: document.querySelector('#healthValue'),
  mapHeading: document.querySelector('#mapHeading'),
  mapCanvas: document.querySelector('#mapCanvas'),
  helpPill: document.querySelector('#helpPill'),
  dismissHelp: document.querySelector('#dismissHelp'),
  pauseOverlay: document.querySelector('#pauseOverlay'),
  resumeButton: document.querySelector('#resumeButton'),
  loading: document.querySelector('#loading'),
  toast: document.querySelector('#toast'),
  toastFeed: document.querySelector('#toastFeed'),
  bossBanner: document.querySelector('#bossBanner'),
  bossHealth: document.querySelector('#bossHealth'),
  damageFlash: document.querySelector('#damageFlash'),
  fireTouch: document.querySelector('#fireTouch'),
  driveTouch: document.querySelector('#driveTouch'),
  enterTouch: document.querySelector('#enterTouch'),
  boostTouch: document.querySelector('#boostTouch'),
  mobileControls: document.querySelector('#mobileControls'),
  stickZone: document.querySelector('#stickZone'),
  stickKnob: document.querySelector('#stickKnob'),
  crosshair: document.querySelector('#crosshair'),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ac4c6);
scene.fog = new THREE.Fog(0x9ac4c6, 90, 260);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 420);
camera.position.set(0, 8, 16);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth, innerHeight);
// Keep the low-poly city responsive on integrated graphics and mobile devices.
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const mat = (color, roughness = 0.78, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const mats = {
  road: mat(0x424a48), roadLine: mat(0xd7c9a9), sidewalk: mat(0xb8b8a4), curb: mat(0x827f72),
  grass: mat(0x7d9676), water: new THREE.MeshStandardMaterial({ color: 0x328c98, roughness: 0.27, metalness: 0.18 }),
  building: [0xc1ad92, 0xb5b7a9, 0x899e9b, 0xc0a28c, 0xaab3aa, 0x888c85, 0xc5c0ae].map((c) => mat(c)),
  window: new THREE.MeshStandardMaterial({ color: 0x263e42, roughness: 0.3, metalness: 0.3 }),
  windowLit: new THREE.MeshStandardMaterial({ color: 0xffd697, emissive: 0xd08b41, emissiveIntensity: 0.3, roughness: 0.4 }),
  trim: mat(0xddd0b6, 0.65), dark: mat(0x202c2e, 0.45, 0.4), tire: mat(0x15191a, 0.94),
  leaf: [0x638d76, 0x79977d, 0x577d70, 0x98a17b].map((c) => mat(c)), trunk: mat(0x765d46),
  white: mat(0xe4ddca, 0.32, 0.18), gold: mat(0xe0b676, 0.34, 0.45), red: mat(0xd66d58, 0.4, 0.25),
  enemy: new THREE.MeshStandardMaterial({ color: 0x912f36, emissive: 0x651c24, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.25 }),
  enemyGlow: new THREE.MeshBasicMaterial({ color: 0xff725e }), pulse: new THREE.MeshBasicMaterial({ color: 0x8fffea }),
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1), sphereGeo = new THREE.SphereGeometry(1, 12, 10), cylGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
function box(parent, x, y, z, sx, sy, sz, material, cast = false, receive = false) {
  const m = new THREE.Mesh(boxGeo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}
function sphere(parent, x, y, z, sx, sy, sz, material) {
  const m = new THREE.Mesh(sphereGeo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  parent.add(m);
  return m;
}
function cyl(parent, x, y, z, rt, rb, h, material, segments = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function group(parent = scene) {
  const g = new THREE.Group();
  parent.add(g);
  return g;
}

const hemi = new THREE.HemisphereLight(0xd9eeea, 0x68735e, 2.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2b9, 3.0);
sun.position.set(-65, 105, 44);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -115;
sun.shadow.camera.right = 115;
sun.shadow.camera.top = 115;
sun.shadow.camera.bottom = -115;
sun.shadow.bias = -0.00015;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x83aeb1, 0.85);
fill.position.set(45, 35, -80);
scene.add(fill);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), mat(0x879a7f));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;
ground.receiveShadow = true;
scene.add(ground);

const city = group();
for (let i = -3; i <= 3; i++) {
  const p = i * 48;
  const roadV = box(city, p, 0.005, 0, 12, 0.06, 310, mats.road);
  roadV.receiveShadow = true;
  const roadH = box(city, 0, 0.006, p, 310, 0.06, 12, mats.road);
  roadH.receiveShadow = true;
  for (const s of [-1, 1]) {
    box(city, p + s * 4.85, 0.04, 0, 0.13, 0.04, 310, mats.roadLine);
    box(city, 0, 0.04, p + s * 4.85, 310, 0.04, 0.13, mats.roadLine);
  }
  for (let n = -3; n <= 3; n++) {
    const z = n * 48;
    if (p === 0) {
      for (let q = -1; q <= 1; q++) box(city, p + q * 2.7, 0.05, z, 1.15, 0.04, 5.4, mats.roadLine);
    }
    if (z === 0) {
      for (let q = -1; q <= 1; q++) box(city, p + q * 2.7, 0.05, z, 1.15, 0.04, 5.4, mats.roadLine);
    }
  }
}
const river = box(city, 0, -0.55, -88, 320, 0.4, 26, mats.water);
river.receiveShadow = true;
box(city, 0, -0.31, -74.7, 320, 0.5, 0.65, mats.curb);
box(city, 0, -0.31, -101.3, 320, 0.5, 0.65, mats.curb);
box(city, 0, 0.02, -88, 17, 0.4, 18, mat(0x817d6e));
for (let x = -7; x <= 7; x += 3.5) box(city, x, 0.25, -88, 0.12, 0.48, 18, mats.trim);
for (let z = -2; z <= 2; z++) {
  for (let x = -7; x <= 7; x += 3.5) box(city, x, 0.52, -88, 0.12, 0.08, 0.14, mats.gold);
}
for (let i = -3; i <= 3; i++) {
  for (let j = -3; j <= 3; j++) {
    const cx = i * 48 + 24, cz = j * 48 + 24;
    if (Math.abs(cx) > 150 || Math.abs(cz) > 150 || Math.abs(cz + 88) < 18) continue;
    const plaza = box(city, cx, -0.005, cz, 34, 0.08, 34, mats.sidewalk);
    plaza.receiveShadow = true;
    box(city, cx, 0.035, cz, 29, 0.035, 29, mats.grass);
  }
}
function addBuilding(x, z, w, d, h, seed) {
  const g = group(city);
  g.position.set(x, 0, z);
  const palette = mats.building[(seed * 7 + Math.floor(x + z + 200)) % mats.building.length];
  box(g, 0, h / 2, 0, w, h, d, palette, true, true);
  box(g, 0, 0.75, 0, w + 0.55, 1.5, d + 0.55, mats.trim);
  box(g, 0, h + 0.16, 0, w + 1, 0.32, d + 1, mats.trim, true);
  const rows = Math.max(2, Math.floor((h - 2.8) / 3.4)), cols = Math.max(2, Math.floor(w / 4.2));
  const winMat = seed % 4 === 0 ? mats.windowLit : mats.window;
  for (let r = 0; r < rows; r++) {
    const y = 2.2 + r * 3.35;
    if (y > h - 1.6) continue;
    for (let c = 0; c < cols; c++) {
      const xx = -w / 2 + 2.1 + c * ((w - 2.1) / cols);
      box(g, xx, y, -d / 2 - 0.025, 1.12, 1.75, 0.06, winMat);
      box(g, xx, y, d / 2 + 0.025, 1.12, 1.75, 0.06, winMat);
    }
    const sideCols = Math.max(2, Math.floor(d / 5));
    for (let c = 0; c < sideCols; c++) {
      const zz = -d / 2 + 2.5 + c * ((d - 2.5) / sideCols);
      box(g, -w / 2 - 0.025, y, zz, 0.06, 1.75, 1.15, winMat);
      box(g, w / 2 + 0.025, y, zz, 0.06, 1.75, 1.15, winMat);
    }
  }
  box(g, 0, h + 0.43, 0, w * 0.35, 0.52, d * 0.35, mat(0x697b77));
  for (let k = 0; k < 2; k++) box(g, -w * 0.22 + k * w * 0.4, h + 0.62, d * 0.21, 0.9, 0.45, 1.1, mats.dark);
  if (seed % 3 === 0) box(g, 0, h * 0.61, -d / 2 - 0.07, w * 0.6, 0.38, 0.16, mats.gold);
  return g;
}
let bSeed = 0;
for (let i = -3; i <= 3; i++) {
  for (let j = -3; j <= 3; j++) {
    const x = i * 48 + 24, z = j * 48 + 24;
    if (Math.abs(x) > 145 || Math.abs(z) > 145 || Math.abs(z + 88) < 20) continue;
    const h = 10 + ((i * 17 + j * 31 + 88) % 5 + 5) % 5 * 3.7;
    addBuilding(x, z, 24 + ((i + j + 14) % 3) * 2.1, 24 + ((i * 2 + j + 17) % 3) * 2.2, h, bSeed++);
  }
}
const street = group();
for (let i = -3; i <= 3; i++) {
  for (let j = -3; j <= 3; j++) {
    const x = i * 48, z = j * 48;
    for (const side of [-1, 1]) {
      for (const axis of [0, 1]) {
        const tx = axis === 0 ? x + side * 9.5 : x + 19, tz = axis === 0 ? z + 19 : z + side * 9.5;
        if (Math.abs(tz + 88) < 20) continue;
        const g = group(street);
        g.position.set(tx, 0, tz);
        cyl(g, 0, 3.0, 0, 0.12, 0.18, 6.0, mats.dark, 8);
        const arm = box(g, 0.65, 5.85, 0, 1.35, 0.1, 0.1, mats.dark);
        arm.rotation.z = -0.12;
        const lamp = sphere(g, 1.24, 5.7, 0, 0.18, 0.12, 0.18, mats.gold);
        const pl = new THREE.PointLight(0xffd29a, 0.55, 13);
        pl.position.set(1.2, 5.2, 0);
        g.add(pl);
      }
    }
  }
}
function addTree(x, z, scale = 1) {
  const g = group(city);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  cyl(g, 0, 1.25, 0, 0.27, 0.39, 2.5, mats.trunk, 8);
  for (const [xx, yy, zz, r] of [[0, 3, 0, 1.55], [-0.65, 2.75, 0.15, 1.02], [0.7, 2.85, -0.12, 1.08], [0.1, 3.8, 0.1, 0.9]]) {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mats.leaf[(Math.abs(Math.floor(x + z + xx * 3)) % 4)]);
    crown.position.set(xx, yy, zz);
    crown.castShadow = true;
    g.add(crown);
  }
}
for (let i = -3; i <= 3; i++) {
  for (let j = -3; j <= 3; j++) {
    const x = i * 48, z = j * 48;
    if (Math.abs(x) > 140 || Math.abs(z) > 140) continue;
    for (const side of [-1, 1]) {
      addTree(x + side * 14, z + 14, 0.8 + ((i + j + 12) % 3) * 0.1);
      addTree(x + 14, z - side * 14, 0.8 + ((i * 2 + j + 12) % 3) * 0.1);
    }
  }
}
for (const side of [-1, 1]) {
  box(city, 0, 0.75, -88 + side * 8.4, 17, 0.12, 0.16, mats.dark);
  for (let x = -8; x <= 8; x += 2) box(city, x, 0.48, -88 + side * 8.4, 0.11, 0.58, 0.11, mats.dark);
}
for (let i = 0; i < 34; i++) {
  const ripple = new THREE.Mesh(new THREE.CircleGeometry(0.15 + (i % 3) * 0.12, 12), new THREE.MeshBasicMaterial({ color: 0x9de0d1, transparent: true, opacity: 0.25 }));
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(-150 + i * 9.1, -0.31, -98 + (i % 5) * 4.7);
  scene.add(ripple);
}

const traffic = [];
const carColors = [0xd5b98f, 0x718c89, 0xe0ddd1, 0x6d807e, 0xb37c63, 0x4e6470];
function makeCar(color = 0x203a43, hero = false) {
  const g = group();
  g.userData.hero = hero;
  const body = mat(color, 0.3, 0.38), glass = new THREE.MeshStandardMaterial({ color: 0x29434a, roughness: 0.18, metalness: 0.38 }), rubber = mats.tire;
  box(g, 0, 0.62, 0, 2.22, 0.62, 4.35, body, true, true);
  box(g, 0, 1.05, -0.28, 1.86, 0.64, 2.25, body, true);
  box(g, 0, 1.16, -0.31, 1.72, 0.49, 2.08, glass);
  box(g, 0, 1.4, -1.03, 1.65, 0.08, 0.09, mats.gold);
  box(g, -0.83, 0.56, -2.16, 0.35, 0.2, 0.08, mats.white);
  box(g, 0.83, 0.56, -2.16, 0.35, 0.2, 0.08, mats.white);
  box(g, -0.82, 0.57, 2.18, 0.38, 0.22, 0.07, mats.red);
  box(g, 0.82, 0.57, 2.18, 0.38, 0.22, 0.07, mats.red);
  box(g, 0, 0.32, 0, 1.9, 0.13, 3.85, mats.dark);
  const wheels = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wh = cyl(g, sx * 1.1, 0.43, sz * 1.38, 0.39, 0.39, 0.24, rubber, 14);
      wh.rotation.z = Math.PI / 2;
      wheels.push(wh);
      const hub = cyl(g, sx * 1.235, 0.43, sz * 1.38, 0.2, 0.2, 0.025, mats.gold, 12);
      hub.rotation.z = Math.PI / 2;
    }
  }
  const head1 = new THREE.PointLight(0xe4f6db, 0.6, 13);
  head1.position.set(-0.7, 0.7, -2.1);
  g.add(head1);
  const head2 = new THREE.PointLight(0xe4f6db, 0.6, 13);
  head2.position.set(0.7, 0.7, -2.1);
  g.add(head2);
  g.userData.wheels = wheels;
  g.userData.body = body;
  g.userData.lights = [head1, head2];
  return g;
}
const playerCar = makeCar(0x213f49, true);
playerCar.position.set(0, 0, 2);
scene.add(playerCar);
for (let n = 0; n < 18; n++) {
  const axis = n % 2, lane = n % 4 < 2 ? -2.5 : 2.5, road = Math.floor(n / 4) * 48 - 96;
  const c = makeCar(carColors[n % carColors.length]);
  if (axis === 0) {
    c.position.set(road + lane, 0, -130 + (n * 31) % 260);
    c.rotation.y = n % 2 ? Math.PI : 0;
  } else {
    c.position.set(-130 + (n * 37) % 260, 0, road + lane);
    c.rotation.y = Math.PI / 2;
  }
  scene.add(c);
  traffic.push(c);
}

const agent = group();
const skin = mat(0xb7805d), suit = mat(0x3e5554), suitLight = mat(0x9aa78f), gunMat = mat(0x18272a, 0.32, 0.5);
const torso = box(agent, 0, 1.05, 0, 0.64, 0.8, 0.36, suit, true);
box(agent, 0, 1.43, 0, 0.43, 0.15, 0.4, suitLight);
sphere(agent, 0, 1.72, 0, 0.25, 0.27, 0.24, skin);
box(agent, 0, 1.8, -0.01, 0.5, 0.09, 0.48, mat(0x293d3d));
for (const sx of [-1, 1]) {
  cyl(agent, sx * 0.19, 0.48, 0, 0.14, 0.12, 0.55, mat(0x26383a));
  const arm = cyl(agent, sx * 0.42, 1.03, 0, 0.12, 0.1, 0.54, suit);
  arm.rotation.z = sx * 0.15;
}
box(agent, 0.34, 1.12, -0.28, 0.13, 0.1, 0.38, gunMat);
agent.visible = false;
scene.add(agent);

const pets = [];
function makePet(x, z, type) {
  const g = group();
  g.position.set(x, 0, z);
  g.userData.phase = Math.random() * 6.28;
  g.userData.type = type;
  const fur = mat(type === 'DOG' ? 0xb98e62 : 0xd3c5a2), darkFur = mat(type === 'DOG' ? 0x493b32 : 0x807567);
  box(g, 0, 0.36, 0, 0.72, 0.4, 1.05, fur, true);
  sphere(g, 0, 0.64, -0.42, 0.3, 0.27, 0.31, fur);
  for (const sx of [-1, 1]) {
    box(g, sx * 0.2, 0.87, -0.48, 0.1, 0.32, 0.12, darkFur);
    cyl(g, sx * 0.22, 0.13, -0.28, 0.07, 0.07, 0.27, darkFur, 8);
  }
  box(g, 0, 0.64, -0.7, 0.08, 0.08, 0.22, mat(0x4c3430));
  if (type === 'CAT') box(g, 0, 0.72, -0.15, 0.12, 0.12, 0.64, fur);
  scene.add(g);
  pets.push(g);
}
makePet(-11, -17, 'DOG');
makePet(16, 12, 'CAT');
makePet(37, 34, 'DOG');
makePet(-44, 22, 'CAT');
makePet(56, -48, 'DOG');

const keys = {};
const touchKeys = { w: false, a: false, s: false, d: false };
let touchBoost = false;

function updateTouchStick(event) {
  const rect = ui.stickZone.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radius = (rect.width - 26 - 48) / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > radius ? radius / distance : 1;
  const x = dx * scale;
  const y = dy * scale;
  ui.stickKnob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  touchKeys.a = x < -radius * 0.2;
  touchKeys.d = x > radius * 0.2;
  touchKeys.w = y < -radius * 0.2;
  touchKeys.s = y > radius * 0.2;
}

function releaseTouchStick() {
  for (const key of Object.keys(touchKeys)) touchKeys[key] = false;
  ui.stickKnob.style.transform = 'translate(-50%, -50%)';
}

ui.stickZone.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  ui.stickZone.setPointerCapture(event.pointerId);
  updateTouchStick(event);
});
ui.stickZone.addEventListener('pointermove', (event) => {
  if (ui.stickZone.hasPointerCapture(event.pointerId)) updateTouchStick(event);
});
ui.stickZone.addEventListener('pointerup', releaseTouchStick);
ui.stickZone.addEventListener('pointercancel', releaseTouchStick);
ui.boostTouch.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  touchBoost = true;
  ui.boostTouch.setPointerCapture(event.pointerId);
});
ui.boostTouch.addEventListener('pointerup', () => { touchBoost = false; });
ui.boostTouch.addEventListener('pointercancel', () => { touchBoost = false; });
window.addEventListener('blur', () => {
  releaseTouchStick();
  touchBoost = false;
});

window.addEventListener('keydown', (event) => {
  keys[event.key.toLowerCase()] = true;
  if (event.key === ' ') {
    event.preventDefault();
    firePulse();
  }
  if (event.key.toLowerCase() === 'e') {
    toggleVehicleMode();
  }
  if (event.key === 'Escape') {
    setPaused(!state.paused);
  }
  if (event.key === 'Shift') keys.shift = true;
});
window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
  if (event.key === 'Shift') keys.shift = false;
});

const state = {
  paused: false,
  loaded: false,
  kills: 0,
  missionTarget: 8,
  startTime: performance.now(),
  flashTimer: 0,
  alertTimer: 0,
  day: true,
  audio: true,
  lastMessage: '',
};

const player = {
  health: 100,
  engine: 100,
  boost: 100,
  charge: 82,
  speed: 0,
  heading: 0,
  fireCooldown: 0,
  mode: 'car',
  hitTimer: 0,
  drift: 0,
};

const enemyCars = [];
const threatSpawns = [
  [-110, -30], [-84, 68], [-24, 134], [48, 122], [112, 48], [73, -84], [20, -134], [-90, -134], [0, -20],
];

function spawnEnemy(x, z, boss = false) {
  const car = makeCar(boss ? 0x6b1f2c : 0x912f36);
  car.position.set(x, 0, z);
  car.rotation.y = Math.random() * Math.PI * 2;
  car.userData.enemy = true;
  car.userData.type = boss ? 'boss' : 'threat';
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), mats.enemyGlow);
  glow.scale.set(1.4, 0.9, 1.4);
  glow.position.set(0, 1.5, 0);
  car.add(glow);
  car.userData.glow = glow;
  scene.add(car);
  const threat = {
    mesh: car,
    alive: true,
    hp: boss ? 140 : 48,
    maxHp: boss ? 140 : 48,
    speed: boss ? 18 : 12,
    strafe: Math.random() * Math.PI * 2,
    attackCooldown: 0,
    boss,
  };
  enemyCars.push(threat);
  return threat;
}

for (let i = 0; i < threatSpawns.length; i++) {
  const [x, z] = threatSpawns[i];
  spawnEnemy(x, z, i === threatSpawns.length - 1);
}

const missionGoal = ui.missionCount.textContent || '0 / 8';
function showToast(title, detail = '') {
  const message = title;
  ui.toast.innerHTML = `<span>✦</span><b>${title}</b><small>${detail || 'Nice work, agent.'}</small>`;
  ui.toast.classList.add('active');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => ui.toast.classList.remove('active'), 1500);
}
function showGlobalToast(text) {
  const item = document.createElement('div');
  item.className = 'toast-item';
  item.textContent = text;
  ui.toastFeed.appendChild(item);
  setTimeout(() => item.remove(), 1800);
}

function setPaused(nextState) {
  state.paused = nextState;
  ui.pauseOverlay.classList.toggle('show', nextState);
  ui.pauseOverlay.style.display = nextState ? 'grid' : 'none';
  ui.pauseButton.textContent = nextState ? '▶ RESUME' : 'Ⅱ PAUSE';
}

function toggleVehicleMode() {
  if (state.paused || state.kills >= state.missionTarget) return;
  const inCar = player.mode === 'car';
  player.mode = inCar ? 'foot' : 'car';
  playerCar.visible = !inCar;
  agent.visible = inCar;
  if (inCar) {
    agent.position.set(playerCar.position.x, 0, playerCar.position.z);
    agent.rotation.y = player.heading;
    playerCar.visible = false;
  } else {
    playerCar.position.set(agent.position.x, 0, agent.position.z);
    playerCar.visible = true;
  }
  showToast(inCar ? 'ON FOOT' : 'BACK IN THE CAR', inCar ? 'Arc pulse ready.' : 'Vehicle systems live.');
}

function setVehicleMode(forceCar) {
  if (forceCar) {
    player.mode = 'car';
    playerCar.visible = true;
    agent.visible = false;
  } else {
    player.mode = 'foot';
    playerCar.visible = false;
    agent.visible = true;
  }
}

function updateLighting() {
  const night = state.day ? false : true;
  scene.background = new THREE.Color(night ? 0x030d14 : 0xb7dfe1);
  scene.fog.color.set(scene.background);
  hemi.intensity = night ? 2.0 : 1.25;
  sun.intensity = night ? 3.0 : 1.25;
  fill.intensity = night ? 0.85 : 1.5;
  ui.timeToggle.innerHTML = night ? '☼ <span>DAY / NIGHT</span>' : '☾ <span>DAY / NIGHT</span>';
}

function updateCompass() {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const heading = ((Math.atan2(Math.sin(player.heading), Math.cos(player.heading)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4);
  const index = Math.round(heading) % 8;
  ui.mapHeading.textContent = directions[index];
}

function updateHUD() {
  const liveHealth = Math.max(0, player.health);
  const engineP = Math.max(0, player.engine);
  const boostP = Math.max(0, player.boost);
  ui.healthBar.style.width = `${liveHealth}%`;
  ui.healthValue.textContent = `${Math.round(liveHealth)}`;
  ui.engineBar.style.width = `${engineP}%`;
  ui.engineValue.textContent = `${Math.round(engineP)}%`;
  ui.boostBar.style.width = `${boostP}%`;
  ui.boostValue.textContent = `${Math.round(boostP)}%`;
  ui.chargeValue.textContent = `${Math.round(player.charge)}%`;
  ui.speedValue.textContent = `${Math.round(Math.abs(player.speed) * 10)}`.padStart(3, '0');
  ui.missionCount.textContent = `${state.kills} / ${state.missionTarget}`;
  ui.missionProgress.style.width = `${(state.kills / state.missionTarget) * 100}%`;
  if (state.kills >= state.missionTarget) {
    ui.missionProgress.style.width = '100%';
  }
  ui.vehicleState.textContent = player.mode === 'car' ? 'READY' : 'ON FOOT';
  updateCompass();
}

function doDamage(amount) {
  player.health = Math.max(0, player.health - amount);
  state.flashTimer = 0.15;
  ui.damageFlash.style.opacity = '1';
  if (player.health <= 0) {
    player.health = 100;
    player.engine = 100;
    player.boost = 100;
    player.charge = 82;
    if (player.mode === 'car') {
      playerCar.position.set(0, 0, 2);
      playerCar.rotation.y = 0;
    } else {
      agent.position.set(0, 0, 2);
    }
    showToast('PATROL RESET', 'Systems restored.');
  }
}

function activatePulse(origin, dir) {
  const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 12, 8), mats.pulse);
  trail.position.copy(origin.clone().add(dir.clone().multiplyScalar(5.5)));
  trail.lookAt(origin.clone().add(dir.clone().multiplyScalar(14)));
  trail.scale.y = 1;
  scene.add(trail);
  setTimeout(() => scene.remove(trail), 120);
}

function firePulse() {
  if (state.paused || player.fireCooldown > 0) return;
  player.fireCooldown = 0.22;
  const origin = player.mode === 'car' ? playerCar.position.clone().add(new THREE.Vector3(0, 1.2, -3.1)) : agent.position.clone().add(new THREE.Vector3(0, 1.5, 0));
  const facing = new THREE.Vector3(Math.sin(player.heading), 0, -Math.cos(player.heading));
  // Arc pulses softly lock onto the closest nearby hostile so combat works from either vehicle mode.
  let target = null;
  let targetDistance = 42;
  for (const threat of enemyCars) {
    if (!threat.alive) continue;
    const distance = threat.mesh.position.distanceTo(origin);
    if (distance < targetDistance) {
      target = threat;
      targetDistance = distance;
    }
  }

  let damageDealt = false;
  if (target) {
    const direction = target.mesh.position.clone().sub(origin).setY(0).normalize();
    activatePulse(origin, direction);
    target.hp -= target.boss ? 28 : 34;
    damageDealt = true;
    if (target.hp <= 0) {
      target.alive = false;
      target.mesh.visible = false;
      state.kills += 1;
      showToast(target.boss ? 'MARINER DOWN' : 'THREAT ELIMINATED', target.boss ? 'Bayfront secured.' : 'Hostile neutralized.');
      if (state.kills >= state.missionTarget) {
        showToast('AREA SECURED', 'The waterfront is clear.');
        ui.bossBanner.style.opacity = '0';
        setTimeout(() => showGlobalToast('Mission complete — district safe.'), 500);
      }
    }
  } else {
    activatePulse(origin, facing);
  }
  if (!damageDealt) showGlobalToast('No hostile in pulse range');
}

function clampToMap(value, size = 150) {
  return Math.min(size - 3, Math.max(-size + 3, value));
}

function setActivePlayerPositionFollow() {
  const targetPos = player.mode === 'car' ? playerCar.position.clone() : agent.position.clone();
  const offset = new THREE.Vector3(Math.sin(player.heading) * 10, 7.5, -Math.cos(player.heading) * 10);
  const desired = targetPos.clone().add(offset);
  camera.position.lerp(desired, 0.08);
  const focus = targetPos.clone().add(new THREE.Vector3(0, 1.5, 0));
  camera.lookAt(focus);
}

const keysDown = {
  accelerate: () => !!(keys.w || keys.arrowup || touchKeys.w),
  brake: () => !!(keys.s || keys.arrowdown || touchKeys.s),
  left: () => !!(keys.a || keys.arrowleft || touchKeys.a),
  right: () => !!(keys.d || keys.arrowright || touchKeys.d),
  boost: () => !!(keys.shift || touchBoost),
};

function updatePlayer(dt) {
  const carMode = player.mode === 'car';
  const steer = (keysDown.right() ? 1 : 0) - (keysDown.left() ? 1 : 0);

  if (carMode) {
    const throttle = (keysDown.accelerate() ? 1 : 0) - (keysDown.brake() ? 1 : 0);
    if (Math.abs(steer) > 0) {
      player.heading += steer * 1.8 * dt;
    }
    const forward = new THREE.Vector3(Math.sin(player.heading), 0, -Math.cos(player.heading));
    const accelerating = throttle !== 0;
    if (accelerating) {
      const accel = throttle > 0 ? 24 : 18;
      player.speed += accel * throttle * dt;
      player.engine = Math.max(0, player.engine - 1.2 * dt);
    } else {
      player.speed *= 0.97;
      player.engine = Math.min(100, player.engine + 0.7 * dt);
    }
    if (keysDown.boost() && player.boost > 0) {
      player.speed += 18 * dt;
      player.boost = Math.max(0, player.boost - 32 * dt);
      player.charge = Math.max(0, player.charge - 0.8 * dt);
    } else {
      player.boost = Math.min(100, player.boost + 12 * dt);
    }
    player.speed = THREE.MathUtils.clamp(player.speed, -14, 42);
    playerCar.position.addScaledVector(forward, player.speed * dt);
    playerCar.position.x = clampToMap(playerCar.position.x);
    playerCar.position.z = clampToMap(playerCar.position.z);
    playerCar.rotation.y = player.heading;
    playerCar.visible = true;
    agent.visible = false;
    player.x = playerCar.position.x;
    player.z = playerCar.position.z;
  } else {
    const movement = new THREE.Vector3((keysDown.right() ? 1 : 0) - (keysDown.left() ? 1 : 0), 0, (keysDown.accelerate() ? 1 : 0) - (keysDown.brake() ? 1 : 0));
    const stepSpeed = 16;
    if (movement.lengthSq() > 0.01) {
      movement.normalize();
      const headingTarget = Math.atan2(movement.x, -movement.z);
      player.heading = THREE.MathUtils.lerp(player.heading, headingTarget, 0.18);
      const moveVec = new THREE.Vector3(movement.x * stepSpeed * dt, 0, movement.z * stepSpeed * dt);
      agent.position.add(moveVec);
      agent.position.x = clampToMap(agent.position.x);
      agent.position.z = clampToMap(agent.position.z);
      agent.rotation.y = player.heading + Math.PI;
    }
    agent.visible = true;
    playerCar.visible = false;
    player.x = agent.position.x;
    player.z = agent.position.z;
    playerCar.position.x = player.x;
    playerCar.position.z = player.z;
  }

  const target = player.mode === 'car' ? playerCar.position : agent.position;
  target.y = 0;

  if (player.fireCooldown > 0) player.fireCooldown -= dt;
  player.charge = Math.min(100, player.charge + 0.15 * dt);
  player.engine = Math.max(0, player.engine - (player.mode === 'car' && Math.abs(player.speed) > 5 ? 0.18 : 0) * dt * 60);
}

function updateThreats(dt) {
  for (const threat of enemyCars) {
    if (!threat.alive) continue;
    const target = player.mode === 'car' ? playerCar.position : agent.position;
    const offset = target.clone().sub(threat.mesh.position);
    const dist = offset.length();
    const dir = offset.clone().normalize();
    if (dist > 0.001) {
      const move = dir.multiplyScalar(threat.speed * dt);
      threat.mesh.position.add(move);
      threat.mesh.position.x = clampToMap(threat.mesh.position.x);
      threat.mesh.position.z = clampToMap(threat.mesh.position.z);
      threat.mesh.rotation.y = Math.atan2(dir.x, -dir.z);
      if (dist < 9) {
        threat.attackCooldown -= dt;
        if (threat.attackCooldown <= 0) {
          threat.attackCooldown = 0.8;
          doDamage(threat.boss ? 12 : 8);
        }
      }
    }
    threat.mesh.userData.glow.material.opacity = 0.35 + Math.sin(performance.now() * 0.01 + threat.mesh.position.x) * 0.2;
  }
}

function drawMinimap() {
  const ctx = ui.mapCanvas.getContext('2d');
  const w = ui.mapCanvas.width, h = ui.mapCanvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(10, 18, 22, 0.8)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(187, 214, 203, 0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 4; x++) {
    ctx.beginPath();
    ctx.moveTo((w / 4) * x, 0); ctx.lineTo((w / 4) * x, h); ctx.stroke();
  }
  for (let y = 0; y <= 4; y++) {
    ctx.beginPath();
    ctx.moveTo(0, (h / 4) * y); ctx.lineTo(w, (h / 4) * y); ctx.stroke();
  }
  ctx.fillStyle = '#7ba6b0';
  ctx.fillRect(w * 0.28, h * 0.28, w * 0.44, h * 0.44);
  ctx.fillStyle = '#2d3d32';
  ctx.fillRect(w * 0.22, h * 0.22, w * 0.56, h * 0.56);

  const xToMap = (x) => ((x + 160) / 320) * w;
  const zToMap = (z) => ((z + 160) / 320) * h;

  ctx.strokeStyle = 'rgba(220, 212, 176, 0.7)';
  for (let roadX = -120; roadX <= 120; roadX += 48) {
    const fx = xToMap(roadX);
    ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, h); ctx.stroke();
  }
  for (let roadZ = -120; roadZ <= 120; roadZ += 48) {
    const fz = zToMap(roadZ);
    ctx.beginPath(); ctx.moveTo(0, fz); ctx.lineTo(w, fz); ctx.stroke();
  }

  for (const threat of enemyCars) {
    if (!threat.alive) continue;
    const px = xToMap(threat.mesh.position.x), py = zToMap(threat.mesh.position.z);
    ctx.fillStyle = threat.boss ? '#ff8e6f' : '#ff5d5d';
    ctx.beginPath();
    ctx.arc(px, py, threat.boss ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const px = xToMap(playerCar.position.x || agent.position.x), py = zToMap(playerCar.position.z || agent.position.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-player.heading);
  ctx.fillStyle = '#a9e7c3';
  ctx.beginPath();
  ctx.moveTo(0, -7); ctx.lineTo(5, 7); ctx.lineTo(0, 5); ctx.lineTo(-5, 7); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  ui.clockText.textContent = `${h}:${m}`;
}

const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033);
  requestAnimationFrame(animate);

  if (!state.paused) {
    updatePlayer(dt);
    updateThreats(dt);
    setActivePlayerPositionFollow();
    if (player.mode === 'car') {
      playerCar.position.y = 0;
    } else {
      agent.position.y = 0;
    }
  }

  if (state.flashTimer > 0) {
    state.flashTimer -= dt;
    ui.damageFlash.style.opacity = String(Math.max(0, state.flashTimer / 0.15));
  }

  drawMinimap();
  updateHUD();
  updateClock();
  renderer.render(scene, camera);
}

ui.timeToggle.addEventListener('click', () => {
  state.day = !state.day;
  updateLighting();
});
ui.soundToggle.addEventListener('click', () => {
  state.audio = !state.audio;
  ui.soundToggle.style.opacity = state.audio ? '1' : '0.65';
  showToast(state.audio ? 'SOUND ON' : 'SOUND OFF', 'Audio output toggled.');
});
ui.pauseButton.addEventListener('click', () => setPaused(!state.paused));
ui.resumeButton.addEventListener('click', () => setPaused(false));
ui.dismissHelp.addEventListener('click', () => ui.helpPill.classList.add('hidden'));
ui.fireTouch.addEventListener('click', firePulse);
ui.driveTouch.addEventListener('click', () => setVehicleMode(true));
ui.enterTouch.addEventListener('click', () => toggleVehicleMode());
ui.boostTouch.addEventListener('click', (event) => {
  // Pointer input is handled continuously above; retain a short tap boost for accessibility clicks.
  if (event.detail === 0) {
    keys.shift = true;
    setTimeout(() => { keys.shift = false; }, 200);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function initialize() {
  setVehicleMode(true);
  updateLighting();
  updateHUD();
  setPaused(false);
  ui.loading.classList.add('hidden');
  setTimeout(() => {
    ui.loading.style.display = 'none';
  }, 650);
  showToast('MISSION LIVE', 'Clear the waterfront.');
}

setTimeout(initialize, 400);
animate();
