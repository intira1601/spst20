(() => {
 const names=window.ACTIVITY_CATALOG;
 const sources={assessment:'หลังแบบประเมิน',feature:'ฟีเจอร์แพลตฟอร์มอื่น',shared:'ลิงก์แชร์',direct:'เปิดตรง / ไม่ระบุ',other:'อื่น ๆ'};
 let seq=0,report=null,reportScope=null;
 for(const [value,item] of Object.entries(names)){const option=document.createElement('option');option.value=value;option.textContent=item.name;$('activityFilter').append(option);}
 function clear(){seq++;report=null;reportScope=null;$('activityRows').replaceChildren();$('activityStats').replaceChildren();$('exportActivity').disabled=true;$('activityStatus').textContent='';}
 document.addEventListener('research-session-cleared',clear);
 document.addEventListener('research-report-loading',clear);
 async function load(){
  clear();if(!token||!snapshot)return;
  const current=++seq,session=epoch;
  const scope={...active,snapshot,activity_code:$('activityFilter').value,source:$('sourceFilter').value};
  $('activityStatus').textContent='กำลังอ่านยอดกิจกรรม…';
  try{
   const data=await api({action:'activity_analytics_v3',...scope});
   if(current!==seq||session!==epoch)return;
   report=data;reportScope=scope;
   for(const [key,title] of [['views','เปิดหน้ากิจกรรม'],['starts','เริ่มทำกิจกรรม'],['outbounds','กดไปเว็บอื่น'],['gateways','เปิดหน้าทางผ่าน'],['linked_people','รหัสผู้เข้าร่วมที่เชื่อม'],['unlinked_events','เหตุการณ์ไม่เชื่อมรหัส']]){
    const card=document.createElement('div');card.className='stat';card.textContent=title;const number=document.createElement('strong');number.textContent=Number(data[key]||0).toLocaleString('th-TH');card.append(number);$('activityStats').append(card);
   }
   for(const item of data.rows){const row=document.createElement('tr');for(const value of [names[item.activity_code]?.name||item.activity_code,sources[item.source]||item.source,item.views,item.starts,item.outbounds,item.gateways,item.linked_people,item.unlinked_events])cell(row,value);$('activityRows').append(row);}
   $('activityStatus').textContent=data.rows.length?'':'ยังไม่พบข้อมูลแบบใหม่ตามเงื่อนไขนี้';$('exportActivity').disabled=!data.rows.length;
  }catch(e){if(current===seq&&session===epoch)$('activityStatus').textContent=e.message;}
 }
 document.addEventListener('research-report-loaded',()=>void load());
 $('refreshActivity').onclick=()=>void resetReport();
 $('activityFilter').onchange=$('sourceFilter').onchange=()=>void load();
 $('exportActivity').onclick=()=>{
  if(!report||!reportScope||!token)return;
  const s=reportScope;
  const rows=[['activity_code','activity_name','source','page_views','starts','outbound_clicks','gateway_views','linked_participant_count','unlinked_event_count','linked_event_count','from_th','to_th','participant_query','snapshot_utc'],...report.rows.map(r=>[r.activity_code,names[r.activity_code]?.name,r.source,r.views,r.starts,r.outbounds,r.gateways,r.linked_people,r.unlinked_events,r.linked_events,s.from,s.to,s.query,report.snapshot])];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='activity-summary-v3-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
})();
