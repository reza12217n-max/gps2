const Exp=(()=>{
const G=typeof Geo!=='undefined'?Geo:require('./geo.js');
const f3=v=>v.toFixed(3),esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function bounds(m){const all=m.utm.concat(...(m.parts||[]));let x0=1e99,y0=1e99,x1=-1e99,y1=-1e99;
 all.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});return[x0,y0,x1,y1]}
function dxf(m){
 const L=[],g=(c,v)=>{L.push(String(c));L.push(String(v))};
 const[x0,y0,x1,y1]=bounds(m),h=Math.max(Math.max(x1-x0,y1-y0)/70,0.2);
 const layers=[['BOUNDARY',7],['PARTS',3],['POINTS',1],['CUTPOINTS',5],['TEXT',2],['DIMS',8],['ROAD_MAIN',1],['ROAD_SIDE',30],['NEIGHBOR',6]];
 g(0,'SECTION');g(2,'HEADER');g(9,'$ACADVER');g(1,'AC1009');g(0,'ENDSEC');
 g(0,'SECTION');g(2,'TABLES');
 g(0,'TABLE');g(2,'LTYPE');g(70,1);g(0,'LTYPE');g(2,'CONTINUOUS');g(70,0);g(3,'Solid line');g(72,65);g(73,0);g(40,0);g(0,'ENDTAB');
 g(0,'TABLE');g(2,'LAYER');g(70,layers.length);layers.forEach(([n,c])=>{g(0,'LAYER');g(2,n);g(70,0);g(62,c);g(6,'CONTINUOUS')});g(0,'ENDTAB');
 g(0,'ENDSEC');g(0,'SECTION');g(2,'ENTITIES');
 const poly=(ly,pts,cl)=>{g(0,'POLYLINE');g(8,ly);g(66,1);g(70,cl?1:0);pts.forEach(p=>{g(0,'VERTEX');g(8,ly);g(10,f3(p[0]));g(20,f3(p[1]));g(30,0)});g(0,'SEQEND');g(8,ly)};
 const T=(ly,x,y,s,rot,hh)=>{g(0,'TEXT');g(8,ly);g(10,f3(x));g(20,f3(y));g(30,0);g(40,f3(hh||h));g(1,s);if(rot)g(50,rot.toFixed(2))};
 const P=(ly,x,y)=>{g(0,'POINT');g(8,ly);g(10,f3(x));g(20,f3(y));g(30,0)};
 poly('BOUNDARY',m.utm,m.closed);
 m.utm.forEach((p,i)=>{P('POINTS',p[0],p[1]);T('TEXT',p[0]+h*.5,p[1]+h*.5,String(i+1))});
 const n=m.utm.length,E=m.closed?n:n-1;
 for(let i=0;i<E;i++){const a=m.utm[i],b=m.utm[(i+1)%n];let r=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;if(r>90)r-=180;if(r<=-90)r+=180;
  T('DIMS',(a[0]+b[0])/2,(a[1]+b[1])/2,G.dist(a,b).toFixed(2)+' m',r,h*.8)}
 const LN=(ly,a,b)=>{g(0,'LINE');g(8,ly);g(10,f3(a[0]));g(20,f3(a[1]));g(30,0);g(11,f3(b[0]));g(21,f3(b[1]));g(31,0)};
 const LY={main:'ROAD_MAIN',side:'ROAD_SIDE',nb:'NEIGHBOR'};
 (m.tags||[]).forEach((t,i)=>{if(LY[t]&&(m.closed||i<n-1))LN(LY[t],m.utm[i],m.utm[(i+1)%n])});
 if(m.parts){m.parts.forEach((q,i)=>{poly('PARTS',q,true);const c=G.centroid(q);T('TEXT',c[0],c[1],'P'+(i+1)+'  '+G.area(q).toFixed(1)+' m2')});
  m.cuts.forEach((c,i)=>{P('CUTPOINTS',c[0],c[1]);T('TEXT',c[0]+h*.5,c[1]+h*.5,'C'+(i+1))})}
 if(m.closed)T('TEXT',x0,y0-3*h,'AREA = '+m.area.toFixed(2)+' m2 ('+(m.area/1e4).toFixed(4)+' ha)   PERIMETER = '+m.perim.toFixed(2)+' m');
 T('TEXT',x0,y0-5*h,'UTM zone '+m.zone+(m.south?'S':'N')+' WGS84, units: meters');
 g(0,'ENDSEC');g(0,'EOF');return L.join('\n')+'\n'}
function kml(m){
 const ll=p=>p[1]+','+p[0]+',0',ring=ps=>ps.concat([ps[0]]).map(ll).join(' ');
 const pm=(nm,ds,geo)=>`<Placemark><name>${esc(nm)}</name><description>${esc(ds)}</description>${geo}</Placemark>`;
 const pg=ps=>`<Polygon><outerBoundaryIs><LinearRing><coordinates>${ring(ps)}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
 let s='<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>'+esc(m.name)+'</name>';
 s+=m.closed?pm(m.name,'مساحت: '+m.area.toFixed(1)+' متر مربع',pg(m.ll)):pm(m.name,'',`<LineString><coordinates>${m.ll.map(ll).join(' ')}</coordinates></LineString>`);
 (m.partsLL||[]).forEach((q,i)=>{s+=pm((m.names&&m.names[i])||'قطعه '+(i+1),'مساحت: '+G.area(m.parts[i]).toFixed(1)+' متر مربع',pg(q))});
 m.ll.forEach((p,i)=>{s+=pm('نقطه '+(i+1),(m.pts[i].note||''),`<Point><coordinates>${ll(p)}</coordinates></Point>`)});
 (m.cutsLL||[]).forEach((p,i)=>{s+=pm('برش '+(i+1),'',`<Point><coordinates>${ll(p)}</coordinates></Point>`)});
 return s+'</Document></kml>'}
function geojson(m){
 const pt=p=>[p[1],p[0]],ring=ps=>[ps.concat([ps[0]]).map(pt)],F=[];
 F.push({type:'Feature',properties:{name:m.name,area_m2:m.area||null,perimeter_m:m.perim},geometry:m.closed?{type:'Polygon',coordinates:ring(m.ll)}:{type:'LineString',coordinates:m.ll.map(pt)}});
 (m.partsLL||[]).forEach((q,i)=>F.push({type:'Feature',properties:{part:i+1,name:(m.names&&m.names[i])||'',area_m2:G.area(m.parts[i])},geometry:{type:'Polygon',coordinates:ring(q)}}));
 m.pts.forEach((p,i)=>F.push({type:'Feature',properties:{point:i+1,accuracy_m:Math.round(p.acc),note:p.note||''},geometry:{type:'Point',coordinates:[p.lng,p.lat]}}));
 (m.cutsLL||[]).forEach((p,i)=>F.push({type:'Feature',properties:{cut:i+1},geometry:{type:'Point',coordinates:pt(p)}}));
 return JSON.stringify({type:'FeatureCollection',features:F},null,1)}
function csv(m){
 const r=['\uFEFFنوع,شماره,عرض جغرافیایی,طول جغرافیایی,Easting,Northing,دقت (متر)'];
 m.pts.forEach((p,i)=>r.push(['مرز',i+1,p.lat.toFixed(8),p.lng.toFixed(8),f3(m.utm[i][0]),f3(m.utm[i][1]),p.manual?'دستی':p.acc.toFixed(2),'"'+(p.note||'').replace(/"/g,'""')+'"'].join(',')));
 (m.cuts||[]).forEach((c,i)=>r.push(['برش',i+1,m.cutsLL[i][0].toFixed(8),m.cutsLL[i][1].toFixed(8),f3(c[0]),f3(c[1]),''].join(',')));
 r.push('');r.push('ناحیه UTM,'+m.zone+(m.south?'S':'N'));
 if(m.closed){r.push('مساحت (متر مربع),'+m.area.toFixed(2));r.push('محیط (متر),'+m.perim.toFixed(2));
  const TN={main:'معبر اصلی',side:'معبر فرعی',nb:'همسایه'};
  (m.tags||[]).forEach((t,i)=>{if(t)r.push('ضلع '+(i+1)+','+TN[t])});
  (m.parts||[]).forEach((q,i)=>{r.push('مساحت قطعه '+(i+1)+(m.names&&m.names[i]?' ('+m.names[i]+')':'')+','+G.area(q).toFixed(2));
   if(m.eval){if(m.eval.hasM)r.push('عرض قطعه '+(i+1)+' روی معبر اصلی (متر),'+m.eval.fm[i].toFixed(2));if(m.eval.hasS)r.push('عرض قطعه '+(i+1)+' روی معبر فرعی (متر),'+m.eval.fs[i].toFixed(2));if(m.eval.hasN)r.push('طول مجاورت قطعه '+(i+1)+' با همسایه (متر),'+m.eval.fn[i].toFixed(2))}})}
 return r.join('\r\n')}

function pdf(b64,w,h){
 const jpg=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)),enc=new TextEncoder(),parts=[],offs=[];let len=0;
 const push=u=>{parts.push(u);len+=u.length},ps=s=>push(enc.encode(s)),obj=(n,b)=>{offs[n]=len;ps(n+' 0 obj\n'+b+'\nendobj\n')};
 ps('%PDF-1.4\n');
 obj(1,'<</Type/Catalog/Pages 2 0 R>>');obj(2,'<</Type/Pages/Kids[3 0 R]/Count 1>>');
 obj(3,'<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</XObject<</Im0 5 0 R>>>>>>');
 const cs='q 595 0 0 842 0 0 cm /Im0 Do Q';obj(4,'<</Length '+cs.length+'>>\nstream\n'+cs+'\nendstream');
 offs[5]=len;ps('5 0 obj\n<</Type/XObject/Subtype/Image/Width '+w+'/Height '+h+'/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length '+jpg.length+'>>\nstream\n');push(jpg);ps('\nendstream\nendobj\n');
 const x=len;ps('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)ps(String(offs[i]).padStart(10,'0')+' 00000 n \n');
 ps('trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n'+x+'\n%%EOF\n');
 const out=new Uint8Array(len);let o=0;parts.forEach(p=>{out.set(p,o);o+=p.length});
 let s='';for(let i=0;i<out.length;i+=8192)s+=String.fromCharCode.apply(null,out.subarray(i,i+8192));return btoa(s)}
return{dxf,kml,geojson,csv,pdf};
})();
if(typeof module!=='undefined')module.exports=Exp;
