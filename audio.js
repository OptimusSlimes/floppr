// Floppr audio: 100% procedural Web Audio (original, no samples). Starts only after a user gesture.
window.FlopAudio=(()=>{let ctx=null,master,music,sfxBus,muted=localStorage.flopprMute==='1',level=0,timer=null,step=0,nextT=0;
const BPM=88,S=60/BPM/2;// eighth notes
// I–vi–IV–V-ish cosy progression in F: Fmaj7, Dm7, Bbmaj7, C6  (midi roots)
const CH=[[53,57,60,64],[50,53,57,60],[46,50,53,57],[48,52,55,57]],SCALE=[65,67,69,72,74,77,79,81,84];
const mtof=m=>440*Math.pow(2,(m-69)/12);
function init(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();
 master=ctx.createGain();master.gain.value=muted?0:.9;master.connect(ctx.destination);
 const comp=ctx.createDynamicsCompressor();comp.connect(master);
 music=ctx.createGain();music.gain.value=.32;sfxBus=ctx.createGain();sfxBus.gain.value=.6;music.connect(comp);sfxBus.connect(comp);
 // gentle "room" echo
 const d=ctx.createDelay();d.delayTime.value=S*3;const fb=ctx.createGain();fb.gain.value=.28;const lp=ctx.createBiquadFilter();lp.frequency.value=2200;
 music.connect(d);d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(comp);
 nextT=ctx.currentTime+.1;timer=setInterval(sched,60)}
function tone(t,f,dur,type,vol,dest,att=.01,cut=0){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 if(cut){const f2=ctx.createBiquadFilter();f2.frequency.value=cut;o.connect(f2);f2.connect(g)}else o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05);return o}
function noise(t,dur,vol,dest,hp=6000){const b=ctx.createBuffer(1,ctx.sampleRate*dur,ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;
 const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type=hp>0?'highpass':'lowpass';f.frequency.value=Math.abs(hp);const g=ctx.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t)}
function sched(){while(nextT<ctx.currentTime+.25){play(step,nextT);nextT+=S;step=(step+1)%64}}
function play(i,t){const bar=Math.floor(i/16)%4,c=CH[bar],e=i%16;
 // layer 1 (always): soft electric-piano chord stabs on 1 and the "and" of 2
 if(e===0||e===6||e===10)c.forEach((m,k)=>tone(t+k*.012,mtof(m),S*3.2,'triangle',.05,music,.02));
 // layer 2 (>=15m): round bass
 if(level>=15&&(e===0||e===8||e===11))tone(t,mtof(c[0]-12),S*2.5,'sine',.22,music,.01);
 // layer 3 (>=35m): plucky pentatonic melody (seeded pattern so it loops)
 if(level>=35&&[0,3,4,6,8,11,12,14].includes(e)){const n=SCALE[(i*5+bar*3+(e>>1))%SCALE.length];tone(t,mtof(n),S*1.6,'square',.035,music,.005,1800)}
 // layer 4 (>=55m): brushy shaker + kick
 if(level>=55){if(e%2===1)noise(t,.05,.05,music);if(e%8===0)tone(t,90,.18,'sine',.3,music,.002)}
 // layer 5 (>=80m): twinkly music-box sparkles an octave up
 if(level>=80&&e%4===2)tone(t,mtof(SCALE[(i*7)%SCALE.length]+12),.6,'sine',.04,music,.002)}
const now=()=>ctx?ctx.currentTime:0;
const sfx={
 step(h=0){if(!ctx)return;tone(now(),300+Math.min(h,100)*6,.08,'triangle',.18,sfxBus,.002)},
 bullseye(){if(!ctx)return;[0,4,7,12,16].forEach((s,k)=>tone(now()+k*.07,mtof(76+s),.5,'sine',.22,sfxBus,.003))},
 good(){if(!ctx)return;[0,7].forEach((s,k)=>tone(now()+k*.08,mtof(72+s),.3,'triangle',.18,sfxBus))},
 wobble(){if(!ctx)return;const o=tone(now(),330,.6,'sawtooth',.08,sfxBus,.01,900);o.frequency.linearRampToValueAtTime(200,now()+.6);const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=9;lg.gain.value=25;l.connect(lg);lg.connect(o.frequency);l.start();l.stop(now()+.65)},
 slip(){if(!ctx)return;const o=tone(now(),500,.4,'square',.07,sfxBus,.005,1500);o.frequency.exponentialRampToValueAtTime(120,now()+.4)},
 whoosh(dur=1.6){if(!ctx)return;const b=ctx.createBuffer(1,ctx.sampleRate*dur,ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=2;f.frequency.setValueAtTime(300,now());f.frequency.exponentialRampToValueAtTime(2500,now()+dur);const g=ctx.createGain();g.gain.setValueAtTime(.001,now());g.gain.exponentialRampToValueAtTime(.4,now()+dur);s.connect(f);f.connect(g);g.connect(sfxBus);s.start()},
 splash(big=1){if(!ctx)return;noise(now(),.9*big,.5,sfxBus,-1800);noise(now()+.05,.5,.25,sfxBus,3000);for(let k=0;k<6;k++)tone(now()+.1+k*.06,600+Math.random()*900,.12,'sine',.08,sfxBus)},
 smack(){if(!ctx)return;noise(now(),.25,.9,sfxBus,-900);tone(now(),120,.25,'sine',.5,sfxBus,.001)},
 sparkle(){if(!ctx)return;for(let k=0;k<10;k++)tone(now()+k*.05,mtof(84+[0,2,4,7,9][k%5]+(k>4?12:0)),.4,'sine',.1,sfxBus,.002)},
 click(){if(!ctx)return;tone(now(),900,.04,'square',.05,sfxBus,.001,3000)}};
return{init,sfx,setLevel:h=>level=h,get muted(){return muted},toggle(){muted=!muted;localStorage.flopprMute=muted?'1':'0';if(master)master.gain.setTargetAtTime(muted?0:.9,ctx.currentTime,.05);return muted},resume(){if(ctx&&ctx.state==='suspended')ctx.resume()}}})();
