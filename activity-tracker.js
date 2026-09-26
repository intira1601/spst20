"use strict";
// Add after the existing inline script in advice.html. Does not replace it.
(() => {
  if (document.getElementById("activityResearchPanel")) return;
  const API_URL = "https://xbciyctqkwokpxlvxiro.supabase.co/functions/v1/research-api";
  const API_KEY = "sb_publishable_mMRYahDfhiPXDcj-Ui-0dg_LK0NR5-q";
  const LIFF_ID = "2011737778-o7ntPvgO";
  const RETURN_URL = "https://intira1601.github.io/spst20/advice.html?app=activities-v1";
  const CONSENT_KEY = "spst.activities.pending.v1";
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
  const panel = document.createElement("section");
  panel.id = "activityResearchPanel";
  panel.innerHTML = `
    <h2>บันทึกกิจกรรมของคุณ</h2>
    <p>เมื่อเปิดการบันทึก ระบบจะเก็บชื่อกิจกรรม เวลาที่กดเปิด และการยืนยันว่าทำเสร็จ โดยเชื่อมกับรหัสผู้เข้าร่วมเดิม ไม่เก็บข้อความสนทนาหรือสิ่งที่คุณเขียนในกิจกรรมผ่านส่วนบันทึกนี้</p>
    <label><input type="checkbox" id="activityConsent"> ฉันยินยอมให้บันทึกข้อมูลกิจกรรมตามที่อธิบายข้างต้น</label>
    <button type="button" id="activityConnect" disabled>ยินยอมและเปิดการบันทึก</button>
    <p id="activityConnection" role="status" aria-live="polite"></p>
    <p>คุณเปิดกิจกรรมได้แม้ไม่ได้เปิดการบันทึก เมื่อทำเสร็จให้กลับมาหน้านี้เพื่อกดยืนยัน</p>
    <div id="activityRuns"></div>`;
  const style = document.createElement("style");
  style.textContent = `#activityResearchPanel{box-sizing:border-box;max-width:900px;margin:24px auto;padding:22px;border:1px solid #eadff4;border-radius:20px;background:#fff;color:#51425f;text-align:left;font:inherit}#activityResearchPanel h2{font-size:20px;margin:0 0 12px}#activityResearchPanel p{font-size:15px;line-height:1.7;white-space:pre-line;margin:12px 0}#activityResearchPanel label{display:flex;gap:10px;align-items:flex-start;line-height:1.7}#activityResearchPanel input{appearance:auto;width:20px;height:20px;flex-shrink:0;accent-color:#9663d8}#activityResearchPanel button{font:inherit;padding:12px 16px;background:#8657be;color:white;border:0;border-radius:12px;cursor:pointer;margin:10px 8px 0 0}#activityResearchPanel button:disabled{opacity:.5;cursor:default}#activityResearchPanel [hidden]{display:none!important}#activityResearchPanel .activity-run{border-top:1px solid #eadff4;margin-top:18px;padding-top:14px}#activityResearchPanel button:focus-visible{outline:3px solid #d788c8;outline-offset:3px}`;
  document.head.append(style);
  const cards = document.getElementById("cardsContainer");
  if (!cards) return;
  cards.before(panel);
  const get = id => document.getElementById(id);
  const consent = get("activityConsent"), connect = get("activityConnect"), status = get("activityConnection");
  let initialized = false, connecting = false, participant = null;
  const runs = [];
  consent.addEventListener("change", () => { connect.disabled = !consent.checked || connecting; });

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

  async function enableTracking() {
    if (!consent.checked || connecting || participant) return;
    connecting = true; connect.disabled = true;
    status.textContent = "กำลังเชื่อมรหัสผู้เข้าร่วม…";
    try {
      if (!window.liff) throw new Error("โหลด LINE SDK ไม่สำเร็จ กรุณาตรวจ script ใน advice.html");
      if (!initialized) { await liff.init({liffId:LIFF_ID}); initialized = true; }
      if (!liff.isLoggedIn()) {
        if (liff.isInClient()) throw new Error("กรุณาปิดแล้วเปิดผ่าน LINE ใหม่");
        try { sessionStorage.setItem(CONSENT_KEY, String(Date.now())); } catch {}
        liff.login({redirectUri:RETURN_URL});
        status.textContent = "กำลังไปหน้าเข้าสู่ระบบ LINE…";
        return;
      }
      const data = await callApi({action:"activity_session"});
      if (typeof data.participant_id !== "string" || !data.participant_id) throw new Error("ไม่พบรหัสผู้เข้าร่วม");
      participant = data.participant_id;
      consent.disabled = true; connect.hidden = true;
      status.textContent = "เปิดการบันทึกแล้ว · รหัส " + participant + "\nเลือกกิจกรรมและกดปุ่มไปทำกิจกรรมตามปกติ";
    } catch (error) {
      status.textContent = "เชื่อมต่อไม่ได้: " + error.message + "\nยังสามารถเปิดกิจกรรมได้ แต่จะไม่บันทึกการเปิดครั้งนั้น";
    } finally { connecting = false; connect.disabled = !consent.checked; }
  }
  connect.addEventListener("click", enableTracking);

  async function saveEvent(run, type) {
    if (run.busy || run.done || (type === "opened" && run.openSaved)) return;
    run.busy = true; run.retry.hidden = true; run.complete.disabled = true;
    run.message.textContent = "กำลังบันทึก…";
    try {
      const data = await callApi({action:"save_activity", activity_code:run.code, run_id:run.id,
        event_type:type, consented:true, consent_version:"activities-v1", expected_participant_id:participant});
      if (data.participant_id !== participant || data.run_id !== run.id || data.event_type !== type || data.activity_code !== run.code) throw new Error("ผลตอบกลับไม่ตรงกับรายการที่ส่ง");
      if (type === "opened") {
        run.openSaved = true;
        run.message.textContent = "บันทึกการกดเปิดแล้ว เมื่อทำเสร็จ กลับมากดยืนยันด้านล่าง";
        run.complete.hidden = false;
      } else {
        run.done = true; run.complete.hidden = true;
        run.message.textContent = "บันทึกแล้ว: คุณยืนยันว่าทำกิจกรรมนี้เสร็จแล้ว";
      }
    } catch (error) {
      run.message.textContent = "ยังยืนยันการบันทึกไม่ได้: " + (error.name === "AbortError" ? "ระบบตอบกลับช้า" : error.message) + "\nโปรดคงหน้านี้ไว้แล้วกดลองบันทึกอีกครั้ง";
      run.retry.hidden = false;
      run.retry.onclick = () => saveEvent(run, type);
    } finally { run.busy = false; run.complete.disabled = !run.openSaved || run.done; }
  }
  const lastClicks = new Map();
  function recordClick(event) {
    const link = event.target.closest?.("#modalBody a.action-btn");
    if (!link || !participant || (event.type === "auxclick" && event.button !== 1)) return;
    const code = codeFor(link.href);
    if (!code) { status.textContent = "กิจกรรมนี้ยังไม่ได้เชื่อมกับระบบบันทึก"; return; }
    // Treat accidental double-clicks as the same opening. Later deliberate opens get a new run.
    const now = Date.now();
    if (now - (lastClicks.get(code) || 0) < 1200) return;
    lastClicks.set(code,now);
    const run = {id:crypto.randomUUID(),code,openSaved:false,done:false,busy:false};
    const row = document.createElement("div"); row.className = "activity-run";
    const title = document.createElement("strong"); title.textContent = catalog[code] + " · " + new Date().toLocaleTimeString("th-TH");
    run.message = document.createElement("p"); run.message.setAttribute("role","status");
    run.complete = document.createElement("button"); run.complete.type = "button";
    run.complete.textContent = "ฉันทำกิจกรรมนี้เสร็จแล้ว"; run.complete.hidden = true;
    run.complete.addEventListener("click",()=>saveEvent(run,"completed_self_report"));
    run.retry = document.createElement("button"); run.retry.type="button"; run.retry.textContent="ลองบันทึกอีกครั้ง"; run.retry.hidden=true;
    row.append(title,run.message,run.complete,run.retry);get("activityRuns").prepend(row);runs.push(run);
    void saveEvent(run,"opened");
    // Never prevent navigation or wait before opening external support services.
  }
  document.addEventListener("click",recordClick,true);
  document.addEventListener("auxclick",recordClick,true);
  const params = new URLSearchParams(location.search);
  if (params.has("code") && params.has("state")) {
    let time = 0;
    try {time=Number(sessionStorage.getItem(CONSENT_KEY));sessionStorage.removeItem(CONSENT_KEY);}catch{}
    const age=Date.now()-time;
    if(time>0 && age>=0 && age<600000){consent.checked=true;void enableTracking();}
  }
})();
