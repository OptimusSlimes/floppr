// Floppr v2: 8 altitude bands. Data + cosy outlined SVG props (ink #2d2350, 3-4px strokes).
window.FlopBands=(()=>{
const K='#2d2350',S=`stroke="${K}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const BANDS=[
 {n:'Studio Lot',lo:0,hi:150,sky:['#6b4fa8','#ffb98a'],wind:0,mat:'wood',post:'Day one on the lot',icon:'🎬',e:'🎬'},
 {n:'Rooftops & Hills',lo:150,hi:800,sky:['#b0608f','#e9a7b8'],wind:1,mat:'wood',post:'Above the billboards',icon:'🏙️',e:'🏙️'},
 {n:'Cloud Nine',lo:800,hi:3000,sky:['#a99be0','#a3d8f7'],wind:2,mat:'metal',post:'Head in the clouds',icon:'☁️',e:'☁️'},
 {n:'Peaks & Storms',lo:3000,hi:8000,sky:['#5f86dc','#7c8aa3'],wind:3,mat:'metal',post:'Higher than Everest',icon:'🏔️',e:'🏔️'},
 {n:'Cruising Altitude',lo:8000,hi:15000,sky:['#23408f','#8c9cf0'],wind:4,mat:'rope',post:'Wave to the passengers',icon:'✈️',e:'✈️'},
 {n:'Stratosphere',lo:15000,hi:50000,sky:['#2b1f6b','#1d3a8a'],wind:3,mat:'rope',post:'Edge of the blue',icon:'🌐',e:'🌐'},
 {n:'Mesosphere',lo:50000,hi:100000,sky:['#0b0818','#2a1650'],wind:1,mat:'star',post:'Shooting-star zone',icon:'☄️',e:'☄️'},
 {n:'Space!',lo:100000,hi:200000,sky:['#020208','#0a0a22'],wind:0,mat:'star',post:'Astro-hippo',icon:'🚀',e:'🚀'}];
const MILES=[[40,'🗼 Water tower'],[330,'🗼 Eiffel Tower'],[828,'🏙️ Burj Khalifa'],[8849,'🏔️ Everest'],[11000,'✈️ Airliners'],[18000,'🛩️ Concorde'],[41000,'🪂 Record skydive'],[100000,'🚀 Kármán line']];
const bandOf=h=>{let i=0;while(i<7&&h>=BANDS[i+1].lo)i++;return i};
// world px of an altitude (log within each band, linear in band 1)
function Y(h,BP){if(h<=0)return 0;const i=bandOf(h),b=BANDS[i];const f=i===0?h/b.hi:Math.log(h/b.lo)/Math.log(b.hi/b.lo);return BP*(i+f)}
function H(y,BP){if(y<=0)return 0;let i=Math.floor(y/BP),f=y/BP-i;if(i>7){f+=i-7;i=7}const b=BANDS[i];return i===0?f*b.hi:b.lo*Math.pow(b.hi/b.lo,f)}
// ---- props (svg strings) ----
const sv=(w,h,body,vb)=>`<svg viewBox="${vb||`0 0 ${w} ${h}`}" width="${w}" height="${h}">${body}</svg>`;
const P={
 tower:()=>sv(120,190,`<g ${S}><path d="M30 190 L45 80 M90 190 L75 80 M38 140 H82 M34 165 L86 120 M86 165 L34 120" fill="none"/><rect x="18" y="30" width="84" height="56" rx="20" fill="#f6d7a0"/><path d="M14 34 Q60 0 106 34Z" fill="#c0305f"/></g><text x="60" y="66" font-family="Fredoka" font-weight="700" font-size="17" fill="${K}" text-anchor="middle">FLOPPR</text>`),
 cart:()=>sv(90,60,`<g ${S}><rect x="10" y="22" width="66" height="22" rx="8" fill="#fff8ec"/><path d="M18 22 V6 H64 V22" fill="none"/><rect x="14" y="4" width="54" height="6" rx="3" fill="#8fe3c8"/><circle cx="24" cy="48" r="8" fill="#555"/><circle cx="64" cy="48" r="8" fill="#555"/></g>`),
 crew:()=>sv(80,70,`<g ${S}><circle cx="20" cy="18" r="9" fill="#f2c79a"/><path d="M10 64 V36 Q20 28 30 36 V64Z" fill="#ffd36e"/><path d="M30 38 L40 16" class="waveArm"/><circle cx="58" cy="22" r="9" fill="#c98f6b"/><path d="M48 66 V40 Q58 32 68 40 V66Z" fill="#8fe3c8"/><rect x="50" y="10" width="16" height="6" rx="2" fill="#c0305f"/></g>`),
 billboard:()=>sv(170,140,`<g ${S}><path d="M50 140 V90 M120 140 V90" fill="none"/><rect x="6" y="6" width="158" height="88" rx="10" fill="#fff8ec"/><rect x="16" y="16" width="56" height="68" rx="6" fill="#a9d8f5"/><circle cx="44" cy="42" r="12" fill="#c7b5f2"/><path d="M30 72 Q44 58 58 72" fill="none"/></g><text x="118" y="46" font-family="Fredoka" font-weight="700" font-size="20" fill="#c0305f" text-anchor="middle">BIG FLOP</text><text x="118" y="78" font-family="Fredoka" font-weight="700" font-size="30" fill="${K}" text-anchor="middle">2</text>`),
 hollywood:()=>sv(260,90,`<path d="M0 90 Q60 20 130 40 T260 60 V90Z" fill="#8a5f9a" ${S}/><text x="130" y="58" font-family="Fredoka" font-weight="700" font-size="26" fill="#fff8ec" stroke="${K}" stroke-width="1.5" text-anchor="middle" letter-spacing="2">FLOPPRWOOD</text>`),
 pigeons:()=>sv(90,40,`<g ${S} stroke-width="3" fill="none"><path d="M4 20 Q12 8 20 20 Q28 8 36 20"/><path d="M50 30 Q56 22 62 30 Q68 22 74 30"/><path d="M62 10 Q66 4 70 10 Q74 4 78 10"/></g>`),
 heli:()=>sv(130,80,`<g ${S}><rect class="rotor" x="10" y="6" width="100" height="6" rx="3" fill="#fff8ec"/><path d="M60 12 V20" fill="none"/><path d="M30 24 Q60 18 82 30 Q90 52 66 56 H40 Q24 52 30 24Z" fill="#ffd36e"/><path d="M82 36 H122 L126 26" fill="none"/><circle cx="52" cy="38" r="9" fill="#a9d8f5"/><path d="M36 64 H78" fill="none"/></g><text x="60" y="52" font-family="Fredoka" font-size="9" font-weight="700" fill="${K}" text-anchor="middle">NEWS</text>`),
 eiffel:()=>sv(70,150,`<g ${S} fill="none"><path d="M8 150 Q30 90 33 10 M62 150 Q40 90 37 10 M18 110 H52 M24 70 H46"/><path d="M22 150 Q35 124 48 150" /></g>`),
 cloud:(w=180)=>sv(w,w*.42,`<path d="M20 70 Q4 70 6 54 Q8 38 28 40 Q30 14 60 16 Q80 0 104 16 Q130 6 144 30 Q172 30 172 52 Q172 72 150 72Z" fill="#fff" ${S} stroke-width="3"/>`,'0 0 180 76'),
 balloon:(c='#ff7aa2')=>sv(80,120,`<g ${S}><path d="M40 4 C78 4 80 52 50 78 H30 C0 52 2 4 40 4Z" fill="${c}"/><path d="M40 4 C54 20 54 60 46 78 M40 4 C26 20 26 60 34 78" fill="none" stroke-width="3"/><path d="M32 78 L30 96 M48 78 L50 96" fill="none" stroke-width="3"/><rect x="28" y="96" width="24" height="18" rx="4" fill="#c98f6b"/></g>`),
 blimp:()=>sv(200,90,`<g ${S}><ellipse cx="96" cy="40" rx="88" ry="32" fill="#c7b5f2"/><path d="M176 40 L196 18 V62Z" fill="#ff7aa2"/><rect x="76" y="70" width="40" height="14" rx="5" fill="#fff8ec"/></g><text x="96" y="49" font-family="Fredoka" font-weight="700" font-size="24" fill="${K}" text-anchor="middle">FLOPPR</text>`),
 geese:()=>sv(120,60,`<g ${S} stroke-width="3" fill="none"><path d="M10 10 q5-6 10 0 q5-6 10 0"/><path d="M30 22 q5-6 10 0 q5-6 10 0"/><path d="M50 34 q5-6 10 0 q5-6 10 0"/><path d="M70 22 q5-6 10 0 q5-6 10 0"/><path d="M90 10 q5-6 10 0 q5-6 10 0"/></g>`),
 peaks:()=>sv(900,300,`<g ${S}><path d="M0 300 L170 70 L280 190 L430 20 L600 220 L700 120 L900 300Z" fill="#6c7aa6"/><path d="M130 124 L170 70 L210 124 Q190 112 170 126 Q150 112 130 124Z M384 86 L430 20 L478 86 Q452 74 430 90 Q408 74 384 86Z M670 160 L700 120 L730 160 Q714 150 700 162 Q686 150 670 160Z" fill="#fff8ec" stroke-width="3"/></g>`,'0 0 900 300'),
 thunder:()=>sv(240,170,`<g class="storm"><path d="M30 120 Q0 118 6 90 Q14 64 44 70 Q48 30 92 32 Q118 2 156 26 Q196 18 206 58 Q240 64 232 98 Q226 124 196 122Z" fill="#5a6488" ${S}/><path class="bolt" d="M120 118 L106 146 H122 L110 168" fill="none" stroke="#ffe48a" stroke-width="5" stroke-linecap="round"/></g>`),
 goat:()=>sv(110,90,`<g ${S}><path d="M0 90 Q30 56 60 62 Q90 58 110 90Z" fill="#8b8fa8"/><ellipse cx="54" cy="40" rx="22" ry="13" fill="#fff8ec"/><path d="M40 50 V62 M66 50 V62" fill="none"/><circle cx="76" cy="28" r="9" fill="#fff8ec"/><path d="M72 20 Q66 8 74 6 M80 20 Q86 8 80 6" fill="none" stroke-width="3"/></g>`),
 plane:(dir=1)=>sv(220,70,`<g transform="${dir<0?'translate(220 0) scale(-1 1)':''}"><path d="M0 36 H60" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8"/><g ${S}><path d="M60 30 Q130 22 196 28 Q214 32 196 42 Q130 46 60 42Z" fill="#fff8ec"/><path d="M120 34 L96 62 H110 L146 36Z" fill="#a9d8f5"/><path d="M68 30 L58 10 H70 L86 30Z" fill="#ff7aa2"/></g><g fill="#2d2350">${[100,114,128,142,156,170].map(x=>`<circle cx="${x}" cy="33" r="3"/>`).join('')}</g></g>`),
 ribbon:()=>sv(300,60,`<path d="M0 30 Q40 10 80 30 T160 30 T240 30 T300 30" fill="none" stroke="#c9e6ff" stroke-width="6" stroke-linecap="round" opacity=".7"/><path d="M20 44 Q60 26 100 44 T180 44 T260 44" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`),
 wballoon:()=>sv(70,130,`<g ${S}><circle cx="35" cy="34" r="30" fill="#fff8ec"/><path d="M35 64 V108" fill="none" stroke-width="2"/><rect x="25" y="108" width="20" height="16" rx="3" fill="#ffd36e"/></g>`),
 concorde:()=>sv(220,60,`<g ${S}><path d="M4 32 Q20 26 160 26 L214 32 L160 38 Q20 38 4 32Z" fill="#fff8ec"/><path d="M90 32 L150 32 L120 54Z" fill="#c7b5f2"/><path d="M150 28 L170 8 H178 L168 28Z" fill="#c7b5f2"/></g>`),
 arc:()=>sv(1400,260,`<path d="M-100 260 Q700 -40 1500 260" fill="#2e5fb8" opacity=".55"/><path d="M-100 260 Q700 -40 1500 260" fill="none" stroke="#8fd4ff" stroke-width="10" opacity=".55"/>`,'0 0 1400 260'),
 nlc:()=>sv(320,80,`<g fill="none" stroke="#9fe8fa" stroke-linecap="round" opacity=".7"><path d="M0 30 Q40 10 80 30 T160 30 T240 30 T320 30" stroke-width="4"/><path d="M10 50 Q50 34 90 50 T170 50 T250 50" stroke-width="3"/><path d="M30 66 Q70 54 110 66 T190 66" stroke-width="2"/></g>`),
 aurora:()=>`<div class="aurora"><i></i><i></i><i></i></div>`,
 meteor:()=>sv(160,90,`<path d="M10 10 L120 70" stroke="#ffd36e" stroke-width="5" stroke-linecap="round" opacity=".6"/><circle cx="124" cy="72" r="9" fill="#ffb38a" ${S} stroke-width="3"/>`),
 karman:()=>sv(330,70,`<g ${S}><path d="M10 14 H320 L306 36 L320 58 H10 L24 36Z" fill="#ffd36e"/></g><text x="165" y="44" font-family="Fredoka" font-weight="700" font-size="21" fill="${K}" text-anchor="middle">KÁRMÁN LINE · 100 KM · SPACE!</text>`),
 sat:()=>sv(140,70,`<g ${S}><rect x="4" y="22" width="44" height="26" fill="#6aa0e0"/><rect x="92" y="22" width="44" height="26" fill="#6aa0e0"/><path d="M48 35 H92" fill="none"/><rect x="58" y="20" width="24" height="30" rx="4" fill="#ffd36e"/><path d="M70 20 V6" fill="none"/><circle cx="70" cy="6" r="4" fill="#ff7aa2"/></g>`),
 iss:()=>sv(220,90,`<g ${S}><rect x="90" y="36" width="40" height="18" rx="4" fill="#fff8ec"/><path d="M20 45 H200" fill="none"/>${[10,40,150,180].map(x=>`<rect x="${x}" y="8" width="26" height="74" fill="#5a8ad0" stroke-width="3"/>`).join('')}</g>`),
 earth:()=>sv(1600,400,`<ellipse cx="800" cy="620" rx="1100" ry="460" fill="#3b78d8" stroke="#8fd4ff" stroke-width="16"/><path d="M200 300 Q320 230 470 260 Q520 300 420 330Z M900 220 Q1050 190 1150 250 Q1080 300 960 280Z" fill="#6cc48a"/>`,'0 0 1600 400'),
 moon:()=>`<div class="bigMoon"></div>`
};
// placement table: [band, altitude(m), x%, prop, layer('n' near | 'f' far | 'front'), extra class]
const PLACE=[
 [0,0,0,'cart','n','grounded'],[0,0,1,'crew','n','grounded'],[0,0,0,'tower','n','grounded'],
 [1,230,6,'pigeons','n'],[1,300,44,'billboard','n'],[1,240,52,'hollywood','f'],[1,560,52,'heli','n','bobble'],[1,330,2,'eiffel','n'],
 [2,1000,40,'cloud','front'],[2,1250,48,'balloon','n','bobble'],[2,1650,36,'blimp','n','drift2'],[2,1900,4,'cloud','n'],[2,2200,6,'balloon2','n','bobble'],[2,2500,44,'cloud','front'],[2,2700,50,'geese','n','drift2'],
 [3,4200,0,'peaks','f','wide'],[3,5000,40,'goat','n'],[3,6200,42,'thunder','n'],[3,3600,6,'cloud','n'],
 [4,9300,40,'plane','n','drift2'],[4,11000,2,'ribbon','n'],[4,12800,6,'plane2','n','drift3'],
 [5,18000,6,'concorde','n','drift2'],[5,24000,44,'wballoon','n','bobble'],[5,30000,0,'arc','f','wide'],[5,40000,40,'wballoon','n','bobble'],
 [6,58000,36,'nlc','n'],[6,72000,0,'aurora','f','wide'],[6,85000,46,'meteor','n','zoom'],
 [7,100000,34,'karman','n'],[7,125000,46,'sat','n','drift2'],[7,150000,4,'iss','n','drift3'],[7,130000,0,'earth','f','wide'],[7,175000,58,'moon','f']];
function build(nearEl,farEl,frontEl,BP,FF){
 const near=[],far=[],front=[];
 for(const [b,h,x,k,l,cls] of PLACE){const key=k.replace(/\d$/,''),html=key==='balloon'&&k.endsWith('2')?P.balloon('#8fe3c8'):key==='plane'&&k.endsWith('2')?P.plane(-1):P[key]();
  const y=Y(Math.max(h,0),BP),c=`prop p-${key} ${cls||''}`;
  if(l==='f'){// far layer moves at FF of camera; place so it's on screen when camera is around y
   const st=BP/1.25,yy=FF*(y-.5*st)+(cls==="wide"?.05:.3)*st;far.push(`<div class="${c}" data-b="${b}" style="left:${x}%;bottom:calc(var(--base) + ${yy.toFixed(0)}px)">${html}</div>`)}
  else(l==='front'?front:near).push(`<div class="${c}" style="left:${x}%;bottom:calc(var(--base) + ${y.toFixed(0)}px)">${html}</div>`)}
 nearEl.innerHTML=near.join('');farEl.innerHTML=far.join('');frontEl.innerHTML=front.join('')}
function skyAt(pos){// pos = continuous band position
 const i=Math.max(0,Math.min(7,Math.floor(pos))),t=Math.max(0,Math.min(1,pos-i)),a=BANDS[i].sky,b=BANDS[Math.min(7,i+1)].sky;
 // blend only in the last 35% of a band so each band reads clearly
 const k=t<.65?0:(t-.65)/.35,mix=(c1,c2)=>{const p=c=>[1,3,5].map(j=>parseInt(c.slice(j,j+2),16));const A=p(c1),B=p(c2);return`rgb(${A.map((v,j)=>Math.round(v+(B[j]-v)*k)).join(',')})`};
 return[mix(a[0],b[0]),mix(a[1],b[1])]}
return{BANDS,MILES,bandOf,Y,H,build,skyAt,P}})();
