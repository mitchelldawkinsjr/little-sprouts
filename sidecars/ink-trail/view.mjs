import * as THREE from 'three';
import { drawBuddy } from '../../lib/buddy2d.mjs?v=gear2';
import { BOSS_EMOJI } from '../../lib/boss-design.mjs';
import { makeBoss } from '../../lib/boss-model.mjs';
import { PEN_AHEAD, strokeAt } from './logic.mjs';

const swatches = {
  clean: ['81,224,241', '161,249,253'],
  gold: ['248,174,84', '255,235,168'],
  wobble: ['235,112,164', '255,193,196']
};
const paper = document.createElement('canvas');
paper.width = paper.height = 128;
const texture = paper.getContext('2d');
const grains = texture.createImageData(128, 128);
for (let i = 0; i < grains.data.length; i += 4) {
  const noise = Math.imul((i >>> 2) + 1, 0x45d9f3b);
  const random = Math.imul(noise ^ (noise >>> 16), 0x45d9f3b) >>> 0;
  const light = (random & 1) !== 0;
  grains.data.set([light ? 214 : 29, light ? 233 : 48, light ? 238 : 66, ((random >>> 8) % 26) + 4], i);
}
texture.putImageData(grains, 0, 0);

export function makeView(canvas, creatures, preview) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width, height, scale, anchor, top, span, paperFill, grain;
  let design, rig, previewBounds, showingPreview = false;
  let renderer, scene, camera;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: creatures, alpha: true, antialias: true });
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(0, 1, 0, -1, 0.1, 1000);
    camera.position.z = 440;
    scene.add(new THREE.HemisphereLight('#e6f9ff', '#686286', 2.2));
    const light = new THREE.DirectionalLight('#fff1d7', 2);
    light.position.set(-1, 2, 4);
    scene.add(light);
  } catch { renderer = null; }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    scale = Math.max(0.49, Math.min(1.38, width / 900));
    anchor = Math.min(width * 0.38, width * 0.28 + 55);
    top = Math.min(90, height * 0.24);
    span = Math.max(50, height - top - 24);
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paperFill = ctx.createRadialGradient(width * .52, height * .33, 10, width * .5, height * .48, Math.max(width, height) * .65);
    paperFill.addColorStop(0, '#364153');
    paperFill.addColorStop(.6, '#202b3a');
    paperFill.addColorStop(1, '#111821');
    grain = ctx.createPattern(paper, 'repeat');
    if (!renderer) return;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.right = width;
    camera.bottom = -height;
    camera.updateProjectionMatrix();
  }

  function setBoss(next) {
    design = next;
    rig?.dispose();
    if (!renderer) return;
    rig = makeBoss(design);
    rig.lead.rotation.y = -.23;
    let offset = 0;
    rig.segs.forEach(({ group }, i) => {
      offset += rig.spacing[i];
      group.position.set(-offset, 0, 0);
    });
    const bounds = new THREE.Box3().setFromObject(rig.group);
    previewBounds = { size: bounds.getSize(new THREE.Vector3()), center: bounds.getCenter(new THREE.Vector3()) };
    scene.add(rig.group);
  }

  function setPreview(on) {
    showingPreview = on;
    creatures.classList.toggle('previewing', on);
    if (!renderer) {
      preview.textContent = on && design ? BOSS_EMOJI[design.head] : '';
      preview.style.fontSize = '48px';
    }
  }

  const screenX = (x, distance) => anchor + (x - distance) * scale;
  const screenY = y => top + y * span;
  const targetY = clientY => Math.max(.12, Math.min(.86, (clientY - canvas.getBoundingClientRect().top - top) / span));

  function ellipse(x, y, rx, ry, fill, rotate = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotate, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function background(distance) {
    ctx.fillStyle = paperFill;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, width, height);
    // Fine paper fibers and glints drift past much more slowly than the wet ink.
    for (let i = 0; i < 38; i++) {
      const x = ((i * 167 - distance * .1) % (width + 40) + width + 40) % (width + 40);
      const y = (i * 103.27) % height;
      ctx.fillStyle = i % 3 ? '#a6daeb20' : '#e3effb3a';
      ctx.fillRect(x, y, i % 5 + 1, 1);
    }
  }

  function stroke(points, distance, time, style) {
    const [rgb, core] = swatches[style];
    const spread = Math.max(.8, scale);
    const last = points.at(-1).x;
    for (let layer = 0; layer < 5; layer++) {
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const { x, y } = points[i];
        const age = Math.min(1, Math.max(0, (distance + PEN_AHEAD - x) / 330));
        const ruffle = layer === 0 || layer === 1 ? 0 :
          Math.sin(x / (13 + layer * 4) + time * .7) * spread * (3 + 14 * age) * (layer % 2 ? -1 : 1);
        const py = screenY(y) + ruffle;
        if (i === 0) ctx.moveTo(screenX(x, distance), py);
        else ctx.lineTo(screenX(x, distance), py);
      }
      const alpha = Math.min(1, Math.max(.23, 1 - (distance - last) / 560));
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.strokeStyle = layer === 1 ? `rgba(${core},${.9 * alpha})` : `rgba(${rgb},${[.18, 0, .095, .1, .12][layer] * alpha})`;
      ctx.lineWidth = spread * [16, 3.4, 25, 13, 7][layer];
      ctx.stroke();
    }
    for (const point of points) {
      if (point.x % 25 !== 0) continue;
      const p = Math.sin(point.x * .17);
      const life = Math.min(1, Math.max(0, (distance + PEN_AHEAD - point.x) / 250));
      const y = screenY(point.y) + p * 27 * life;
      ellipse(screenX(point.x, distance), y, 1.5 + Math.abs(p) * 3.5, 1 + life * 2.1, `rgba(${rgb},.23)`, p);
    }
  }

  function drawStroke(run, time) {
    let batch = [];
    for (const sample of run.trail) {
      if (!sample.ink || (batch.length && batch[0].style !== sample.style)) {
        if (batch.length) stroke(batch, run.distance, time, batch[0].style);
        batch = sample.ink && batch.length ? [batch.at(-1)] : [];
      }
      if (sample.ink) {
        // Preserve the previous endpoint at a color change without changing the new style.
        if (batch.length === 1 && batch[0].style !== sample.style) batch[0] = { ...batch[0], style: sample.style };
        batch.push(sample);
      }
    }
    if (batch.length) stroke(batch, run.distance, time, batch[0].style);
  }

  function drawPen(run, drawing, aim) {
    const x = screenX(run.distance + PEN_AHEAD, run.distance);
    const y = screenY(run.trail.at(-1).y);
    const rgb = swatches[run.wobble ? 'wobble' : run.boost ? 'gold' : 'clean'][1];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((aim - run.penY) * .75);
    if (drawing) ellipse(0, 2, 13, 6, `rgba(${rgb},.24)`);
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.lineTo(2, -12);
    ctx.lineTo(22, -37);
    ctx.lineTo(28, -32);
    ctx.lineTo(8, -7);
    ctx.closePath();
    ctx.fillStyle = drawing ? `rgb(${rgb})` : '#b4c9d0';
    ctx.fill();
    ctx.strokeStyle = '#324b60';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawObjects(run, time) {
    for (const item of run.objects) {
      if (item.used) continue;
      const x = screenX(item.x, run.distance);
      if (x < -40 || x > width + 40) continue;
      const y = screenY(item.y);
      if (item.type === 'wash') {
        const r = Math.max(13, span * .105);
        const bloom = ctx.createRadialGradient(x, y, r * .12, x, y, r);
        bloom.addColorStop(0, '#c67edb60');
        bloom.addColorStop(.64, '#a866bc43');
        bloom.addColorStop(1, '#ab6ec800');
        ellipse(x, y, r, r, bloom);
        for (let i = 0; i < 4; i++) ellipse(x + Math.sin(i * 2.4) * r * .55, y + Math.cos(i * 2.4) * r * .44, r * .24, r * .12, '#d583df37', i);
        ellipse(x, y, 5, 4, '#d083dd9c');
      } else {
        const bob = reduce ? 0 : Math.sin(item.x + time * 3) * 2;
        ellipse(x, y + bob, 15, 15, '#ffd58d2e');
        ellipse(x, y + bob, 7.5, 9, '#ffdb83');
        ellipse(x - 2, y + bob - 3, 2.6, 2.6, '#fff5c8');
      }
    }
  }

  function drawBoss(run, time) {
    const x = run.distance - run.gap;
    if (!renderer) {
      if (showingPreview) {
        preview.textContent = BOSS_EMOJI[design?.head];
      } else {
        ctx.font = '38px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(BOSS_EMOJI[design?.head] || '🐛', screenX(x, run.distance), screenY(strokeAt(run.trail, x).y) - 4);
      }
      return;
    }
    const foot = Math.max(12, 24 * scale);
    const lift = 21 * Math.max(.72, scale);
    if (showingPreview || renderer.getScissorTest()) {
      renderer.setScissorTest(false);
      renderer.clear();
    }
    if (showingPreview) {
      const rect = preview.getBoundingClientRect();
      const card = preview.closest('.card').getBoundingClientRect();
      const shownTop = Math.max(rect.top, card.top, 0);
      const shownBottom = Math.min(rect.bottom, card.bottom, height);
      if (shownBottom <= shownTop || rect.width <= 7) return;
      renderer.setScissor(rect.left, height - shownBottom, rect.width, shownBottom - shownTop);
      renderer.setScissorTest(true);
      const bounds = previewBounds;
      const { size, center } = bounds;
      const unit = Math.min(29, (rect.width - 7) / Math.max(2, size.x), (rect.height - 6) / Math.max(2, size.y));
      rig.group.position.set(rect.left + rect.width / 2 - center.x * unit, -(rect.top + rect.height / 2) - center.y * unit, 0);
      rig.group.scale.setScalar(unit);
      rig.lead.position.set(0, 0, 0);
      rig.lead.rotation.y = -.23;
      rig.lead.rotation.z = 0;
      let offset = 0;
      rig.segs.forEach(({ group }, i) => {
        offset += rig.spacing[i];
        group.position.set(-offset, 0, 0);
        group.rotation.z = 0;
      });
    } else {
      rig.group.position.set(0, 0, 0);
      rig.group.scale.setScalar(foot);
      rig.lead.rotation.y = -.21;
      const place = (part, px) => {
        const y = screenY(strokeAt(run.trail, px).y);
        part.position.set(screenX(px, run.distance) / foot, (lift - y) / foot, 0);
        const slope = screenY(strokeAt(run.trail, px + 14).y) - screenY(strokeAt(run.trail, px - 14).y);
        part.rotation.z = -Math.atan2(slope, 28 * scale) * .42;
      };
      place(rig.lead, x);
      let offset = 0;
      rig.segs.forEach(({ group }, i) => {
        offset += rig.spacing[i] * foot / scale;
        place(group, x - offset);
      });
    }
    rig.animate(reduce ? 0 : time, showingPreview ? .6 : 1, !showingPreview && run.gap < 50 ? .75 : 0);
    renderer.render(scene, camera);
  }

  function paint(run, buddy, time, drawing, aim) {
    if (!width || !height || !design) return;
    const motion = reduce ? 0 : time;
    background(run.distance);
    drawObjects(run, motion);
    drawStroke(run, motion);
    const buddyHeight = Math.max(49, 84 * scale);
    drawBuddy(ctx, buddy, anchor, screenY(run.buddyY) + (run.onInk ? 2 : 6), buddyHeight, {
      step: motion * 14, shadow: false, squash: run.onInk ? 0 : .23
    });
    drawPen(run, drawing, aim);
    drawBoss(run, motion);
  }

  resize();
  addEventListener('resize', resize);
  return { paint, resize, setBoss, setPreview, targetY };
}
