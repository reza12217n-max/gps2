const Geo=(()=>{
const a=6378137,f=1/298.257223563,n=f/(2-f),k0=0.9996,rad=Math.PI/180;
const A=a/(1+n)*(1+n*n/4+n**4/64);
const al=[n/2-2*n*n/3+5*n**3/16,13*n*n/48-3*n**3/5,61*n**3/240];
const be=[n/2-2*n*n/3+37*n**3/96,n*n/48+n**3/15,17*n**3/480];
const de=[2*n-2*n*n/3-2*n**3,7*n*n/3-8*n**3/5,56*n**3/15];
const zoneOf=lng=>Math.floor((lng+180)/6)+1;
function toUTM(lat,lng,zone){
 zone=zone||zoneOf(lng);
 const l0=((zone-1)*6-180+3)*rad,p=lat*rad,dl=lng*rad-l0,s=Math.sin(p),q=2*Math.sqrt(n)/(1+n);
 const t=Math.sinh(Math.atanh(s)-q*Math.atanh(q*s));
 const x_=Math.atan2(t,Math.cos(dl)),e_=Math.asinh(Math.sin(dl)/Math.sqrt(t*t+Math.cos(dl)**2));
 let xi=x_,eta=e_;
 for(let j=1;j<=3;j++){xi+=al[j-1]*Math.sin(2*j*x_)*Math.cosh(2*j*e_);eta+=al[j-1]*Math.cos(2*j*x_)*Math.sinh(2*j*e_)}
 return[500000+k0*A*eta,k0*A*xi+(lat<0?1e7:0)];
}
function fromUTM(E,N,zone,south){
 const l0=((zone-1)*6-180+3)*rad,xi=(N-(south?1e7:0))/(k0*A),eta=(E-500000)/(k0*A);
 let x_=xi,e_=eta;
 for(let j=1;j<=3;j++){x_-=be[j-1]*Math.sin(2*j*xi)*Math.cosh(2*j*eta);e_-=be[j-1]*Math.cos(2*j*xi)*Math.sinh(2*j*eta)}
 const chi=Math.asin(Math.sin(x_)/Math.cosh(e_));let p=chi;
 for(let j=1;j<=3;j++)p+=de[j-1]*Math.sin(2*j*chi);
 return[p/rad,(l0+Math.atan2(Math.sinh(e_),Math.cos(x_)))/rad];
}
const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
function sarea(p){let s=0;for(let i=0;i<p.length;i++){const[x,y]=p[i],[u,v]=p[(i+1)%p.length];s+=x*v-u*y}return s/2}
const area=p=>Math.abs(sarea(p));
function perim(p,closed){let s=0;const m=closed?p.length:p.length-1;for(let i=0;i<m;i++)s+=dist(p[i],p[(i+1)%p.length]);return s}
function centroid(p){const A2=sarea(p);if(Math.abs(A2)<1e-9)return p[0];let x=0,y=0;
 for(let i=0;i<p.length;i++){const[a1,b1]=p[i],[c1,d1]=p[(i+1)%p.length],w=a1*d1-c1*b1;x+=(a1+c1)*w;y+=(b1+d1)*w}
 return[x/(6*A2),y/(6*A2)]}
function clip(poly,d,t,less){
 const out=[],sg=less?1:-1,val=p=>sg*(p[0]*d[0]+p[1]*d[1]-t);
 for(let i=0;i<poly.length;i++){const P=poly[i],Q=poly[(i+1)%poly.length],vp=val(P),vq=val(Q);
  if(vp<=0)out.push(P);
  if((vp<0&&vq>0)||(vp>0&&vq<0)){const k=vp/(vp-vq);out.push([P[0]+k*(Q[0]-P[0]),P[1]+k*(Q[1]-P[1])])}}
 return out}
function dd(p){const o=[];p.forEach(q=>{const l=o[o.length-1];if(!l||dist(q,l)>1e-6)o.push(q)});if(o.length>1&&dist(o[0],o[o.length-1])<=1e-6)o.pop();return o}
function strips(poly,n,ang,fr,vf){
 vf=vf||area;fr=fr||Array(n).fill(1/n);
 const d=[Math.cos(ang*rad),Math.sin(ang*rad)],T=vf(poly),ss=poly.map(p=>p[0]*d[0]+p[1]*d[1]);
 const lo=Math.min(...ss),hi=Math.max(...ss),cuts=[lo];let cum=0;
 for(let k=1;k<n;k++){cum+=fr[k-1];let x=lo,y=hi;for(let it=0;it<50;it++){const m=(x+y)/2;if(vf(clip(poly,d,m,true))<T*cum)x=m;else y=m}cuts.push((x+y)/2)}
 cuts.push(hi);const res=[];
 for(let k=0;k<n;k++){let q=poly;if(k>0)q=clip(q,d,cuts[k],false);if(k<n-1)q=clip(q,d,cuts[k+1],true);res.push(dd(q))}
 return res}
function bestRows(n){let r=1;for(let i=1;i*i<=n;i++)if(n%i===0)r=i;return r}
function split(poly,n,ang,layout,fr,vf){
 if(fr||vf)return strips(poly,n,ang,fr,vf);
 const rows=layout==='grid'?bestRows(n):1;
 if(rows<=1)return strips(poly,n,ang);
 return strips(poly,rows,ang).flatMap(r=>strips(r,n/rows,ang+90))}
function autoAngle(poly){let best=0,ba=1e99;
 const ext=g=>{const d=[Math.cos(g*rad),Math.sin(g*rad)],ss=poly.map(p=>p[0]*d[0]+p[1]*d[1]);return Math.max(...ss)-Math.min(...ss)};
 for(let g=0;g<180;g++){const e1=ext(g),e2=ext(g+90),ar=e1*e2;if(ar<ba-1e-6){ba=ar;best=e1>=e2?g:(g+90)%180}}
 return best}
function selfIntersects(p){const n2=p.length;if(n2<4)return false;
 const o=(a1,b1,c1)=>Math.sign((b1[0]-a1[0])*(c1[1]-a1[1])-(b1[1]-a1[1])*(c1[0]-a1[0]));
 for(let i=0;i<n2;i++)for(let j=i+1;j<n2;j++){if(j===i+1||(i===0&&j===n2-1))continue;
  const a1=p[i],b1=p[(i+1)%n2],c1=p[j],d1=p[(j+1)%n2];
  if(o(a1,b1,c1)*o(a1,b1,d1)<0&&o(c1,d1,a1)*o(c1,d1,b1)<0)return true}return false}
function hav(p,q){const R=6371008.8,dp=(q[0]-p[0])*rad,dl=(q[1]-p[1])*rad,h=Math.sin(dp/2)**2+Math.cos(p[0]*rad)*Math.cos(q[0]*rad)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function bearing(p,q){const dl=(q[1]-p[1])*rad,y=Math.sin(dl)*Math.cos(q[0]*rad),x=Math.cos(p[0]*rad)*Math.sin(q[0]*rad)-Math.sin(p[0]*rad)*Math.cos(q[0]*rad)*Math.cos(dl);return(Math.atan2(y,x)/rad+360)%360}
function makeVF(utm,tags,k,depth){
 const E=edgesOf(utm,tags,'main');if(k<=1||!E.length)return null;
 const ccw=sarea(utm)>0,zs=E.map(([A,B])=>{const L=dist(A,B),u=[(B[0]-A[0])/L,(B[1]-A[1])/L],nn=ccw?[-u[1],u[0]]:[u[1],-u[0]];
  return{u,nn,sa:A[0]*u[0]+A[1]*u[1],sb:B[0]*u[0]+B[1]*u[1],na:A[0]*nn[0]+A[1]*nn[1]}});
 return q=>{let v=area(q),z=0;if(q.length<3)return 0;
  zs.forEach(o=>{let c=clip(q,o.u,o.sa,false);if(c.length>2)c=clip(c,o.u,o.sb,true);if(c.length>2)c=clip(c,o.nn,o.na,false);if(c.length>2)c=clip(c,o.nn,o.na+depth,true);if(c.length>2)z+=area(c)});
  return v+(k-1)*z}}
function frontage(part,A,B){const L=dist(A,B);if(L<1e-9)return 0;const ux=(B[0]-A[0])/L,uy=(B[1]-A[1])/L;let tot=0;
 for(let i=0;i<part.length;i++){const P=part[i],Q=part[(i+1)%part.length];
  if(Math.abs((P[0]-A[0])*uy-(P[1]-A[1])*ux)>0.05||Math.abs((Q[0]-A[0])*uy-(Q[1]-A[1])*ux)>0.05)continue;
  let s1=(P[0]-A[0])*ux+(P[1]-A[1])*uy,s2=(Q[0]-A[0])*ux+(Q[1]-A[1])*uy;if(s1>s2){const t=s1;s1=s2;s2=t}
  const o=Math.min(s2,L)-Math.max(s1,0);if(o>0)tot+=o}return tot}
function edgesOf(utm,tags,type){const n=utm.length,o=[];for(let i=0;i<n;i++)if(tags[i]===type)o.push([utm[i],utm[(i+1)%n]]);return o}
function cvar(a){const m=a.reduce((x,y)=>x+y,0)/a.length;if(m<1e-9)return 0;return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/a.length)/m}
function evaluate(parts,utm,tags,P,fr){
 const n=parts.length,tot=parts.reduce((s,q)=>s+area(q),0);
 const E={main:edgesOf(utm,tags,'main'),side:edgesOf(utm,tags,'side'),nb:edgesOf(utm,tags,'nb')};
 const fr2=t=>parts.map(q=>E[t].reduce((s,e)=>s+frontage(q,e[0],e[1]),0));
 const fm=fr2('main'),fs=fr2('side'),fn=fr2('nb'),hasM=E.main.length>0,hasS=E.side.length>0,hasN=E.nb.length>0;
 const nz=i=>fr?Math.max(fr[i]*n,1e-6):1,acc=hasM?fm:(hasS?fs:null),bad=[];
 if(acc)acc.forEach((v,i)=>{if(v<3)bad.push(i)});
 const cut=(parts.reduce((s,q)=>s+perim(q,true),0)-P)/2;
 const comp=parts.reduce((s,q)=>s+perim(q,true)**2/(16*Math.max(area(q),1e-9)),0)/n;
 let score=cut/Math.sqrt(tot)+(comp-1);
 if(acc)score+=2*cvar(acc.map((v,i)=>v/nz(i)))+bad.length*50;
 if(hasM&&hasS)score-=0.3*fs.filter(v=>v>=3).length/n;
 if(hasS)score+=0.5*cvar(fs.map((v,i)=>v/nz(i)));if(hasN)score+=0.5*cvar(fn.map((v,i)=>v/nz(i)));
 return{score,ok:bad.length===0,bad,fm,fs,fn,cut,comp,hasM,hasS,hasN}}
function candidates(utm,n,tags,opt){
 const P=perim(utm,true),rows=bestRows(n),N=utm.length,uneq=!!(opt.fr||opt.vf);
 const lays=uneq?['strip']:(opt.layout==='grid'&&rows>1?['grid']:opt.layout==='strip'||rows<=1?['strip']:['strip','grid']);
 const al=[];for(let i=0;i<N;i++){const q=utm[(i+1)%N],a=(Math.atan2(q[1]-utm[i][1],q[0]-utm[i][0])/rad%90+90)%90;al.push(a)}
 const pen=g=>{let m=45;al.forEach(a=>{let d=Math.abs((g%90)-a);d=Math.min(d,90-d);if(d<m)m=d});return 0.2*m/45};
 const list=[],tr=(g,l)=>{const parts=split(utm,n,g,l,opt.fr,opt.vf),e=evaluate(parts,utm,tags,P,opt.fr);e.score+=pen(g);list.push({ang:g,layout:l,parts,e})};
 if(opt.ang!=null){lays.forEach(l=>tr(opt.ang,l));return list}
 const set=new Set();for(let g=0;g<180;g+=3)set.add(g);
 al.forEach(a=>{for(let k=0;k<2;k++)set.add(Math.round(a+90*k)%180)});
 set.forEach(g=>lays.forEach(l=>tr(g,l)));
 list.sort((a,b)=>a.e.score-b.e.score);
 const g0=list[0].ang,l0=list[0].layout;for(let d=-2;d<=2;d++)if(d)tr((g0+d+180)%180,l0);
 list.sort((a,b)=>a.e.score-b.e.score);
 const out=[];for(const c of list){if(out.length&&c.e.score>list[0].e.score+1.0)break;if(out.every(o=>o.layout!==c.layout||Math.min(Math.abs(o.ang-c.ang),180-Math.abs(o.ang-c.ang))>=20))out.push(c);if(out.length===3)break}
 return out}
function best(utm,n,tags,opt){return candidates(utm,n,tags,opt)[0]}
return{toUTM,fromUTM,zoneOf,area,perim,dist,centroid,split,autoAngle,selfIntersects,hav,bearing,bestRows,frontage,evaluate,best,candidates,makeVF,strips};
})();
if(typeof module!=='undefined')module.exports=Geo;
