"use strict";
(() => {
 const diaphragm=document.body.dataset.mode==='diaphragmatic';
 const phases=diaphragm ? [
  {name:'หายใจเข้า',ms:4000,from:0,to:1,tip:'หายใจเข้าทางจมูก สังเกตให้หน้าท้องค่อย ๆ พอง'},
  {name:'หายใจออก',ms:5000,from:1,to:0,tip:'ผ่อนลมหายใจออก สังเกตให้หน้าท้องค่อย ๆ ยุบ'}
 ] : [
  {name:'หายใจเข้า',ms:4000,from:0,to:1,tip:'ค่อย ๆ หายใจเข้าอย่างสบาย'},
  {name:'กลั้นหายใจ',ms:4000,from:1,to:1,tip:'หยุดลมหายใจไว้เท่าที่สบาย ไม่ฝืน'},
  {name:'หายใจออก',ms:4000,from:1,to:0,tip:'ค่อย ๆ ผ่อนลมหายใจออก'},
  {name:'พัก',ms:4000,from:0,to:0,tip:'หยุดพักหลังหายใจออก ก่อนเริ่มรอบใหม่'}
 ];
 const get=id=>document.getElementById(id),cycle=phases.reduce((n,p)=>n+p.ms,0);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let running=false,elapsed=0,previous=null,frame=null,lastPhase=-1;
 const badges=phases.map(p=>{const s=document.createElement('span');s.className='step';s.textContent=p.name;get('steps').append(s);return s;});
 function pose(amount){
  const motion=reduced.matches?0:amount;
  get('mascot').style.transform=`translateY(${-8*motion}px) scale(${1+.12*motion})`;
  get('halo').style.transform=`scale(${1+.20*motion})`;
  get('halo').style.opacity=String(.55+.45*motion);
 }
 function render(){
  let within=elapsed%cycle,index=0;
  while(index<phases.length-1&&within>=phases[index].ms){within-=phases[index].ms;index++;}
  const p=phases[index],ease=(1-Math.cos(Math.PI*within/p.ms))/2;
  pose(p.from+(p.to-p.from)*ease);
  if(index!==lastPhase){get('phase').textContent=p.name;get('instruction').textContent=p.tip;badges.forEach((b,i)=>b.classList.toggle('active',i===index));lastPhase=index;}
  get('count').textContent=`${Math.max(1,Math.ceil((p.ms-within)/1000))} วินาที · รอบที่ ${Math.floor(elapsed/cycle)+1}`;
  const seconds=Math.floor(elapsed/1000);
  get('session').textContent=`เวลาฝึก ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 }
 function tick(now){if(!running)return;if(previous!==null)elapsed+=now-previous;previous=now;render();frame=requestAnimationFrame(tick);}
 function pause(){running=false;previous=null;cancelAnimationFrame(frame);get('toggle').textContent='ทำต่อ';get('phase').textContent='พักสักครู่';get('instruction').textContent='เมื่อพร้อม กดทำต่อได้เลย';lastPhase=-1;}
 get('toggle').addEventListener('click',()=>{if(running){pause();return;}running=true;previous=null;get('toggle').textContent='พัก';render();frame=requestAnimationFrame(tick);});
 get('reset').addEventListener('click',()=>{pause();elapsed=0;pose(0);lastPhase=-1;badges.forEach(b=>b.classList.remove('active'));get('toggle').textContent='เริ่มหายใจ';get('phase').textContent='พร้อมแล้ว เริ่มไปด้วยกัน';get('count').textContent=diaphragm?'เข้า 4 · ออก 5 วินาที':'เข้า 4 · กลั้น 4 · ออก 4 · พัก 4 วินาที';get('instruction').textContent='กดเริ่ม แล้วค่อย ๆ หายใจตามจังหวะที่สบาย';get('session').textContent='เวลาฝึก 00:00';});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause();});
 reduced.addEventListener('change',()=>{if(lastPhase>=0)render();else pose(0);});
 pose(0);
})();
