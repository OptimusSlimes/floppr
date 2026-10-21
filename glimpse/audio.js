// Glimpse audio: 100% procedural Web Audio (original). Music bed + per-scene ambience + SFX.
(function(root){"use strict";
let ctx=null,master,musicBus,ambBus,sfxBus,comp,noiseBuf,timer=null,ambNodes=[],ambTimer=null;
const st={music:true,sfx:true,intensity:0,phase:"idle",scene:null,step:0,next:0,chordIdx:0,detune:0};
const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
// D major-ish palette, chords as semitone offsets from D3 (MIDI 50)
const CH=[[0,4,7,11,14],[-3,0,4,7,12],[5,9,12,16,19],[7,11,14,17,21],[2,5,9,12,16],[-5,-1,2,5,9]]; // Imaj9, vi7, IVmaj7, V9, ii7, V/IV
const NEXT={0:[1,2,4,2],1:[2,4,5,3],2:[0,3,4,1],3:[0,1,0,2],4:[3,3,5,2],5:[2,0,3,2]};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function init(){if(ctx)return ctx;const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return null;
 ctx=new AC({latencyHint:"playback"});comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;
 master=ctx.createGain();master.gain.value=.85;master.connect(comp).connect(ctx.destination);
 musicBus=ctx.createGain();ambBus=ctx.createGain();sfxBus=ctx.createGain();musicBus.gain.value=st.music?.55:0;ambBus.gain.value=st.music?.5:0;sfxBus.gain.value=st.sfx?.8:0;
 [musicBus,ambBus,sfxBus].forEach(b=>b.connect(master));
 noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuf.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b=(b+.02*w)/1.02;d[i]=w*.5+b*3;} // white+brown blend
 document.addEventListener("visibilitychange",()=>{if(!ctx)return;document.hidden?ctx.suspend():ctx.resume();});
 return ctx;}
function unlock(){init();if(ctx&&ctx.state!=="running")ctx.resume();}
const now=()=>ctx.currentTime;
function env(g,t,a,peak,dec){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
function osc(type,f,t,dur,peak,bus,{a=.005,detune=0,filt=0,q=1}={}){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.detune.value=detune;let n=o;
 if(filt){const fl=ctx.createBiquadFilter();fl.type="lowpass";fl.frequency.value=filt;fl.Q.value=q;o.connect(fl);n=fl;}n.connect(g).connect(bus);env(g,t,a,peak,dur);o.start(t);o.stop(t+a+dur+.05);return o;}
function noise(t,dur,peak,bus,{type="bandpass",f=1000,q=1,a=.005}={}){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ctx.createGain();s.connect(fl).connect(g).connect(bus);env(g,t,a,peak,dur);s.start(t,Math.random()*1.5);s.stop(t+a+dur+.05);return {s,fl,g};}
// ---------------- music scheduler (lookahead, 16th-note grid) ----------------
function tempo(){return 70+st.intensity*24;}                      // 70 -> 94 bpm
function cutoff(){return 700+st.intensity*st.intensity*2600;}      // filter opens with intensity
function schedule(){if(!ctx)return;const spb=60/tempo()/4;while(st.next<now()+.25){tick(st.next,st.step);st.next+=spb;st.step++;}}
function tick(t,s){const I=st.intensity,bar=Math.floor(s/16),pos=s%16,ch=CH[st.chordIdx],det=st.detune;
 if(pos===0){if(bar%2===0&&s>0){const opts=NEXT[st.chordIdx];st.chordIdx=opts[Math.floor(Math.random()*opts.length)];}
  const c=CH[st.chordIdx];const dur=60/tempo()*8; // pad: 2 detuned triangles per voice, slow attack
  c.slice(0,4).forEach((n,i)=>{osc("triangle",mtof(50+n),t,dur,.035,musicBus,{a:1.2,detune:det-6,filt:cutoff()});osc("sawtooth",mtof(50+n+12),t,dur,.008,musicBus,{a:1.6,detune:det+7,filt:cutoff()*.8});});
  osc("sine",mtof(38+c[0]),t,dur*.9,.06,musicBus,{a:.4,detune:det});}           // soft bass
 // plucks: density rises with intensity; pentatonic-ish picks from chord tones
 const p=[.55,.08,.2,.08,.35,.08,.2,.1][pos%8]*(.45+I*1.1);
 if(Math.random()<p){const n=ch[Math.floor(Math.random()*ch.length)]+12*(Math.random()<.35?2:1);osc("triangle",mtof(50+n),t,.5+.6*(1-I),.045,musicBus,{a:.004,detune:det,filt:2200+I*2000});}
 // heartbeat from I>.45 (lub-dub on beat 1 & 3), ticks from I>.72
 {if(I>.45&&(pos===0||pos===8)){osc("sine",58,t,.16,.12*(I-.3),musicBus,{a:.004});osc("sine",52,t+.16,.18,.08*(I-.3),musicBus,{a:.004});}
  if(I>.72&&pos%2===0)noise(t,.03,.03*(I-.5)+(pos%4===0?.01:0),musicBus,{type:"highpass",f:6000});}
 if(st.phase==="look"&&pos%4===2&&Math.random()<.6)osc("sine",mtof(86+ch[Math.floor(Math.random()*3)]),t,.9,.018,musicBus,{a:.05,detune:det}); // shimmer
}
function startMusic(){if(!ctx||timer)return;st.next=now()+.1;st.step=0;timer=setInterval(schedule,90);}
function stopMusic(){if(timer){clearInterval(timer);timer=null;}}
// ---------------- ambience per scene (low CPU: one looped noise + sparse events) ----------------
function stopAmb(){ambNodes.forEach(n=>{try{n.stop();}catch{}});ambNodes=[];if(ambTimer){clearInterval(ambTimer);ambTimer=null;}}
function bed(f,q,gain,type="lowpass",lfo=0){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ctx.createGain();g.gain.value=gain;s.connect(fl).connect(g).connect(ambBus);
 if(lfo){const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=lfo;lg.gain.value=gain*.9;l.connect(lg).connect(g.gain);l.start();ambNodes.push(l);}s.start();ambNodes.push(s);}
const AMB={
 backyard:{bed:()=>bed(500,.5,.03),ev:t=>{if(Math.random()<.35){const f=2400+Math.random()*1800;for(let i=0;i<2+Math.floor(Math.random()*3);i++){const o=osc("sine",f,t+i*.09,.07,.02,ambBus,{a:.01});o.frequency.exponentialRampToValueAtTime(f*1.3,t+i*.09+.07);}}}},
 beach:{bed:()=>{bed(700,.4,.07,"lowpass",.09);bed(2500,.3,.012,"bandpass",.13);},ev:t=>{if(Math.random()<.12){const o=osc("sine",1500,t,.25,.012,ambBus,{a:.03});o.frequency.exponentialRampToValueAtTime(1100,t+.25);}}},
 kitchen:{bed:()=>{bed(180,2,.05);const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=100;g.gain.value=.006;o.connect(g).connect(ambBus);o.start();ambNodes.push(o);},ev:t=>{if(Math.random()<.1)osc("sine",2200+Math.random()*900,t,.4,.008,ambBus,{a:.002});}},
 bedroom:{bed:()=>bed(300,.5,.02),ev:t=>{if(Math.random()<.6){const f=4300+Math.random()*400;for(let i=0;i<3;i++)osc("sine",f,t+i*.05,.025,.006,ambBus,{a:.003});}}},
 camp:{bed:()=>bed(350,.6,.025),ev:t=>{for(let i=0;i<3;i++)if(Math.random()<.45)noise(t+Math.random()*.4,.015+Math.random()*.03,.04,ambBus,{type:"highpass",f:1500+Math.random()*2000});if(Math.random()<.4){const f=4500;for(let i=0;i<3;i++)osc("sine",f,t+.2+i*.05,.02,.005,ambBus,{a:.003});}}},
 street:{bed:()=>{bed(400,.4,.06,"lowpass",.05);bed(1200,.7,.01,"bandpass");},ev:t=>{if(Math.random()<.05){osc("triangle",330,t,.3,.006,ambBus,{a:.02,filt:900});osc("triangle",415,t,.3,.005,ambBus,{a:.02,filt:900});}if(Math.random()<.15)noise(t,.25,.01,ambBus,{f:2000,q:3,a:.08});}}
};
function startAmb(id){if(!ctx)return;stopAmb();const A=AMB[id];if(!A)return;A.bed();ambTimer=setInterval(()=>{if(ctx.state==="running")A.ev(now()+.05);},600);}
// ---------------- SFX ----------------
const S={
 blip:(k=0)=>{const t=now();osc("sine",[523,659,784][k]||880,t,.16,.12,sfxBus,{a:.004});},
 go:()=>{const t=now();[784,1175].forEach((f,i)=>osc("triangle",f,t+i*.06,.3,.08,sfxBus));noise(t,.4,.04,sfxBus,{type:"highpass",f:5000,a:.05});},
 find:(tier=0)=>{const t=now();if(tier===0){osc("sine",880,t,.09,.12,sfxBus,{a:.002});osc("sine",1320,t+.02,.06,.04,sfxBus);}
  else if(tier===1){[784,1175].forEach((f,i)=>osc("triangle",f,t+i*.05,.14,.09,sfxBus));}
  else if(tier===2){[659,988,1319].forEach((f,i)=>osc("triangle",f,t+i*.05,.22,.08,sfxBus));}
  else {[587,880,1109,1480,1760].forEach((f,i)=>osc("triangle",f,t+i*.04,.45,.06,sfxBus,{detune:4}));noise(t,.5,.03,sfxBus,{type:"highpass",f:7000,a:.02});}},
 no:()=>{const t=now();const o=osc("sine",150,t,.14,.12,sfxBus,{a:.003});o.frequency.exponentialRampToValueAtTime(90,t+.14);},
 vague:()=>{const t=now();const o=osc("triangle",330,t,.32,.05,sfxBus,{a:.04,filt:1200});o.frequency.linearRampToValueAtTime(300,t+.15);o.frequency.linearRampToValueAtTime(350,t+.32);},
 dup:()=>{const t=now();osc("square",1800,t,.025,.02,sfxBus,{filt:3000});},
 timeup:()=>{const t=now();const n=noise(t,.7,.09,sfxBus,{type:"bandpass",f:400,q:1.5,a:.25});n.fl.frequency.exponentialRampToValueAtTime(3000,t+.8);osc("sine",392,t+.5,.6,.06,sfxBus,{a:.02});},
 count:()=>{const t=now();osc("sine",1400+Math.random()*200,t,.03,.025,sfxBus);},
 tile:(i=0)=>{const t=now();const f=[523,659,784,1047][i]||1047;osc("sine",f,t,.22,.07,sfxBus,{a:.002});osc("sine",f*3.98,t,.05,.015,sfxBus,{a:.001});noise(t,.02,.02,sfxBus,{type:"bandpass",f:f*2,q:4,a:.001});},
 // toy-block "pop" for items rising out of the diorama on the results screen (woody marimba-ish knock, pentatonic climb)
 pop:(i=0)=>{const t=now();const f=[587,659,740,880,988,1175,1319,1480][i%8];const o=osc("sine",f*1.5,t,.09,.05,sfxBus,{a:.002});o.frequency.exponentialRampToValueAtTime(f,t+.05);osc("sine",f*4,t,.03,.01,sfxBus,{a:.001});},
 fanfare:()=>{const t=now();[[523,659,784],[587,740,880],[659,831,988,1319]].forEach((c,i)=>c.forEach(f=>osc("triangle",f,t+i*.14,i===2?.7:.16,.04,sfxBus,{detune:i===2?3:0})));},
 click:()=>{const t=now();osc("sine",1000,t,.04,.06,sfxBus);osc("sine",1500,t+.03,.05,.04,sfxBus);},
 tick:()=>{const t=now();osc("sine",2000,t,.03,.03,sfxBus);}
};
function sfx(name,arg){if(!ctx||!st.sfx||ctx.state!=="running")return;try{S[name]&&S[name](arg);}catch(e){}}
// ---------------- public API ----------------
function setIntensity(x){st.intensity=Math.max(0,Math.min(1,x));}
function setDetune(c){st.detune=reduce()?0:c;}
function setPrefs({music,sfx:fx}){if(music!==undefined)st.music=music;if(fx!==undefined)st.sfx=fx;if(!ctx)return;const t=now();
 musicBus.gain.setTargetAtTime(st.music?.55:0,t,.25);ambBus.gain.setTargetAtTime(st.music?.5:0,t,.25);sfxBus.gain.setTargetAtTime(st.sfx?.8:0,t,.05);
 if(!st.music){stopMusic();stopAmb();}else if(st.phase!=="idle"){startMusic();if(st.scene)startAmb(st.scene);}}
function phase(p,scene){st.phase=p;if(scene)st.scene=scene;if(!ctx)return;
 if(p==="look"){setIntensity(.15);setDetune(0);}else if(p==="type"){setIntensity(.2);}else if(p==="res"||p==="home"){setIntensity(.05);setDetune(0);}
 if(st.music&&p!=="idle"){startMusic();startAmb(st.scene);}}
root.GAudio={unlock,phase,setIntensity,setDetune,setPrefs,sfx,_st:st,running:()=>!!ctx&&ctx.state==="running"};
})(window);
