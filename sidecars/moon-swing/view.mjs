import * as THREE from 'three';
import { makeBuddy } from '../../lib/buddy3d.mjs?v=gear2';
import { drawBuddy } from '../../lib/buddy2d.mjs?v=gear2';
import { makeBoss } from '../../lib/boss-model.mjs';
import { readBoss, PRESETS } from '../../lib/boss-design.mjs';
import { applyRendererTier, rendererOptions, resolveAutoQuality } from '../../lib/device-tier.mjs?v=low-end1';
import { ANCHOR, RADIUS, hazardsAt, pickupAt } from './logic.mjs';

const FOG = 0x342e34;
const SKY = '#342e34';
const ICE = '#8cecff';
const GOLD = '#ffd888';
const RED = '#ff808a';
const SHAPES = new Set(['circle', 'rectangle', 'square', 'triangle', 'oval', 'hexagon', 'diamond', 'star']);

export function makeView(canvas, backup, labels) {
  const tier = resolveAutoQuality();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 13, 34);
  const camera = new THREE.PerspectiveCamera(57, 1, .1, 80);
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, ...rendererOptions(tier) });
    applyRendererTier(renderer, THREE, tier);
  } catch {
    canvas.hidden = true;
    backup.hidden = false;
  }
  const context = renderer ? null : backup.getContext('2d');
  let w = 1, h = 1, buddy, mirror, kind = 'fox';
  const point = new THREE.Vector3(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ray = new THREE.Raycaster(), cursor = new THREE.Vector2(), hit = new THREE.Vector3();
  const tokenNodes = [];
  let known = null;

  function project(x, y, z) {
    point.set(x, y, z).project(camera);
    return { x: (point.x * .5 + .5) * w, y: (.5 - point.y * .5) * h,
      show: point.z > -1 && point.z < 1 && Math.abs(point.x) < 1.08 && Math.abs(point.y) < 1.08 };
  }
  function pickFloor(clientX, clientY) {
    const rect = (renderer ? canvas : backup).getBoundingClientRect();
    cursor.set((clientX - rect.left) * 2 / w - 1, 1 - (clientY - rect.top) * 2 / h);
    ray.setFromCamera(cursor, camera);
    return ray.ray.intersectPlane(floor, hit) ? { x: hit.x, z: hit.z } : null;
  }
  function resize() {
    w = Math.max(1, labels.clientWidth);
    h = Math.max(1, labels.clientHeight);
    camera.aspect = w / h;
    const dist = Math.max(13.9, 13.3 / camera.aspect);
    camera.position.set(0, 4.8 + dist * .15, dist);
    camera.lookAt(0, 1.65, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (renderer) renderer.setSize(w, h, false);
    else { backup.width = w; backup.height = h; }
  }
  const surfaces = renderer ? buildScene() : null;
  function setBuddy(next) {
    if (buddy && next === kind) return;
    kind = next;
    if (!renderer) return;
    if (buddy) {
      scene.remove(buddy.group);
      if (mirror) scene.remove(mirror.root);
      mirror?.materials.forEach(m => m.dispose());
      buddy.dispose();
    }
    buddy = makeBuddy(THREE, next, { shadow: false });
    scene.add(buddy.group);
    {
      // Mirrored geometry avoids a second scene render or a GPU reflection target.
      const ghost = buddy.group.clone(true);
      const originals = [], copies = [], materials = new Set();
      buddy.group.traverse(o => originals.push(o));
      ghost.traverse(o => {
        copies.push(o);
        if (!o.isMesh) return;
        o.material = new THREE.MeshBasicMaterial({ color: o.material.color ?? 0x7bdbe9,
          transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide });
        materials.add(o.material);
      });
      const root = new THREE.Group();
      root.scale.y = -1;
      root.add(ghost);
      scene.add(root);
      mirror = { root, originals, copies, materials };
    }
  }
  function buildScene() {
    scene.add(new THREE.HemisphereLight(0xd5f9ff, 0x554251, 2.15));
    const key = new THREE.DirectionalLight(0xe6ffff, 2.05);
    key.position.set(1, 7, 5);
    scene.add(key);
    const cyan = new THREE.MeshBasicMaterial({ color: 0x9bf2ff });
    const dim = new THREE.MeshBasicMaterial({ color: 0x537d87 });
    const warm = new THREE.MeshBasicMaterial({ color: 0xffcf7d });
    const red = new THREE.MeshStandardMaterial({ color: 0xe65470, emissive: 0x5b102b, roughness: .75 });
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3e3944, roughness: .39, metalness: .28, transparent: true, opacity: .84, depthWrite: false,
    });
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(45, 45), mat);
    slab.rotation.x = -Math.PI / 2;
    slab.position.y = -.016;
    slab.renderOrder = 2;
    scene.add(slab);
    for (const [r, width, material, y] of [[RADIUS + .15, .026, cyan, .026], [RADIUS + .38, .018, dim, .023],
      [2.5, .014, dim, .022], [4.9, .009, dim, .022]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, width, 4, 80), material);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = y;
      scene.add(ring);
    }
    // Static etched skate lines around the rink, generated locally, never loaded from the demo.
    const lines = [];
    for (let i = 0; i < 34; i++) {
      const a = i * 2.39996, r = 1.3 + (i % 9) * .61;
      lines.push(Math.sin(a) * r, .035, Math.cos(a) * r,
        Math.sin(a + .072) * (r + .15), .035, Math.cos(a + .072) * (r + .15));
    }
    const scratches = new THREE.BufferGeometry();
    scratches.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    scene.add(new THREE.LineSegments(scratches, new THREE.LineBasicMaterial({ color: 0x62737c })));
    const arch = new THREE.Mesh(new THREE.TorusGeometry(.29, .062, 7, 22), cyan);
    arch.position.set(0, ANCHOR.y, 0);
    scene.add(arch);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.085, .085, 7.4), dim);
    arm.position.set(0, ANCHOR.y + .28, -3.64);
    scene.add(arm);
    const column = new THREE.Mesh(new THREE.BoxGeometry(.23, ANCHOR.y + .3, .23), dim);
    column.position.set(0, (ANCHOR.y + .3) / 2, -7.39);
    scene.add(column);
    const lanternGeometry = new THREE.OctahedronGeometry(.24, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i + .5) * Math.PI / 4;
      const lantern = new THREE.Mesh(lanternGeometry, i % 3 ? dim : cyan);
      lantern.position.set(Math.cos(a) * 8, .72, Math.sin(a) * 8);
      scene.add(lantern);
    }
    const wire = new THREE.BufferGeometry();
    wire.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const rope = new THREE.Line(wire, new THREE.LineBasicMaterial({ color: 0xa4f6ff }));
    rope.frustumCulled = false;
    scene.add(rope);
    const meshList = (count, geometry, material) => Array.from({ length: count }, () => {
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      return mesh;
    });
    const gems = meshList(5, new THREE.IcosahedronGeometry(.31, 0), warm);
    const linesGeom = new THREE.BufferGeometry();
    linesGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(30), 3));
    const strings = new THREE.LineSegments(linesGeom, new THREE.LineBasicMaterial({ color: 0x947d55 }));
    strings.frustumCulled = false;
    scene.add(strings);
    const pods = meshList(5, new THREE.TorusGeometry(.32, .058, 6, 18), cyan);
    const hazards = meshList(4, new THREE.DodecahedronGeometry(.60, 0), red);
    const pulse = new THREE.Mesh(new THREE.TorusGeometry(1, .028, 4, 55), red);
    pulse.rotation.x = -Math.PI / 2;
    scene.add(pulse);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(.48, 20),
      new THREE.MeshBasicMaterial({ color: 0x1b171e }));
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    const trackGeom = new THREE.BufferGeometry();
    trackGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(96 * 6), 3));
    const track = new THREE.LineSegments(trackGeom, new THREE.LineBasicMaterial({ color: 0x5e9ea9 }));
    track.frustumCulled = false;
    scene.add(track);
    let n = 0, sampled = -1, lastX = 0, lastZ = 0, lastRun;
    return { draw(run, dt) {
      const p = run.p, time = run.time;
      buddy.group.position.set(p.x, p.y, p.z);
      buddy.group.rotation.y = p.yaw;
      buddy.animate(reduced ? 0 : dt, p.y < .06 ? Math.hypot(p.vx, p.vz) / 6 : .12, reduced ? 0 : time);
      if (mirror) mirror.originals.forEach((o, i) => {
        mirror.copies[i].position.copy(o.position);
        mirror.copies[i].quaternion.copy(o.quaternion);
        mirror.copies[i].scale.copy(o.scale);
      });
      shadow.position.set(p.x, .034, p.z);
      shadow.scale.setScalar(Math.max(.38, 1 - p.y * .11));
      rope.visible = !!p.rope;
      if (p.rope) {
        wire.attributes.position.setXYZ(0, 0, ANCHOR.y, 0);
        wire.attributes.position.setXYZ(1, p.x, p.y + .63, p.z);
        wire.attributes.position.needsUpdate = true;
      }
      if (lastRun !== run) {
        n = 0; sampled = -1; lastX = p.x; lastZ = p.z; lastRun = run;
        trackGeom.setDrawRange(0, 0);
      }
      if (time - sampled > .045) {
        if (p.y < .13 && Math.hypot(p.x - lastX, p.z - lastZ) > .06) {
          const ix = (n++ % 96) * 2;
          trackGeom.attributes.position.setXYZ(ix, lastX, .043, lastZ);
          trackGeom.attributes.position.setXYZ(ix + 1, p.x, .043, p.z);
          trackGeom.attributes.position.needsUpdate = true;
          trackGeom.setDrawRange(0, Math.min(n, 96) * 2);
        }
        lastX = p.x; lastZ = p.z; sampled = time;
      }
      const spin = reduced ? 0 : time;
      for (const [list, source] of [[gems, run.dots], [pods, run.choices]]) {
        list.forEach((mesh, i) => {
          const item = source[i];
          mesh.visible = !!item && !item.taken;
          if (!mesh.visible) return;
          const pt = pickupAt(item, time);
          mesh.position.set(pt.x, pt.y, pt.z);
          mesh.rotation.y = spin * 1.7 + i;
        });
      }
      let ends = 0;
      for (const item of run.dots) if (item.air && !item.taken) {
        const pt = pickupAt(item, time);
        linesGeom.attributes.position.setXYZ(ends++, item.x, item.y + 1.5, item.z);
        linesGeom.attributes.position.setXYZ(ends++, pt.x, pt.y, pt.z);
      }
      linesGeom.setDrawRange(0, ends);
      linesGeom.attributes.position.needsUpdate = true;
      const obstacles = hazardsAt(run);
      hazards.forEach((mesh, i) => {
        const h = obstacles[i];
        mesh.visible = !!h;
        if (h) mesh.position.set(h.x, h.y, h.z);
        mesh.rotation.y = spin * .55 + i;
      });
      const b = run.boss;
      if (b && !this.boss) {
        this.boss = makeBoss(readBoss() || PRESETS.gator);
        scene.add(this.boss.group);
      }
      if (this.boss) this.boss.group.visible = !!b;
      if (b && this.boss) {
        const { lead, segs, spacing } = this.boss;
        const yaw = -b.yaw;
        lead.position.set(b.x, 1, b.z);
        lead.rotation.y = yaw;
        let back = 0;
        segs.forEach(({ group }, i) => {
          back += spacing[i];
          group.position.set(b.x - Math.cos(b.yaw) * back, .86, b.z - Math.sin(b.yaw) * back);
          group.rotation.y = yaw;
        });
        this.boss.animate(spin, b.tell ? .45 : 1, b.tell || b.pulse > 0 ? 1 : 0);
      }
      pulse.visible = !!b && (b.tell || b.pulse > 0);
      if (pulse.visible) {
        pulse.position.set(b.tell ? b.x : b.stompX, .045, b.tell ? b.z : b.stompZ);
        pulse.scale.setScalar(b.tell ? 1.18 : Math.max(.12, 1 - b.pulse / .86) * 4.3);
      }
      renderer.render(scene, camera);
    } };
  }
  function fallback(run) {
    if (!context) return;
    const ctx = context, p = run.p;
    const line = (a, b, color, width = 2) => {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    };
    const dot = (a, radius, color) => {
      ctx.beginPath(); ctx.arc(a.x, a.y, radius, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill();
    };
    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, w, h);
    for (const r of [RADIUS, 4.9, 2.5]) {
      for (let i = 0; i < 64; i++) {
        const a = i * Math.PI / 32, b = (i + 1) * Math.PI / 32;
        line(project(Math.cos(a) * r, 0, Math.sin(a) * r), project(Math.cos(b) * r, 0, Math.sin(b) * r),
          r === RADIUS ? ICE : '#557682');
      }
    }
    for (const item of hazardsAt(run)) dot(project(item.x, item.y, item.z), 10, RED);
    for (const item of run.dots) if (!item.taken) {
      const a = pickupAt(item, run.time);
      dot(project(a.x, a.y, a.z), item.air ? 8 : 6, GOLD);
    }
    const top = project(0, ANCHOR.y, 0), b = run.boss;
    dot(top, 7, ICE);
    if (b) {
      const bp = project(b.x, .5, b.z);
      dot(bp, 15, RED);
      ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#151521'; ctx.textAlign = 'center';
      ctx.fillText('BOSS', bp.x, bp.y + 3);
      if (b.tell || b.pulse > 0) {
        const r = b.tell ? 1.18 : Math.max(.12, 1 - b.pulse / .86) * 4.3;
        const x = b.tell ? b.x : b.stompX, z = b.tell ? b.z : b.stompZ;
        for (let i = 0; i < 32; i++) {
          const a = i * Math.PI / 16, next = a + Math.PI / 16;
          line(project(x + Math.cos(a) * r, 0, z + Math.sin(a) * r),
            project(x + Math.cos(next) * r, 0, z + Math.sin(next) * r), RED);
        }
      }
    }
    if (p.rope) line(top, project(p.x, p.y + .63, p.z), ICE, 3);
    const where = project(p.x, p.y, p.z);
    drawBuddy(ctx, kind, where.x, where.y, 46, { step: reduced ? 0 : run.time * 12 });
  }
  function markLabels(run) {
    if (known !== run.choices) {
      known = run.choices;
      tokenNodes.length = 0;
      labels.replaceChildren();
      for (const item of known) {
        const tag = document.createElement('span');
        tag.className = 'token';
        if (item.fill || SHAPES.has(item.shape)) {
          const shape = document.createElement('i');
          if (SHAPES.has(item.shape)) shape.className = item.shape;
          shape.style.setProperty('--fill', /^#[0-9a-f]{3,8}$/i.test(item.fill) ? item.fill : '#7bd5bd');
          tag.append(shape);
        }
        const word = document.createElement('b');
        word.textContent = item.label;
        tag.append(word);
        labels.append(tag);
        tokenNodes.push(tag);
      }
    }
    run.choices.forEach((item, i) => {
      const pt = pickupAt(item, run.time), a = project(pt.x, pt.y + .50, pt.z);
      const tag = tokenNodes[i];
      tag.hidden = item.taken || !a.show;
      if (!tag.hidden) tag.style.transform = 'translate(' + a.x + 'px,' + a.y + 'px) translate(-50%,-50%)';
    });
  }
  const area = renderer ? canvas : backup;
  resize();
  addEventListener('resize', resize);
  setBuddy('fox');
  return {
    area, setBuddy, pickFloor,
    draw(run, dt) {
      if (renderer) surfaces.draw(run, dt);
      else fallback(run);
      markLabels(run);
    },
  };
}
