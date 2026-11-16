import * as THREE from 'three';
import { makeBuddy } from '../../lib/buddy3d.mjs?v=gear2';
import { drawBuddy } from '../../lib/buddy2d.mjs?v=gear2';
import { BOSS_EMOJI } from '../../lib/boss-design.mjs';
import { makeBoss } from '../../lib/boss-model.mjs';
import { strokeAt } from './logic.mjs';
import { makeInkSurface } from './ink-surface.mjs';

const UNIT = 12;
const INK = { clean: '#7beeff', wobble: '#ff739c', gold: '#ffca72' };
const pos = p => ({ x: p.x / UNIT, z: p.z / UNIT });

function placeBoss(rig, sample, s) {
  function place(part, at) {
    const p = sample(at);
    part.position.set(p.x / UNIT, .53, p.z / UNIT);
    part.rotation.y = -Math.atan2(p.dz, p.dx);
  }
  place(rig.lead, s);
  let back = 0;
  rig.segs.forEach(({ group }, i) => {
    back += rig.spacing[i] * UNIT * .76;
    place(group, s - back);
  });
}

function buildNib() {
  const nib = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.07, .185, 2.1, 18), new THREE.MeshStandardMaterial({
    color: '#8fdbe9', metalness: .55, roughness: .24
  }));
  body.position.y = 1.48;
  const foot = new THREE.Mesh(new THREE.ConeGeometry(.185, .46, 18), new THREE.MeshStandardMaterial({
    color: '#152531', metalness: .49, roughness: .28
  }));
  foot.rotation.x = Math.PI;
  foot.position.y = .205;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(.194, .197, .1, 18), new THREE.MeshStandardMaterial({
    color: '#dfedf2', metalness: .45, roughness: .22
  }));
  ring.position.y = .49;
  const shine = new THREE.Mesh(new THREE.CircleGeometry(.34, 24), new THREE.MeshBasicMaterial({
    color: INK.clean, transparent: true, opacity: .45, depthWrite: false
  }));
  shine.rotation.x = -Math.PI / 2;
  shine.position.y = .018;
  nib.add(body, ring, foot);
  return { nib, shine, body };
}

function make3D(canvas, surface, preview, renderer) {
  const scene = new THREE.Scene();
  const stage = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(47, 1, .1, 280);
  const portrait = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const focus = new THREE.Vector3();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const pointer = new THREE.Vector2(), ray = new THREE.Raycaster(), hit = new THREE.Vector3();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 1, h = 1, rig, previewing = false, hero, lastTrail, lastSample;
  const objects = new Map();
  const ink = makeInkSurface(renderer);
  const cameraCenter = new THREE.Vector3();
  const tint = new THREE.Color();
  const viewFloor = new THREE.Color('#25232a');
  scene.add(ink.mesh);
  function lights(target) {
    target.add(new THREE.HemisphereLight('#edf7fb', '#464252', 2.04));
    const key = new THREE.DirectionalLight('#fff0e3', 2.28);
    key.position.set(-15, 22, 17);
    target.add(key);
    const rim = new THREE.DirectionalLight('#8fcaff', .8);
    rim.position.set(10, 4, -10);
    target.add(rim);
  }
  lights(scene);
  lights(stage);
  const { nib, shine, body } = buildNib();
  scene.add(nib, shine);

  const geometry = {
    dot: new THREE.IcosahedronGeometry(.63, 1),
    disk: new THREE.CircleGeometry(1, 42),
    shade: new THREE.CircleGeometry(1, 32)
  };
  const shadow = new THREE.Mesh(geometry.shade, new THREE.MeshBasicMaterial({
    color: '#0d0c16', transparent: true, opacity: .3, depthWrite: false
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.08, .83, 1);
  shadow.position.y = .025;
  scene.add(shadow);

  const glow = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 64, height: 64 }));
  const ctx = glow.image.getContext('2d');
  const g = ctx.createRadialGradient(32,32,3,32,32,32);
  g.addColorStop(0,'#fff'); g.addColorStop(.35,'#ffffff85'); g.addColorStop(1,'#fff0');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,64,64);

  function updateObjects(run, time) {
    const active = new Set(run.objects);
    for (const [item, group] of objects) if (!active.has(item) || item.used) {
      group.removeFromParent();
      group.traverse(o => o.material?.dispose());
      objects.delete(item);
    }
    for (const item of run.objects) {
      if (item.used) continue;
      if (!objects.has(item)) {
        const group = new THREE.Group();
        const pure = item.type === 'dot';
        const base = new THREE.Mesh(geometry.disk, new THREE.MeshBasicMaterial({
          color: pure ? '#ffcf79' : '#a26bc5', transparent: true,
          opacity: pure ? .68 : .83, map: glow, depthWrite: false
        }));
        base.rotation.x = -Math.PI / 2;
        base.scale.setScalar(pure ? 2.2 : 3.2);
        base.position.y = .024;
        group.position.set(item.x / UNIT, 0, item.z / UNIT);
        group.add(base);
        if (pure) {
          const gem = new THREE.Mesh(geometry.dot, new THREE.MeshStandardMaterial({
            color: '#ffd385', emissive: '#6d2e07', roughness: .38
          }));
          gem.scale.y = 1.3;
          group.add(gem);
        } else for (let i = 0; i < 5; i++) {
          const lobe = new THREE.Mesh(geometry.disk, new THREE.MeshBasicMaterial({
            color: '#da8dde', transparent: true, opacity: .63, map: glow, depthWrite: false
          }));
          lobe.rotation.x = -Math.PI / 2;
          lobe.position.set(Math.cos(i * 2.4) * 1.31, .029 + .001 * i, Math.sin(i * 2.4) * 1.4);
          lobe.scale.set(1.26, .87, 1);
          group.add(lobe);
        }
        objects.set(item, group);
        scene.add(group);
      }
      const o = objects.get(item);
      if (item.type === 'dot') {
        o.children[1].position.y = .94 + Math.sin(time * 3 + item.x) * .22;
        o.children[1].rotation.y = time * 1.1;
      }
    }
  }

  function resize() {
    w = Math.max(1, canvas.clientWidth);
    h = Math.max(1, canvas.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(1.35, devicePixelRatio || 1));
    renderer.setSize(w, h, false);
  }

  function targetPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((clientX - rect.left) / w * 2 - 1, 1 - (clientY - rect.top) / h * 2);
    ray.setFromCamera(pointer, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return null;
    return { x: hit.x * UNIT, z: hit.z * UNIT };
  }

  function setBoss(design) {
    rig?.dispose();
    rig = makeBoss(design);
    rig.group.scale.setScalar(.76);
    (previewing ? stage : scene).add(rig.group);
  }

  function setPreview(on) {
    previewing = on;
    surface.classList.toggle('previewing', on);
    if (rig) (on ? stage : scene).add(rig.group);
  }

  function paintPreview(time) {
    const rect = preview.getBoundingClientRect();
    const card = preview.closest('.card').getBoundingClientRect();
    const top = Math.max(0, rect.top, card.top);
    const bottom = Math.min(h, rect.bottom, card.bottom);
    renderer.setScissorTest(false);
    renderer.setClearColor(0,0);
    renderer.clear();
    if (!rig || bottom <= top || rect.width <= 0) return;
    let offset = 0;
    rig.lead.position.set(0,0,0);
    rig.lead.rotation.y = 0;
    rig.head.rotation.y = 0;
    rig.segs.forEach(({ group },i) => {
      offset += rig.spacing[i] * .76;
      group.position.set(-offset,0,0);
      group.rotation.y = 0;
    });
    rig.animate(time,.7);
    const box = new THREE.Box3().setFromObject(rig.group);
    box.getCenter(focus);
    const size = box.getSize(new THREE.Vector3());
    const zoom = Math.max(size.x * rect.height / rect.width, size.y, size.z) * 2.44;
    portrait.aspect = rect.width / rect.height;
    portrait.updateProjectionMatrix();
    portrait.position.set(focus.x + zoom * .24, focus.y + zoom * .31, focus.z + zoom);
    portrait.lookAt(focus);
    renderer.setViewport(rect.left,h-rect.bottom,rect.width,rect.height);
    renderer.setScissor(rect.left,h-bottom,rect.width,bottom-top);
    renderer.setScissorTest(true);
    renderer.render(stage,portrait);
    renderer.setScissorTest(false);
    renderer.setViewport(0,0,w,h);
  }

  function paint(run, buddy, clock, drawing, dt, running) {
    const time = reduced ? 0 : clock;
    if (previewing) { paintPreview(time); return; }
    renderer.setClearColor(viewFloor,1);
    if (hero?.kind !== buddy) {
      hero?.dispose();
      hero = makeBuddy(THREE, buddy, { shadow: false });
      hero.group.scale.setScalar(1.88);
      scene.add(hero.group);
    }
    const a = pos(run.buddy), b = pos(run.trail.at(-1));
    if (lastTrail !== run.trail) {
      ink.reset();
      lastTrail = run.trail;
      lastSample = null;
      cameraCenter.set(a.x,0,a.z);
    }
    // Keep the view facing the same direction. It pans only when buddy or pen leaves the center.
    const desiredX = a.x + (b.x - a.x) * .42 + 4.4;
    const desiredZ = a.z + (b.z - a.z) * .42;
    const reach = Math.min(1, w / h);
    const pan = 1 - Math.exp(-dt * 4.3);
    const soften = (delta, dead) => Math.sign(delta) * Math.max(0, Math.abs(delta) - dead);
    cameraCenter.x += soften(desiredX - cameraCenter.x, 2.1 * reach) * pan;
    cameraCenter.z += soften(desiredZ - cameraCenter.z, 2.3 * reach) * pan;
    const zoom = Math.max(1, Math.min(1.55, .97 / reach));
    camera.position.set(cameraCenter.x + 1.8 * zoom, 25 * zoom, cameraCenter.z + 18 * zoom);
    camera.lookAt(cameraCenter);
    camera.updateMatrixWorld();

    const trail = run.trail, strokes = [];
    const first = Math.max(1, lastSample ? trail.lastIndexOf(lastSample) + 1 : 1);
    for (let i = first; i < trail.length; i++) {
      const p = trail[i-1], q = trail[i];
      if (q.ink) strokes.push([pos(p.ink ? p : q), { ...pos(q), style: q.style, age: q.age, pressure: q.pressure }]);
    }
    if (strokes.length || (running && dt > 0)) ink.frame(a, b, strokes, reduced || !running ? 0 : Math.min(dt,.06), time);
    lastSample = trail.at(-1);
    hero.group.position.set(a.x, 0, a.z);
    hero.group.rotation.y = Math.atan2(run.buddy.dx, run.buddy.dz);
    hero.animate(dt, running && run.moving && !reduced ? (run.buddy.ink ? .88 : .55) : 0, time);
    shadow.position.x = a.x;
    shadow.position.z = a.z;
    if (rig) {
      placeBoss(rig, s => strokeAt(trail, s), run.distance - run.gap);
      rig.animate(time, 1, run.gap < 50 ? .75 : 0);
    }
    nib.position.set(b.x,.012,b.z);
    nib.rotation.x = run.pen.dz * .24;
    nib.rotation.z = -run.pen.dx * .25;
    shine.position.set(b.x,.018,b.z);
    shine.visible = drawing;
    const color = run.wobble ? INK.wobble : run.boost ? INK.gold : INK.clean;
    body.material.color.set(color);
    shine.material.color.copy(tint.set(color));
    updateObjects(run,time);
    renderer.render(scene,camera);
  }
  resize();
  addEventListener('resize', resize);
  return { paint, setBoss, setPreview, targetPoint };
}

function makeFallback(canvas, preview) {
  const ctx = canvas.getContext('2d');
  let w, h, ratio, design;
  const center = { x: 0, z: 0 };
  const at = p => ({ x: w*.45+(p.x-center.x)*ratio, y: h*.5+(p.z-center.z)*ratio });
  function resize() {
    w = canvas.width = canvas.clientWidth;
    h = canvas.height = canvas.clientHeight;
    ratio = Math.max(.55,Math.min(1.16,w/670));
  }
  resize();
  addEventListener('resize', resize);
  return {
    setBoss(next) { design = next; },
    setPreview(on) { preview.textContent = on ? BOSS_EMOJI[design?.head] : ''; },
    targetPoint(x,y) {
      const rect = canvas.getBoundingClientRect();
      return { x: center.x+(x-rect.left-w*.45)/ratio, z: center.z+(y-rect.top-h*.5)/ratio };
    },
    paint(run, buddy, time, drawing, dt, running) {
      if (!w || !h) return;
      center.x = run.buddy.x;
      center.z = run.buddy.z;
      ctx.fillStyle = '#302b34';
      ctx.fillRect(0,0,w,h);
      ctx.lineCap = 'round';
      for (let i=1;i<run.trail.length;i++) {
        const p=run.trail[i-1], q=run.trail[i];
        if (!q.ink) continue;
        const a=at(p.ink?p:q), b=at(q);
        ctx.globalAlpha=Math.max(.13,1-Math.max(0,run.distance-q.s)/590);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=INK[q.style];ctx.lineWidth=q.style==='gold'?9:5;ctx.stroke();
      }
      ctx.globalAlpha=1;
      for (const item of run.objects) if (!item.used) {
        const p=at(item);ctx.beginPath();ctx.arc(p.x,p.y,item.type==='wash'?19:7,0,Math.PI*2);
        ctx.fillStyle=item.type==='wash'?'#8e527b':'#ffd385';ctx.fill();
      }
      const lead=at(run.buddy), boss=at(strokeAt(run.trail,run.distance-run.gap)), pen=at(run.trail.at(-1));
      ctx.font='36px system-ui';ctx.textAlign='center';
      ctx.fillText(BOSS_EMOJI[design?.head]||'🐛',boss.x,boss.y);
      drawBuddy(ctx,buddy,lead.x,lead.y,58,{ step: running ? time*14 : 0 });
      ctx.fillText('🖋',pen.x+9,pen.y);
    }
  };
}

export function makeView(canvas, surface, preview) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas: surface, alpha: true, antialias: true });
    surface.dataset.render = '3d';
    return make3D(canvas, surface, preview, renderer);
  } catch {
    surface.hidden = true;
    return makeFallback(canvas,preview);
  }
}
