export class CatAudio {
  constructor(){this.enabled=false;this.context=null;this.purring=null;}
  async unlock(){
    if(!this.enabled)return;
    try {this.context ??= new (window.AudioContext||window.webkitAudioContext)();if(this.context.state!=='running')await this.context.resume();} catch {this.enabled=false;}
  }
  noise(seconds){
    // Generated once per length; regenerating on every press stalls slow phones.
    const c=this.context,s=c.createBufferSource();this.buffers??={};
    if(!this.buffers[seconds]){const b=c.createBuffer(1,c.sampleRate*seconds,c.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=(last+.035*(Math.random()*2-1))/1.025;d[i]=last*8;}this.buffers[seconds]=b;}
    s.buffer=this.buffers[seconds];return s;
  }
  purr(){
    this.stop();if(!this.enabled||!this.context)return;
    const c=this.context,g=c.createGain(),f=c.createBiquadFilter(),n=this.noise(3),lfo=c.createOscillator(),depth=c.createGain();
    n.loop=true;f.type='lowpass';f.frequency.value=280;g.gain.value=.11;lfo.frequency.value=25;depth.gain.value=.07;
    lfo.connect(depth).connect(g.gain);n.connect(f).connect(g).connect(c.destination);n.start();lfo.start();this.purring={n,lfo,g};
  }
  stop(){if(this.purring){const {n,lfo,g}=this.purring;g.gain.setTargetAtTime(0,this.context.currentTime,.025);setTimeout(()=>{n.stop();lfo.stop();g.disconnect();},130);this.purring=null;}}
  growl(){
    this.stop();if(!this.enabled||!this.context)return;
    const c=this.context,t=c.currentTime,n=this.noise(1.3),f=c.createBiquadFilter(),g=c.createGain(),o=c.createOscillator(),og=c.createGain();
    f.type='lowpass';f.frequency.setValueAtTime(700,t);f.frequency.exponentialRampToValueAtTime(1800,t+.32);f.frequency.exponentialRampToValueAtTime(160,t+1.2);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,t+.18);g.gain.exponentialRampToValueAtTime(.001,t+1.3);n.connect(f).connect(g).connect(c.destination);
    o.type='sawtooth';o.frequency.setValueAtTime(86,t);o.frequency.exponentialRampToValueAtTime(48,t+1.1);og.gain.setValueAtTime(.025,t);og.gain.exponentialRampToValueAtTime(.001,t+1.1);o.connect(og).connect(f);n.start();o.start();o.stop(t+1.3);
  }
  chime(){if(!this.enabled||!this.context)return;const c=this.context,t=c.currentTime;for(const [freq,delay] of [[523,0],[784,.09]]){const o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;g.gain.setValueAtTime(0,t+delay);g.gain.linearRampToValueAtTime(.035,t+delay+.01);g.gain.exponentialRampToValueAtTime(.001,t+delay+.3);o.connect(g).connect(c.destination);o.start(t+delay);o.stop(t+delay+.32);}}
}
