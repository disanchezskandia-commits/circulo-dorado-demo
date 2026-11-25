import * as THREE from 'three';
import gsap from 'gsap';
import { buildHouse, SLAB } from './house.js';

// Encuadres de cámara: posición + punto al que mira.
const SHOTS = {
  exterior: { pos: [15, 12, 30], target: [2, 1.4, 1.5] },
  terreno: { pos: [2, 24, 19], target: [2, 0, 0] },
  planos: { pos: [2, 24, 5], target: [2, 0, 0] },
  obra: { pos: [18, 13, 20], target: [2, 1, 0] },
  recepcion: { pos: [0, 12, 10.5], target: [0, 0.5, 2] },
  psicosocial: { pos: [-3, 15, 4.5], target: [-3, 0.5, -1.6] },
  legal: { pos: [3, 15, 4.5], target: [3, 0.5, -1.6] },
  taller: { pos: [8, 16, 6.5], target: [8, 0.5, 0] },
  avance: { pos: [-2, 17, 19], target: [0, 0, 1] },
};

// Estado de la casa por etapa del recorrido.
const HOUSE_STATE = {
  complete: { lot: 0, slab: 1, blueprint: 0, walls: 1, front: 1, roof: 1, furniture: 1, garage: 0 },
  terreno: { lot: 1, slab: 0, blueprint: 0, walls: 0, front: 0, roof: 0, furniture: 0, garage: 0 },
  planos: { lot: 1, slab: 1, blueprint: 1, walls: 0, front: 0, roof: 0, furniture: 0, garage: 0 },
  obra: { lot: 0, slab: 1, blueprint: 0, walls: 1, front: 1, roof: 0, furniture: 0, garage: 0 },
  interior: { lot: 0, slab: 1, blueprint: 0, walls: 1, front: 0.12, roof: 0, furniture: 1, garage: 1 },
};

const TOUR_STEP_STATE = {
  terreno: 'terreno',
  planos: 'planos',
  obra: 'obra',
  recepcion: 'interior',
  psicosocial: 'interior',
  legal: 'interior',
  taller: 'interior',
  avance: 'interior',
};

export function createWorld(canvas, { signText }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false; // sin sombras: más liviano para HubSpot/móvil
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe6eddc, 42, 95);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const target = new THREE.Vector3(2, 1.5, 0);
  camera.position.set(20, 12, 24);

  scene.add(new THREE.HemisphereLight(0xfff6e2, 0x5f8f4a, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3);
  sun.position.set(14, 22, 12);
  sun.target.position.set(2, 0, 0);
  sun.castShadow = false;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const house = buildHouse({ signText });
  scene.add(house.root);
  const G = house.groups;

  // ---- Estado de cámara ----
  const view = { orbit: true, orbitAngle: 0.6, shiftX: 0.2, shiftY: 0, parallaxX: 0, parallaxY: 0 };
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function isPortrait() {
    return window.innerWidth / window.innerHeight < 1;
  }

  // En pantallas verticales alejamos la cámara para que quepa la casa.
  function framed(shot) {
    const t = new THREE.Vector3(...shot.target);
    const p = new THREE.Vector3(...shot.pos);
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1.2) {
      const k = 1 + (1.2 - aspect) * 1.25;
      p.sub(t).multiplyScalar(k).add(t);
    }
    return { p, t };
  }

  function moveTo(name, duration = 1.8) {
    view.orbit = false;
    const { p, t } = framed(SHOTS[name]);
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(target);
    gsap.to(camera.position, { x: p.x, y: p.y, z: p.z, duration, ease: 'power2.inOut' });
    gsap.to(target, { x: t.x, y: t.y, z: t.z, duration, ease: 'power2.inOut' });
  }

  function setShift(x, y, duration = 1.4) {
    gsap.to(view, { shiftX: x, shiftY: y, duration, ease: 'power2.inOut' });
  }

  // ---- Estado de la casa ----
  const fade = (group, v, d) => {
    const mats = group.userData.fadeMats || [];
    const max = group.userData.maxOpacity || [];
    if (v > 0) group.visible = true;
    mats.forEach((m, i) => gsap.to(m, { opacity: v * (max[i] ?? 1), duration: d }));
    if (v === 0) gsap.delayedCall(d, () => { if (mats.every((m) => m.opacity < 0.01)) group.visible = false; });
  };
  const scaleY = (group, v, d, delay = 0) => {
    if (v > 0.01) group.visible = true;
    gsap.to(group.scale, {
      y: Math.max(v, 0.001),
      duration: d,
      delay,
      ease: v > group.scale.y ? 'back.out(1.2)' : 'power2.in',
      onComplete: () => { if (v <= 0.01) group.visible = false; },
    });
  };
  let furnitureOn = true;
  function setFurniture(on, d) {
    if (on === furnitureOn) return;
    furnitureOn = on;
    const kids = G.furniture.children;
    gsap.killTweensOf(kids.map((k) => k.scale));
    if (on) {
      G.furniture.visible = true;
      kids.forEach((k) => k.scale.setScalar(0.001));
      gsap.to(kids.map((k) => k.scale), { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.012, delay: d * 0.4 });
    } else {
      gsap.to(kids.map((k) => k.scale), { x: 0.001, y: 0.001, z: 0.001, duration: 0.3, stagger: 0.004, onComplete: () => { if (!furnitureOn) G.furniture.visible = false; } });
    }
  }
  let roofOn = true;
  function setRoof(on, d) {
    if (on === roofOn) return;
    roofOn = on;
    gsap.killTweensOf(G.roof.position);
    if (on) {
      G.roof.visible = true;
      gsap.to(G.roof.position, { y: 0, duration: d, ease: 'power2.out' });
      fade(G.roof, 1, d * 0.8);
    } else {
      gsap.to(G.roof.position, { y: 7, duration: d, ease: 'power2.in' });
      fade(G.roof, 0, d);
    }
  }

  function setHouse(stateName, d = 1.1) {
    const s = HOUSE_STATE[stateName];
    fade(G.lot, s.lot, d);
    scaleY(G.slab, s.slab, d * 0.7);
    fade(G.blueprint, s.blueprint, d);
    scaleY(G.walls, s.walls, d, s.walls > G.walls.scale.y ? 0.2 : 0);
    scaleY(G.frontWalls, s.front, d, s.front > G.frontWalls.scale.y ? 0.25 : 0);
    setRoof(!!s.roof, d);
    setFurniture(!!s.furniture, d);
    scaleY(G.garageDoor, s.front === 1 ? 1 : 0, d * 0.8, s.front === 1 ? 0.25 : 0);
  }

  function highlightRoom(id) {
    const hl = G.highlight;
    const r = house.rooms[id];
    gsap.killTweensOf(hl.material);
    if (!r) {
      gsap.to(hl.material, { opacity: 0, duration: 0.4 });
      return;
    }
    hl.scale.set(r.x[1] - r.x[0] - 0.3, r.z[1] - r.z[0] - 0.3, 1);
    hl.position.x = (r.x[0] + r.x[1]) / 2;
    hl.position.z = (r.z[0] + r.z[1]) / 2;
    hl.material.opacity = 0;
    gsap.to(hl.material, { opacity: 0.35, duration: 0.8, delay: 1, yoyo: true, repeat: 3, ease: 'sine.inOut' });
  }

  // ---- Ladrillos ----
  function setBricks(count, goal, animateLast = false) {
    const items = G.bricks.userData.items;
    const shown = Math.max(1, Math.min(items.length, Math.round((count / goal) * items.length)));
    items.forEach((b, i) => (b.visible = i < shown));
    if (animateLast) {
      const b = items[shown - 1];
      b.position.y = b.userData.baseY + 6;
      gsap.to(b.position, { y: b.userData.baseY, duration: 0.9, ease: 'bounce.out', delay: 0.3 });
    }
  }

  // ---- Hotspots proyectados ----
  const projected = [];
  function track(el, worldPos) {
    projected.push({ el, worldPos });
  }

  // ---- API de alto nivel ----
  function intro() {
    setHouse('complete');
    view.orbit = true;
    setShift(isPortrait() ? 0 : 0.2, isPortrait() ? -0.18 : 0);
  }
  function exterior() {
    setHouse('complete');
    setShift(0, 0);
    moveTo('exterior');
  }
  function tourStep(id) {
    setHouse(TOUR_STEP_STATE[id] || 'interior');
    setShift(isPortrait() ? 0 : -0.13, isPortrait() ? 0.16 : 0);
    moveTo(id, 2);
    highlightRoom(id);
  }

  // ---- Bucle ----
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (view.orbit) {
      view.orbitAngle += dt * 0.12;
      const r = isPortrait() ? 40 : 28;
      camera.position.set(2 + Math.sin(view.orbitAngle) * r, isPortrait() ? 16 : 12, Math.cos(view.orbitAngle) * r);
      target.set(2, 1.4, 0);
    }
    view.parallaxX += (pointer.x - view.parallaxX) * 0.04;
    view.parallaxY += (pointer.y - view.parallaxY) * 0.04;
    camera.lookAt(target);
    camera.rotateY(-view.parallaxX * 0.015);
    camera.rotateX(-view.parallaxY * 0.01);

    camera.setViewOffset(w, h, -view.shiftX * w, -view.shiftY * h, w, h);

    // platoneras caminando y potrillo en el río
    (G.env.userData.walkers || []).forEach((p) => {
      p.position.x += p.userData.walk * dt;
      if (p.position.x > 30) p.position.x = -26;
      if (p.position.x < -26) p.position.x = 30;
      p.position.y = 0.06 + Math.abs(Math.sin(t * 6 + p.userData.bob)) * 0.04;
    });
    const boat = G.env.userData.boat;
    if (boat) {
      boat.position.x = -6 + Math.sin(t * 0.08) * 14;
      boat.position.y = 0.05 + Math.sin(t * 1.4) * 0.03;
      boat.rotation.z = Math.sin(t * 1.1) * 0.03;
    }
    G.furniture.children.forEach((o) => {
      if (o.userData.isPerson) o.children.forEach((c, i) => i >= 2 && (c.position.y += Math.sin(t * 2 + o.userData.bob) * 0.0008));
    });

    renderer.render(scene, camera);

    for (const { el, worldPos } of projected) {
      tmp.copy(worldPos).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w;
      const y = (-tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.style.visibility = tmp.z > 1 ? 'hidden' : '';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { intro, exterior, tourStep, setBricks, track, anchors: house.anchors };
}
