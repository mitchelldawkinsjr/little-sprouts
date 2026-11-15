import { button, node, hint, hold, panel } from './lesson.mjs';
import { makeFishingMission } from './rules.mjs';
let trip=makeFishingMission(), samples=trip.samples;
import { FISH, fishLengthCm } from './FishTable.js';
import { CatchMinigame } from './CatchMinigame.js';
import { habitatAt, pickSpecies, rollWeight } from './Bites.js';
const canvas=document.querySelector('#water'),ctx=canvas.getContext('2d');
const view=document.querySelector('#water-status');
const landTime=.7;
const positions={pier:[.59,.58],reef:[.79,.51]};
let at='pier',cursor={pier:0,reef:0},level=0,phase='menu',elapsed=0,timer=0,sample=null,fight=null,log=[],holdReel=false,firstRight=1,free=false,notice,plan,measure,cast,hook,reel,pier,reef,records,coverage;
let last=0;
function onReset(){trip=makeFishingMission();samples=trip.samples;phase='idle';at='pier';cursor={pier:0,reef:0};timer=0;sample=null;fight=null;log=[];holdReel=false;firstRight=1;}
function castLine(){
  if(!['idle','caught'].includes(phase))return;
  const seq=samples[at];
  if(free){
    const h=at==='pier'?habitatAt({depth:4,pierDist:1,reefDist:64}):habitatAt({depth:7,pierDist:55,reefDist:-8});
    const id=pickSpecies(h,13) || 'grunt';
    const found=Object.values(samples).flat().find(f=>f.species===id);
    sample={species:id,kg:rollWeight(id),marks:found?.marks||'distinct markings',at};
  }else sample={...seq[cursor[at]++%seq.length],at};
  phase='cast';timer=0;sync('Line out. Watch the bobber.');
}
function hookFish(){
  if(phase!=='bite')return;
  const shortLine=level===0&&!free?3.5:level===1&&!free?4.5:5.5;
  fight=new CatchMinigame({species:sample.species,kg:sample.kg,lineKg:free?13:22,reelSpeed:2.5,distance:shortLine});
  phase='fight';holdReel=false;
  sync('Fish on! Hold Reel to bring it in.');
}
function sync(message){
  if(!notice)return;
  hint(notice,message);hint(view,phase==='bite'?'A fish is biting at the '+at+'.':message);
  cast.disabled=!['idle','caught'].includes(phase);
  hook.disabled=phase!=='bite';
  reel.disabled=phase!=='fight';
  pier.disabled=!['idle','caught'].includes(phase);
  reef.disabled=pier.disabled||(!free&&level<2);
  pier.setAttribute('aria-pressed',String(at==='pier'));reef.setAttribute('aria-pressed',String(at==='reef'));
  measure.hidden=free||level===0||!readyForReview();
}
function readyForReview(){return level===1?log.length>=2:['pier','reef'].every(s=>log.filter(f=>f.at===s).length>=2);}
const clue=[
  'Find a fish with blue stripes. Keep every catch in your journal, then tag the fish that matches.',
  'Catch two fish from the pier. Measure them on the same ruler and choose the longer fish.',
  'Make at least two catches at the pier and two at the reef. Use your own notes to decide where to look for another striped fish.'
];
const ui=panel({title:'Field Guide Fishing',icon:'🐟',instructions:'Cast a line, wait for the bobber to dip, hook the fish, then reel it in. Every catch goes into your journal.',
  mission(u){free=false;level=u.level;onReset();show();ui.say(clueNow());},
  free(){free=true;level=0;onReset();ui.body.hidden=false;ui.bar.querySelector('button').textContent='Hide';show();}});
ui.bar.querySelectorAll('button')[1].addEventListener('click',()=>{phase='menu';holdReel=false;fight=null;});
function clueNow(){return level===0?'Find a fish with '+trip.want+'. Keep every catch in your journal, then tag the fish that matches.':clue[level];}
function show(){
  ui.body.replaceChildren(node('h2',free?'Free fishing': 'Field mission'),node('p',free?'Choose the pier or reef and see what bites.':'📓 '+clueNow()));
  const places=node('div','','ls-actions'),actions=node('div','','ls-actions');
  pier=button('Pier',()=>{at='pier';sync('Now fishing from the pier.');});
  reef=button('Reef',()=>{at='reef';sync('Now fishing over the reef.');});
  places.append(pier,reef);
  cast=button('Cast',castLine,'ls-primary');hook=button('Hook',hookFish,'ls-primary');
  reel=hold(button('Hold Reel',()=>{}),()=>{holdReel=true;},()=>{holdReel=false;});
  actions.append(cast,hook,reel);
  notice=node('p','Ready to cast.','ls-status');notice.setAttribute('aria-live','polite');
  records=node('div','','field-journal'); records.setAttribute('aria-label','Catch journal');
  coverage=node('div');
  measure=button('',review,'ls-primary');
  measure.textContent=level===1?'Compare lengths':'Compare habitats';
  ui.body.append(places,actions,notice,measure,coverage,records);
  if(!free)ui.body.append(button('Hear mission',()=>ui.say(clueNow())));
  ui.body.append(button('Full Tidewater world ↗',()=>{location.href=new URL('./tidewater-coast.html',location.href);}));
  sync('Ready to cast.');
}
function caught(){
  const f={...sample,cm:Math.round(fishLengthCm(sample.species,sample.kg))};log.push(f);
  phase='caught';fight=null;holdReel=false;
  sync('New catch: '+FISH[f.species].name+'. Added to your journal.');
  const title=node('strong',FISH[f.species].name), card=node('div','','field-entry');
  const picture=node('span',undefined,'fish-chip');
  picture.dataset.mark=f.marks;
  picture.setAttribute('aria-label',f.marks);
  card.append(picture,title,node('p',f.at+' · '+f.cm+' cm · '+f.marks));
  if(!free&&level===0)card.append(button('Tag this catch',()=>{
    if(f.marks===trip.want){phase='done';ui.finish('You spotted the '+trip.want+' on the '+FISH[f.species].name+'.',{attempts:1,firstRight});}
    else{firstRight=0;sync('That one stays in your journal. Look for '+trip.want+' on another catch.');}
  }));
  records.prepend(card);
  if(level===2)hint(coverage,'Pier: '+log.filter(f=>f.at==='pier').length+' · Reef: '+log.filter(f=>f.at==='reef').length);
  ui.progress(log.length+' catches logged');
}
function review(){
  if(!readyForReview())return;
  phase='review';holdReel=false;
  ui.body.replaceChildren(node('h2',level===1?'Measure both catches':'Compare your samples'));
  const status=node('p','','ls-status');status.setAttribute('aria-live','polite');
  if(level===1){
    const pair=log.slice(0,2),scale=Math.ceil(Math.max(...pair.map(f=>f.cm))/10)*10;
    const longest=Math.max(...pair.map(f=>f.cm));
    ui.body.append(node('p','Both rulers start at zero and go to '+scale+' cm. Which fish is longer?'));
    pair.forEach(f=>{
      const ruler=node('div','','ls-ruler');
      const mark=node('span');mark.style.width=(f.cm/scale*100)+'%';ruler.append(mark);
      ui.body.append(node('p',FISH[f.species].name+' · '+f.cm+' cm'),ruler,button('Choose '+FISH[f.species].name,()=>{
        if(f.cm!==longest){firstRight=0;hint(status,'Line up the beginnings. Which bar reaches farther?');return;}
        phase='done';ui.finish(FISH[f.species].name+' reached '+f.cm+' cm, '+(longest-Math.min(...pair.map(f=>f.cm)))+' cm longer.',{attempts:1,firstRight});
      }));
    });
  }else{
    const vals=['pier','reef'].map(s=>{
      const group=log.filter(f=>f.at===s).slice(0,2);
      return {s,n:group.filter(f=>f.marks.includes('stripe')).length};
    });
    ui.body.append(node('p','Compare the first two fish from each spot. Where did you find more fish with stripes?'));
    for(const r of vals){
      ui.body.append(node('p',r.s.toUpperCase()+': '+r.n+' striped of two'),button('Try the '+r.s,()=>{
        if(r.n<Math.max(...vals.map(v=>v.n))){firstRight=0;hint(status,'Compare the striped counts again.');return;}
        at=r.s;phase='done';ui.finish('You chose the '+r.s+' using your own sample. Two catches are a clue, not proof about every fish.',{attempts:1,firstRight});
      }));
    }
  }
  ui.body.append(status);
}
function frame(now){
  const dt=Math.min(.05,(now-last||0)/1000);last=now;elapsed+=dt;timer+=dt;
  if(phase==='cast'&&timer>=landTime){phase='wait';timer=0;sync('Now wait for the bobber to dip.');}
  if(phase==='wait'&&timer>=1.2){phase='bite';timer=0;sync('The bobber dipped! Tap Hook.');}
  if(phase==='fight'){
    const result=fight.update(dt,holdReel);
    if(result==='caught')caught();
    else if(result!=='fighting'){cursor[at]=Math.max(0,cursor[at]-1);phase='idle';holdReel=false;fight=null;sync('The fish swam off. Cast again to try the same sample.');}
    else if(holdReel) hint(notice,'Reeling · '+fight.distance.toFixed(1)+' m of line out');
  }
  draw();requestAnimationFrame(frame);
}
function draw(){
  const w=canvas.width,h=canvas.height,p=(x,y)=>[x*w,y*h];
  const line=(ax,ay,bx,by)=>{ctx.beginPath();ctx.moveTo(...p(ax,ay));ctx.lineTo(...p(bx,by));ctx.stroke();};
  const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#f8dca6');grad.addColorStop(.43,'#c3ecd5');grad.addColorStop(.44,'#5acbbd');grad.addColorStop(1,'#17656f');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#fff3bf';ctx.beginPath();ctx.arc(...p(.82,.28),h*.065,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#82bba7';ctx.beginPath();ctx.moveTo(...p(0,.44));for(const [x,y] of [[.12,.30],[.2,.37],[.3,.27],[.41,.37],[.47,.44]])ctx.lineTo(...p(x,y));ctx.fill();
  for(let j=0;j<18;j++){
    const y=.47+j*.029;
    for(let k=0;k<8;k++){const x=(k/8+Math.cos(j*2.8+elapsed*.43)*.03+j*.013)%1;ctx.strokeStyle=j%2?'#e6ffdf3b':'#315e7e40';ctx.lineWidth=j%2?2:1;line(x,y,x+.06,y);}
  }
  ctx.fillStyle='#714741';ctx.beginPath();for(const [i,a] of [[.41,1],[.55,.58],[.67,.58],[.75,1]].entries())(i?ctx.lineTo:ctx.moveTo).call(ctx,...p(...a));ctx.closePath();ctx.fill();
  ctx.fillStyle='#c08e63';ctx.beginPath();for(const [i,a] of [[.41,.965],[.55,.58],[.67,.58],[.75,.965]].entries())(i?ctx.lineTo:ctx.moveTo).call(ctx,...p(...a));ctx.closePath();ctx.fill();
  for(let i=0;i<9;i++){const k=i/9;ctx.strokeStyle='#82584b';ctx.lineWidth=2;line(.55-.14*k,.58+.38*k,.67+.08*k,.58+.38*k);}
  if(at==='reef'){
    ctx.fillStyle='#f7c5b9';for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(...p(.73+i*.036,.81+Math.sin(i)*.04),w*.022,h*.03,0,0,Math.PI*2);ctx.fill();}
  }
  if(['cast','wait','bite','fight'].includes(phase)){
    const dest=positions[at], k=phase==='cast'?Math.min(1,timer/landTime):1;
    const x=.64+(dest[0]-.64)*k+(phase==='fight'?Math.sin(elapsed*8)*.016:0);
    const y=dest[1]-.12*Math.sin(Math.PI*k)+(phase==='bite'?Math.sin(elapsed*13)*.014:.005*Math.sin(elapsed*4))-(phase==='fight'?Math.max(0,.08-fight.distance*.009):0);
    ctx.strokeStyle='#f3f6d5';ctx.lineWidth=2;line(.61,.79,x,y);
    ctx.fillStyle=phase==='bite'?'#ffe89a':'#f87870';ctx.beginPath();ctx.arc(...p(x,y),Math.max(7,h*.016),0,Math.PI*2);ctx.fill();
    if(phase==='bite'){ctx.fillStyle='#154941';ctx.font='900 '+Math.max(13,h*.038)+'px system-ui';ctx.fillText('!',x*w+14,y*h-10);}
  }
}
function size(){const d=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(innerWidth*d);canvas.height=Math.round(innerHeight*d);}
addEventListener('resize',size);size();requestAnimationFrame(frame);
addEventListener('keydown',e=>{
  if(e.target?.closest?.('button')||e.repeat||e.code!=='Space'||phase==='menu')return;
  e.preventDefault();
  if(phase==='fight')holdReel=true;else if(phase==='bite')hookFish();else castLine();
});
addEventListener('keyup',e=>{if(e.code==='Space')holdReel=false;});addEventListener('blur',()=>holdReel=false);
