import * as THREE from 'three';
import { Level } from '../src/world/level.js';
import { PaintSystem } from '../src/world/paint.js';
import { createLevelMaterial } from '../src/world/levelMaterial.js';
import { makePaintMission, paintMissions, paintTile } from './rules.mjs';
import { button, node, hint, panel } from './lesson.mjs';
const pitch=2.7;
let render,scene,camera,paint,board,marked,mode='menu',target=paintMissions[0],first=true;
let note,progress,submit,undoMode,turn;
const root=document.querySelector('#app'), buttons=node('div','','court-keys');root.append(buttons);
buttons.hidden=true;
const width=()=>target.columns*pitch, depth=()=>target.rows*pitch;
const point=i=>new THREE.Vector3((i%target.columns+.5)*pitch-width()/2,.037,(Math.floor(i/target.columns)+.5)*pitch-depth()/2);
function inkTile(i){
  if(!paint)return;
  const level=paint.level, original=level.queryBlocks;
  level.queryBlocks=(_x0,_z0,_x1,_z1,ids)=>{ids.length=0;ids.push(i);return ids;};
  try{paint.splat(point(i),1.74,0,{seed:.35+i*.213});}
  finally{level.queryBlocks=original;}
}
const paintAt=i=>{
  if(!board||mode!=='play')return;
  if(!paintTile(marked,i,target.columns*target.rows,!undoMode))return;
  if(undoMode){paint?.clear();for(const id of marked)inkTile(id);}else inkTile(i);
  update();
};
function update(){
  const n=target.columns*target.rows;
  for(let i=0;i<n;i++){
    const el=buttons.children[i];el.setAttribute('aria-pressed',String(marked.has(i)));
    el.classList.toggle('filled',marked.has(i));el.textContent=marked.has(i)?'●':String(i+1);
  }
  hint(progress,marked.size+' of '+n+' painted'+(mode==='play'?' · '+Math.round(marked.size/n*100)+'%':''));
  if(submit)submit.disabled=marked.size===0;
}
function initGraphics(){
  if(render)return true;
  try{
    render=new THREE.WebGLRenderer({antialias:true});
    render.setPixelRatio(Math.min(devicePixelRatio,1.45));
    render.setClearColor(0x173545);
    render.domElement.className='court-canvas';
    root.prepend(render.domElement);
    scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-8,8,8,-8,.1,100);
    scene.add(new THREE.HemisphereLight(0xe9faff,0x639683,2.4));
    const sun=new THREE.DirectionalLight(0xffecd0,2.1);sun.position.set(-7,17,8);scene.add(sun);
    window.addEventListener('resize',resize);
    let last=performance.now();
    const frame=t=>{requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000);last=t;
      if(scene&&paint){paint.flush(dt);render.render(scene,camera);project();}
    };requestAnimationFrame(frame);
    return true;
  }catch(e){root.classList.add('flat');render=null;return false;}
}
function resize(){
  if(!render)return;
  const w=innerWidth,h=innerHeight,ar=w/h;
  render.setSize(w,h);
  const panel=innerWidth>680?180:0;
  camera.position.set(-.06,20,.03);camera.up.set(0,0,-1);camera.lookAt(0,0,0);
  const view=Math.max(7.45,8.2/ar);
  camera.left=-view*ar;camera.right=view*ar;camera.bottom=-view;camera.top=view;
  camera.clearViewOffset();
  if(panel)camera.setViewOffset(w,h,-panel*.52,0,w,h);
  else camera.setViewOffset(w,h,0,-Math.min(h*.2,125),w,h);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();project();
}
function project(){
  if(!render||!board)return;
  const w=innerWidth,h=innerHeight;
  for(let i=0;i<buttons.children.length;i++){
    const p=point(i).project(camera), b=buttons.children[i];
    b.style.left=((p.x+1)*w/2)+'px';b.style.top=((1-p.y)*h/2)+'px';
  }
}
function clearMesh(object){
  if(!object)return;
  scene.remove(object);object.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
}
function makeBoard(){
  const graphics=initGraphics();const c=target.columns,r=target.rows;
  if(graphics){
    clearMesh(board);paint?.rt.dispose();paint?.geo.dispose();paint?.mat.dispose();
    const halfW=width()/2,halfD=depth()/2;
    const blocks=Array.from({length:c*r},(_,i)=>{
      const a=point(i),d=pitch/2-.045;
      return {kind:'box',min:[a.x-d,-.45,a.z-d],max:[a.x+d,0,a.z+d],color:i%2===0?'#e3eee2':'#d0e5e7',tag:'court'};
    });
    const layout={bounds:{minX:-halfW,maxX:halfW,minZ:-halfD,maxZ:halfD},spawnPads:[[0,0,0],[0,0,0]],spawnBarrier:0,half:[],single:blocks};
    const level=new Level(layout);paint=new PaintSystem(render,level,{atlasSize:1024,maxDensity:17,cell:.23});
    board=new THREE.Group();
    const tileMat=createLevelMaterial(paint.texture,paint.size,null,{paint});
    board.add(new THREE.Mesh(level.buildGeometry(paint.size),tileMat));
    const tray=new THREE.Mesh(new THREE.BoxGeometry(width()+.6,.45,depth()+.6),new THREE.MeshStandardMaterial({color:'#23566b',roughness:.78}));
    tray.position.y=-.58; board.add(tray);
    scene.add(board);
  }else{board={};}
  buttons.hidden=false;buttons.replaceChildren();
  for(let i=0;i<c*r;i++){const b=button(String(i+1),()=>paintAt(i));b.setAttribute('aria-label','Paint tile '+(i+1));buttons.append(b);}
  buttons.style.setProperty('--court-columns',c);
  if(graphics){for(const i of marked)inkTile(i);resize();}
  update();
}
const ui=panel({title:'Paint the Plan',icon:'🎨',instructions:'Paint equal tiles on the practice court. Tap each tile to spray it. Use the eraser to revise your plan. No opponents can erase your work here.',
  mission(u){
    mode='play';target=makePaintMission(u.level);marked=new Set(Array.from({length:target.pre},(_,i)=>i));undoMode=false;first=true;
    ui.body.replaceChildren(node('h2','Coverage goal'),node('p',target.goal));
    progress=node('p','','ls-status');progress.setAttribute('aria-live','polite');
    note=node('p','A tile counts just once.','ls-status');note.setAttribute('aria-live','polite');
    const eraser=button('Eraser off',()=>{undoMode=!undoMode;eraser.textContent=undoMode?'Eraser on':'Eraser off';eraser.setAttribute('aria-pressed',String(undoMode));});
    submit=button('Check the court',()=>{
      if(marked.size!==target.target){first=false;hint(note,marked.size<target.target?'You need more coverage. Paint more tiles.':'You passed the goal. Erase some tiles.');return;}
      mode='done';if(!render)buttons.hidden=true;
      const n=target.columns*target.rows;ui.finish(target.done||(marked.size+' of '+n+' equal tiles are painted.'),{attempts:1,firstRight:Number(first)});
    },'ls-primary');
    const free=button('Free match ↗',()=>go());
    ui.body.append(progress,note,eraser,submit,button('Hear goal',()=>ui.say(target.goal)),free);makeBoard();ui.say(target.goal);
  },free(){go();}});
ui.bar.querySelectorAll('button')[1].addEventListener('click',()=>{buttons.hidden=true;mode='menu';});
function go(){location.href=new URL('./turf-riot.html',location.href);}
