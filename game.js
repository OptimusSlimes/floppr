(()=>{'use strict';
const F=window.FILMS,LM=window.LANDMARKS||[],B=window.FlopBands,FX=window.FlopFX,A=window.FlopAudio,BANDS=B.BANDS;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],N=7,LAUNCH=Date.UTC(2026,8,1),URL_LIVE='https://optimusslimes.github.io/floppr/';
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sydParts=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).reduce((o,p)=>(o[p.type]=+p.value,o),{});
const sp=sydParts(),todayNo=Math.floor((Date.UTC(sp.year,sp.month-1,sp.day)-LAUNCH)/864e5)+1,todayISO=`${sp.year}-${String(sp.month).padStart(2,'0')}-${String(sp.day).padStart(2,'0')}`;
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=t=>.5-.5*Math.cos(Math.PI*clamp(t,0,1)),eOut=t=>1-Math.pow(1-clamp(t,0,1),3);
// ================= scoring v2 (pure) =================
const tier=m=>m<1?0:m<2.5?1:m<8?2:3,TN=['Flop','Even','Hit','Smash'],TE=['💦','😐','🎉','🚀'];
const CLIMB=[[1.1,3000,'🎯','Bullseye'],[1.25,2000,'🟩','So close'],[1.5,1300,'🟨','Warm'],[2,700,'🟧','Ballpark'],[3,350,'⬜','Way off'],[Infinity,150,'☁️','Wild']];
const MULT=[1,1.5,2,3,4,6],FLOOR=700,PCAP=2000,HEAD=2;
const SHELVES=[['Shoestring',1e5,5e6,'<$5M'],['Indie',5e6,2e7,'$5–20M'],['Mid',2e7,6e7,'$20–60M'],['Studio',6e7,1.2e8,'$60–120M'],['Blockbuster',1.2e8,2e8,'$120–200M'],['Mega',2e8,5e8,'$200M+']];
const shelfOf=v=>v<5e6?0:v<2e7?1:v<6e7?2:v<1.2e8?3:v<2e8?4:5;
const lohi=f=>f.budgetRange?f.budgetRange:[f.budget,f.budget];
const ratio=(g,f)=>{const[lo,hi]=lohi(f);return g>=lo&&g<=hi?1:g<lo?lo/g:g/hi};
const tierIdx=r=>CLIMB.findIndex(a=>r<=a[0]);
const shelfOk=(s,f)=>{if(s==null)return false;const[lo,hi]=lohi(f),S=SHELVES[s];return hi>=S[1]&&lo<(s===5?Infinity:S[2])};
function scoreDay(items){let L=0,tot=0,maxM=1;const films=items.map((x,k)=>{const ti=x.tier!=null?x.tier:tierIdx(x.r);let base=CLIMB[ti][1],note='';
  if(x.shelfOk&&base<FLOOR){base=FLOOR;note='shelf floor'}if(x.prod&&base>PCAP){base=PCAP;note='🎬 capped'}
  const L0=L;L=x.right?Math.min(5,L+1):Math.max(0,L-1);const head=k===6&&x.right?HEAD:1,gain=Math.round(base*MULT[L]*head);tot+=gain;maxM=Math.max(maxM,MULT[L]);
  return{ti,base,note,L0,L,mult:MULT[L],head,gain,cum:tot}});
 return{films,total:tot,maxMult:maxM,rights:items.filter(x=>x.right).length,level:L}}
const itemsOf=r=>r.map(x=>{const f=F[x.i];return{r:ratio(x.g,f),shelfOk:shelfOk(x.shelf,f),right:x.call===tier(f.gross/f.budget),prod:!!x.prod}});
const prodHint=(g,f)=>{const r=ratio(g,f),[lo]=lohi(f);return r<=1.1?'✓':g<lo?'↑':'↓'};
// v3: the dive is chosen by the day's final altitude. [min metres, kind, name, emoji, judges' base score]
const DIVES=[[0,'belly','Belly Flop','💦',3],[6000,'cannon','Cannonball','💣',5.5],[12000,'flip','Front Flip','🤸',7],[25000,'hero','The Superhero','🦸',8],[50000,'star','Starfish Twister','⭐',9],[100000,'reentry','Re-entry Triple','☄️',9.5]];
const diveIdx=t=>{let i=0;while(i<DIVES.length-1&&t>=DIVES[i+1][0])i++;return i};
const diveOf=S=>DIVES[diveIdx(S.total)];
const judgesFor=(S,seed)=>{const i=diveIdx(S.total),base=DIVES[i][4],bulls=S.films.filter(x=>x.ti===0).length,adj=(S.rights-3.5)*.25+bulls*.1,r=seeded(seed);return[0,1,2].map(()=>clamp(Math.round((base+adj+(r()-.5)*1.2)*2)/2,0,10))};
// landmarks crossed going up from a to b (a<h<=b)
const lmBetween=(a,b)=>LM.filter(l=>l.h>a&&l.h<=b);
const lmBelow=h=>LM.filter(l=>l.h<=h);
const burjs=m=>m/828;
const fmtAlt=m=>m<1000?Math.round(m).toLocaleString('en-US')+' m':(m/1000).toFixed(1)+' km';
const fmtM=m=>Math.round(m).toLocaleString('en-US')+' m';
// ================= daily set (new films join the rotation from day 50 so days 1–49 keep their films) =================
function seeded(seed){let s=seed>>>0;return()=>(s=(s*1664525+1013904223)%4294967296)/4294967296}
function shuffle(a,seed){a=a.slice();const r=seeded(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const TCACHE={};const tiersFor=n=>{const P=n<50?146:F.length;return TCACHE[P]||(TCACHE[P]=[0,1,2,3].map(t=>shuffle(F.slice(0,P).map((_,i)=>i).filter(i=>tier(F[i].gross/F[i].budget)===t),20260901+t*7919)))};
const NEED=[2,1,2,2];
function setFor(n){const T=tiersFor(n),pick=[];NEED.forEach((k,t)=>{const L=T[t];for(let j=0;j<k;j++)pick.push(L[(((n-1)*k+j)%L.length+L.length)%L.length])});
 let rest=pick.slice();const closer=rest.reduce((a,b)=>F[b].gross>F[a].gross?b:a);rest=rest.filter(i=>i!==closer);
 const easy=rest.filter(i=>!F[i].budgetRange&&F[i].gross>=3e8);const opener=(easy.length?easy:rest).reduce((a,b)=>F[b].gross>F[a].gross?b:a);rest=rest.filter(i=>i!==opener);
 return[opener,...shuffle(rest,n*31+7),closer].map(i=>F[i])}
// ================= money =================
function parse(raw){if(raw==null)return null;let s=String(raw).toLowerCase().trim().replace(/^usd|usd$/g,'').replace(/[$\s_]/g,'');
 if(!s)return null;if(/^\d{1,3}(,\d{3})+(\.\d+)?/.test(s))s=s.replace(/,/g,'');else s=s.replace(/,/g,'.');
 const m=s.match(/^(\d*\.?\d+)(k|thousand|grand|m|mm|mil|mill|million|millions|b|bn|bil|billion|billions)?\.?$/);if(!m)return null;
 let v=parseFloat(m[1]);const u=m[2]||'';if(u==='k'||u==='thousand'||u==='grand')v*=1e3;else if(u[0]==='b')v*=1e9;else if(u[0]==='m')v*=1e6;else if(v<5000)v*=1e6;
 return v>=1e3&&v<=5e9?v:null}
const fmtR=(lo,hi)=>lo>=1e6&&hi<1e9?'$'+(+(lo/1e6).toFixed(lo<1e7?1:0))+'–'+(+(hi/1e6).toFixed(hi<1e7?1:0))+'M':fmt(lo)+'–'+fmt(hi);
const fmt=n=>n>=1e9?'$'+(+(n/1e9).toFixed(2))+'B':n>=1e6?'$'+(+(n/1e6).toFixed(n<1e7?1:0))+'M':'$'+Math.round(n/1e3)+'K';
const xf=m=>m>=100?Math.round(m).toLocaleString('en-US'):m.toFixed(1);
const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v))-1);return Math.round(v/p)*p};
const s2v=(x,k)=>{const S=SHELVES[k];return Math.exp(Math.log(S[1])+(Math.log(S[2])-Math.log(S[1]))*x/1000)};
const v2s=(v,k)=>{const S=SHELVES[k];return clamp(1000*(Math.log(v)-Math.log(S[1]))/(Math.log(S[2])-Math.log(S[1])),0,1000)};
// ================= storage (floppr5, migrated from floppr4) =================
const KEY='floppr5',DEF={days:{},classic:{},streak:0,last:0,best:0,freezes:0,album:{},seen:0,rehearsed:0};
const classicH=r=>r.reduce((h,x)=>Math.max(0,h+(x.up||0)+(x.bonus||0)),0);
function migrate(o){const d=JSON.parse(JSON.stringify(DEF));if(!o)return d;for(const n in o.days||{}){const r=(o.days[n]||{}).r||[];if(r.length)d.classic[n]={m:classicH(r),done:r.length>=7}}
 d.streak=o.streak||0;d.last=o.last||0;d.bestClassic=o.best||0;d.seen=o.seen||0;d.rehearsed=o.seen?1:0;d.migrated=1;return d}
function loadLS(){let d=null;try{d=JSON.parse(localStorage[KEY]||'null')}catch(e){}if(!d){let o=null;try{o=JSON.parse(localStorage.floppr4||'null')}catch(e){}d=migrate(o)}return Object.assign(JSON.parse(JSON.stringify(DEF)),d)}
const LS=loadLS();const save=()=>{try{localStorage[KEY]=JSON.stringify(LS)}catch(e){}};save();
function streakOnComplete(S,n){if(S.last===n)return S;const gap=S.last?n-S.last-1:0;S.usedFreeze=0;
 if(!S.last||gap<0)S.streak=1;else if(gap===0)S.streak++;else if(gap<=S.freezes){S.freezes-=gap;S.usedFreeze=gap;S.streak++}else S.streak=1;
 S.last=n;if(S.streak%7===0)S.freezes=Math.min(2,(S.freezes||0)+1);return S}
const streakShown=()=>{const gap=todayNo-LS.last-1;return gap<=0||gap<=LS.freezes?LS.streak:0};
const qs=new URLSearchParams(location.search);let dayNo=todayNo,mode='daily';
if(qs.has('day')){dayNo=Math.min(todayNo,Math.max(1,parseInt(qs.get('day'))||todayNo));if(dayNo!==todayNo)mode='archive'}
const VS=(()=>{const m=/^(\d+)\.(\d+)$/.exec(qs.get('vs')||'');return m?{day:+m[1],m:+m[2]}:null})();
const DEBUG_ALT=(()=>{const m=/alt:(\d+)/.exec(qs.get('debug')||'');return m?+m[1]:null})();
// ================= elements & layout =================
const E={};['sky','starWrap','starWrap2','sun','shake','pipWrap','pipSq','pip','board','boardPath','boardFill','hm','hband','height','panel','armL','armR','legL','legR','ladder','marks','pool','world','rig','near','far','front','fxc','fade','bandCard','toast','updraft','ghost','lot','farHills','slider','amt','gval','hint','shelves','prod','prodLeft','calls','lmPop','gainPop','diveName','judges'].forEach(k=>E[k]=document.getElementById(k));
E.layers=$$('.layer').map(l=>[l,+l.dataset.f]);
const root=document.documentElement,isMobile=()=>innerWidth<=820,Lay={};
function layout(){const vh=innerHeight,mob=isMobile();Lay.mob=mob;
 if(mob){Lay.sheet=vh<640?208:vh<760?226:236;root.style.setProperty('--sheet',Lay.sheet+'px');Lay.base=Lay.sheet+6+44+16}else Lay.base=Math.round(vh*.14);
 root.style.setProperty('--base',Lay.base+'px');Lay.vh=vh;Lay.stage=Math.max(80,vh-Lay.base);const BP=Lay.BP=Math.round(1.25*Lay.stage);root.style.setProperty('--bp',BP+'px');
 E.ladder.innerHTML=BANDS.map((b,i)=>`<div class="seg m-${b.mat}" style="bottom:${i*BP}px;height:${BP+1}px"></div>`).join('')+`<div id="ladTop" style="bottom:${8*BP}px"></div>`;E.ladder.style.height=8*BP+'px';
 {let last=-1e9;const mk=[];BANDS.slice(1).forEach(b=>mk.push([B.Y(b.lo,BP),`<span class="bmark" style="bottom:${B.Y(b.lo,BP).toFixed(0)}px">${fmtAlt(b.lo)}</span>`,1]));
  LM.forEach(l=>{const y=B.Y(l.h,BP);mk.push([y,`<span class="mile${l.au?' au':''}" style="bottom:${y.toFixed(0)}px">${l.e} ${l.n} <i>${l.range||fmtAlt(l.h)}</i></span>`,0])});
  const bandYs=mk.filter(m=>m[2]).map(m=>m[0]);mk.sort((a,b)=>a[0]-b[0]);
  E.marks.innerHTML=mk.filter(m=>{if(m[2])return true;if(m[0]-last<22||bandYs.some(y=>Math.abs(y-m[0])<20))return false;last=m[0];return true}).map(m=>m[1]).join('')}
 B.build(E.near,E.far,E.front,BP,.6);E.farProps=$$('#far .prop').map(el=>[el,+el.dataset.b]);
 Lay.ladCX=E.ladder.offsetLeft+E.ladder.offsetWidth/2;Lay.pipW=E.pipWrap.offsetWidth;Lay.feet=Lay.pipW*.08;
 Lay.poolCX=E.pool.offsetLeft+E.pool.offsetWidth/2;Lay.boardL=mob?110:150;E.board.setAttribute('width',Lay.boardL+10);E.board.setAttribute('viewBox',`0 0 ${Lay.boardL+10} 60`);E.board.style.left=(Lay.ladCX-7)+'px';
 const hud=mob?52:70;Lay.avail=Math.max(100,vh-Lay.base-hud-Lay.pipW);Lay.lo=Lay.avail*.22;Lay.hi=Lay.avail*.6;Lay.rung=mob?18:24;
 if(VS&&VS.day===dayNo){E.ghost.hidden=false;E.ghost.style.bottom=(Lay.base+B.Y(VS.m,BP))+'px';E.ghost.textContent='🚩 Friend · '+fmtAlt(VS.m)}
 FX.resize();if(V.alt!=null)V.Y=B.Y(V.alt,BP);lastSky=-1}
// ================= motion state =================
const V={lmTop:0,alt:0,Y:0,fromAlt:0,toAlt:0,t0:0,dur:1,mode:'idle',amp:0,ph:0,cam:0,camV:0,camT:0,camHold:0,board:null,queueNext:false,react:'',band:0,sway:0,swayV:0,gust:null,nextGust:0};
let gt=0,holdUntil=0,trauma=0,lastT=performance.now(),lastSky=-1,musicBand=0;window.__trace=[];
const addTrauma=x=>{if(RM){E.height.classList.remove('flash');void E.height.offsetWidth;E.height.classList.add('flash');return}trauma=Math.min(1,trauma+x)};
const hitStop=ms=>{holdUntil=Math.max(holdUntil,performance.now()+ms)};
const climbDur=(a0,a1)=>{const bc=Math.max(0,B.bandOf(a1)-B.bandOf(a0)),g=Math.max(100,Math.abs(a1-a0));return clamp(700+650*bc+250*Math.log10(g/100),900,3200)};
function climbTo(alt,onDone){V.fromAlt=V.alt;V.toAlt=alt;V.t0=gt;V.dur=(RM?300:climbDur(V.fromAlt,alt))/1000;V.onDone=onDone;
 if(alt===V.alt){V.mode='cling';onDone&&onDone();return}V.mode='climb';setFace(alt<V.alt?'worried':'focus');if(RM){E.fade.classList.remove('go');void E.fade.offsetWidth;E.fade.classList.add('go')}}
// ================= Pip =================
const FACES={happy:['M71 41 Q80 37 88 41','M112 41 Q120 37 129 41','M90 93 Q100 101 110 93',1],joy:['M71 38 Q80 32 88 38','M112 38 Q120 32 129 38','M86 91 Q100 108 114 91 Z',1],
 focus:['M71 43 L88 40','M112 40 L129 43','M93 95 L107 95',1],worried:['M72 38 L88 44','M112 44 L128 38','M90 98 Q95 92 100 97 Q105 92 110 98',1.1],
 sad:['M72 39 Q80 42 88 46','M112 46 Q120 42 128 39','M90 99 Q100 91 110 99',.9],wow:['M71 36 Q80 30 88 36','M112 36 Q120 30 129 36','M96 92 Q100 104 104 92 Q100 88 96 92Z',1.2],
 squint:['M71 44 Q80 40 88 44','M112 44 Q120 40 129 44','M88 92 Q100 104 112 92',.5]};
let curFace='happy';
function setFace(k){curFace=k;const f=FACES[k];$('#browL').setAttribute('d',f[0]);$('#browR').setAttribute('d',f[1]);const m=$('#mouth');m.setAttribute('d',f[2]);m.setAttribute('fill',f[2].endsWith('Z')?'#7a2d4f':'none');
 $$('#eyes .eye').forEach(e=>{e.style.transformBox='fill-box';e.style.transformOrigin='center';e.style.transform=`scaleY(${f[3]})`})}
const POSEFACE={idle:'happy',ladder:'happy',cheer:'joy',swan:'squint',cannon:'wow',belly:'wow',float:'sad',proud:'joy',pike:'focus',hero:'joy',star:'wow'};
function setPose(p,face){E.pipWrap.className='p-'+p+(V.react?' r-'+V.react:'');if(p!=='ladder')[E.armL,E.armR,E.legL,E.legR].forEach(l=>l.style.transform='');setFace(face||POSEFACE[p]||'happy')}
function react(r,face,ms=1300){V.react=r;E.pipWrap.classList.add('r-'+r);setFace(face);clearTimeout(react.t);react.t=setTimeout(()=>{E.pipWrap.classList.remove('r-'+r);V.react='';if(V.mode==='cling')setFace('happy')},ms)}
setInterval(()=>{if(V.mode!=='cling'&&V.mode!=='landed')return;const e=$$('#eyes .eye');e.forEach(x=>x.style.transform='scaleY(.1)');setTimeout(()=>setFace(curFace),130)},3800);

function ladderLimbs(){const s=Math.sin(V.ph)*V.amp,c=Math.cos(V.ph)*V.amp;
 E.armL.style.transform=`rotate(${118+34*s}deg)`;E.armR.style.transform=`rotate(${-118+34*s}deg)`;E.legL.style.transform=`translateY(${-5*s}px)`;E.legR.style.transform=`translateY(${5*s}px)`;
 E.pipSq.style.transform=`translateY(${-Math.abs(c)*3}px) rotate(${s*3}deg)`}
const pipScreen=()=>{const r=E.pipWrap.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/3}};
// ================= band crossing =================
const MUSIC=[0,15,35,55,80,80,80,80];
function onBand(bi,silent){V.band=bi;E.hband.textContent=BANDS[bi].n;if(silent)return;
 const c=E.bandCard;c.querySelector('b').textContent=BANDS[bi].n;const b=BANDS[bi];c.querySelector('em').textContent=`${b.icon} ${fmtAlt(b.lo)}${bi<7?'–'+fmtAlt(b.hi):'+'}${LS.album[bi]&&LS.album[bi].day===dayNo&&mode==='daily'?' · postcard unlocked!':''}`;
 c.classList.remove('show','mini');void c.offsetWidth;c.classList.add('show');clearTimeout(onBand.t);onBand.t=setTimeout(()=>c.classList.remove('show'),1600);
 addTrauma(.15);A.sfx.chime(bi);navigator.vibrate&&navigator.vibrate([15,40,15])}
// ---- landmark + gain pop-ups that ride alongside Pip ----
function lmShow(l,stay){const p=E.lmPop;p.innerHTML=`<small>${stay?'Today\'s peak':'Passed'}</small><span>${l.e} <b>${l.n}</b> <i>${l.range||fmtAlt(l.h)}</i></span>`;
 p.classList.remove('show','stay');void p.offsetWidth;p.classList.add('show');if(stay)p.classList.add('stay');if(!stay)A.sfx.tick(6);
 clearTimeout(lmShow.t);if(!stay)lmShow.t=setTimeout(()=>p.classList.remove('show'),1500);window.__lmShown=(window.__lmShown||[]);window.__lmShown.push(l.n)}
function peakPop(S){const p=E.lmPop,top=lmBelow(S.total).pop(),bz=burjs(S.total);p.innerHTML=`<small>📸 Today's peak · ${fmtAlt(S.total)}</small><span>${top?`Higher than ${top.e} <b>${top.n}</b>`:''}</span><span class="bz">🏙️ ${bz>=1?Math.floor(bz)+' Burj Khalifa'+(Math.floor(bz)===1?'':'s')+' tall':Math.round(bz*100)+'% of a Burj Khalifa'}</span>`;
 p.classList.remove('show');void p.offsetWidth;p.classList.add('show','stay');clearTimeout(lmShow.t)}
function gainShow(txt,ti){const g=E.gainPop;g.innerHTML=txt;g.className='t'+ti;void g.offsetWidth;g.classList.add('show');clearTimeout(gainShow.t);gainShow.t=setTimeout(()=>g.classList.remove('show'),2600)}
function followPops(){const on=E.lmPop.classList.contains('show')||E.gainPop.classList.contains('show');if(!on)return;const r=E.pipWrap.getBoundingClientRect(),W=innerWidth,bc=E.bandCard.classList.contains('show')?E.bandCard.getBoundingClientRect().bottom+8:0,minY=Math.max(Lay.mob?100:90,bc);
 if(E.lmPop.classList.contains('show')){const w=E.lmPop.offsetWidth,h=E.lmPop.offsetHeight;let x=r.right+10,y=r.top+r.height*.1-h/2;if(x+w>W-8){x=clamp(r.left+r.width/2-w/2,8,W-8-w);y=r.top-h-12}y=clamp(y,minY,innerHeight-h-(Lay.mob&&!document.body.classList.contains('climbing')&&!document.body.classList.contains('diving')?Lay.sheet+12:12));E.lmPop.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`}
 if(E.gainPop.classList.contains('show')){const w=E.gainPop.offsetWidth;let x=r.left+r.width/2-w/2;x=clamp(x,8,W-w-8);E.gainPop.style.transform=`translate(${x.toFixed(1)}px,${Math.max(minY-10,r.top-46).toFixed(1)}px)`}}
function toast(msg){const t=E.toast;t.innerHTML=msg;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600)}
// ================= wind =================
function windStep(t,dt){const alt=V.mode==='climb'||V.mode==='cling'?V.alt:0,bi=B.bandOf(alt),level=alt>800&&(V.mode==='climb'||V.mode==='cling')?BANDS[bi].wind:0;let env=0;
 if(level){if(!V.nextGust)V.nextGust=gt+3+Math.random()*4;
  if(!V.gust&&gt>=V.nextGust){V.gust={t0:gt,d:.8+Math.random()*.8,dir:Math.random()<.5?-1:1,level};V.nextGust=gt+V.gust.d+clamp(3+(-Math.log(1-Math.random()))*2,3,7);(window.__gusts=window.__gusts||[]).push([Math.round(gt*1000),alt,level]);
   FX.streak(Math.round(4*level*(RM?.25:1)),V.gust.dir)}
  if(V.gust){const u=(gt-V.gust.t0)/V.gust.d;if(u>=1)V.gust=null;else env=u<.3?u/.3:Math.pow(1-(u-.3)/.7,1.5)}}
 else{V.gust=null;V.nextGust=0}
 const target=RM?0:env*.4*level*(V.gust?V.gust.dir:1),w=6,z=.5;V.swayV+=(w*w*(target-V.sway)-2*z*w*V.swayV)*dt;V.sway+=V.swayV*dt;
 if(!level&&Math.abs(V.sway)<.001){V.sway=0;V.swayV=0}
 windStep.n=(windStep.n||0)+1;if(windStep.n%6===0)A.setWind(level,env);
 if(level>=3&&env>.5&&curFace==='happy'&&V.mode==='cling')setFace('squint');else if(env<.1&&curFace==='squint'&&V.mode==='cling')setFace('happy');
 return{env,level}}
// ================= frame loop =================
function frame(t){const rdt=Math.min(.05,(t-lastT)/1000);lastT=t;const frozen=t<holdUntil,dt=frozen?0:rdt;gt+=dt;const BP=Lay.BP;let pipY,pipX=0,rot=0;
 if(V.mode==='climb'){const p=(gt-V.t0)/V.dur,y0=B.Y(V.fromAlt,BP),y1=B.Y(V.toAlt,BP),prevY=V.Y;V.Y=RM?(p<.5?y0:y1):lerp(y0,y1,ease(p));V.alt=B.H(V.Y,BP);
  const spd=dt?Math.abs(V.Y-prevY)/dt:0;V.amp=lerp(V.amp,clamp(spd/120,0,1),Math.min(1,dt*10));V.ph+=Math.min(spd/Lay.rung,3.2)*Math.PI*2*dt;
  if(!RM&&spd>1.5*Lay.vh&&Math.random()<.5)FX.speed(1);
  const bi=B.bandOf(V.alt);if(bi>V.band)onBand(bi);else if(bi<V.band)onBand(bi,true);
  E.hm.textContent=fmtAlt(V.alt);if(V.alt>V.lmTop){const cr=lmBetween(V.lmTop,V.alt);V.lmTop=V.alt;if(cr.length)lmShow(cr[cr.length-1])}
  if(p>=1){V.Y=y1;V.alt=V.toAlt;V.mode='cling';E.hm.textContent=fmtAlt(V.alt);if(!RM)E.pipSq.animate([{transform:'scale(1.1,.9)'},{transform:'scale(.96,1.04)'},{transform:'none'}],{duration:260,easing:'ease-out'});E.height.classList.remove('pop');void E.height.offsetWidth;E.height.classList.add('pop');V.onDone&&V.onDone()}}
 else if(V.mode==='cling'){V.amp=lerp(V.amp,0,Math.min(1,dt*10));V.Y=B.Y(V.alt,BP)}
 if(V.mode==='climb'||V.mode==='cling'){pipY=V.Y;ladderLimbs()}else{diveStep(t,dt);const D=V.dv;pipY=D.y;pipX=D.x;rot=D.rot}
 const W=windStep(t,dt);
 if(V.board){const b=V.board,L=Lay.boardL*b.ext,f=b.flex;E.board.style.bottom=(Lay.base+b.y-30)+'px';const d=`M4 30 Q ${4+L*.55} ${30+f*.35} ${4+L} ${30+f}`;E.boardPath.setAttribute('d',d);E.boardFill.setAttribute('d',d)}
 E.pipWrap.style.transform=`translate(${Lay.ladCX-Lay.pipW/2+pipX}px,${-(Lay.base+pipY-Lay.feet)}px) rotate(${rot}deg)`;
 // camera: deadzone + critically damped spring
 if(V.mode!=='dive'||!V.dv.camLock){const s=Lay.base+pipY-V.cam,lo=Lay.base+Lay.lo,hi=Lay.base+Lay.hi;
  if(t>V.camHold){if(s>hi)V.camT=V.cam+(s-hi);else if(s<lo)V.camT=Math.max(0,V.cam-(lo-s))}
  const w=RM?40:(V.mode==='climb'?7:V.mode==='dive'?6:4.2),a=w*w*(V.camT-V.cam)-2*w*V.camV;V.camV+=a*dt;let nc=V.cam+V.camV*dt;
  if((V.camT-V.cam)*(V.camT-nc)<0){nc=V.camT;V.camV=0}V.cam=nc;
  const top=Lay.base+Lay.avail+Lay.pipW*.3;if(Lay.base+pipY-V.cam>top+40){V.cam=Lay.base+pipY-top-40}}
 for(const[l,f]of E.layers)l.style.transform=`translateY(${(V.cam*(RM&&f<1?1:f)).toFixed(2)}px)`;
 // wind sway: rotate the ladder rig about a pivot just below the screen
 if(V.sway||E.rig.style.transform){E.rig.style.transformOrigin=`${Lay.ladCX}px ${Lay.vh-V.cam+120}px`;E.rig.style.transform=V.sway?`rotate(${V.sway.toFixed(3)}deg)`:''}
 // sky by camera position
 const pos=(V.cam+Lay.stage*.45)/BP;if(Math.abs(pos-lastSky)>.002){lastSky=pos;const sc=B.skyAt(pos);E.sky.style.background=`linear-gradient(${sc[0]},${sc[1]})`;
  E.starWrap.style.opacity=clamp((pos-4.4)/1.2,0,1);E.starWrap2.style.opacity=clamp((pos-5.3)/1,0,1);E.sun.style.opacity=clamp(1-pos/1.6,0,1);E.sun.style.transform=`translateY(${V.cam*.2}px)`;
  const lo=clamp(1-(pos-1.3)/.8,0,1);E.lot.style.opacity=lo;E.farHills.style.opacity=lo;
  E.far.style.opacity=RM?0:1;for(const[el,b]of E.farProps){const on=pos>b-.12&&pos<b+1.3;if(el._on!==on){el._on=on;el.style.opacity=on?1:0}}}
 // ambient particles by band
 if(!RM&&!frozen){const cb=Math.floor(pos);if(cb===3&&Math.random()<rdt*3)FX.snow(1);if(cb===6&&Math.random()<rdt*.9)FX.meteor();if(cb===4&&Math.random()<rdt*1.2)FX.snow(1)}
 // music layer follows the band Pip has reached
 const mb=V.mode==='climb'||V.mode==='cling'?B.bandOf(V.alt):musicBand;if(mb!==musicBand){musicBand=mb}A.setLevel(MUSIC[musicBand]);
 // trauma shake (scene layer only)
 trauma=Math.max(0,trauma-1.4*rdt);let sx=0,sy=0,sr=0;
 if(!RM&&(trauma>0||W.env>0)){const tr2=trauma*trauma,MX=Lay.mob?10:16,ts=t/1000;sx=MX*tr2*FX.noise(ts*18+11)+W.env*W.level*.8;sy=MX*tr2*FX.noise(ts*18+71);sr=1.5*tr2*FX.noise(ts*14+131);E.shake.style.transform=`translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px) rotate(${sr.toFixed(3)}deg)`;E.shake.dataset.on=1}
 else if(E.shake.dataset.on){E.shake.style.transform='';delete E.shake.dataset.on}
 FX.step(dt);followPops();
 if(window.__traceOn)__trace.push([Math.round(t),+pipY.toFixed(2),+V.cam.toFixed(2),+(Lay.base+pipY-V.cam).toFixed(2),V.mode==='dive'?V.dv.phase:V.mode,+rot.toFixed(1),+sx.toFixed(2),+sy.toFixed(2),+trauma.toFixed(3),+V.sway.toFixed(3),frozen?1:0]);
 requestAnimationFrame(frame)}
// ================= dive finale (v3: dive chosen by altitude, 6 tiers) =================
const dpose=(D,p,face)=>{if(D.pose!==p){D.pose=p;setPose(p,face)}};
function dive(force){if(V.mode!=='cling')return;E.pipSq.style.transform='';const alt=force||V.alt,di=diveIdx(alt),d=DIVES[di],y=V.Y;busy=true;document.body.classList.add('diving');document.body.classList.remove('climbing');
 V.board={y,ext:0,flex:0};E.board.classList.add('on');E.lmPop.classList.remove('show','stay');
 V.dv={phase:'extend',t0:gt,x:0,y,rot:0,kind:d[1],di,d,alt,surf:y+8,bounces:RM?0:(di===0?1:di>=3?3:2),bi:0,pose:'',force:!!force};V.mode='dive';setPose('idle',di===0?'worried':'happy');A.sfx.click();
 const c=E.bandCard;c.querySelector('small').textContent='The dive · from '+fmtAlt(alt);c.querySelector('b').textContent=d[3]+' '+d[2];c.querySelector('em').textContent=di===DIVES.length-1?'Legendary!':'';c.classList.remove('show','mini');void c.offsetWidth;c.classList.add('show');clearTimeout(onBand.t);onBand.t=setTimeout(()=>c.classList.remove('show'),1600)}
function skipMontage(){const D=V.dv;if(V.mode==='dive'&&D&&D.phase==='fall'&&!D.skipped){D.skipped=1;holdUntil=0;D.T=Math.min(D.T,(gt-D.t0)*1000+1);E.diveName.classList.remove('show');document.body.classList.remove('freeze')}}
// body shape + rotation for each dive along the fall (p 0..1). Entries end at 180° mod 360 (head first) except belly (flat) and cannonball (feet first).
function diveShape(D,p){const K=D.kind;let r=0,tw=1;
 if(K==='belly'){r=lerp(0,90,ease(p*1.8))+Math.sin(gt*18)*6*(1-p);dpose(D,'belly','wow')}
 else if(K==='cannon'){r=720*ease(p);dpose(D,'cannon','wow')}
 else if(K==='flip'){if(p<.12)dpose(D,'cheer','joy');else if(p<.8){r=540*ease((p-.12)/.68);dpose(D,'cannon','wow')}else{r=540;dpose(D,'pike','focus')}}
 else if(K==='hero'){if(p<.1){r=-15*p/.1;dpose(D,'cheer','joy')}else if(p<.55){r=lerp(-15,-60,ease((p-.1)/.22));dpose(D,'hero','joy')}else{const u=ease((p-.55)/.35);r=lerp(-60,180,u);tw=Math.cos(u*Math.PI*4);dpose(D,'pike','focus')}}
 else if(K==='star'){if(p<.6){r=360*ease(p/.6);dpose(D,'star','wow')}else{const u=ease((p-.6)/.3);r=lerp(360,540,u);tw=Math.cos(u*Math.PI*6);dpose(D,'pike','focus')}}
 else if(K==='reentry'){if(p<.27){r=1080*ease(p/.27);dpose(D,'cannon','wow')}else if(p<.46){r=lerp(1080,1020,ease((p-.27)/.08));dpose(D,'hero','joy')}else{const u=ease((p-.46)/.38);r=lerp(1020,1260,u);tw=Math.cos(u*Math.PI*4);dpose(D,'pike','focus')}}
 E.pipWrap.classList.toggle('glow',K==='reentry'&&p>.04&&p<.6);
 D.rot=r;D.tw=tw;E.pipSq.style.transform=tw===1?'':`scaleX(${Math.max(.14,Math.abs(tw)).toFixed(3)})`}
// mid-air freeze-frame: the whole game holds (hit-stop) while the dive name stamps in
function freezePose(D){const ms=RM?0:760;hitStop(ms);window.__freeze={kind:D.kind,ms,alt:Math.round(B.H(Math.max(0,D.y),Lay.BP))};
 const n=E.diveName;n.innerHTML=`<small>Freeze-frame!</small>${D.d[2]}`;n.classList.remove('show');void n.offsetWidth;n.classList.add('show');clearTimeout(freezePose.t);freezePose.t=setTimeout(()=>n.classList.remove('show'),ms+500);
 if(!RM){document.body.classList.add('freeze');setTimeout(()=>document.body.classList.remove('freeze'),ms)}
 addTrauma(.12);A.sfx.sparkle();const s=pipScreen();FX.sparkle(s.x,s.y,10)}
function diveStep(t,dt){const D=V.dv,b=V.board,el=(gt-D.t0)*1000,tipX=Lay.boardL*.86;const go=ph=>{D.phase=ph;D.t0=gt};
 switch(D.phase){
 case'extend':{const p=RM?1:el/380;b.ext=eOut(p);D.y=lerp(b.y,D.surf,eOut(p));if(p>=1)go('walk');break}
 case'walk':{const p=RM?1:el/650;D.x=lerp(0,tipX,ease(p));b.flex=6*ease(p);D.y=D.surf-b.flex*(D.x/tipX)+Math.abs(Math.sin(p*Math.PI*3))*4;if(p>=1){setPose(D.di===0?'idle':'cheer',D.di===0?'worried':'joy');go(D.bounces?'bounce':'launch')}break}
 case'bounce':case'launch':{const C=RM?1:170,AIR=360,J=D.phase==='launch'?0:[22,36,48][D.bi]||36;
  if(el<C){const u=el/C,f=6+(D.phase==='launch'?26:16)*Math.sin(Math.PI*u*(D.phase==='launch'?.5:1));b.flex=f;D.y=D.surf-f;E.pipSq.style.transform=`scale(${1+.12*Math.sin(Math.PI*u)},${1-.12*Math.sin(Math.PI*u)})`}
  else if(D.phase==='launch'){E.pipSq.style.transform='';A.sfx.whoosh(1.2);D.fx0=D.x;D.fy0=D.y;const nb=B.bandOf(D.alt)+1;D.T=RM?0:Math.min(4200,520*nb);D.camLock=true;D.lastB=nb-1;b.t0=gt;
   D.freezeAt={hero:.32,star:.3,reentry:.31}[D.kind]||0;go('fall');document.body.classList.add('montage');window.__montage={bands:nb,T:D.T,t0:performance.now(),kind:D.kind}}
  else{const u=(el-C)/AIR;E.pipSq.style.transform=u<.2?`scale(.94,1.08)`:'';b.flex=6-10*Math.sin(Math.PI*Math.min(1,u*2))*Math.exp(-u*2);D.y=D.surf-6+J*Math.sin(Math.PI*clamp(u,0,1));if(u>0&&!D.sq){D.sq=1;A.sfx.step(60)}if(u>=1){D.bi++;D.sq=0;go(D.bi>=D.bounces?'launch':'bounce')}}
  break}
 case'fall':{const p=D.T?clamp(el/D.T,0,1):1,endX=Lay.poolCX-Lay.ladCX,endY=-Lay.pipW*.15,e=p<.06?0:ease((p-.06)/.94);
  D.y=lerp(D.fy0,endY,e)+40*Math.sin(Math.PI*Math.min(1,p*8))*(1-p);D.x=lerp(D.fx0,endX,eOut(p*1.2));
  diveShape(D,p);
  if(D.freezeAt&&!D.froze&&!D.skipped&&p>=D.freezeAt){D.froze=1;freezePose(D)}
  if(D.kind==='reentry'&&!RM&&p>.04&&p<.6&&dt){const r=E.pipWrap.getBoundingClientRect();FX.ember(r.left+r.width/2,r.top-6,2)}
  V.cam=Math.max(0,D.y-Lay.avail*.42);V.camT=V.cam;V.camV=0;const a=B.H(Math.max(0,D.y),Lay.BP),bi=B.bandOf(a);E.hm.textContent=fmtAlt(a);
  if(bi<D.lastB){D.lastB=bi;E.hband.textContent=BANDS[bi].n;const c=E.bandCard;c.querySelector('small').textContent='';c.querySelector('b').textContent=BANDS[bi].e+' '+BANDS[bi].n;c.querySelector('em').textContent='';c.classList.remove('show');c.classList.add('mini');void c.offsetWidth;c.classList.add('show');clearTimeout(onBand.t);onBand.t=setTimeout(()=>c.classList.remove('show','mini'),420);if(!RM&&bi>=2)FX.streak(3,-1)}
  if(!RM)A.setWind(clamp(B.bandOf(a),1,4),.6);
  if(p>=1){E.hm.textContent='0 m';E.hband.textContent=BANDS[0].n;A.setWind(0,0);document.body.classList.remove('montage','freeze');E.diveName.classList.remove('show');window.__montage.real=performance.now()-window.__montage.t0;
   const km=D.alt/1000,belly=D.kind==='belly';D.tr=Math.min(.9,.35+.12*Math.log10(km+1)+.03*D.di)+(belly?.1:0);const hs=Math.round(80+14*D.di+40*clamp(Math.log10(km+1)/2,0,1)+(belly?20:0));D.hsEnd=performance.now()+hs;hitStop(hs);window.__splash={km,trauma:D.tr,hs};go('hitstop')}break}
 case'hitstop':{if(performance.now()>=D.hsEnd){D.camLock=false;splash(D);D.r0=D.rot;D.r1=D.kind==='belly'?0:Math.ceil((D.r0-1)/360)*360;D.y0=D.y;go('settle');E.pipSq.style.transform='';E.pipWrap.classList.remove('glow');setPose(D.kind==='belly'?'float':'proud');setTimeout(()=>showJudges(D),RM?0:380)}break}
 case'settle':{const p=RM?1:el/520;D.rot=lerp(D.r0,D.r1,eOut(p));D.y=lerp(D.y0,-Lay.pipW*.32,eOut(p));const bt=gt-b.t0;b.flex=6+20*Math.exp(-4*bt)*Math.cos(18*bt);
  if(p>=1){D.rot=0;go('landed');if(D.force)return;E.hm.textContent=fmtAlt(D.alt);setTimeout(()=>{if(D.kind!=='belly'){const s=pipScreen();FX.confetti(s.x,s.y,RM?0:60)}},300);setTimeout(()=>{E.fade.classList.remove('go');void E.fade.offsetWidth;E.fade.classList.add('go');A.sfx.click();setTimeout(()=>showEnd(true),RM?0:140)},RM?200:2100)}break}
 case'landed':break}}
function splash(D){const km=D.alt/1000,ti=D.di,belly=D.kind==='belly';addTrauma(D.tr);setTimeout(()=>addTrauma(.1),260);setTimeout(()=>addTrauma(.1),520);
 const pr=E.pool.getBoundingClientRect(),cx=Lay.ladCX+D.x,cy=pr.top+2;const n=RM?0:16+10*ti;Object.assign(window.__splash,{drops:n,ring:110+45*ti,tier:ti,kind:D.kind});
 FX.drops(cx,cy,n,(belly?1.15:.8)+ti*.14);if(!RM){for(let k=0;k<2+Math.ceil(ti/2);k++)FX.ring(cx,cy,110+45*ti+k*60,k*.15);if(ti>=4)setTimeout(()=>FX.drops(cx,cy,12+4*ti,.7),180)}
 if(belly){A.sfx.smack();A.sfx.splash(1)}else{A.sfx.splash(.6+.25*ti);if(ti>=2){A.sfx.sparkle();A.sfx.cheer();setTimeout(()=>{const s=pipScreen();FX.sparkle(s.x,s.y,6+2*ti)},150)}}
 navigator.vibrate&&navigator.vibrate(belly?[60,40,60]:[40+10*ti,30,80+15*ti])}
// judges' score cards on splashdown
function showJudges(D){const S=D.force?null:scoreDay(itemsOf(st.r)),j=S?judgesFor(S,dayNo*131+S.total):[0,1,2].map(()=>clamp(DIVES[D.di][4]+.5,0,10));window.__judges=j;
 const J=E.judges;J.innerHTML=`<small>The judges</small><b>${D.d[3]} ${D.d[2]}</b><div>${j.map((v,i)=>`<span style="animation-delay:${(i*.16).toFixed(2)}s">${v.toFixed(1)}</span>`).join('')}</div>`;
 J.classList.remove('show');void J.offsetWidth;J.classList.add('show');A.sfx.stamp(0);clearTimeout(showJudges.t);showJudges.t=setTimeout(()=>J.classList.remove('show'),RM?2600:2000)}
// end-of-day "photo op": Pip back on the board at today's peak, in that zone's scenery
function photoOp(S){const y=B.Y(S.total,Lay.BP),tipX=Lay.boardL*.86;V.board={y,ext:1,flex:6,t0:gt-5};E.board.classList.add('on');
 V.dv={phase:'landed',x:tipX,y:y+2,rot:0,kind:diveOf(S)[1],di:diveIdx(S.total),d:diveOf(S),alt:S.total};V.mode='dive';const mid=(Lay.lo+Lay.hi)/2;V.cam=V.camT=Math.max(0,V.dv.y-mid);V.camV=0;
 document.body.classList.add('photo');E.pipSq.style.transform='';E.pipWrap.classList.remove('glow');setPose('proud','joy');lastSky=-1;E.hm.textContent=fmtAlt(S.total);onBand(B.bandOf(S.total),true);peakPop(S)}
// ================= flow =================
let films,st,busy=false,cur={};
const REH=F.find(f=>f.title==='Jaws')||F[0];
const total=()=>scoreDay(itemsOf(st.r)).total;
function begin(fs,m){films=fs;mode=m;st=(m==='daily'||m==='archive')&&LS.days[dayNo]||{r:[]};document.body.classList.remove('diving','montage','climbing','freeze','photo');E.board.classList.remove('on');V.board=null;V.dv=null;
 $('#kicker').textContent=m==='practice'?'Practice climb':m==='rehearsal'?'Rehearsal · not scored':m==='archive'?`Floppr #${dayNo} · archive`:`Floppr #${dayNo}`;
 $('#coach').hidden=m!=='rehearsal';E.bandCard.classList.remove('show','mini');E.lmPop.classList.remove('show','stay');E.judges.classList.remove('show');E.gainPop.classList.remove('show');E.pipWrap.classList.remove('glow');E.pipSq.style.transform='';
 const S=scoreDay(itemsOf(st.r));V.mode='cling';V.alt=S.total;V.lmTop=V.alt;V.Y=B.Y(V.alt,Lay.BP);V.amp=0;onBand(B.bandOf(V.alt),true);E.hm.textContent=fmtAlt(V.alt);setUpdraft(S.level,0);setPose('ladder');
 if(st.r.length>=N)showEnd(false);else showFilm()}
function setMore(open,which){E.panel.classList.toggle('expanded',!!open);const rb=$('#moreBtn'),eb=$('#endMore');$('#rMore').hidden=!(open&&which==='reveal');$('#eMoreBox').hidden=!(open&&which==='end');
 rb.setAttribute('aria-expanded',!!(open&&which==='reveal'));eb.setAttribute('aria-expanded',!!(open&&which==='end'));eb.textContent=open&&which==='end'?'Less ▾':'More ▴';if(!open)E.panel.scrollTop=0}
function show(id){['play','reveal','end'].forEach(s=>$('#'+s).hidden=s!==id);setMore(false);const el=$('#'+id);el.classList.remove('sec');void el.offsetWidth;el.classList.add('sec');E.panel.scrollTop=0;E.panel.dataset.view=id}
function dots(){$('#dots').innerHTML=Array.from({length:films.length},(_,i)=>`<i class="${i<st.r.length?'done':i===st.r.length?'cur':''}${i===6?' star':''}"></i>`).join('')}
function setUpdraft(L,dir){const u=E.updraft;u.textContent='⚡×'+MULT[L];u.dataset.l=L;u.classList.remove('up','down');void u.offsetWidth;if(dir)u.classList.add(dir>0?'up':'down')}
const prodUsed=()=>st.r.some(x=>x.prod);
function hint(h,cls){E.hint.innerHTML=h;E.hint.className=cls||''}
function showFilm(){const f=films[st.r.length];busy=false;cur={shelf:null,v:null,prod:false};dots();show('play');
 $('#title').textContent=f.title;$('#meta').textContent=`${films.length>1?`Film ${st.r.length+1}/${films.length}${st.r.length===6?' ★ Headliner ×2':''} · `:''}${f.year} · ${f.genre}`;
 E.amt.value='';E.amt.classList.remove('bad');E.slider.disabled=true;E.slider.value=500;E.gval.textContent='–';hint('① Pick a budget shelf','go');
 $$('.sh').forEach(b=>{b.classList.remove('on');b.setAttribute('aria-checked','false')});$$('.v').forEach(b=>b.disabled=true);$('#calls').classList.remove('ready');
 const pl=prodUsed()?0:1;E.prodLeft.textContent=pl;E.prod.disabled=true;E.prod.dataset.left=pl;
 if(mode==='rehearsal')coach(`<b>Rehearsal</b> (not scored): tap the shelf you think <b>${f.title}</b>'s budget sits on.`)}
function coach(html){$('#coachTxt').innerHTML=html}
function pickShelf(k,keep){if(busy||$('#play').hidden)return;const first=cur.shelf==null;cur.shelf=k;$$('.sh').forEach((b,i)=>{b.classList.toggle('on',i===k);b.setAttribute('aria-checked',i===k)});E.slider.disabled=false;
 if(!keep){const S=SHELVES[k];cur.v=nice(Math.sqrt(S[1]*S[2]));E.slider.value=500;E.amt.value=''}
 E.gval.textContent=fmt(cur.v);$$('.v').forEach(b=>b.disabled=false);if(first){const c=$('#calls');c.classList.remove('ready');void c.offsetWidth;c.classList.add('ready')}
 E.prod.disabled=!(+E.prod.dataset.left)||cur.prod;if(!cur.prod)hint(`${SHELVES[k][0]} · ② slide · ③ call it`);A.sfx.click();
 if(mode==='rehearsal'&&!keep)coach('Nice. Slide to <b>fine-tune</b> (or type it), then <b>call it</b>: did it Flop, break Even, Hit or Smash?')}
function onSlide(){if(cur.shelf==null)return;cur.v=nice(s2v(+E.slider.value,cur.shelf));E.amt.value='';E.amt.classList.remove('bad');E.gval.textContent=fmt(cur.v)}
function onType(){const v=parse(E.amt.value);E.amt.classList.toggle('bad',!!E.amt.value.trim()&&!v);if(!v)return;const S0=cur.shelf!=null&&SHELVES[cur.shelf],k=S0&&v>=S0[1]&&v<=S0[2]?cur.shelf:shelfOf(v);cur.v=v;if(k!==cur.shelf)pickShelf(k,true);E.slider.value=v2s(v,k);E.gval.textContent=fmt(v)}
function askProducer(){if(busy||cur.shelf==null||cur.prod||!(+E.prod.dataset.left))return;const f=films[st.r.length],h=prodHint(cur.v,f);cur.prod=true;E.prod.disabled=true;E.prodLeft.textContent=0;E.prod.dataset.left=0;
 hint('🎬 '+{'↑':'<b>↑ Higher</b> than '+fmt(cur.v),'↓':'<b>↓ Lower</b> than '+fmt(cur.v),'✓':'<b>✓ About right</b> at '+fmt(cur.v)}[h]+' <small>(caps at 2 km)</small>','prod');A.sfx.good()}
function call(v){if(busy||$('#play').hidden||V.mode!=='cling'||cur.shelf==null||!cur.v)return;busy=true;const f=films[st.r.length];
 const rec={i:F.indexOf(f),g:cur.v,call:v,shelf:cur.shelf};if(cur.prod)rec.prod=1;const before=scoreDay(itemsOf(st.r));st.r.push(rec);const S=scoreDay(itemsOf(st.r));persist(before,S);reveal(f,rec,S,before)}
// ---- reveal + cascade (compact: one facts row with the climb in the 4th cell) ----
let CAS=null;
function reveal(f,rec,S,before){const fr=S.films[S.films.length-1],T=CLIMB[fr.ti],[lo,hi]=lohi(f),m=f.gross/f.budget,t=tier(m),g=rec.g,right=rec.call===t,head=fr.head>1,isHead=st.r.length===7;
 show('reveal');dots();const rh=$('#rHead');const inR=g>=lo&&g<=hi,pct=Math.round(Math.abs(g<lo?1-g/lo:g/hi-1)*100);
 rh.innerHTML=`${T[2]} <b>${T[3].toUpperCase()}</b> <span>${inR?(f.budgetRange?'inside the range':'spot on'):fr.ti===0?'within 10%':pct+'% '+(g<lo?'under':'over')}</span>`;rh.className='rhead t'+fr.ti;rh.style.visibility='hidden';
 $('#rGuess').textContent=fmt(g);$('#rOff').textContent=inR?'✓':`${g<lo?'⬇':'⬆'}${pct}%`;
 $('#rBudget').textContent=f.budgetRange?fmtR(lo,hi):fmt(f.budget);$('#rRange').textContent=f.budgetRange?'range':'';
 $('#rGross').textContent=fmt(f.gross);$('#rMult').textContent=`${xf(m)}× back`;
 $('#cGain').textContent='+0 m';$('#cMath').textContent=fr.note||T[3];
 const rc=$('#rCall');rc.className='rcall'+(right?'':' bad');const upd=`⚡×${MULT[fr.L0]}${fr.L!==fr.L0?'→×'+fr.mult:''}`;
 rc.innerHTML=(right?`📣 <b>${TN[rec.call]}</b> ✅ <span>${xf(m)}× back</span>`:`📣 <b>${TN[rec.call]}</b> ❌ <span>it was ${TN[t]} ${TE[t]}</span>`)+` <span class="upd">${upd}</span>${isHead?(head?' <span class="hd">★×2</span>':' <span class="hd off">★ no ×2</span>'):''}`;rc.style.visibility='hidden';
 const after=S.total,nb=B.bandOf(after);$('#nbFill').style.width=(nb===7?100:clamp((B.Y(after,Lay.BP)/Lay.BP-nb)*100,2,100))+'%';$('#nbTxt').textContent=nb<7?`${fmtAlt(after)} → next zone: ${BANDS[nb+1].n} at ${fmtAlt(BANDS[nb+1].lo)}`:`${fmtAlt(after)} · you're in Space!`;
 const passed=lmBetween(before.total,after);$('#rPassed').innerHTML=passed.length?'Passed: '+passed.map(l=>`${l.e} <a href="${l.s}" target="_blank" rel="noopener">${l.n}</a>`).join(' · '):'';
 $('#rSrc').innerHTML=`Budget source: <a href="${f.source}" target="_blank" rel="noopener">Wikipedia</a>${f.budgetNote?' · '+f.budgetNote:''}${f.grossNote?' · gross '+f.grossNote:''}. Not inflation-adjusted.${fr.note?' · '+fr.note:''}${isHead&&!head?' · ★ Headliner ×2 needs a right call':''}`;
 $('#next').textContent=mode==='rehearsal'?"Start today's films →":st.r.length>=films.length?'🏊 Time to dive!':'Next film →';
 const now=performance.now(),T0=now+(isHead?500:200);if(isHead)A.sfx.drum(600);
 CAS={t0:T0,fr,S,before,f,rec,right,isHead,done:false,stamped:false,upd:false,T};casStep()}
function casStep(){const c=CAS;if(!c||c.done)return;const el=performance.now()-c.t0,fr=c.fr;
 if(el>=0&&!c.stamped){c.stamped=true;const rh=$('#rHead');rh.style.visibility='';rh.classList.remove('big');void rh.offsetWidth;rh.classList.add('big');A.sfx.stamp(fr.ti);
  const s=pipScreen();if(fr.ti===0){addTrauma(.22);hitStop(60);A.sfx.bullseye();FX.confetti(s.x,s.y,RM?0:40);FX.sparkle(s.x,s.y,8);navigator.vibrate&&navigator.vibrate(25);react('cheer','joy')}
  else if(fr.ti===1){addTrauma(.12);A.sfx.good();FX.sparkle(s.x,s.y,4)}
  if(c.isHead){addTrauma(.25);hitStop(80)}}
 if(el>=0&&el<420)$('#cGain').textContent='+'+fmtM(fr.base*eOut(el/350));
 if(el>=420&&!c.upd){c.upd=true;$('#cMath').textContent=`${fmtM(fr.base)} × ⚡${fr.mult}${fr.head>1?' × ★2':''}`;$('#cMath').classList.remove('pop');void $('#cMath').offsetWidth;$('#cMath').classList.add('pop');setUpdraft(fr.L,fr.L>fr.L0?1:fr.L<fr.L0?-1:0);const rc=$('#rCall');rc.style.visibility='';
  if(fr.L>fr.L0){addTrauma(.08);A.sfx.up();navigator.vibrate&&navigator.vibrate(12)}else if(fr.L<fr.L0)A.sfx.down()}
 if(el>=560){const p=clamp((el-560)/520,0,1);$('#cGain').textContent='+'+fmtAlt(fr.base+(fr.gain-fr.base)*eOut(p));const tk=Math.floor(p*8);if(tk!==c.tk){c.tk=tk;A.sfx.tick(tk)}}
 if(el>=1100)return casFinish();requestAnimationFrame(casStep)}
function casFinish(){const c=CAS;if(!c||c.done)return;c.done=true;window.__lastCascade={ms:Math.round(performance.now()-c.t0),gain:c.fr.gain,base:c.fr.base,mult:c.fr.mult,head:c.fr.head,total:c.S.total,shown:null};
 if(!c.stamped){c.stamped=true;if(c.fr.ti===0){addTrauma(.22);hitStop(60);A.sfx.bullseye()}}
 if(!c.upd){c.upd=true;setUpdraft(c.fr.L,c.fr.L>c.fr.L0?1:c.fr.L<c.fr.L0?-1:0)}
 $('#rHead').style.visibility='';$('#rCall').style.visibility='';$('#cMath').textContent=`${fmtM(c.fr.base)} × ⚡${c.fr.mult}${c.fr.head>1?' × ★2':''}`;$('#cGain').textContent='+'+fmtAlt(c.fr.gain);window.__lastCascade.shown=$('#cGain').textContent;
 // hide the card while Pip climbs so the sky + landmarks are visible; it slides back when he arrives
 document.body.classList.add('climbing');gainShow(`${c.T[2]} <b>+${fmtAlt(c.fr.gain)}</b>${c.fr.mult>1?` <small>⚡×${c.fr.mult}${c.fr.head>1?' ★×2':''}</small>`:''}`,c.fr.ti);
 const done=()=>{document.body.classList.remove('climbing');if(!c.right){A.sfx.wobble();react('nervous','worried',1400)}else if(c.fr.ti<=1)react('cheer','joy');else setFace('happy');
  setTimeout(()=>{if(!$('#reveal').hidden)$('#next').focus({preventScroll:true})},60);if(V.queueNext){V.queueNext=false;next()}};
 setTimeout(()=>climbTo(c.S.total,done),RM?0:260)}
function next(){if(CAS&&!CAS.done){casFinish();V.queueNext=true;return}if(V.mode==='climb'||document.body.classList.contains('climbing')){V.queueNext=true;$('#next').textContent='…';return}
 if(mode==='rehearsal'){LS.rehearsed=1;save();$('#coach').hidden=true;begin(setFor(dayNo),'daily');toast('🎬 Rehearsal done. Today\'s 7 films, for real!');return}
 if(st.r.length>=films.length)dive();else{setFace('happy');showFilm()}}
function countdown(){const p=sydParts(),mins=24*60-(p.hour*60+p.minute);return`${Math.floor(mins/60)}h ${mins%60}m`}
function persist(before,S){if(mode==='practice'||mode==='rehearsal')return;LS.days[dayNo]=st;
 // album: first time in each band crossed by this climb
 const b0=B.bandOf(before.total),b1=B.bandOf(S.total),f=F[st.r[st.r.length-1].i];
 for(let b=b0+1;b<=b1;b++)if(!LS.album[b]){LS.album[b]={day:dayNo,date:todayISO,film:f.title,best:0}}
 if(st.r.length===N){const fb=b1;if(!LS.album[0])LS.album[0]={day:dayNo,date:todayISO,film:F[st.r[0].i].title,best:0};LS.album[fb].best=Math.max(LS.album[fb].best||0,S.total);
  LS.prevBestBand=LS.bestBand==null?-1:LS.bestBand;LS.bestBand=Math.max(LS.bestBand==null?-1:LS.bestBand,fb);LS.prevBest=LS.best;LS.best=Math.max(LS.best,S.total);
  const moon=S.films.every(x=>x.ti===0)&&S.rights===7;if(moon&&!LS.album[8])LS.album[8]={day:dayNo,date:todayISO,film:'Moonshot!',best:S.total};
  if(mode==='daily')streakOnComplete(LS,dayNo)}
 save();$('#streak').textContent=streakShown()?'🔥'+streakShown():''}
// ================= end card, postcard, share =================
const TCOL=['#ff9ec0','#5fc77a','#ffe066','#ffa94d','#f1f1f1','#c9cfe0'];
function shareText(S){const fb=B.bandOf(S.total),d=diveOf(S),rows=S.films.map(x=>CLIMB[x.ti][2]).join(''),calls=itemsOf(st.r).map(x=>x.right?'✅':'❌').join('');
 const label=mode==='practice'?'practice':'#'+dayNo,link=mode==='practice'?URL_LIVE.replace('https://',''):`${URL_LIVE.replace('https://','')}?vs=${dayNo}.${S.total}`;
 return`🦛 Floppr ${label} · ${fmtAlt(S.total)} · ${BANDS[fb].n} ${BANDS[fb].e}\n🪜 ${rows}\n📣 ${calls}  ⚡max ×${S.maxMult}${prodUsed()?' 🎬':''}\n${landShare(S)}\n${d[3]} ${d[2]}${mode==='daily'&&streakShown()>1?' · 🔥 '+streakShown():''}\n${link}`}
const burjTxt=m=>{const b=burjs(m),n=Math.floor(b);return b>=1?`${n.toLocaleString('en-US')} Burj Khalifa${n===1?'':'s'}`:`${Math.round(b*100)}% of a Burj Khalifa`};
function landShare(S){const top=lmBelow(S.total).pop();return`🏙️ ${burjs(S.total)>=1?'Taller than '+burjTxt(S.total):burjTxt(S.total)}${top?` · passed ${top.n}`:''}`}
function landLine(S){const below=lmBelow(S.total),top=below[below.length-1],nx=LM.find(l=>l.h>S.total),di=diveIdx(S.total);
 return`<div>🏙️ Taller than <b>${burjTxt(S.total)}</b>${top?` · passed <b>${below.length}</b> landmarks, up to ${top.e} <b>${top.n}</b>`:''}</div>`+
  `<small>${nx?`Next: ${nx.e} ${nx.n} in ${fmtAlt(nx.h-S.total)}`:''}${di<DIVES.length-1?`${nx?' · ':''}${DIVES[di+1][3]} ${DIVES[di+1][2]} unlocks at ${fmtAlt(DIVES[di+1][0])}`:''}</small>`}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
async function renderPostcard(S){const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),fb=B.bandOf(S.total),bd=BANDS[fb],K='#2d2350';
 const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,bd.sky[0]);g.addColorStop(1,bd.sky[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
 const rnd=seeded(dayNo*97+S.total);if(fb>=4){c.fillStyle='#fff';for(let i=0;i<140;i++){c.globalAlpha=.4+rnd()*.6;c.beginPath();c.arc(rnd()*W,rnd()*H*.75,1+rnd()*2.5,0,6.283);c.fill()}c.globalAlpha=1}
 if(fb>=5){c.fillStyle='#2e5fb8';c.beginPath();c.ellipse(W/2,H+420,W*1.1,700,0,0,6.283);c.fill();c.strokeStyle='#8fd4ff';c.lineWidth=14;c.stroke()}
 if(fb>=1&&fb<=4){c.fillStyle='#fff';c.strokeStyle=K;c.lineWidth=6;[[160,300,1],[760,420,1.3],[420,980,1.6]].forEach(([x,y,s])=>{c.beginPath();c.ellipse(x,y,110*s,40*s,0,0,6.283);c.ellipse(x-40*s,y-30*s,50*s,40*s,0,0,6.283);c.ellipse(x+30*s,y-40*s,60*s,46*s,0,0,6.283);c.fill()})}
 if(fb===3){c.fillStyle='#6c7aa6';c.strokeStyle=K;c.lineWidth=6;c.beginPath();c.moveTo(0,1350);c.lineTo(260,860);c.lineTo(420,1060);c.lineTo(640,760);c.lineTo(1080,1350);c.closePath();c.fill();c.stroke()}
 if(fb<=1){c.fillStyle='#7a5fa8';c.beginPath();c.moveTo(0,1180);c.quadraticCurveTo(300,1000,600,1120);c.quadraticCurveTo(850,1040,1080,1100);c.lineTo(1080,1350);c.lineTo(0,1350);c.fill();c.fillStyle='#8fd0a0';c.fillRect(0,1260,W,90)}
 // card frame
 c.lineWidth=18;c.strokeStyle='#fff8ec';rr(c,24,24,W-48,H-48,40);c.stroke();
 // Pip
 try{const svg=new XMLSerializer().serializeToString(E.pip).replace('<svg','<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"');const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();c.save();c.translate(270,820);c.rotate(S.rights>=6?-.15:0);c.drawImage(img,-190,-190,380,380);c.restore()}catch(e){}
 c.textAlign='right';c.fillStyle='#fff';c.font='700 46px Fredoka, sans-serif';c.fillText(mode==='practice'?'FLOPPR PRACTICE':'FLOPPR #'+dayNo,W-80,110);
 c.font='700 190px Fredoka, sans-serif';c.lineWidth=14;c.strokeStyle=K;c.strokeText(fmtAlt(S.total),W-70,560);c.fillText(fmtAlt(S.total),W-70,560);
 c.font='700 78px Fredoka, sans-serif';c.fillStyle='#ffd36e';c.strokeText(bd.n,W-80,670);c.fillText(bd.n,W-80,670);
 const d=diveOf(S);c.font='600 46px Fredoka, sans-serif';c.fillStyle='#fff';c.lineWidth=8;const sub=`${d[2]} · ⚡ max ×${S.maxMult}`;c.strokeText(sub,W-80,745);c.fillText(sub,W-80,745);
 const top=lmBelow(S.total).pop();c.font='600 38px Nunito, sans-serif';const l2=`Taller than ${burjTxt(S.total)}`;c.strokeText(l2,W-80,812);c.fillText(l2,W-80,812);if(top){const l3=`Passed ${top.n}`;c.strokeText(l3,W-80,868);c.fillText(l3,W-80,868)}
 // rows of squares
 const items=itemsOf(st.r),sz=92,gap=18,x0=(W-(7*sz+6*gap))/2;S.films.forEach((x,k)=>{c.fillStyle=TCOL[x.ti];c.strokeStyle=K;c.lineWidth=7;rr(c,x0+k*(sz+gap),1040,sz,sz,22);c.fill();c.stroke();if(x.ti===0){c.beginPath();c.arc(x0+k*(sz+gap)+sz/2,1040+sz/2,22,0,6.283);c.lineWidth=7;c.stroke();c.beginPath();c.arc(x0+k*(sz+gap)+sz/2,1040+sz/2,7,0,6.283);c.fillStyle=K;c.fill()}
  c.fillStyle=items[k].right?'#8fe3c8':'#ff9fb5';rr(c,x0+k*(sz+gap),1150,sz,sz*.62,18);c.fill();c.stroke();c.fillStyle=K;c.font='700 44px Fredoka, sans-serif';c.textAlign='center';c.fillText(items[k].right?'✓':'✗',x0+k*(sz+gap)+sz/2,1150+sz*.47)});
 c.textAlign='center';c.fillStyle='#fff';c.font='600 40px Nunito, sans-serif';c.lineWidth=8;c.strokeStyle=K;const u=URL_LIVE.replace('https://','');c.strokeText(u,W/2,1300);c.fillText(u,W/2,1300);
 return cv}
let postCanvas=null;
async function showEnd(anim){const S=scoreDay(itemsOf(st.r)),di=diveIdx(S.total),d=DIVES[di],fb=B.bandOf(S.total),bulls=S.films.filter(x=>x.ti===0).length;busy=false;dots();document.body.classList.remove('diving','climbing','montage','freeze');show('end');
 photoOp(S);E.hband.textContent=BANDS[fb].n;
 $('#title').textContent=mode==='practice'?'Practice dive':Lay.mob?(mode==='archive'?`Floppr #${dayNo} · archive`:`Floppr #${dayNo} · today's dive`):"Today's dive";$('#eAlt').textContent=fmtAlt(S.total);$('#eBand').textContent=BANDS[fb].e+' '+BANDS[fb].n;
 const j=judgesFor(S,dayNo*131+S.total);$('#eDive').innerHTML=`<b>${d[3]} ${d[2]}</b><span class="jc" title="Judges' scores">${j.map(v=>`<i>${v.toFixed(1)}</i>`).join('')}</span>`;
 $('#eLand').innerHTML=landLine(S);
 const items=itemsOf(st.r);$('#eRows').innerHTML=`<div class="erow">${S.films.map((x,k)=>`<i class="sq t${x.ti}" title="${CLIMB[x.ti][3]} · call ${items[k].right?'right':'wrong'}"><b class="${items[k].right?'ok':'no'}">${items[k].right?'✓':'✗'}</b></i>`).join('')}</div>`;
 const lines=[`${bulls} bullseye${bulls===1?'':'s'} · ${S.rights}/7 calls · ⚡max ×${S.maxMult}`];
 if(mode==='daily'&&LS.prevBestBand!=null&&fb>LS.prevBestBand&&LS.prevBestBand>=0)lines.push(`New personal best zone: ${BANDS[fb].n}!`);
 if(VS&&VS.day===dayNo)lines.push(S.total>=VS.m?`🚩 You beat your friend by ${fmtAlt(S.total-VS.m)}!`:`🚩 Your friend is ${fmtAlt(VS.m-S.total)} higher. So close!`);
 $('#eSub').innerHTML=lines.join('<br>');
 $('#share').textContent=shareText(S);
 const sk=streakShown();$('#streakBox').innerHTML=mode==='daily'||mode==='archive'?`<b>🔥 ${sk}-day streak</b> &nbsp; ${'❄️'.repeat(LS.freezes||0)||''} ${LS.freezes||0} freeze${LS.freezes===1?'':'s'}${LS.usedFreeze?` <small>(used ${LS.usedFreeze} to save your streak)</small>`:''}<br><small>Earn a freeze every 7-day streak (hold 2). Next films in ${countdown()} (Sydney midnight).</small>`:'<small>Practice round: not saved.</small>';
 albumStrip();
 $('#recap tbody').innerHTML=st.r.map((x,k)=>{const f=F[x.i],fr=S.films[k];return`<tr><td>${f.title}</td><td>${fmt(x.g)}${x.prod?' 🎬':''}</td><td>${f.budgetRange?fmt(f.budgetRange[0])+'–'+fmt(f.budgetRange[1]):fmt(f.budget)}</td><td>${TE[x.call]}${items[k].right?'✅':'❌'}</td><td>+${fmtAlt(fr.gain)}</td></tr>`}).join('');
 const lms=lmBelow(S.total);$('#compSrc').innerHTML='Budgets: '+st.r.map(x=>`<a href="${F[x.i].source}" target="_blank" rel="noopener">${F[x.i].title}</a>`).join(' · ')+(lms.length?'<br>Landmark heights (Wikipedia): '+lms.map(l=>`<a href="${l.s}" target="_blank" rel="noopener">${l.n}</a>`).join(' · '):'');
 $('#best').textContent=`Best: ${fmtAlt(LS.best||S.total)}${LS.bestClassic?` · Classic best: ${LS.bestClassic} m`:''}`;
 postCanvas=await renderPostcard(S);$('#postImg').src=postCanvas.toDataURL('image/png');$('#postWrap').classList.remove('flip');void $('#postWrap').offsetWidth;if(anim)$('#postWrap').classList.add('flip')}
function albumHTML(big){return[...BANDS.map((b,i)=>[b,i]),[{n:'Moonshot',post:'Secret: all bullseyes + 7/7 calls',sky:['#0b0818','#3a2a6b'],icon:'🌙'},8]].map(([b,i])=>{const a=LS.album[i];
  return a?`<div class="pc" style="background:linear-gradient(${b.sky[0]},${b.sky[1]})" title="${b.n}"><span>${b.icon}</span>${big?`<b>${b.n}</b><small>“${b.post}”<br>${a.date} · ${a.film}${a.best?'<br>best '+fmtAlt(a.best):''}</small>`:''}</div>`:`<div class="pc lock" title="Locked">${big?`<span>?</span><small>${i===8?'Secret':fmtAlt(b.lo||0)+'+'}</small>`:'?'}</div>`}).join('')}
function albumStrip(){$('#album').innerHTML=albumHTML(false);const n=Object.keys(LS.album).length;$('#albumNote').textContent=`${n}/9 postcards collected`}
async function sharePostcard(){const S=scoreDay(itemsOf(st.r)),t=shareText(S),b=$('#sharePost');if(!postCanvas)postCanvas=await renderPostcard(S);
 const blob=await new Promise(r=>postCanvas.toBlob(r,'image/png')),file=new File([blob],`floppr-${dayNo}.png`,{type:'image/png'});
 if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();a.remove();
 try{await navigator.clipboard.writeText(t);b.textContent='Saved + text copied 📋'}catch(e){b.textContent='Postcard saved'}setTimeout(()=>b.textContent='Share postcard',2200)}
async function challenge(){const S=scoreDay(itemsOf(st.r)),t=`Can you beat ${fmtAlt(S.total)} on Floppr #${dayNo}? 🦛\n${URL_LIVE}?vs=${dayNo}.${S.total}`,b=$('#challenge');
 if(navigator.share&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
 try{await navigator.clipboard.writeText(t);b.textContent='Link copied!'}catch(e){b.textContent='Copy failed'}setTimeout(()=>b.textContent='Challenge',2000)}
// ================= wiring =================
const SHORT=['Shoe','Indie','Mid','Studio','Big','Mega'],NUMS=['<5','5–20','20–60','60–120','120–200','200+'];
E.shelves.innerHTML=SHELVES.map((s,k)=>`<button class="sh" data-s="${k}" role="radio" aria-checked="false" aria-label="${s[0]} ${s[3]}"><b class="long">${s[0]}</b><b class="short">${SHORT[k]}</b><small class="long">${s[3]}</small><small class="short">${NUMS[k]}</small></button>`).join('');
$$('.sh').forEach(b=>b.onclick=()=>pickShelf(+b.dataset.s));E.slider.addEventListener('input',onSlide);E.amt.addEventListener('input',onType);
E.amt.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();E.amt.blur()}});E.prod.onclick=askProducer;
$$('.v').forEach(b=>b.onclick=()=>call(+b.dataset.v));
document.addEventListener('keydown',e=>{if($('dialog[open]')||e.metaKey||e.ctrlKey||e.altKey)return;const typing=document.activeElement===E.amt;
 if(!$('#play').hidden&&!typing){if(/^[1-6]$/.test(e.key)){e.preventDefault();pickShelf(+e.key-1)}else{const q='qwer'.indexOf(e.key.toLowerCase());if(q>=0){e.preventDefault();call(q)}
  else if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&document.activeElement!==E.slider&&cur.shelf!=null){e.preventDefault();E.slider.value=clamp(+E.slider.value+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?100:25),0,1000);onSlide()}}}
 else if(!$('#reveal').hidden&&e.key==='Enter'&&document.activeElement!==$('#next')){e.preventDefault();next()}});
$('#next').onclick=next;$('#moreBtn').onclick=()=>setMore(!E.panel.classList.contains('expanded'),'reveal');$('#endMore').onclick=()=>{const o=!E.panel.classList.contains('expanded');setMore(o,'end');if(o)A.sfx.click()};$('#reveal').addEventListener('pointerdown',e=>{if(e.target.closest('#next,a'))return;if(CAS&&!CAS.done)casFinish()});
$('#scene').addEventListener('pointerdown',skipMontage);E.panel.addEventListener('pointerdown',skipMontage);document.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Escape')skipMontage()});
$('#sharePost').onclick=sharePostcard;$('#challenge').onclick=challenge;
$('#practice').onclick=()=>{const r=Math.floor(Math.random()*1e6)+5000;begin(setFor(r),'practice')};
$('#helpBtn').onclick=$('#hudHelp').onclick=()=>$('#help').showModal();$('#helpClose').onclick=()=>$('#help').close();$('#archClose').onclick=()=>$('#arch').close();
$('#albumBtn').onclick=()=>{$('#albumBig').innerHTML=albumHTML(true);$('#albumDlg').showModal()};$('#albumClose').onclick=()=>$('#albumDlg').close();
$('#coachSkip').onclick=()=>{LS.rehearsed=1;save();V.alt=0;begin(setFor(dayNo),'daily')};
$('#archBtn').onclick=()=>{$('#archList').innerHTML='';for(let n=todayNo;n>=Math.max(1,todayNo-60);n--){const b=document.createElement('button'),d=LS.days[n],c=LS.classic[n];
  b.textContent=`#${n}${n===todayNo?' (today)':''} ${d&&d.r.length>=N?'· '+fmtAlt(scoreDay(itemsOf(d.r)).total):d&&d.r.length?'· in progress':''}${c?` · classic ${c.m} m${c.done?'':' (unfinished)'}`:''}`;b.onclick=()=>location.search='?day='+n;$('#archList').appendChild(b)}$('#arch').showModal()};
$('#pip').addEventListener('click',()=>{if(V.mode==='cling'){react('cheer','joy');A.sfx.good()}});
const mbtn=$('#mute'),mi=()=>mbtn.textContent=A.muted?'🔇':'🔊';mi();mbtn.onclick=()=>{A.init();A.toggle();mi()};
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{A.init();A.resume()},{passive:true}));
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(layout,120)});
$('#streak').textContent=streakShown()?'🔥'+streakShown():'';
FX.init(E.fxc);layout();if(document.fonts)document.fonts.ready.then(layout);
window.__floppr={parse,setFor,todayNo,V,Lay,tier,F,scoreDay,itemsOf,ratio,tierIdx,shelfOk,shelfOf,prodHint,DIVES,diveIdx,diveOf,judgesFor,LM,lmBetween,lmBelow,burjs,landShare,debugDive:alt=>{busy=true;document.body.classList.add('diving');V.mode='cling';V.alt=alt;V.Y=B.Y(alt,Lay.BP);V.cam=V.camT=Math.max(0,V.Y-Lay.avail*.4);onBand(B.bandOf(alt),true);lastSky=-1;dive(alt)},migrate,streakOnComplete,LS,B,fmtAlt,climbDur,SHELVES,v2s,s2v,get trauma(){return trauma},get cur(){return cur},get st(){return st},get films(){return films},get mode(){return mode},get cas(){return CAS},renderPostcard:()=>renderPostcard(scoreDay(itemsOf(st.r))),shareText:()=>shareText(scoreDay(itemsOf(st.r))),addTrauma};
if(!LS.rehearsed&&mode==='daily'&&!(LS.days[dayNo]&&LS.days[dayNo].r.length)&&DEBUG_ALT==null)begin([REH],'rehearsal');else begin(setFor(dayNo),mode);
if(DEBUG_ALT!=null){V.alt=DEBUG_ALT;V.Y=B.Y(DEBUG_ALT,Lay.BP);V.cam=V.camT=Math.max(0,V.Y-Lay.avail*.4);onBand(B.bandOf(DEBUG_ALT),true);E.hm.textContent=fmtAlt(DEBUG_ALT)}
requestAnimationFrame(frame)})();
