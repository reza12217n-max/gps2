'use strict';
const $=s=>document.querySelector(s);
const Cap=window.Capacitor,PL=(Cap&&Cap.Plugins)||{};
const CapG=PL.Geolocation,CapFS=PL.Filesystem,CapShare=PL.Share,CapApp=PL.App;
const fa=(n,d=0)=>Number(n).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d});
const m2=x=>fa(x,2)+' متر',A2=x=>fa(x,2)+' متر مربع';
function mcm(x){let m=Math.floor(x),c=Math.round((x-m)*100);if(c>=100){m++;c=0}return fa(m)+' متر'+(c?' و '+fa(c)+' سانت':'')}
const num=s=>parseFloat(String(s).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٫,،]/g,'.').replace(/[^\d.\-]/g,''));
const ld=(k,def)=>{try{return JSON.parse(localStorage.getItem(k))||def}catch(e){return def}};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ic=n=>`<svg class="ic"><use href="#i-${n}"/></svg>`;
const rad=Math.PI/180,FONT='Vazirmatn,system-ui,sans-serif';
const COLORS=['#e53935','#1e88e5','#43a047','#fb8c00','#8e24aa','#00acc1','#6d4c41','#546e7a'];
const DIRS=['شمال','شمال‌شرق','شرق','جنوب‌شرق','جنوب','جنوب‌غرب','غرب','شمال‌غرب'];
const dirName=b=>DIRS[Math.round(b/45)%8];
const TAGS={main:{n:'معبر اصلی',c:'#ef4444'},side:{n:'معبر فرعی',c:'#f59e0b'},nb:{n:'همسایه',c:'#a855f7'}};
const key=ll=>ll[0].toFixed(7)+','+ll[1].toFixed(7);

/* ---------- حالت برنامه ---------- */
let S=Object.assign({avg:5,maxAcc:15,map:'sat',dims:true,arrive:2,sound:true,voice:true,walkTol:2,step:1},ld('settings',{}));
let lands=ld('lands',[]);
lands.forEach(l=>{l.staked=l.staked||[];l.tags=l.tags||[];l.meas=l.meas||{}});
function newLand(){const l={id:Date.now().toString(36),name:'زمین '+fa(lands.length+1),pts:[],tags:[],staked:[],meas:{},closed:false,split:null,created:Date.now()};lands.push(l);return l}
let land=lands.find(l=>l.id===localStorage.getItem('cur'))||lands[0]||newLand();
let M=null,me=null,target=null,follow=false,busy=false,curPanel=null,tagging=false;
let manual=false,draft=null,sel=null,stake=null,blink=true,walk=null,walkMode=false,drawMode=false,insMode=false,strMode=false,strA=null,drag=null,hist=[],wid=null,lpT=null,calibPick=false,calibSkip=false;
function save(){try{localStorage.setItem('lands',JSON.stringify(lands));localStorage.setItem('cur',land.id);localStorage.setItem('settings',JSON.stringify(S));return true}catch(e){toast('حافظه‌ی گوشی پر شده؛ از زمین‌ها پشتیبان بگیر');return false}}
function tagsFix(){const n=land.pts.length;land.tags=(land.tags||[]).slice(0,n);while(land.tags.length<n)land.tags.push('')}
function ptPush(p){land.pts.push(p);tagsFix()}
function ptRemove(i){land.pts.splice(i,1);if(land.tags)land.tags.splice(i,1);tagsFix();land.meas={}}
function ptInsert(i,p){land.pts.splice(i,0,p);if(!land.tags)land.tags=[];land.tags.splice(i,0,land.tags[i-1]||'');tagsFix();land.meas={}}
function histPush(){hist.push(JSON.stringify({p:land.pts,t:land.tags,c:land.closed}));if(hist.length>10)hist.shift()}
function histUndo(){const h=hist.pop();if(!h)return false;const o=JSON.parse(h);land.pts=o.p;land.tags=o.t;land.closed=o.c;land.meas={};changed();return true}
async function straightenAsk(a,b){const n=land.pts.length,cl=land.closed;let i0,i1;
 if(cl){const fw=(b-a+n)%n;if(n-fw<fw){i0=b;i1=a}else{i0=a;i1=b}}else{i0=Math.min(a,b);i1=Math.max(a,b)}
 const steps=cl?((i1-i0+n)%n):(i1-i0);
 if(steps<2){toast('بین این دو نقطه، نقطه‌ای نیست');updateMode();redraw();return}
 if(!await dlg({msg:`${fa(steps-1)} نقطه‌ی بین نقطه‌ی ${fa(i0+1)} و ${fa(i1+1)} روی خط راست بین این دو قرار بگیرن؟ بعدش هرکدوم رو می‌تونی جدا جابه‌جا کنی.`,yes:'صاف کن',no:'نه'})){updateMode();redraw();return}
 histPush();const{zone,south,utm}=utmOf(land.pts),idx=[];for(let k=0;k<=steps;k++)idx.push((i0+k)%n);
 const cum=[0];for(let k=1;k<=steps;k++)cum.push(cum[k-1]+Geo.dist(utm[idx[k-1]],utm[idx[k]]));
 const T=cum[steps]||1,A=utm[idx[0]],B=utm[idx[steps]];
 for(let k=1;k<steps;k++){const t=cum[k]/T,u=[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t],ll=Geo.fromUTM(u[0],u[1],zone,south),p=land.pts[idx[k]];p.lat=ll[0];p.lng=ll[1];p.moved=true}
 land.meas={};changed();updateMode();toast('صاف شد؛ نقطه‌های جابه‌جاشده نارنجی‌ان')}
const pname=i=>(land.split&&land.split.names&&land.split.names[i])||('قطعه '+fa(i+1));
function utmOf(pts){const zone=Geo.zoneOf(pts.reduce((s,p)=>s+p.lng,0)/pts.length),south=pts[0].lat<0;
 return{zone,south,utm:pts.map(p=>Geo.toUTM(p.lat,p.lng,zone))}}
function areaOf(l){if(!l.closed||l.pts.length<3)return 0;return Geo.area(utmOf(l.pts).utm)}
function cutPts(parts,utm){const out=[];parts.forEach(q=>q.forEach(p=>{if(utm.some(u=>Geo.dist(u,p)<.05)||out.some(u=>Geo.dist(u,p)<.05))return;out.push(p)}));return out}
function applyCand(m,c){m.angUsed=c.ang;m.layoutUsed=c.layout;m.parts=c.parts;m.eval=c.e;m.cuts=cutPts(c.parts,m.utm);
 const back=q=>Geo.fromUTM(q[0],q[1],m.zone,m.south);m.partsLL=m.parts.map(q=>q.map(back));m.cutsLL=m.cuts.map(back);return m}
function build(){
 tagsFix();const pts=land.pts;if(!pts.length)return M=null;
 const{zone,south,utm}=utmOf(pts);
 const m={name:land.name,pts,utm,zone,south,tags:land.tags.slice(),closed:land.closed&&pts.length>=3,ll:pts.map(p=>[p.lat,p.lng])};
 if(m.closed){m.area=Geo.area(utm);m.perim=Geo.perim(utm,true);m.cross=Geo.selfIntersects(utm);
  if(land.split){const s=land.split,tg=s.roads===false?m.tags.map(()=>''):m.tags;
   const sum=s.shares?s.shares.reduce((a,b)=>a+b,0):0,fr=s.shares?s.shares.map(x=>x/sum):null;
   const vf=(s.vk>1&&tg.includes('main'))?Geo.makeVF(utm,tg,s.vk,s.vd||25):null;
   const cands=Geo.candidates(utm,s.n,tg,{ang:s.ang,layout:s.layout||'auto',fr,vf});
   m.cands=cands;m.vf=vf;m.names=Array.from({length:s.n},(_,i)=>pname(i));m.shares=s.shares;
   applyCand(m,cands[Math.min(s.pick||0,cands.length-1)]);if(vf)m.vals=m.parts.map(q=>vf(q))}}
 else m.perim=pts.length>1?Geo.perim(utm,false):0;
 return M=m}
function modelWith(c){return applyCand(Object.assign({},M),c)}

/* ---------- نقشه ---------- */
const cv=$('#map'),ctx=cv.getContext('2d');
let W=300,H=300,dpr=1,V={lat:32,lng:53,z:5},raf=0,INS={t:80,b:220};
const CX=()=>W/2,CY=()=>INS.t+(H-INS.t-INS.b)/2;
const wp=(lat,lng,z)=>{const w=256*2**z,s=Math.sin(lat*rad);return[(lng+180)/360*w,(.5-Math.log((1+s)/(1-s))/(4*Math.PI))*w]};
const wi=(x,y,z)=>{const w=256*2**z;return[Math.atan(Math.sinh(Math.PI*(1-2*y/w)))/rad,x/w*360-180]};
function resize(){const r=cv.parentElement.getBoundingClientRect();if(r.width<10||r.height<10)return;
 dpr=window.devicePixelRatio||1;W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+'px';cv.style.height=H+'px';
 const ab=$('#appbar'),dk=$('#dock');INS.t=ab.offsetHeight+ab.offsetTop+14;INS.b=dk.offsetHeight+60;
 document.documentElement.style.setProperty('--dock-h',dk.offsetHeight+'px');redraw()}
function redraw(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;draw(ctx,W,H,V,{tiles:true,dpr,cx:CX(),cy:CY()})})}
/* کاشی‌ها: اگه کاشی زوم بالا نبود، از کاشی زوم پایین‌تر بزرگ‌نمایی می‌کنیم */
const tiles=new Map();
function isPlaceholder(img){try{const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');x.drawImage(img,0,0,16,16);const d=x.getImageData(0,0,16,16).data;
 const r0=d[0],g0=d[1],b0=d[2];let n=0;for(let i=0;i<d.length;i+=4)if(Math.abs(d[i]-r0)<14&&Math.abs(d[i+1]-g0)<14&&Math.abs(d[i+2]-b0)<14)n++;
 return n>=230&&Math.abs(r0-g0)<8&&Math.abs(g0-b0)<8&&r0>185&&r0<252}catch(e){return false}}
const tileUrl=(type,z,x,y)=>`https://server.arcgisonline.com/ArcGIS/rest/services/${type}/MapServer/tile/${z}/${y}/${x}`;
async function loadTile(t,type,z,x,y){const url=tileUrl(type,z,x,y),done=ok=>{t.st=2;t.ok=ok;redraw()};
 try{let f=null;const ca=window.caches?await caches.open('tiles-v1'):null;
  if(ca){f=await ca.match(url);if(!f){const r=await fetch(url);if(!r.ok)throw 0;await ca.put(url,r.clone());f=r}}else{f=await fetch(url);if(!f.ok)throw 0}
  const bl=await f.blob();t.img.onload=()=>done(!isPlaceholder(t.img));t.img.onerror=()=>done(false);t.img.src=URL.createObjectURL(bl)}
 catch(e){t.img.onload=()=>done(true);t.img.onerror=()=>done(false);t.img.src=url}}
function tileObj(type,z,x,y){const k=type+z+'/'+x+'/'+y;let t=tiles.get(k);
 if(!t){t={img:new Image(),ok:false,st:1};tiles.set(k,t);loadTile(t,type,z,x,y);if(tiles.size>500){const o=tiles.keys().next().value;tiles.delete(o)}}return t}
function paintTile(c,type,z,x,y,dx,dy,size){
 const t=tileObj(type,z,x,y);if(t.st===2&&t.ok){c.drawImage(t.img,dx,dy,size+.6,size+.6);return}
 for(let L=1;L<=6&&z-L>=0;L++){const k=type+(z-L)+'/'+(x>>L)+'/'+(y>>L);let a=tiles.get(k);
  if(!a){if(t.st===2)a=tileObj(type,z-L,x>>L,y>>L);else continue}
  if(a.st===2&&a.ok){const sw=256/2**L,sx=(x&((1<<L)-1))*sw,sy=(y&((1<<L)-1))*sw;c.drawImage(a.img,sx,sy,sw,sw,dx,dy,size+.6,size+.6);return}
  if(a.st!==2)return}}
function drawTiles(c,w,h,v,C,cx,cy,fs){
 const type=(fs||S.map==='sat')?'World_Imagery':'World_Street_Map',tz=clamp(Math.floor(v.z),1,19),size=256*2**(v.z-tz),mx=2**tz;
 for(let ty=Math.floor((C[1]-cy)/size);ty<=Math.floor((C[1]+h-cy)/size);ty++)for(let tx=Math.floor((C[0]-cx)/size);tx<=Math.floor((C[0]+w-cx)/size);tx++){
  if(ty<0||ty>=mx)continue;paintTile(c,type,tz,((tx%mx)+mx)%mx,ty,tx*size-C[0]+cx,ty*size-C[1]+cy,size)}}
function draw(c,w,h,v,o){c.save();const a=o.dpr||1;c.setTransform(a,0,0,a,o.ox||0,o.oy||0);if(o.clip){c.beginPath();c.rect(0,0,w,h);c.clip()}drawIn(c,w,h,v,o);c.restore()}
function drawIn(c,w,h,v,o){
 const k=o.k||1,cx=o.cx!=null?o.cx:w/2,cy=o.cy!=null?o.cy:h/2,C=wp(v.lat,v.lng,v.z),pr=(la,ln)=>{const p=wp(la,ln,v.z);return[p[0]-C[0]+cx,p[1]-C[1]+cy]};
 const sat=o.tiles&&!o.tileAlpha&&S.map==='sat',m=o.m||M;
 c.setLineDash([]);c.lineCap='round';c.lineJoin='round';
 c.fillStyle=(o.tiles&&!o.tileAlpha)?(S.map==='none'?'#f1efe6':'#ddd'):'#fff';c.fillRect(0,0,w,h);
 if(o.tiles&&(o.forceSat||S.map!=='none')){c.globalAlpha=o.tileAlpha||1;drawTiles(c,w,h,v,C,cx,cy,o.forceSat);c.globalAlpha=1}
 const tc=sat?'#fff':'#111',hc=sat?'rgba(0,0,0,.75)':'rgba(255,255,255,.9)';
 const lab=(t,x,y,sz,col)=>{c.font=`bold ${(sz||12)*k}px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=3*k;c.strokeStyle=hc;c.strokeText(t,x,y);c.fillStyle=col||tc;c.fillText(t,x,y)};
 const path=a=>{c.beginPath();a.forEach((p,i)=>{const[x,y]=pr(p[0],p[1]);i?c.lineTo(x,y):c.moveTo(x,y)})};
 if(m){
  if(m.parts)m.partsLL.forEach((q,i)=>{path(q);c.closePath();c.fillStyle=COLORS[i%8]+'55';c.fill();c.strokeStyle=COLORS[i%8];c.lineWidth=2*k;c.stroke()});
  if(!o.noMe&&stake&&stake.part!=null&&m.partsLL&&m.partsLL[stake.part]){path(m.partsLL[stake.part]);c.closePath();c.lineWidth=5*k;c.strokeStyle='#fff';c.stroke()}
  path(m.ll);if(m.closed){c.closePath();if(!m.parts){c.fillStyle='rgba(255,193,7,.28)';c.fill()}}
  c.lineWidth=3*k;c.strokeStyle=sat?'#ffeb3b':'#d84315';c.stroke();
  const n=m.ll.length,E=m.closed?n:n-1;
  for(let i=0;i<E;i++){const t=TAGS[m.tags[i]];if(!t)continue;const a=pr(...m.ll[i]),b=pr(...m.ll[(i+1)%n]);
   c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineWidth=(m.tags[i]==='main'?8:6)*k;c.strokeStyle=t.c;c.setLineDash(m.tags[i]==='nb'?[10*k,7*k]:[]);c.stroke();c.setLineDash([]);
   if(!o.mini&&Math.hypot(a[0]-b[0],a[1]-b[1])>80*k)lab(t.n,(a[0]+b[0])/2,(a[1]+b[1])/2-12*k,11,t.c)}
  if(!o.mini&&(S.dims||o.k))for(let i=0;i<E;i++){const a=pr(...m.ll[i]),b=pr(...m.ll[(i+1)%n]);
   if(Math.hypot(a[0]-b[0],a[1]-b[1])>70*k)lab(fa(Geo.dist(m.utm[i],m.utm[(i+1)%n]),2)+' م',(a[0]+b[0])/2,(a[1]+b[1])/2+(m.tags[i]?4*k:0),11)}
  if(m.parts)m.partsLL.forEach((q,i)=>{const ce=Geo.centroid(q.map(p=>pr(p[0],p[1])));
   if(o.mini){lab(fa(i+1),ce[0],ce[1],13);return}
   lab((m.names&&m.names[i])||'قطعه '+fa(i+1),ce[0],ce[1]-9*k,13);lab(fa(Geo.area(m.parts[i]),2)+' م²',ce[0],ce[1]+8*k,12)});
  if(!o.mini)(m.cutsLL||[]).forEach((p,i)=>{const[x,y]=pr(p[0],p[1]);c.fillStyle='#1565c0';c.fillRect(x-5*k,y-5*k,10*k,10*k);lab('ب'+fa(i+1),x,y-14*k,11)});
  if(!o.mini)m.ll.forEach((p,i)=>{const[x,y]=pr(p[0],p[1]),last=i===n-1&&!m.closed;
   c.beginPath();c.arc(x,y,(last?11:9)*k,0,7);c.fillStyle=m.pts[i].moved?'#f97316':last?'#2e7d32':(m.pts[i].manual?'#2563eb':'#e53935');c.fill();c.lineWidth=2*k;c.strokeStyle='#fff';c.stroke();
   c.font=`bold ${11*k}px ${FONT}`;c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(fa(i+1),x,y);
   if(!o.noMe&&sel===i){c.beginPath();c.arc(x,y,17,0,7);c.lineWidth=3;c.strokeStyle='#22d3ee';c.stroke()}
    if(!o.noMe&&drag&&drag.i===i){c.beginPath();c.arc(x,y,24,0,7);c.lineWidth=3;c.strokeStyle='#f97316';c.stroke()}})}
 if(o.noMe)return;
 if(insMode&&m&&m.ll.length>1){const n2=m.ll.length,E2=m.closed?n2:n2-1;for(let i=0;i<E2;i++){const p1=pr(...m.ll[i]),p2=pr(...m.ll[(i+1)%n2]);if(Math.hypot(p1[0]-p2[0],p1[1]-p2[1])<40)continue;const x=(p1[0]+p2[0])/2,y=(p1[1]+p2[1])/2;c.beginPath();c.arc(x,y,13,0,7);c.fillStyle='#16a34a';c.fill();c.lineWidth=2.5;c.strokeStyle='#fff';c.stroke();c.beginPath();c.moveTo(x-6,y);c.lineTo(x+6,y);c.moveTo(x,y-6);c.lineTo(x,y+6);c.stroke()}}
 if(strMode&&strA!=null&&m&&m.ll[strA]){const[x,y]=pr(...m.ll[strA]);c.beginPath();c.arc(x,y,19,0,7);c.lineWidth=4;c.strokeStyle='#a855f7';c.stroke()}
 if(walk&&walk.pts.length>1){path(walk.pts.map(p=>[p.lat,p.lng]));c.lineWidth=4;c.strokeStyle='#22d3ee';c.stroke()}
 if(draft){const[x,y]=pr(draft.lat,draft.lng);c.setLineDash([5,4]);c.lineWidth=2;c.strokeStyle='#22d3ee';c.beginPath();c.arc(x,y,13,0,7);c.stroke();c.setLineDash([]);
  c.beginPath();c.moveTo(x-20,y);c.lineTo(x+20,y);c.moveTo(x,y-20);c.lineTo(x,y+20);c.stroke()}
 if(stake){stake.list.forEach((p,i)=>{const[x,y]=pr(p.lat,p.lng),done=land.staked.includes(p.key),cur=i===stake.cur;
   c.beginPath();c.arc(x,y,cur?15:10,0,7);c.fillStyle=done?'#22c55e':'rgba(0,0,0,.4)';c.fill();c.lineWidth=3;c.strokeStyle=done?'#16a34a':cur?'#ef4444':'#fff';c.stroke();
   if(done){c.beginPath();c.moveTo(x-4,y);c.lineTo(x-1,y+4);c.lineTo(x+5,y-4);c.strokeStyle='#fff';c.lineWidth=2.5;c.stroke()}else lab(fa(i+1),x,y,10)});
  const t=stake.list[stake.cur];if(t&&me){const[a,b]=pr(me.lat,me.lng),[tx,ty]=pr(t.lat,t.lng);c.setLineDash([8,6]);c.lineWidth=2;c.strokeStyle='#ff1744';c.beginPath();c.moveTo(a,b);c.lineTo(tx,ty);c.stroke();c.setLineDash([])}}
 if(me){const[x,y]=pr(me.lat,me.lng),r=me.acc/(156543.03392*Math.cos(me.lat*rad)/2**v.z);
  c.beginPath();c.arc(x,y,Math.max(r,4),0,7);c.fillStyle='rgba(33,150,243,.18)';c.fill();c.lineWidth=1;c.strokeStyle='rgba(33,150,243,.6)';c.stroke();
  if(stake){const on=stake.arrived||blink,col=stake.arrived?'#22c55e':'#f97316';
   c.globalAlpha=on?1:.2;c.beginPath();c.arc(x,y,stake.arrived?20:16,0,7);c.fillStyle=col+'66';c.fill();c.beginPath();c.arc(x,y,9,0,7);c.fillStyle=col;c.fill();c.lineWidth=3;c.strokeStyle='#fff';c.stroke();c.globalAlpha=1}
  else{c.beginPath();c.arc(x,y,7,0,7);c.fillStyle='#1e88e5';c.fill();c.lineWidth=3;c.strokeStyle='#fff';c.stroke()}
  if(target&&!stake){const[tx,ty]=pr(target.lat,target.lng);c.setLineDash([8,6]);c.lineWidth=2;c.strokeStyle='#ff1744';c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();c.setLineDash([])}}
 if(target&&!stake){const[tx,ty]=pr(target.lat,target.lng);c.beginPath();c.arc(tx,ty,16,0,7);c.lineWidth=3;c.strokeStyle='#ff1744';c.stroke()}
}
function fitView(w,h,pad,t,b,m){m=m||M;t=t||0;b=b||0;
 const pts=m?m.ll:(me?[[me.lat,me.lng]]:[]);if(!pts.length)return null;
 const q=pts.map(p=>wp(p[0],p[1],0)),xs=q.map(a=>a[0]),ys=q.map(a=>a[1]);
 const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),[la,ln]=wi((x0+x1)/2,(y0+y1)/2,0);
 let z=19;if(x1-x0>0||y1-y0>0)z=Math.log2(Math.min((w-2*pad)/Math.max(x1-x0,1e-9),(h-t-b-2*pad)/Math.max(y1-y0,1e-9)));
 return{lat:la,lng:ln,z:clamp(z,2,19)}}
function fit(){const v=fitView(W,H,40,INS.t,INS.b);if(v)V=v;redraw()}
function panBy(dx,dy){const C=wp(V.lat,V.lng,V.z);[V.lat,V.lng]=wi(C[0]-dx,C[1]-dy,V.z);redraw()}
function zoomAt(dz,sx,sy){const C=wp(V.lat,V.lng,V.z),[la,ln]=wi(C[0]+sx-CX(),C[1]+sy-CY(),V.z);V.z=clamp(V.z+dz,2,21);
 const p=wp(la,ln,V.z);[V.lat,V.lng]=wi(p[0]-(sx-CX()),p[1]-(sy-CY()),V.z);redraw()}
function unproj(x,y){const C=wp(V.lat,V.lng,V.z);return wi(C[0]+x-CX(),C[1]+y-CY(),V.z)}
function toScr(la,ln){const C=wp(V.lat,V.lng,V.z),p=wp(la,ln,V.z);return[p[0]-C[0]+CX(),p[1]-C[1]+CY()]}
function dseg(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L:0;t=clamp(t,0,1);return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
const ptrs=new Map(),loc=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
let tapS=null;
function hitPt(x,y){const m=M;if(!m)return -1;let bi=-1,bd=28;for(let i=0;i<m.ll.length;i++){const s=toScr(...m.ll[i]),d=Math.hypot(s[0]-x,s[1]-y);if(d<bd){bd=d;bi=i}}return bi}
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);const l=loc(e);ptrs.set(e.pointerId,l);tapS=ptrs.size>1?{multi:true}:{p:l,t:Date.now(),moved:false};clearTimeout(lpT);
 if(ptrs.size===1&&!stake&&!walk&&!busy&&!draft&&!calibPick&&!insMode&&!strMode){const i=hitPt(l[0],l[1]);
  if(i>=0)lpT=setTimeout(()=>{if(tapS&&tapS.p&&!tapS.moved&&ptrs.size===1&&M&&M.ll[i]){const s=toScr(...M.ll[i]);histPush();drag={i,dx:s[0]-l[0],dy:s[1]-l[1]};sel=null;if(navigator.vibrate)navigator.vibrate(40);toast('نقطه‌ی '+fa(i+1)+' برداشته شد؛ بکش و رها کن');redraw()}},450)}
 if(typeof collapseTools==='function')collapseTools()});
cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const o=ptrs.get(e.pointerId),n=loc(e);
 if(drag){const[la,ln]=unproj(n[0]+drag.dx,n[1]+drag.dy),p=land.pts[drag.i];if(p){p.lat=la;p.lng=ln;p.moved=true;if(M&&M.ll[drag.i]){M.ll[drag.i]=[la,ln];if(M.utm)M.utm[drag.i]=Geo.toUTM(la,ln,M.zone)}}ptrs.set(e.pointerId,n);redraw();return}
 if(tapS&&tapS.p&&Math.hypot(n[0]-tapS.p[0],n[1]-tapS.p[1])>8)tapS.moved=true;
 if(ptrs.size===1){if(tapS&&tapS.moved){follow=false;panBy(n[0]-o[0],n[1]-o[1])}}
 else if(ptrs.size===2){follow=false;const ot=[...ptrs.entries()].find(([id])=>id!==e.pointerId)[1],d0=Math.hypot(o[0]-ot[0],o[1]-ot[1]),d1=Math.hypot(n[0]-ot[0],n[1]-ot[1]);
  if(d0>5)zoomAt(Math.log2(d1/d0),(n[0]+ot[0])/2,(n[1]+ot[1])/2)}
 ptrs.set(e.pointerId,n)});
cv.addEventListener('pointerup',e=>{const p=loc(e);ptrs.delete(e.pointerId);clearTimeout(lpT);
 if(drag){const d=drag;drag=null;tapS=null;ptrs.clear();land.meas={};changed();updateMode();toast('نقطه‌ی '+fa(d.i+1)+' جابه‌جا شد (نارنجی)');return}
 if(!ptrs.size&&tapS&&tapS.p&&!tapS.moved&&Date.now()-tapS.t<600)onTap(p[0],p[1]);if(!ptrs.size)tapS=null});
cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);clearTimeout(lpT);if(drag){drag=null;land.meas={};changed()}tapS=null});
cv.addEventListener('wheel',e=>{e.preventDefault();const p=loc(e);zoomAt(-e.deltaY/400,p[0],p[1])},{passive:false});
function onTap(x,y){
 if(stake)return;const m=M;
  if(calibPick){const[la,ln]=unproj(x,y);draft={lat:la,lng:ln,calib:true};showDraft();redraw();return}
  if(insMode){if(m){const n=m.ll.length,E=m.closed?n:n-1;for(let i=0;i<E;i++){const p1=toScr(...m.ll[i]),p2=toScr(...m.ll[(i+1)%n]);if(Math.hypot(p1[0]-p2[0],p1[1]-p2[1])<40)continue;
    if(Math.hypot((p1[0]+p2[0])/2-x,(p1[1]+p2[1])/2-y)<=24){histPush();const A=m.ll[i],B=m.ll[(i+1)%n];ptInsert(i+1,{lat:(A[0]+B[0])/2,lng:(A[1]+B[1])/2,acc:0,manual:true,t:Date.now()});changed();updateMode();toast('نقطه‌ی جدید شد شماره‌ی '+fa(i+2)+'؛ با نگه‌داشتن و کشیدن جابه‌جاش کن');return}}}
   toast('روی علامت + وسط ضلع بزن');return}
  if(strMode){const i=hitPt(x,y);if(i<0){toast('روی یک نقطه بزن');return}if(strA==null){strA=i;updateMode();redraw();return}if(i===strA){strA=null;updateMode();redraw();return}const s0=strA;strA=null;straightenAsk(s0,i);return}
 if(manual){
  if(m)for(let i=0;i<m.ll.length;i++){const s=toScr(...m.ll[i]);if(Math.hypot(s[0]-x,s[1]-y)<=26){sel=sel===i?null:i;draft=null;showDraft();updateMode();redraw();if(sel!=null)toast('نقطه‌ی '+fa(i+1)+' انتخاب شد؛ جای جدیدش رو روی نقشه بزن');return}}
  const[la,ln]=unproj(x,y);draft={lat:la,lng:ln,idx:sel};showDraft();redraw();return}
 if(tagging&&m&&m.closed){let bi=-1,bd=22;const n=m.ll.length;
  for(let i=0;i<n;i++){const a=toScr(...m.ll[i]),b=toScr(...m.ll[(i+1)%n]),d=dseg([x,y],a,b);if(d<bd){bd=d;bi=i}}
  if(bi>=0){const ord=['','main','side','nb'];land.tags[bi]=ord[(ord.indexOf(land.tags[bi]||'')+1)%4];changed();if(typeof tagRefresh==='function')tagRefresh()}}}
let tt=0;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.remove('hidden');clearTimeout(tt);tt=setTimeout(()=>e.classList.add('hidden'),3400)}

/* ---------- جی‌پی‌اس، قطب‌نما و راه‌رفتن ---------- */
let watching=false,asking=false,heading=null,lastOri=0;
const pS=r=>r.location==='granted'?'granted':(r.coarseLocation==='granted'?'coarse':'no');
async function permState(){if(!CapG)return'granted';return pS(await CapG.checkPermissions())}
async function askPerm(){if(!CapG)return'granted';return pS(await CapG.requestPermissions({permissions:['location']}))}
function permBox(msg,btn,skip){$('#pMsg').textContent=msg;$('#pBtn').textContent=btn||'اجازه بده';$('#pSkip').classList.toggle('hidden',!skip);$('#perm').classList.remove('hidden')}
async function ensurePerm(silent){
 if(asking||watching)return;asking=true;
 try{let s=await permState();if(s!=='granted'&&!silent)s=await askPerm();
  if(s==='granted'){$('#perm').classList.add('hidden');await startWatch()}
  else if(s==='coarse')permBox('فقط «موقعیت تقریبی» داده شده و دقتش چند ده تا چند صد متره. دکمه‌ی زیر رو بزن و توی پنجره «موقعیت دقیق (Precise)» رو انتخاب کن.','دقیق بشه',true)
  else permBox(silent?'برای ثبت نقطه‌های زمین، برنامه به GPS گوشی نیاز داره. دکمه‌ی زیر رو بزن و توی پنجره‌ی بعد «موقعیت دقیق (Precise)» و «هنگام استفاده از برنامه» رو انتخاب کن.':'اجازه داده نشد. اگه پنجره دیگه نیومد: تنظیمات گوشی › برنامه‌ها › نقشه زمین › مجوزها › موقعیت مکانی رو روشن و «دقیق» رو فعال کن و برگرد اینجا.','دوباره')}
 catch(e){const t=String((e&&e.message)||e||'');permBox(/disabled|not enabled/i.test(t)?'GPS (موقعیت مکانی) گوشی خاموشه. روشنش کن و دکمه‌ی زیر رو بزن.':'خطا در گرفتن اجازه. دوباره امتحان کن.','دوباره')}
 asking=false}
function stopWatch(){watching=false;if(CapG&&wid!=null){try{Promise.resolve(CapG.clearWatch({id:wid})).catch(()=>{})}catch(e){}wid=null}}
async function startWatch(){
 if(watching)return;watching=true;
 try{if(CapG){wid=await CapG.watchPosition({enableHighAccuracy:true,timeout:20000,maximumAge:0,interval:1000,minimumUpdateInterval:500},(p,err)=>{if(err||!p)gpsErr(err);else onFix(p)})}
  else navigator.geolocation.watchPosition(onFix,gpsErr,{enableHighAccuracy:true,maximumAge:0,timeout:20000})}
 catch(e){watching=false;gpsErr(e)}}
function gpsErr(e){const t=String((e&&e.message)||e||'');setChip('GPS: سیگنال نیست','r');
 if(/denied|permission/i.test(t)){stopWatch();permBox('اجازه‌ی موقعیت مکانی داده نشده. دکمه‌ی زیر رو بزن؛ اگه پنجره نیومد، از تنظیمات گوشی › برنامه‌ها › نقشه زمین › مجوزها روشنش کن.','اجازه بده')}
 else if(/not enabled|disabled|services/i.test(t)){stopWatch();permBox('GPS (موقعیت مکانی) گوشی خاموشه. روشنش کن و دکمه‌ی زیر رو بزن.','روشن کردم')}}
function setChip(t,c){const e=$('#gps');e.textContent=t;e.className='chip '+c}
function onOri(e){let h=null;if(e.webkitCompassHeading!=null)h=e.webkitCompassHeading;else if(e.absolute&&e.alpha!=null)h=(360-e.alpha)%360;
 if(h==null)return;heading=h;const n=Date.now();if(n-lastOri>120){lastOri=n;updateArrows()}}
window.addEventListener('deviceorientationabsolute',onOri,true);window.addEventListener('deviceorientation',onOri,true);
function relDeg(t){const b=Geo.bearing([me.lat,me.lng],[t.lat,t.lng]);return heading==null?b:(b-heading+360)%360}
function updateArrows(){if(!me)return;const a=$('#stArrow');if(stake&&stake.cur>=0&&a){const t=stake.list[stake.cur];a.style.transform=`rotate(${relDeg(t)}deg)`}
 const g=$('#tgArrow');if(target&&g)g.style.transform=`rotate(${relDeg(target)}deg)`}
function dirPhrase(rel){if(heading==null)return'';const r=rel>180?rel-360:rel,a=Math.abs(r),s=r>0?'راست':'چپ';
 return a<20?'، مستقیم برو':a<60?'، کمی به '+s:a<150?'، به '+s+' بپیچ':'، برگرد'}
let lastSay=0,lastMile=999;
function say(t){lastSay=Date.now();if(!S.voice||!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(t);u.lang='fa-IR';speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
function guide(d,rel){if(!S.voice)return;const miles=[100,50,30,20,10,5,3],mm=miles.find(x=>d<=x&&lastMile>x);
 if(mm){lastMile=mm;say(mm+' متر مونده'+dirPhrase(rel))}else if(Date.now()-lastSay>9000&&d>3)say(Math.round(d)+' متر مونده'+dirPhrase(rel))}
/* فیلتر GPS: حذف پرش‌های عجیب، هموار کردن با کالمن، و جبران خطای ثابت با نقطه‌ی معلوم */
let GOFF=null,rawBuf=null;const KF={v:-1,lat:0,lng:0,t:0,bad:0,Q:1.5};
function kalman(lat,lng,acc,t){acc=Math.max(acc,1);
 if(KF.v<0){KF.lat=lat;KF.lng=lng;KF.v=acc*acc;KF.t=t;KF.bad=0;return}
 if(t-KF.t>10000){KF.lat=lat;KF.lng=lng;KF.v=acc*acc;KF.t=t;KF.bad=0;return}
 const d=Geo.hav([KF.lat,KF.lng],[lat,lng]);
 if(d>Math.max(40,6*acc)){KF.bad++;if(KF.bad<3)return;KF.lat=lat;KF.lng=lng;KF.v=acc*acc;KF.t=t;KF.bad=0;return}KF.bad=0;
 const dt=Math.max(0,(t-KF.t)/1000);KF.t=t;KF.v+=dt*KF.Q*KF.Q;
 const K=KF.v/(KF.v+acc*acc);KF.lat+=K*(lat-KF.lat);KF.lng+=K*(lng-KF.lng);KF.v=(1-K)*KF.v}
function kfReset(){KF.v=-1}
const median=a=>{const s=a.slice().sort((x,y)=>x-y),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):0};
function robustMean(arr){if(!arr.length)return null;let a=arr.slice().sort((x,y)=>x.acc-y.acc);a=a.slice(0,Math.max(3,Math.ceil(a.length*.7)));
 const ml=median(a.map(p=>p.lat)),mg=median(a.map(p=>p.lng)),ds=a.map(p=>Geo.hav([p.lat,p.lng],[ml,mg])),md=median(ds);
 const k=a.filter((p,i)=>ds[i]<=Math.max(2*md,1.5));let sw=0,la=0,ln=0,sa=0;
 k.forEach(s=>{const w=1/Math.max(s.acc,1)**2;sw+=w;la+=s.lat*w;ln+=s.lng*w;sa+=s.acc});
 return{lat:la/sw,lng:ln/sw,acc:sa/k.length,n:k.length,total:arr.length}}
function onFix(p){const c=p.coords,acc=c.accuracy||99;let la=c.latitude,ln=c.longitude;
 if(rawBuf)rawBuf.push({lat:la,lng:ln,acc});
 if(GOFF){la+=GOFF.dlat;ln+=GOFF.dlng}
 kalman(la,ln,acc,Date.now());
 me={lat:KF.lat,lng:KF.lng,acc,t:Date.now(),raw:[la,ln]};
 if(walk&&me.acc<=Math.max(S.maxAcc,10)){const L=walk.last;if(!L||Geo.hav([L.lat,L.lng],[me.lat,me.lng])>=Math.max(S.step||1,.3)){walk.pts.push({lat:me.lat,lng:me.lng,acc:me.acc});walk.last=me;if(typeof updateMode==='function')updateMode()}}
 setChip('GPS ±'+fa(me.acc)+' م',me.acc<=5?'g':me.acc<=S.maxAcc?'y':'r');
 if(!window._first){window._first=1;if(!land.pts.length)V={lat:me.lat,lng:me.lng,z:18}}
 if(follow){V.lat=me.lat;V.lng=me.lng}
 if(typeof tgtUpdate==='function')tgtUpdate();
 if(stake&&stake.cur>=0){updateStakeBar();const t=stake.list[stake.cur];if(!stake.arrived&&Geo.hav([me.lat,me.lng],[t.lat,t.lng])<=S.arrive)radar()}
 updateArrows();redraw()}
function startWalk(){if(!me){toast('GPS هنوز موقعیت نداده');return false}walk={pts:[{lat:me.lat,lng:me.lng,acc:me.acc}],last:me};follow=true;V={lat:me.lat,lng:me.lng,z:Math.max(V.z,19)};updateMode();return true}
function dp(pts,tol){if(pts.length<3)return pts;let mx=0,ix=0;const a=pts[0],b=pts[pts.length-1];
 for(let i=1;i<pts.length-1;i++){const d=dseg(pts[i],a,b);if(d>mx){mx=d;ix=i}}
 if(mx>tol)return dp(pts.slice(0,ix+1),tol).slice(0,-1).concat(dp(pts.slice(ix),tol));return[a,b]}
function walkCorners(){const w=walk;walk=null;follow=false;updateMode();if(!w||w.pts.length<6)return null;
 const{zone,south,utm}=utmOf(w.pts);let q=dp(utm,S.walkTol);if(q.length>3&&Geo.dist(q[0],q[q.length-1])<Math.max(5,S.walkTol*2))q=q.slice(0,-1);
 if(q.length<3)return null;return q.map(u=>{const ll=Geo.fromUTM(u[0],u[1],zone,south);return{lat:ll[0],lng:ll[1],acc:2,t:Date.now(),walk:true}})}
async function addPoint(idx){
 if(busy)return;
 if(land.closed&&idx==null){toast('زمین بسته‌ست؛ اول «ویرایش نقاط» رو بزن');return}
 if(!me||Date.now()-me.t>15000){toast('GPS هنوز موقعیت نداده؛ چند لحظه صبر کن');return}
 if(me.acc>S.maxAcc&&!await dlg({msg:`دقت GPS الان حدود ${fa(me.acc)} متره و خوب نیست.\nبازم ثبت کنم؟`,yes:'آره، ثبت کن',no:'صبر می‌کنم'}))return;
 const L=land;busy=true;rawBuf=[{lat:me.raw[0],lng:me.raw[1],acc:me.acc}];const t0=Date.now(),dur=S.avg*1000;
 while(Date.now()-t0<dur){const b=$('#addTxt');if(b)b.textContent='⏳ '+fa(Math.ceil((dur-(Date.now()-t0))/1000));await sleep(200)}
 const arr=rawBuf;rawBuf=null;busy=false;const b2=$('#addTxt');if(b2)b2.textContent='ثبت نقطه';
 const rm=robustMean(arr),p={lat:rm.lat,lng:rm.lng,acc:rm.acc,t:Date.now()};if(GOFF)p.cal=true;
 if(idx!=null){const o=L.pts[idx];if(o&&o.note)p.note=o.note;if(o&&o.photo)p.photo=o.photo;L.pts[idx]=p}else{L.pts.push(p);L.tags.push('')}
 changed();if(navigator.vibrate)navigator.vibrate(60);
 toast(`نقطه ${fa(idx!=null?idx+1:L.pts.length)} ثبت شد (±${fa(p.acc)} م، ${fa(rm.n)} نمونه از ${fa(arr.length)})`)}
function commitDraft(){const d=draft;if(!d)return;
 if(d.calib){draft=null;calibPick=false;showDraft();updateMode();calibRef({lat:d.lat,lng:d.lng});return}
 histPush();const p={lat:d.lat,lng:d.lng,acc:0,manual:true,t:Date.now()};
 if(d.idx!=null){p.moved=true;const o=land.pts[d.idx];if(o&&o.note)p.note=o.note;if(o&&o.photo)p.photo=o.photo;land.pts[d.idx]=p}
 else if(land.closed&&land.pts.length>=3){const{utm,zone}=utmOf(land.pts),q=Geo.toUTM(p.lat,p.lng,zone),n=utm.length;let bi=0,bd=1e99;
  for(let i=0;i<n;i++){const dd=dseg(q,utm[i],utm[(i+1)%n]);if(dd<bd){bd=dd;bi=i}}ptInsert(bi+1,p)}
 else ptPush(p);
 draft=null;sel=null;showDraft();updateMode();changed();toast('نقطه ثبت شد')}

/* ---------- صدا و میخ‌کوبی ---------- */
let AC=null,toneO=null,radarT=0;
function aud(){try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}}
function beep(f,ms){if(!S.sound)return;const a=aud();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=f;g.gain.value=.2;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+ms/1000)}
function toneOn(){if(!S.sound||toneO)return;const a=aud();if(!a)return;toneO=a.createOscillator();const g=a.createGain();toneO.type='square';toneO.frequency.value=1500;g.gain.value=.2;toneO.connect(g);g.connect(a.destination);toneO.start()}
function toneOff(){if(toneO){try{toneO.stop()}catch(e){}toneO=null}}
function stakeList(pi){const m=M,out=[];
 const src=pi==null?m.cuts.map((u,j)=>({u,ll:m.cutsLL[j]})):m.parts[pi].map((u,j)=>({u,ll:m.partsLL[pi][j]}));
 src.forEach(s=>{if(out.some(o=>Geo.dist(o.u,s.u)<.05))return;let label;const oi=m.utm.findIndex(u=>Geo.dist(u,s.u)<.05);
  if(oi>=0)label='گوشه‌ی نقطه '+fa(oi+1);else label='نقطه‌ی برش '+fa(m.cuts.findIndex(u=>Geo.dist(u,s.u)<.05)+1);
  out.push({u:s.u,lat:s.ll[0],lng:s.ll[1],label,key:key(s.ll)})});
 return out}
const isDone=p=>land.staked.includes(p.key);
function nextStake(){const L=stake.list;let rest=L.map((p,i)=>i).filter(i=>!isDone(L[i]));
 if(!rest.length){toast('همه‌ی نقطه‌ها میخ خورد ✅');say('همه‌ی نقطه‌ها تموم شد');endStake();return false}
 const o=rest.filter(i=>!stake.skip.includes(i));if(o.length)rest=o;else stake.skip=[];
 let b=rest[0];if(me){let bd=1e99;rest.forEach(i=>{const d=Geo.hav([me.lat,me.lng],[L[i].lat,L[i].lng]);if(d<bd){bd=d;b=i}})}
 stake.cur=b;stake.arrived=false;lastMile=999;toneOff();return true}
function startStake(pi){if(!M||!M.parts)return;const list=stakeList(pi);if(!list.length)return;
 aud();target=null;manual=false;draft=null;sel=null;showDraft();updateMode();
 stake={list,part:pi,cur:-1,arrived:false,skip:[]};follow=!!me;if(me){V={lat:me.lat,lng:me.lng,z:Math.max(V.z,19)}}else fit();
 if(!nextStake())return;document.body.classList.add('staking');$('#stakeBar').classList.remove('hidden');renderAll();updateStakeBar();radar()}
function endStake(){clearTimeout(radarT);toneOff();stake=null;follow=false;if(window.speechSynthesis)try{speechSynthesis.cancel()}catch(e){}
 document.body.classList.remove('staking');$('#stakeBar').classList.add('hidden');renderAll();redraw()}
function updateStakeBar(d0){if(!stake||stake.cur<0)return;const t=stake.list[stake.cur],done=stake.list.filter(isDone).length;
 let txt=`${esc(t.label)} — ${fa(done+1)} از ${fa(stake.list.length)}`;
 if(me){const a=[me.lat,me.lng],b=[t.lat,t.lng],d=d0!=null?d0:Geo.hav(a,b);
  txt+=stake.arrived?'<br>✅ رسیدی! میخ رو بکوب و «میخ زدم» رو بزن':`<br>${mcm(d)} — سمت ${dirName(Geo.bearing(a,b))}`}
 else txt+='<br>منتظر GPS...';
 $('#stTxt').innerHTML=txt;$('#stOk').classList.toggle('pulse',!!stake.arrived);updateArrows()}
function radar(){clearTimeout(radarT);if(!stake||stake.cur<0)return;const t=stake.list[stake.cur];
 if(!me){radarT=setTimeout(radar,500);return}
 const d=Geo.hav([me.lat,me.lng],[t.lat,t.lng]),R=S.arrive;
 if(d<=R||(stake.arrived&&d<=R*1.6)){
  if(!stake.arrived){stake.arrived=true;toneOn();say('رسیدی. میخ رو بکوب');if(navigator.vibrate)navigator.vibrate([250,100,250])}
  blink=true;updateStakeBar(d);redraw();radarT=setTimeout(radar,300);return}
 if(stake.arrived){stake.arrived=false;toneOff()}
 blink=true;beep(700+clamp(40-d,0,40)*18,70);guide(d,relDeg(t));updateStakeBar(d);redraw();
 setTimeout(()=>{blink=false;redraw()},120);
 radarT=setTimeout(radar,clamp(200+d*45,250,2200))}
