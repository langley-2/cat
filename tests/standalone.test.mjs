import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const html=readFileSync(new URL('../play.html',import.meta.url),'utf8');
test('the playable HTML contains a valid self-contained game script',()=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);assert.doesNotThrow(()=>new Script(script));
 assert.match(script,/class KittenAnimator/);assert.match(script,/class TickleGame/);assert.match(script,/pointerdown/);
});
test('the playable HTML needs no server, imports, or external assets',()=>{
 assert.doesNotMatch(html,/<script[^>]*src=|<link[^>]*rel="stylesheet"|<img\b|<image\b|\bfetch\(/);
 assert.doesNotMatch(html,/^import /m);assert.match(html,/<style>/);assert.match(html,/data:image\/svg\+xml/);
});

// Execute the shipped script against minimal DOM/input/storage adapters. These
// exercise app wiring, not browser layout, audio, or native pointer capture.
function openGame(storage=new Map(),storageBlocked=false){
 let now=0,nextFrame;
 class Element {
  constructor(attrs={}){this.attrs=attrs;this.style={};this.dataset={};this.textContent='';this.events=new Map();}
  addEventListener(type,handler){const handlers=this.events.get(type)??[];handlers.push(handler);this.events.set(type,handlers);}
  dispatch(type,props={}){for(const handler of this.events.get(type)??[])handler({preventDefault(){},target:this,...props});}
  setAttribute(key,value){this.attrs[key]=String(value);}
  getScreenCTM(){return null;}
  getBoundingClientRect(){return {left:0,top:0,width:600,height:590};}
  setPointerCapture(){}
  focus(){}
  querySelector(selector){return select(selector);}
 }
 const elements=[...html.split('<script>')[0].matchAll(/<[a-z][a-z0-9-]*\b([^>]*)>/gi)].map(match=>new Element(Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]))));
 const select=selector=>elements.find(el=>selector.startsWith('#')?el.attrs.id===selector.slice(1):(el.attrs.class??'').split(' ').includes(selector.slice(1)))??null;
 const document=new Element();document.getElementById=id=>select('#'+id);document.hidden=false;
 const window=new Element(),math=Object.create(Math);math.random=()=>.5;
 const context={document,window,Math:math,performance:{now:()=>now},navigator:{},matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>{nextFrame=fn;},HTMLInputElement:class{},HTMLTextAreaElement:class{},localStorage:{getItem:k=>{if(storageBlocked)throw Error('denied');return storage.get(k)??null;},setItem:(k,v)=>{if(storageBlocked)throw Error('denied');storage.set(k,v);}}};
 new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]).runInNewContext(context);
 return {storage,select,document,window,
  tick(ms){now+=ms;const frame=nextFrame;frame(now);},
  press(){select('#belly').dispatch('pointerdown',{button:0,pointerId:1,clientX:300,clientY:365});},
  release(){select('#belly').dispatch('pointerup',{pointerId:1});},
  state(){return select('#scene').dataset.state;},
 };
}
test('shipped pointer handlers reset early releases, bank escapes, and clear caught runs',()=>{
 const app=openGame();
 for(let i=0;i<4;i++){app.press();app.tick(1000);app.release();assert.equal(app.select('#current').textContent,'0.0');assert.equal(app.select('#best').textContent,'0.0');}
 for(let i=0;i<2;i++){app.press();app.tick(2175);assert.equal(app.state(),'warning');app.release();assert.equal(app.state(),'safe');}
 assert.equal(app.select('#stage').textContent,'stage 2');assert.equal(app.select('#best').textContent,'4.4');
 app.press();app.tick(3000);assert.equal(app.state(),'attacking');assert.equal(app.select('#current').textContent,'0.0');assert.equal(app.select('#best').textContent,'4.4');
 app.tick(2100);assert.equal(app.state(),'caught');app.release();app.press();app.tick(100);assert.equal(app.state(),'tickling');assert.equal(app.select('#current').textContent,'0.1');
 const reopened=openGame(app.storage);assert.equal(reopened.select('#best').textContent,'4.4');assert.equal(reopened.select('#current').textContent,'0.0');
});
test('shipped focus and capture interruption handling cannot keep or bank provisional time',()=>{
 for(const interrupt of [a=>a.window.dispatch('blur'),a=>a.select('#belly').dispatch('pointercancel',{pointerId:1}),a=>a.select('#belly').dispatch('lostpointercapture',{pointerId:1}),a=>{a.document.hidden=true;a.document.dispatch('visibilitychange');}]){
  const app=openGame();app.press();app.tick(2175);app.release();app.press();app.tick(1000);interrupt(app);
  assert.equal(app.select('#current').textContent,'0.0');assert.equal(app.select('#best').textContent,'2.2');assert.equal(app.state(),'safe');
 }
});
test('shipped keyboard controls bank scores and storage failure leaves game playable',()=>{
 const app=openGame(new Map(),true);
 app.window.dispatch('keydown',{code:'Space',repeat:false});app.tick(2175);app.window.dispatch('keyup',{code:'Space'});
 assert.equal(app.state(),'safe');assert.equal(app.select('#best').textContent,'2.2');
 app.press();app.tick(3000);assert.equal(app.select('#current').textContent,'0.0');assert.equal(app.select('#best').textContent,'2.2');
 assert.match(app.select('.timer').attrs['aria-label'],/this visit/);
});
test('legacy lifetime totals are not promoted to best scores',()=>{
 const app=openGame(new Map([['belly-trap-v1',JSON.stringify({total:999,escapes:9,sound:false})]]));
 assert.equal(app.select('#current').textContent,'0.0');assert.equal(app.select('#best').textContent,'0.0');
 app.window.dispatch('pagehide');assert.equal(JSON.parse(app.storage.get('belly-trap-v2')).sound,false);
});
