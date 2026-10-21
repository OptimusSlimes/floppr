// Glimpse matcher v2: per-scene index; browser (window.GMatch) + Node.
(function(root){
const GLOBAL_DECOYS="sanga sandwich kitchen wicket cart cab bat rat hut hit cop cub cut sub son sin tea bee fan pen pin bin box fox log bag mat map kit kid pan pot van bus bear boat bell bowl bull coat cake card door duck fish frog goat horse kettle knife lamp lion moon mouse nail paper pear pencil phone plane plant pool rain ring rock rope shoe sock star table towel train truck whale window chair shovel spade grape orange lemon bread snake spider ladder bench clock tent sail shell sand sea wave bottle can beer cow sheep koala kangaroo ant fly gate rake hose mower swing slide flag balloon cupcake bone stick leaf grass path road chimney roof shed pole wire wheel peg shirt boot glove straw fork spoon napkin sauce tomato onion bun drink juice soda lid tongs pie tap kennel sunscreen surfboard crab dolphin car cat dog sun cloud tree house hat ball cup plate egg milk jar pig chicken elephant giraffe monkey tiger zebra rabbit hamster parrot penguin owl robot rocket guitar piano drum violin computer laptop tv television sofa couch bed pillow blanket rug curtain mirror picture frame vase candle torch lantern axe canoe kayak mushroom bus taxi tram skateboard scooter pram hydrant cone pigeon seagull magpie cockatoo kookaburra lighthouse ship yacht anchor starfish jellyfish octopus shark carrot potato pumpkin cheese toaster fridge oven teapot mug sandwich pizza burger chips biscuit".split(" ");
const VAGUE="animal animals pet pets fruit fruits food thing things stuff toy toys object objects plant plants sky weather furniture clothes clothing shoes footwear drinks dishes creature creatures insect bug bugs item items everything all yard garden backyard building buildings vehicle vehicles room people person kitchenware utensil utensils appliance appliances sea ocean water beach nature wildlife tool tools decoration light lights".split(" ");
const STOP=new Set("a an the some my his her their its one two three four five six few lots lot of little big small large tiny giant huge red blue green yellow pink white black orange brown purple grey gray gold silver striped spotty old new cute fluffy wooden".split(" "));
const IRREG={mice:"mouse",geese:"goose",children:"child",people:"person",knives:"knife",leaves:"leaf",loaves:"loaf",wolves:"wolf",shelves:"shelf",fish:"fish",sheep:"sheep",sunglasses:"sunglasses",glasses:"glasses",binoculars:"binoculars",headphones:"headphones",thongs:"thongs",slippers:"slipper",scissors:"scissors",grass:"grass",bus:"bus",gas:"gas",glass:"glass",shades:"shades",sunnies:"sunnies",sunnys:"sunnies",cactus:"cactus",octopus:"octopus",dice:"dice",drawers:"drawers",curtains:"curtains",jeans:"jeans",trousers:"trousers",pants:"pants",teeth:"tooth",feet:"foot",cheese:"cheese",moose:"moose"};
function sing(w){ if(IRREG[w]) return IRREG[w]; if(w.length<4) return w;
  if(/ies$/.test(w)) return w.slice(0,-3)+"y"; if(/(ches|shes|sses|xes|zes)$/.test(w)) return w.slice(0,-2);
  if(/(potatoes|tomatoes|heroes|echoes|volcanoes|mangoes)$/.test(w)) return w.slice(0,-2); if(/(ss|us|is)$/.test(w)) return w; if(/s$/.test(w)) return w.slice(0,-1); return w; }
function words(s){ s=s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/['’`]/g,"").replace(/[^a-z0-9 ]+/g," ");
  return s.split(/\s+/).filter(Boolean); }
function norm(s,keepIng){ return words(s).filter(w=>!STOP.has(w)&&!/^\d+$/.test(w)).map(sing).join(" "); }
function dl(a,b){const m=a.length,n=b.length;let d=[];for(let i=0;i<=m;i++){d[i]=[i];}for(let j=0;j<=n;j++)d[0][j]=j;
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
 if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}return d[m][n];}
// sound key: first letter + consonant skeleton (w/h/y treated as vowels), common digraphs folded
function snd(s){ s=s.replace(/ /g,""); if(s.length<3) return "";
  let t=s.replace(/ph/g,"f").replace(/ck/g,"k").replace(/qu/g,"kw").replace(/x/g,"ks").replace(/c(?=[eiy])/g,"s").replace(/c/g,"k").replace(/z/g,"s").replace(/gh/g,"");
  const f=t[0]; t=t.slice(1).replace(/[aeiouwhy]/g,"").replace(/(.)\1+/g,"$1"); return (/[aeiou]/.test(f)?"a":f)+t; }
function tol(len){ return len<=2?0: len===3?1: len<=5?1: len<=9?2: 3; }
const SPLIT=/\s*(?:,|&|\+|\/|;|\band\b|\bwith\b|\bplus\b|\bon\b|\bin\b|\bunder\b|\bnext to\b|\bnear\b|\bby\b|\bbeside\b|\bholding\b|\bwearing\b|\bover\b)\s*/;
function build(scene){
  const INDEX=new Map(), SND=new Map(); const ids=Object.keys(scene.items);
  for(const id of ids){ for(const a of scene.items[id].names){ const n=norm(a); INDEX.set(n,id); INDEX.set(n.replace(/ /g,""),id); } }
  for(const [a,id] of INDEX){ const k=snd(a); if(k.length>=3){ if(SND.has(k)&&SND.get(k)!==id) SND.set(k,null); else SND.set(k,id);} }
  const DEC=new Set([...GLOBAL_DECOYS,...(scene.decoys||[])].map(x=>norm(x)).filter(x=>!INDEX.has(x)));
  const VAG=new Set(VAGUE.map(x=>norm(x)).filter(x=>!INDEX.has(x)));
  function fuzzy(c){ let best=null,bd=99,tie=false; const t=tol(c.length);
    for(const [a,id] of INDEX){ if(Math.abs(a.length-c.length)>t) continue; let d=dl(c,a); if(c[0]!==a[0]) d+=1;
      if(c.length===3&&d===1&&[...c].sort().join("")!==[...a].sort().join("")) d=9;
      if(d<bd){bd=d;best=id;tie=false;} else if(d===bd&&id!==best) tie=true; }
    return {best,bd,t,tie}; }
  function one(raw){
    const raw0=words(raw).filter(w=>!STOP.has(w)&&!/^\d+$/.test(w)); const full=raw0.map(sing).join(" ");
    if(INDEX.has(full)) return {status:"match",item:INDEX.get(full),how:"alias"};
    const rc=raw0.join(""); if(rc.length>3&&INDEX.has(rc)) return {status:"match",item:INDEX.get(rc),how:"alias"};
    if(rc.length>3&&INDEX.has(sing(rc))) return {status:"match",item:INDEX.get(sing(rc)),how:"alias"};
    const ws=raw0.length>1?raw0.filter(w=>!(w.length>5&&/ing$/.test(w)&&!INDEX.has(w))):raw0;  // drop verbs: "kites flying"
    const n=ws.map(sing).join(" "); if(!n) return {status:"empty"};
    const c=n.replace(/ /g,"");
    if(INDEX.has(n)) return {status:"match",item:INDEX.get(n),how:"alias"};
    if(INDEX.has(c)) return {status:"match",item:INDEX.get(c),how:"alias"};
    if(VAG.has(n)) return {status:"vague"};
    if(DEC.has(n)) return {status:"none",how:"decoy"};
    const parts=n.split(" ");
    if(parts.length>1){ const hits=new Set(parts.filter(w=>INDEX.has(w)).map(w=>INDEX.get(w)));
      if(parts.length>2&&hits.size>1) return {status:"none",how:"catch-all"};
      if(parts.length===2&&hits.size===1&&!parts.some(w=>!INDEX.has(w)&&DEC.has(w))){const w=parts.find(w=>INDEX.has(w)); return {status:"match",item:INDEX.get(w),how:"head"};}
      const h=parts[parts.length-1]; if(INDEX.has(h)) return {status:"match",item:INDEX.get(h),how:"head"};
      if(DEC.has(h)) return {status:"none",how:"decoy"}; }
    if(c.length<3) return {status:"none"};
    const f=fuzzy(c);
    if(f.best&&f.bd>0&&f.bd<=f.t&&!f.tie) return {status:"match",item:f.best,how:"fuzzy"};
    if(f.tie&&f.bd<=f.t) return {status:"none",how:"ambiguous"};
    const k=snd(c); if(k.length>=3&&SND.get(k)) return {status:"match",item:SND.get(k),how:"sound"};
    const s2=c.endsWith("s")?c.slice(0,-1):null; if(s2&&INDEX.has(s2)) return {status:"match",item:INDEX.get(s2),how:"alias"};
    if(s2){const f2=fuzzy(s2); if(f2.best&&f2.bd>0&&f2.bd<=f2.t&&!f2.tie) return {status:"match",item:f2.best,how:"fuzzy"};}
    return {status:"none"}; }
  function entry(raw){ const whole=one(raw); if(whole.status==="match"&&whole.how==="alias") return [whole];
    const parts=raw.toLowerCase().split(SPLIT).filter(p=>p&&p.trim()); if(parts.length<2) return [whole];
    return parts.map(one).filter(r=>r.status!=="empty").slice(0,3); }
  // near-miss suggestion for review list ("did you mean")
  function suggest(raw){ const c=norm(raw).replace(/ /g,""); if(c.length<3) return null; let best=null,bd=99;
    for(const [a,id] of INDEX){ const d=dl(c,a); if(d<bd){bd=d;best=id;} } return bd<=tol(c.length)+2&&bd>0?best:null; }
  return {ids,entry,one,suggest};
}
const api={build,norm,dl,snd};
if(typeof module!=="undefined") module.exports=api; else root.GMatch=api;
})(this);
