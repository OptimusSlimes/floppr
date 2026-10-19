(()=>{'use strict';
const F=window.FILMS,A=window.FlopAudio,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],N=7,LAUNCH=Date.UTC(2026,8,1),URL_LIVE='https://optimusslimes.github.io/floppr/';
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sydParts=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).reduce((o,p)=>(o[p.type]=+p.value,o),{});
const sp=sydParts(),todayNo=Math.floor((Date.UTC(sp.year,sp.month-1,sp.day)-LAUNCH)/864e5)+1;
// ---------- scoring ----------
// Tiers by worldwide gross / budget (midpoint). Hit/Smash cut moved 6x -> 8x so "Smash" means a true outlier and Hits are common enough to curate.
const tier=m=>m<1?0:m<2.5?1:m<8?2:3,TN=['Flop','Even','Hit','Smash'],TE=['💦','😐','🎉','🚀'],BONUS=3;
const ACC=[[1.1,11,'🎯','Bullseye!'],[1.25,8,'🟩','So close!'],[1.5,5,'🟨','Warm'],[2,3,'🟧','In the ballpark'],[3,0,'⬜','Way off'],[Infinity,-3,'🔻','Slip!']];
const lohi=f=>f.budgetRange?f.budgetRange:[f.budget,f.budget];
const ratio=(g,f)=>{const[lo,hi]=lohi(f);return g>=lo&&g<=hi?1:g<lo?lo/g:g/hi};
const acc=(g,f)=>{const r=ratio(g,f);return ACC.find(a=>r<=a[0])};
const DIVES=[[6,'swan','Perfect swan dive','🦢'],[4,'cannon','Cannonball!','💣'],[0,'belly','Belly flop!','💦']];
const heightOf=r=>r.reduce((h,x)=>Math.max(0,h+x.up+x.bonus),0);
// ---------- curated daily set ----------
function seeded(seed){let s=seed>>>0;return()=>(s=(s*1664525+1013904223)%4294967296)/4294967296}
function shuffle(a,seed){a=a.slice();const r=seeded(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const TIERS=[0,1,2,3].map(t=>shuffle(F.map((_,i)=>i).filter(i=>tier(F[i].gross/F[i].budget)===t),20260901+t*7919));
const NEED=[2,1,2,2];// 2 Flop, 1 Even, 2 Hit, 2 Smash
function setFor(n){const pick=[];NEED.forEach((k,t)=>{const L=TIERS[t];for(let j=0;j<k;j++)pick.push(L[(((n-1)*k+j)%L.length+L.length)%L.length])});
 let rest=pick.slice();const closer=rest.reduce((a,b)=>F[b].gross>F[a].gross?b:a);rest=rest.filter(i=>i!==closer);
 const easy=rest.filter(i=>!F[i].budgetRange&&F[i].gross>=3e8);const opener=(easy.length?easy:rest).reduce((a,b)=>F[b].gross>F[a].gross?b:a);rest=rest.filter(i=>i!==opener);
 return[opener,...shuffle(rest,n*31+7),closer].map(i=>F[i])}
// ---------- money ----------
function parse(raw){if(raw==null)return null;let s=String(raw).toLowerCase().trim().replace(/^usd|usd$/g,'').replace(/[$\s_]/g,'');
 if(!s)return null;if(/^\d{1,3}(,\d{3})+(\.\d+)?/.test(s))s=s.replace(/,/g,'');else s=s.replace(/,/g,'.');
 const m=s.match(/^(\d*\.?\d+)(k|thousand|grand|m|mm|mil|mill|million|millions|b|bn|bil|billion|billions)?\.?$/);if(!m)return null;
 let v=parseFloat(m[1]);const u=m[2]||'';if(u==='k'||u==='thousand'||u==='grand')v*=1e3;else if(u[0]==='b')v*=1e9;else if(u[0]==='m')v*=1e6;else if(v<5000)v*=1e6;
 return v>=1e3&&v<=5e9?v:null}
const fmt=n=>n>=1e9?'$'+(+(n/1e9).toFixed(2))+'B':n>=1e6?'$'+(+(n/1e6).toFixed(n<1e7?1:0))+'M':'$'+Math.round(n/1e3)+'K';
const full=n=>'$'+Math.round(n).toLocaleString('en-US'),xf=m=>m>=100?Math.round(m).toLocaleString('en-US'):m.toFixed(1);
const LO=Math.log(1e5),HI=Math.log(5e8),s2v=x=>Math.exp(LO+(HI-LO)*x/1000),v2s=v=>Math.max(0,Math.min(1000,1000*(Math.log(v)-LO)/(HI-LO)));
const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v))-1);return Math.round(v/p)*p};
// ---------- state ----------
const LS=Object.assign({days:{},streak:0,last:0,best:0},JSON.parse(localStorage.floppr4||'{}'));const save=()=>localStorage.floppr4=JSON.stringify(LS);
const qs=new URLSearchParams(location.search);let dayNo=todayNo,mode='daily';
if(qs.has('day')){dayNo=Math.min(todayNo,Math.max(1,parseInt(qs.get('day'))||todayNo));if(dayNo!==todayNo)mode='archive'}
let films,st,locked=null,busy=false,sliderTouched=false;
const height=()=>heightOf(st.r);
// ---------- cached elements ----------
const E={};['sky','starWrap','starWrap2','moon','planet','sun','pipWrap','pipSq','pip','board','boardPath','boardFill','hm','height','panel','armL','armR','legL','legR','ladder','pool','world'].forEach(k=>E[k]=document.getElementById(k));
E.layers=$$('.layer').map(l=>[l,+l.dataset.f]);
const root=document.documentElement,lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=t=>.5-.5*Math.cos(Math.PI*clamp(t,0,1)),eOut=t=>1-Math.pow(1-clamp(t,0,1),3);
const isMobile=()=>innerWidth<=820;
// ---------- layout (computed on resize / state change only: no per-frame reads => no stage bob) ----------
const Lay={};
function layout(){const vh=innerHeight,mob=isMobile();Lay.mob=mob;Lay.M=mob?4:8;Lay.rungM=mob?4:2;root.style.setProperty('--mpx',Lay.M);root.style.setProperty('--rungm',Lay.rungM);
 if(mob){Lay.sheet=Math.round(vh<640?clamp(vh*.6,262,400):clamp(vh*.45,262,380));root.style.setProperty('--sheet',Lay.sheet+'px');Lay.base=Lay.sheet+6+44+16}else Lay.base=Math.round(vh*.14);
 root.style.setProperty('--base',Lay.base+'px');
 Lay.ladCX=E.ladder.offsetLeft+E.ladder.offsetWidth/2;Lay.pipW=E.pipWrap.offsetWidth;Lay.feet=Lay.pipW*.08;
 Lay.poolCX=E.pool.offsetLeft+E.pool.offsetWidth/2;Lay.boardL=mob?110:150;E.board.setAttribute('width',Lay.boardL+10);E.board.setAttribute('viewBox',`0 0 ${Lay.boardL+10} 60`);
 E.board.style.left=(Lay.ladCX-7)+'px';
 const hud=70;Lay.avail=Math.max(120,vh-Lay.base-hud-Lay.pipW);Lay.lo=Lay.avail*.22;Lay.hi=Lay.avail*.6;
 $$('#hiClouds .cl,#midClouds .cl').forEach(c=>{const f=+c.closest('.layer').dataset.f;c.style.bottom=(Lay.base+(+c.style.getPropertyValue('--y'))*Lay.M*f)+'px'});
 sliderLabels()}
function sliderLabels(){$('#sliderLbls').innerHTML=[[1e5,'$100K'],[3e6,'$3M'],[1e8,'$100M'],[5e8,'$500M']].map(([v,l])=>`<span style="left:${v2s(v)/10}%">${l}</span>`).join('')}
// ---------- motion state ----------
const V={h:0,from:0,to:0,t0:0,dur:0,mode:'idle',amp:0,cam:0,camV:0,camT:0,camHold:0,rung:0,x:0,y:0,rot:0,board:null,queueNext:false,react:''};
function climbTo(h,onDone){V.from=V.h;V.to=h;V.t0=performance.now();V.dur=RM?1:clamp(450+Math.abs(h-V.h)*55,500,1400);V.mode=h===V.h?'cling':'climb';V.onDone=onDone;if(V.mode==='cling')onDone&&onDone();else if(h<V.h)setFace('worried');else setFace('focus')}
// ---------- Pip ----------
const FACES={happy:['M71 41 Q80 37 88 41','M112 41 Q120 37 129 41','M90 93 Q100 101 110 93',1],joy:['M71 38 Q80 32 88 38','M112 38 Q120 32 129 38','M86 91 Q100 108 114 91 Z',1],
 focus:['M71 43 L88 40','M112 40 L129 43','M93 95 L107 95',1],worried:['M72 38 L88 44','M112 44 L128 38','M90 98 Q95 92 100 97 Q105 92 110 98',1.1],
 sad:['M72 39 Q80 42 88 46','M112 46 Q120 42 128 39','M90 99 Q100 91 110 99',.9],wow:['M71 36 Q80 30 88 36','M112 36 Q120 30 129 36','M96 92 Q100 104 104 92 Q100 88 96 92Z',1.2],
 squint:['M71 44 Q80 40 88 44','M112 44 Q120 40 129 44','M88 92 Q100 104 112 92',.5]};
let curFace='happy';
function setFace(k){curFace=k;const f=FACES[k];$('#browL').setAttribute('d',f[0]);$('#browR').setAttribute('d',f[1]);const m=$('#mouth');m.setAttribute('d',f[2]);m.setAttribute('fill',f[2].endsWith('Z')?'#7a2d4f':'none');
 $$('#eyes .eye').forEach(e=>{e.style.transformBox='fill-box';e.style.transformOrigin='center';e.style.transform=`scaleY(${f[3]})`})}
const POSEFACE={idle:'happy',ladder:'happy',cheer:'joy',swan:'squint',cannon:'wow',belly:'wow',float:'sad',proud:'joy'};
function setPose(p,face){E.pipWrap.className='p-'+p+(V.react?' r-'+V.react:'');if(p!=='ladder')[E.armL,E.armR,E.legL,E.legR].forEach(l=>l.style.transform='');setFace(face||POSEFACE[p]||'happy')}
function react(r,face,ms=1300){V.react=r;E.pipWrap.classList.add('r-'+r);setFace(face);clearTimeout(react.t);react.t=setTimeout(()=>{E.pipWrap.classList.remove('r-'+r);V.react='';if(V.mode==='cling')setFace('happy')},ms)}
setInterval(()=>{if(V.mode!=='cling'&&V.mode!=='landed')return;const e=$$('#eyes .eye');e.forEach(x=>x.style.transform='scaleY(.1)');setTimeout(()=>setFace(curFace),130)},3800);
function ladderLimbs(t){// hand-over-hand cycle: one full cycle per rung (2 m)
 const ph=V.h/Lay.rungM*Math.PI*2,s=Math.sin(ph)*V.amp,c=Math.cos(ph)*V.amp;
 E.armL.style.transform=`rotate(${118+34*s}deg)`;E.armR.style.transform=`rotate(${-118+34*s}deg)`;E.legL.style.transform=`translateY(${-5*s}px)`;E.legR.style.transform=`translateY(${5*s}px)`;
 E.pipSq.style.transform=`translateY(${-Math.abs(c)*3}px) rotate(${s*3}deg)`}
// ---------- particles ----------
function pipScreen(){const r=E.pipWrap.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/3}}
function confetti(n=40){if(RM)return;const {x,y}=pipScreen(),C=['#ff7aa2','#ffd36e','#8fe3c8','#a9d8f5','#c7b5f2'];for(let i=0;i<n;i++){const c=document.createElement('div');c.className='conf';c.style.left=x+'px';c.style.top=y+'px';c.style.background=C[i%5];
 const a=Math.random()*Math.PI*2,sp=80+Math.random()*220;c.style.setProperty('--x',Math.cos(a)*sp+'px');c.style.setProperty('--y',(Math.sin(a)*sp+160)+'px');c.style.setProperty('--r',(Math.random()*900-450)+'deg');c.style.setProperty('--d',(1+Math.random()*.8)+'s');document.body.appendChild(c);setTimeout(()=>c.remove(),2000)}}
function sparkles(n=6,ch='✨'){if(RM)return;const {x,y}=pipScreen();for(let i=0;i<n;i++){const s=document.createElement('div');s.className='spark';s.textContent=ch;s.style.left=(x+Math.random()*120-60)+'px';s.style.top=(y+Math.random()*80-50)+'px';s.style.animationDelay=i*.07+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1500)}}
function splash(kind,h){const pool=E.pool.getBoundingClientRect(),pr=E.pipWrap.getBoundingClientRect(),cx=pr.left+pr.width/2,cy=pool.top-4,s=$('#fx');
 const n=RM?0:kind==='belly'?30+Math.round(h*.2):Math.round(10+h*.4),pow=(kind==='swan'?.6:kind==='cannon'?1.5:1.1)*(.6+h/100);
 for(let i=0;i<n;i++){const d=document.createElement('div');d.className='drop';d.style.left=cx+'px';d.style.top=cy+'px';d.style.setProperty('--s',(8+Math.random()*12)+'px');
  const spread=kind==='swan'?40:140;d.style.setProperty('--x',(Math.random()*2-1)*(spread+h*1.2)*pow+'px');d.style.setProperty('--y',-(60+Math.random()*(80+h*2.6))*pow+'px');d.style.setProperty('--d',(1+Math.random()*.6)+'s');s.appendChild(d);setTimeout(()=>d.remove(),1800)}
 if(!RM)for(let k=0;k<3;k++){const r=document.createElement('div');r.className='ring';r.style.left=cx+'px';r.style.top=cy+'px';r.style.setProperty('--w',(120+k*60+h*1.4)+'px');r.style.animationDelay=k*.15+'s';s.appendChild(r);setTimeout(()=>r.remove(),1600)}
 navigator.vibrate&&navigator.vibrate(kind==='belly'?[60,40,60]:40)}
function countUp(el,v,suffix=''){if(RM){el.textContent=fmt(v)+suffix;return}const t0=performance.now(),D=750;(function f(t){const p=Math.min(1,(t-t0)/D),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.max(1e3,v*e))+suffix;if(p<1)requestAnimationFrame(f)})(t0)}
// ---------- frame loop ----------
const SKY=[[0,[92,63,150],[233,130,160],[255,190,130]],[30,[52,40,120],[170,95,165],[245,150,130]],[60,[18,20,66],[60,48,130],[115,72,150]],[95,[3,3,18],[14,12,46],[44,30,92]]];
function skyAt(h){let i=0;while(i<SKY.length-2&&h>SKY[i+1][0])i++;const a=SKY[i],b=SKY[i+1],t=clamp((h-a[0])/(b[0]-a[0]),0,1);return[1,2,3].map(k=>`rgb(${a[k].map((x,j)=>Math.round(lerp(x,b[k][j],t))).join(',')})`)}
let lastT=performance.now(),lastSky=-1,maxLevel=0;window.__trace=[];
function frame(t){const dt=Math.min(.05,(t-lastT)/1000);lastT=t;const M=Lay.M;let pipY,pipX=0,rot=0,face=null;
 if(V.mode==='climb'){const p=(t-V.t0)/V.dur,prev=V.h;V.h=lerp(V.from,V.to,ease(p));const spd=Math.abs(V.h-prev)/Math.max(dt,1e-3);V.amp=lerp(V.amp,clamp(spd/5,0,1),Math.min(1,dt*12));
  const r=Math.floor(V.h/Lay.rungM);if(r!==V.rung){V.rung=r;A.sfx.step(V.h)}E.hm.textContent=Math.round(V.h);
  if(p>=1){V.h=V.to;V.mode='cling';if(!RM)E.pipSq.animate([{transform:'scale(1.1,.9)'},{transform:'scale(.96,1.04)'},{transform:'none'}],{duration:260,easing:'ease-out'});E.height.classList.remove('pop');void E.height.offsetWidth;E.height.classList.add('pop');V.onDone&&V.onDone()}}
 else if(V.mode==='cling')V.amp=lerp(V.amp,0,Math.min(1,dt*10));
 if(V.mode==='climb'||V.mode==='cling'){pipY=V.h*M;ladderLimbs(t)}
 else{const D=V.dv,b=V.board;pipY=D.y;pipX=D.x;rot=D.rot;diveStep(t,dt)}
 // board render (springboard flex)
 if(V.board){const b=V.board,L=Lay.boardL*b.ext,f=b.flex;E.board.style.bottom=(Lay.base+b.h*M-30)+'px';const d=`M4 30 Q ${4+L*.55} ${30+f*.35} ${4+L} ${30+f}`;E.boardPath.setAttribute('d',d);E.boardFill.setAttribute('d',d)}
 E.pipWrap.style.transform=`translate(${Lay.ladCX-Lay.pipW/2+pipX}px,${-(Lay.base+pipY-Lay.feet)}px) rotate(${rot}deg)`;
 // camera: deadzone + critically damped spring (no overshoot)
 const s=Lay.base+pipY-V.cam,lo=Lay.base+Lay.lo,hi=Lay.base+Lay.hi;
 if(t>V.camHold){if(s>hi)V.camT=V.cam+(s-hi);else if(s<lo)V.camT=Math.max(0,V.cam-(lo-s))}
 const w=RM?40:(V.mode==='fall'?7:4.2),a=w*w*(V.camT-V.cam)-2*w*V.camV;V.camV+=a*dt;let nc=V.cam+V.camV*dt;
 if((V.camT-V.cam)*(V.camT-nc)<0){nc=V.camT;V.camV=0}V.cam=nc;
 for(const[l,f]of E.layers)l.style.transform=`translateY(${(V.cam*f).toFixed(2)}px)`;
 const band=Lay.hi,hv=V.cam/M+band/M*clamp(V.cam/band,0,1);
 if(Math.abs(hv-lastSky)>.05){lastSky=hv;const sc=skyAt(hv);E.sky.style.background=`linear-gradient(${sc[0]},${sc[1]} 58%,${sc[2]})`;
  E.starWrap.style.opacity=clamp((hv-12)/35,0,1);E.starWrap2.style.opacity=clamp((hv-30)/40,0,1);E.moon.style.opacity=clamp((hv-40)/20,0,1);E.moon.style.transform=`translateY(${-hv*.6}px)`;
  E.planet.style.opacity=clamp((hv-78)/15,0,1);E.sun.style.transform=`translateY(${V.cam*.18+hv*2.2}px)`;E.sun.style.opacity=clamp(1-hv/45,0,1)}
 maxLevel=Math.max(maxLevel,V.mode==='climb'||V.mode==='cling'?V.h:maxLevel);A.setLevel(maxLevel);
 if(window.__traceOn)__trace.push([Math.round(t),+pipY.toFixed(2),+V.cam.toFixed(2),+(Lay.base+pipY-V.cam).toFixed(2),V.mode==='dive'?V.dv.phase:V.mode,+rot.toFixed(1)]);
 requestAnimationFrame(frame)}
// ---------- springboard dive ----------
function diveType(){const c=st.r.filter(x=>x.bonus).length;return DIVES.find(d=>c>=d[0])}
function dive(){if(V.mode!=='cling')return;E.pipSq.style.transform='';const h=height(),d=diveType(),M=Lay.M;busy=true;document.body.classList.add('diving');maxLevel=h;
 V.board={h,ext:0,flex:0};E.board.classList.add('on');const surf=h*M+8;
 V.dv={phase:'extend',t0:performance.now(),x:0,y:h*M,rot:0,kind:d[1],h,surf,bounces:RM?0:(d[1]==='swan'?2:d[1]==='cannon'?2:1),bi:0};V.mode='dive';setPose('idle','happy');A.sfx.click()}
function diveStep(t,dt){const D=V.dv,b=V.board,M=Lay.M,el=t-D.t0,tipX=Lay.boardL*.86;
 const go=(ph)=>{D.phase=ph;D.t0=t};
 switch(D.phase){
 case'extend':{const p=RM?1:el/380;b.ext=eOut(p);D.y=lerp(D.h*M,D.surf,eOut(p));if(p>=1)go('walk');break}
 case'walk':{const p=RM?1:el/650;D.x=lerp(0,tipX,ease(p));b.flex=6*ease(p);D.y=D.surf-b.flex*(D.x/tipX)+Math.abs(Math.sin(p*Math.PI*3))*4;if(p>=1){setPose(D.kind==='belly'?'idle':'cheer',D.kind==='belly'?'worried':'joy');go(D.bounces?'bounce':'launch')}break}
 case'bounce':case'launch':{// compress board then fly up
  const C=RM?1:170,AIR=360,J=D.phase==='launch'?0:(D.bi===0?22:36);
  if(el<C){const u=el/C,f=6+(D.phase==='launch'?26:16)*Math.sin(Math.PI*u*(D.phase==='launch'?.5:1));b.flex=f;D.y=D.surf-f;E.pipSq.style.transform=`scale(${1+.12*Math.sin(Math.PI*u)},${1-.12*Math.sin(Math.PI*u)})`}
  else if(D.phase==='launch'){E.pipSq.style.transform='';setPose(D.kind);A.sfx.whoosh(1+D.h/60);D.fx0=D.x;D.fy0=D.y;D.T=RM?350:900+D.h*14;b.t0=t;V.camHold=t+(RM?0:260);go('fall')}
  else{const u=(el-C)/AIR;E.pipSq.style.transform=u<.2?`scale(.94,1.08)`:'';b.flex=6-10*Math.sin(Math.PI*Math.min(1,u*2))*Math.exp(-u*2);D.y=D.surf-6+J*Math.sin(Math.PI*clamp(u,0,1));A.sfx&&u>0&&!D.sq&&(D.sq=1,A.sfx.step(60));if(u>=1){D.bi++;D.sq=0;go(D.bi>=D.bounces?'launch':'bounce')}}
  break}
 case'fall':{const p=clamp(el/D.T,0,1),e=p*p,endX=Lay.poolCX-Lay.ladCX,endY=-Lay.pipW*.15;
  D.y=(1-e)*D.fy0+(40+D.h*.4)*Math.sin(Math.PI*Math.min(1,p*1.6))*(1-p)+e*endY;D.x=lerp(D.fx0,endX,1-Math.pow(1-p,2));
  D.rot=D.kind==='swan'?lerp(0,180,ease(p*1.25)):D.kind==='cannon'?720*ease(p):lerp(0,90,ease(p*1.8));
  const bt=(t-b.t0)/1000;b.flex=6+20*Math.exp(-4*bt)*Math.cos(18*bt);E.hm.textContent=clamp(Math.round(Math.max(0,D.y)/M),0,D.h);
  if(p>=1){E.hm.textContent=0;go('hitstop')}break}
 case'hitstop':{if(el>=(RM?0:90)){splash(D.kind,D.h);if(D.kind==='belly'){A.sfx.smack();A.sfx.splash(1)}else{A.sfx.splash(D.kind==='cannon'?1.6:.6);if(D.kind==='swan'){A.sfx.sparkle();setTimeout(()=>sparkles(10),150)}}
   D.r0=D.rot;D.r1=D.kind==='swan'?360:D.kind==='cannon'?720:0;D.y0=D.y;go('settle');setPose(D.kind==='belly'?'float':'proud')}break}
 case'settle':{const p=RM?1:el/520;D.rot=lerp(D.r0,D.r1,eOut(p));D.y=lerp(D.y0,-Lay.pipW*.32,eOut(p));const bt=(t-b.t0)/1000;b.flex=6+20*Math.exp(-4*bt)*Math.cos(18*bt);
   if(p>=1){D.rot=D.r1;go('landed');E.hm.textContent=D.h;setTimeout(()=>{if(D.kind!=='belly')confetti(60);showEnd(true)},RM?200:1500)}break}
 case'landed':{const bt=(t-b.t0)/1000;b.flex=6+20*Math.exp(-4*bt)*Math.cos(18*bt);break}}}
// ---------- flow ----------
function begin(fs,m){films=fs;mode=m;st=(m!=='practice'&&LS.days[dayNo])||{r:[]};document.body.classList.remove('diving');E.board.classList.remove('on');V.board=null;V.dv=null;
 $('#kicker').textContent=m==='practice'?'Practice climb':m==='archive'?`Floppr #${dayNo} · archive`:`Floppr #${dayNo}`;
 V.mode='cling';V.h=V.to=height();V.amp=0;maxLevel=V.h;E.hm.textContent=V.h;setPose('ladder');if(st.r.length>=N)showEnd(false);else showFilm()}
function show(id){['play','reveal','end'].forEach(s=>$('#'+s).hidden=s!==id);const el=$('#'+id);el.classList.remove('sec');void el.offsetWidth;el.classList.add('sec')}
function dots(){$('#dots').innerHTML=Array.from({length:N},(_,i)=>`<i class="${i<st.r.length?'done':i===st.r.length?'cur':''}"></i>`).join('')}
function showFilm(){const f=films[st.r.length];locked=null;busy=false;sliderTouched=false;dots();show('play');
 $('#title').textContent=f.title;$('#meta').textContent=`Film ${st.r.length+1} of ${N} · ${f.year} · ${f.genre}`;
 const a=$('#amt');a.value='';a.disabled=false;a.className='';$('#slider').value=600;$('#slider').disabled=false;$('#lock').textContent='Lock';$('#preview').textContent='Type an amount or drag the slider';$('#calls').classList.remove('ready');
 if(matchMedia('(hover:hover)').matches)a.focus()}
function syncFromText(){const a=$('#amt'),v=parse(a.value);a.classList.toggle('bad',!!a.value.trim()&&!v);
 if(v){$('#slider').value=v2s(v);$('#preview').textContent=`= ${full(v)}`}else $('#preview').textContent=a.value.trim()?'Try 120M, 4.5m, 400k, 2 billion…':'Type an amount or drag the slider';return v}
function currentGuess(){const t=$('#amt').value.trim();return t?parse(t):sliderTouched?nice(s2v(+$('#slider').value)):null}
function lock(){if(locked){unlock();return true}const v=currentGuess(),a=$('#amt');if(!v){a.classList.add('shake','bad');$('#preview').textContent='Type a budget (or drag the slider) first';setTimeout(()=>a.classList.remove('shake'),300);return false}
 locked=v;a.value=fmt(v).slice(1);a.disabled=true;a.blur();a.className='locked';$('#slider').disabled=true;$('#lock').textContent='Edit';$('#preview').textContent=`🔒 ${full(v)} · now call it!`;$('#calls').classList.add('ready');A.sfx.click();return true}
function unlock(){locked=null;const a=$('#amt');a.disabled=false;a.className='';$('#slider').disabled=false;$('#lock').textContent='Lock';$('#calls').classList.remove('ready');syncFromText();a.focus()}
function call(v){if(busy||$('#play').hidden||V.mode!=='cling')return;if(!locked&&!lock())return;busy=true;const f=films[st.r.length],g=locked,m=f.gross/f.budget,t=tier(m),AC=acc(g,f),[lo,hi]=lohi(f);
 const rec={i:F.indexOf(f),g,call:v,up:AC[1],bonus:v===t?BONUS:0};st.r.push(rec);persist();const after=height();
 show('reveal');dots();$('#rTitle').textContent=f.title;const rh=$('#rHead');rh.textContent=`${AC[2]} ${AC[3]} ${AC[1]>0?'+'+AC[1]+'m':AC[1]<0?AC[1]+'m':'+0m'}`;rh.classList.remove('big');void rh.offsetWidth;rh.classList.add('big');
 countUp($('#rGuess'),g);setTimeout(()=>countUp($('#rBudget'),f.budget,f.budgetRange?'*':''),250);setTimeout(()=>countUp($('#rGross'),f.gross),500);
 const inR=g>=lo&&g<=hi,off=inR?0:g<lo?(1-g/lo):(g/hi-1);$('#rOff').textContent=inR?(f.budgetRange?'inside the range ✓':'spot on ✓'):`${Math.round(Math.abs(off)*100)}% ${g<lo?'under':'over'}`;
 $('#rRange').textContent=f.budgetRange?`sources: ${fmt(lo)}–${fmt(hi)}`:'';$('#rMult').textContent=f.budgetRange?`${xf(f.gross/hi)}–${xf(f.gross/lo)}× back`:`${xf(m)}× back`;
 const seg=[0.1,1,2.5,8,60].map(x=>Math.log10(x)),lm=clamp(Math.log10(m),seg[0],seg[4]),fr=(lm-seg[t])/(seg[t+1]-seg[t]);$('#needle').style.left='0';setTimeout(()=>$('#needle').style.left=`calc(${(t+fr)*25}% - 3px)`,700);
 const rc=$('#rCall');rc.className='rcall'+(v===t?'':' bad');rc.innerHTML=v===t?`📣 You called <b>${TN[v]}</b> ✅ <b>+${BONUS}m bonus</b>`:`📣 You called <b>${TN[v]}</b> ❌ It was a <b>${TN[t]} ${TE[t]}</b>. Pip wobbles!`;
 $('#rSrc').innerHTML=`Source: <a href="${f.source}" target="_blank" rel="noopener">Wikipedia</a>${f.budgetRange?' · *midpoint of the reported range':''}${f.budgetNote?' · '+f.budgetNote:''}${f.grossNote?' · gross '+f.grossNote:''}. Not inflation-adjusted.`;
 $('#next').textContent=st.r.length>=N?'🏊 Time to dive!':'Next film →';
 if(AC[1]===11){A.sfx.bullseye();setTimeout(()=>confetti(50),150);sparkles(8,'⭐');navigator.vibrate&&navigator.vibrate(30)}else if(AC[1]>=5){A.sfx.good();sparkles(4)}else if(AC[1]<0)A.sfx.slip();
 setTimeout(()=>climbTo(after,()=>{if(v!==t){A.sfx.wobble();react('nervous','worried',1400)}else if(AC[1]>=8)react('cheer','joy');else setFace('happy');if(V.queueNext){V.queueNext=false;next()}}),300);
 setTimeout(()=>$('#next').focus(),60)}
function next(){if(V.mode==='climb'){V.queueNext=true;$('#next').textContent='…';return}if(st.r.length>=N)dive();else{setFace('happy');showFilm()}}
function countdown(){const p=sydParts(),mins=24*60-(p.hour*60+p.minute);return`${Math.floor(mins/60)}h ${mins%60}m`}
function showEnd(anim){const h=height(),d=diveType(),c=st.r.filter(x=>x.bonus).length,bulls=st.r.filter(x=>x.up===11).length,close=st.r.filter(x=>x.up===8).length;busy=false;dots();document.body.classList.remove('diving');show('end');
 if(!anim){V.board={h,ext:1,flex:6};E.board.classList.add('on');V.dv={phase:'landed',x:Lay.poolCX-Lay.ladCX,y:-Lay.pipW*.32,rot:0,kind:d[1],h};V.board.t0=performance.now()-5000;V.mode='dive';setPose(d[1]==='belly'?'float':'proud')}
 E.hm.textContent=h;$('#eHead').textContent=`${d[3]} ${d[2]} from ${h}m`;$('#eSub').textContent=`${bulls} bullseye${bulls===1?'':'s'} · ${close} close · ${c}/7 calls right`;
 $('#recap tbody').innerHTML=st.r.map((x,k)=>{const f=F[x.i];return`<tr style="animation-delay:${k*.07}s"><td>${f.title}</td><td>${fmt(x.g)}</td><td>${f.budgetRange?fmt(f.budgetRange[0])+'–'+fmt(f.budgetRange[1]):fmt(f.budget)}</td><td>${fmt(f.gross)}</td><td>${TE[x.call]}${x.bonus?'✅':'❌'}</td><td>${x.up+x.bonus>0?'+':''}${x.up+x.bonus}</td></tr>`}).join('');
 const climb=st.r.map(x=>acc(x.g,F[x.i])[2]).join(''),calls=st.r.map(x=>x.bonus?'✅':'❌').join('');
 $('#share').textContent=`🦛 Floppr ${mode==='practice'?'practice':'#'+dayNo} · ${h}m ${d[3]}\n🪜 ${climb}\n📣 ${calls}${mode==='daily'&&LS.streak>1?'\n🔥 '+LS.streak+'-day streak':''}\n${URL_LIVE}`;
 $('#best').textContent=`Best height: ${LS.best}m · Streak: ${LS.streak}${mode==='daily'?' · Next films in '+countdown()+' (Sydney midnight)':''}`}
function persist(){if(mode==='practice')return;LS.days[dayNo]=st;if(st.r.length===N){LS.best=Math.max(LS.best,height());if(mode==='daily'&&LS.last!==dayNo){LS.streak=(LS.last===dayNo-1?LS.streak:0)+1;LS.last=dayNo}}save();$('#streak').textContent=LS.streak?'🔥'+LS.streak:''}
// ---------- wiring ----------
const amt=$('#amt');amt.addEventListener('input',syncFromText);amt.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lock()}});
$('#slider').addEventListener('input',e=>{sliderTouched=true;const v=nice(s2v(+e.target.value));amt.value=fmt(v).slice(1);amt.classList.remove('bad');$('#preview').textContent=`= ${full(v)}`});
$('#lock').onclick=()=>lock();$$('.v').forEach(b=>b.onclick=()=>call(+b.dataset.v));
document.addEventListener('keydown',e=>{if($('dialog[open]'))return;if(!$('#play').hidden&&/^[1-4]$/.test(e.key)&&(locked||document.activeElement!==amt)){e.preventDefault();call(+e.key-1)}
 else if(!$('#reveal').hidden&&e.key==='Enter'&&document.activeElement!==$('#next')){e.preventDefault();next()}});
$('#next').onclick=next;
$('#copy').onclick=async()=>{const t=$('#share').textContent,b=$('#copy');
 if(navigator.share&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
 try{await navigator.clipboard.writeText(t);b.textContent='Copied! 📋'}catch{const r=document.createRange();r.selectNodeContents($('#share'));getSelection().removeAllRanges();getSelection().addRange(r);b.textContent='Selected, press copy'}setTimeout(()=>b.textContent='Share result',2000)};
$('#practice').onclick=()=>{const r=Math.floor(Math.random()*1e6)+5000;begin(setFor(r),'practice')};
$('#helpBtn').onclick=()=>$('#help').showModal();$('#helpClose').onclick=()=>$('#help').close();$('#archClose').onclick=()=>$('#arch').close();
$('#archBtn').onclick=()=>{$('#archList').innerHTML='';for(let n=todayNo;n>=Math.max(1,todayNo-30);n--){const b=document.createElement('button'),d=LS.days[n];b.textContent=`#${n}${n===todayNo?' (today)':''} ${d&&d.r.length>=N?'· '+heightOf(d.r)+'m':d&&d.r.length?'· in progress':''}`;b.onclick=()=>location.search='?day='+n;$('#archList').appendChild(b)}$('#arch').showModal()};
$('#pip').addEventListener('click',()=>{if(V.mode==='cling'){react('cheer','joy');A.sfx.good()}});
const mb=$('#mute'),mi=()=>mb.textContent=A.muted?'🔇':'🔊';mi();mb.onclick=()=>{A.init();A.toggle();mi()};
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{A.init();A.resume()},{passive:true}));
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(layout,120)});
$('#marks').innerHTML=Array.from({length:10},(_,i)=>`<span style="bottom:calc(${(i+1)*10} * var(--mpx) * 1px - 9px)">${(i+1)*10}m</span>`).join('');
$('#streak').textContent=LS.streak?'🔥'+LS.streak:'';if(!LS.seen){LS.seen=1;save();setTimeout(()=>$('#help').showModal(),300)}
layout();if(document.fonts)document.fonts.ready.then(layout);
window.__floppr={parse,setFor,todayNo,V,Lay,tier,F};begin(setFor(dayNo),mode);requestAnimationFrame(frame)})();
