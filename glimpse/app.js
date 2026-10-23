(()=>{"use strict";
const $=id=>document.getElementById(id), Q=new URLSearchParams(location.search);
const URL_PUBLIC="https://optimusslimes.github.io/floppr/glimpse/";
const LOOKQ=+Q.get("look")||0, TYPEQ=+Q.get("type")||0;  // test overrides only (ms)
const EPOCH="2026-10-21", KEY=/\/beta\//.test(location.pathname)?"glimpse:beta":"glimpse:v2", PREVIEW_KEY="glimpse:pv2", WORLDS=3;
const BETA=/\/beta\//.test(location.pathname);
const API="https://glimpse-scores.glimpsegame.workers.dev", GS=window.GlimpseScores;
const NOSUBMIT=!GS||Q.has("date")||((LOOKQ||TYPEQ)&&!BETA); // test overrides never write live data
try{GS&&GS.init({api:Q.get("noapi")?null:API,ns:BETA?"beta":null});}catch(e){}
let STATS=null,STATS_T=0;
function loadStats(force){if(!GS)return Promise.resolve(null);if(!force&&STATS&&Date.now()-STATS_T<60000)return Promise.resolve(STATS);
 return GS.stats(today).then(s=>{if(s){STATS=s;STATS_T=Date.now();}return s||STATS;}).catch(()=>STATS);}
function submitScore(sceneId,found,score){if(NOSUBMIT)return Promise.resolve(null);try{return GS.submit({day:today,sceneId,found,score}).catch(()=>null);}catch(e){return Promise.resolve(null);}}
function syncScores(){const d=S.days[today];if(!d||d.legacy||NOSUBMIT)return;const sent=S.sent&&S.sent.day===today?S.sent:(S.sent={day:today,ids:[]});const jobs=[];
 const add=(id,found,pts)=>{if(sent.ids.includes(id))return;sent.ids.push(id);jobs.push(()=>submitScore(id,found,pts));};
 d.w.forEach(w=>{if(w&&w.done){const sc=SC(w.scene);if(sc)add(sc.id,w.found,ptsFor(sc,w.found));}});
 if(d.bonus&&d.bonus.done){const sc=SC(d.bonus.scene);if(sc)add("bonus."+sc.id,d.bonus.found,ptsFor(sc,d.bonus.found));}
 if(d.done)add("total",[],d.pts);if(!jobs.length)return;save();
 jobs.reduce((p,j)=>p.then(j),Promise.resolve()).then(()=>loadStats(true)).then(()=>{if(phase==="inter")interPct();else if(phase==="res")curve();});}
const sid=(mode,sc)=>mode==="bonus"?"bonus."+sc.id:sc.id;
// Real rarity: only shown when 30+ players have played that scene today. Points always use the estimated tier so scores stay comparable all day.
function realR(sc,id,m){const r=GS&&STATS?GS.rarity(STATS,sid(m||"core",sc),id,null):null;if(!r||r.source!=="players")return null;return {t:TIERS.findIndex(T=>T.n===r.tier),share:r.share};}
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
 if(mode==="bonus")d.bonus=cw;else d.w[wi]=cw;const wasDone=d.done;d.done=d.w.length>=WORLDS&&d.w.every(x=>x.done);tally(d);save();
 if(done)syncScores();}
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
 for(const id of Object.keys(sc.items)){const g=el.querySelector("#o-"+id);if(!g)continue;if(fs.has(id)){const k=fi++;g.classList.add("found");g.style.animationDelay=(instant?0:300+k*70)+"ms";if(!instant&&k<12)timers.push(setTimeout(()=>SFX.pop(k),300+k*70));}else g.classList.add("missed");}
 marks(sc,fs,instant);}
// ---------- "you missed these" markers ----------
function marks(sc,fs,instant){const el=$("scene");let m=$("marks");if(m)m.remove();const svg=el.querySelector("svg");if(!svg)return;const [W,H]=sc.vb;
 m=document.createElement("div");m.id="marks";m.className="marks"+(instant?" now":"");const miss=Object.keys(sc.items).filter(id=>!fs.has(id));
 const pts=[];for(const id of Object.keys(sc.items)){const g=svg.querySelector("#o-"+id);if(!g)continue;let b;try{b=g.getBBox();}catch(e){continue;}if(!b.width)continue;
  let x=(b.x+b.width/2)/W*100,y=(b.y+b.height*.4)/H*100;for(const p of pts){if(Math.abs(p[0]-x)<4.5&&Math.abs(p[1]-y)<4){y+=4;}}pts.push([x,y]);
  const f=fs.has(id),R=realR(sc,id,sc===SCENE?mode:"core"),t=R?R.t:tierIn(sc,id);const k=document.createElement("button");k.type="button";k.className="mk "+(f?"mf":"mm");k.dataset.id=id;k.style.left=x+"%";k.style.top=y+"%";
  k.innerHTML=`<i>${f?"✓":"?"}</i><span class="tip">${esc(sc.items[id].label)}<em> · ${TIERS[t].e} ${TIERS[t].n}</em></span>`;k.setAttribute("aria-label",`${sc.items[id].label}, ${TIERS[t].n}${R?"":" (estimated)"}, ${f?"found":"missed"}`);
  if(!instant)k.style.animationDelay=(700+pts.length*25)+"ms";m.appendChild(k);}
 const bar=document.createElement("div");bar.className="mbar";bar.innerHTML=`<button type="button" class="mb-names" aria-pressed="false">Show missed names (${miss.length})</button><button type="button" class="mb-hide">Hide marks</button>`;m.appendChild(bar);
 el.appendChild(m);}
// "Show missed names": each label sits above its ?; if it collides it flips below; if that collides too, only the ? shows until tapped.
function layoutNames(m){const box=m.getBoundingClientRect(),placed=[],hit=(r)=>r.left<box.left-2||r.right>box.right+2||r.top<box.top-2||r.bottom>box.bottom+2||placed.some(p=>r.left<p.right+2&&r.right>p.left-2&&r.top<p.bottom+1&&r.bottom>p.top-1);
 const ks=[...m.querySelectorAll(".mk")];ks.forEach(k=>{k.classList.remove("below","nolab");const i=k.querySelector("i").getBoundingClientRect();placed.push(i);});
 for(const k of ks.filter(k=>k.classList.contains("mm"))){const tip=k.querySelector(".tip");let r=tip.getBoundingClientRect();if(!hit(r)){placed.push(r);continue;}
  k.classList.add("below");r=tip.getBoundingClientRect();if(!hit(r)){placed.push(r);continue;}k.classList.remove("below");k.classList.add("nolab");}}
addEventListener("resize",()=>{const m=$("marks");if(m&&m.classList.contains("names"))layoutNames(m);});
function markTap(e){const m=$("marks");if(!m)return;const k=e.target.closest(".mk");if(k){e.stopPropagation();const on=!k.classList.contains("open");m.querySelectorAll(".mk.open").forEach(x=>x.classList.remove("open"));k.classList.toggle("open",on);
  if(on){const g=$("scene").querySelector("#o-"+k.dataset.id);if(g){g.classList.remove("spot");void g.getBoundingClientRect();g.classList.add("spot");}}return;}
 if(e.target.closest(".mb-names")){const b=e.target.closest(".mb-names"),on=!m.classList.contains("names");m.classList.toggle("names",on);if(on)layoutNames(m);b.setAttribute("aria-pressed",on);b.textContent=on?"Hide names":`Show missed names (${m.querySelectorAll(".mm").length})`;return;}
 if(e.target.closest(".mb-hide")){const on=!m.classList.contains("off");m.classList.toggle("off",on);e.target.textContent=on?"Show marks":"Hide marks";return;}}
function countUp(el,to,cb){if(RM()){el.textContent=fmtN(to);cb&&timers.push(setTimeout(cb,50));return;}const t0=performance.now(),D=1200;let lt=0;const tick=()=>{const tn=performance.now(),k=Math.min(1,(tn-t0)/D),e=1-Math.pow(1-k,3);el.textContent=fmtN(Math.round(to*e));if(to&&tn-lt>85&&k<1){lt=tn;SFX.count();}if(k<1)timers.push(requestAnimationFrame(tick));else cb&&cb();};tick();}
function rarestOf(sc,fs){return [...fs].sort((a,b)=>tierIn(sc,b)-tierIn(sc,a)||(sc.items[a].label<sc.items[b].label?-1:1))[0];}
function listHTML(sc,fs){const ids=Object.keys(sc.items),mi=ids.filter(i=>!fs.has(i)),fo=ids.filter(i=>fs.has(i));const by=(a,b)=>tierIn(sc,b)-tierIn(sc,a);
 return (mi.length?`<h4 class="lh">You missed these (${mi.length})</h4>`+rowsHTML(sc,fs,mi.sort(by)):"")+(fo.length?`<h4 class="lh">You found (${fo.length})</h4>`+rowsHTML(sc,fs,fo.sort(by)):"");}
function rowsHTML(sc,fs,ids){const m=sc===SCENE?mode:"core";return ids.map(id=>{const f=fs.has(id),t=tierIn(sc,id),R=realR(sc,id,m),dt=R?R.t:t,lab=R?`${TIERS[dt].e} ${TIERS[dt].n} · ${Math.round(R.share*100)}% found it`:`${TIERS[t].e} ${TIERS[t].n} (est.)`;return `<button data-id="${id}" class="${f?"":"miss"}" aria-label="${esc(sc.items[id].label)}, ${R?TIERS[dt].n+", "+Math.round(R.share*100)+" percent of players found it":TIERS[t].n+" (estimated)"}, ${f?"found":"missed"}. Show in picture"><span>${f?"✅":"❓"} ${esc(sc.items[id].label)}</span><span class="pc">${lab}${f?" +"+TIERS[t].p:""}</span></button>`;}).join("");}
function interstitial(){phase="inter";show("inter");header();pips($("i-pips"));const sc=SCENE,fs=new Set(found),tot=Object.keys(sc.items).length,pts=ptsFor(sc,[...fs]);
 cover(true,"Time's up!");timers.push(requestAnimationFrame(()=>timers.push(setTimeout(()=>{if(phase==="inter")paintReveal(sc,fs,false);},0))));
 $("i-kick").textContent=(mode==="core"?`Scene ${wi+1}`:mode==="bonus"?"Bonus scene":"Practice")+` · ${sc.emoji} ${sc.title}`;
 $("i-num").textContent="0";countUp($("i-num"),pts,()=>{[0,1,2].forEach(i=>timers.push(setTimeout(()=>SFX.tile(i),110*i)));if([...fs].some(id=>tierIn(sc,id)>=2))timers.push(setTimeout(()=>SFX.fanfare(),450));});
 timers.push(setTimeout(()=>GAudio.phase("res",sc.id),120));
 $("i-sub").textContent=`${fs.size}/${tot} found · ${Math.round(100*fs.size/tot)}% of the scene`;
 const r=rarestOf(sc,fs);$("i-rarest").innerHTML=r?`<span class="muted small">Rarest find</span><b>${TIERS[tierIn(sc,r)].e} ${esc(sc.items[r].label)}</b><span class="pill">${TIERS[tierIn(sc,r)].n} · +${TIERS[tierIn(sc,r)].p}</span>`:`<span class="muted">No objects found this time. Keep going!</span>`;
 const last=mode!=="core"||wi>=WORLDS-1;$("btn-next").textContent=mode==="core"?(last?"See today's total →":`Next scene → (${wi+2} of ${WORLDS})`):"See result →";$("btn-skip").textContent=last?"Skip →":"Skip to next →";
 const d=DAY();$("i-run").textContent=mode==="core"&&d?`Running total: ${fmtN(d.pts)} pts`:mode==="bonus"?"Your bonus score is extra. It doesn't change your daily score.":"Practice: not saved.";
 if(mode==="core"&&wi<WORLDS-1)timers.push(setTimeout(()=>prefetch([RUN[wi+1]]),1600));else if(mode==="core"&&!(DAY()&&DAY().bonus))timers.push(setTimeout(()=>prefetch([BONUS]),2500));
 $("i-pct").classList.add("hidden");loadStats().then(()=>{if(phase==="inter"&&SCENE===sc)interPct();});
 $("i-list").innerHTML="";timers.push(setTimeout(()=>{$("i-list").innerHTML=listHTML(sc,fs);},650));
 setTimeout(()=>$("btn-next").focus({preventScroll:true}),400);}
function interPct(){const sc=SCENE,el=$("i-pct");const d=DAY(),w=mode==="bonus"?d&&d.bonus:d&&d.w[wi];const p=GS&&STATS&&w?GS.percentile(STATS,sid(mode,sc),ptsFor(sc,w.found)):null;
 if(p===null){el.classList.add("hidden");return;}const n=STATS.scenes[sid(mode,sc)].players;el.innerHTML=`📊 You beat <b>${p}%</b> of players on this scene <span class="muted small">(${fmtN(n)} played)</span>`;el.classList.remove("hidden");
 if($("i-list").firstChild)$("i-list").innerHTML=listHTML(sc,new Set(w.found));}
function next(){if(phase!=="inter")return;if(mode==="core"&&wi<WORLDS-1){wi++;startWorld();return;}if(mode==="practice"){home();return;}finalResults(false);}
// ---------- final results ----------
function curve(){const el=$("curve"),d=DAY();const h=GS&&STATS&&d&&!d.legacy?GS.curve(STATS,"total"):null;if(!h||!d.done){el.classList.add("hidden");return;}
 const p=GS.percentile(STATS,"total",d.pts),n=STATS.scenes.total.players,bs=h.binSize;
 const bins=new Map(h.bins.map(b=>[b.from,b.count]));const lo=0,hi=Math.max(d.pts+bs,...h.bins.map(b=>b.from+bs));const nb=Math.max(1,Math.ceil((hi-lo)/bs));
 // light smoothing so a small crowd still reads as a curve
 const g=Math.max(1,Math.ceil(nb/16)),nb2=Math.ceil(nb/g),raw=[...Array(nb2)].map((_,i)=>{let s=0;for(let j=0;j<g;j++)s+=bins.get(lo+(i*g+j)*bs)||0;return s;}),k=1,sm=raw.map((_,i)=>{let s=0,w=0;for(let j=-k;j<=k;j++){const v=raw[i+j];if(v!==undefined){const ww=k+1-Math.abs(j);s+=v*ww;w+=ww;}}return s/w;});
 const W=320,H=96,mx=Math.max(...sm)||1,X=v=>(v-lo)/(hi-lo)*W,Y=c=>H-6-c/mx*(H-16);
 const pts=sm.map((c,i)=>[X(lo+(i+.5)*bs*g),Y(c)]);let path=`M0 ${H-6} L${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;for(let i=1;i<pts.length;i++){const a0=pts[i-1],b0=pts[i];path+=` Q${a0[0].toFixed(1)} ${a0[1].toFixed(1)} ${((a0[0]+b0[0])/2).toFixed(1)} ${((a0[1]+b0[1])/2).toFixed(1)}`;}const L=pts[pts.length-1];path+=` T${L[0].toFixed(1)} ${L[1].toFixed(1)} L${W} ${H-6}`;
 const ux=Math.min(W-2,Math.max(2,X(d.pts)));
 el.innerHTML=`<div class="cv-top"><b>You beat ${p}% of players today</b><span class="muted small">${fmtN(n)} played</span></div>
 <svg viewBox="0 0 ${W} ${H+14}" role="img" aria-label="Score spread for today. You beat ${p} percent of ${n} players."><defs><clipPath id="cvl"><rect x="0" y="0" width="${ux}" height="${H}"/></clipPath></defs>
 <path d="${path} Z" class="cv-all"/><path d="${path} Z" class="cv-me" clip-path="url(#cvl)"/><line x1="${ux}" x2="${ux}" y1="4" y2="${H-6}" class="cv-line"/><circle cx="${ux}" cy="6" r="4" class="cv-dot"/>
 <text x="${Math.min(W-30,Math.max(30,ux))}" y="${H+10}" text-anchor="middle" class="cv-t">You: ${fmtN(d.pts)}</text><text x="0" y="${H+10}" class="cv-t cv-a">0</text><text x="${W}" y="${H+10}" text-anchor="end" class="cv-t cv-a">${fmtN(hi)}</text></svg>`;
 el.classList.remove("hidden");}
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
$("curve").classList.add("hidden");loadStats().then(()=>{if(phase==="res")curve();});
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
// ---------- share card (built on the device) ----------
function svgImg(sc){return new Promise((ok,no)=>{const s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sc.vb[0]} ${sc.vb[1]}" width="${sc.vb[0]*2}" height="${sc.vb[1]*2}">${GART.svgOf(sc)}</svg>`;const u=URL.createObjectURL(new Blob([s],{type:"image/svg+xml"}));const i=new Image();i.onload=()=>{URL.revokeObjectURL(u);ok(i);};i.onerror=e=>{URL.revokeObjectURL(u);no(e);};i.src=u;});}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function slab(c,x,y,w,h,r,fill,edge){c.fillStyle="#6b5a8a22";rr(c,x+10,y+22,w,h,r);c.fill();c.fillStyle=edge;rr(c,x,y+12,w,h,r);c.fill();c.fillStyle=fill;rr(c,x,y,w,h,r);c.fill();}
async function cardBlob(){const d=DAY();if(!d)return null;const W=1080,H=1350,cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");
 const F=(s,w=800)=>`${w} ${s}px ui-rounded,"SF Pro Rounded","Nunito","Segoe UI",system-ui,sans-serif`;
 const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,"#fde8f1");g.addColorStop(.55,"#e9e4fb");g.addColorStop(1,"#d9f0ec");c.fillStyle=g;c.fillRect(0,0,W,H);
 c.fillStyle="#ffffff55";for(let i=0;i<26;i++){const x=(i*397)%W,y=(i*613)%H;c.beginPath();c.arc(x,y,6+(i%5)*5,0,7);c.fill();}
 c.textAlign="center";c.fillStyle="#2f2650";c.font=F(76,900);c.fillText("👁️ Glimpse",W/2,130);c.font=F(40,700);c.fillStyle="#6b5f8f";c.fillText(`Daily #${N}`,W/2,190);
 slab(c,90,240,900,330,48,"#ffffff","#e3d6ea");const pct=Math.round(100*d.count/d.total),st=streak();
 c.fillStyle="#2f2650";c.font=F(150,900);c.fillText(fmtN(d.pts),W/2,420);c.font=F(40,800);c.fillStyle="#8a6d00";c.fillText("points",W/2,475);
 c.font=F(38,700);c.fillStyle="#4b4270";c.fillText(`${d.count}/${d.total} found · ${pct}%${st?` · 🔥 ${st} day streak`:""}`,W/2,540);
 const tw=270,tg=45,tx0=(W-(tw*3+tg*2))/2,ty=640;const ws=d.w.slice(0,3);
 for(let i=0;i<ws.length;i++){const w=ws[i],sc=SC(w.scene),x=tx0+i*(tw+tg),th=Math.round(tw*sc.vb[1]/sc.vb[0]);slab(c,x-12,ty-12,tw+24,th+120,34,"#ffffff","#e3d6ea");
  try{const im=await svgImg(sc);c.save();rr(c,x,ty,tw,th,24);c.clip();c.drawImage(im,x,ty,tw,th);c.restore();}catch(e){c.fillStyle="#efe8f7";rr(c,x,ty,tw,th,24);c.fill();c.font=F(90);c.fillStyle="#2f2650";c.fillText(sc.emoji,x+tw/2,ty+th/2+30);}
  c.fillStyle="#2f2650";c.font=F(32,800);c.fillText(`${sc.emoji} ${fmtN(w.pts)}`,x+tw/2,ty+th+50);c.font=F(26,700);c.fillStyle="#6b5f8f";c.fillText(`${w.count}/${w.total} found`,x+tw/2,ty+th+88);}
 c.font=F(40,800);c.fillStyle="#2f2650";c.fillText("Can you beat me?",W/2,H-150);c.font=F(32,700);c.fillStyle="#6b5f8f";c.fillText(URL_PUBLIC.replace(/^https:\/\//,""),W/2,H-95);
 return await new Promise(ok=>cv.toBlob(ok,"image/png"));}
async function shareCard(){let b;try{b=await cardBlob();}catch(e){b=null;}const t=$("share").textContent;if(!b){copy(t);return;}
 const f=new File([b],`glimpse-${N}.png`,{type:"image/png"});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:t});return;}}catch(e){if(e&&e.name==="AbortError")return;}
 const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
 try{await navigator.clipboard.writeText(t);toast("Image saved. Text copied too.");}catch{toast("Image saved.");}}
window.__card=cardBlob;
// ---------- wiring ----------
$("btn-play").onclick=()=>{SFX.click();play();};$("btn-bonus").onclick=$("btn-bonus2").onclick=()=>{SFX.click();playBonus();};
$("btn-done").onclick=finish;$("btn-next").onclick=()=>{SFX.click();next();};$("btn-home").onclick=home;
const goHome=()=>{if(phase==="look"||phase==="type"||phase==="count"){if(!confirm("Leave this scene? It keeps what you found so far, and you can't replay it."))return;if(mode!=="practice"){lockWorld(true);}}home();};
$("brand").onclick=goHome;$("brand").onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();goHome();}};
$("btn-help").onclick=()=>$("d-help").showModal();$("btn-stats").onclick=stats;
$("btn-share").onclick=()=>{SFX.click();share();};$("btn-card").onclick=()=>{SFX.click();shareCard();};$("btn-skip").onclick=()=>{SFX.click();next();};
$("scene").addEventListener("click",markTap);
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
syncScores();
// came back to an old tab after Sydney midnight: reload into the new day unless mid-scene
const stale=()=>{if(!Q.get("date")&&sydDate()!==today&&!["count","look","type"].includes(phase))location.reload();};
document.addEventListener("visibilitychange",()=>{if(!document.hidden)stale();});addEventListener("focus",stale);
if(SELF)setTimeout(()=>toast("That's your own challenge link 🙂 Send it to a friend!"),400);
})();
