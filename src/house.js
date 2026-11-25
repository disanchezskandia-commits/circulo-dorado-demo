import * as THREE from 'three';

// Casa low-poly construida con geometría propia (sin modelos externos).
// Ejes: frente de la casa mira a +Z. Casa principal x[-6,6] z[-4,4], garaje x[6,10].

export const SLAB = 0.3;
export const WALL_H = 3;

const C = {
  grass: 0x7fb85a,
  dirt: 0xc49a6c,
  slab: 0xe7ddcb,
  wallOut: 0xf7f1e6,
  wallIn: 0xfffaf2,
  gold: 0xd09a22,
  goldLight: 0xf2d27a,
  roof: 0xd6a43a,
  glass: 0x9fd3e6,
  wood: 0xb57d4b,
  woodDark: 0x8a5a34,
  sidewalk: 0xe6dfd2,
  street: 0x596068,
  blueprint: 0x2f5d8a,
  pot: 0xc0683f,
  leaf: 0x5f9e4b,
  leafDark: 0x4b8a3e,
  hair: 0x1f1410,
};
// Mujeres y jóvenes afrochocoanas: tonos de piel profundos y turbantes de colores vivos.
const SKIN = [0x4a2a17, 0x5e3620, 0x3a2012, 0x6b3f24, 0x2e1a0f];
const WRAP = [0xf2b134, 0xe2453c, 0x00a99d, 0xd65a8a, 0xff8a1f, 0x7b3fa0];
const LOOK = ['turbante', 'afro', 'turbante', 'trenzas', 'turbante', 'afro'];
const CLOTH = [0xff8a1f, 0x00a99d, 0xf2b134, 0xd65a8a, 0x2f6f9f, 0xe2453c];

const mat = (color, o = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o });

// Líneas sobre blanco: el color del material tiñe la textura.
function stripeTex(n, vertical, line = '#bdbdbd', width = 3) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = line;
  for (let i = 0; i < n; i++) {
    const p = Math.round((i * 128) / n);
    if (vertical) ctx.fillRect(p, 0, width, 128);
    else ctx.fillRect(0, p, 128, width);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const PLANKS = stripeTex(4, false);
PLANKS.repeat.set(1, 3);
const ZINC = stripeTex(8, true, '#8a8a8a', 6);
ZINC.repeat.set(6, 1);

const M = {
  grass: mat(C.grass),
  dirt: mat(C.dirt, { transparent: true }),
  slab: mat(0x7a5a3a),
  wallOut: mat(0xf2c230, { map: PLANKS }),
  doorWood: mat(0x5c3b22),
  wallIn: mat(C.wallIn),
  gold: mat(C.gold, { roughness: 0.45, metalness: 0.25 }),
  goldLight: mat(C.goldLight),
  roof: mat(0xb3bbc0, { map: ZINC, roughness: 0.4, metalness: 0.5, transparent: true }),
  roofTrim: mat(0xffffff, { transparent: true }),
  gable: mat(0xf2c230, { map: PLANKS, transparent: true }),
  glass: mat(C.glass, { roughness: 0.15, transparent: true, opacity: 0.75 }),
  wood: mat(C.wood),
  woodDark: mat(C.woodDark),
  sidewalk: mat(C.sidewalk),
  street: mat(C.street),
  pot: mat(C.pot),
  leaf: mat(C.leaf),
  leafDark: mat(C.leafDark),
  hair: mat(C.hair),
  white: mat(0xffffff),
  dark: mat(0x2b2f33),
  brick: mat(0xd9a630, { roughness: 0.35, metalness: 0.3, emissive: 0x3a2400 }),
  tile: mat(0xf1e9da),
  floorWarm: mat(0xe2c39b),
  floorLegal: mat(0xd9dde0),
  floorGarage: mat(0xc9c4bb),
  rug: mat(C.goldLight),
};

function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  return mesh;
}
function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 10) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z);
  return mesh;
}

// Muro recto con huecos (puertas/ventanas). openings: {start,end,bottom,top,glass}
function buildWall({ from, to, h = WALL_H, t = 0.2, openings = [] }, m) {
  const g = new THREE.Group();
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const L = Math.hypot(dx, dz);
  g.position.set(from[0], 0, from[1]);
  g.rotation.y = Math.atan2(-dz, dx);
  const seg = (a, b, y0, y1) => {
    if (b - a < 0.01 || y1 - y0 < 0.01) return;
    g.add(box(b - a, y1 - y0, t, m, (a + b) / 2, (y0 + y1) / 2, 0));
  };
  let cur = -t / 2;
  [...openings]
    .sort((p, q) => p.start - q.start)
    .forEach((o) => {
      seg(cur, o.start, 0, h);
      seg(o.start, o.end, 0, o.bottom || 0);
      seg(o.start, o.end, o.top, h);
      if (o.glass) {
        g.add(box(o.end - o.start, o.top - o.bottom, t * 0.3, M.glass, (o.start + o.end) / 2, (o.bottom + o.top) / 2, 0));
        g.add(box(o.end - o.start + 0.25, 0.08, t + 0.18, M.white, (o.start + o.end) / 2, o.bottom, 0));
        g.add(box(0.06, o.top - o.bottom, t * 0.5, M.white, (o.start + o.end) / 2, (o.bottom + o.top) / 2, 0));
      }
      if (o.door) {
        g.add(box(o.end - o.start, o.top - 0.02, 0.08, M.doorWood, (o.start + o.end) / 2, o.top / 2, 0));
        g.add(box(0.08, 0.08, 0.2, M.white, o.end - 0.25, o.top * 0.45, 0));
      }
      cur = o.end;
    });
  seg(cur, L + t / 2, 0, h);
  return g;
}

function person({ cloth, skin, sitting = false, look = 'afro', wrap = WRAP[0] }) {
  const g = new THREE.Group();
  const clothM = mat(cloth);
  const skinM = mat(skin);
  const lift = sitting ? 0.42 : 0.5;
  // piernas
  if (sitting) {
    g.add(box(0.36, 0.14, 0.45, mat(0x33363b), 0, 0.5, 0.2));
    g.add(box(0.32, 0.45, 0.14, mat(0x33363b), 0, 0.25, 0.42));
  } else {
    g.add(box(0.13, 0.5, 0.14, mat(0x33363b), -0.09, 0.25, 0));
    g.add(box(0.13, 0.5, 0.14, mat(0x33363b), 0.09, 0.25, 0));
  }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 4, 8), clothM);
  body.position.y = lift + 0.4;
  g.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), skinM);
  head.position.y = lift + 0.92;
  g.add(head);
  const top = lift + 0.92;
  if (look === 'turbante') {
    // turbante: base que abraza la cabeza + volumen alto inclinado hacia atrás
    const wM = mat(wrap);
    const base = new THREE.Mesh(new THREE.IcosahedronGeometry(0.215, 1), wM);
    base.position.set(0, top + 0.07, -0.02);
    base.scale.set(1, 0.72, 1);
    g.add(base);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), wM);
    crown.position.set(0, top + 0.27, -0.07);
    crown.scale.set(1.05, 1.15, 0.95);
    crown.rotation.x = -0.35;
    g.add(crown);
    const knot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), mat(WRAP[(WRAP.indexOf(wrap) + 2) % WRAP.length]));
    knot.position.set(0.05, top + 0.2, 0.15);
    g.add(knot);
  } else if (look === 'trenzas') {
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(0.21, 1), M.hair);
    h.position.set(0, top + 0.08, -0.03);
    h.scale.set(1, 0.75, 1);
    g.add(h);
    [-0.13, 0.13].forEach((x) => g.add(box(0.07, 0.42, 0.07, M.hair, x, top - 0.12, -0.12)));
  } else {
    // afro
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), M.hair);
    h.position.set(0, top + 0.12, -0.06);
    h.scale.set(1.05, 0.9, 1);
    g.add(h);
  }
  g.userData.bob = Math.random() * Math.PI * 2;
  g.userData.isPerson = true;
  return g;
}

function chair(x, z, rotY, m = M.wood) {
  const g = new THREE.Group();
  g.add(box(0.5, 0.08, 0.5, m, 0, 0.45, 0));
  g.add(box(0.5, 0.55, 0.07, m, 0, 0.75, -0.22));
  [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([a, b]) => g.add(box(0.05, 0.45, 0.05, M.woodDark, a, 0.22, b)));
  g.position.set(x, SLAB, z);
  g.rotation.y = rotY;
  return g;
}

function plant(x, z, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.22, 0.17, 0.4, M.pot, 0, 0.2, 0));
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), M.leaf);
  leaves.position.y = 0.75;
  g.add(leaves);
  g.position.set(x, SLAB, z);
  g.scale.setScalar(s);
  return g;
}

function tree(x, z, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.18, 0.25, 1.6, M.woodDark, 0, 0.8, 0, 6));
  const a = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), M.leaf);
  a.position.y = 2.3;
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), M.leafDark);
  b.position.set(0.6, 2.9, 0.3);
  g.add(a, b);
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  g.rotation.y = x * 1.7;
  return g;
}

function signTexture(text) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1f2a2e';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#72e200';
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 92px Outfit, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}


// ---------- Paisaje chocoano ----------
const PAL = {
  palmLeaf: mat(0x3f8f3a),
  palmLeaf2: mat(0x2f7a34),
  banana: mat(0x5aa83f),
  trunk: mat(0x8a6a48),
  jungle: [mat(0x2f6b2c), mat(0x3a7d33), mat(0x255c27), mat(0x4a8c3a)],
  water: new THREE.MeshStandardMaterial({ color: 0x6f8a5a, roughness: 0.25, metalness: 0.1, flatShading: true }),
  bank: mat(0x9b7b52),
  zinc: mat(0x9aa3a8, { roughness: 0.4, metalness: 0.55 }),
  zincRust: mat(0x8f6a4e, { roughness: 0.6, metalness: 0.3 }),
  stilt: mat(0x5c4128),
  canoe: mat(0x6b4a2b),
  houseColors: [0x3fb6b0, 0xe96b8e, 0x4a7fc1, 0xff8a3d],
};

function palm(x, z, s = 1, lean = 0.25) {
  const g = new THREE.Group();
  let px = 0;
  let py = 0;
  for (let i = 0; i < 6; i++) {
    const seg = cyl(0.16 - i * 0.012, 0.19 - i * 0.012, 0.95, PAL.trunk, px, py + 0.47, 0, 6);
    seg.rotation.z = -lean * (i / 6);
    g.add(seg);
    px += Math.sin(lean * (i / 6)) * 0.95;
    py += 0.93;
  }
  const crown = new THREE.Group();
  crown.position.set(px, py, 0);
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Group();
    f.add(box(0.42, 0.04, 2.6, i % 2 ? PAL.palmLeaf : PAL.palmLeaf2, 0, 0, 1.15));
    f.rotation.order = 'YXZ';
    f.rotation.y = (i / 9) * Math.PI * 2;
    f.rotation.x = i % 2 ? -0.1 + (i % 3) * 0.05 : 0.38 + (i % 3) * 0.06; // corona: unas arriba, otras arqueadas
    crown.add(f);
  }
  [[0.15, 0.1], [-0.12, 0.12], [0, -0.15]].forEach(([a, b]) => {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), mat(0x6b5a2a));
    c.position.set(a, -0.15, b);
    crown.add(c);
  });
  g.add(crown);
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  g.rotation.y = x * 1.3 + z;
  return g;
}

function banana(x, z, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.14, 0.2, 1.5, mat(0x7a8f3e), 0, 0.75, 0, 6));
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Group();
    f.add(box(0.55, 0.03, 1.7, PAL.banana, 0, 0, 0.85));
    f.position.y = 1.45 + (i % 2) * 0.12;
    f.rotation.order = 'YXZ';
    f.rotation.y = (i / 7) * Math.PI * 2 + i;
    f.rotation.x = -0.35 + (i % 3) * 0.3;
    g.add(f);
  }
  g.add(cyl(0.12, 0.16, 0.45, mat(0x9bbf3a), 0.22, 1.15, 0.1, 6)); // racimo
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  return g;
}

function ceiba(x, z, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.3, 0.55, 5, PAL.trunk, 0, 2.5, 0, 7));
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), PAL.jungle[1]);
  top.scale.set(1.4, 0.45, 1.3);
  top.position.y = 5.3;
  const top2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), PAL.jungle[3]);
  top2.scale.set(1.3, 0.5, 1.2);
  top2.position.set(1, 5.9, 0.4);
  g.add(top, top2);
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  return g;
}

// Casa de madera sobre pilotes con techo de zinc (palafito)
function palafito(x, z, color, ry = 0, s = 1) {
  const g = new THREE.Group();
  const w = 3.2;
  const d = 2.8;
  const lift = 1.1;
  [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([a, b]) => g.add(cyl(0.08, 0.08, lift, PAL.stilt, (a * w) / 2.2, lift / 2, (b * d) / 2.2, 5)));
  g.add(box(w + 0.6, 0.12, d + 0.8, mat(0x7a5a3a), 0, lift, 0.2));
  const wallM = mat(color);
  const plank = mat(new THREE.Color(color).multiplyScalar(0.82).getHex());
  g.add(box(w, 1.9, d, wallM, 0, lift + 1, 0));
  for (let i = 0; i < 4; i++) g.add(box(w + 0.02, 0.04, d + 0.02, plank, 0, lift + 0.3 + i * 0.45, 0));
  g.add(box(0.7, 1.3, 0.05, mat(0x5c3b22), -0.6, lift + 0.7, d / 2 + 0.02));
  g.add(box(0.7, 0.6, 0.05, M.white, 0.8, lift + 1.2, d / 2 + 0.02));
  g.add(box(0.6, 0.5, 0.06, M.dark, 0.8, lift + 1.2, d / 2 + 0.03));
  g.add(box(w + 0.6, 0.05, 0.05, wallM, 0, lift + 0.55, d / 2 + 0.55));
  for (let i = -3; i <= 3; i++) g.add(box(0.05, 0.5, 0.05, wallM, i * 0.5, lift + 0.3, d / 2 + 0.55));
  // frontón triangular
  const tri = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, 0.75)]);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false }), wallM);
  gable.position.set(0, lift + 1.95, -d / 2);
  g.add(gable);
  // techo de zinc a dos aguas
  const roofM = (Math.abs(Math.round(x + z)) % 3 === 0) ? PAL.zincRust : PAL.zinc;
  const half = w / 2 + 0.35;
  const ang = Math.atan2(0.75, w / 2);
  const rL = box(half / Math.cos(ang), 0.06, d + 1.2, roofM, -half / 2 + 0.05, lift + 2.35, 0.1);
  rL.rotation.z = ang;
  const rR = box(half / Math.cos(ang), 0.06, d + 1.2, roofM, half / 2 - 0.05, lift + 2.35, 0.1);
  rR.rotation.z = -ang;
  g.add(rL, rR);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  g.scale.setScalar(s);
  return g;
}

// Potrillo (canoa) con remo
function canoe() {
  const g = new THREE.Group();
  g.add(box(3.2, 0.32, 0.6, PAL.canoe, 0, 0.1, 0));
  [-1, 1].forEach((k) => {
    const tip = box(0.6, 0.3, 0.42, PAL.canoe, k * 1.82, 0.14, 0);
    tip.rotation.y = Math.PI / 4;
    tip.scale.set(1, 1, 1);
    g.add(tip);
  });
  const paddle = box(0.06, 0.06, 1.6, PAL.stilt, 0.1, 0.9, 0.45);
  paddle.rotation.x = 0.7;
  g.add(paddle);
  return g;
}

// Platón con frutas para las platoneras
function platon() {
  const g = new THREE.Group();
  g.add(cyl(0.42, 0.28, 0.14, mat(0xb5b8bb, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, 12));
  [[0xf2c230, 0.15, 0.1], [0x8fd14f, -0.15, 0.05], [0xff8a3d, 0, -0.17], [0xe2453c, 0.05, 0.18], [0xf2c230, -0.12, -0.12]].forEach(([c, a, b]) => {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), mat(c));
    f.position.set(a, 0.12, b);
    g.add(f);
  });
  return g;
}

export function buildHouse({ signText }) {
  const root = new THREE.Group();
  const g = {
    env: new THREE.Group(),
    lot: new THREE.Group(),
    slab: new THREE.Group(),
    blueprint: new THREE.Group(),
    walls: new THREE.Group(),
    frontWalls: new THREE.Group(),
    roof: new THREE.Group(),
    furniture: new THREE.Group(),
    garageDoor: new THREE.Group(),
    bricks: new THREE.Group(),
    highlight: null,
  };
  Object.values(g).forEach((x) => x && root.add(x));

  // ---------- Entorno ----------
  const grass = new THREE.Mesh(new THREE.CircleGeometry(75, 48), M.grass);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  g.env.add(grass);
  g.env.add(box(60, 0.06, 4, M.sidewalk, 2, 0.03, 10.5));
  g.env.add(box(60, 0.04, 7, M.street, 2, 0.02, 16));
  for (let i = -26; i < 30; i += 3) g.env.add(box(1.6, 0.05, 0.18, M.goldLight, i, 0.04, 16));
  g.env.add(box(1.8, 0.08, 4.2, M.sidewalk, 1.5, 0.04, 6.4)); // caminito a la puerta
  // Anillo dorado alrededor de la casa
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(11, 0.09, 6, 96),
    new THREE.MeshStandardMaterial({ color: C.gold, emissive: 0x6b4a00, roughness: 0.4, metalness: 0.4 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(2, 0.06, 0);
  g.env.add(ring);
  // Palmas, plataneras y ceibas alrededor del centro
  [[-12, -6, 1.1, 0.3], [15, -5, 1.2, -0.25], [-4, -10, 1.0, 0.2], [20, 4, 1.0, 0.35], [-15, 6, 0.9, -0.3]].forEach(([x, z, s, l]) => g.env.add(palm(x, z, s, l)));
  [[-13, 1.5, 1.1], [16, 2.5, 1], [9, -9.5, 1.2], [-8.5, -8, 0.9]].forEach(([x, z, s]) => g.env.add(banana(x, z, s)));
  [[-19, -9, 1.1], [23, -10, 1.2]].forEach(([x, z, s]) => g.env.add(ceiba(x, z, s)));

  // Río Atrato detrás de la casa
  const river = box(110, 0.06, 9, PAL.water, 2, 0.03, -19.5);
  river.userData.noShadow = true;
  g.env.add(river);
  g.env.add(box(110, 0.12, 0.9, PAL.bank, 2, 0.04, -14.8));
  g.env.add(box(110, 0.12, 0.9, PAL.bank, 2, 0.04, -24.2));
  const current = mat(0x9db08a);
  for (let i = 0; i < 6; i++) {
    const c = box(2 + (i % 3), 0.02, 0.07, current, -25 + i * 9, 0.07, -17.5 - (i % 4) * 1.1);
    c.userData.noShadow = true;
    g.env.add(c);
  }
  const boat = canoe();
  boat.position.set(-6, 0.05, -19);
  g.env.add(boat);
  const boatman = person({ cloth: 0x2f6f9f, skin: SKIN[2], sitting: true, look: 'afro' });
  boatman.position.set(0.3, -0.3, 0);
  boatman.rotation.y = Math.PI / 2;
  boat.add(boatman);

  // Palafitos de colores en ambas orillas
  [[-22, -12, 0.15, 0.65], [-8, -28, Math.PI, 0.95], [12, -28, Math.PI - 0.1, 0.95], [27, -12, -0.2, 0.95]].forEach(
    ([x, z, ry, sc], i) => g.env.add(palafito(x, z, PAL.houseColors[i % PAL.houseColors.length], ry, sc))
  );

  // Selva de fondo
  for (let i = 0; i < 36; i++) {
    const a = Math.PI * (0.92 + (i / 36) * 1.16);
    const r = 44 + (i % 5) * 3;
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6 + (i % 4) * 0.6, 0), PAL.jungle[i % 4]);
    blob.position.set(2 + Math.cos(a) * r, 1 + (i % 3) * 0.6, Math.sin(a) * r);
    blob.scale.set(1.3, 0.8 + (i % 3) * 0.25, 1.2);
    g.env.add(blob);
  }
  for (let i = 0; i < 5; i++) g.env.add(palm(-30 + i * 15, -33 - (i % 3) * 2, 1.3 + (i % 2) * 0.3, i % 2 ? 0.3 : -0.3));

  // Platoneras caminando por el andén
  const walkers = [];
  [[-10, 10, 1, 0x00a99d, 0xf2b134], [14, 10.9, -1, 0xd65a8a, 0xff8a1f]].forEach(([x, z, dir, cloth, wrap], i) => {
    const w = person({ cloth, skin: SKIN[i * 2], look: 'turbante', wrap });
    const p = platon();
    p.position.y = 1.95;
    w.add(p);
    w.position.set(x, 0.06, z);
    w.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    w.userData.walk = dir * 0.9;
    walkers.push(w);
    g.env.add(w);
  });
  g.env.userData.walkers = walkers;
  g.env.userData.boat = boat;
  // Farolas
  [[-6, 11.8], [10, 11.8]].forEach(([x, z]) => {
    g.env.add(cyl(0.08, 0.1, 3.6, M.dark, x, 1.8, z, 6));
    g.env.add(box(0.5, 0.18, 0.3, M.dark, x, 3.6, z - 0.15));
  });

  // ---------- Lote (etapa terreno) ----------
  const dirt = box(19, 0.06, 11, M.dirt, 2, 0.05, 0);
  g.lot.add(dirt);
  const corners = [[-7.5, -5.5], [11.5, -5.5], [11.5, 5.5], [-7.5, 5.5]];
  const stakeM = mat(0xe85d3a);
  corners.forEach(([x, z]) => g.lot.add(box(0.12, 0.8, 0.12, stakeM, x, 0.4, z)));
  const ropePts = [...corners, corners[0]].map(([x, z]) => new THREE.Vector3(x, 0.6, z));
  g.lot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ropePts), new THREE.LineBasicMaterial({ color: 0xe85d3a, transparent: true })));
  g.lot.userData.fadeMats = [M.dirt];
  g.lot.visible = false;
  M.dirt.opacity = 0;

  // ---------- Losa y pisos ----------
  g.slab.add(box(16.6, SLAB, 8.6, M.slab, 2, SLAB / 2, 0));
  const floor = (w, d, m, x, z) => box(w, 0.02, d, m, x, SLAB + 0.01, z);
  g.slab.add(floor(12, 4, M.tile, 0, 2));
  g.slab.add(floor(6, 4, M.floorWarm, -3, -2));
  g.slab.add(floor(6, 4, M.floorLegal, 3, -2));
  g.slab.add(floor(4, 8, M.floorGarage, 8, 0));

  // ---------- Muros ----------
  g.walls.position.y = SLAB;
  g.frontWalls.position.y = SLAB;
  const W = (spec, m = M.wallOut) => buildWall(spec, m);
  const wallSpecs = {
    back: { from: [-6, -4], to: [10, -4], openings: [{ start: 2, end: 4, bottom: 1.2, top: 2.3, glass: true }, { start: 8, end: 10, bottom: 1.2, top: 2.3, glass: true }] },
    left: { from: [-6, -4], to: [-6, 4], openings: [{ start: 1, end: 3, bottom: 1.1, top: 2.3, glass: true }] },
    right: { from: [10, -4], to: [10, 4], openings: [{ start: 2, end: 4, bottom: 1.2, top: 2.3, glass: true }] },
    mid: { from: [-6, 0], to: [6, 0], t: 0.14, openings: [{ start: 2.4, end: 3.6, top: 2.3 }, { start: 8.4, end: 9.6, top: 2.3 }] },
    split: { from: [0, -4], to: [0, 0], t: 0.14 },
    garage: { from: [6, -4], to: [6, 4], t: 0.14, openings: [{ start: 5.4, end: 6.6, top: 2.3 }] },
    front: {
      from: [-6, 4],
      to: [6, 4],
      openings: [
        { start: 1.5, end: 3.5, bottom: 1, top: 2.3, glass: true },
        { start: 6.8, end: 8.2, bottom: 0, top: 2.4, door: true },
        { start: 9.6, end: 11, bottom: 1, top: 2.3, glass: true },
      ],
    },
    garageFront: { from: [6, 4], to: [10, 4], openings: [{ start: 0.4, end: 3.6, top: 2.6 }] },
  };
  ['back', 'left', 'right'].forEach((k) => g.walls.add(W(wallSpecs[k])));
  ['mid', 'split', 'garage'].forEach((k) => g.walls.add(W(wallSpecs[k], M.wallIn)));
  g.frontWalls.add(W(wallSpecs.front), W(wallSpecs.garageFront));
  // Zócalo dorado sobre el frente
  g.frontWalls.add(box(16.2, 0.12, 0.26, M.white, 2, 2.95, 4));
  // Letrero
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.5), new THREE.MeshBasicMaterial({ map: signTexture(signText) }));
  sign.position.set(1.5, 2.65, 4.12);
  g.frontWalls.add(sign);

  // Puerta de garaje enrollable
  const gd = new THREE.Group();
  for (let i = 0; i < 6; i++) gd.add(box(3.2, 0.42, 0.06, i % 2 ? mat(0x3fb6b0) : mat(0x349d98), 0, 0.22 + i * 0.43, 0));
  gd.position.set(8, SLAB, 4.02);
  g.garageDoor.add(gd);
  g.garageDoor.userData.door = gd;

  // ---------- Techo ----------
  const top = SLAB + WALL_H;
  const rise = 1.8;
  const half = 4.5;
  const slopeLen = Math.hypot(half, rise);
  const ang = Math.atan2(rise, half);
  const front = box(12.8, 0.18, slopeLen, M.roof, 0, top + rise / 2, half / 2);
  front.rotation.x = ang;
  const back = box(12.8, 0.18, slopeLen, M.roof, 0, top + rise / 2, -half / 2);
  back.rotation.x = -ang;
  g.roof.add(front, back);
  g.roof.add(box(12.9, 0.16, 0.22, M.roofTrim, 0, top + rise + 0.02, 0));
  const tri = new THREE.Shape([new THREE.Vector2(-4, 0), new THREE.Vector2(4, 0), new THREE.Vector2(0, rise * (4 / half))]);
  const gableGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false });
  [-6.1, 5.9].forEach((x) => {
    const m = new THREE.Mesh(gableGeo, M.gable);
    m.rotation.y = Math.PI / 2;
    m.position.set(x, top, 0);
    g.roof.add(m);
  });
  g.roof.add(box(4.5, 0.22, 8.8, M.roof, 8.15, top + 0.11, 0));
  g.roof.add(box(4.6, 0.12, 0.2, M.roofTrim, 8.15, top + 0.25, 4.4));
  g.roof.userData.fadeMats = [M.roof, M.roofTrim, M.gable];

  // ---------- Planos (blueprint) ----------
  const bpMat = new THREE.MeshBasicMaterial({ color: C.blueprint, transparent: true, opacity: 0 });
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(16.6, 8.6), bpMat);
  bp.rotation.x = -Math.PI / 2;
  bp.position.set(2, SLAB + 0.04, 0);
  g.blueprint.add(bp);
  const pts = [];
  const seg = (a, b) => pts.push(new THREE.Vector3(a[0], SLAB + 0.06, a[1]), new THREE.Vector3(b[0], SLAB + 0.06, b[1]));
  Object.values(wallSpecs).forEach((s) => seg(s.from, s.to));
  for (let x = -6; x <= 10; x += 1) seg([x, -4.2], [x, 4.2]);
  for (let z = -4; z <= 4; z += 1) seg([-6.2, z], [10.2, z]);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  g.blueprint.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  g.blueprint.userData.fadeMats = [bpMat, lineMat];
  g.blueprint.userData.maxOpacity = [0.92, 0.6];

  // ---------- Mobiliario y personas ----------
  const F = g.furniture;
  const add = (o) => (F.add(o), o);
  const at = (o, x, z, ry = 0) => {
    o.position.set(x, SLAB, z);
    o.rotation.y = ry;
    return add(o);
  };
  let pi = 0;
  const p = (opts = {}) => {
    const i = pi++;
    return person({ cloth: CLOTH[i % CLOTH.length], skin: SKIN[i % SKIN.length], look: LOOK[i % LOOK.length], wrap: WRAP[i % WRAP.length], ...opts });
  };

  // Recepción
  add(box(2.6, 1.05, 0.6, M.wood, -2, SLAB + 0.52, 1.3));
  add(box(2.7, 0.06, 0.7, M.gold, -2, SLAB + 1.07, 1.3));
  add(box(0.5, 0.32, 0.05, M.dark, -2.4, SLAB + 1.26, 1.2));
  at(p(), -2, 0.65, 0);
  at(p(), 1.4, 2.8, Math.PI);
  add(box(2.2, 0.45, 0.55, M.woodDark, 3.8, SLAB + 0.22, 0.6));
  add(box(2.2, 0.5, 0.1, M.woodDark, 3.8, SLAB + 0.6, 0.35));
  add(plant(-5.4, 3.4, 1.1));
  add(plant(5.4, 3.4, 1.1));
  const recepRug = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), M.rug);
  recepRug.rotation.x = -Math.PI / 2;
  recepRug.position.set(1.5, SLAB + 0.03, 3.1);
  add(recepRug);

  // Sala psicosocial: círculo de sillas
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.75, 40), M.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-3, SLAB + 0.03, -2);
  add(rug);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = -3 + Math.cos(a) * 1.35;
    const z = -2 + Math.sin(a) * 1.35;
    const ry = -a - Math.PI / 2; // mirando al centro
    add(chair(x, z, ry, i % 2 ? M.wood : M.goldLight));
    if (i !== 1 && i !== 4) at(p({ sitting: true }), x, z, ry);
  }
  add(plant(-5.4, -3.4));
  add(box(1.4, 1.2, 0.35, M.wood, -1, SLAB + 0.6, -3.7));

  // Asesoría legal
  add(box(2, 0.08, 0.9, M.wood, 3, SLAB + 0.78, -2.8));
  [[-0.9, -0.38], [0.9, -0.38], [-0.9, 0.38], [0.9, 0.38]].forEach(([a, b]) => add(box(0.06, 0.78, 0.06, M.woodDark, 3 + a, SLAB + 0.39, -2.8 + b)));
  add(box(0.55, 0.03, 0.4, M.dark, 2.7, SLAB + 0.83, -2.85));
  add(box(0.55, 0.36, 0.03, M.dark, 2.7, SLAB + 1.0, -3.04));
  add(chair(3, -3.55, 0));
  at(p({ sitting: true }), 3, -3.55, 0);
  add(chair(2.5, -1.8, Math.PI));
  add(chair(3.5, -1.8, Math.PI));
  at(p({ sitting: true }), 2.5, -1.8, Math.PI);
  const shelf = new THREE.Group();
  shelf.add(box(1.4, 2.1, 0.4, M.woodDark, 0, 1.05, 0));
  for (let r = 0; r < 4; r++)
    for (let b = 0; b < 5; b++) shelf.add(box(0.18, 0.36, 0.3, mat(CLOTH[(r + b) % CLOTH.length]), -0.48 + b * 0.24, 0.3 + r * 0.5, 0.05));
  at(shelf, 5.1, -3.7);
  add(plant(0.6, -0.6, 0.9));

  // Taller / tienda (garaje)
  [[-2.4], [0.2]].forEach(([z]) => {
    add(box(2.8, 0.08, 1.1, M.wood, 8, SLAB + 0.82, z));
    [[-1.3, -0.45], [1.3, -0.45], [-1.3, 0.45], [1.3, 0.45]].forEach(([a, b]) => add(box(0.07, 0.82, 0.07, M.woodDark, 8 + a, SLAB + 0.41, z + b)));
    for (let k = 0; k < 4; k++) {
      const it = k % 2 ? cyl(0.18, 0.14, 0.24, mat(CLOTH[(k + 2) % 6]), 0, 0, 0, 8) : box(0.3, 0.22, 0.3, mat(CLOTH[k % 6]));
      it.position.set(7 + k * 0.65, SLAB + 0.98, z);
      add(it);
    }
  });
  at(p(), 8.5, -1.4, Math.PI);
  at(p(), 7.2, 1.2, 0);
  const rack = new THREE.Group();
  rack.add(box(0.45, 2, 3, M.woodDark, 0, 1, 0));
  for (let r = 0; r < 3; r++)
    for (let b = 0; b < 4; b++) rack.add(box(0.3, 0.3, 0.45, mat(CLOTH[(r * 2 + b) % 6]), 0.05, 0.45 + r * 0.6, -1.05 + b * 0.7));
  at(rack, 9.6, -1.5);
  // vitrina hacia la calle
  add(box(2.4, 0.9, 0.6, M.gold, 8, SLAB + 0.45, 3.1));
  for (let k = 0; k < 3; k++) add(box(0.32, 0.28, 0.32, mat(CLOTH[(k + 3) % 6]), 7.3 + k * 0.7, SLAB + 1.04, 3.1));

  // ---------- Pila de ladrillos dorados ----------
  g.bricks.add(box(2.6, 0.16, 1.8, M.wood, 0, 0.08, 0));
  g.bricks.position.set(-10, 0, 5.2);
  g.bricks.rotation.y = 0.25;
  g.bricks.userData.items = [];
  const BW = 0.55, BH = 0.22, BD = 0.3;
  const brickGeo = new THREE.BoxGeometry(BW - 0.03, BH - 0.02, BD - 0.03);
  for (let i = 0; i < 80; i++) {
    const layer = Math.floor(i / 20);
    const k = i % 20;
    const b = new THREE.Mesh(brickGeo, M.brick);
    b.position.set(-1.1 + (k % 4) * BW + (layer % 2 ? 0.1 : 0) + BW / 2 - 0.05, 0.16 + BH / 2 + layer * BH, -0.75 + Math.floor(k / 4) * BD + BD / 2);
    b.visible = false;
    b.userData.baseY = b.position.y;
    g.bricks.add(b);
    g.bricks.userData.items.push(b);
  }

  // Resalte de sala durante el recorrido
  const hl = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: C.goldLight, transparent: true, opacity: 0, depthWrite: false })
  );
  hl.rotation.x = -Math.PI / 2;
  hl.position.y = SLAB + 0.05;
  root.add(hl);
  g.highlight = hl;

  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o !== grass && o.material !== bpMat && o !== hl && !o.userData.noShadow;
      o.receiveShadow = true;
    }
  });

  const anchors = {
    plano: new THREE.Vector3(-4.2, 0.6, 5.2),
    ventana: new THREE.Vector3(-3.5, SLAB + 1.7, 4.3),
    puerta: new THREE.Vector3(1.5, SLAB + 1.3, 4.3),
    garaje: new THREE.Vector3(8, SLAB + 1.5, 4.3),
  };

  const rooms = {
    recepcion: { x: [-6, 6], z: [0, 4] },
    psicosocial: { x: [-6, 0], z: [-4, 0] },
    legal: { x: [0, 6], z: [-4, 0] },
    taller: { x: [6, 10], z: [-4, 4] },
  };

  return { root, groups: g, anchors, rooms };
}
