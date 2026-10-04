/* Counts each page entry and outgoing click; one first start per visit; no answers, audio or written text. */
(() => {
 'use strict';
 const catalog=window.ACTIVITY_CATALOG, params=new URLSearchParams(location.search);
 const code=document.body.dataset.activity || params.get('activity');
 if(!catalog || !Object.hasOwn(catalog,code))return;
 const item=catalog[code], gateway=!!item.url;
 if(!document.body.dataset.activity && !gateway)return;
 const source=['assessment','feature','shared','direct','other'].includes(params.get('source'))?params.get('source'):'direct';
 const api='https://xbciyctqkwokpxlvxiro.supabase.co/functions/v1/';
 const key='sb_publishable_mMRYahDfhiPXDcj-Ui-0dg_LK0NR5-q';
 const prefix='activity.v3.event.', linkKey='activity.v3.link', pendingKey='activity.v3.pending';
 const production=location.origin==='https://intira1601.github.io';
 const memory=new Map(), inflight=new Set();
 let visit,participant=null,idToken=null,linkBusy=false,initPromise=null;
 const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);return true;}catch{return false;}},remove(k){try{localStorage.removeItem(k);}catch{}}};
 const panel=document.createElement('aside');panel.className='activity-recording';
 panel.innerHTML='<p>นับการเปิดหน้าและการเริ่มกิจกรรมโดยไม่เก็บข้อความหรือเสียงที่คุณใช้ในกิจกรรม การเปิดหน้าไม่ได้หมายถึงทำเสร็จ</p><p class="record-state" role="status" aria-live="polite"></p><button type="button" class="retry-record">ลองบันทึกอีกครั้ง</button><details><summary>เชื่อมกับรหัสผู้เข้าร่วมวิจัย (ไม่จำเป็นสำหรับการใช้กิจกรรม)</summary><p>หากยินยอม ระบบใช้บัญชี LINE เพื่อค้นหาหรือสร้างรหัสเดิมและเชื่อมชื่อกิจกรรม แหล่งลิงก์ เวลาเปิดหน้า เวลาเริ่ม และการกดออกไปเว็บอื่น ไม่เก็บเนื้อหาแชท ข้อความ หรือเสียง บัญชี LINE ยังเชื่อมโยงกับรหัสนี้ได้ หากไม่เชื่อม ระบบเก็บเฉพาะยอดเหตุการณ์โดยไม่มีรหัสผู้เข้าร่วม</p><label><input type="checkbox" class="link-consent"> ฉันยินยอมให้เชื่อมข้อมูลกิจกรรมกับรหัสวิจัยตามที่อธิบาย</label><button type="button" class="link-record">ยินยอมและเชื่อม LINE</button><button type="button" class="unlink-record">หยุดเชื่อมในเบราว์เซอร์นี้</button><p class="identity-state" role="status"></p></details>';
 document.body.append(panel);
 const status=panel.querySelector('.record-state'),retry=panel.querySelector('.retry-record'),identity=panel.querySelector('.identity-state'),checkbox=panel.querySelector('.link-consent'),connect=panel.querySelector('.link-record');
 retry.hidden=true;
 function say(message,failed=false){status.textContent=message;retry.hidden=!failed;}
 function rememberVisit(){try{history.replaceState({...history.state,activityV3:visit},'');}catch{}}
 function newVisit(resume=null){
  visit=resume||{id:crypto.randomUUID(),code,source,created:Date.now(),events:{}};
  rememberVisit();
 }
 function entries(){
  const merged=new Map(memory);
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(prefix)){try{const v=JSON.parse(localStorage.getItem(k));if(v?.event?.id)merged.set(k,v);}catch{store.remove(k);}}}}catch{}
  return [...merged.entries()];
 }
 async function post(endpoint,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const r=await fetch(api+endpoint,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true,signal:controller.signal});const data=await r.json();if(!r.ok){const error=new Error(data.error||'HTTP '+r.status);error.status=r.status;error.code=data.code;throw error;}return data;}finally{clearTimeout(timer);}
 }
 function queue(event,expected=null){const value={event,expected};const k=prefix+event.id;memory.set(k,value);store.set(k,JSON.stringify(value));}
 async function send(k,value){
  if(inflight.has(k)||!production)return;
  if(Date.now()-new Date(value.event.occurred_at).getTime()>7*86400000){memory.delete(k);store.remove(k);say('รายการที่ค้างเกิน 7 วันไม่ถูกส่ง กรุณาลองเปิดกิจกรรมใหม่',true);return;}
  inflight.add(k);
  const current=value.event.visit_id===visit.id;
  // Never attach an old anonymous visit or another account's queued event to today's account.
  const linked=!!participant&&!!idToken&&((value.expected&&value.expected===participant)||(!value.expected&&current));
  const sendingParticipant=linked?participant:null;
  try{
   await post('activity-api',{action:'event',event:value.event,...(linked?{idToken,expected_participant_id:sendingParticipant}:{})});
   // A linked update may have been queued while this anonymous request was in flight.
   const latest=memory.get(k);
   if(latest!==value && latest?.expected && latest.expected!==sendingParticipant){return;}
   memory.delete(k);store.remove(k);
   if(current){visit.acknowledged=true;rememberVisit();if(!entries().some(([,v])=>v.event.visit_id===visit.id))say(linked?'บันทึกแล้ว · รหัส '+sendingParticipant:'บันทึกยอดแล้ว · ไม่เชื่อมรหัสผู้เข้าร่วม');}
  }catch(e){
   if(e.status===401||e.status===403){participant=null;idToken=null;identity.textContent='ยังเชื่อมรหัสไม่ได้ สามารถใช้กิจกรรมและบันทึกยอดทั่วไปต่อได้';}
   if(current)say('ยังบันทึกไม่สำเร็จ · กิจกรรมยังใช้งานได้ กดลองอีกครั้งเมื่อพร้อม',true);
  }finally{inflight.delete(k);}
 }
 async function flush(){for(const [k,v] of entries())await send(k,v);}
 function event(type){
  if(!production){say('โหมดตัวอย่าง · ไม่ส่งข้อมูลเข้าฐานข้อมูลจริง');return;}
  if(type!=="outbound_click"&&Object.values(visit.events).some(e=>e.event_type===type))return;
  const e={id:crypto.randomUUID(),visit_id:visit.id,activity_code:code,event_type:type,source,occurred_at:new Date().toISOString()};
  visit.events[e.id]=e;rememberVisit();queue(e,participant);say('กำลังบันทึก…');void flush();
 }
 function view(){if(document.visibilityState==='visible')event(gateway?'gateway_view':'page_view');}
 window.ActivityTelemetry={start(){view();if(!gateway&&code!=='music')event('started');},outbound(){view();event('outbound_click');},flush};
 function sdk(){if(initPromise)return initPromise;initPromise=(async()=>{if(!window.liff){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://static.line-scdn.net/liff/edge/2/sdk.js';s.onload=resolve;s.onerror=()=>reject(Error('โหลด LINE ไม่สำเร็จ'));document.head.append(s);});}await liff.init({liffId:'2011737778-o7ntPvgO'});})();return initPromise;}
 async function link(explicit=false){
  if(!production){identity.textContent='เชื่อม LINE ได้หลังติดตั้งบนเว็บไซต์จริง';return;}
  if(linkBusy)return;if(explicit&&!checkbox.checked){identity.textContent='กรุณาเลือกยินยอมก่อนเชื่อมรหัส';return;}
  linkBusy=true;connect.disabled=true;
  try{
   if(explicit){let old;try{old=JSON.parse(sessionStorage.getItem(pendingKey));}catch{}if(!old||old.code!==code||Date.now()-old.at>=600000)sessionStorage.setItem(pendingKey,JSON.stringify({at:Date.now(),code,source,path:location.pathname,visit}));}
   identity.textContent='กำลังตรวจสอบบัญชี LINE…';await sdk();
   if(!liff.isLoggedIn()){
    if(explicit){const url=new URL(location.pathname,location.origin);url.searchParams.set('activity',code);url.searchParams.set('source',source);liff.login({redirectUri:url.href});return;}
    identity.textContent='ยังไม่เชื่อม LINE · บันทึกเฉพาะยอดทั่วไป';return;
   }
   const currentToken=liff.getIDToken();if(!currentToken)throw Error('ไม่พบ ID Token กรุณาเปิดสิทธิ์ openid ใน LIFF');
   if(explicit)await post('research-api',{action:'register',idToken:currentToken,consented:true,research_consent_version:'research-v3'});
   const data=await post('activity-api',{action:'session',idToken:currentToken});
   idToken=currentToken;participant=data.participant_id;store.set(linkKey,'yes');sessionStorage.removeItem(pendingKey);
   identity.textContent='เชื่อมรหัส '+participant+' แล้ว';
   for(const e of Object.values(visit.events))queue(e,participant);
   await flush();setTimeout(()=>void flush(),1200);
  }catch(e){identity.textContent=e.code==='CONSENT_REQUIRED'?'เลือกยินยอมด้านบนเพื่อเชื่อมการบันทึกกิจกรรมแบบใหม่':'เชื่อมรหัสไม่สำเร็จ: '+e.message;}
  finally{linkBusy=false;connect.disabled=false;}
 }
 connect.onclick=()=>void link(true);retry.onclick=()=>void flush();
 panel.querySelector('.unlink-record').onclick=()=>{participant=null;idToken=null;store.remove(linkKey);try{sessionStorage.removeItem(pendingKey);}catch{}identity.textContent='หยุดเชื่อมครั้งถัดไปในเบราว์เซอร์นี้แล้ว ข้อมูลที่บันทึกไปก่อนหน้ายังอยู่';};
 document.addEventListener('click',e=>{if(e.target.closest('[data-activity-start]'))window.ActivityTelemetry.start();if(e.target.closest('[data-activity-outbound]'))window.ActivityTelemetry.outbound();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){view();void flush();}});
 window.addEventListener('online',()=>void flush());
 window.addEventListener('pageshow',e=>{if(e.persisted){participant=null;idToken=null;newVisit();view();if(store.get(linkKey)==='yes')void link();}});
 let pending=null;try{pending=JSON.parse(sessionStorage.getItem(pendingKey));}catch{}
 const resuming=pending?.code===code&&pending?.path===location.pathname&&Date.now()-pending.at>=0&&Date.now()-pending.at<600000;
 newVisit(resuming&&pending.visit?.code===code?pending.visit:null);view();void flush();
 if(!production)say('โหมดตัวอย่าง · ไม่ส่งข้อมูลเข้าฐานข้อมูลจริง');
 if(resuming){checkbox.checked=true;void link(true);}else if(store.get(linkKey)==='yes')void link();
 setTimeout(()=>void flush(),5000);setTimeout(()=>void flush(),20000);
})();
