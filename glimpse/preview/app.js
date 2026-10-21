(()=>{"use strict";
const $=id=>document.getElementById(id), Q=new URLSearchParams(location.search);
const URL_PUBLIC="https://optimusslimes.github.io/floppr/glimpse/";
const LOOK=+Q.get("look")||10000, TYPE=+Q.get("type")||60000;  // overrides only via query (ms)
const EPOCH="2026-10-21", KEY="glimpse:pv2";
// ---------- dates (Australia/Sydney) ----------
const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:"Australia/Sydney",year:"numeric",month:"2-digit",day:"2-digit"});
function sydDate(d=new Date()){return Q.get("date")||fmt.format(d);}
function dayNum(ds){return Math.round((Date.parse(ds+"T00:00:00Z")-Date.parse(EPOCH+"T00:00:00Z"))/864e5)+1;}
function msToSydMidnight(){const now=new Date();const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Australia/Sydney",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(now).map(x=>[x.type,x.value]));
 return ((23-+p.hour)*3600+(59-+p.minute)*60+(60-+p.second))*1000;}
const ORDER=[0,1,2,3,4,5];
function sceneFor(n){const i=((n-1)%SCENES.length+SCENES.length)%SCENES.length;return SCENES[ORDER[i]];}
// ---------- rarity: ESTIMATED difficulty set per object by the designer (size, placement, contrast).
// When real player data exists, replace RARITY.source with a crowd lookup returning a tier 0-3; nothing else changes.
const TIERS=[{n:"Common",e:"⚪",p:50},{n:"Uncommon",e:"🔷",p:80},{n:"Rare",e:"✨",p:120},{n:"Epic",e:"💎",p:180}];
const RARITY={source:"estimate",tier:(scene,id)=>{const d=scene.items[id]&&scene.items[id].diff;return d>=0&&d<=3?d:0;}};
const tierOf=id=>RARITY.tier(SCENE,id);
function ptsFor(scene,ids){return ids.reduce((a,id)=>a+TIERS[RARITY.tier(scene,id)].p,0);}
const fmtN=n=>n.toLocaleString("en-AU");
// ---------- storage (corruption-safe) ----------
function fresh(){return {v:2,days:{},settings:{music:true,sfx:true,seenHelp:false}};}
let S;try{S=JSON.parse(localStorage.getItem(KEY)||"null");if(!S||typeof S!=="object"||S.v!==2||!S.days||typeof S.days!=="object"||Array.isArray(S.days)||!S.settings||typeof S.settings!=="object")throw 0;}catch(e){try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(KEY+":corrupt",raw);}catch{}S=fresh();}
for(const [k,d] of Object.entries(S.days)){if(!/^\d{4}-\d\d-\d\d$/.test(k)||!d||!Array.isArray(d.found)||!(d.total>0))delete S.days[k];}
for(const [k,d] of Object.entries(S.days)){const sc=SCENES.find(x=>x.id===d.scene);if(sc&&typeof d.pts!=="number"){d.pts=ptsFor(sc,d.found.filter(id=>sc.items[id]));d.count=d.found.length;}}
if(typeof S.settings.music!=="boolean"){S.settings.music=true;S.settings.sfx=true;delete S.settings.sound;}
S.challenges=S.challenges&&typeof S.challenges==="object"?S.challenges:{};S.v=2;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch{}};save();
// ---------- audio: see audio.js (procedural, original). Default ON after the first tap (Start is the gesture); separate music/sfx toggles, remembered.
const SFX=new Proxy({},{get:(_,k)=>a=>GAudio.sfx(k,a)});
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms);}catch{}};
// ---------- state ----------
const today=sydDate(), N=dayNum(today);
const CH=(()=>{const c=parseInt(Q.get("c"),10),d=parseInt(Q.get("d"),10);if(c>=0&&c<100000&&d>0)return {c,d};return null;})();
if(CH&&CH.d===dayNum(today)){S.challenges[today]=CH.c;} let SCENE=sceneFor(N), M=GMatch.build(SCENE), practice=false;
let found=new Set(), entries=[], phase="home", timers=[];
const clearT=()=>{timers.forEach(t=>{clearTimeout(t);clearInterval(t);cancelAnimationFrame(t);});timers=[];};
function show(p){["home","type","res"].forEach(x=>$("p-"+x).classList.toggle("hidden",x!==p));}
function sceneSVG(){return `<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${SCENE.title} scene">${SCENE.svg}</svg>`;}
function header(){$("dayno").textContent=practice?"practice":"#"+N;$("home-scene").textContent=`${SCENE.emoji} Today: ${SCENE.title} · ${Object.keys(SCENE.items).length} things hidden`;}
function cover(on,sub){$("scene").classList.toggle("hidden",on);$("cover").classList.toggle("hidden",!on);if(sub)$("cover-sub").textContent=sub;}
// ---------- flow ----------
function home(){phase="home";document.body.className="";header();cover(true,"Ready when you are");show("home");
 const rec=S.days[today];$("home-note").textContent=rec?"":"🎵 Gentle music & sounds play once you start. Mute anytime up top.";
 const ch=S.challenges[today];$("chal").classList.toggle("hidden",ch==null||practice);if(ch!=null)$("chal").innerHTML=`🎯 A friend scored <b>${fmtN(ch)}</b> on today's Glimpse. Beat it!`;
 if(CH&&CH.d!==N&&!practice){$("chal").classList.remove("hidden");$("chal").innerHTML=`🎯 That challenge was for Glimpse #${CH.d}. Today's is #${N}, so play it and send yours back.`;}
 if(rec&&!practice){found=new Set(rec.found);entries=rec.entries||[];results(true);}}
function start(){if(phase!=="home")return;GAudio.unlock();GAudio.setPrefs({music:S.settings.music,sfx:S.settings.sfx});GAudio.phase("count",SCENE.id);phase="count";show("home");$("btn-start").disabled=true;const c=$("count3");cover(true,"Get ready…");c.classList.remove("hidden");let k=3;
 const step=()=>{if(k===0){c.classList.add("hidden");look();return;}c.textContent=k;c.classList.remove("pop");void c.offsetWidth;c.classList.add("pop");SFX.blip(3-k);buzz(10);k--;timers.push(setTimeout(step,700));};step();}
function look(){phase="look";SFX.go();GAudio.phase("look",SCENE.id);cover(false);$("scene").innerHTML=sceneSVG();$("scene").classList.remove("reveal");$("scene").classList.add("iso-look");const r=$("ring");r.classList.remove("hidden");const t0=performance.now();
 const loop=()=>{const p=Math.min(1,(performance.now()-t0)/LOOK);$("ringp").style.strokeDashoffset=119.4*p;$("ringt").textContent=Math.ceil((1-p)*LOOK/1000);if(p<1)timers.push(requestAnimationFrame(loop));else{r.classList.add("hidden");typing();}};loop();}
function typing(){phase="type";$("btn-start").disabled=false;document.body.classList.add("typing");$("scene").innerHTML="";cover(true,"What did you see?");show("type");found=new Set();entries=[];$("chips").innerHTML="";$("found-n").textContent="0 found";$("pts-live").textContent="0 pts";
 GAudio.phase("type",SCENE.id);const inp=$("inp");inp.value="";inp.focus({preventScroll:true});setTimeout(()=>window.scrollTo({top:0}),50);
 const t0=performance.now();let last=-1;const loop=()=>{const left=Math.max(0,TYPE-(performance.now()-t0));const s=Math.ceil(left/1000),el=1-left/TYPE;GAudio.setIntensity(.2+.8*Math.pow(el,1.4));GAudio.setDetune(left<=10000?60:left<=20000?25:0);$("tbar").style.width=(100*left/TYPE)+"%";
  if(s!==last){last=s;$("t-left").textContent=s+"s";if(s<=10)document.body.classList.add("hurry");if(s<=5&&s>0){SFX.tick();buzz(8);}}
  if(left<=0)return finish();timers.push(requestAnimationFrame(loop));};loop();}
function chip(t,c){const s=document.createElement("span");s.className="chip "+c;s.textContent=t;$("chips").prepend(s);while($("chips").children.length>14)$("chips").lastChild.remove();}
function submit(v){const rs=M.entry(v);const rec={t:v,r:[]};
 for(const r of rs){if(r.status==="match"){const it=SCENE.items[r.item];if(found.has(r.item)){chip("↺ "+it.label,"dup");SFX.dup();rec.r.push("dup");}else{found.add(r.item);const t=tierOf(r.item);chip(`${TIERS[t].e} ${it.label} +${TIERS[t].p}`,"ok t"+t);rec.r.push(r.item);SFX.find(t);buzz(t>=2?[15,40,15]:15);$("pts-live").textContent=fmtN(ptsFor(SCENE,[...found]))+" pts";}}
  else if(r.status==="vague"){chip(`"${v}": more specific?`,"vague");SFX.vague();rec.r.push("vague");}
  else if(r.status!=="empty"){chip("✗ "+v,"no");rec.r.push("none");SFX.no();}}
 entries.push(rec);$("found-n").textContent=found.size+" found";}
function finish(){if(phase!=="type")return;clearT();phase="res";document.body.classList.remove("typing","hurry");$("inp").blur();SFX.timeup();
 if(!practice){S.days[today]={scene:SCENE.id,found:[...found],entries,score:found.size,count:found.size,pts:ptsFor(SCENE,[...found]),total:Object.keys(SCENE.items).length,at:Date.now()};save();}
 results(false);}
function tierCounts(){const c=[0,0,0,0];for(const id of found)c[tierOf(id)]++;return c;}
function results(instant){phase="res";show("res");header();cover(false);$("scene").innerHTML=sceneSVG();const sc=$("scene");sc.classList.remove("iso-look");sc.classList.add("reveal");setTimeout(()=>sc.querySelectorAll("g.found").forEach((g,i)=>g.style.animationDelay=(i*.06)+"s"),0);
 const ids=Object.keys(SCENE.items),tot=ids.length;
 ids.forEach((id,i)=>{const g=sc.querySelector("#o-"+id);if(!g)return;if(found.has(id)){g.classList.add("found");g.style.animationDelay=(instant?0:i*45)+"ms";}else g.classList.add("missed");});
 const pts=ptsFor(SCENE,[...found]),cnt=found.size,pct=Math.round(100*cnt/tot),tc=tierCounts();
 if(instant||matchMedia("(prefers-reduced-motion: reduce)").matches){$("s-num").textContent=fmtN(pts);if(!instant)timers.push(setTimeout(()=>afterCount(),50));}else{const t0=performance.now(),D=1400;let lt=0;const tick=()=>{const tn=performance.now(),k=Math.min(1,(tn-t0)/D),e=1-Math.pow(1-k,3);$("s-num").textContent=fmtN(Math.round(pts*e));if(pts&&tn-lt>85&&k<1){lt=tn;SFX.count();}if(k<1)timers.push(requestAnimationFrame(tick));else afterCount();};tick();}
 function afterCount(){[0,1,2,3].forEach(i=>timers.push(setTimeout(()=>SFX.tile(i),120*i)));const r=[...found].reduce((m,id)=>Math.max(m,tierOf(id)),-1);if(r>=2)timers.push(setTimeout(()=>SFX.fanfare(),600));}
 if(!instant)GAudio.phase("res",SCENE.id);
 $("s-sub").textContent=`${cnt}/${tot} found · ${pct}% of the scene`;
 $("tiers").innerHTML=TIERS.map((T,i)=>`<div class="tier t${i}"><span>${T.e}</span><b>${tc[i]}</b><small>${T.n}<br>+${T.p} each</small></div>`).slice().reverse().join("");
 const rarest=[...found].sort((a,b)=>tierOf(b)-tierOf(a)||(SCENE.items[a].label<SCENE.items[b].label?-1:1))[0];
 $("rarest").innerHTML=rarest?`<span class="muted small">Rarest find</span><b>${TIERS[tierOf(rarest)].e} ${SCENE.items[rarest].label}</b><span class="pill">${TIERS[tierOf(rarest)].n} · +${TIERS[tierOf(rarest)].p}</span>`:`<span class="muted">No finds this time. Tomorrow's a new picture!</span>`;
 const ch=practice?null:S.challenges[today];$("chal-res").classList.toggle("hidden",ch==null);
 if(ch!=null){$("chal-res").innerHTML=pts>ch?`🏆 You beat your friend's <b>${fmtN(ch)}</b> by ${fmtN(pts-ch)}!`:pts===ch?`🤝 Dead heat with your friend's <b>${fmtN(ch)}</b>!`:`😅 ${fmtN(ch-pts)} short of your friend's <b>${fmtN(ch)}</b>. Send it to someone else?`;}
 $("s-line").textContent=`${SCENE.emoji} ${SCENE.title}`+(practice?" · practice":"")+(S.days[today]&&!practice?` · 🔥 ${streak()} day streak`:"");
 $("share").textContent=shareText();
 $("list").innerHTML=ids.slice().sort((a,b)=>(found.has(b)-found.has(a))||tierOf(b)-tierOf(a)).map(id=>{const f=found.has(id),t=tierOf(id);return `<button data-id="${id}" class="${f?"":"miss"}" aria-label="${SCENE.items[id].label}, ${TIERS[t].n}, ${f?"found":"missed"}. Show in picture"><span>${f?"✅":"▫️"} ${SCENE.items[id].label}</span><span class="pc">${TIERS[t].e} ${f?"+"+TIERS[t].p:TIERS[t].n}</span></button>`;}).join("");
 // near-miss review
 const misses=[];for(const e of entries){if(e.r.length===1&&e.r[0]==="none"){const s=M.suggest(e.t);if(s&&!found.has(s))misses.push([e.t,s]);}}
 $("review").innerHTML=misses.length?`<h3>So close</h3>`+misses.slice(0,5).map(([t,s])=>`<div class="rv">You typed “${esc(t)}”. Did you mean <b>${SCENE.items[s].label}</b>? <span class="muted small">(no points, but we're learning names)</span></div>`).join(""):"";
 demoButtons();countdown();}
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function shareText(){const ids=Object.keys(SCENE.items),pts=ptsFor(SCENE,[...found]),tc=tierCounts(),pct=Math.round(100*found.size/ids.length);
 const bits=[tc[3]?`💎${tc[3]}`:"",tc[2]?`✨${tc[2]}`:""].filter(Boolean).join(" ");const st=!practice&&S.days[today]?streak():0;
 const link=practice?URL_PUBLIC:`${URL_PUBLIC}?c=${pts}&d=${N}`;
 return `Glimpse ${practice?"(practice)":"#"+N} 👁️ ${fmtN(pts)} pts · ${found.size}/${ids.length} (${pct}%)${bits?" · "+bits:""}${st>1?` · 🔥${st}`:""}\n${practice?"":"Can you beat me? "}${link}`;}
function streak(){let n=0,d=Date.parse(today+"T00:00:00Z");while(S.days[new Date(d).toISOString().slice(0,10)]){n++;d-=864e5;}return n;}
function stats(){const ks=Object.keys(S.days).sort(),ds=ks.map(k=>S.days[k]),played=ds.length;const best=played?Math.max(...ds.map(d=>d.pts||0)):0,avg=played?Math.round(ds.reduce((a,d)=>a+(d.pts||0),0)/played):0;
 let bs=0,run=0,prev=null;for(const k of ks){const t=Date.parse(k+"T00:00:00Z");run=(prev&&t-prev===864e5)?run+1:1;bs=Math.max(bs,run);prev=t;}
 $("stats").innerHTML=`<div class="grid"><div><b>${played}</b>played</div><div><b>${streak()}</b>streak</div><div><b>${bs}</b>best streak</div><div><b>${Math.round(played?ds.reduce((a,d)=>a+d.count/d.total,0)/played*100:0)}%</b>avg found</div></div><div class="grid g2"><div><b>${fmtN(best)}</b>best score</div><div><b>${fmtN(avg)}</b>average score</div></div>`+(played?`<p class="muted small">Recent: ${ks.slice(-7).map(k=>`#${dayNum(k)} ${fmtN(S.days[k].pts||0)}`).join(" · ")}</p>`:`<p class="muted">Play today's Glimpse to start a streak.</p>`);$("d-stats").showModal();}
function countdown(){const el=$("cd");const f=()=>{const ms=msToSydMidnight();const hh=Math.floor(ms/36e5),mm=Math.floor(ms%36e5/6e4),ss=Math.floor(ms%6e4/1e3);el.textContent=[hh,mm,ss].map(x=>String(x).padStart(2,"0")).join(":");
  if(!Q.get("date")&&sydDate()!==today){el.innerHTML='<button class="primary" id="btn-new" style="width:auto;padding:8px 14px;font-size:16px">New Glimpse ready →</button>';$("btn-new").onclick=()=>location.reload();clearT();}};f();timers.push(setInterval(f,1000));}
function demoButtons(){$("demo-btns").innerHTML=SCENES.map((s,i)=>`<button data-sc="${i}">${s.emoji} ${s.title}</button>`).join("");}
function practiceScene(i){clearT();practice=true;SCENE=SCENES[i];M=GMatch.build(SCENE);found=new Set();entries=[];phase="home";$("btn-start").disabled=false;header();cover(true,"Practice round");show("home");$("home-note").textContent="Practice round: doesn't affect your streak.";window.scrollTo({top:0});}
async function share(){const t=$("share").textContent;try{if(navigator.share&&matchMedia("(pointer:coarse)").matches){await navigator.share({text:t});return;}}catch(e){if(e&&e.name==="AbortError")return;}copy(t);}
async function copy(t){try{await navigator.clipboard.writeText(t);toast("Copied! Paste it anywhere.");}catch{const r=document.createRange();r.selectNodeContents($("share"));const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Selected: press copy");}}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),1800);}
// ---------- wiring ----------
$("btn-start").onclick=start;$("btn-done").onclick=finish;$("btn-help").onclick=()=>$("d-help").showModal();$("btn-stats").onclick=stats;
$("btn-share").onclick=()=>{SFX.click();share();};$("btn-copy").onclick=()=>copy($("share").textContent);
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
$("d-help").addEventListener("close",()=>{S.settings.seenHelp=true;save();});
const snd=()=>{const m=S.settings.music,f=S.settings.sfx;$("btn-music").textContent="🎵";$("btn-music").classList.toggle("off",!m);$("btn-music").setAttribute("aria-pressed",m);$("btn-music").setAttribute("aria-label","Music and ambience "+(m?"on":"off"));
 $("btn-sound").textContent=f?"🔔":"🔕";$("btn-sound").classList.toggle("off",!f);$("btn-sound").setAttribute("aria-pressed",f);$("btn-sound").setAttribute("aria-label","Sound effects "+(f?"on":"off"));GAudio.setPrefs({music:m,sfx:f});};
$("btn-music").onclick=()=>{GAudio.unlock();S.settings.music=!S.settings.music;save();snd();if(S.settings.music)GAudio.phase(phase==="type"?"type":phase==="look"?"look":"home",SCENE.id);};
$("btn-sound").onclick=()=>{GAudio.unlock();S.settings.sfx=!S.settings.sfx;save();snd();SFX.click();};snd();
$("f").addEventListener("submit",e=>{e.preventDefault();const i=$("inp"),v=i.value.trim();if(v&&phase==="type"){submit(v.slice(0,60));i.value="";}i.focus({preventScroll:true});});
$("list").addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(!b)return;document.querySelectorAll("#list .sel").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");const g=$("scene").querySelector("#o-"+b.dataset.id);if(g){g.classList.remove("spot");void g.getBoundingClientRect();g.classList.add("spot");if(innerWidth<900)$("scene").scrollIntoView({behavior:"smooth",block:"start"});}});
$("demo-btns").addEventListener("click",e=>{const b=e.target.closest("button[data-sc]");if(b)practiceScene(+b.dataset.sc);});
if(window.visualViewport)visualViewport.addEventListener("resize",()=>{if(phase==="type"&&document.activeElement===$("inp"))$("p-type").scrollIntoView({block:"start"});});
window.__glimpse={finish,submit,state:()=>({phase,found:[...found],scene:SCENE.id,N,today})};
document.addEventListener("pointerdown",()=>{if(!GAudio.running()){GAudio.unlock();GAudio.setPrefs({music:S.settings.music,sfx:S.settings.sfx});if(phase==="home"||phase==="res")GAudio.phase(phase,SCENE.id);}},{once:false,passive:true});
home();if(!S.settings.seenHelp&&!S.days[today])$("d-help").showModal();
})();
