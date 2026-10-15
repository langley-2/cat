const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const blend=(a,b,t)=>Object.fromEntries(Object.keys(b).map(k=>[k,mix(a[k]??b[k],b[k],t)]));
const around=(x,y,angle=0,sx=1,sy=sx,dx=0,dy=0)=>`translate(${x+dx} ${y+dy}) rotate(${angle}) scale(${sx} ${sy}) translate(${-x} ${-y})`;

// One SVG character, continuously posed through shoulders, wrists, hips, spine,
// neck and ears. No images, texture blending, canvases, or replacement characters.
export class KittenAnimator {
  constructor(svg,target,{reduced=false}={}){
    this.svg=svg;this.target=target;this.reduced=reduced;this.state='idle';this.clock=performance.now();this.rub={x:0,y:0};this.finger={x:0,y:0};
    this.nodes=Object.fromEntries(['cat-rig','body-breathe','head','tail','paw-left','paw-right','ear-left','ear-right','hand-left','hand-right','arm-bone-left','arm-bone-right','arm-fur-left','arm-fur-right','claws-left','claws-right','pads-left','pads-right','jaw','smile','eye-mask-left','eye-mask-right','eye-lid-left','eye-lid-right','pupil-left','pupil-right'].map(k=>[k,svg.querySelector('.'+k)]));
    this.pose=this.rest(0,false);this.render(this.pose);
  }
  rest(t,happy){
    const motion=this.reduced?0:1,f=happy?1:0,w=t*(happy?3.8:1.25),s=Math.sin;
    const pose={
      x:motion*(s(w*.7)*7+this.rub.x*8*f),y:motion*s(w)*4,
      roll:motion*(-27+s(w*.63)*(happy?34:9)+this.rub.x*12*f),sx:1+motion*s(w)*(.012+.035*f),sy:1+motion*Math.cos(w)*(.016+.025*f),
      bodyAngle:motion*s(w+.4)*(2+4*f),bodyScaleX:1+motion*s(w)*(.012+.025*f),bodyScaleY:1+motion*Math.cos(w*.8)*.025,
      headX:motion*this.rub.x*6*f,headY:motion*(s(w+.6)*4-5*f),headAngle:motion*(s(w*.8)*(4+9*f)-this.rub.x*9*f),headScale:1,
      leftX:198+motion*(s(w+1)*(8+18*f)),leftY:281+motion*(Math.cos(w)*(8+25*f)),leftAngle:motion*(-12+s(w+.8)*(14+24*f)),leftScale:1,
      rightX:400+motion*s(w+2.7)*(8+18*f),rightY:280+motion*Math.cos(w+2)*(8+25*f),rightAngle:motion*(12+s(w+2.5)*(14+24*f)),rightScale:1,
      leftKick:motion*s(w*1.1)*(.2+.8*f),rightKick:motion*s(w*1.1+2)*(.2+.8*f),feetScale:1,
      tail:motion*(s(w*.8)*15+s(w*2)*5*f),earLeft:motion*s(w*.4)*3,earRight:motion*s(w*.4+1)*3,
      eyes:0,anger:0,mouth:0,claws:0,pads:.55+.2*f
    };
    if(!happy){
      const breath=motion*Math.sin(t*1.65);
      Object.assign(pose,{x:0,y:0,roll:motion*-28,sx:1,sy:1,
        bodyAngle:0,bodyScaleX:1+breath*.008,bodyScaleY:1+breath*.014,
        headX:0,headY:breath*1.2,headAngle:motion*(-4+Math.sin(t*.65)),
        leftX:198,leftY:281+breath,rightX:400,rightY:280+breath,
        leftAngle:-12*motion,rightAngle:12*motion,leftKick:0,rightKick:0,
        tail:motion*Math.sin(t*.6)*2,earLeft:0,earRight:0});
    }
    return pose;
  }
  setState(state,now=performance.now()){
    this.from={...this.pose};this.changedAt=now;this.state=state;
    if(state==='warning')this.alert={...this.pose,eyes:1,mouth:0,headAngle:0,earLeft:-13,earRight:13};
  }
  track(clientX,clientY){
    const rect=this.svg.getBoundingClientRect();this.finger.x=clamp((clientX-rect.left)/rect.width*2-1,-1,1);this.finger.y=clamp((clientY-rect.top)/rect.height*2-1,-1,1);
  }
  pounce({onImpact=()=>{},onComplete=()=>{}},now=performance.now()){
    this.state='attacking';const base={...this.pose};
    const neutral={...this.rest(0,false),roll:0,eyes:1,anger:1,mouth:.7,pads:1,claws:1};
    this.attack={start:now,onImpact,onComplete,impacted:false,keys:[
      [0,base],
      [170,{...neutral,x:0,y:35,roll:-5,sx:1.08,sy:.78,headY:22,headAngle:7,leftX:245,leftY:280,leftAngle:-30,rightX:351,rightY:283,rightAngle:30,feetScale:1.1,leftKick:-.7,rightKick:-.7,tail:-32,mouth:.25,claws:.4}],
      [420,{...neutral,x:-8,y:65,roll:4,sx:2.05,sy:2.05,bodyScaleX:.83,bodyScaleY:.65,headY:45,headScale:1.05,headAngle:-3,leftX:155,leftY:250,leftAngle:-27,leftScale:1.9,rightX:426,rightY:265,rightAngle:24,rightScale:1.65,feetScale:.57,leftKick:-1.4,rightKick:-1.4,earLeft:-34,earRight:34,tail:42,mouth:1}],
      [620,{...neutral,x:18,y:70,roll:-6,sx:1.95,sy:1.95,bodyScaleX:.86,bodyScaleY:.7,headY:40,headAngle:7,leftX:286,leftY:300,leftAngle:-62,leftScale:2.1,rightX:398,rightY:225,rightAngle:35,rightScale:1.5,feetScale:.6,leftKick:-1.3,rightKick:-1.1,earLeft:-35,earRight:35,mouth:.9,tail:20}],
      [900,{...neutral,x:14,y:12,roll:15,sx:1.15,sy:1.2,headY:20,headAngle:-5,leftX:191,leftY:289,leftAngle:10,leftScale:1.1,rightX:400,rightY:300,rightAngle:15,rightScale:1.1,feetScale:.8,leftKick:-.5,rightKick:-.5,mouth:.4,claws:.3,tail:-22}],
      [1120,{...neutral,x:0,y:25,roll:6,sx:1.12,sy:.86,headY:13,headAngle:2,leftX:176,leftY:319,leftAngle:-25,rightX:425,rightY:319,rightAngle:25,feetScale:1,leftKick:.3,rightKick:.3,mouth:0,claws:0,eyes:.5,anger:0,earLeft:0,earRight:0,tail:-10}],
      [1510,{...this.rest(0,false),x:-8,y:0,roll:-52,sx:1,sy:1,leftX:176,leftY:270,leftAngle:-40,rightX:413,rightY:262,rightAngle:35,leftKick:.7,rightKick:-.5,headAngle:10,tail:26}],
    ]};
  }
  update(now){
    const t=(now-this.clock)/1000;
    this.rub.x=mix(this.rub.x,this.finger.x,.12);this.rub.y=mix(this.rub.y,this.finger.y,.12);
    if(this.attack){
      const a=this.attack,elapsed=now-a.start,keys=[...a.keys,[1990,this.rest(t,false)]];
      let i=1;while(i<keys.length-1&&elapsed>keys[i][0])i++;
      this.pose=blend(keys[i-1][1],keys[i][1],ease((elapsed-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));
      if(this.reduced){this.pose.sx=1;this.pose.sy=1;this.pose.x=0;this.pose.y=0;this.pose.roll=0;this.pose.leftScale=Math.min(1.2,this.pose.leftScale);this.pose.rightScale=Math.min(1.2,this.pose.rightScale);}
      this.render(this.pose);
      if(elapsed>=420&&!a.impacted){a.impacted=true;a.onImpact();}
      if(elapsed>=1990){this.attack=null;this.state='caught';this.from={...this.pose};this.changedAt=now;a.onComplete();}
    }else{
      const target=this.state==='warning'?this.alert:this.rest(t,this.state==='tickling');
      this.pose=this.from?blend(this.from,target,ease((now-this.changedAt)/(this.state==='warning'?65:350))):target;
      this.render(this.pose);
    }
  }
  render(p){
    const n=this.nodes,attr=(name,value)=>n[name].setAttribute('transform',value);
    attr('cat-rig',around(300,320,p.roll,p.sx,p.sy,p.x,p.y));
    attr('body-breathe',around(300,340,p.bodyAngle,p.bodyScaleX,p.bodyScaleY));
    attr('head',around(300,230,p.headAngle,p.headScale,p.headScale,p.headX,p.headY));
    attr('ear-left',around(239,139,p.earLeft));attr('ear-right',around(357,139,p.earRight));
    attr('tail',around(390,432,p.tail));
    attr('paw-left',around(203,460,p.leftKick*24,p.feetScale,p.feetScale,-p.leftKick*15,-p.leftKick*35));
    attr('paw-right',around(394,460,-p.rightKick*24,p.feetScale,p.feetScale,p.rightKick*15,-p.rightKick*35));
    for(const side of ['left','right']){
      const x=p[side+'X'],y=p[side+'Y'],shoulder=side==='left'?211:386;
      const bend=side==='left'?-22:22,path=`M${shoulder} 240 Q${(shoulder+x)/2+bend} ${(240+y)/2+10} ${x} ${y}`;
      n['arm-bone-'+side].setAttribute('d',path);n['arm-fur-'+side].setAttribute('d',path);
      attr('hand-'+side,`translate(${x} ${y}) rotate(${p[side+'Angle']}) scale(${p[side+'Scale']})`);
      attr('claws-'+side,around(0,23,0,1,p.claws));attr('pads-'+side,`scale(1 ${p.pads})`);
      const cx=side==='left'?245:354,sign=side==='left'?1:-1;
      const y0=190-p.anger*7*sign,y1=190+p.anger*7*sign,upper=206-p.eyes*48,lower=206+p.eyes*4;
      const top=`M${cx-19} ${y0} Q${cx} ${upper} ${cx+19} ${y1}`;
      n['eye-mask-'+side].setAttribute('d',`${top} Q${cx} ${lower} ${cx-19} ${y0}Z`);
      n['eye-lid-'+side].setAttribute('d',top);n['pupil-'+side].setAttribute('rx',6-3*p.anger);
    }
    attr('jaw',around(299,226,0,1,p.mouth));
    n.smile.setAttribute('d',`M299 219v6m-14 0q7 ${11*(1-p.mouth)} 14 0q7 ${11*(1-p.mouth)} 14 0`);
    // Keep the touch target attached to the moving belly, even during a roll.
    if(this.state!=='attacking'){
      const matrix=n['body-breathe'].getScreenCTM();
      if(matrix){const center=new DOMPoint(300,365).matrixTransform(matrix),rect=this.svg.parentElement.getBoundingClientRect();this.target.style.left=`${center.x-rect.left}px`;this.target.style.top=`${center.y-rect.top}px`;}
    }
  }
}
