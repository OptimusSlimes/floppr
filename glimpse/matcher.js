// Floppr-free memory game matcher. Works in browser (window.Matcher) and Node (module.exports).
(function(root){
const ITEMS = {
 sun:["sun","sunshine"], cloud:["cloud"], tree:["tree","gum tree","eucalyptus"], house:["house","home","building"],
 dog:["dog","puppy","pup","doggo","pooch","doggy","doggie"], cat:["cat","kitten","kitty","moggy"], kookaburra:["kookaburra","kooka","bird","laughing jackass"],
 kite:["kite"], ball:["ball","beach ball","beachball"], bicycle:["bicycle","bike","push bike","pushbike","cycle"],
 umbrella:["umbrella","beach umbrella","parasol","brolly"], esky:["esky","eskie","eskies","cooler","chilly bin","cool box","coolbox","ice box","icebox","cooler box"],
 bbq:["bbq","barbecue","barbeque","barbie","grill"], sausage:["sausage","snag","hot dog","banger","sausage sizzle","sizzle"],
 hat:["hat","sun hat","sunhat","cap"], sunglasses:["sunglasses","sunnies","shades","glasses","sunglass","sunnys"],
 watermelon:["watermelon","melon"], apple:["apple"], banana:["banana"], cup:["cup","mug"], plate:["plate","dish"],
 flower:["flower","daisy","sunflower"], fence:["fence","picket fence","paling fence"], letterbox:["letterbox","mailbox","postbox","mail box","letter box","post box"],
 car:["car","ute","vehicle","auto"], butterfly:["butterfly"], snail:["snail"], bucket:["bucket","pail"], thongs:["thongs","flip flops","flipflops","jandals","sandals","flip flop","thong"],
 clothesline:["clothesline","hills hoist","clothes line","washing line","hoist","rotary line"]
};
const LABEL = {bbq:"BBQ",esky:"esky",thongs:"thongs",clothesline:"Hills hoist",kookaburra:"kookaburra"};
// Words that are real things but NOT in the scene: never fuzzy-snap these.
const DECOYS = ["kitchen","wicket","cart","cab","bat","rat","hut","hit","cop","cub","cut","sub","son","sin","tea","bee","fan","pen","pin","bin","box","fox","log","bag","mat","map","kit","kid","pan","pot","van","bus","bear","boat","bell","bowl","bull","coat","cake","card","door","duck","fish","frog","goat","horse","kettle","knife","lamp","lion","moon","mouse","nail","paper","pear","pencil","phone","plane","plant","pool","rain","ring","rock","rope","shoe","sock","star","table","towel","train","truck","whale","window","chair","shovel","spade","grape","orange","lemon","bread","snake","spider","ladder","bench","clock","tent","sail","shell","sand","sea","wave","bottle","can","beer","cow","sheep","koala","kangaroo","ant","fly","gate","rake","hose","mower","swing","slide","flag","balloon","cupcake","melon seed","bone","stick","leaf","grass","path","road","chimney","roof","shed","pole","wire","wheel","pegs","peg","shirt","towel","boot","glove","bottle","straw","fork","spoon","napkin","sauce","tomato","onion","bun","bread roll","drink","juice","soda","lid"];
const VAGUE = ["animal","animals","pet","pets","fruit","food","thing","things","stuff","toy","toys","object","plant","plants","sky","weather","furniture","clothes","clothing","shoes","footwear","drinks","dishes","creature","insect","bug","bugs","item","everything","all","yard","garden","backyard"];
const STOP = new Set(["a","an","the","some","my","his","her","their","one","two","three","four","five","few","lots","of","little","big","small","large","red","blue","green","yellow","pink","white","black","orange","brown","purple","grey","gray","tiny","giant"]);
const IRREG = {mice:"mouse",geese:"goose",children:"child",people:"person",knives:"knife",leaves:"leaf",loaves:"loaf",wolves:"wolf",shelves:"shelf",sunglasses:"sunglasses",glasses:"glasses",thongs:"thongs",grass:"grass",bus:"bus",gas:"gas",shades:"shades",sunnies:"sunnies"};
function sing(w){ if(IRREG[w]) return IRREG[w]; if(w.length<4) return w;
  if(/ies$/.test(w)) return w.slice(0,-3)+"y"; if(/(ches|shes|sses|xes|oes)$/.test(w)) return w.slice(0,-2);
  if(/ss$|us$|is$/.test(w)) return w; if(/s$/.test(w)) return w.slice(0,-1); return w; }
function norm(s){ s=s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/['’]/g,"").replace(/[^a-z0-9 ]+/g," ");
  let ws=s.split(/\s+/).filter(Boolean).filter(w=>!STOP.has(w)&&!/^\d+$/.test(w)).map(sing); return ws.join(" "); }
const INDEX = new Map(); // normalised alias -> item
for(const [id,al] of Object.entries(ITEMS)) for(const a of al){ const n=norm(a); INDEX.set(n,id); INDEX.set(n.replace(/ /g,""),id); }
const DEC = new Set(DECOYS.map(norm)), VAG=new Set(VAGUE.map(norm));
function dl(a,b){ const m=a.length,n=b.length,d=[];for(let i=0;i<=m;i++){d[i]=[i];}for(let j=0;j<=n;j++)d[0][j]=j;
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);} return d[m][n]; }
function tol(len){ return len<=3?1: len<=5?1: len<=9?2: 3; }
// Match ONE phrase -> {status:'match'|'none'|'vague'|'empty', item, how}
function matchOne(raw){
  const n=norm(raw); if(!n) return {status:"empty"};
  const c=n.replace(/ /g,"");
  if(INDEX.has(n)) return {status:"match",item:INDEX.get(n),how:"alias"};
  if(INDEX.has(c)) return {status:"match",item:INDEX.get(c),how:"alias"};
  if(VAG.has(n)) return {status:"vague"};
  if(DEC.has(n)) return {status:"none",how:"decoy"};
  // last word head-noun, e.g. "sizzling sausage" / "old ute"
  const ws=n.split(" "); const hits=new Set(ws.filter(w=>INDEX.has(w)).map(w=>INDEX.get(w))).size; if(ws.length>2&&hits>1) return {status:"none",how:"catch-all"}; if(ws.length>1){ const h=ws[ws.length-1]; if(INDEX.has(h)) return {status:"match",item:INDEX.get(h),how:"head"}; }
  // fuzzy
  let best=null,bd=99,tie=false; const t=tol(c.length);
  for(const [a,id] of INDEX){ if(Math.abs(a.length-c.length)>t) continue; let d=dl(c,a); if(c[0]!==a[0]) d+=1; if(c.length===3&&d===1&&[...c].sort().join("")!==[...a].sort().join("")) d=9;
    if(d<bd){bd=d;best=id;tie=false;} else if(d===bd && id!==best) tie=true; }
  if(best && bd<=t && bd>0 && !tie) return {status:"match",item:best,how:"fuzzy",dist:bd};
  if(best && bd<=t && tie) return {status:"none",how:"ambiguous"};
  return {status:"none"};
}
// Full entry, may hold several items: "cup and plate", "dog, cat"
function matchEntry(raw){
  const parts=raw.toLowerCase().split(/\s*(?:,|&|\+|\/|;|\band\b|\bwith\b|\bplus\b)\s*/).filter(p=>p.trim());
  const out=[]; const whole=matchOne(raw); if(whole.status==="match"&&whole.how==="alias"&&parts.length>1){ return [whole]; } // "hills hoist" style safety
  for(const p of parts.length?parts:[raw]) out.push(matchOne(p));
  return out.slice(0,3); // cap: one entry can't claim many items
}
const api={ITEMS,LABEL,norm,dl,matchOne,matchEntry};
if(typeof module!=="undefined") module.exports=api; else root.Matcher=api;
})(this);
