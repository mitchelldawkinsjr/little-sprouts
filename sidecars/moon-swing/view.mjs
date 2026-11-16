import * as THREE from 'three';
import { makeBuddy } from '../../lib/buddy3d.mjs?v=gear2';
import { drawBuddy } from '../../lib/buddy2d.mjs?v=gear2';
import { makeBoss } from '../../lib/boss-model.mjs';
import { readBoss, PRESETS } from '../../lib/boss-design.mjs';
import { applyRendererTier, rendererOptions, resolveAutoQuality } from '../../lib/device-tier.mjs?v=low-end1';
import { RADIUS, hazardsAt, pickupAt } from './logic.mjs';
import { makeIce } from './ice.mjs';
import { makeIceMotion } from './motion.mjs';

const FOG = 0x332e32;
const SKY = '#332e32';
const ICE_FLOOR = 0x353840;
const ICE = '#8cecff';
const GOLD = '#ffd888';
const RED = '#ff808a';
const SHAPES = new Set(['circle', 'rectangle', 'square', 'triangle', 'oval', 'hexagon', 'diamond', 'star']);

export function makeView(canvas, backup, labels) {
  const tier = resolveAutoQuality();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 12, 30);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 85);
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, ...rendererOptions(tier) });
    applyRendererTier(renderer, THREE, tier);
  } catch {
    canvas.hidden = true;
    backup.hidden = false;
  }
  const context = renderer ? null : backup.getContext('2d');
  let w = 1, h = 1, buddy, kind = 'fox';
  const motion = makeIceMotion(reduced);
  const ice = renderer ? makeIce(renderer, scene, camera, tier, { floor: ICE_FLOOR, fog: FOG, ice: ICE }) : null;
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
    // The pen's camera, (0, 4, 8) looking at the center, scaled out to frame this larger rink.
    const k = Math.max(1.6, 1.2 / camera.aspect);
    camera.position.set(0, 4 * k, 8 * k);
    camera.lookAt(0, 0, 0);
    scene.fog.near = 13 * k;
    scene.fog.far = 20 * k;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (renderer) { renderer.setSize(w, h, false); ice.resize(w, h); }
    else { backup.width = w; backup.height = h; }
  }
  const surfaces = renderer ? buildScene() : null;
  function setBuddy(next) {
    if (buddy && next === kind) return;
    kind = next;
    if (!renderer) return;
    if (buddy) { scene.remove(buddy.group); buddy.dispose(); }
    buddy = makeBuddy(THREE, next, { shadow: false,
      material: color => new THREE.MeshToonMaterial({ color }) });
    buddy.group.scale.setScalar(1.19);
    scene.add(buddy.group);
  }
  function buildScene() {
    scene.add(new THREE.HemisphereLight(0xb8d7ed, 0x54414c, 1.58));
    const key = new THREE.DirectionalLight(0xd6f6ff, 2);
    key.position.set(-4, 8, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8cecff, 2.3);
    rim.position.set(2, 3, -8);
    scene.add(rim);
    const cyan = new THREE.MeshBasicMaterial({ color: 0x9bf2ff });
    const dim = new THREE.MeshBasicMaterial({ color: 0x537d87 });
    const warm = new THREE.MeshToonMaterial({ color: 0xffa85f, emissive: 0x622919, emissiveIntensity: .38 });
    const red = new THREE.MeshStandardMaterial({ color: 0xe65470, emissive: 0x5b102b, roughness: .75 });
    // Keep the outer guide readable without turning the ice into a bright, concentric grid.
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x6b9aa4, transparent: true, opacity: .54 });
    const boundary = new THREE.Mesh(new THREE.TorusGeometry(RADIUS + .1, .019, 5, 104), rimMaterial);
    boundary.rotation.x = -Math.PI / 2;
    boundary.position.y = .019;
    scene.add(boundary);
    const lanternGeometry = new THREE.OctahedronGeometry(.24, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i + .5) * Math.PI / 4;
      const lantern = new THREE.Mesh(lanternGeometry, i % 3 ? dim : cyan);
      lantern.position.set(Math.cos(a) * 8, .72, Math.sin(a) * 8);
      scene.add(lantern);
    }
    const wire = new THREE.BufferGeometry();
    wire.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const leash = new THREE.Line(wire, new THREE.LineDashedMaterial({ color: 0x7beeff, dashSize: .2, gapSize: .1 }));
    leash.frustumCulled = false;
    scene.add(leash);
    const meshList = (count, geometry, material) => Array.from({ length: count }, () => {
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      return mesh;
    });
    const gems = meshList(5, new THREE.OctahedronGeometry(.37), warm);
    for (const gem of gems) gem.scale.set(.69, 1.15, .69);
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
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(.53, 24),
      new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
        vertexShader: 'varying vec2 vSpot; void main(){ vSpot=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'varying vec2 vSpot; void main(){ float a=1.0-smoothstep(0.0,0.5,length(vSpot-0.5)); gl_FragColor=vec4(0.02,0.016,0.027,a*0.42); }',
      }));
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    const trackGeom = new THREE.BufferGeometry();
    trackGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(68 * 6), 3));
    trackGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(68 * 6), 3));
    const track = new THREE.LineSegments(trackGeom,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .64 }));
    track.frustumCulled = false;
    scene.add(track);
    const sparkleGeometry = new THREE.BufferGeometry();
    sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(56 * 3), 3));
    sparkleGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(56 * 3), 3));
    const sparkle = new THREE.Points(sparkleGeometry, new THREE.PointsMaterial({
      size: .09, vertexColors: true, transparent: true, opacity: .86, depthWrite: false
    }));
    sparkle.frustumCulled = false;
    scene.add(sparkle);
    const scratchColor = new THREE.Color(ICE);
    const glowColor = new THREE.Color(GOLD);
    const stoneColor = new THREE.Color(ICE_FLOOR);
    const tint = new THREE.Color();
    return { draw(run, dt, effects) {
      const p = run.p, time = run.time;
      buddy.group.position.set(p.x, p.y, p.z);
      buddy.group.rotation.y = p.yaw + p.spin;
      buddy.animate(reduced ? 0 : dt, p.y < .06 ? Math.hypot(p.vx, p.vz) / 6 : .12, reduced ? 0 : time);
      shadow.position.set(p.x, .034, p.z);
      shadow.scale.setScalar(Math.max(.38, 1 - p.y * .11));
      wire.attributes.position.setXYZ(0, p.tx, .2, p.tz);
      wire.attributes.position.setXYZ(1, p.x, p.y, p.z);
      wire.attributes.position.needsUpdate = true;
      leash.computeLineDistances();
      effects.marks.forEach((mark, i) => {
        const edge = i * 2;
        trackGeom.attributes.position.setXYZ(edge, mark.x, .024, mark.z);
        trackGeom.attributes.position.setXYZ(edge + 1, mark.toX, .024, mark.toZ);
        tint.copy(stoneColor).lerp(scratchColor, Math.max(0, .53 - (time - mark.t) * .16));
        for (const v of [edge, edge + 1]) trackGeom.attributes.color.setXYZ(v, tint.r, tint.g, tint.b);
      });
      trackGeom.setDrawRange(0, 2 * effects.marks.length);
      trackGeom.attributes.position.needsUpdate = trackGeom.attributes.color.needsUpdate = true;
      effects.sparks.forEach((spark, i) => {
        sparkleGeometry.attributes.position.setXYZ(i, spark.x, spark.y, spark.z);
        tint.copy(stoneColor).lerp(spark.gold ? glowColor : scratchColor, spark.strength);
        sparkleGeometry.attributes.color.setXYZ(i, tint.r, tint.g, tint.b);
      });
      sparkleGeometry.setDrawRange(0, effects.sparks.length);
      sparkleGeometry.attributes.position.needsUpdate = sparkleGeometry.attributes.color.needsUpdate = true;
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
      ice.capture(run);
      renderer.render(scene, camera);
    } };
  }
  // Perspective Canvas presentation for devices without WebGL. It uses the same camera,
  // world positions, trails and reward bursts; reflections are projected silhouettes.
  const etches = Array.from({ length: 128 }, (_, i) => {
    const a = i * 2.399963, radius = .28 + (i * 171 % 293) / 39;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    const tilt = a * .4 + .33;
    const length = .10 + (i % 7) * .065;
    return { x, z, dx: Math.cos(tilt) * length, dz: Math.sin(tilt) * length, soft: i % 4 };
  });
  function fallback(run, effects) {
    if (!context) return;
    const ctx = context, p = run.p, t = run.time;
    const line = (a, b, color, width = 1) => {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    };
    const polygon = (pts, color, border) => {
      ctx.beginPath();
      pts.forEach(({ x, y }, i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      if (border) { ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke(); }
    };
    const oval = (a, rx, ry, color) => {
      ctx.beginPath(); ctx.ellipse(a.x, a.y, rx, ry, 0, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill();
    };
    const glow = (a, r, color) => {
      const light = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r);
      light.addColorStop(0, color);
      light.addColorStop(1, 'transparent');
      oval(a, r, r, light);
    };
    const ring = (x, y, z, r, color, width) => {
      let a = project(x + r, y, z);
      for (let i = 1; i <= 96; i++) {
        const turn = i * Math.PI / 48;
        const b = project(x + Math.cos(turn) * r, y, z + Math.sin(turn) * r);
        line(a, b, color, width); a = b;
      }
    };
    const sx = w / 480, ratio = Math.max(.52, Math.min(1.35, h / 390, sx));
    const spot = project(-1.4, 0, 1.7);
    const sheen = ctx.createRadialGradient(spot.x, spot.y - 5, 3, spot.x, spot.y - 5, Math.max(w * .79, h * .86));
    sheen.addColorStop(0, '#53636c');
    sheen.addColorStop(.30, '#414850');
    sheen.addColorStop(.73, SKY);
    sheen.addColorStop(1, '#29262b');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
    const hover = project(0, 0, 0);
    ctx.save();
    ctx.globalAlpha = .55;
    oval(hover, Math.max(5, w * .46), Math.max(3, h * .24), 'rgba(108,140,149,.18)');
    ctx.restore();
    ring(0, .002, 0, RADIUS + .10, 'rgba(132,180,190,.38)', 1.2 * ratio);
    for (const scratch of etches) {
      line(project(scratch.x, .003, scratch.z), project(scratch.x + scratch.dx, .003, scratch.z + scratch.dz),
        scratch.soft ? 'rgba(159,188,195,.13)' : 'rgba(166,220,226,.25)');
    }
    for (const mark of effects.marks) {
      ctx.save(); ctx.globalAlpha = Math.max(.09, .70 - (t - mark.t) * .19);
      line(project(mark.x, .005, mark.z), project(mark.toX, .005, mark.toZ), ICE, 1.4 * ratio);
      ctx.restore();
    }
    const hero = project(p.x, p.y, p.z), ghost = project(p.x, -p.y, p.z);
    const ground = project(p.x, 0, p.z);
    const buddySize = 61 * ratio * Math.max(.82, Math.min(1.15, 1 + p.z * .031));
    ctx.save();
    ctx.translate(ghost.x, ghost.y); ctx.scale(1, -.66);
    drawBuddy(ctx, kind, 0, 0, buddySize, { alpha: .23, shadow: false, step: reduced ? 0 : t * 12 });
    ctx.restore();
    oval(ground, (16 - Math.min(6, p.y)) * ratio, 4.3 * ratio, 'rgba(19,24,29,.50)');
    const hazards = hazardsAt(run);
    for (const item of hazards) {
      const a = project(item.x, item.y, item.z), shadow = project(item.x, 0, item.z);
      const r = (9.2 + item.z * .23) * ratio;
      oval(shadow, r * 1.25, r * .31, 'rgba(32,20,32,.58)');
      glow(a, r * 2.5, 'rgba(213,58,99,.23)');
      polygon([{ x: a.x - r, y: a.y + r * .35 }, { x: a.x - r * .54, y: a.y - r * .68 },
        { x: a.x + r * .17, y: a.y - r * .93 }, { x: a.x + r, y: a.y + r * .31 }, { x: a.x + r * .41, y: a.y + r * .64 }],
      '#a64667', '#f4829b');
      polygon([{ x: a.x - r, y: a.y + r * .35 }, { x: a.x + r * .17, y: a.y - r * .93 },
        { x: a.x + r * .27, y: a.y + r * .14 }], '#da668b');
    }
    const b = run.boss;
    if (b) {
      if (b.tell || b.pulse > 0) {
        const r = b.tell ? 1.18 : Math.max(.12, 1 - b.pulse / .86) * 4.3;
        ring(b.tell ? b.x : b.stompX, .009, b.tell ? b.z : b.stompZ, r, RED, 2.8 * ratio);
      }
      const a = project(b.x, .50, b.z);
      const d = 14 * ratio;
      const sign = Math.cos(b.yaw) >= 0 ? 1 : -1;
      const at = (x, y) => ({ x: a.x + x * d * sign, y: a.y + y * d });
      oval(project(b.x, 0, b.z), d * 1.54, d * .35, 'rgba(19,24,29,.55)');
      polygon([at(-1.5, .28), at(-.68, -.43), at(.36, -.55), at(.71, -.23), at(1.42, -.06),
        at(1.63,.28), at(1.27, .62), at(.12, .73), at(-.78, .59)], '#663b59', '#f0809d');
      polygon([at(-.3,-.28), at(.32,-.49), at(.45,-.11), at(1.48,.07), at(1.17,.28), at(.33,.37)], '#d5718d');
      line(at(.27, .36), at(1.48,.30), '#352431', 1.2);
      oval(at(.28, -.21), 2.2 * ratio, 2.6 * ratio, '#fff0cb');
      oval(at(.34, -.21), 1 * ratio, 1.3 * ratio, '#201926');
      ctx.font = 'bold 8px system-ui'; ctx.fillStyle = '#faaaae'; ctx.textAlign = 'center';
      ctx.fillText('BOSS', a.x, a.y - d - 4);
    }
    for (const item of run.dots) if (!item.taken) {
      const point = pickupAt(item, t);
      const a = project(point.x, point.y, point.z);
      const mirror = project(point.x, -point.y, point.z);
      const r = (item.air ? 7.7 : 6.4) * ratio;
      oval(mirror, 1.6 * r, .35 * r, 'rgba(235,152,86,.24)');
      if (item.air) line(project(item.x, item.y + 1.5, item.z), a, 'rgba(221,168,108,.47)');
      glow(a, r * 2.6, 'rgba(255,163,74,.34)');
      polygon([{ x: a.x, y: a.y - r * 1.35 }, { x: a.x + r * .8, y: a.y - r * .16 },
        { x: a.x, y: a.y + r * 1.28 }, { x: a.x - r * .8, y: a.y - r * .16 }], '#f0a757', '#ffd78b');
      polygon([{ x: a.x, y: a.y - r * 1.35 }, { x: a.x - r * .8, y: a.y - r * .16 },
        { x: a.x, y: a.y + r * 1.28 }], '#ffe099');
    }
    ctx.save();
    ctx.setLineDash([5 * ratio, 2.5 * ratio]);
    line(project(p.tx, .2, p.tz), hero, ICE, 1.4 * ratio);
    ctx.restore();
    drawBuddy(ctx, kind, hero.x, hero.y, buddySize, { shadow: false, step: reduced ? 0 : t * 12 });
    for (const spark of effects.sparks) {
      const a = project(spark.x, spark.y, spark.z);
      ctx.save(); ctx.globalAlpha = spark.strength;
      oval(a, (spark.gold ? 2.3 : 1.25) * ratio, (spark.gold ? 1.8 : 1.1) * ratio, spark.gold ? GOLD : ICE);
      ctx.restore();
    }
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
    burst: run => motion.burst(run, 'pickup'),
    draw(run, dt) {
      const effects = motion.frame(run);
      if (renderer) surfaces.draw(run, dt, effects);
      else fallback(run, effects);
      markLabels(run);
    },
  };
}
