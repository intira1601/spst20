"use strict";
(() => {
  if (document.getElementById("activityAutoStatus")) return;
  const API_URL = "https://xbciyctqkwokpxlvxiro.supabase.co/functions/v1/research-api";
  const API_KEY = "sb_publishable_mMRYahDfhiPXDcj-Ui-0dg_LK0NR5-q";
  const LIFF_ID = "2011737778-o7ntPvgO";
  const catalog = {
    music: "ฟังเพลงเพื่อผ่อนคลาย", express: "ระบายความรู้สึกแล้วขยำทิ้ง",
    battery: "เช็กก้อนแบตเตอรี่ใจ", box_breathing: "การหายใจแบบกล่อง",
    self_talk: "การพูดกับตนเองเชิงบวก", pmr: "Progressive Muscle Relaxation",
    diaphragmatic: "การหายใจด้วยกระบังลม", grounding: "การฝึก Grounding 5-4-3-2-1",
    ai_chat: "คุยกับเพื่อน AI ระบายความรู้สึก", bag: "กระเป๋าที่หนักเกินไป",
    psychologist: "พูดคุยกับนักจิตวิทยา", safety_check: "เช็กความปลอดภัยของตัวเอง"
  };
  function codeFor(href) {
    const url = new URL(href, location.href);
    if (url.origin === location.origin) {
      const page = url.pathname.split("/").pop();
      return {"music.html":"music","battery.html":"battery","cat.html":"box_breathing","selftalk.html":"self_talk","diaphragmatic.html":"diaphragmatic","tap-pop.html":"grounding","bag.html":"bag"}[page] || null;
    }
    if (url.hostname === "keen-arithmetic-ac7a4c.netlify.app") return "express";
    if (url.hostname === "www.youtube.com" && url.searchParams.get("v") === "2IJUD-e14FY") return "pmr";
    if (url.hostname === "script.google.com" && url.pathname === "/macros/s/AKfycbzbkmQRnjaa_4_czKx_PGboGcoVpKFx3zw390S1F5OuUNAQyw8vz7g5tHQtFviOEgjefA/exec") return "ai_chat";
    if (url.hostname === "here2healproject.com" && url.pathname === "/online-chat/") return "psychologist";
    if (url.hostname === "www.prescreening.dmind.app") return "safety_check";
    return null;
  }

  const cards = document.getElementById("cardsContainer");
  if (!cards) return;
  const status = document.createElement("p"); status.id = "activityAutoStatus";
  status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  status.style.cssText = "font-size:14px;line-height:1.7;color:#73617d;text-align:center;margin:16px 0;white-space:pre-line";
  const back = document.createElement("a");
  back.href = "index.html?app=research-v12"; back.textContent = "กลับหน้าเริ่มต้นเพื่อยืนยันข้อมูล";back.hidden = true;
  const retryBox = document.createElement("div");retryBox.id = "activityRetryBox";
  cards.before(status,back,retryBox);
  const retryRows = new Set();
  let participant = null, initialized = false, readyPromise;
  async function callApi(payload) {
    if (!window.liff || !liff.isLoggedIn()) throw new Error("กรุณาเข้าสู่ระบบ LINE ก่อนบันทึก");
    const token = liff.getIDToken();
    if (!token) throw new Error("ไม่พบ ID Token กรุณาเปิดผ่าน LINE ใหม่");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(API_URL, {
        method: "POST", headers: {"Content-Type":"application/json", apikey:API_KEY},
        body: JSON.stringify({...payload, idToken:token}), signal:controller.signal
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error("API ตอบกลับไม่ใช่ JSON (HTTP " + response.status + ")"); }
      if (!response.ok) throw new Error("HTTP " + response.status + ": " + (data.error || data.message || "บันทึกไม่สำเร็จ"));
      if (!data.success) throw new Error("API ไม่ยืนยันผลการบันทึก");
      return data;
    } finally { clearTimeout(timer); }
  }


  async function prepare() {
    try {
      status.textContent = "กำลังเตรียมการบันทึกกิจกรรม…";
      if (!window.liff) throw new Error("โหลด LINE ไม่สำเร็จ");
      if (!initialized) { await liff.init({liffId:LIFF_ID}); initialized = true; }
      const data = await callApi({action:"activity_session"});
      if (!data.participant_id) throw new Error("ไม่พบรหัสผู้เข้าร่วม");
      if (participant && participant !== data.participant_id) throw new Error("บัญชี LINE เปลี่ยน กรุณาเปิดหน้านี้ใหม่");
      participant = data.participant_id;back.hidden=true;
      status.textContent = "ระบบจะบันทึกการกดปุ่มไปทำกิจกรรมตามความยินยอมที่หน้าแรก";
      return true;
    } catch (error) {
      status.textContent = "ยังไม่เปิดการบันทึก: " + error.message + "\nคุณยังเปิดกิจกรรมได้ตามปกติ";
      back.hidden=false;return false;
    }
  }
  function removeRetry(run) {
    if (run.retryRow) { run.retryRow.remove();retryRows.delete(run.retryRow);run.retryRow=null; }
  }
  async function save(run) {
    if(run.busy || run.saved)return;
    run.busy=true;
    if(run.retryButton)run.retryButton.disabled=true;
    try {
      if(!await readyPromise)throw new Error("ยังไม่ได้เชื่อมต่อหรือยืนยันความยินยอมที่หน้าแรก");
      const data=await callApi({action:"save_activity",activity_code:run.code,event_type:"opened",run_id:run.id,expected_participant_id:participant});
      if(data.run_id!==run.id || data.participant_id!==participant || data.activity_code!==run.code || data.event_type!=="opened")throw new Error("ผลตอบกลับไม่ตรงกับรายการที่ส่ง");
      run.saved=true;removeRetry(run);
      status.textContent="บันทึกการกดเปิดกิจกรรมแล้ว";
    } catch(error) {
      status.textContent="บางรายการยังบันทึกไม่สำเร็จ คุณยังใช้งานกิจกรรมได้ตามปกติ";
      if(!run.retryRow){
        run.retryRow=document.createElement("div");run.retryRow.style.cssText="font-size:14px;padding:10px;margin:8px 0;background:#fff5fb;border-radius:10px";
        run.errorText=document.createElement("span");
        run.retryButton=document.createElement("button");run.retryButton.type="button";run.retryButton.textContent="ลองบันทึกอีกครั้ง";
        run.retryButton.style.cssText="margin-left:10px;padding:8px;border-radius:8px;cursor:pointer";
        run.retryButton.addEventListener("click",async()=>{if(!participant)readyPromise=prepare();await save(run);});
        run.retryRow.append(run.errorText,run.retryButton);retryBox.append(run.retryRow);retryRows.add(run.retryRow);
      }
      run.errorText.textContent=catalog[run.code]+": "+(error.name==="AbortError"?"ระบบตอบกลับช้า":error.message);
    }finally{run.busy=false;if(run.retryButton)run.retryButton.disabled=false;}
  }
  const lastClicks=new Map();
  function track(event){
    const link=event.target.closest?.("#modalBody a.action-btn");
    if(!link || (event.type==="auxclick" && event.button!==1))return;
    const code=codeFor(link.href);if(!code)return;
    const now=Date.now();if(now-(lastClicks.get(code)||0)<1200)return;lastClicks.set(code,now);
    // Count only the explicit link click, not merely opening the details card.
    void save({id:crypto.randomUUID(),code,busy:false,saved:false});
    // Do not delay or prevent normal navigation, including links to support services.
  }
  readyPromise=prepare();
  document.addEventListener("click",track,true);
  document.addEventListener("auxclick",track,true);
})();
