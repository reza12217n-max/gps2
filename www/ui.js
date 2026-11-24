'use strict';
/* ---------- وضعیت و نمایش ---------- */
const phase=()=>!land.closed?'survey':(land.split?'split':'done');
function changed(){save();build();renderAll();redraw()}
function updateInfo(){renderAll()}
function renderAll(){
 const m=M,ph=phase();$('#landName').textContent=land.name;
 $('#landSub').textContent=ph==='survey'?(land.pts.length?fa(land.pts.length)+' نقطه · در حال برداشت':'به گوشه‌ی زمین برو و نقطه ثبت کن'):ph==='done'?'برداشت کامل · '+A2(m.area):'تقسیم‌شده به '+fa(land.split.n)+' قطعه · '+A2(m.area);
 let c='';if(m&&land.pts.length){c+=`<span>${fa(land.pts.length)} نقطه</span><span>محیط ${m2(m.perim)}</span>`;if(m.closed)c+=`<span>مساحت ${A2(m.area)}</span>`;if(m.cross)c+='<span style="background:#dc2626;color:#fff">⚠ ضلع‌ها همدیگه رو قطع کردن</span>';if(GOFF)c+='<span>کالیبره ✓</span>'}
 $('#chips').innerHTML=c;renderDock();renderTgt();updateMode();
 const dk=$('#dock');document.documentElement.style.setProperty('--dock-h',dk.offsetHeight+'px');INS.b=dk.offsetHeight+60}
function renderDock(){const ph=phase();let h='';
 if(ph==='survey'){
  h+=`<div class=seg><button class="${!walkMode&&!drawMode?'on':''}" data-a=modePoint>${ic('pin')} با GPS</button><button class="${walkMode&&!drawMode?'on':''}" data-a=modeWalk>${ic('route')} راه رفتن</button><button class="${drawMode?'on':''}" data-a=modeDraw>${ic('hand')} دستی</button></div><div class=actions>`;
  h+=`<button data-a=undo ${land.pts.length&&!walk?'':'disabled'}>${ic('undo')}واگرد</button>`;
  h+=drawMode?`<button class=big data-a=me>${ic('locate')}موقعیت من</button>`:walkMode?(walk?`<button class="big stop" data-a=walkToggle>${ic('stop')}پایان راه‌رفتن</button>`:`<button class=big data-a=walkToggle>${ic('route')}شروع راه‌رفتن</button>`):`<button class=big id=btnAdd data-a=add>${ic('pin')}<span id=addTxt>ثبت نقطه</span></button>`;
  h+=`<button data-a=finish ${land.pts.length>=3&&!walk?'':'disabled'}>${ic('check')}اتمام</button></div>`}
 else if(ph==='done')h=`<div class=actions><button data-a=reopen>${ic('edit')}ویرایش نقاط</button><button class=big data-a=wizard>${ic('grid')}تقسیم زمین</button><button data-a=export>${ic('share')}خروجی</button></div>`;
 else h=`<div class=actions><button data-a=wizard>${ic('grid')}ویرایش تقسیم</button><button class=big data-a=stake>${ic('flag')}میخ‌کوبی</button><button data-a=export>${ic('share')}خروجی</button></div>`;
 $('#dock').innerHTML=h}
function showDraft(){const b=$('#draftBar');document.body.classList.toggle('drafting',!!draft);if(!draft){b.classList.add('hidden');return}
 $('#dText').textContent=draft.idx!=null?`جای جدید نقطه‌ی ${fa(draft.idx+1)} ثبت بشه؟`:(land.closed?'نقطه‌ی جدید روی نزدیک‌ترین ضلع اضافه بشه؟':'این نقطه ثبت بشه؟');b.classList.remove('hidden')}
function updateMode(){const b=$('#modeBar');$('#btnManual').classList.toggle('on',manual);$('#btnIns').classList.toggle('on',insMode);$('#btnStr').classList.toggle('on',strMode);
 const eb=hist.length?`<button class=mb data-a=eundo>${ic('undo')}واگرد</button>`:'',show=h=>{b.innerHTML=h;b.classList.remove('hidden')};
 if(walk){let L=0;for(let i=1;i<walk.pts.length;i++)L+=Geo.hav([walk.pts[i-1].lat,walk.pts[i-1].lng],[walk.pts[i].lat,walk.pts[i].lng]);
  show(`در حال ثبت مسیر: ${m2(L)} راه رفتی. دور زمین راه برو و آخرش «پایان راه‌رفتن» رو بزن.`);return}
 if(calibPick){show('کالیبره: روی نقشه جایی که الان واقعاً ایستادی رو بزن، بعد «ثبت» رو بزن.<button class=mb data-a=calibCancel>لغو</button>');return}
 if(insMode){show('افزودن نقطه: روی علامت + وسط هر ضلع بزن؛ شماره‌ها خودکار عوض می‌شن.'+eb);return}
 if(strMode){show((strA==null?'صاف‌سازی: نقطه‌ی اول رو بزن.':`نقطه‌ی ${fa(strA+1)} انتخاب شد؛ نقطه‌ی دوم رو بزن.`)+eb);return}
 if(manual){show((sel!=null?`نقطه‌ی ${fa(sel+1)} انتخاب شده؛ جای جدیدش رو بزن`:(drawMode?'ترسیم دستی: GPS فقط تو رو به محدوده می‌بره. روی نقشه بزن تا نقطه بذاری؛ روی یک نقطه نگه‌دار و بکش تا جابه‌جا بشه.':'حالت دستی: روی نقشه بزن تا نقطه بذاری. روی یک نقطه نگه‌دار و بکش تا جابه‌جا بشه.'))+eb);return}
 if(phase()==='survey'&&!land.pts.length&&!GOFF&&!calibSkip){show('قبل از شروع: برای دقت بیشتر، نقطه‌ی شروع رو کالیبره کن (اختیاری).<button class=mb data-a=calibMap>کالیبره</button><button class=mb data-a=calibSkip>بعداً</button>');return}
 b.classList.add('hidden')}
function renderTgt(){const b=$('#tgtBar');if(!target||stake){b.classList.add('hidden');return}
 b.classList.remove('hidden');b.innerHTML=`<div class=sthead><svg id=tgArrow class="ic arrow"><use href="#i-nav"/></svg><div id=tgTxt></div></div><div class=bb><button data-a=untarget>${ic('close')}پایان راهنما</button></div>`;tgtUpdate()}
function tgtUpdate(){const t=$('#tgTxt');if(!target||!t)return;let s=esc(target.label);
 if(me){const a=[me.lat,me.lng],b=[target.lat,target.lng],d=Geo.hav(a,b);s+=d<S.arrive?'<br>✅ رسیدی':`<br>${mcm(d)} — سمت ${dirName(Geo.bearing(a,b))}`}t.innerHTML=s;updateArrows()}
function collapseTools(){$('#tools').classList.remove('open')}

/* ---------- کشوی پایین و گفتگو ---------- */
let wzNow=null;
function sheet(title,html,keep){const b=$('#mBody'),st=keep?b.scrollTop:0;$('#mTitle').textContent=title;b.innerHTML=html;$('#modal').classList.add('show');$('#scrim').classList.remove('hidden');b.scrollTop=st}
function closeSheet(){$('#modal').classList.remove('show');$('#scrim').classList.add('hidden');curPanel=null;tagging=false;wzNow=null}
const sheetOpen=()=>$('#modal').classList.contains('show');
let sy0=null;['.grab','.sheetHead'].forEach(q=>{const e=$(q);e.addEventListener('touchstart',t=>{sy0=t.touches[0].clientY});e.addEventListener('touchmove',t=>{if(sy0!=null&&t.touches[0].clientY-sy0>70){sy0=null;closeSheet()}});e.addEventListener('touchend',()=>{sy0=null})});
function dlg(o){return new Promise(res=>{const inp=$('#dInp'),no=$('#dNo'),yes=$('#dYes');$('#dMsg').textContent=o.msg;
 inp.style.display=o.input!=null?'block':'none';inp.value=o.input||'';yes.textContent=o.yes||'باشه';
 no.style.display=o.no===false?'none':'inline-flex';no.textContent=o.no||'نه';$('#dlg').classList.remove('hidden');
 const done=v=>{$('#dlg').classList.add('hidden');res(v)};
 yes.onclick=()=>done(o.input!=null?(inp.value.trim()||null):true);no.onclick=()=>done(false)})}
function creditHtml(){return`<div class=credit><div>طراح نرم‌افزار: <span class=who data-a=tel>رضا نوروزی</span></div><div data-a=tel><small>تماس با برنامه‌نویس (روی اسم بزن)</small></div><div id=tel class=hidden><a class=btn href="tel:09151682800">${ic('phone')}۰۹۱۵۱۶۸۲۸۰۰</a></div></div>`}

/* ---------- پنل‌ها ---------- */
function openMenu(){curPanel=openMenu;const ph=phase();
 const T=(a,i,t,dis)=>`<button class=tile data-a=${a}${dis?' disabled':''}><span class=ti>${ic(i)}</span>${t}</button>`;
 sheet('امکانات','<div class=tiles>'+T('pts','list','نقطه‌ها',!land.pts.length)+T('wizard','grid',ph==='split'?'ویرایش تقسیم':'تقسیم زمین',!land.closed)+T('stake','flag','میخ‌کوبی',ph!=='split')+T('export','share','خروجی و گزارش',!M)+T('check','ruler','بررسی با متر',land.pts.length<2)+T('lands','polygon','زمین‌ها')+T('offline','cloud','نقشه‌ی آفلاین')+T('backup','box','پشتیبان و ورود')+T('eundo','undo','واگرد ویرایش نقطه‌ها',!hist.length)+T('calib','locate','کالیبره GPS')+T('settings','sliders','تنظیمات')+T('help','info','راهنما')+T('about','users','درباره')+'</div>')}
function openLands(){curPanel=openLands;
 let h=`<button class="btn full" data-a=newLand>${ic('plus')}زمین جدید</button>`;
 lands.slice().reverse().forEach(l=>{const a=areaOf(l);
  h+=`<div class="row${l.id===land.id?' sel':''}"><div class=grow data-a=openLand data-v="${l.id}"><b>${esc(l.name)}</b><small>${fa(l.pts.length)} نقطه${a?' · '+A2(a):''}</small></div><button data-a=renLand data-v="${l.id}">${ic('edit')}</button><button data-a=delLand data-v="${l.id}">${ic('trash')}</button></div>`});
 sheet('زمین‌ها',h)}
function openPts(keep){curPanel=openPts;
 if(!land.pts.length){sheet('نقطه‌ها','<p class=hint>هنوز نقطه‌ای ثبت نکردی.</p>');return}
 const n=land.pts.length;let h='';
 land.pts.forEach((p,i)=>{const nx=(i+1<n||land.closed)?' · تا بعدی '+m2(Geo.dist(M.utm[i],M.utm[(i+1)%n])):'';
  h+=`<div class=row>${p.photo?`<img class=thumb src="${p.photo}" data-a=viewPhoto data-v=${i}>`:''}<div class=grow><b>نقطه ${fa(i+1)}</b><small>${p.manual?'دستی':'دقت ±'+fa(p.acc,1)+' م'}${p.cal?' · کالیبره':''}${p.moved?' · جابه‌جا شده':''}${nx}${p.note?'<br>📝 '+esc(p.note):''}</small></div><button data-a=tgtPt data-v=${i}>${ic('locate')}</button><button data-a=noteOpen data-v=${i}>${ic(p.note||p.photo?'note':'camera')}</button><button data-a=redoPt data-v=${i}>${ic('redo')}</button><button data-a=delPt data-v=${i}>${ic('trash')}</button></div>`});
 (M.cutsLL||[]).forEach((p,i)=>{h+=`<div class=row><div class=grow><b>نقطه‌ی برش ${fa(i+1)}</b><small>جای میخ برای تقسیم</small></div><button data-a=tgtCut data-v=${i}>${ic('locate')}</button></div>`});
 sheet('نقطه‌ها · آیکن هدف = راهنمای رسیدن',h,keep)}
let photoFor=null;
function openNote(i){curPanel=()=>openNote(i);const p=land.pts[i];
 sheet('یادداشت و عکس نقطه '+fa(i+1),`<textarea id=nt placeholder="مثلاً: کنار درخت، میخ آهنی...">${esc(p.note||'')}</textarea><div class=lbl>عکس</div>${p.photo?`<img src="${p.photo}" style="width:100%;border-radius:16px" data-a=viewPhoto data-v=${i}><button class="btn gray full" data-a=photoDel data-v=${i}>${ic('trash')}حذف عکس</button>`:''}<button class="btn full" data-a=photoAdd data-v=${i}>${ic('camera')}${p.photo?'عوض کردن عکس':'افزودن عکس'}</button><button class="btn gray full" data-a=noteBack>برگشت به لیست</button>`);
 $('#nt').oninput=e=>{p.note=e.target.value;save()}}
function measUpdate(){const n=land.pts.length,E=edgeCount();let sum=0,k=0;
 for(let i=0;i<E;i++){const d=Geo.dist(M.utm[i],M.utm[(i+1)%n]),r=land.meas[i],el=$('#md'+i);if(!el)continue;
  if(r!=null&&!isNaN(r)&&r>0){const df=r-d;el.textContent=`${mcm(Math.abs(df))} ${df>0?'بیشتر':'کمتر'} از GPS (${fa(Math.abs(df)/d*100,1)}٪)`;sum+=r/d;k++}else el.textContent=''}
 const s=$('#msum');if(s)s.textContent=k?`میانگین: اندازه‌ی واقعی ${fa(Math.abs(sum/k-1)*100,2)}٪ ${sum/k>1?'بیشتر':'کمتر'} از GPS بود (از ${fa(k)} ضلع).`:'';
 const f=$('#sfix');if(f)f.disabled=!k}
function openCheck(){curPanel=openCheck;
 if(land.pts.length<2){sheet('بررسی با متر','<p class=hint>اول حداقل دو نقطه ثبت کن.</p>');return}
 const n=land.pts.length,E=edgeCount();
 let h='<p class=hint>طول یک یا چند ضلع رو با متر (یا متر لیزری) اندازه بگیر و بنویس؛ عدد اعشار همون سانتی‌متره (مثلاً ۱۲٫۳۵). برنامه می‌گه GPS چقدر خطا داشته.</p>';
 for(let i=0;i<E;i++){const d=Geo.dist(M.utm[i],M.utm[(i+1)%n]),r=land.meas[i];
  h+=`<div class=edge><div class=en>ضلع ${fa(i+1)}<br><small>GPS: ${m2(d)}</small></div><div style="flex:1;text-align:left"><input class=pshare style="width:110px;border:0;background:var(--bg);border-radius:12px;padding:10px;text-align:center;font-size:15px" data-f=meas data-i=${i} inputmode=decimal placeholder="متر" value="${r!=null?fa(r,2):''}"><div><small id=md${i}></small></div></div></div>`}
 h+='<div id=msum class=hint></div><button class="btn full" id=sfix data-a=scaleFix>اصلاح خودکار همه‌ی نقطه‌ها</button><button class="btn gray full" data-a=measClear>پاک کردن اندازه‌ها</button>';
 sheet('بررسی با متر',h);measUpdate()}
function goffMeters(){if(!GOFF)return 0;return Math.hypot(GOFF.dlat*111320,GOFF.dlng*111320*Math.cos((me?me.lat:32)*rad))}
function openCalib(){curPanel=openCalib;
 let h='<p class=hint>خطای GPS توی یک روز معمولاً تقریباً ثابته و همه‌ی نقطه‌ها رو یک‌طرفه جابه‌جا می‌کنه. کنار یکی از نقطه‌هایی که قبلاً ثبت کردی (مثلاً میخ اول) بایست، گوشی رو ثابت نگه دار و «من اینجام» رو بزن. برنامه بقیه‌ی اندازه‌گیری‌های امروز رو با همین مقدار اصلاح می‌کنه. این کار خطای تصادفی رو از بین نمی‌بره، فقط جابه‌جایی ثابت رو.</p>';
 h+=`<button class="btn full" data-a=calibMap>${ic('pin')}کالیبره با انتخاب جای ایستادن روی نقشه (پیشنهادی)</button>`;if(GOFF)h+=`<div class=okmsg>✅ کالیبره فعاله (اصلاح ${mcm(goffMeters())})</div><button class="btn gray full" data-a=calibReset>برداشتن کالیبره</button>`;
 land.pts.forEach((p,i)=>{h+=`<div class=row><div class=grow><b>نقطه ${fa(i+1)}</b></div><button data-a=calibAt data-v=${i}>${ic('pin')}من اینجام</button></div>`});
 h+='<div class=pbar><i id=cpb></i></div><div id=ctx class=hint></div>';
 sheet('کالیبره GPS',h)}
const calibAt=i=>calibRef(land.pts[i]);
async function calibRef(p){
 if(!me){toast('GPS هنوز موقعیت نداده');return}if(busy)return;busy=true;
 const secs=Math.max(8,S.avg*2);if(!$('#cpb'))toast('گوشی رو ثابت نگه دار و صبر کن...');GOFF=null;kfReset();rawBuf=[];const t0=Date.now();
 while(Date.now()-t0<secs*1000){const b=$('#cpb');if(b)b.style.width=((Date.now()-t0)/secs/10)+'%';const t=$('#ctx');if(t)t.textContent='گوشی رو ثابت نگه دار...';await sleep(200)}
 const rm=robustMean(rawBuf);rawBuf=null;busy=false;
 if(!rm||rm.n<3){toast('نمونه‌ی کافی نبود؛ دوباره امتحان کن');return}
 const dl=p.lat-rm.lat,dg=p.lng-rm.lng,mt=Math.hypot(dl*111320,dg*111320*Math.cos(p.lat*rad));
 if(mt>80){toast('فاصله‌ی GPS با این نقطه '+mcm(mt)+' شد؛ مطمئنی کنار همین نقطه‌ای؟');return}
 GOFF={dlat:dl,dlng:dg,ref:0};kfReset();toast('کالیبره شد؛ اصلاح '+mcm(mt));renderAll();updateMode();if(curPanel===openCalib)openCalib()}
function openStake(){
 if(!M||!M.parts){curPanel=null;sheet('میخ‌کوبی','<p class=hint>اول زمین رو ببند و تقسیم کن.</p>');return}
 curPanel=openStake;
 let h='<p class=hint>یک قطعه رو انتخاب کن و بین گوشه‌هاش راه برو. نشانگر تو روی نقشه چشمک می‌زنه و بیپ می‌ده؛ هرچی نزدیک‌تر بشی تندتر. وقتی رسیدی چشمک ثابت و بوق ممتد می‌شه. گوشی رو صاف نگه دار تا فلش جهت درست کار کنه.</p>';
 M.parts.forEach((q,i)=>{const L=stakeList(i),d=L.filter(isDone).length;
  h+=`<div class=row><span class=sw style="background:${COLORS[i%8]}"></span><div class=grow><b>${esc(pname(i))}</b><small>${fa(d)} از ${fa(L.length)} نقطه میخ خورده</small></div><button data-a=stStart data-v=${i}>${ic('flag')}شروع</button></div>`});
 const C=stakeList(null);
 h+=`<div class=row><div class=grow><b>فقط نقطه‌های برش</b><small>${fa(C.filter(isDone).length)} از ${fa(C.length)} میخ خورده</small></div><button data-a=stStart data-v=cuts>${ic('flag')}شروع</button></div>`;
 h+='<button class="btn gray full" data-a=stReset>پاک کردن پیشرفت میخ‌کوبی</button>';
 sheet('میخ‌کوبی',h)}
function openExport(){curPanel=null;
 if(!M){sheet('خروجی','<p class=hint>هنوز نقطه‌ای ثبت نشده.</p>');return}
 const ok=save();
 sheet('خروجی',`<div class=${ok?'okmsg':'warn'}>${ok?'✅ زمین «'+esc(land.name)+'» ذخیره شد':'⚠ ذخیره نشد؛ از «پشتیبان» استفاده کن'}</div><div class=lbl>گزارش و فایل‌ها</div>${M.closed?`<button class="btn big full" data-a=ex data-v=pdf>${ic('doc')}گزارش PDF (نقشه، مساحت‌ها، مختصات، امضا)</button>`:''}<div class=grid2><button class=btn data-a=ex data-v=dxf>DXF (اتوکد)</button><button class=btn data-a=ex data-v=kml>KML (گوگل ارث)</button><button class=btn data-a=ex data-v=geojson>GeoJSON</button><button class=btn data-a=ex data-v=csv>جدول (CSV)</button><button class=btn data-a=ex data-v=png>عکس نقشه (PNG)</button></div><p class=hint>مختصات DXF به متر و در ناحیه‌ی UTM ${fa(M.zone)}${M.south?'S':'N'} هست. معبر اصلی، فرعی و همسایه توی DXF لایه‌ی جدا دارن. نوشته‌های DXF انگلیسی/عدد هستن تا همه‌جا درست باز بشه.</p><button class="btn danger full" data-a=closeProject>${ic('close')}خروج و بستن این پروژه</button>`)}
function openSettings(){curPanel=openSettings;
 const ch=(v,t)=>`<button class="chip2${S.map===v?' on':''}" data-a=setMap data-v=${v}>${t}</button>`;
 sheet('تنظیمات',`<div class=lbl>مدت میانگین‌گیری موقع ثبت نقطه: <b id=vAvg>${fa(S.avg)} ثانیه</b> (بیشتر = دقیق‌تر)</div><input type=range id=sAvg min=2 max=15 value=${S.avg}>
 <div class=lbl>اگه دقت GPS بدتر از این بود هشدار بده: <b id=vAcc>${fa(S.maxAcc)} متر</b></div><input type=range id=sAcc min=3 max=50 value=${S.maxAcc}>
 <div class=lbl>فاصله‌ی «رسیدم» توی میخ‌کوبی: <b id=vArr>${fa(S.arrive,1)} متر</b></div><input type=range id=sArr min=5 max=50 value=${Math.round(S.arrive*10)}>
 <div class=lbl>دقت گوشه‌یابی توی «راه رفتن»: <b id=vWt>${fa(S.walkTol,1)} متر</b> (کمتر = گوشه‌ی بیشتر)</div><input type=range id=sWt min=5 max=60 value=${Math.round(S.walkTol*10)}>
 <div class=lbl>فاصله‌ی ثبت نقطه توی «راه رفتن»: <b id=vSt>${fa(S.step,1)} متر</b> (کمتر = نقطه‌ی بیشتر)</div><input type=range id=sSt min=3 max=50 value=${Math.round(S.step*10)}>
 <div class=lbl><label><input type=checkbox id=sSnd ${S.sound?'checked':''}> صدای بیپ توی میخ‌کوبی</label></div>
 <div class=lbl><label><input type=checkbox id=sVoi ${S.voice?'checked':''}> راهنمای صوتی فارسی (اگه گوشی صدای فارسی داشته باشه)</label></div>
 <div class=lbl>نقشه‌ی زیر زمین (نیاز به اینترنت)</div><div class=chips>${ch('sat','ماهواره')}${ch('street','خیابان')}${ch('none','بدون نقشه')}</div>
 <div class=lbl><label><input type=checkbox id=sDim ${S.dims?'checked':''}> نوشتن طول ضلع‌ها روی نقشه</label></div>
 <details><summary>برای دقت بیشتر GPS</summary><p class=hint>۱) توی تنظیمات گوشی «دقت مکان» (Google Location Accuracy) روشن باشه. ۲) زیر آسمون باز باش و از ساختمان و درخت دور بشو. ۳) بعد از روشن شدن GPS یک دقیقه صبر کن. ۴) موقع ثبت نقطه گوشی رو ثابت نگه دار. ۵) از «کالیبره GPS» و «بررسی با متر» توی منو استفاده کن. برنامه خودش هم پرش‌های عجیب رو حذف و نمونه‌ها رو میانگین‌گیری می‌کنه.</p></details>`+creditHtml());
 $('#sAvg').oninput=e=>{S.avg=+e.target.value;save();$('#vAvg').textContent=fa(S.avg)+' ثانیه'};
 $('#sAcc').oninput=e=>{S.maxAcc=+e.target.value;save();$('#vAcc').textContent=fa(S.maxAcc)+' متر'};
 $('#sArr').oninput=e=>{S.arrive=+e.target.value/10;save();$('#vArr').textContent=fa(S.arrive,1)+' متر'};
 $('#sWt').oninput=e=>{S.walkTol=+e.target.value/10;save();$('#vWt').textContent=fa(S.walkTol,1)+' متر'};
 $('#sSt').oninput=e=>{S.step=+e.target.value/10;save();$('#vSt').textContent=fa(S.step,1)+' متر'};
 $('#sSnd').onchange=e=>{S.sound=e.target.checked;save();if(S.sound)beep(900,120)};
 $('#sVoi').onchange=e=>{S.voice=e.target.checked;save();if(S.voice)say('راهنمای صوتی روشن شد')};
 $('#sDim').onchange=e=>{S.dims=e.target.checked;save();redraw()}}
function openBackup(){curPanel=openBackup;
 sheet('پشتیبان و ورود فایل',`<button class="btn full" data-a=backupDo>${ic('box')}ذخیره‌ی پشتیبان همه‌ی زمین‌ها</button><button class="btn gray full" data-a=impPick>${ic('plus')}وارد کردن فایل (پشتیبان، KML، GeoJSON، DXF همین برنامه)</button><p class=hint>پشتیبان رو توی تلگرام یا گوگل‌درایو بفرست تا اگه گوشی عوض شد یا برنامه پاک شد، زمین‌هات از بین نره.</p>`)}
function oaUpd(){const c=offCenter(),n=areaCount(c[0],c[1],OA.r,OA.z);$('#oaR').textContent=fa(OA.r,1)+' کیلومتر';$('#oaZ').textContent=fa(OA.z);$('#oaInfo').innerHTML=`${fa(n)} تکه · حدود ${fa(Math.round(n*22/1024))} مگابایت${n>12000?'<br><span class=warn>خیلی زیاده؛ شعاع یا زوم رو کم کن.</span>':''}`}
const offProg=(n,t,f)=>{const b=$('#opb'),x=$('#otx');if(b)b.style.width=(n/t*100)+'%';if(x)x.textContent=`${fa(n)} از ${fa(t)}${f?' · '+fa(f)+' تکه نشد (جاهایی که نقشه‌ی دقیق نداره)':''}`};
function openOffline(){curPanel=openOffline;const p=offPlan();
 let h='<p class=hint>نقشه‌ی ماهواره‌ای رو یک بار با اینترنت دانلود کن تا بعداً توی زمین بدون اینترنت هم باشه. نقشه‌هایی که تا حالا دیدی هم خودکار ذخیره شدن.</p>';
 if(p)h+=`<div class=lbl>اطراف زمین فعلی</div><button class="btn full" data-a=offGo>${ic('cloud')}دانلود اطراف این زمین (${fa(p.list.length)} تکه)</button>`;
 h+=`<div class=lbl>ناحیه‌ی انتخابی؛ مرکز:</div><div class=chips><button class="chip2${OA.src!=='me'?' on':''}" data-a=oaSrc data-v=map>مرکز نقشه‌ی الان</button><button class="chip2${OA.src==='me'?' on':''}" data-a=oaSrc data-v=me>موقعیت من</button></div>
 <div class=lbl>شعاع: <b id=oaR></b></div><input type=range id=oaRs min=3 max=50 value=${Math.round(OA.r*10)}>
 <div class=lbl>بیشترین زوم: <b id=oaZ></b> (۱۹ دقیق‌ترین ولی حجم‌ترین)</div><input type=range id=oaZs min=16 max=19 value=${OA.z}>
 <div id=oaInfo class=hint></div><div class=pbar><i id=opb></i></div><div id=otx class=hint></div>
 <button class="btn full" data-a=offArea>${ic('cloud')}دانلود این ناحیه</button><button class="btn gray full" data-a=offClear>پاک کردن نقشه‌های ذخیره‌شده</button>`;
 sheet('نقشه‌ی آفلاین',h);oaUpd();$('#oaRs').oninput=e=>{OA.r=+e.target.value/10;oaUpd()};$('#oaZs').oninput=e=>{OA.z=+e.target.value;oaUpd()}}
const INTRO=[['pin','نقطه‌ها رو ثبت کن','به هر گوشه‌ی زمین برو و «ثبت نقطه» رو بزن. یا فقط دور زمین راه برو تا برنامه خودش گوشه‌ها رو پیدا کنه.'],['grid','زمین رو تقسیم کن','مساوی، با سهم هر نفر، یا با در نظر گرفتن معابر و همسایه. برنامه بهترین حالت رو پیشنهاد می‌ده.'],['flag','میخ‌کوبی کن','برنامه تو رو به هر نقطه می‌بره؛ نزدیک که بشی بیپ می‌ده و وقتی رسیدی بوق ممتد می‌زنه.']];
function intro(i){const el=$('#intro');el.classList.remove('hidden');const[icn,t,d]=INTRO[i];
 el.innerHTML=`<div class=slide><div class=big>${ic(icn)}</div><h2>${t}</h2><p>${d}</p></div><div class=dots>${INTRO.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div><button class="btn big full" data-a=introNext data-v=${i}>${i<2?'بعدی':'شروع کنیم'}</button>${i<2?'<button class="btn gray full" data-a=introEnd>رد کردن</button>':''}`}

/* ---------- راهنمای تقسیم (مرحله‌به‌مرحله) ---------- */
let wz={},wzStack=[];
const wzFromLand=()=>{const s=land.split;wz=s?{mode:s.shares?'shares':'equal',n:s.n,shares:s.shares?s.shares.slice():[50,50],names:(s.names||[]).slice(),roads:s.roads!==false,vk:s.vk||1,vd:s.vd||25}:{mode:'equal',n:4,shares:[50,50],names:['',''],roads:false,vk:1,vd:25};
 if(wz.mode==='shares')while(wz.names.length<wz.shares.length)wz.names.push('')};
function wizStart(startAt){wzFromLand();wzStack=[];wizStep(startAt||'how')}
function wizStep(name,keep){
 if(name==='ask'){wzFromLand();wzStack=[];wzNow=null}
 if(!keep&&wzNow!==name){if(wzNow&&wzNow!==name)wzStack.push(wzNow)}
 wzNow=name;curPanel=wizStep;tagging=(name==='edges'||name==='result')&&wz.roads;
 const back=name==='ask'||name==='how'&&!wzStack.length?'':`<button class="btn gray full" data-a=wzBack>برگشت</button>`;
 const opt=(a,v,i,t,d)=>`<button class=opt data-a=${a} data-v=${v}><span class=ti>${ic(i)}</span><span><b>${t}</b><small>${d}</small></span></button>`;
 if(name==='ask'){sheet('تقسیم زمین',`<div class=wz><div class=wzi>${ic('check')}</div><h3>برداشت تموم شد ✓</h3><p>مساحت زمین: <b>${A2(M.area)}</b><br>می‌خوای زمین رو تقسیم کنی؟</p></div><button class="btn big full" data-a=wzHow data-v=go>بله، تقسیم کنیم</button><button class="btn gray full" data-a=closeSheet>فعلاً نه</button>`)}
 else if(name==='how'){sheet('چطوری تقسیم کنیم؟',opt('wzHow','eq','grid','مساوی بین چند قطعه','مثلاً ۴ قطعه‌ی هم‌اندازه')+opt('wzHow','sh','users','سهم هر نفر (درصدی و با اسم)','مثلاً علی ۵۰٪، رضا ۳۰٪، سارا ۲۰٪')+back)}
 else if(name==='n'){let h='<div class=lbl>چند قطعه؟</div><div class=chips>';for(let k=2;k<=8;k++)h+=`<button class="chip2${wz.n===k?' on':''}" data-a=wzN data-v=${k}>${fa(k)}</button>`;sheet('تعداد قطعه‌ها',h+'</div>'+back)}
 else if(name==='people'){
  let h='<div class=lbl>اسم و درصد هر نفر رو بنویس (جمع باید ۱۰۰ بشه)</div><div class=chips style="margin-bottom:10px">';
  [2,3,4].forEach(k=>h+=`<button class=chip2 data-a=pPreset data-v=${k}>${fa(k)} نفر مساوی</button>`);h+='</div><div id=prows></div><div id=ptot style="margin:8px 0"></div>';
  h+=`<button class="btn gray full" data-a=pAdd>${ic('plus')}افزودن نفر</button><button class="btn gray full" data-a=pFix>باقی‌مونده رو بده به آخرین نفر</button><button class="btn big full" data-a=pNext>ادامه</button>`+back;
  sheet('سهم هر نفر',h,keep);peopleRender()}
 else if(name==='method'){sheet('تقسیم چطوری باشه؟',opt('wzMethod','geo','grid','بهترین شکل هندسی','ساده؛ فقط مساحت و شکل قطعه‌ها مهمه')+opt('wzMethod','roads','road','با معابر و همسایه','عدالت دسترسی: همه به معبر اصلی و فرعی برسن')+back)}
 else if(name==='edges'){
  sheet('معابر و همسایه‌ها',`<p class=hint>برای هر ضلع بگو چیه. یا روی ضلع توی نقشه بزن تا نوعش عوض بشه (اصلی ← فرعی ← همسایه ← هیچ). ضلعی که معبر یا همسایه نیست رو «هیچ» بذار.</p>`+edgesHtml()+
  `<details><summary>پیشرفته: ارزش بیشتر کنار معبر اصلی</summary><div class=lbl>ضریب ارزش کنار معبر اصلی: <b id=vkv>${fa(wz.vk,1)}</b> (۱ یعنی همه‌جا برابر)</div><input type=range id=wvk min=10 max=30 value=${Math.round(wz.vk*10)}><div class=lbl>عمق ناحیه‌ی ارزشمند: <b id=vdv>${m2(wz.vd)}</b></div><input type=range id=wvd min=5 max=60 value=${wz.vd}><p class=hint>اگه ضریب بیشتر از ۱ باشه، قطعه‌های کنار معبر کوچیک‌تر می‌شن تا ارزش همه برابر بشه.</p></details><button class="btn big full" data-a=wzResult>ادامه</button>`+back,keep);
  $('#wvk').oninput=e=>{wz.vk=+e.target.value/10;$('#vkv').textContent=fa(wz.vk,1)};$('#wvd').oninput=e=>{wz.vd=+e.target.value;$('#vdv').textContent=m2(wz.vd)}}
 else if(name==='result')wizResult(false,keep)}
function edgesHtml(){const m=M,n=m.ll.length;let h='';
 for(let i=0;i<n;i++){const t=m.tags[i]||'';
  h+=`<div class=edge><div class=en>ضلع ${fa(i+1)} <small>${m2(Geo.dist(m.utm[i],m.utm[(i+1)%n]))}</small></div><div class=chips2>`+[['','هیچ','none'],['main','اصلی','main'],['side','فرعی','side'],['nb','همسایه','nb']].map(([k,tx,cl])=>`<button class="chip3${t===k?' on '+cl:''}" data-a=tag data-v="${i}:${k}">${tx}</button>`).join('')+'</div></div>'}
 return h}
function tagRefresh(){if(wzNow==='edges')wizStep('edges',true);else if(wzNow==='result')wizResult(false,true)}
function peopleRender(){$('#prows').innerHTML=wz.names.map((nm,i)=>`<div class=prow><input class=pname data-f=wn data-i=${i} placeholder="اسم نفر ${fa(i+1)}" value="${esc(nm)}"><input class=pshare data-f=ws data-i=${i} inputmode=decimal value="${fa(wz.shares[i]||0,(wz.shares[i]||0)%1?2:0)}"><b>٪</b>${wz.names.length>2?`<button class="round sm" data-a=pDel data-v=${i}>${ic('trash')}</button>`:''}</div>`).join('');ptotUpdate()}
function ptotUpdate(){const s=wz.shares.reduce((a,b)=>a+(b||0),0),r=100-s,e=$('#ptot');if(!e)return;e.innerHTML=Math.abs(r)<.01?'<span class=okmsg>✅ جمع ۱۰۰٪</span>':`<span class=warn>جمع: ${fa(s,2)}٪ — ${r>0?fa(r,2)+'٪ کمه':fa(-r,2)+'٪ زیاده'}</span>`}
function wizResult(apply,keep){
 if(apply){const s={n:wz.n,shares:wz.mode==='shares'?wz.shares.slice():null,names:wz.names.slice(0,wz.n),layout:'auto',ang:null,pick:0,roads:wz.roads,vk:wz.roads?wz.vk:1,vd:wz.vd,mode:wz.mode};
  while(s.names.length<s.n)s.names.push('');land.split=s;changed()}
 wzNow='result';curPanel=wizStep;tagging=!!(land.split&&land.split.roads!==false);
 const s=land.split,m=M;if(!m||!m.parts){return}const e=m.eval,rows=Geo.bestRows(s.n);
 let h=`<div class=lbl>${m.cands.length>1?'پیشنهادها؛ یکی رو انتخاب کن':'بهترین پیشنهاد برنامه'}</div><div class=cands>`;
 m.cands.forEach((c,i)=>{h+=`<button class="cand${(s.pick||0)===i?' on':''}" data-a=pick data-v=${i}><canvas width=240 height=170 data-c=${i}></canvas><div class=ct>پیشنهاد ${fa(i+1)}${i===0?' ✨':''}</div><div class=cm>${(c.e.hasM||c.e.hasS)?'دسترسی '+(c.e.ok?'✓':'⚠')+' · ':''}برش ${m2(c.e.cut)}<br>قرینگی ${fa(100/c.e.comp)}٪</div></button>`});
 h+='</div><div class=lbl>قطعه‌ها (اسم بذار)</div>';
 const vt=m.vals?m.vals.reduce((a,b)=>a+b,0):0;
 m.parts.forEach((q,i)=>{const a=Geo.area(q);
  h+=`<div class=pr><div style="display:flex;gap:6px;align-items:center"><span class=sw style="background:${COLORS[i%8]}"></span><input data-f=pn data-i=${i} style="flex:1;min-width:0;border:0;background:var(--bg);border-radius:12px;padding:10px;font-size:14px" placeholder="قطعه ${fa(i+1)}" value="${esc((s.names&&s.names[i])||'')}"><button class="round sm" data-a=pMove data-v="${i}:-1">${ic('up')}</button><button class="round sm" data-a=pMove data-v="${i}:1">${ic('down')}</button></div><small style="color:var(--mut)">${A2(a)} · ${fa(a/m.area*100,1)}٪ از کل${vt?' · ارزش '+fa(m.vals[i]/vt*100,1)+'٪':''}${e.hasM?' · معبر اصلی '+m2(e.fm[i]):''}${e.hasS?' · فرعی '+m2(e.fs[i]):''}${e.hasN?' · همسایه '+m2(e.fn[i]):''}${e.bad.includes(i)?' ⚠':''}</small></div>`});
 if(!e.ok)h+='<div class=warn>⚠ بعضی قطعه‌ها به معبر نمی‌رسن (کمتر از ۳ متر). تعداد قطعه رو کم کن یا ضلع معبر بلندتری انتخاب کن.</div>';
 else if(e.hasM||e.hasS)h+='<div class=okmsg>✅ همه‌ی قطعه‌ها به معبر دسترسی دارن.</div>';
 h+=`<div class=hint>نقطه‌های برش: ${fa(m.cuts.length)} تا · طول کل خط‌های برش: ${m2(e.cut)}</div>`;
 if(s.roads!==false)h+='<div class=hint>برای عوض کردن نوع ضلع‌ها روی ضلع توی نقشه بزن.</div>';
 h+=`<details><summary>تنظیمات پیشرفته</summary>`;
 if(!s.shares&&rows>1){const lay=s.layout||'auto';h+=`<div class=lbl>چیدمان</div><div class=chips><button class="chip2${lay==='auto'?' on':''}" data-a=spL data-v=auto>بهترین</button><button class="chip2${lay==='strip'?' on':''}" data-a=spL data-v=strip>نواری</button><button class="chip2${lay==='grid'?' on':''}" data-a=spL data-v=grid>شبکه‌ای ${fa(rows)}×${fa(s.n/rows)}</button></div>`}
 h+=`<div class=lbl>جهت خط‌های برش: <b id=angV>${fa(m.angUsed)}°${s.ang==null?' (خودکار)':''}</b></div><input type=range id=ang min=0 max=179 value=${m.angUsed}><button class="btn gray full" data-a=spAuto>خودکار (بهترین جهت)</button>`;
 if(s.roads!==false&&e.hasM)h+=`<div class=lbl>ضریب ارزش کنار معبر اصلی: <b id=vkv>${fa(s.vk||1,1)}</b></div><input type=range id=rvk min=10 max=30 value=${Math.round((s.vk||1)*10)}><div class=lbl>عمق ناحیه‌ی ارزشمند: <b id=vdv>${m2(s.vd||25)}</b></div><input type=range id=rvd min=5 max=60 value=${s.vd||25}>`;
 h+='</details><button class="btn big full" data-a=wzOk>'+ic('check')+'تأیید</button><button class="btn gray full" data-a=wzRestart>تغییر تعداد یا روش</button><button class="btn danger full" data-a=spOff>حذف تقسیم</button>';
 sheet('نتیجه‌ی تقسیم',h,keep);
 $$('canvas[data-c]').forEach(cn=>{const c=m.cands[+cn.dataset.c],v=fitView(240,170,14,0,0,M);if(v)draw(cn.getContext('2d'),240,170,v,{tiles:false,m:modelWith(c),mini:true,noMe:true,k:.8,dpr:1})});
 const sl=$('#ang');sl.oninput=e=>{land.split.ang=+e.target.value;land.split.pick=0;changed();$('#angV').textContent=fa(M.angUsed)+'°'};sl.onchange=()=>wizResult(false,true);
 const rk=$('#rvk');if(rk){rk.oninput=e=>{$('#vkv').textContent=fa(+e.target.value/10,1)};rk.onchange=e=>{land.split.vk=+e.target.value/10;land.split.pick=0;changed();wizResult(false,true)};
  $('#rvd').oninput=e=>{$('#vdv').textContent=m2(+e.target.value)};$('#rvd').onchange=e=>{land.split.vd=+e.target.value;land.split.pick=0;changed();wizResult(false,true)}}}
function setName(i,v){if(!land.split)return;land.split.names[i]=v;if(M&&M.names)M.names[i]=v||('قطعه '+fa(i+1));save();redraw()}

/* ---------- دکمه‌ها ---------- */
const ACT={
 add:()=>addPoint(),
 undo:()=>{if(!land.pts.length)return;ptRemove(land.pts.length-1);changed()},
 finish:()=>{if(land.pts.length<3){toast('حداقل ۳ تا نقطه لازمه');return}land.closed=true;manual=false;drawMode=false;insMode=false;strMode=false;draft=null;sel=null;showDraft();changed();updateMode();fit();wizStep('ask')},
 reopen:()=>{land.closed=false;changed()},
 modePoint:()=>{if(walk)return;walkMode=false;drawMode=false;manual=false;insMode=false;strMode=false;draft=null;sel=null;showDraft();updateMode();renderAll();redraw()},
 modeWalk:()=>{if(walk)return;walkMode=true;drawMode=false;manual=false;insMode=false;strMode=false;draft=null;sel=null;showDraft();updateMode();renderAll();redraw()},
 modeDraw:()=>{if(walk)return;if(stake){toast('اول میخ‌کوبی رو تموم کن');return}drawMode=true;walkMode=false;manual=true;insMode=false;strMode=false;calibPick=false;draft=null;sel=null;showDraft();updateMode();renderAll();if(me&&!land.pts.length){follow=false;V={lat:me.lat,lng:me.lng,z:Math.max(V.z,18)}}redraw();toast('ترسیم دستی: GPS فقط تو رو به محدوده می‌بره؛ نقطه‌ها رو خودت روی نقشه بزن')},
 ins:()=>{if(stake||walk)return;if(land.pts.length<2){toast('اول حداقل دو نقطه ثبت کن');return}insMode=!insMode;strMode=false;manual=false;drawMode=false;calibPick=false;strA=null;draft=null;sel=null;showDraft();updateMode();renderAll();redraw()},
 str:()=>{if(stake||walk)return;if(land.pts.length<3){toast('اول حداقل سه نقطه ثبت کن');return}strMode=!strMode;strA=null;insMode=false;manual=false;drawMode=false;calibPick=false;draft=null;sel=null;showDraft();updateMode();renderAll();redraw()},
 eundo:()=>{if(histUndo()){updateMode();toast('واگرد شد');if(curPanel===openPts)openPts()}else toast('چیزی برای واگرد نیست')},
 calibMap:()=>{closeSheet();if(!me){toast('GPS هنوز موقعیت نداده؛ چند لحظه صبر کن');return}calibPick=true;insMode=false;strMode=false;manual=false;drawMode=false;draft=null;sel=null;showDraft();follow=false;V={lat:me.lat,lng:me.lng,z:Math.max(V.z,19)};updateMode();renderAll();redraw()},
 calibCancel:()=>{calibPick=false;draft=null;showDraft();updateMode();redraw()},
 calibSkip:()=>{calibSkip=true;updateMode()},
 permSkip:()=>{$('#perm').classList.add('hidden');startWatch()},
 oaSrc:v=>{OA.src=v;openOffline()},
 offArea:async()=>{if(!window.caches){toast('این گوشی ذخیره‌ی آفلاین رو پشتیبانی نمی‌کنه');return}const c=offCenter(),n=areaCount(c[0],c[1],OA.r,OA.z);
  if(n>12000&&!await dlg({msg:'تعداد تکه‌ها خیلی زیاده ('+fa(n)+') و ممکنه خیلی طول بکشه یا حافظه پر بشه. ادامه بدم؟',yes:'ادامه',no:'نه'}))return;
  await offRun(areaPlan(c[0],c[1],OA.r,OA.z),offProg);toast('نقشه‌ی آفلاین این ناحیه ذخیره شد')},
 closeProject:async()=>{if(!await dlg({msg:'پروژه بسته بشه و نقشه‌ی خالی نشون داده بشه؟\nزمین ذخیره شده و توی «زمین‌ها» می‌مونه.',yes:'بله',no:'نه'}))return;
  save();if(stake)endStake();const em=lands.find(l=>!l.pts.length&&l.id!==land.id);land=em||newLand();target=null;hist=[];manual=false;drawMode=false;walkMode=false;insMode=false;strMode=false;calibPick=false;draft=null;sel=null;showDraft();changed();closeSheet();
  if(me){follow=false;V={lat:me.lat,lng:me.lng,z:18}}updateMode();toast('پروژه بسته شد')},

 walkToggle:async()=>{
  if(!walk){if(land.pts.length&&!await dlg({msg:'نقطه‌های قبلی این زمین پاک می‌شن و مسیر جدید جاش میاد. ادامه بدم؟',yes:'آره',no:'نه'}))return;if(startWalk())renderAll();return}
  const c=walkCorners();renderAll();
  if(!c){toast('مسیر خیلی کوتاه بود؛ دوباره امتحان کن');return}
  land.pts=c;land.tags=c.map(()=>'');land.closed=true;land.split=null;land.meas={};land.staked=[];changed();fit();toast(fa(c.length)+' گوشه پیدا شد؛ می‌تونی از «نقطه‌ها» ویرایششون کنی');wizStep('ask')},
 menu:openMenu,lands:openLands,pts:()=>openPts(),stake:openStake,export:openExport,settings:openSettings,backup:openBackup,offline:openOffline,check:openCheck,calib:openCalib,closeSheet,
 help:()=>{closeSheet();intro(0)},about:()=>{curPanel=null;sheet('درباره‌ی برنامه','<div class=wz><div class=wzi>'+ic('polygon')+'</div><h3>نقشه زمین</h3><p>برداشت، تقسیم و میخ‌کوبی زمین با GPS گوشی</p></div>'+creditHtml())},
 introNext:v=>{const i=+v;if(i<2)intro(i+1);else ACT.introEnd()},introEnd:()=>{$('#intro').classList.add('hidden');localStorage.setItem('seen','1')},
 wizard:()=>{if(!land.closed){toast('اول برداشت رو تموم کن');return}closeSheet();if(land.split){wzFromLand();wzStack=[];wizResult(false)}else wizStart('how')},
 wzHow:v=>{if(v==='eq'){wz.mode='equal';wizStep('n')}else if(v==='sh'){wz.mode='shares';wizStep('people')}else wizStep('how')},
 wzN:v=>{wz.n=+v;wz.names=Array.from({length:wz.n},(_,i)=>wz.names[i]||'');wizStep('method')},
 wzMethod:v=>{wz.roads=v==='roads';if(wz.roads)wizStep('edges');else wizResult(true)},
 wzResult:()=>wizResult(true),
 wzBack:()=>{const p=wzStack.pop();if(p)wizStep(p,true);else wizStep('how',true)},
 wzRestart:()=>{wzFromLand();wzStack=[];wizStep('how')},
 wzOk:()=>{closeSheet();toast('تقسیم ثبت شد؛ برای میخ‌کوبی دکمه‌ی پایین رو بزن');renderAll();redraw()},
 pick:v=>{land.split.pick=+v;changed();wizResult(false,true)},
 pMove:v=>{const[i,d]=v.split(':').map(Number),j=i+d,s=land.split;if(j<0||j>=s.n)return;
  [s.names[i],s.names[j]]=[s.names[j],s.names[i]];if(s.shares)[s.shares[i],s.shares[j]]=[s.shares[j],s.shares[i]];s.pick=0;changed();wizResult(false,true)},
 pAdd:()=>{if(wz.names.length>=10){toast('حداکثر ۱۰ نفر');return}wz.names.push('');wz.shares.push(0);peopleRender()},
 pDel:v=>{wz.names.splice(+v,1);wz.shares.splice(+v,1);peopleRender()},
 pPreset:v=>{const k=+v,b=Math.round(100/k*100)/100;wz.names=Array.from({length:k},(_,i)=>wz.names[i]||'');wz.shares=Array.from({length:k},()=>b);wz.shares[k-1]=Math.round((100-b*(k-1))*100)/100;peopleRender()},
 pFix:()=>{const k=wz.shares.length-1,o=wz.shares.slice(0,k).reduce((a,b)=>a+(b||0),0);if(o>100){toast('جمع بقیه بیشتر از ۱۰۰ شده');return}wz.shares[k]=Math.round((100-o)*100)/100;peopleRender()},
 pNext:()=>{const s=wz.shares.reduce((a,b)=>a+(b||0),0);if(Math.abs(s-100)>.01){toast('جمع درصدها باید ۱۰۰ بشه');return}if(wz.shares.some(x=>!(x>0))){toast('درصد هر نفر باید بیشتر از صفر باشه');return}wz.n=wz.names.length;wizStep('method')},
 tag:v=>{const[i,t]=v.split(':');land.tags[+i]=t;changed();tagRefresh()},
 spL:v=>{land.split.layout=v;land.split.pick=0;changed();wizResult(false,true)},
 spAuto:()=>{land.split.ang=null;land.split.pick=0;changed();wizResult(false,true)},
 spOff:()=>{land.split=null;changed();closeSheet()},
 stStart:v=>{closeSheet();startStake(v==='cuts'?null:+v)},
 stReset:async()=>{if(!await dlg({msg:'پیشرفت میخ‌کوبی پاک بشه؟',yes:'پاک کن',no:'نه'}))return;land.staked=[];save();openStake()},
 stDone:()=>{if(!stake)return;const t=stake.list[stake.cur];if(t&&!isDone(t))land.staked.push(t.key);save();toneOff();if(navigator.vibrate)navigator.vibrate(80);if(nextStake()){updateStakeBar();radar()}redraw()},
 stSkip:()=>{if(!stake)return;stake.skip.push(stake.cur);if(nextStake()){updateStakeBar();radar()}redraw()},
 stEnd:endStake,
 tel:()=>{const e=$('#tel');if(e)e.classList.toggle('hidden')},
 askPerm:()=>{asking=false;ensurePerm()},
 untarget:()=>{target=null;renderAll();redraw()},
 toolsToggle:()=>$('#tools').classList.toggle('open'),
 me:()=>{if(!me){toast('GPS هنوز موقعیت نداده');return}follow=true;V={lat:me.lat,lng:me.lng,z:Math.max(V.z,18)};redraw()},
 fit:()=>{follow=false;fit()},
 mapType:()=>{S.map=S.map==='sat'?'street':S.map==='street'?'none':'sat';save();redraw();toast({sat:'ماهواره',street:'نقشه‌ی خیابان',none:'بدون نقشه'}[S.map])},
 manual:()=>{if(stake){toast('اول میخ‌کوبی رو تموم کن');return}manual=!manual;if(!manual)drawMode=false;insMode=false;strMode=false;strA=null;calibPick=false;draft=null;sel=null;showDraft();updateMode();renderAll();redraw()},
 dOk:commitDraft,dNo:()=>{draft=null;showDraft();redraw()},
 setMap:v=>{S.map=v;save();redraw();openSettings()},
 newLand:()=>{hist=[];if(land.pts.length){land=newLand();target=null;changed()}closeSheet()},
 openLand:id=>{hist=[];land=lands.find(l=>l.id===id)||land;target=null;if(stake)endStake();changed();fit();closeSheet()},
 renLand:async id=>{const l=lands.find(x=>x.id===id),n=await dlg({msg:'اسم زمین',input:l.name,yes:'ذخیره',no:'بی‌خیال'});if(n){l.name=n;changed();openLands()}},
 delLand:async id=>{if(!await dlg({msg:'این زمین پاک بشه؟ برگشت نداره.',yes:'پاک کن',no:'نه'}))return;
  lands=lands.filter(l=>l.id!==id);if(land.id===id){land=lands[0]||newLand();target=null;if(stake)endStake()}changed();openLands()},
 tgtPt:i=>{const p=land.pts[i];target={lat:p.lat,lng:p.lng,label:'نقطه '+fa(+i+1)};closeSheet();renderAll();redraw()},
 tgtCut:i=>{const p=M.cutsLL[i];target={lat:p[0],lng:p[1],label:'نقطه‌ی برش '+fa(+i+1)};closeSheet();renderAll();redraw()},
 redoPt:i=>{closeSheet();addPoint(+i)},
 delPt:async i=>{if(!await dlg({msg:'نقطه‌ی '+fa(+i+1)+' پاک بشه؟',yes:'پاک کن',no:'نه'}))return;ptRemove(+i);if(land.pts.length<3)land.closed=false;changed();openPts()},
 noteOpen:i=>openNote(+i),noteBack:()=>openPts(),
 photoAdd:i=>{photoFor=+i;$('#photo').click()},
 photoDel:i=>{delete land.pts[+i].photo;save();openNote(+i)},
 viewPhoto:i=>{$('#viewerImg').src=land.pts[+i].photo;$('#viewer').classList.remove('hidden')},viewerClose:()=>$('#viewer').classList.add('hidden'),
 scaleFix:async()=>{let s=0,k=0;const n=land.pts.length;for(let i=0;i<edgeCount();i++){const r=land.meas[i];if(r>0){s+=r/Geo.dist(M.utm[i],M.utm[(i+1)%n]);k++}}if(!k)return;const f=s/k;
  if(!await dlg({msg:`همه‌ی نقطه‌ها با ضریب ${fa(f,4)} بزرگ یا کوچیک بشن تا با اندازه‌های واقعی جور بشه؟`,yes:'اصلاح کن',no:'نه'}))return;scaleLand(f);toast('نقطه‌ها اصلاح شدن');openCheck()},
 measClear:()=>{land.meas={};save();openCheck()},
 calibAt:i=>calibAt(+i),calibReset:()=>{GOFF=null;kfReset();renderAll();openCalib()},
 backupDo:backupAll,impPick:()=>$('#imp').click(),
 offGo:async()=>{if(!window.caches){toast('این گوشی ذخیره‌ی آفلاین رو پشتیبانی نمی‌کنه');return}const p=offPlan();if(!p)return;
  await offRun(p,offProg);toast('نقشه‌ی آفلاین ذخیره شد')},
 offClear:async()=>{if(window.caches)await caches.delete('tiles-v1');tiles.clear();redraw();toast('نقشه‌های ذخیره‌شده پاک شدن')},
 ex:async v=>{const st=stamp();
  if(v==='pdf'){toast('در حال ساخت گزارش (دانلود نقشه‌ی پس‌زمینه)...');return shareFile(`land-report-${st}.pdf`,await makePdf(),true)}
  if(v==='dxf')return shareFile(`land-${st}.dxf`,Exp.dxf(M));
  if(v==='kml')return shareFile(`land-${st}.kml`,Exp.kml(M));
  if(v==='geojson')return shareFile(`land-${st}.geojson`,Exp.geojson(M));
  if(v==='csv')return shareFile(`land-${st}.csv`,Exp.csv(M));
  const c=document.createElement('canvas');c.width=1600;c.height=1200;const vv=fitView(1600,1200,170,0,0,M);
  draw(c.getContext('2d'),1600,1200,vv,{tiles:false,k:2,noMe:true,dpr:1});
  shareFile(`land-${st}.png`,c.toDataURL('image/png').split(',')[1],true)}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;if(ACT[a]){ACT[a](b.dataset.v);if(b.closest('.t-item'))collapseTools()}});
document.addEventListener('input',e=>{const t=e.target,f=t.dataset&&t.dataset.f;if(!f)return;const i=+t.dataset.i;
 if(f==='wn')wz.names[i]=t.value;else if(f==='ws'){const v=num(t.value);wz.shares[i]=isNaN(v)?0:v;ptotUpdate()}
 else if(f==='pn')setName(i,t.value);
 else if(f==='meas'){const v=num(t.value);if(isNaN(v)||v<=0)delete land.meas[i];else land.meas[i]=v;save();measUpdate()}});
$('#imp').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)importFile(f)};
$('#photo').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f||photoFor==null)return;
 try{land.pts[photoFor].photo=await resizeImage(f);save();openNote(photoFor)}catch(er){toast('عکس خونده نشد')}};

/* ---------- شروع ---------- */
let wl=null;
async function keepAwake(){try{if(navigator.wakeLock&&!wl){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null})}}catch(e){}}
window.addEventListener('resize',resize);
if(window.ResizeObserver){const ro=new ResizeObserver(resize);ro.observe($('#app'));ro.observe($('#dock'))}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(redraw);
build();renderAll();resize();if(M)fit();
ensurePerm(true);keepAwake();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){keepAwake();if(!watching)ensurePerm(true)}});
if(CapApp){CapApp.addListener('appStateChange',s=>{if(s.isActive&&!watching)ensurePerm(true)});
 CapApp.addListener('backButton',()=>{if(!$('#dlg').classList.contains('hidden'))return;if(!$('#viewer').classList.contains('hidden')){ACT.viewerClose();return}
  if(sheetOpen())closeSheet();else if(stake)endStake();else if(insMode)ACT.ins();else if(strMode)ACT.str();else if(calibPick)ACT.calibCancel();else if(manual)ACT.manual();else CapApp.exitApp()})}
setTimeout(()=>{const s=$('#splash');s.classList.add('out');setTimeout(()=>s.classList.add('hidden'),600);if(!localStorage.getItem('seen'))intro(0)},1100);
