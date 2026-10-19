// Floppr v2/v3: single canvas FX layer (no DOM particles) + trauma shake helpers.
window.FlopFX=(()=>{
let cv,cx,W=0,H=0,dpr=1;const P=[];const C=['#ff7aa2','#ffd36e','#8fe3c8','#a9d8f5','#c7b5f2'];
function init(el){cv=el;cx=cv.getContext('2d');resize()}
function resize(){dpr=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px'}
const R=(a,b)=>a+Math.random()*(b-a);
function add(p){if(P.length<600)P.push(Object.assign({t:0,life:1.4,vx:0,vy:0,g:0,rot:0,vr:0,s:8,a:1},p))}
const api={
 confetti(x,y,n=40){for(let i=0;i<n;i++){const a=R(0,6.283),sp=R(150,520);add({k:'conf',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-260,g:620,rot:R(0,6),vr:R(-12,12),c:C[i%5],life:R(1.1,1.9),s:R(7,11),drag:1.6})}},
 sparkle(x,y,n=6,c='#ffd36e'){for(let i=0;i<n;i++)add({k:'star',x:x+R(-70,70),y:y+R(-60,20),vy:R(-50,-20),life:R(.7,1.1),s:R(7,12),c,delay:i*.06})},
 drops(x,y,n=30,pow=1){for(let i=0;i<n;i++){const sp=R(.4,1);add({k:'drop',x:x+R(-20,20),y,vx:R(-1,1)*260*pow,vy:-R(220,560)*pow*sp,g:900,life:R(1,1.6),s:R(5,10)})}},
 ring(x,y,w=200,delay=0){add({k:'ring',x,y,life:1,s:w,delay})},
 streak(n,dir=1,yMax){for(let i=0;i<n;i++){const y=R(60,yMax||H*.7);add({k:'streak',x:dir>0?R(-200,W*.3):R(W*.7,W+200),y,vx:dir*R(700,1100),life:R(.5,.9),s:R(40,110)})}},
 speed(n){for(let i=0;i<n;i++)add({k:'speed',x:R(0,W),y:R(-40,H*.4),vy:R(900,1500),life:.5,s:R(50,120)})},
 meteor(){add({k:'meteor',x:R(W*.2,W),y:R(0,H*.4),vx:-R(500,800),vy:R(250,400),life:R(.7,1.1),s:R(60,120)})},
 ember(x,y,n=2){for(let i=0;i<n;i++)add({k:'ember',x:x+R(-14,14),y:y+R(-10,10),vx:R(-40,40),vy:R(-160,-60),life:R(.35,.7),s:R(4,9),c:Math.random()<.5?'#ffb34d':'#ff6a3d'})},
 snow(n){for(let i=0;i<n;i++)add({k:'snow',x:R(0,W),y:R(-20,H*.5),vx:R(-30,30),vy:R(40,90),life:R(2,3.5),s:R(2,4)})},
 count:()=>P.length,clear:()=>P.length=0,resize,init};
function step(dt){if(!cx)return;cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
 for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=dt;continue}p.t+=dt;if(p.t>=p.life){P.splice(i,1);continue}
  if(p.drag){p.vx*=1-Math.min(1,p.drag*dt*.5)}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;const u=p.t/p.life,al=u>.7?(1-u)/.3:1;cx.globalAlpha=al;
  switch(p.k){
  case'conf':cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s*.7,p.s,p.s*1.4);cx.restore();break;
  case'star':{const s=p.s*(u<.3?u/.3:1);cx.fillStyle=p.c;cx.strokeStyle='#2d2350';cx.lineWidth=2;cx.beginPath();for(let k=0;k<8;k++){const r=k%2?s*.42:s,a=k*Math.PI/4-Math.PI/2;cx.lineTo(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r)}cx.closePath();cx.fill();cx.stroke();break}
  case'drop':cx.fillStyle='#9fe8fa';cx.strokeStyle='#2d2350';cx.lineWidth=2;cx.beginPath();cx.arc(p.x,p.y,p.s,0,6.283);cx.fill();cx.stroke();break;
  case'ring':{const w=p.s*(.15+.85*Math.sqrt(u));cx.strokeStyle='#e6fbff';cx.lineWidth=4;cx.beginPath();cx.ellipse(p.x,p.y,w/2,w*.15,0,0,6.283);cx.stroke();break}
  case'streak':case'speed':case'meteor':{const vx=p.vx,vy=p.vy,m=Math.hypot(vx,vy)||1;cx.strokeStyle=p.k==='meteor'?'#ffd36e':'rgba(255,255,255,.75)';cx.lineWidth=p.k==='meteor'?4:2.5;cx.lineCap='round';cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-vx/m*p.s,p.y-vy/m*p.s);cx.stroke();break}
  case'ember':{const s=p.s*(1-u*.6);cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,s,0,6.283);cx.fill();cx.fillStyle='#fff3c8';cx.beginPath();cx.arc(p.x,p.y,s*.4,0,6.283);cx.fill();break}
  case'snow':cx.fillStyle='#fff';cx.beginPath();cx.arc(p.x,p.y,p.s,0,6.283);cx.fill();break}}
 cx.globalAlpha=1}
api.step=step;
// smooth 1D value noise in [-1,1]
const NT=Array.from({length:256},()=>Math.random()*2-1);
api.noise=x=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return NT[i&255]*(1-u)+NT[(i+1)&255]*u};
return api})();
