export const STAGES = [
  {waitMin:650,waitMax:3700,reactionMin:330,reactionMax:460},
  {waitMin:550,waitMax:3400,reactionMin:300,reactionMax:410},
  {waitMin:450,waitMax:3100,reactionMin:270,reactionMax:365},
  {waitMin:400,waitMax:2800,reactionMin:240,reactionMax:325},
  {waitMin:350,waitMax:2500,reactionMin:220,reactionMax:290},
];
export class TickleGame {
  constructor({best=0,random=Math.random,onState=()=>{}}={}) {
    this.best=Number.isFinite(best)&&best>=0?best:0;
    this.current=0;this.banked=0;this.escapes=0;
    this.random=random;this.onState=onState;this.state='idle';this.round=0;
  }
  get stage(){return Math.min(STAGES.length-1,Math.floor(this.escapes/2));}
  get difficulty(){return STAGES[this.stage];}
  setState(state){this.state=state;this.onState(state);}
  endRun(){this.current=0;this.banked=0;this.round=0;this.escapes=0;this.paused=null;}
  begin(now){
    if(!['idle','safe'].includes(this.state))return false;
    this.round=0;this.started=now;this.outcome=null;
    if(this.paused){
      // Resume the countdown left by an early lift; re-pressing never rerolls it.
      this.warningAt=now+this.paused.wait;this.attackAt=this.warningAt+this.paused.reaction;this.paused=null;
    }else{
      const d=this.difficulty;
      this.warningAt=now+d.waitMin+this.random()*(d.waitMax-d.waitMin);
      this.attackAt=this.warningAt+d.reactionMin+this.random()*(d.reactionMax-d.reactionMin);
    }
    this.setState('tickling');return true;
  }
  advance(now){
    if(this.state==='tickling'){
      // Live time is provisional until an eyes-open escape succeeds.
      this.round=Math.max(this.round,(Math.min(now,this.warningAt)-this.started)/1000);
      this.current=this.banked+this.round;
      if(now>=this.warningAt)this.setState('warning');
    }
    if(this.state==='warning'&&now>=this.attackAt){
      this.endRun();this.outcome='caught';this.setState('attacking');
    }
  }
  release(now,cancelled=false){
    // Losing focus/capture ends the run without a surprise offscreen attack.
    if(cancelled&&['tickling','warning'].includes(this.state)){
      this.endRun();this.outcome='interrupted';this.setState('safe');return;
    }
    this.advance(now);
    if(this.state==='warning'){
      this.outcome='escaped';this.banked=this.current;
      this.best=Math.max(this.best,this.banked);
      this.escapes=Math.min(8,this.escapes+1);this.setState('safe');
    }else if(this.state==='tickling'){
      // An early lift keeps the run but forfeits this touch's unbanked time, and
      // pauses the countdown so quick taps can't dodge or farm the wake-up.
      this.paused={wait:this.warningAt-now,reaction:this.attackAt-this.warningAt};
      this.round=0;this.current=this.banked;this.outcome='early';this.setState('safe');
    }
  }
  reset(){if(['caught','safe'].includes(this.state)){this.round=0;this.setState('idle');}}
}
