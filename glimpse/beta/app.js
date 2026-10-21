(()=>{"use strict";
const $=id=>document.getElementById(id), Q=new URLSearchParams(location.search);
const URL_PUBLIC="https://optimusslimes.github.io/floppr/glimpse/";
const LOOKQ=+Q.get("look")||0, TYPEQ=+Q.get("type")||0;  // test overrides only (ms)
const EPOCH="2026-10-21", KEY=/\/beta\//.test(location.pathname)?"glimpse:beta":"glimpse:v2", PREVIEW_KEY="glimpse:pv2", WORLDS=3;
const LOOKS=[10000,10000,8000], BONUS_LOOK=7000, BONUS_TYPE=45000;
// ---------- dates (Australia/Sydney) ----------
const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:"Australia/Sydney",year:"numeric",month:"2-digit",day:"2-digit"});
function sydDate(d=new Date()){return Q.get("date")||fmt.format(d);}
function dayNum(ds){return Math.round((Date.parse(ds+"T00:00:00Z")-Date.parse(EPOCH+"T00:00:00Z"))/864e5)+1;}
function msToSydMidnight(){const now=new Date();const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Australia/Sydney",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(now).map(x=>[x.type,x.value]));
 return ((23-+p.hour)*3600+(59-+p.minute)*60+(60-+p.second))*1000;}
// ---------- daily scenes: generated per Sydney date by art.js (GART). 4 themes a day: 3 core + Bonus.
const today=sydDate(), N=dayNum(today);
const DAYT=GART.themesFor(N), RUN=DAYT.slice(0,3), BONUS=DAYT[3];
const SC=id=>GART.THEMES.includes(id)?GART.scene(id,N):null;
// ---------- rarity: ESTIMATED difficulty per object (size, placement, contrast). Replace RARITY.tier with crowd data later.
const TIERS=[{n:"Common",e:"⚪",p:50},{n:"Uncommon",e:"🔷",p:80},{n:"Rare",e:"✨",p:120},{n:"Epic",e:"💎",p:180}];
const RARITY={source:"estimate",tier:(scene,id)=>{const d=scene.items[id]&&scene.items[id].diff;return d>=0&&d<=3?d:0;}};
const tierIn=(sc,id)=>RARITY.tier(sc,id);
function ptsFor(sc,ids){return ids.reduce((a,id)=>a+TIERS[RARITY.tier(sc,id)].p,0);}
const fmtN=n=>(+n||0).toLocaleString("en-AU");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// ---------- storage (corruption-safe, v3 = multi-world days; v2 single-scene days migrated in place) ----------
function fresh(){return {v:3,days:{},settings:{music:true,sfx:true,seenHelp:false}};}
let S;try{S=JSON.parse(localStorage.getItem(KEY)||"null");if(!S||typeof S!=="object"||!(S.v===2||S.v===3)||!S.days||typeof S.days!=="object"||Array.isArray(S.days)||!S.settings||typeof S.settings!=="object")throw 0;}catch(e){try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(KEY+":corrupt",raw);}catch{}S=fresh();}
function cleanWorld(w,live){if(!w||typeof w.scene!=="string"||!Array.isArray(w.found))return null;const ent=Array.isArray(w.entries)?w.entries.slice(0,200):[];
 if(live&&w.gen==="v7"){const sc=SC(w.scene);if(!sc)return null;const found=[...new Set(w.found.filter(id=>sc.items[id]))];return {scene:sc.id,gen:"v7",found,entries:ent,pts:ptsFor(sc,found),count:found.length,total:Object.keys(sc.items).length,done:w.done!==false};}
 const n=x=>Number.isFinite(+x)&&+x>=0?+x:0;const total=n(w.total)||1;return {scene:w.scene,gen:w.gen||"old",found:w.found.filter(x=>typeof x==="string").slice(0,60),entries:ent,pts:n(w.pts),count:Math.min(n(w.count)||w.found.length,total),total,done:w.done!==false};}
function legacyDay(d){const w=cleanWorld({...d,done:true},false);return w?tally({legacy:true,run:[w.scene],w:[w],done:true}):null;}
function tally(d){d.pts=d.w.reduce((a,w)=>a+w.pts,0);d.count=d.w.reduce((a,w)=>a+w.count,0);d.total=d.w.reduce((a,w)=>a+w.total,0);return d;}
function cleanDay(k,d){if(!/^\d{4}-\d\d-\d\d$/.test(k)||!d||typeof d!=="object")return null;
 if(!Array.isArray(d.w)){return Array.isArray(d.found)?legacyDay(d):null;}
 const live=k===today;const w=d.w.map(x=>cleanWorld(x,live)).filter(Boolean).slice(0,WORLDS);const out={run:Array.isArray(d.run)?d.run.slice(0,WORLDS):[],w,done:!!d.done||w.length>=WORLDS};if(d.gen)out.gen=d.gen;
 if(d.legacy)out.legacy=true;if(d.bonus){const b=cleanWorld(d.bonus,live);if(b)out.bonus=b;}return tally(out);}
for(const [k,d] of Object.entries(S.days)){const c=cleanDay(k,d);if(c)S.days[k]=c;else delete S.days[k];}
if(typeof S.settings.music!=="boolean"){S.settings.music=true;S.settings.sfx=true;delete S.settings.sound;}
S.challenges=S.challenges&&typeof S.challenges==="object"?S.challenges:{};S.v=3;
for(const [k,v] of Object.entries(S.challenges)){if(typeof v==="number")S.challenges[k]={c:v};else if(!v||typeof v!=="object"||typeof v.c!=="number")delete S.challenges[k];}
try{const pv=JSON.parse(localStorage.getItem(PREVIEW_KEY)||"null");if(pv&&pv.days&&typeof pv.days==="object"){for(const [k,d] of Object.entries(pv.days)){if(!S.days[k]){const c=cleanDay(k,d);if(c)S.days[k]=c;}}localStorage.removeItem(PREVIEW_KEY);}}catch{}
if(typeof S.settings.uid!=="string"||!/^[a-z0-9]{6}$/.test(S.settings.uid))S.settings.uid=Math.random().toString(36).slice(2,8).padEnd(6,"0");
if(typeof S.settings.name!=="string")S.settings.name="";
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch{}};
// ---------- state ----------
// resume: a world that was started but not finished (tab closed/reloaded) is locked with what was found so far; no replays
const DAY=()=>S.days[today];
if(DAY()&&(DAY().legacy||DAY().gen!=="v7")){S.legacyToday=DAY();delete S.days[today];}
if(DAY()&&!DAY().legacy){const d=DAY();d.w.forEach(w=>w.done=true);d.done=d.w.length>=WORLDS;if(d.bonus)d.bonus.done=true;tally(d);}
save();
const SFX=new Proxy({},{get:(_,k)=>a=>GAudio.sfx(k,a)});
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms);}catch{}};
const cleanName=s=>(s||"").replace(/[^\p{L}\p{N} '\-]/gu,"").trim().slice(0,16);
const CH=(()=>{const c=parseInt(Q.get("c"),10),d=parseInt(Q.get("d"),10);if(c>=0&&c<1000000&&d>0)return {c,d,n:cleanName(Q.get("n")),u:(Q.get("u")||"").slice(0,6)};return null;})();
const SELF=CH&&CH.u&&CH.u===S.settings.uid;
if(CH&&!SELF&&CH.d===N){S.challenges[today]={c:CH.c,n:CH.n};save();}
let mode="core"; // core | bonus | practice
let wi=0, SCENE=SC(RUN[0]), M=GMatch.build(SCENE), found=new Set(), entries=[], phase="home", timers=[], viewW=0;
const clearT=()=>{timers.forEach(t=>{clearTimeout(t);clearInterval(t);cancelAnimationFrame(t);});timers=[];};
const RM=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
function show(p){["ready","look","type","inter","res"].forEach(x=>$("p-"+x).classList.toggle("hidden",x!==p));}
function screen(s){$("home").classList.toggle("hidden",s!=="home");$("game").classList.toggle("hidden",s!=="game");window.scrollTo({top:0});}
function sceneSVG(sc){const svg=GART.svgOf(sc);const [w,h]=sc.vb;return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(sc.title)}: an isometric diorama with ${Object.keys(sc.items).length} things to remember">${svg}</svg>`;}
function setAR(sc){const [w,h]=sc.vb;document.documentElement.style.setProperty("--ar",`${w}/${h}`);document.documentElement.style.setProperty("--arn",(w/h).toFixed(4));}
const lookMs=()=>LOOKQ||(mode==="bonus"?BONUS_LOOK:mode==="practice"?10000:LOOKS[wi]);
const typeMs=()=>TYPEQ||(mode==="bonus"?BONUS_TYPE:60000);
const label=()=>mode==="bonus"?"⭐ Bonus scene":mode==="practice"?"Practice":`Scene ${wi+1} of ${WORLDS}`;
function pips(el){if(mode!=="core"){el.innerHTML="";return;}const d=DAY();el.innerHTML=RUN.map((id,i)=>{const w=d&&d.w[i];const cls=w&&w.done?"done":i===wi?"cur":"";return `<span class="${cls}" aria-label="Scene ${i+1}${w&&w.done?": "+fmtN(w.pts)+" pts":""}">${w&&w.done?SC(id).emoji:i+1}</span>`;}).join("");}
function header(){setAR(SCENE);$("dayno").textContent=mode==="practice"?"practice":"#"+N;$("intro-t").textContent=SCENE.title;$("intro-e").textContent=SCENE.emoji;$("intro-n").textContent=`${label()} · ${Object.keys(SCENE.items).length} objects · ${Math.round(lookMs()/1000)} seconds to look`;$("intro").dataset.scene=SCENE.id;$("intro").querySelector(".kick").textContent=label();}
function cover(on,sub){$("scene").classList.toggle("hidden",on);$("cover").classList.toggle("hidden",!on);if(sub)$("cover-sub").textContent=sub;}
const idle=f=>(window.requestIdleCallback?requestIdleCallback(f,{timeout:1500}):setTimeout(f,200));
function prefetch(ids){ids=ids.filter(Boolean);const step=()=>{const id=ids.shift();if(!id)return;try{GART.svgOf(SC(id));}catch(e){}if(ids.length)idle(step);};idle(step);}
// ---------- home ----------
function home(){clearT();phase="home";mode="core";document.body.className="on-home";screen("home");GAudio.phase("home");
 $("h-no").textContent="Glimpse #"+N;$("h-date").textContent=new Date(today+"T12:00:00Z").toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});
 const d=DAY(),done=d&&d.done,started=d&&!done&&d.w.length>0;
 $("btn-play").textContent=done?"🏆 See your result":started?`▶ Keep going: scene ${d.w.length+1} of ${WORLDS}`:"▶ Play today's Glimpse";
 $("h-done").classList.toggle("hidden",!done);if(done){$("h-total").textContent=fmtN(d.pts)+" pts";homeCountdown();}
 $("btn-bonus").classList.toggle("hidden",!(done&&!d.legacy&&!d.bonus));
 $("h-note").textContent=started?"If you leave a scene early, it keeps what you found so far. You can't replay it.":done?"":"🎵 Music and sounds start when you play. Turn them off at the top.";
 const ch=S.challenges[today],hc=$("h-chal");hc.classList.add("hidden");
 if(SELF){hc.classList.remove("hidden");hc.innerHTML="🙂 That's your own challenge link. Send it to a friend to see if they can beat you!";}
 else if(CH&&CH.d!==N){hc.classList.remove("hidden");hc.innerHTML=`🎯 That challenge was for Glimpse #${CH.d}. Today's is #${N}, so play it and send yours back.`;}
 else if(ch){hc.classList.remove("hidden");hc.innerHTML=`🎯 ${ch.n?esc(ch.n):"A friend"} scored <b>${fmtN(ch.c)}</b> on today's Glimpse. Beat it!`;}
 const st=statsData();$("h-stats").innerHTML=`<div><b>${st.played}</b>played</div><div><b>${st.streak}</b>streak</div><div><b>${fmtN(st.best)}</b>best total</div><div><b>${fmtN(st.avg)}</b>avg total</div>`;
 {const d0=DAY();const nx=d0&&d0.done?[]:RUN.slice(d0?d0.w.length:0);prefetch(nx.slice(0,2));}
 $("h-prac").innerHTML=GART.THEMES.map((t,i)=>`<button data-sc="${i}">${GART.META[t][1]} ${esc(GART.META[t][0])}</button>`).join("");}
function homeCountdown(){const f=()=>{const ms=msToSydMidnight();$("h-cd").textContent=hms(ms);if(!Q.get("date")&&sydDate()!==today){$("h-cd").textContent="now! Reload";}};f();timers.push(setInterval(f,1000));}
const hms=ms=>[Math.floor(ms/36e5),Math.floor(ms%36e5/6e4),Math.floor(ms%6e4/1e3)].map(x=>String(x).padStart(2,"0")).join(":");
// ---------- run flow ----------
function play(){const d=DAY();if(d&&d.done){finalResults(true);return;}mode="core";wi=d?d.w.length:0;startWorld();}
function playBonus(){const d=DAY();if(!d||!d.done||d.bonus||d.legacy)return;mode="bonus";startWorld();}
function practiceScene(i){mode="practice";SCENE=GART.scene(GART.THEMES[i],-N-1);startWorld(SCENE);}
function startWorld(fixed){clearT();GAudio.unlock();GAudio.setPrefs({music:S.settings.music,sfx:S.settings.sfx});
 SCENE=fixed||(mode==="bonus"?SC(BONUS):SC(RUN[wi]));M=GMatch.build(SCENE);found=new Set();entries=[];
 document.body.className="";screen("game");header();show("ready");pips($("r-pips"));$("r-title").textContent=label()+": "+SCENE.title;$("r-sub").textContent=`Look at the scene for ${Math.round(lookMs()/1000)} seconds and try to remember all the objects. Then you have ${Math.round(typeMs()/1000)} seconds to type everything you saw.`+(mode==="bonus"?" This score is extra. It doesn't change your daily score.":mode==="practice"?" Practice doesn't count.":"");
 const cv=$("cover");cover(true,"Get ready…");cv.classList.remove("fly");void cv.offsetWidth;if(!RM())cv.classList.add("fly");
 phase="count";GAudio.phase("count",SCENE.id);const c=$("count3");let k=3;
 const step=()=>{if(k===0){c.classList.add("hidden");look();return;}c.classList.remove("hidden");c.textContent=k;c.classList.remove("pop");void c.offsetWidth;c.classList.add("pop");SFX.blip(3-k);buzz(10);k--;timers.push(setTimeout(step,700));};timers.push(setTimeout(step,wi>0||mode!=="core"?650:300));}
function lockWorld(done){if(mode==="practice")return;const d=S.days[today]||(S.days[today]={run:RUN,gen:"v7",w:[],done:false});const w={scene:SCENE.id,gen:"v7",found:[...found],entries,done};const cw=cleanWorld(w,true);cw.done=done;
 if(mode==="bonus")d.bonus=cw;else d.w[wi]=cw;d.done=d.w.length>=WORLDS&&d.w.every(x=>x.done);tally(d);save();}
function look(){phase="look";SFX.go();GAudio.phase("look",SCENE.id);lockWorld(false);cover(false);show("look");$("scene").innerHTML=sceneSVG(SCENE);$("scene").dataset.k=sceneKey(SCENE);$("scene").classList.remove("reveal");$("scene").classList.add("iso-look");const r=$("ring");r.classList.remove("hidden");const t0=performance.now(),L=lookMs();
 const loop=()=>{const p=Math.min(1,(performance.now()-t0)/L);$("ringp").style.strokeDashoffset=119.4*p;$("ringt").textContent=Math.ceil((1-p)*L/1000);if(p<1)timers.push(requestAnimationFrame(loop));else{r.classList.add("hidden");typing();}};loop();}
function typing(){phase="type";document.body.classList.add("typing");cover(true,"What did you see?");show("type");$("chips").innerHTML="";$("found-n").textContent="0 found";$("pts-live").textContent="0 pts";
 GAudio.phase("type",SCENE.id);const inp=$("inp");inp.value="";inp.focus({preventScroll:true});setTimeout(()=>window.scrollTo({top:0}),50);
 const T=typeMs(),base=mode==="bonus"?.12:mode==="core"?wi*.06:0;const t0=performance.now();let last=-1;const loop=()=>{const left=Math.max(0,T-(performance.now()-t0));const s=Math.ceil(left/1000),el=1-left/T;GAudio.setIntensity(Math.min(1,.2+base+.8*Math.pow(el,1.4)));GAudio.setDetune(left<=10000?60:left<=20000?25:0);$("tbar").style.width=(100*left/T)+"%";
  if(s!==last){last=s;$("t-left").textContent=s+"s";if(s===30||s===10||s===5)$("sr").textContent=s+" seconds left";if(s<=10)document.body.classList.add("hurry");if(s<=5&&s>0){SFX.tick();buzz(8);}}
  if(left<=0)return finish();timers.push(requestAnimationFrame(loop));};loop();}
function chip(t,c){const s=document.createElement("span");s.className="chip "+c;s.textContent=t;$("chips").prepend(s);while($("chips").children.length>14)$("chips").lastChild.remove();}
function submit(v){const rs=M.entry(v);const rec={t:v,r:[]};let hit=false;
 for(const r of rs){if(r.status==="match"){const it=SCENE.items[r.item];if(found.has(r.item)){chip("↺ "+it.label,"dup");SFX.dup();rec.r.push("dup");}else{found.add(r.item);hit=true;const t=tierIn(SCENE,r.item);chip(`${TIERS[t].e} ${it.label} +${TIERS[t].p}`,"ok t"+t);rec.r.push(r.item);SFX.find(t);buzz(t>=2?[15,40,15]:15);$("pts-live").textContent=fmtN(ptsFor(SCENE,[...found]))+" pts";}}
  else if(r.status==="vague"){chip(`"${v}": be more specific`,"vague");SFX.vague();rec.r.push("vague");}
  else if(r.status!=="empty"){chip("✗ "+v,"no");rec.r.push("none");SFX.no();}}
 entries.push(rec);$("found-n").textContent=found.size+" found";if(hit)lockWorld(false);}
function finish(){if(phase!=="type")return;clearT();phase="inter";document.body.classList.remove("typing","hurry");$("inp").blur();SFX.timeup();lockWorld(true);interstitial();}
// ---------- per-world reveal ----------
const sceneKey=sc=>sc.id+"|"+(sc.seed||"");
function paintReveal(sc,fs,instant){const el=$("scene");cover(false);if(el.dataset.k!==sceneKey(sc)||!el.firstChild){el.innerHTML=sceneSVG(sc);el.dataset.k=sceneKey(sc);}else el.querySelectorAll(".found,.missed").forEach(g=>{g.classList.remove("found","missed","spot");g.style.animationDelay="";});el.classList.remove("iso-look");el.classList.add("reveal");let fi=0;
 for(const id of Object.keys(sc.items)){const g=el.querySelector("#o-"+id);if(!g)continue;if(fs.has(id)){const k=fi++;g.classList.add("found");g.style.animationDelay=(instant?0:300+k*70)+"ms";if(!instant&&k<12)timers.push(setTimeout(()=>SFX.pop(k),300+k*70));}else g.classList.add("missed");}}
function countUp(el,to,cb){if(RM()){el.textContent=fmtN(to);cb&&timers.push(setTimeout(cb,50));return;}const t0=performance.now(),D=1200;let lt=0;const tick=()=>{const tn=performance.now(),k=Math.min(1,(tn-t0)/D),e=1-Math.pow(1-k,3);el.textContent=fmtN(Math.round(to*e));if(to&&tn-lt>85&&k<1){lt=tn;SFX.count();}if(k<1)timers.push(requestAnimationFrame(tick));else cb&&cb();};tick();}
function rarestOf(sc,fs){return [...fs].sort((a,b)=>tierIn(sc,b)-tierIn(sc,a)||(sc.items[a].label<sc.items[b].label?-1:1))[0];}
function listHTML(sc,fs){return Object.keys(sc.items).sort((a,b)=>(fs.has(b)-fs.has(a))||tierIn(sc,b)-tierIn(sc,a)).map(id=>{const f=fs.has(id),t=tierIn(sc,id);return `<button data-id="${id}" class="${f?"":"miss"}" aria-label="${esc(sc.items[id].label)}, ${TIERS[t].n}, ${f?"found":"missed"}. Show in picture"><span>${f?"✅":"▫️"} ${esc(sc.items[id].label)}</span><span class="pc">${TIERS[t].e} ${f?"+"+TIERS[t].p:TIERS[t].n}</span></button>`;}).join("");}
function interstitial(){phase="inter";show("inter");header();pips($("i-pips"));const sc=SCENE,fs=new Set(found),tot=Object.keys(sc.items).length,pts=ptsFor(sc,[...fs]);
 cover(true,"Time's up!");timers.push(requestAnimationFrame(()=>timers.push(setTimeout(()=>{if(phase==="inter")paintReveal(sc,fs,false);},0))));
 $("i-kick").textContent=(mode==="core"?`Scene ${wi+1}`:mode==="bonus"?"Bonus scene":"Practice")+` · ${sc.emoji} ${sc.title}`;
 $("i-num").textContent="0";countUp($("i-num"),pts,()=>{[0,1,2].forEach(i=>timers.push(setTimeout(()=>SFX.tile(i),110*i)));if([...fs].some(id=>tierIn(sc,id)>=2))timers.push(setTimeout(()=>SFX.fanfare(),450));});
 timers.push(setTimeout(()=>GAudio.phase("res",sc.id),120));
 $("i-sub").textContent=`${fs.size}/${tot} found · ${Math.round(100*fs.size/tot)}% of the scene`;
 const r=rarestOf(sc,fs);$("i-rarest").innerHTML=r?`<span class="muted small">Rarest find</span><b>${TIERS[tierIn(sc,r)].e} ${esc(sc.items[r].label)}</b><span class="pill">${TIERS[tierIn(sc,r)].n} · +${TIERS[tierIn(sc,r)].p}</span>`:`<span class="muted">No objects found this time. Keep going!</span>`;
 const last=mode!=="core"||wi>=WORLDS-1;$("btn-next").textContent=mode==="core"?(last?"See today's total →":`Next scene → (${wi+2} of ${WORLDS})`):"See result →";
 const d=DAY();$("i-run").textContent=mode==="core"&&d?`Running total: ${fmtN(d.pts)} pts`:mode==="bonus"?"Your bonus score is extra. It doesn't change your daily score.":"Practice: not saved.";
 if(mode==="core"&&wi<WORLDS-1)timers.push(setTimeout(()=>prefetch([RUN[wi+1]]),1600));else if(mode==="core"&&!(DAY()&&DAY().bonus))timers.push(setTimeout(()=>prefetch([BONUS]),2500));
 $("i-list").innerHTML="";timers.push(setTimeout(()=>{$("i-list").innerHTML=listHTML(sc,fs);},650));
 setTimeout(()=>$("btn-next").focus({preventScroll:true}),400);}
function next(){if(mode==="core"&&wi<WORLDS-1){wi++;startWorld();return;}if(mode==="practice"){home();return;}finalResults(false);}
// ---------- final results ----------
function tierTotals(d){const c=[0,0,0,0];for(const w of d.w){const sc=SC(w.scene);for(const id of w.found)c[tierIn(sc,id)]++;}return c;}
function finalResults(instant){clearT();const d=DAY();if(!d){home();return;}mode="core";phase="res";document.body.className="";screen("game");show("res");
 const W=d.w;viewW=Math.max(0,W.length-1);SCENE=SC(W[viewW].scene);header();$("dayno").textContent="#"+N;paintReveal(SCENE,new Set(W[viewW].found),true);
 const pts=d.pts,pct=Math.round(100*d.count/d.total);$("s-kick").textContent=d.legacy?"Today's score":"Today's total";
 $("s-num").textContent=instant?fmtN(pts):"0";if(!instant)countUp($("s-num"),pts,()=>{[0,1,2,3].forEach(i=>timers.push(setTimeout(()=>SFX.tile(i),120*i)));SFX.fanfare();});
 if(!instant)timers.push(setTimeout(()=>GAudio.phase("res",SCENE.id),120));
 $("s-sub").textContent=`${d.count}/${d.total} found · ${pct}% across ${W.length} scene${W.length>1?"s":""}`;
 const paint=()=>{const worlds=W.map((w,i)=>{const sc=SC(w.scene),r=rarestOf(sc,new Set(w.found));return `<button class="wrow${i===viewW?" sel":""}" data-w="${i}" aria-label="Show ${esc(sc.title)}"><span class="we">${sc.emoji}</span><span class="wt"><b>${esc(sc.title)}</b><small>${w.count}/${w.total} · ${Math.round(100*w.count/w.total)}%${r?" · "+TIERS[tierIn(sc,r)].e+" "+esc(sc.items[r].label):""}</small></span><b class="wp">${fmtN(w.pts)}</b></button>`;});
  if(d.bonus){const sc=SC(d.bonus.scene);worlds.push(`<button class="wrow bonus" data-w="b" aria-label="Show bonus scene"><span class="we">⭐</span><span class="wt"><b>Bonus: ${esc(sc.title)}</b><small>${d.bonus.count}/${d.bonus.total} · extra score</small></span><b class="wp">${fmtN(d.bonus.pts)}</b></button>`);}
  $("worlds").innerHTML=worlds.join("");
  const tc=tierTotals(d);$("tiers").innerHTML=TIERS.map((T,i)=>`<div class="tier t${i}"><span>${T.e}</span><b>${tc[i]}</b><small>${T.n}<br>+${T.p} each</small></div>`).reverse().join("");
  let best=null;for(const w of W){const sc=SC(w.scene),r=rarestOf(sc,new Set(w.found));if(r&&(!best||tierIn(sc,r)>best.t))best={t:tierIn(sc,r),l:sc.items[r].label};}
  $("rarest").innerHTML=best?`<span class="muted small">Rarest find today</span><b>${TIERS[best.t].e} ${esc(best.l)}</b><span class="pill">${TIERS[best.t].n} · +${TIERS[best.t].p}</span>`:`<span class="muted">No finds today. Tomorrow's a new set!</span>`;
  const chv=S.challenges[today];$("chal-res").classList.toggle("hidden",!chv);
  if(chv){const ch=chv.c,who=chv.n?esc(chv.n)+"'s":"your friend's";$("chal-res").innerHTML=pts>ch?`🏆 You beat ${who} <b>${fmtN(ch)}</b> by ${fmtN(pts-ch)}!`:pts===ch?`🤝 Dead heat with ${who} <b>${fmtN(ch)}</b>!`:`😅 ${fmtN(ch-pts)} short of ${who} <b>${fmtN(ch)}</b>. Send it to someone else?`;}
  $("s-line").textContent=`🔥 ${streak()} day streak`;$("share").textContent=shareText();$("btn-bonus2").classList.toggle("hidden",!!(d.bonus||d.legacy));};
 if(instant)paint();else timers.push(setTimeout(paint,90));
 const rest=()=>{showList();$("nm").value=S.settings.name;};if(instant)rest();else{$("list").innerHTML="";timers.push(setTimeout(rest,650));}
 countdown();}
function showList(){const d=DAY();const w=viewW==="b"?d.bonus:d.w[viewW];const sc=SC(w.scene),fs=new Set(w.found);$("list").innerHTML=listHTML(sc,fs);
 const misses=[];const m=GMatch.build(sc);for(const e of w.entries||[]){if(e.r&&e.r.length===1&&e.r[0]==="none"){const s=m.suggest(e.t);if(s&&!fs.has(s))misses.push([e.t,s]);}}
 $("review").innerHTML=misses.length?`<h3>So close (${esc(sc.title)})</h3>`+misses.slice(0,5).map(([t,s])=>`<div class="rv">You typed “${esc(t)}”. Did you mean <b>${esc(sc.items[s].label)}</b>?</div>`).join(""):"";}
function viewWorld(k){const d=DAY();viewW=k==="b"?"b":+k;const w=viewW==="b"?d.bonus:d.w[viewW];if(!w)return;SCENE=SC(w.scene);setAR(SCENE);paintReveal(SCENE,new Set(w.found),true);document.querySelectorAll("#worlds .wrow").forEach(b=>b.classList.toggle("sel",b.dataset.w===String(k)));showList();if(innerWidth<900)$("scene").scrollIntoView({behavior:RM()?"auto":"smooth",block:"start"});}
function shareText(){const d=DAY();if(!d)return "";const pct=Math.round(100*d.count/d.total),st=streak();const nm=cleanName(S.settings.name);
 const link=`${URL_PUBLIC}?c=${d.pts}&d=${N}&u=${S.settings.uid}${nm?"&n="+encodeURIComponent(nm):""}`;
 const per=d.w.map(w=>`${SC(w.scene).emoji}${fmtN(w.pts)}`).join(" ");const tc=tierTotals(d);const bits=[tc[3]?`💎${tc[3]}`:"",tc[2]?`✨${tc[2]}`:""].filter(Boolean).join(" ");
 return `Glimpse #${N} 👁️ ${fmtN(d.pts)} pts · ${d.count}/${d.total} (${pct}%)\n${per}${bits?" · "+bits:""}${st>1?` · 🔥${st}`:""}${d.bonus?` · ⭐${fmtN(d.bonus.pts)}`:""}\nCan you beat me? ${link}`;}
function streak(){let n=0,t=Date.parse(today+"T00:00:00Z");if(!(S.days[today]&&S.days[today].done))t-=864e5;while(true){const d=S.days[new Date(t).toISOString().slice(0,10)];if(!d||!d.done)break;n++;t-=864e5;}return n;}
function statsData(){const ks=Object.keys(S.days).filter(k=>S.days[k].done).sort(),ds=ks.map(k=>S.days[k]),core=ds.filter(d=>!d.legacy),played=ds.length;
 let bs=0,run=0,prev=null;for(const k of ks){const t=Date.parse(k+"T00:00:00Z");run=(prev&&t-prev===864e5)?run+1:1;bs=Math.max(bs,run);prev=t;}
 return {ks,ds,played,streak:streak(),bestStreak:bs,best:core.length?Math.max(...core.map(d=>d.pts)):0,avg:core.length?Math.round(core.reduce((a,d)=>a+d.pts,0)/core.length):0,pct:played?Math.round(ds.reduce((a,d)=>a+d.count/d.total,0)/played*100):0,legacy:ds.length-core.length};}
function stats(){const s=statsData();$("stats").innerHTML=`<div class="grid"><div><b>${s.played}</b>played</div><div><b>${s.streak}</b>streak</div><div><b>${s.bestStreak}</b>best streak</div><div><b>${s.pct}%</b>avg found</div></div><div class="grid g2"><div><b>${fmtN(s.best)}</b>best total</div><div><b>${fmtN(s.avg)}</b>average total</div></div>`+(s.legacy?`<p class="muted small">${s.legacy} older single-picture day${s.legacy>1?"s":""} count toward streaks but not totals.</p>`:"")+(s.played?`<p class="muted small">Recent: ${s.ks.slice(-7).map(k=>`#${dayNum(k)} ${fmtN(S.days[k].pts)}`).join(" · ")}</p>`:`<p class="muted">Play today's Glimpse to start a streak.</p>`);$("d-stats").showModal();}
function countdown(){const el=$("cd");const f=()=>{el.textContent=hms(msToSydMidnight());if(!Q.get("date")&&sydDate()!==today){el.innerHTML='<button class="primary" id="btn-new" style="width:auto;padding:8px 14px;font-size:16px">New Glimpse ready →</button>';$("btn-new").onclick=()=>location.reload();clearT();}};f();timers.push(setInterval(f,1000));}
async function share(){const t=$("share").textContent;try{if(navigator.share&&matchMedia("(pointer:coarse)").matches){await navigator.share({text:t});return;}}catch(e){if(e&&e.name==="AbortError")return;}copy(t);}
async function copy(t){try{await navigator.clipboard.writeText(t);toast("Copied! Paste it anywhere.");}catch{const r=document.createRange();r.selectNodeContents($("share"));const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Selected: press copy");}}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),1800);}
// ---------- wiring ----------
$("btn-play").onclick=()=>{SFX.click();play();};$("btn-bonus").onclick=$("btn-bonus2").onclick=()=>{SFX.click();playBonus();};
$("btn-done").onclick=finish;$("btn-next").onclick=()=>{SFX.click();next();};$("btn-home").onclick=home;
const goHome=()=>{if(phase==="look"||phase==="type"||phase==="count"){if(!confirm("Leave this scene? It keeps what you found so far, and you can't replay it."))return;if(mode!=="practice"){lockWorld(true);}}home();};
$("brand").onclick=goHome;$("brand").onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();goHome();}};
$("btn-help").onclick=()=>$("d-help").showModal();$("btn-stats").onclick=stats;
$("btn-share").onclick=()=>{SFX.click();share();};
$("nm").addEventListener("input",()=>{S.settings.name=cleanName($("nm").value);save();$("share").textContent=shareText();});$("btn-copy").onclick=()=>copy($("share").textContent);
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
$("d-help").addEventListener("close",()=>{S.settings.seenHelp=true;save();});
const snd=()=>{const m=S.settings.music,f=S.settings.sfx;$("btn-music").textContent="🎵";$("btn-music").classList.toggle("off",!m);$("btn-music").setAttribute("aria-pressed",m);$("btn-music").setAttribute("aria-label","Music and ambience "+(m?"on":"off"));
 $("btn-sound").textContent=f?"🔔":"🔕";$("btn-sound").classList.toggle("off",!f);$("btn-sound").setAttribute("aria-pressed",f);$("btn-sound").setAttribute("aria-label","Sound effects "+(f?"on":"off"));GAudio.setPrefs({music:m,sfx:f});};
$("btn-music").onclick=()=>{GAudio.unlock();S.settings.music=!S.settings.music;save();snd();if(S.settings.music)GAudio.phase(phase==="type"?"type":phase==="look"?"look":"home",SCENE.id);};
$("btn-sound").onclick=()=>{GAudio.unlock();S.settings.sfx=!S.settings.sfx;save();snd();SFX.click();};snd();
$("f").addEventListener("submit",e=>{e.preventDefault();const i=$("inp"),v=i.value.trim();if(v&&phase==="type"){submit(v.slice(0,60));i.value="";}i.focus({preventScroll:true});});
const spot=e=>{const b=e.target.closest("button[data-id]");if(!b)return;const p=b.parentElement;p.querySelectorAll(".sel").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");const g=$("scene").querySelector("#o-"+b.dataset.id);if(g){g.classList.remove("spot");void g.getBoundingClientRect();g.classList.add("spot");if(innerWidth<900)$("scene").scrollIntoView({behavior:RM()?"auto":"smooth",block:"start"});}};
$("list").addEventListener("click",spot);$("i-list").addEventListener("click",spot);
$("worlds").addEventListener("click",e=>{const b=e.target.closest("button[data-w]");if(b)viewWorld(b.dataset.w);});
$("h-prac").addEventListener("click",e=>{const b=e.target.closest("button[data-sc]");if(b){SFX.click();practiceScene(+b.dataset.sc);}});
if(window.visualViewport)visualViewport.addEventListener("resize",()=>{if(phase==="type"&&document.activeElement===$("inp"))$("p-type").scrollIntoView({block:"start"});});
window.__glimpse={finish,submit,next,play,home,state:()=>({phase,mode,wi,found:[...found],scene:SCENE.id,N,today,run:RUN,bonus:BONUS,day:DAY()||null})};
document.addEventListener("pointerdown",()=>{if(!GAudio.running()){GAudio.unlock();GAudio.setPrefs({music:S.settings.music,sfx:S.settings.sfx});if(phase==="home"||phase==="res"||phase==="inter")GAudio.phase(phase==="inter"?"res":phase,SCENE.id);}},{passive:true});
home();if(!S.settings.seenHelp&&!DAY())$("d-help").showModal();
if(SELF)setTimeout(()=>toast("That's your own challenge link 🙂 Send it to a friend!"),400);
})();
