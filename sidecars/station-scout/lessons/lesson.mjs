const SOURCE = 'sprouts-sidecar';
export const names = ['Discover','Practice','Challenge'];
const buddies = { fox:'🦊', bear:'🐻', bunny:'🐰', frog:'🐸', owl:'🦉', chick:'🐤' };
export const levelFor = stage => /^(preschool|kindergarten)$/.test(stage || '') ? 0 : /^(grade1|grade2)$/.test(stage || '') ? 1 : /^(grade3|grade4)$/.test(stage || '') ? 2 : 0;
export function node(tag, text, cls) {
  const x = document.createElement(tag);
  if (text !== undefined) x.textContent = text;
  if (cls) x.className = cls;
  return x;
}
export function button(text, fn, cls) {
  const b = node('button',text,cls); b.type='button'; b.addEventListener('click',fn); return b;
}
export function hold(b, on, off) {
  b.addEventListener('pointerdown', e=>{if(e.button!==0)return; b.setPointerCapture(e.pointerId);on();e.preventDefault();});
  for(const t of ['pointerup','pointercancel','lostpointercapture','blur']) b.addEventListener(t,off);
  b.addEventListener('keydown',e=>{ if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)on();} });
  b.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();off();}});
  return b;
}
export function speak(text) {
  if (!text || !globalThis.speechSynthesis) return;
  const line=new SpeechSynthesisUtterance(text), lang='en-US';
  line.lang=lang;line.rate=.88;
  const voices=speechSynthesis.getVoices();
  const voice=voices.find(v=>v.localService && v.lang===lang) || voices.find(v=>v.localService && v.lang.startsWith('en'));
  if(!voice)return; // Text remains usable without a downloaded OS voice.
  line.voice=voice;speechSynthesis.cancel();speechSynthesis.speak(line);
}
export function hint(el, text) { if(el.textContent!==text) el.textContent=text; }
export function panel({ title, icon, instructions, mission, free, theme = '', omitBack = false, auto = false }) {
  const embedded=window.parent!==window;
  const localURL=new URL(location.href);
  let level=0, sound=true, buddy='fox', configured=false, running=false, done=false;
  try{
    const data=JSON.parse(localStorage.getItem('sprouts-v1')||'null');
    const p=data?.profiles?.[data.active||0]; if(p){level=levelFor(p.stage);buddy=p.sprite||p.buddy||buddy;}
  }catch{}
  const wrap=node('section',undefined,'ls-overlay '+theme), bar=node('div',undefined,'ls-top');
  const badge=node('div',icon+' '+title,'ls-badge');
  const lesson=node('div',undefined,'ls-panel');
  const hide=button('Hide',()=>{lesson.hidden=!lesson.hidden;hide.textContent=lesson.hidden?'Show':'Hide';});
  const menu=button('Menu',()=>pick()); hide.hidden=true;
  bar.append(badge,hide,menu);
  if(embedded&&!omitBack)bar.append(button('Exit',()=>post('quit')));
  wrap.append(bar,lesson);document.body.append(wrap);
  const post=(type,p={})=>{if(embedded) window.parent.postMessage({source:SOURCE,type,...p},localURL.origin);};
  const ui={wrap,bar,body:lesson,post,get level(){return level;},get buddy(){return buddy;},get isDone(){return done;},
    say(text){if(sound)speak(text);},
    progress(text){post('progress',{label:text});},
    finish(text, {attempts=1,firstRight=1}={}){
      if(done)return;done=true;lesson.dataset.padMenu='';
      lesson.replaceChildren(node('h2','★  Mission complete'),node('p',text));
      lesson.append(button('Play again',()=>pick(),'ls-primary'));
      if(embedded)lesson.append(button('Save to Star Garden',()=>post('finish',{detail:'lesson:'+attempts+':'+firstRight})));
      ui.progress('Mission complete');
    },
    reset:()=>pick(),
  };
  function pick(){
    lesson.dataset.padMenu='';running=false;done=false;lesson.hidden=false;hide.hidden=true;hide.textContent='Hide';lesson.replaceChildren();
    lesson.append(node('p','LITTLE SPROUTS WORLD','ls-kicker'),node('h2',title),node('p',instructions));
    const group=node('div',undefined,'ls-levels');group.setAttribute('role','group');group.setAttribute('aria-label','Mission difficulty');
    names.forEach((name,i)=>{const b=button(name,()=>{level=i;mark();});b.dataset.level=i;group.append(b);});
    const mark=()=>[...group.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===level)));
    mark();lesson.append(group);
    lesson.append(button((buddies[buddy]||icon)+' Start mission',()=>{
      if(running)return;running=true;delete lesson.dataset.padMenu;hide.hidden=false;lesson.replaceChildren();mission(ui);
    },'ls-primary'));
    if(free)lesson.append(button('Free play',()=>{
      if(running)return;running=true;delete lesson.dataset.padMenu;lesson.hidden=true;hide.textContent='Show';hide.hidden=false;free(ui);
    }));
  }
  addEventListener('message',e=>{
    if(!embedded||e.source!==window.parent||e.origin!==localURL.origin||e.data?.source!==SOURCE)return;
    const data=e.data;
    if(data.type==='lesson-config'||(!configured&&data.type==='ask')){
      configured=true;
      if(Number.isInteger(data.level)&&data.level>=0&&data.level<=2)level=data.level;
      else if(data.stage)level=levelFor(data.stage);
      if(data.buddy in buddies)buddy=data.buddy;
      if(typeof data.sound==='boolean')sound=data.sound;
      if(!running&&auto){running=true;delete lesson.dataset.padMenu;hide.hidden=false;lesson.replaceChildren();mission(ui);}
      else if(!running)pick();
    }
  });
  pick();post('ready');post('lesson-config-request');
  return ui;
}
