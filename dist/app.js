import { TickleGame } from './game.js';
import { KittenAnimator } from './animation.js';
import { CatAudio } from './audio.js';
const $=id=>document.getElementById(id);
const scene=$('scene'),belly=$('belly');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio=new CatAudio();audio.enabled=true;
const kitten=new KittenAnimator($('kitty'),belly,{reduced});
let savedBest=0,activePointer=null,keyboardHeld=false;
try{
  const record=JSON.parse(localStorage.getItem('belly-trap-v2'));
  savedBest=record?.best??0;
  // The old lifetime total is not a valid best under the new rules.
  const preferences=record??JSON.parse(localStorage.getItem('belly-trap-v1'));
  if(typeof preferences?.sound==='boolean')audio.enabled=preferences.sound;
}catch{}
const game=new TickleGame({best:savedBest,onState:stateChanged});
function persist(){try{localStorage.setItem('belly-trap-v2',JSON.stringify({best:game.best,sound:audio.enabled}));}catch{document.querySelector('.timer').setAttribute('aria-label','Current and best score for this visit');}}
function message(text){$('status-text').textContent=text;}
function paintScore(){
  const format=value=>value.toLocaleString(undefined,{minimumFractionDigits:1,maximumFractionDigits:1});
  $('current').textContent=format(game.current);$('best').textContent=format(game.best);
  $('stage').textContent=`stage ${game.stage+1}`;
}
function stateChanged(state){
  scene.dataset.state=state;kitten.setState(state);
  if(state==='tickling'){
    message('hold… eyes open? let go.');audio.purr();
  }else if(state==='warning'){
    audio.stop();message('let go!');
  }else if(state==='attacking'){
    audio.stop();persist();message('!');audio.growl();
    kitten.pounce({onImpact:()=>{if(!reduced&&navigator.vibrate)navigator.vibrate([40,25,60]);},onComplete:()=>game.setState('caught')});
  }else if(state==='caught'){
    persist();message('got you. rub me again.');
    // The next fresh press starts another round. A held finger never restarts it.
  }else if(state==='safe'){
    audio.stop();persist();
    if(game.outcome==='escaped'){audio.chime();message('asleep again. rub me.');}
    else if(game.outcome==='early')message('too soon. wait for the eyes.');
    else message('run ended. rub me again.');
  }else{
    message('rub me');
  }
  paintScore();
}
function start(){if(game.state==='caught')game.reset();audio.unlock().then(()=>{if(game.state==='tickling')audio.purr();});game.begin(performance.now());}
function release(cancelled=false){game.release(performance.now(),cancelled);activePointer=null;keyboardHeld=false;paintScore();persist();}
belly.addEventListener('pointerdown',e=>{
  if(e.button!==0||activePointer!==null||keyboardHeld||!['idle','safe','caught'].includes(game.state))return;
  e.preventDefault();kitten.track(e.clientX,e.clientY);activePointer=e.pointerId;belly.setPointerCapture(e.pointerId);belly.focus({preventScroll:true});start();
});
belly.addEventListener('pointermove',e=>{if(e.pointerId===activePointer)kitten.track(e.clientX,e.clientY);});
belly.addEventListener('pointerup',e=>{if(e.pointerId===activePointer)release();});
belly.addEventListener('pointercancel',e=>{if(e.pointerId===activePointer)release(true);});
belly.addEventListener('lostpointercapture',e=>{if(e.pointerId===activePointer)release(true);});
belly.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
  if(e.code==='KeyM'&&!e.repeat){audio.enabled=!audio.enabled;audio.unlock().then(()=>{if(audio.enabled&&game.state==='tickling')audio.purr();});if(!audio.enabled)audio.stop();persist();return;}
  if(e.code!=='Space')return;e.preventDefault();if(e.repeat||keyboardHeld||activePointer!==null)return;
  if(['idle','safe','caught'].includes(game.state)){keyboardHeld=true;start();}
});
window.addEventListener('keyup',e=>{if(e.code==='Space'&&keyboardHeld){e.preventDefault();release();}});
window.addEventListener('blur',()=>{if(activePointer!==null||keyboardHeld)release(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(activePointer!==null||keyboardHeld)release(true);audio.stop();persist();}});
window.addEventListener('pagehide',()=>{if(activePointer!==null||keyboardHeld)release(true);persist();});
function frame(now){game.advance(now);kitten.update(now);if(game.state==='tickling')paintScore();requestAnimationFrame(frame);}
paintScore();requestAnimationFrame(frame);
