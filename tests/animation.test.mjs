import test from 'node:test';
import assert from 'node:assert/strict';
import {KittenAnimator} from '../dist/animation.js';
function make(reduced=false){
 const nodes=new Map();
 const svg={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,{attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getScreenCTM(){return null}});return nodes.get(selector)},getBoundingClientRect(){return {left:0,top:0,width:600,height:590}}};
 const rig=new KittenAnimator(svg,{style:{}},{reduced});rig.clock=0;
 return {rig,nodes};
}
test('rubbing moves the torso, wrists, and feet independently',()=>{
 const {rig,nodes}=make();rig.setState('tickling',0);rig.update(700);
 const before=Object.fromEntries([...nodes].map(([k,v])=>[k,v.attrs.transform]));rig.track(420,350);rig.update(1200);
 for(const part of ['.cat-rig','.hand-left','.hand-right','.paw-left','.paw-right'])assert.notEqual(nodes.get(part).attrs.transform,before[part]);
});
test('warning opens the same eyelid geometry without replacing or fading the character',()=>{
 const {rig,nodes}=make();rig.update(100);const before=nodes.get('.eye-mask-left').attrs.d;rig.setState('warning',100);rig.update(220);
 assert.notEqual(nodes.get('.eye-mask-left').attrs.d,before);assert.equal(rig.pose.eyes,1);
 assert.ok([...nodes.values()].every(n=>!('opacity' in n.attrs)));
});
test('consecutive pounces each strike once, return, and preserve the same rig nodes',()=>{
 const {rig,nodes}=make();const original=nodes.get('.cat-rig');let impacts=0,completions=0;
 for(const start of [100,2500,4900]){
  rig.pounce({onImpact:()=>impacts++,onComplete:()=>completions++},start);
  for(let elapsed=0;elapsed<2000;elapsed+=16)rig.update(start+elapsed);
  rig.update(start+2000);rig.update(start+2100);
  assert.equal(rig.attack,null);assert.equal(nodes.get('.cat-rig'),original);
  assert.ok(rig.pose.sx<1.1);assert.equal(rig.pose.claws,0);
 }
 assert.equal(impacts,3);assert.equal(completions,3);
});
test('attack pose boundaries remain continuous',()=>{
 for(const boundary of [170,420,620,900,1120,1510,1990]){
  const {rig}=make();rig.pounce({},0);rig.update(boundary-.1);const before={...rig.pose};rig.update(boundary+.1);
  for(const key of Object.keys(before))assert.ok(Math.abs(before[key]-rig.pose[key])<.1,`${boundary}: ${key} jumped`);
 }
});
test('reduced motion keeps the character at its original scale and position',()=>{
 const {rig}=make(true);rig.pounce({},0);rig.update(420);
 assert.equal(rig.pose.sx,1);assert.equal(rig.pose.sy,1);assert.equal(rig.pose.roll,0);assert.equal(rig.pose.x,0);assert.equal(rig.pose.y,0);
});
test('a safe release closes the eyes and settles back to sleep',()=>{
 const {rig}=make();rig.update(100);rig.setState('warning',100);rig.update(220);assert.equal(rig.pose.eyes,1);
 rig.setState('safe',220);rig.update(620);
 assert.equal(rig.pose.eyes,0);assert.equal(rig.pose.mouth,0);assert.equal(rig.pose.claws,0);assert.equal(rig.pose.leftKick,0);assert.equal(rig.pose.rightKick,0);
 rig.setState('tickling',700);rig.update(1200);assert.notEqual(rig.pose.leftKick,0);
});
