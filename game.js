(()=>{'use strict';
const F=window.FILMS,A=window.FlopAudio,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],N=7,LAUNCH=Date.UTC(2026,8,1);
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sydDay=(d=new Date())=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(d).split('-').map(Number);return Date.UTC(p[0],p[1]-1,p[2])};
const todayNo=Math.floor((sydDay()-LAUNCH)/864e5)+1;
const ORD=(()=>{let s=20260901,a=F.map((_,i)=>i);const r=()=>(s=(s*1664525+1013904223)%4294967296)/4294967296;for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a})();
const setFor=n=>Array.from({length:N},(_,k)=>F[ORD[(((n-1)*N+k)%F.length+F.length)%F.length]]);
// ---------- money ----------
function parse(raw){if(raw==null)return null;let s=String(raw).toLowerCase().trim().replace(/^usd|usd$/g,'').replace(/[$\s_]/g,'');
 if(!s)return null;if(/^\d{1,3}(,\d{3})+(\.\d+)?/.test(s))s=s.replace(/,/g,'');else s=s.replace(/,/g,'.');
 const m=s.match(/^(\d*\.?\d+)(k|thousand|grand|m|mm|mil|mill|million|millions|b|bn|bil|billion|billions)?\.?$/);if(!m)return null;
 let v=parseFloat(m[1]);const u=m[2]||'';if(u==='k'||u==='thousand'||u==='grand')v*=1e3;else if(u[0]==='b')v*=1e9;else if(u[0]==='m')v*=1e6;else if(v<5000)v*=1e6;
 return v>=1e3&&v<=5e9?v:null}
const fmt=n=>n>=1e9?'$'+(+(n/1e9).toFixed(2))+'B':n>=1e6?'$'+(+(n/1e6).toFixed(n<1e7?1:0))+'M':'$'+Math.round(n/1e3)+'K';
const full=n=>'$'+Math.round(n).toLocaleString('en-US');
const LO=Math.log(1e5),HI=Math.log(5e8),s2v=x=>Math.exp(LO+(HI-LO)*x/1000),v2s=v=>Math.max(0,Math.min(1000,1000*(Math.log(v)-LO)/(HI-LO)));
const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v))-1);return Math.round(v/p)*p};
// ---------- scoring ----------
const tier=m=>m<1?0:m<2.5?1:m<6?2:3,TN=['Flop','Even','Hit','Smash'],TE=['💦','😐','🎉','🚀'],BONUS=3;
const ACC=[[1.1,11,'🎯','Bullseye!'],[1.25,8,'🟩','So close!'],[1.5,5,'🟨','Warm'],[2,3,'🟧','In the ballpark'],[3,0,'⬜','Way off'],[Infinity,-3,'🔻','Slip!']];
const acc=(g,b)=>{const r=Math.max(g/b,b/g);return ACC.find(a=>r<=a[0])};
const DIVES=[[6,'swan','Perfect swan dive','🦢'],[4,'cannon','Cannonball!','💣'],[0,'belly','Belly flop!','💦']];
const heightOf=r=>r.reduce((h,x)=>Math.max(0,h+x.up+x.bonus),0);
// ---------- state ----------
const LS=Object.assign({days:{},streak:0,last:0,best:0},JSON.parse(localStorage.floppr3||'{}'));const save=()=>localStorage.floppr3=JSON.stringify(LS);
const qs=new URLSearchParams(location.search);let dayNo=todayNo,mode='daily';
if(qs.has('day')){dayNo=Math.min(todayNo,Math.max(1,parseInt(qs.get('day'))||todayNo));if(dayNo!==todayNo)mode='archive'}
let films,st,locked=null,busy=false;
const height=()=>heightOf(st.r);
// ---------- engine ----------
const root=document.documentElement,V={h:0,target:0,cam:0,base:90,mode:'idle',dive:null,lastStep:0,x:0,y:0,rot:0};
const mobile=()=>innerWidth<=820,mpx=()=>mobile()?6:8;
function baseTarget(){if(!mobile())return Math.round(innerHeight*.12);if(document.body.classList.contains('diving'))return Math.round(innerHeight*.16);return $('#panel').getBoundingClientRect().height+18}
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const SKY=[[0,[92,63,150],[233,130,160],[255,190,130]],[30,[52,40,120],[170,95,165],[245,150,130]],[60,[18,20,66],[60,48,130],[115,72,150]],[95,[3,3,18],[14,12,46],[44,30,92]]];
function skyAt(h){let i=0;while(i<SKY.length-2&&h>SKY[i+1][0])i++;const a=SKY[i],b=SKY[i+1],t=clamp((h-a[0])/(b[0]-a[0]),0,1);return[1,2,3].map(k=>`rgb(${a[k].map((x,j)=>Math.round(lerp(x,b[k][j],t))).join(',')})`)}
function layoutClouds(){$$('.layer').forEach(l=>{const f=+l.dataset.f;l.querySelectorAll('.cl').forEach(c=>c.style.bottom=(V.base+(+c.style.getPropertyValue('--y'))*mpx()*f)+'px')})}
let lastT=performance.now(),lastBaseLayout=0;
function frame(t){const dt=Math.min(.05,(t-lastT)/1000);lastT=t;const M=mpx();
 V.base=lerp(V.base,baseTarget(),RM?1:Math.min(1,dt*6));root.style.setProperty('--base',V.base.toFixed(1)+'px');root.style.setProperty('--mpx',M);
 if(Math.abs(V.base-lastBaseLayout)>.5){layoutClouds();lastBaseLayout=V.base}
 // climbing rung by rung
 if(V.mode==='climb'){if(t-V.lastStep>(RM?0:85)){V.lastStep=t;const d=Math.sign(V.target-V.h);V.h+=d;$('#hm').textContent=Math.round(V.h);hop();if(Math.round(V.h)%2===0)A.sfx.step(V.h);
   if(V.h===V.target){V.mode='idle';setPose(V.after||'idle');$('#height').classList.remove('pop');void $('#height').offsetWidth;$('#height').classList.add('pop')}}}
 let pipY=V.h*M+14,pipX=0,rot=0;
 if(V.mode==='dive'){const D=V.dive,p=clamp((t-D.t0)/D.T,0,1),e=p*p;pipY=(1-e)*D.y0+D.arc*Math.sin(Math.PI*Math.min(1,p*1.6))*(1-p)+e*(-34);pipX=D.dx*(1-Math.pow(1-p,2));
   rot=D.kind==='swan'?lerp(0,180,clamp(p*1.3,0,1)):D.kind==='cannon'?720*p:lerp(0,95,clamp(p*1.8,0,1));
   const hm=Math.max(0,Math.round(pipY/M));$('#hm').textContent=hm;if(p>=1){V.mode='landed';land(D)}}
 if(V.mode==='landed'){pipY=-26;pipX=V.dive.dx;rot=0}
 if(V.mode==='idle'||V.mode==='climb')V.ph=V.h;$('#plat').style.bottom=(V.base+(V.ph||0)*M)+'px';
 const pw=$('#pipWrap');pw.style.transform=`translate(${pipX}px,${-(V.base+pipY)}px) rotate(${rot}deg)`;pw.style.bottom='0';pw.style.top='auto';
 // camera follows Pip from the first rung
 const camT=Math.max(0,pipY)*.72;V.cam=lerp(V.cam,camT,RM?1:Math.min(1,dt*(V.mode==='dive'?9:4)));
 $$('.layer').forEach(l=>l.style.transform=`translateY(${(V.cam*l.dataset.f).toFixed(1)}px)`);
 const hv=V.cam/(.72*M),s=skyAt(hv);$('#sky').style.background=`linear-gradient(${s[0]},${s[1]} 58%,${s[2]})`;
 $('#stars').style.opacity=clamp((hv-12)/35,0,1);$('#stars2').style.opacity=clamp((hv-30)/40,0,1);$('#moon').style.opacity=clamp((hv-40)/20,0,1);$('#moon').style.transform=`translateY(${-hv*.6}px)`;
 $('#planet').style.opacity=clamp((hv-78)/15,0,1);$('#sun').style.transform=`translateY(${V.cam*.18+hv*2.2}px)`;$('#sun').style.opacity=clamp(1-hv/45,0,1);
 A.setLevel(Math.max(V.h,hv));requestAnimationFrame(frame)}
function hop(){const s=$('#pipSq');s.classList.remove('hop');void s.offsetWidth;s.classList.add('hop')}
function climbTo(h,after){V.target=h;V.after=after;if(h===V.h){setPose(after||'idle');return}V.mode='climb';setPose('climb');if(h<V.h)setFace('worried')}
// ---------- Pip ----------
const FACES={happy:['M71 41 Q80 37 88 41','M112 41 Q120 37 129 41','M90 93 Q100 101 110 93',1],
 joy:['M71 38 Q80 32 88 38','M112 38 Q120 32 129 38','M86 91 Q100 108 114 91 Z',1],
 focus:['M71 43 L88 40','M112 40 L129 43','M93 95 L107 95',1],
 worried:['M72 38 L88 44','M112 44 L128 38','M90 98 Q95 92 100 97 Q105 92 110 98',1.1],
 sad:['M72 39 Q80 42 88 46','M112 46 Q120 42 128 39','M90 99 Q100 91 110 99',.9],
 wow:['M71 36 Q80 30 88 36','M112 36 Q120 30 129 36','M96 92 Q100 104 104 92 Q100 88 96 92Z',1.2],
 squint:['M71 44 Q80 40 88 44','M112 44 Q120 40 129 44','M88 92 Q100 104 112 92',.5]};
function setFace(k){const f=FACES[k];$('#browL').setAttribute('d',f[0]);$('#browR').setAttribute('d',f[1]);const m=$('#mouth');m.setAttribute('d',f[2]);m.setAttribute('fill',f[2].endsWith('Z')?'#7a2d4f':'none');
 $$('#eyes .eye').forEach((e,i)=>{e.style.transformBox='fill-box';e.style.transformOrigin='center';e.style.transform=`scaleY(${f[3]})`})}
function setPose(p){$('#pipWrap').className='p-'+p;({idle:'happy',climb:'focus',cheer:'joy',nervous:'worried',swan:'squint',cannon:'wow',belly:'wow',float:'sad',proud:'joy'})[p]&&setFace(({idle:'happy',climb:'focus',cheer:'joy',nervous:'worried',swan:'squint',cannon:'wow',belly:'wow',float:'sad',proud:'joy'})[p])}
setInterval(()=>{if(V.mode!=='idle')return;const e=$$('#eyes .eye');e.forEach(x=>x.style.transform='scaleY(.1)');setTimeout(()=>setFace(({cheer:'joy',nervous:'worried',float:'sad'})[$('#pipWrap').className.slice(2)]||'happy'),130)},3800);
// ---------- particles ----------
function pipScreen(){const r=$('#pipWrap').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/3}}
function confetti(n=40){if(RM)return;const {x,y}=pipScreen(),C=['#ff7aa2','#ffd36e','#8fe3c8','#a9d8f5','#c7b5f2'];for(let i=0;i<n;i++){const c=document.createElement('div');c.className='conf';c.style.left=x+'px';c.style.top=y+'px';c.style.background=C[i%5];
 const a=Math.random()*Math.PI*2,sp=80+Math.random()*220;c.style.setProperty('--x',Math.cos(a)*sp+'px');c.style.setProperty('--y',(Math.sin(a)*sp+160)+'px');c.style.setProperty('--r',(Math.random()*900-450)+'deg');c.style.setProperty('--d',(1+Math.random()*.8)+'s');document.body.appendChild(c);setTimeout(()=>c.remove(),2000)}}
function sparkles(n=6,ch='✨'){if(RM)return;const {x,y}=pipScreen();for(let i=0;i<n;i++){const s=document.createElement('div');s.className='spark';s.textContent=ch;s.style.left=(x+Math.random()*120-60)+'px';s.style.top=(y+Math.random()*80-50)+'px';s.style.animationDelay=i*.07+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1500)}}
function splash(kind,h){const pool=$('#pool').getBoundingClientRect(),sc=$('#scene').getBoundingClientRect(),pr=$('#pipWrap').getBoundingClientRect(),cx=pr.left+pr.width/2,cy=pool.top+4,s=$('#fx');
 const n=RM?0:kind==='belly'?34:Math.round(12+h*.35),pow=kind==='swan'?.7:kind==='cannon'?1.5:1.1;
 for(let i=0;i<n;i++){const d=document.createElement('div');d.className='drop';d.style.left=cx+'px';d.style.top=cy+'px';d.style.setProperty('--s',(8+Math.random()*12)+'px');
  const spread=kind==='swan'?40:140;d.style.setProperty('--x',(Math.random()*2-1)*(spread+h*1.2)*pow+'px');d.style.setProperty('--y',-(60+Math.random()*(80+h*2.6))*pow+'px');d.style.setProperty('--d',(1+Math.random()*.6)+'s');s.appendChild(d);setTimeout(()=>d.remove(),1800)}
 for(let k=0;k<3;k++){const r=document.createElement('div');r.className='ring';r.style.left=cx+'px';r.style.top=cy+'px';r.style.setProperty('--w',(140+k*70+h)+'px');r.style.animationDelay=k*.15+'s';s.appendChild(r);setTimeout(()=>r.remove(),1600)}}
function countUp(el,v,suffix=''){if(RM){el.textContent=fmt(v)+suffix;return}const t0=performance.now(),D=750;(function f(t){const p=Math.min(1,(t-t0)/D),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.max(1e3,v*e))+suffix;if(p<1)requestAnimationFrame(f)})(t0)}
// ---------- flow ----------
function begin(fs,m){films=fs;mode=m;st=(m!=='practice'&&LS.days[dayNo])||{r:[]};document.body.classList.remove('diving');
 $('#kicker').textContent=m==='practice'?'Practice climb':m==='archive'?`Floppr #${dayNo} · archive`:`Floppr #${dayNo}`;
 V.mode='idle';V.dive=null;V.h=V.target=V.ph=height();$('#hm').textContent=V.h;setPose('idle');if(st.r.length>=N){showEnd(false)}else showFilm()}
function show(id){['play','reveal','end'].forEach(s=>$('#'+s).hidden=s!==id);const el=$('#'+id);el.classList.remove('sec');void el.offsetWidth;el.classList.add('sec')}
function dots(){$('#dots').innerHTML=Array.from({length:N},(_,i)=>`<i class="${i<st.r.length?'done':i===st.r.length?'cur':''}"></i>`).join('')}
function showFilm(){const f=films[st.r.length];locked=null;busy=false;dots();show('play');
 $('#title').textContent=f.title;$('#meta').textContent=`Film ${st.r.length+1} of ${N} · ${f.year} · ${f.genre}`;
 const a=$('#amt');a.value='';a.disabled=false;a.className='';$('#slider').value=600;$('#slider').disabled=false;$('#lock').textContent='Lock';$('#preview').textContent='Type an amount or drag the slider';$('#calls').classList.remove('ready');
 if(matchMedia('(hover:hover)').matches)a.focus()}
function syncFromText(){const a=$('#amt'),v=parse(a.value);a.classList.toggle('bad',!!a.value.trim()&&!v);
 if(v){$('#slider').value=v2s(v);$('#preview').textContent=`= ${full(v)}`}else $('#preview').textContent=a.value.trim()?'Try 120M, 4.5m, 400k, 2 billion…':'Type an amount or drag the slider';return v}
function currentGuess(){const t=$('#amt').value.trim();return t?parse(t):nice(s2v(+$('#slider').value))}
function lock(){if(locked){unlock();return true}const v=currentGuess(),a=$('#amt');if(!v){a.classList.add('shake','bad');setTimeout(()=>a.classList.remove('shake'),300);return false}
 locked=v;a.value=fmt(v).slice(1);a.disabled=true;a.blur();a.className='locked';$('#slider').disabled=true;$('#lock').textContent='Edit';$('#preview').textContent=`🔒 ${full(v)} · now call it!`;$('#calls').classList.add('ready');A.sfx.click();return true}
function unlock(){locked=null;const a=$('#amt');a.disabled=false;a.className='';$('#slider').disabled=false;$('#lock').textContent='Lock';$('#calls').classList.remove('ready');syncFromText();a.focus()}
function call(v){if(busy||$('#play').hidden||V.mode!=='idle')return;if(!locked&&!lock())return;busy=true;const f=films[st.r.length],g=locked,m=f.gross/f.budget,t=tier(m),AC=acc(g,f.budget);
 const rec={i:F.indexOf(f),g,call:v,up:AC[1],bonus:v===t?BONUS:0};st.r.push(rec);persist();const after=height();
 show('reveal');dots();$('#rTitle').textContent=f.title;const rh=$('#rHead');rh.textContent=`${AC[2]} ${AC[3]} ${AC[1]>0?'+'+AC[1]+'m':AC[1]<0?AC[1]+'m':'+0m'}`;rh.classList.remove('big');void rh.offsetWidth;rh.classList.add('big');
 countUp($('#rGuess'),g);setTimeout(()=>countUp($('#rBudget'),f.budget,f.budgetRange?'*':''),250);setTimeout(()=>countUp($('#rGross'),f.gross),500);
 const seg=[0.1,1,2.5,6,60].map(x=>Math.log10(x)),lm=clamp(Math.log10(m),seg[0],seg[4]),fr=(lm-seg[t])/(seg[t+1]-seg[t]);$('#needle').style.left='0';setTimeout(()=>$('#needle').style.left=`calc(${(t+fr)*25}% - 3px)`,700);
 const rc=$('#rCall');rc.className='rcall'+(v===t?'':' bad');rc.innerHTML=v===t?`📣 You called <b>${TN[v]}</b> ✅ It made ${m.toFixed(1)}× its budget. <b>+${BONUS}m bonus</b>`:`📣 You called <b>${TN[v]}</b> ❌ It was a <b>${TN[t]} ${TE[t]}</b> (${m.toFixed(1)}×). Pip wobbles!`;
 $('#rSrc').innerHTML=`Source: <a href="${f.source}" target="_blank" rel="noopener">Wikipedia</a>${f.budgetRange?` · *budget reported as ${fmt(f.budgetRange[0])}–${fmt(f.budgetRange[1])}; midpoint used`:''}${f.budgetNote?' · '+f.budgetNote:''}${f.grossNote?' · gross '+f.grossNote:''}. Not inflation-adjusted.`;
 $('#next').textContent=st.r.length>=N?'🏊 Time to dive!':'Next film →';
 // reactions
 if(AC[1]===11){A.sfx.bullseye();setTimeout(()=>confetti(50),150);sparkles(8,'⭐')}else if(AC[1]>=5){A.sfx.good();sparkles(4)}else if(AC[1]<0)A.sfx.slip();
 const finalPose=v===t?(AC[1]>=8?'cheer':'idle'):'nervous';
 if(v!==t)setTimeout(()=>{A.sfx.wobble()},Math.abs(after-V.h)*85+100);
 setTimeout(()=>climbTo(after,finalPose),350);setTimeout(()=>$('#next').focus(),60)}
function diveType(){const c=st.r.filter(x=>x.bonus).length;return DIVES.find(d=>c>=d[0])}
function dive(){if(V.mode==='dive')return;const h=height(),d=diveType(),M=mpx();busy=true;document.body.classList.add('diving');setPose(d[1]);
 const pool=$('#pool').getBoundingClientRect(),pr=$('#pipWrap').getBoundingClientRect(),cur=new DOMMatrix(getComputedStyle($('#pipWrap')).transform);
 const dx=pool.left+pool.width/2-(pr.left+pr.width/2)+cur.m41;
 setTimeout(()=>{A.sfx.whoosh(1+h/60);V.dive={t0:performance.now(),T:RM?300:(1100+h*18),y0:V.h*M+14,arc:40+h*.4,dx,kind:d[1],h};V.mode='dive';V.h=0},RM?0:450)}
function land(D){const d=diveType();splash(D.kind,D.h);if(D.kind==='belly'){A.sfx.smack();A.sfx.splash(1);setTimeout(()=>setPose('float'),200)}else{A.sfx.splash(D.kind==='cannon'?1.6:.6);if(D.kind==='swan'){A.sfx.sparkle();setTimeout(()=>sparkles(10),200)}setTimeout(()=>setPose('proud'),250)}
 $('#hm').textContent=D.h;setTimeout(()=>{if(D.kind!=='belly')confetti(70);showEnd(true)},RM?100:1700)}
function showEnd(anim){const h=height(),d=diveType(),c=st.r.filter(x=>x.bonus).length;busy=false;dots();document.body.classList.remove('diving');show('end');
 if(!anim){V.mode='landed';V.h=0;V.dive={dx:0,kind:d[1]};requestAnimationFrame(()=>{const pool=$('#pool').getBoundingClientRect(),pr=$('#pipWrap').getBoundingClientRect();V.dive.dx=pool.left+pool.width/2-(pr.left+pr.width/2)});setPose(d[1]==='belly'?'float':'proud')}
 $('#hm').textContent=h;$('#eHead').textContent=`${d[3]} ${d[2]} from ${h}m`;$('#eSub').textContent=`${c}/7 calls right · ${st.r.filter(x=>x.up>=8).length} near-bullseyes`;
 $('#recap tbody').innerHTML=st.r.map((x,k)=>{const f=F[x.i];return`<tr style="animation-delay:${k*.07}s"><td>${f.title}</td><td>${fmt(x.g)}</td><td>${fmt(f.budget)}</td><td>${fmt(f.gross)}</td><td>${TE[x.call]}${x.bonus?'✅':'❌'}</td><td>${x.up+x.bonus>0?'+':''}${x.up+x.bonus}</td></tr>`}).join('');
 const climb=st.r.map(x=>acc(x.g,F[x.i].budget)[2]).join(''),calls=st.r.map(x=>x.bonus?'✅':'❌').join('');
 $('#share').textContent=`🦛 Floppr ${mode==='practice'?'practice':'#'+dayNo} · ${h}m ${d[3]}\n🪜 ${climb}\n📣 ${calls}\n${d[2]}${mode==='daily'&&LS.streak>1?' · 🔥'+LS.streak:''}`;
 $('#best').textContent=`Best height: ${LS.best}m · Daily streak: ${LS.streak}`}
function persist(){if(mode==='practice')return;LS.days[dayNo]=st;if(st.r.length===N){LS.best=Math.max(LS.best,height());if(mode==='daily'&&LS.last!==dayNo){LS.streak=(LS.last===dayNo-1?LS.streak:0)+1;LS.last=dayNo}}save();$('#streak').textContent=LS.streak?'🔥'+LS.streak:''}
// ---------- wiring ----------
const amt=$('#amt');amt.addEventListener('input',syncFromText);amt.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lock()}});
$('#slider').addEventListener('input',e=>{const v=nice(s2v(+e.target.value));amt.value=fmt(v).slice(1);amt.classList.remove('bad');$('#preview').textContent=`= ${full(v)}`});
$('#lock').onclick=()=>lock();$$('.v').forEach(b=>b.onclick=()=>call(+b.dataset.v));
document.addEventListener('keydown',e=>{if($('dialog[open]'))return;if(!$('#play').hidden&&/^[1-4]$/.test(e.key)&&(locked||document.activeElement!==amt)){e.preventDefault();call(+e.key-1)}
 else if(!$('#reveal').hidden&&e.key==='Enter'&&document.activeElement!==$('#next')){e.preventDefault();$('#next').click()}});
$('#next').onclick=()=>{if(V.mode==='climb')return;if(st.r.length>=N)dive();else{setPose('idle');showFilm()}};
$('#copy').onclick=async()=>{const t=$('#share').textContent;try{await navigator.clipboard.writeText(t);$('#copy').textContent='Copied! 📋'}catch{const r=document.createRange();r.selectNodeContents($('#share'));getSelection().removeAllRanges();getSelection().addRange(r);$('#copy').textContent='Selected, press copy'}setTimeout(()=>$('#copy').textContent='Copy result',2000)};
$('#practice').onclick=()=>begin([...F].sort(()=>Math.random()-.5).slice(0,N),'practice');
$('#helpBtn').onclick=()=>$('#help').showModal();$('#helpClose').onclick=()=>$('#help').close();$('#archClose').onclick=()=>$('#arch').close();
$('#archBtn').onclick=()=>{$('#archList').innerHTML='';for(let n=todayNo;n>=Math.max(1,todayNo-30);n--){const b=document.createElement('button'),d=LS.days[n];b.textContent=`#${n}${n===todayNo?' (today)':''} ${d&&d.r.length>=N?'· '+heightOf(d.r)+'m':d&&d.r.length?'· in progress':''}`;b.onclick=()=>location.search='?day='+n;$('#archList').appendChild(b)}$('#arch').showModal()};
$('#pip').addEventListener('click',()=>{if(V.mode==='idle'){setPose('cheer');A.sfx.good();setTimeout(()=>V.mode==='idle'&&setPose('idle'),1400)}});
const mb=$('#mute'),mi=()=>mb.textContent=A.muted?'🔇':'🔊';mi();mb.onclick=()=>{A.init();A.toggle();mi()};
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{A.init();A.resume()},{passive:true}));
addEventListener('resize',layoutClouds);
$('#marks').innerHTML=Array.from({length:11},(_,i)=>`<span style="bottom:calc(${(i+1)*10} * var(--mpx) * 1px - 7px)">${(i+1)*10}m</span>`).join('');
$('#streak').textContent=LS.streak?'🔥'+LS.streak:'';if(!LS.seen){LS.seen=1;save();setTimeout(()=>$('#help').showModal(),300)}
window.__floppr={parse,setFor,todayNo,V};begin(setFor(dayNo),mode);requestAnimationFrame(frame)})();
