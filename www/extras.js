'use strict';
const $$=s=>[...document.querySelectorAll(s)];
const stamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())};
async function shareFile(name,data,b64){
 try{if(CapFS&&CapShare){const o={path:name,data,directory:'CACHE'};if(!b64)o.encoding='utf8';const r=await CapFS.writeFile(o);
   await CapShare.share({title:name,files:[r.uri],dialogTitle:'ذخیره یا ارسال فایل'})}
  else{const bl=b64?new Blob([Uint8Array.from(atob(data),c=>c.charCodeAt(0))]):new Blob([data]),a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=name;a.click()}}
 catch(e){if(!/cancel/i.test(String(e&&e.message||e)))toast('خطا: '+(e.message||e))}}

/* ---------- گزارش PDF (یک صفحه‌ی A4) ---------- */
async function preloadReportTiles(v,w,h){
 const tz=clamp(Math.floor(v.z),1,19),size=256*2**(v.z-tz),mx=2**tz,C=wp(v.lat,v.lng,v.z),list=[];
 for(let ty=Math.floor((C[1]-h/2)/size);ty<=Math.floor((C[1]+h/2)/size);ty++)for(let tx=Math.floor((C[0]-w/2)/size);tx<=Math.floor((C[0]+w/2)/size);tx++){if(ty<0||ty>=mx)continue;list.push(tileObj('World_Imagery',tz,((tx%mx)+mx)%mx,ty))}
 const t0=Date.now();while(list.some(t=>t.st!==2)&&Date.now()-t0<12000)await sleep(150)}
async function reportCanvas(){
 const m=M,W2=1240,H2=1754,c=document.createElement('canvas');c.width=W2;c.height=H2;const x=c.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,W2,H2);x.direction='rtl';x.textBaseline='middle';
 const g=x.createLinearGradient(0,0,W2,0);g.addColorStop(0,'#047857');g.addColorStop(1,'#10b981');x.fillStyle=g;x.fillRect(0,0,W2,170);
 const T=(t,px,py,sz,col,al,wt)=>{x.font=`${wt||500} ${sz}px ${FONT}`;x.fillStyle=col||'#0f172a';x.textAlign=al||'right';x.fillText(t,px,py)};
 T('گزارش برداشت زمین',W2-60,66,54,'#fff','right',800);T(land.name+'   |   '+new Date().toLocaleDateString('fa-IR'),W2-60,125,28,'#d1fae5');
 const bw=(W2-120-40)/3,box=[['مساحت',A2(m.area)],['محیط',m2(m.perim)],['تعداد نقطه',fa(m.pts.length)]];
 box.forEach((b,i)=>{const bx=W2-60-bw-i*(bw+20);x.fillStyle='#f1f5f9';x.beginPath();x.roundRect(bx,195,bw,100,18);x.fill();T(b[0],bx+bw-20,225,24,'#64748b');T(b[1],bx+bw-20,266,32,'#0f172a','right',800)});
 const px=60,py=320,pw=W2-120,ph=540;x.strokeStyle='#e2e8f0';x.lineWidth=3;x.strokeRect(px,py,pw,ph);
 const vv=fitView(pw,ph,70,0,0,m);
 if(vv){await preloadReportTiles(vv,pw,ph);draw(x,pw,ph,vv,{tiles:true,forceSat:true,tileAlpha:.65,k:1.3,noMe:true,clip:true,ox:px,oy:py,dpr:1})}
 x.direction='rtl';x.textBaseline='middle';
 let ratio=0;
 if(vv){/* قطب‌نما: نقشه شمال‌به‌بالاست، پس جهت‌ها دقیق‌اند */
  const cx0=px+105,cy0=py+105;x.fillStyle='rgba(255,255,255,.88)';x.beginPath();x.roundRect(cx0-90,cy0-90,180,180,18);x.fill();
  x.strokeStyle='#0f172a';x.lineWidth=3;x.beginPath();x.moveTo(cx0,cy0-36);x.lineTo(cx0,cy0+36);x.moveTo(cx0-36,cy0);x.lineTo(cx0+36,cy0);x.stroke();
  x.fillStyle='#dc2626';x.beginPath();x.moveTo(cx0,cy0-44);x.lineTo(cx0-12,cy0-8);x.lineTo(cx0+12,cy0-8);x.closePath();x.fill();
  T('شمال',cx0,cy0-64,20,'#dc2626','center',800);T('جنوب',cx0,cy0+64,20,'#0f172a','center',700);T('شرق',cx0+60,cy0,20,'#0f172a','center',700);T('غرب',cx0-60,cy0,20,'#0f172a','center',700);
  /* مقیاس */
  const mpp=156543.03392*Math.cos(vv.lat*rad)/2**vv.z;let L=1;[1,2,5,10,20,25,50,100,200,250,500,1000,2000,5000,10000].forEach(n=>{if(n/mpp<=300)L=n});
  const bp=L/mpp,bx=px+40,by=py+ph-46;ratio=Math.round(mpp*5905.5/10)*10;
  x.fillStyle='rgba(255,255,255,.88)';x.beginPath();x.roundRect(bx-24,by-84,Math.max(bp,330)+48,128,14);x.fill();
  T('مقیاس تقریبی  1 : '+fa(ratio),bx,by-62,22,'#0f172a','left',800);
  for(let i=0;i<4;i++){x.fillStyle=i%2?'#fff':'#0f172a';x.fillRect(bx+i*bp/4,by,bp/4,14)}x.strokeStyle='#0f172a';x.lineWidth=2;x.strokeRect(bx,by,bp,14);
  T('۰',bx,by-20,18,'#0f172a','center');T(fa(L/2,L%2?1:0),bx+bp/2,by-20,18,'#0f172a','center');T(fa(L)+' متر',bx+bp,by-20,18,'#0f172a','center');
  T('(خط‌کش بالا همیشه درسته؛ نسبت عددی فقط برای چاپ A4 با اندازه‌ی ۱۰۰٪)',bx,by+30,15,'#475569','left')}
 /* امضای همه‌ی افراد، زیر نقشه */
 let y=py+ph+34;
 const ppl=((land.split&&land.split.names)||[]).map(s=>(s||'').trim()).filter(Boolean).slice(0,9),sig=['برداشت‌کننده'].concat(ppl);if(!ppl.length)sig.push('شریک / شاهد');
 T('امضای افراد',W2-60,y,28,'#047857','right',800);y+=14;
 const cols=3,cw=(W2-120)/cols,rowH=84;
 sig.forEach((nm,i)=>{const r=Math.floor(i/cols),cc=i%cols,sx=W2-60-(cc+1)*cw+14,ex=sx+cw-28,sy=y+r*rowH+50;x.strokeStyle='#94a3b8';x.lineWidth=2;x.beginPath();x.moveTo(sx,sy);x.lineTo(ex,sy);x.stroke();T(nm.slice(0,26),(sx+ex)/2,sy+22,22,'#334155','center',600)});
 y+=Math.ceil(sig.length/cols)*rowH+50;
 if(m.parts){T('قطعه‌ها',W2-60,y,32,'#047857','right',800);y+=44;
  const cols=[W2-60,W2-420,W2-700,W2-900];x.fillStyle='#ecfdf5';x.fillRect(60,y-22,W2-120,40);
  ['نام','مساحت','سهم از کل','عرض روی معبر اصلی'].forEach((h,i)=>T(h,cols[i],y,22,'#065f46','right',700));y+=44;
  m.parts.slice(0,Math.max(1,Math.min(8,Math.floor((H2-330-y)/40)))).forEach((q,i)=>{const a=Geo.area(q);x.fillStyle=COLORS[i%8];x.fillRect(W2-60-18,y-9,18,18);
   T(((m.names&&m.names[i])||'قطعه '+fa(i+1)),cols[0]-28,y,24);T(A2(a),cols[1],y,24);T(fa(a/m.area*100,1)+'٪',cols[2],y,24);
   T(m.eval&&m.eval.hasM?m2(m.eval.fm[i]):'—',cols[3],y,24);y+=40});y+=14}
 T('مختصات نقطه‌ها (UTM ناحیه‌ی '+fa(m.zone)+(m.south?'S':'N')+'، به متر)',W2-60,y,28,'#047857','right',800);y+=40;
 const maxRows=Math.max(0,Math.floor((H2-70-y)/34));
 m.pts.slice(0,maxRows).forEach((p,i)=>{T(fa(i+1),W2-60,y,22,'#64748b');x.direction='ltr';T('E '+m.utm[i][0].toFixed(2)+'    N '+m.utm[i][1].toFixed(2),W2-120,y,22,'#0f172a','right');x.direction='rtl';
  T((p.manual?'دستی':'±'+fa(p.acc,1)+' م')+(p.note?'  —  '+p.note.slice(0,40):''),160,y,20,'#64748b','left');y+=34});
 if(m.pts.length>maxRows)T('و '+fa(m.pts.length-maxRows)+' نقطه‌ی دیگر (در فایل CSV)',W2-60,y,20,'#64748b');
 T('گزارش با «نقشه‌ی زمین» ساخته شد',W2/2,H2-28,18,'#94a3b8','center');
 return c}
async function makePdf(){const c=await reportCanvas();return Exp.pdf(c.toDataURL('image/jpeg',.92).split(',')[1],c.width,c.height)}

/* ---------- پشتیبان و ورود فایل ---------- */
function backupAll(){shareFile(`zamin-backup-${stamp()}.json`,JSON.stringify({app:'zamin-naghshe',v:1,lands}))}
function landFromPts(name,ll){if(ll.length>3&&Math.abs(ll[0][0]-ll[ll.length-1][0])<1e-9&&Math.abs(ll[0][1]-ll[ll.length-1][1])<1e-9)ll=ll.slice(0,-1);
 const l=newLand();l.name=name.replace(/\.[^.]+$/,'')||l.name;l.pts=ll.map(p=>({lat:p[0],lng:p[1],acc:0,manual:true,t:Date.now()}));l.tags=l.pts.map(()=>'');l.closed=ll.length>=3;return l}
function parseCoords(s){return s.trim().split(/\s+/).map(t=>t.split(',').map(Number)).filter(a=>a.length>=2&&!isNaN(a[0])&&!isNaN(a[1])).map(a=>[a[1],a[0]])}
function importKML(text,name){const d=new DOMParser().parseFromString(text,'text/xml');
 let el=d.querySelector('Polygon coordinates')||d.querySelector('LineString coordinates');
 let ll=el?parseCoords(el.textContent):[...d.querySelectorAll('Point coordinates')].map(e=>parseCoords(e.textContent)[0]).filter(Boolean);
 return ll.length>=2?landFromPts(name,ll):null}
function importGeoJSON(o,name){const fs=o.features||[o],pick=t=>fs.map(f=>f.geometry||f).find(g=>g&&g.type===t);
 const pg=pick('Polygon'),mp=pick('MultiPolygon'),ln=pick('LineString');let ring=pg?pg.coordinates[0]:mp?mp.coordinates[0][0]:ln?ln.coordinates:fs.map(f=>f.geometry||f).filter(g=>g&&g.type==='Point').map(g=>g.coordinates);
 ring=(ring||[]).map(c=>[c[1],c[0]]);return ring.length>=2?landFromPts(name,ring):null}
function importDXF(text,name){const L=text.split(/\r?\n/),zm=text.match(/UTM zone (\d+)([NS])/);
 if(!zm){toast('این DXF ناحیه‌ی UTM نداره؛ فقط DXF ساخته‌شده توی همین برنامه رو می‌شه وارد کرد');return null}
 const zone=+zm[1],south=zm[2]==='S',v=[];let inPoly=false,layer='',cur=null;
 for(let i=0;i+1<L.length;i+=2){const c=L[i].trim(),val=L[i+1].trim();
  if(c==='0'){if(val==='POLYLINE'){inPoly=true;layer='';cur=null}else if(val==='VERTEX'&&inPoly){cur=[null,null];v.push({layer,p:cur})}else if(val==='SEQEND')inPoly=false;else cur=null}
  else if(c==='8'&&inPoly&&!cur)layer=val;else if(c==='10'&&cur)cur[0]=+val;else if(c==='20'&&cur)cur[1]=+val}
 const ll=v.filter(o=>o.layer==='BOUNDARY'&&o.p[0]!=null&&o.p[1]!=null).map(o=>Geo.fromUTM(o.p[0],o.p[1],zone,south));
 return ll.length>=3?landFromPts(name,ll):null}
async function importFile(f){
 let text;try{text=await f.text()}catch(e){toast('فایل خونده نشد');return}
 const nm=f.name.toLowerCase();let res=null,msg='';
 try{if(nm.endsWith('.json')||nm.endsWith('.geojson')){const o=JSON.parse(text);
   if(o.app==='zamin-naghshe'){let n=0;(o.lands||[]).forEach(l=>{if(!lands.some(x=>x.id===l.id)){l.staked=l.staked||[];l.tags=l.tags||[];l.meas=l.meas||{};lands.push(l);n++;res=l}});msg=fa(n)+' زمین از پشتیبان وارد شد'}
   else{res=importGeoJSON(o,f.name);msg='زمین وارد شد'}}
  else if(nm.endsWith('.kml')){res=importKML(text,f.name);msg='زمین وارد شد'}
  else if(nm.endsWith('.dxf')){res=importDXF(text,f.name);msg='زمین وارد شد'}}
 catch(e){toast('فایل معتبر نیست');return}
 if(!res){if(!/UTM/.test(text))toast('توی فایل مرز زمین پیدا نشد');return}
 land=res;changed();fit();closeSheet();toast(msg)}

/* ---------- عکس و یادداشت نقطه ---------- */
function resizeImage(file,max,q){max=max||640;q=q||.6;return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{
 const s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',q))};im.onerror=rej;im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}

/* ---------- نقشه‌ی آفلاین ---------- */
const OA={r:2,z:19,src:'map'};
const offCenter=()=>(OA.src==='me'&&me)?[me.lat,me.lng]:[V.lat,V.lng];
function areaRanges(lat,lng,r,zmax){const dl=r*1000/111320,dg=dl/Math.cos(lat*rad),R=[];for(let z=14;z<=zmax;z++){const a=tileXY(lat+dl,lng-dg,z),b=tileXY(lat-dl,lng+dg,z);R.push([z,a[0],b[0],a[1],b[1]])}return R}
function areaCount(lat,lng,r,zmax){return areaRanges(lat,lng,r,zmax).reduce((s,q)=>s+(q[2]-q[1]+1)*(q[4]-q[3]+1),0)}
function areaPlan(lat,lng,r,zmax){const list=[];areaRanges(lat,lng,r,zmax).forEach(([z,x0,x1,y0,y1])=>{for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)list.push([z,x,y])});return{zmax,list}}
function tileXY(lat,lng,z){const w=2**z,s=Math.sin(lat*rad);return[Math.floor((lng+180)/360*w),Math.floor((.5-Math.log((1+s)/(1-s))/(4*Math.PI))*w)]}
function offPlan(){const m=M;if(!m)return null;let la0=90,la1=-90,ln0=180,ln1=-180;
 m.ll.forEach(p=>{la0=Math.min(la0,p[0]);la1=Math.max(la1,p[0]);ln0=Math.min(ln0,p[1]);ln1=Math.max(ln1,p[1])});
 const pad=.0035;la0-=pad;la1+=pad;ln0-=pad;ln1+=pad;
 for(let zmax=19;zmax>=15;zmax--){const list=[];for(let z=14;z<=zmax;z++){const a=tileXY(la1,ln0,z),b=tileXY(la0,ln1,z);for(let x=a[0];x<=b[0];x++)for(let y=a[1];y<=b[1];y++)list.push([z,x,y])}
  if(list.length<=1500||zmax===15)return{zmax,list}}}
async function offRun(plan,prog){const ca=await caches.open('tiles-v1');let n=0,fail=0;const q=plan.list.slice();
 const worker=async()=>{while(q.length){const[z,x,y]=q.pop(),u=tileUrl('World_Imagery',z,x,y);
  try{if(!await ca.match(u)){const r=await fetch(u);if(!r.ok)throw 0;await ca.put(u,r)}}catch(e){fail++}n++;prog(n,plan.list.length,fail)}};
 await Promise.all([worker(),worker(),worker(),worker()])}

/* ---------- اصلاح مقیاس با متر ---------- */
function edgeCount(){return land.closed?land.pts.length:land.pts.length-1}
function scaleLand(f){const{zone,south,utm}=utmOf(land.pts),c=Geo.centroid(utm);
 land.pts.forEach((p,i)=>{const u=[c[0]+(utm[i][0]-c[0])*f,c[1]+(utm[i][1]-c[1])*f],ll=Geo.fromUTM(u[0],u[1],zone,south);p.lat=ll[0];p.lng=ll[1]});land.meas={};changed()}
