(()=>{"use strict";
const $=id=>document.getElementById(id), Q=new URLSearchParams(location.search);
const URL_PUBLIC="https://optimusslimes.github.io/floppr/glimpse/";
const LOOK=+Q.get("look")||10000, TYPE=+Q.get("type")||60000;  // overrides only via query (ms)
const EPOCH="2026-10-21", KEY="glimpse:v2";
// ---------- dates (Australia/Sydney) ----------
const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:"Australia/Sydney",year:"numeric",month:"2-digit",day:"2-digit"});
function sydDate(d=new Date()){return Q.get("date")||fmt.format(d);}
function dayNum(ds){return Math.round((Date.parse(ds+"T00:00:00Z")-Date.parse(EPOCH+"T00:00:00Z"))/864e5)+1;}
function msToSydMidnight(){const now=new Date();const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Australia/Sydney",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(now).map(x=>[x.type,x.value]));
 return ((23-+p.hour)*3600+(59-+p.minute)*60+(60-+p.second))*1000;}
const ORDER=[0,1,2,3,4,5];
function sceneFor(n){const i=((n-1)%SCENES.length+SCENES.length)%SCENES.length;return SCENES[ORDER[i]];}
// ---------- storage (corruption-safe) ----------
function fresh(){return {v:2,days:{},settings:{sound:false,seenHelp:false}};}
let S;try{S=JSON.parse(localStorage.getItem(KEY)||"null");if(!S||typeof S!=="object"||S.v!==2||!S.days||typeof S.days!=="object"||Array.isArray(S.days)||!S.settings||typeof S.settings!=="object")throw 0;}catch(e){try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(KEY+":corrupt",raw);}catch{}S=fresh();}
for(const [k,d] of Object.entries(S.days)){if(!/^\d{4}-\d\d-\d\d$/.test(k)||!d||!Array.isArray(d.found)||!(d.total>0))delete S.days[k];}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch{}};
// ---------- example rarity (deterministic placeholder, NOT real data) ----------
function h(s){let x=2166136261;for(const c of s)x=Math.imul(x^c.charCodeAt(0),16777619);return (x>>>0);}
const exPct=(scene,id)=>12+h(scene.id+":"+id)%84;  // 12..95 "% of players found" EXAMPLE ONLY
// ---------- audio (procedural, off by default) ----------
let AC=null;function tone(f,d=.12,type="sine",v=.12,when=0){if(!S.settings.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d);}catch{}}
const SFX={find:()=>{tone(660,.1,"triangle");tone(990,.14,"triangle",.1,.07);},rare:()=>[784,988,1318].forEach((f,i)=>tone(f,.18,"triangle",.1,i*.07)),no:()=>tone(160,.12,"square",.05),tick:()=>tone(1200,.04,"square",.04),beep:()=>tone(520,.12,"sine",.12),go:()=>tone(880,.25,"sine",.14),end:()=>[523,659,784,1046].forEach((f,i)=>tone(f,.22,"triangle",.1,i*.09))};
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms);}catch{}};
// ---------- state ----------
const today=sydDate(), N=dayNum(today); let SCENE=sceneFor(N), M=GMatch.build(SCENE), practice=false;
let found=new Set(), entries=[], phase="home", timers=[];
const clearT=()=>{timers.forEach(t=>{clearTimeout(t);clearInterval(t);cancelAnimationFrame(t);});timers=[];};
function show(p){["home","type","res"].forEach(x=>$("p-"+x).classList.toggle("hidden",x!==p));}
function sceneSVG(){return `<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${SCENE.title} scene">${SCENE.svg}</svg>`;}
function header(){$("dayno").textContent=practice?"practice":"#"+N;$("home-scene").textContent=`${SCENE.emoji} Today: ${SCENE.title} · ${Object.keys(SCENE.items).length} things hidden`;}
function cover(on,sub){$("scene").classList.toggle("hidden",on);$("cover").classList.toggle("hidden",!on);if(sub)$("cover-sub").textContent=sub;}
// ---------- flow ----------
function home(){phase="home";document.body.className="";header();cover(true,"Ready when you are");show("home");
 const rec=S.days[today];$("home-note").textContent=rec?"":"Tip: turn sound on with 🔇 if you like.";
 if(rec&&!practice){found=new Set(rec.found);entries=rec.entries||[];results(true);}}
function start(){if(phase!=="home")return;phase="count";show("home");$("btn-start").disabled=true;const c=$("count3");cover(true,"Get ready…");c.classList.remove("hidden");let k=3;
 const step=()=>{if(k===0){c.classList.add("hidden");look();return;}c.textContent=k;c.classList.remove("pop");void c.offsetWidth;c.classList.add("pop");SFX.beep();buzz(10);k--;timers.push(setTimeout(step,700));};step();}
function look(){phase="look";SFX.go();cover(false);$("scene").innerHTML=sceneSVG();$("scene").classList.remove("reveal");const r=$("ring");r.classList.remove("hidden");const t0=performance.now();
 const loop=()=>{const p=Math.min(1,(performance.now()-t0)/LOOK);$("ringp").style.strokeDashoffset=119.4*p;$("ringt").textContent=Math.ceil((1-p)*LOOK/1000);if(p<1)timers.push(requestAnimationFrame(loop));else{r.classList.add("hidden");typing();}};loop();}
function typing(){phase="type";$("btn-start").disabled=false;document.body.classList.add("typing");$("scene").innerHTML="";cover(true,"What did you see?");show("type");found=new Set();entries=[];$("chips").innerHTML="";$("found-n").textContent="0 found";
 const inp=$("inp");inp.value="";inp.focus({preventScroll:true});setTimeout(()=>window.scrollTo({top:0}),50);
 const t0=performance.now();let last=-1;const loop=()=>{const left=Math.max(0,TYPE-(performance.now()-t0));const s=Math.ceil(left/1000);$("tbar").style.width=(100*left/TYPE)+"%";
  if(s!==last){last=s;$("t-left").textContent=s+"s";if(s<=10)document.body.classList.add("hurry");if(s<=5&&s>0){SFX.tick();buzz(8);}}
  if(left<=0)return finish();timers.push(requestAnimationFrame(loop));};loop();}
function chip(t,c){const s=document.createElement("span");s.className="chip "+c;s.textContent=t;$("chips").prepend(s);while($("chips").children.length>14)$("chips").lastChild.remove();}
function submit(v){const rs=M.entry(v);const rec={t:v,r:[]};
 for(const r of rs){if(r.status==="match"){const it=SCENE.items[r.item];if(found.has(r.item)){chip("↺ "+it.label,"dup");rec.r.push("dup");}else{found.add(r.item);const rare=exPct(SCENE,r.item)<30;chip((rare?"💎 ":"✓ ")+it.label,"ok");rec.r.push(r.item);rare?SFX.rare():SFX.find();buzz(15);}}
  else if(r.status==="vague"){chip(`"${v}": more specific?`,"vague");rec.r.push("vague");}
  else if(r.status!=="empty"){chip("✗ "+v,"no");rec.r.push("none");SFX.no();}}
 entries.push(rec);$("found-n").textContent=found.size+" found";}
function finish(){if(phase!=="type")return;clearT();phase="res";document.body.classList.remove("typing","hurry");$("inp").blur();SFX.end();
 if(!practice){S.days[today]={scene:SCENE.id,found:[...found],entries,score:found.size,total:Object.keys(SCENE.items).length,at:Date.now()};save();}
 results(false);}
function rareCount(){return [...found].filter(id=>exPct(SCENE,id)<30).length;}
function results(instant){phase="res";show("res");header();cover(false);$("scene").innerHTML=sceneSVG();const sc=$("scene");sc.classList.add("reveal");
 const ids=Object.keys(SCENE.items),tot=ids.length;
 ids.forEach((id,i)=>{const g=sc.querySelector("#o-"+id);if(!g)return;if(found.has(id)){g.classList.add("found");g.style.animationDelay=(instant?0:i*45)+"ms";}else g.classList.add("missed");});
 $("s-of").textContent="/"+tot;const target=found.size;if(instant||matchMedia("(prefers-reduced-motion: reduce)").matches)$("s-num").textContent=target;else{let k=0;const tick=()=>{$("s-num").textContent=k;if(k++<target)timers.push(setTimeout(tick,Math.max(30,500/Math.max(1,target))));};tick();}
 const pct=Math.round(100*target/tot);$("s-line").textContent=`${SCENE.emoji} ${SCENE.title} · ${pct}% remembered · ${rareCount()} 💎 rare`+(practice?" · practice":"")+(S.days[today]&&!practice?` · 🔥 ${streak()} day streak`:"");
 $("share").textContent=shareText();
 $("list").innerHTML=ids.slice().sort((a,b)=>(found.has(b)-found.has(a))||exPct(SCENE,a)-exPct(SCENE,b)).map(id=>{const f=found.has(id),p=exPct(SCENE,id);return `<button data-id="${id}" class="${f?"":"miss"}" aria-label="${SCENE.items[id].label}, ${f?"found":"missed"}. Show in picture"><span>${f?(p<30?"💎":"✅"):"▫️"} ${SCENE.items[id].label}</span><span class="pc">${p}%*</span></button>`;}).join("");
 // near-miss review
 const misses=[];for(const e of entries){if(e.r.length===1&&e.r[0]==="none"){const s=M.suggest(e.t);if(s&&!found.has(s))misses.push([e.t,s]);}}
 $("review").innerHTML=misses.length?`<h3>So close</h3>`+misses.slice(0,5).map(([t,s])=>`<div class="rv">You typed “${esc(t)}”. Did you mean <b>${SCENE.items[s].label}</b>? <span class="muted small">(no points, but we're learning names)</span></div>`).join(""):"";
 demoButtons();countdown();}
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function shareText(){const ids=Object.keys(SCENE.items);const cells=ids.map(id=>found.has(id)?(exPct(SCENE,id)<30?"💎":"🟩"):"⬜");const rows=[];for(let i=0;i<cells.length;i+=8)rows.push(cells.slice(i,i+8).join(""));
 return `👁️ Glimpse ${practice?"(practice)":"#"+N} ${SCENE.emoji}\n${found.size}/${ids.length} spotted · ${rareCount()}💎${!practice&&S.days[today]?` · 🔥${streak()}`:""}\n${rows.join("\n")}\n${URL_PUBLIC}`;}
function streak(){let n=0,d=Date.parse(today+"T00:00:00Z");while(S.days[new Date(d).toISOString().slice(0,10)]){n++;d-=864e5;}return n;}
function stats(){const ds=Object.values(S.days);const played=ds.length,avg=played?Math.round(100*ds.reduce((a,d)=>a+d.score/d.total,0)/played):0;let best=0,run=0;const keys=Object.keys(S.days).sort();let prev=null;for(const k of keys){const t=Date.parse(k+"T00:00:00Z");run=(prev&&t-prev===864e5)?run+1:1;best=Math.max(best,run);prev=t;}
 $("stats").innerHTML=`<div class="grid"><div><b>${played}</b>played</div><div><b>${streak()}</b>streak</div><div><b>${best}</b>best streak</div><div><b>${avg}%</b>avg</div></div>`+(played?`<p class="muted small">Recent: ${keys.slice(-7).map(k=>`#${dayNum(k)} ${S.days[k].score}/${S.days[k].total}`).join(" · ")}</p>`:`<p class="muted">Play today's Glimpse to start a streak.</p>`);$("d-stats").showModal();}
function countdown(){const el=$("cd");const f=()=>{const ms=msToSydMidnight();const hh=Math.floor(ms/36e5),mm=Math.floor(ms%36e5/6e4),ss=Math.floor(ms%6e4/1e3);el.textContent=[hh,mm,ss].map(x=>String(x).padStart(2,"0")).join(":");
  if(!Q.get("date")&&sydDate()!==today){el.innerHTML='<button class="primary" id="btn-new" style="width:auto;padding:8px 14px;font-size:16px">New Glimpse ready →</button>';$("btn-new").onclick=()=>location.reload();clearT();}};f();timers.push(setInterval(f,1000));}
function demoButtons(){$("demo-btns").innerHTML=SCENES.map((s,i)=>`<button data-sc="${i}">${s.emoji} ${s.title}</button>`).join("");}
function practiceScene(i){clearT();practice=true;SCENE=SCENES[i];M=GMatch.build(SCENE);found=new Set();entries=[];phase="home";$("btn-start").disabled=false;header();cover(true,"Practice round");show("home");$("home-note").textContent="Practice round: doesn't affect your streak.";window.scrollTo({top:0});}
async function share(){const t=$("share").textContent;try{if(navigator.share&&matchMedia("(pointer:coarse)").matches){await navigator.share({text:t});return;}}catch(e){if(e&&e.name==="AbortError")return;}copy(t);}
async function copy(t){try{await navigator.clipboard.writeText(t);toast("Copied! Paste it anywhere.");}catch{const r=document.createRange();r.selectNodeContents($("share"));const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Selected: press copy");}}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),1800);}
// ---------- wiring ----------
$("btn-start").onclick=start;$("btn-done").onclick=finish;$("btn-help").onclick=()=>$("d-help").showModal();$("btn-stats").onclick=stats;
$("btn-share").onclick=share;$("btn-copy").onclick=()=>copy($("share").textContent);
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
$("d-help").addEventListener("close",()=>{S.settings.seenHelp=true;save();});
const snd=()=>{$("btn-sound").textContent=S.settings.sound?"🔊":"🔇";$("btn-sound").setAttribute("aria-label",S.settings.sound?"Sound on":"Sound off");};
$("btn-sound").onclick=()=>{S.settings.sound=!S.settings.sound;save();snd();SFX.find();};snd();
$("f").addEventListener("submit",e=>{e.preventDefault();const i=$("inp"),v=i.value.trim();if(v&&phase==="type"){submit(v.slice(0,60));i.value="";}i.focus({preventScroll:true});});
$("list").addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(!b)return;document.querySelectorAll("#list .sel").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");const g=$("scene").querySelector("#o-"+b.dataset.id);if(g){g.classList.remove("spot");void g.getBoundingClientRect();g.classList.add("spot");if(innerWidth<900)$("scene").scrollIntoView({behavior:"smooth",block:"start"});}});
$("demo-btns").addEventListener("click",e=>{const b=e.target.closest("button[data-sc]");if(b)practiceScene(+b.dataset.sc);});
if(window.visualViewport)visualViewport.addEventListener("resize",()=>{if(phase==="type"&&document.activeElement===$("inp"))$("p-type").scrollIntoView({block:"start"});});
window.__glimpse={finish,submit,state:()=>({phase,found:[...found],scene:SCENE.id,N,today})};
home();if(!S.settings.seenHelp&&!S.days[today])$("d-help").showModal();
})();
