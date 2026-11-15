import * as THREE from '../../vendor/three/build/three.module.js?v=r187';
import { buddyKind, makeBuddy } from '../../lib/buddy3d.mjs';
import { resolveAutoQuality, isPerformanceTier } from '../../lib/device-tier.mjs';
import { BARRIERS, GATES, LAP, WIDTH, sampleTrack, rivalAt } from './logic.mjs';

export const PODS = [
  { name: 'Sunburst', body: 0xf2a24a, trim: 0xffe2a0 },
  { name: 'Mint Jet', body: 0x32b2a8, trim: 0xc5ffe3 },
  { name: 'Plum Comet', body: 0xad70c8, trim: 0xffc0f2 }
];

const setTrack = (object, d, offset = 0, y = 0) => {
  const p = sampleTrack(d, offset);
  object.position.set(p.x, y, p.z);
  object.rotation.set(0, p.yaw, 0);
};

function buildPod(scene, paint) {
  const pod = new THREE.Group(), chassis = new THREE.Group();
  pod.add(chassis);
  scene.add(pod);
  const mat = new THREE.MeshStandardMaterial({ color: paint.body, metalness: .32, roughness: .38 });
  const trim = new THREE.MeshStandardMaterial({ color: paint.trim, roughness: .39 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x33334a, roughness: .45, metalness: .36 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x185366, metalness: .4, roughness: .23 });
  const glow = new THREE.MeshBasicMaterial({ color: paint.trim });
  const mesh = (geo, skin, x, y, z) => {
    const part = new THREE.Mesh(geo, skin);
    part.position.set(x, y, z);
    chassis.add(part);
    return part;
  };
  const hull = mesh(new THREE.SphereGeometry(1, 16, 9), mat, 0, .37, -.4);
  hull.scale.set(.92, .44, 1.43);
  mesh(new THREE.BoxGeometry(2.05, .16, .61), trim, 0, .22, -.5);
  mesh(new THREE.BoxGeometry(1.05, .16, .33), glass, 0, .61, .16);
  const jets = [];
  for (const x of [-1.14, 1.14]) {
    for (const [r, length, skin, z] of [
      [.43, 1.72, mat, 1.82], [.48, .24, dark, 2.69], [.33, .13, glow, 2.82],
      [.49, .15, trim, 1.3], [.37, .22, dark, .94]
    ]) {
      mesh(new THREE.CylinderGeometry(r, r, length, 10), skin, x, .43, z).rotation.x = Math.PI / 2;
    }
    const jet = mesh(new THREE.ConeGeometry(.28, 1.1, 9), glow, x, .43, .26);
    jet.rotation.x = -Math.PI / 2;
    jets.push(jet);
    mesh(new THREE.BoxGeometry(.09, .08, 1.55), trim, x * .76, .43, .74).rotation.y = -x * .17;
  }
  const line = mesh(new THREE.BoxGeometry(1.52, .035, .06), glow, 0, .45, 2.12);
  line.rotation.z = .07;
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.75, 16, 10), new THREE.MeshBasicMaterial({
    color: 0x72ffe7, transparent: true, opacity: .14, depthWrite: false
  }));
  shield.scale.set(1, .6, 1.75);
  shield.position.z = .58;
  shield.visible = false;
  pod.add(shield);
  return { pod, chassis, jets, shield, mat, trim, glow, buddy: null };
}

export function createView(host, onLost) {
  const perf = isPerformanceTier(resolveAutoQuality());
  const renderer = new THREE.WebGLRenderer({ antialias: !perf });
  renderer.setPixelRatio(Math.min(devicePixelRatio, perf ? 1 : 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5af79);
  scene.fog = new THREE.FogExp2(0xdd9a78, .006);
  const camera = new THREE.PerspectiveCamera(58, 1, .2, 540);
  scene.add(new THREE.HemisphereLight(0xffedc9, 0x6d384a, 2.15));
  const sun = new THREE.DirectionalLight(0xffdeb0, 2.45);
  sun.position.set(-80, 135, -90);
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0xc57950 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.13;
  scene.add(ground);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(450, 16, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 dir; void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 dir; void main(){
      vec3 n=normalize(dir); float h=smoothstep(-.04,.6,n.y);
      vec3 c=mix(vec3(.97,.62,.44),vec3(.29,.18,.40),h);
      float s=distance(n,normalize(vec3(.18,.22,.56)));
      c+=vec3(.28,.18,.10)*exp(-s*6.)+vec3(.52,.49,.32)*(1.-smoothstep(.080,.084,s));
      gl_FragColor=vec4(c,1.);
    }`
  }));
  sky.renderOrder = -5;
  scene.add(sky);

  // A ribbon wide enough for two pods to pass, with contrasting stripes and warm gravel shoulders.
  const bands = [-WIDTH - 1.6, -WIDTH, -WIDTH + .28, -WIDTH + .38, WIDTH - .38, WIDTH - .28, WIDTH, WIDTH + 1.6];
  const road = [];
  const colors = [];
  const bandColors = [0xc87950, 0xeac181, 0x685058, 0x71545a, 0x684c54, 0xeac181, 0xc87950].map(c => new THREE.Color(c));
  for (let i = 0; i < 460; i++) for (let k = 0; k + 1 < bands.length; k++) {
    const a = i * LAP / 460, b = (i + 1) * LAP / 460;
    const c = bandColors[k].clone().multiplyScalar(.98 + .025 * Math.sin(i * 4.3));
    for (const [t, x] of [[a,k], [b,k], [a,k+1], [a,k+1], [b,k], [b,k+1]]) {
      const p = sampleTrack(t, bands[x]);
      road.push(p.x, 0, p.z);
      colors.push(c.r,c.g,c.b);
    }
  }
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute('position', new THREE.Float32BufferAttribute(road, 3));
  ribbon.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  ribbon.computeVertexNormals();
  scene.add(new THREE.Mesh(ribbon, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide })));
  const dummy = new THREE.Object3D();
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(.13,.026,2.5), new THREE.MeshBasicMaterial({ color: 0xdcae94 }), 100);
  for (let i = 0; i < dash.count; i++) {
    setTrack(dummy, i * LAP / dash.count, 0, .015);
    dummy.updateMatrix();
    dash.setMatrixAt(i, dummy.matrix);
  }
  scene.add(dash);
  const finish = new THREE.Group();
  setTrack(finish, 0, 0, .03);
  for (let i = 0; i < 18; i++) for (let j = 0; j < 2; j++) {
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(1.05,.63),new THREE.MeshBasicMaterial({ color: (i+j)%2 ? 0xfce0a8 : 0x352235 }));
    tile.rotation.x = -Math.PI/2;
    tile.position.set((i-8.5)*1.05, 0, j*.63);
    finish.add(tile);
  }
  scene.add(finish);

  // Faceted mesas sit away from the sampled road, including its tighter bends.
  const centerline = Array.from({length:150},(_,i)=>sampleTrack(i*LAP/150));
  let seed = 1052;
  const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const rockCount = perf ? 510 : 850;
  const rocks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.64, 1, 1, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .95 }), rockCount);
  const strata = [0x8c3f50, 0xad534c, 0xba6650, 0xda8a57, 0xf0a568].map(c=>new THREE.Color(c));
  let idx = 0;
  for (let j = 0; j < 190 && idx < rockCount - 5; j++) {
    const p = sampleTrack(rand() * LAP, (rand()<.5?-1:1) * (19 + rand() * 60));
    const w = 4 + rand() * 13;
    if (centerline.some(q=>Math.hypot(q.x-p.x,q.z-p.z) < WIDTH + w + 3)) continue;
    const h = 4 + rand() * 6, angle = rand() * Math.PI, levels = 2 + Math.floor(rand()*3);
    for (let k=0;k<levels;k++) {
      dummy.position.set(p.x,h*(k*.82+.5)-.25,p.z);
      dummy.rotation.set(0,angle,0);
      dummy.scale.set(w*(1-k*.11),h,w*.72*(1-k*.11));
      dummy.updateMatrix();
      rocks.setMatrixAt(idx,dummy.matrix);
      rocks.setColorAt(idx++,strata[k]);
    }
  }
  rocks.count = idx;
  scene.add(rocks);

  const hazardMat = new THREE.MeshStandardMaterial({ color: 0x9b5449, roughness: 1 });
  const markerMat = new THREE.MeshStandardMaterial({ color: 0xffca72, emissive: 0xef7f38, emissiveIntensity: .16 });
  const barriers = BARRIERS.map(b => {
    const g = new THREE.Group(); setTrack(g,b.d,b.x);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1),hazardMat);
    rock.scale.set(b.r,1.85,b.r*.77);
    rock.position.y=1.1;
    g.add(rock);
    for(const x of [-b.r*.67,b.r*.67]){
      const m=new THREE.Mesh(new THREE.BoxGeometry(.20,1.4,.24),markerMat);
      m.position.set(x,.72,-b.r*.86);g.add(m);
    }
    scene.add(g);return g;
  });

  const gates = GATES.map(d => {
    const g = new THREE.Group(); setTrack(g,d);
    const glow = new THREE.MeshBasicMaterial({ color: 0x7ff6de });
    const frame = new THREE.MeshStandardMaterial({ color: 0x214d55, metalness: .42 });
    const box=(w,h,d,x,y,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,0);g.add(m);};
    for(const x of [-WIDTH+.35,WIDTH-.35]){
      box(.72,5,.67,x,2.5,frame); box(.19,4,.75,x,2.5,glow);
    }
    box(WIDTH*2,.48,.65,0,5,frame);box(WIDTH*2-.34,.16,.72,0,5,glow);
    scene.add(g);
    return {g,glow};
  });

  const player = buildPod(scene,PODS[0]);
  const rivals = [PODS[1],PODS[2],{body:0x677acf,trim:0xc1d3ff}].map(p=>buildPod(scene,p));
  const target = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const shadowGeo = new THREE.CircleGeometry(1,18);
  const shadows = [player,...rivals].map(()=> {
    const m = new THREE.Mesh(shadowGeo,new THREE.MeshBasicMaterial({ color:0x251b2b, transparent:true, opacity:.28, depthWrite:false }));
    m.rotateX(-Math.PI/2);m.scale.set(1.6,2.2,1);scene.add(m);return m;
  });
  const draw = (run, reduced = false) => {
    const list = [run,...rivals.map((_,i)=>rivalAt(i,run.time))];
    [player,...rivals].forEach(({pod,chassis,jets,shield,buddy},i)=>{
      const state = list[i];
      setTrack(pod,state.d,state.x,.42 + (reduced?0:.08*Math.sin(run.time*12+i)));
      chassis.rotation.z = i ? 0 : run.steer*.2;
      shield.visible = i === 0 && run.shield;
      const jet = !i && run.boost ? 1.6 : .5 + Math.min(1,run.speed/70);
      jets.forEach(m=>m.scale.y=jet);
      if (buddy) buddy.animate(0,0,run.time);
      shadows[i].position.set(pod.position.x,.04,pod.position.z);
    });
    barriers.forEach((g,i)=>{ const b=BARRIERS[i]; g.visible=b.d>run.d-38 && b.d<run.d+195; });
    gates.forEach(({g,glow},i)=>{ g.visible=GATES[i]>run.d-25 && GATES[i]<run.d+190; glow.color.set(i<run.gate?0xffd27c:0x7ff6de); });
    const behind = sampleTrack(run.d-10.5,run.x*.76);
    const ahead = sampleTrack(run.d+17,run.x*.3);
    cameraPosition.set(behind.x,5.6,behind.z);
    target.set(ahead.x,1.55,ahead.z);
    camera.position.copy(cameraPosition);
    camera.lookAt(target);
    sky.position.copy(camera.position);
    renderer.render(scene,camera);
  };
  const resize = () => {
    const w=host.clientWidth,h=host.clientHeight;
    if (!w||!h) return;
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
  };
  new ResizeObserver(resize).observe(host);resize();
  return {
    setPod(i) { const p=PODS[i];player.mat.color.set(p.body);player.trim.color.set(p.trim);player.glow.color.set(p.trim); },
    setBuddy(kind) {
      const k=buddyKind(kind);
      if (player.buddy?.kind===k) return;
      if(player.buddy){player.chassis.remove(player.buddy.group);player.buddy.dispose();}
      const buddy=makeBuddy(THREE,k,{shadow:false});
      buddy.group.scale.setScalar(.67);buddy.group.position.set(0,.44,-.53);
      player.chassis.add(buddy.group);
      player.buddy=buddy;
    },
    draw
  };
}
