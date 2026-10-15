import test from 'node:test';
import assert from 'node:assert/strict';
import {TickleGame,STAGES} from '../dist/game.js';
const setup=best=>new TickleGame({best,random:()=>0});
const dodge=(g,start)=>{g.begin(start);g.release(g.warningAt+100);};
test('live time is provisional and a clean escape banks it',()=>{
 const g=setup(0);g.begin(100);g.advance(400);assert.equal(g.current,.3);assert.equal(g.best,0);
 g.release(g.warningAt+100);assert.equal(g.current,.65);assert.equal(g.banked,.65);assert.equal(g.best,.65);assert.equal(g.outcome,'escaped');
});
test('safe release preserves current time and another clean round adds to it',()=>{
 const g=setup(0);dodge(g,0);g.advance(9000);assert.equal(g.current,.65);
 dodge(g,10000);assert.equal(g.current,1.3);assert.equal(g.best,1.3);assert.equal(g.stage,1);
});
test('getting caught clears current and difficulty immediately, preserving the best',()=>{
 const g=setup(0);for(let i=0;i<6;i++)dodge(g,i*10000);
 const best=g.best;assert.equal(g.stage,3);g.begin(70000);g.advance(g.attackAt);
 assert.equal(g.state,'attacking');assert.equal(g.current,0);assert.equal(g.banked,0);assert.equal(g.round,0);assert.equal(g.stage,0);assert.equal(g.best,best);
 g.setState('caught');g.reset();assert.equal(g.state,'idle');g.begin(80000);g.advance(80300);assert.equal(g.current,.3);
});
test('repeated one-second releases cannot farm either score',()=>{
 const g=new TickleGame({random:()=>.5});
 for(let i=0;i<30;i++){
  g.begin(i*5000);g.release(i*5000+1000);assert.equal(g.outcome,'early');assert.equal(g.current,0);assert.equal(g.best,0);assert.equal(g.stage,0);
 }
});
test('early release also clears an existing streak but retains the earned best',()=>{
 const g=setup(0);dodge(g,0);dodge(g,10000);const best=g.best;
 g.begin(20000);g.release(20100);assert.equal(g.outcome,'early');assert.equal(g.current,0);assert.equal(g.stage,0);assert.equal(g.best,best);
});
test('a failed long hold cannot create a best without a successful escape',()=>{
 const g=new TickleGame({random:()=>.99999});g.begin(0);g.advance(g.warningAt);assert.ok(g.current>3.6);
 g.advance(g.attackAt);assert.equal(g.best,0);assert.equal(g.current,0);
});
test('release checks deadlines between animation frames',()=>{
 for(const offset of [0,.01,5000]){const g=setup(4);g.begin(0);g.release(g.attackAt+offset);assert.equal(g.state,'attacking');assert.equal(g.current,0);assert.equal(g.best,4);}
 const g=setup(0);g.begin(0);g.release(g.attackAt-.01);assert.equal(g.outcome,'escaped');
});
test('the warning boundary is a valid escape, just before it is early',()=>{
 const g=setup(0);g.begin(0);g.release(g.warningAt-.01);assert.equal(g.outcome,'early');assert.equal(g.best,0);
 g.begin(10000);g.release(g.warningAt);assert.equal(g.outcome,'escaped');assert.equal(g.current,.65);
});
test('background interruption ends the run without a delayed attack or new record',()=>{
 for(const elapsed of [100,700,90000]){
  const g=setup(0);dodge(g,0);const best=g.best;g.begin(10000);g.release(10000+elapsed,true);
  assert.equal(g.state,'safe');assert.equal(g.outcome,'interrupted');assert.equal(g.current,0);assert.equal(g.escapes,0);assert.equal(g.best,best);
  g.advance(100000);assert.equal(g.state,'safe');assert.equal(g.current,0);
 }
});
test('repeated input and repeated or older timestamps cannot inflate time',()=>{
 const g=setup(0);g.begin(0);assert.equal(g.begin(100),false);g.advance(500);g.advance(500);g.advance(400);g.advance(500);assert.equal(g.current,.5);
 g.release(g.warningAt);const best=g.best;g.release(g.warningAt+10);assert.equal(g.escapes,1);assert.equal(g.best,best);
});
test('all stages bound random times and can wake before a predictable one-second release',()=>{
 for(let stage=0;stage<5;stage++)for(const random of [()=>0,()=>.99999]){
  const g=setup(0);for(let i=0;i<stage*2;i++)dodge(g,i*10000);g.random=random;g.begin(100000);
  const d=STAGES[stage];assert.equal(g.stage,stage);assert.ok(g.warningAt-100000>=d.waitMin&&g.warningAt-100000<=d.waitMax);
  assert.ok(g.attackAt-g.warningAt>=d.reactionMin-.00001&&g.attackAt-g.warningAt<=d.reactionMax);assert.ok(d.waitMin<1000);assert.ok(d.reactionMax<=460);
 }
});
test('every two escapes advance a stage and later stages are progressively harder',()=>{
 const g=setup(0);dodge(g,0);assert.equal(g.stage,0);dodge(g,10000);assert.equal(g.stage,1);
 for(let i=2;i<30;i++)dodge(g,i*10000);assert.equal(g.stage,4);assert.equal(g.escapes,8);
 for(let i=1;i<5;i++){assert.ok(STAGES[i].reactionMin<STAGES[i-1].reactionMin);assert.ok(STAGES[i].reactionMax<STAGES[i-1].reactionMax);}
});
test('new visits restore only the record and start fresh runs',()=>{
 const g=new TickleGame({best:32.5,current:20,escapes:7,total:500});assert.equal(g.stage,0);assert.equal(g.current,0);assert.equal(g.best,32.5);
});
test('bad stored best values cannot corrupt the game',()=>{
 for(const v of [NaN,Infinity,-5,'42',{},null]){const g=setup(v);assert.equal(g.best,0);assert.equal(g.current,0);}
});
