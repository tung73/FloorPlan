import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import floorplanUrl from '../floorplan.png?url';
import './styles.css';

const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.15;
const DOOR_HEIGHT = 2.15;

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f6);

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(6.8, 7.6, 9.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(3.2, 1.1, 3.2);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 4;
controls.maxDistance = 18;
controls.update();

const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0xf8f8f4, roughness: 0.72 }),
  wallCap: new THREE.MeshStandardMaterial({ color: 0xd9dde6, roughness: 0.78 }),
  floor: new THREE.MeshStandardMaterial({ color: 0xd8c5aa, roughness: 0.62 }),
  wetFloor: new THREE.MeshStandardMaterial({ color: 0xb9c8d6, roughness: 0.58 }),
  balcony: new THREE.MeshStandardMaterial({ color: 0xcfd5dc, roughness: 0.7 }),
  railing: new THREE.MeshStandardMaterial({ color: 0x5b6678, roughness: 0.45 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x9fd8ff,
    metalness: 0,
    roughness: 0.08,
    transmission: 0.55,
    transparent: true,
    opacity: 0.4,
  }),
  door: new THREE.MeshStandardMaterial({ color: 0xa06f44, roughness: 0.5 }),
};

const apartment = new THREE.Group();
apartment.name = 'Apartment shell';
scene.add(apartment);

buildApartment();
addReferenceFloorPlan();
addLights();
addHelpers();
animate();

function buildApartment() {
  addFloorShape(
    [
      [0, 0],
      [5.3, 0],
      [5.3, 6.85],
      [1.42, 6.85],
      [1.42, 4.55],
      [0, 4.55],
    ],
    materials.floor,
    'Main apartment floor',
  );

  addRectFloor(0.08, 2.68, 1.23, 1.72, materials.wetFloor, 'Kitchen tile');
  addRectFloor(1.26, 3.57, 1.06, 0.95, materials.wetFloor, 'Bathroom tile');
  addRectFloor(5.3, 0.32, 1.1, 2.18, materials.balcony, 'Balcony floor');

  // Exterior walls, split where the plan shows doors/windows.
  addWall(0, 0, 5.3, 0, 'North exterior wall');
  addWallWithOpenings(5.3, 0, 5.3, 2.6, [{ start: 0.65, end: 1.95 }], 'Living to balcony');
  addWallWithOpenings(5.3, 2.6, 5.3, 4.55, [{ start: 0.35, end: 1.1 }], 'Bedroom 1 window wall');
  addWall(5.3, 4.55, 5.3, 6.85, 'Master bedroom east wall');
  addWallWithOpenings(1.42, 6.85, 5.3, 6.85, [{ start: 1.7, end: 2.95 }], 'South exterior wall');
  addWall(1.42, 4.55, 1.42, 6.85, 'Master bedroom west wall');
  addWall(0, 4.55, 1.42, 4.55, 'Kitchen south return');
  addWall(0, 0, 0, 4.55, 'West exterior wall');

  // Balcony railings and side returns.
  addRailing(5.3, 0.32, 6.4, 0.32, 'Balcony north rail');
  addRailing(6.4, 0.32, 6.4, 2.5, 'Balcony outer rail');
  addRailing(5.3, 2.5, 6.4, 2.5, 'Balcony south rail');

  // Internal room divisions, with gaps left for doors.
  addWall(0, 2.6, 2.35, 2.6, 'Kitchen/living partition');
  addWallWithOpenings(2.35, 2.6, 5.3, 2.6, [{ start: 0.72, end: 1.62 }], 'Living to hall and bedroom partition');
  addWallWithOpenings(2.35, 2.6, 2.35, 4.55, [{ start: 0.72, end: 1.52 }], 'Hall west wall');
  addWallWithOpenings(3.55, 2.6, 3.55, 4.55, [{ start: 0.45, end: 1.25 }], 'Bedroom 1 entry wall');
  addWallWithOpenings(2.35, 4.55, 5.3, 4.55, [{ start: 0.55, end: 1.35 }], 'Master bedroom north wall');
  addWallWithOpenings(0, 3.55, 2.35, 3.55, [{ start: 1.25, end: 2.0 }], 'Kitchen bath divider');
  addWallWithOpenings(1.25, 3.55, 1.25, 4.55, [{ start: 0.18, end: 0.84 }], 'Bathroom entry wall');

  // Lightweight opening markers give the shell a readable architectural feel.
  addDoorPanel(2.78, 2.61, Math.PI / 2, 'Living hall door opening');
  addDoorPanel(3.56, 3.22, 0, 'Bedroom 1 door opening');
  addDoorPanel(2.9, 4.56, Math.PI / 2, 'Master bedroom door opening');
  addDoorPanel(1.26, 4.04, 0, 'Bathroom door opening');
  addGlassPanel(5.31, 1.3, Math.PI / 2, 1.25, 2.25, 'Balcony sliding glass');
  addGlassPanel(3.78, 6.86, 0, 1.25, 1.35, 'Master bedroom window');

  addLabels();
}

function addWallWithOpenings(x1, z1, x2, z2, openings, name) {
  const length = distance(x1, z1, x2, z2);
  const sortedOpenings = [...openings].sort((a, b) => a.start - b.start);
  let cursor = 0;

  sortedOpenings.forEach((opening, index) => {
    if (opening.start > cursor) {
      addPartialWall(x1, z1, x2, z2, cursor, opening.start, `${name} segment ${index + 1}`);
    }
    cursor = Math.max(cursor, opening.end);
  });

  if (cursor < length) {
    addPartialWall(x1, z1, x2, z2, cursor, length, `${name} segment end`);
  }
}

function addPartialWall(x1, z1, x2, z2, start, end, name) {
  const length = distance(x1, z1, x2, z2);
  const t1 = start / length;
  const t2 = end / length;
  addWall(
    THREE.MathUtils.lerp(x1, x2, t1),
    THREE.MathUtils.lerp(z1, z2, t1),
    THREE.MathUtils.lerp(x1, x2, t2),
    THREE.MathUtils.lerp(z1, z2, t2),
    name,
  );
}

function addWall(x1, z1, x2, z2, name) {
  const length = distance(x1, z1, x2, z2);
  const geometry = new THREE.BoxGeometry(length, WALL_HEIGHT, WALL_THICKNESS);
  const wall = new THREE.Mesh(geometry, materials.wall);
  wall.name = name;
  wall.position.set((x1 + x2) / 2, WALL_HEIGHT / 2, (z1 + z2) / 2);
  wall.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  wall.castShadow = true;
  wall.receiveShadow = true;
  apartment.add(wall);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.04, WALL_THICKNESS + 0.02),
    materials.wallCap,
  );
  cap.name = `${name} top cap`;
  cap.position.set(wall.position.x, WALL_HEIGHT + 0.02, wall.position.z);
  cap.rotation.y = wall.rotation.y;
  cap.receiveShadow = true;
  apartment.add(cap);
}

function addFloorShape(points, material, name) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    if (index === 0) {
      shape.moveTo(x, z);
    } else {
      shape.lineTo(x, z);
    }
  });
  shape.closePath();

  const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  floor.name = name;
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  apartment.add(floor);
}

function addRectFloor(x, z, width, depth, material, name) {
  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.035, depth), material);
  floor.name = name;
  floor.position.set(x + width / 2, 0.02, z + depth / 2);
  floor.receiveShadow = true;
  apartment.add(floor);
}

function addRailing(x1, z1, x2, z2, name) {
  const length = distance(x1, z1, x2, z2);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.07), materials.railing);
  rail.name = name;
  rail.position.set((x1 + x2) / 2, 1.05, (z1 + z2) / 2);
  rail.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  rail.castShadow = true;
  apartment.add(rail);

  const postCount = Math.max(2, Math.ceil(length / 0.55));
  for (let i = 0; i <= postCount; i += 1) {
    const t = i / postCount;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 0.06), materials.railing);
    post.name = `${name} post`;
    post.position.set(THREE.MathUtils.lerp(x1, x2, t), 0.53, THREE.MathUtils.lerp(z1, z2, t));
    post.castShadow = true;
    apartment.add(post);
  }
}

function addDoorPanel(x, z, rotationY, name) {
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.72, DOOR_HEIGHT, 0.045), materials.door);
  door.name = name;
  door.position.set(x, DOOR_HEIGHT / 2, z);
  door.rotation.y = rotationY;
  door.castShadow = true;
  apartment.add(door);
}

function addGlassPanel(x, z, rotationY, width, height, name) {
  const glass = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.035), materials.glass);
  glass.name = name;
  glass.position.set(x, height / 2 + 0.35, z);
  glass.rotation.y = rotationY;
  apartment.add(glass);
}

function addLabels() {
  [
    ['DIN / LIV', 2.7, 1.25],
    ['KIT', 0.68, 3.25],
    ['BATH', 1.78, 4.05],
    ['BR1', 4.42, 3.55],
    ['MBR', 3.35, 5.7],
    ['BAL', 5.86, 1.45],
  ].forEach(([label, x, z]) => {
    const sprite = createTextSprite(label);
    sprite.position.set(x, 0.08, z);
    sprite.rotation.x = -Math.PI / 2;
    apartment.add(sprite);
  });
}

function createTextSprite(text) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 256;
  canvasEl.height = 96;
  const context = canvasEl.getContext('2d');
  context.fillStyle = 'rgba(255, 255, 255, 0.82)';
  context.roundRect(16, 18, 224, 60, 18);
  context.fill();
  context.fillStyle = '#26334d';
  context.font = '700 34px Inter, Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 128, 50);

  const texture = new THREE.CanvasTexture(canvasEl);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.35, 0.5, 1);
  return sprite;
}

function addReferenceFloorPlan() {
  const loader = new THREE.TextureLoader();
  loader.load(floorplanUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const plan = new THREE.Mesh(
      new THREE.PlaneGeometry(5.29, 4.09),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
      }),
    );
    plan.name = 'Reference floorplan image';
    plan.rotation.x = -Math.PI / 2;
    plan.position.set(2.65, -0.015, 3.55);
    scene.add(plan);
  });
}

function addLights() {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xa5adba, 2.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.position.set(3.5, 8, 4.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);
}

function addHelpers() {
  const grid = new THREE.GridHelper(8, 16, 0x9aa5b8, 0xd1d7e2);
  grid.position.set(3.1, -0.02, 3.4);
  scene.add(grid);
}

function distance(x1, z1, x2, z2) {
  return Math.hypot(x2 - x1, z2 - z1);
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
