"use strict";

// การเชื่อมต่อโครงการเดิม
const LIFF_ID = "2011737778-o7ntPvgO";
const API_URL = "https://xbciyctqkwokpxlvxiro.supabase.co/functions/v1/research-api";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mMRYahDfhiPXDcj-Ui-0dg_LK0NR5-q";
const REDIRECT_URL = "https://intira1601.github.io/spst20/?app=research-v12";
const PENDING_CONSENT_KEY = "spst20.pendingConsent.v12";

const questions = [
    { text: "กลัวทำงานผิดพลาด" },
    { text: "ไปไม่ถึงเป้าหมายที่วางไว้" },
    { text: "ครอบครัวมีความขัดแย้งกันในเรื่องเงินหรือเรื่องงานในบ้าน" },
    { text: "เป็นกังวลกับเรื่องสารพิษหรือมลภาวะในอากาศ น้ำ เสียง และดิน" },
    { text: "รู้สึกว่าต้องแข่งขันหรือเปรียบเทียบ" },
    { text: "เงินไม่พอใช้จ่าย" },
    { text: "กล้ามเนื้อตึงหรือปวด" },
    { text: "ปวดหัวจากความตึงเครียด" },
    { text: "ปวดหลัง" },
    { text: "ความอยากอาหารเปลี่ยนแปลง" },
    { text: "ปวดศีรษะข้างเดียว" },
    { text: "รู้สึกวิตกกังวล" },
    { text: "รู้สึกคับข้องใจ" },
    { text: "รู้สึกโกรธ หรือหงุดหงิด" },
    { text: "รู้สึกเศร้า" },
    { text: "ความจำไม่ดี" },
    { text: "รู้สึกสับสน" },
    { text: "ตั้งสมาธิลำบาก" },
    { text: "รู้สึกเหนื่อยง่าย" },
    { text: "เป็นหวัดบ่อย ๆ" }
];



function setupAssessment() {
    const requiredIds = ["startButton", "questionContainer", "nextButton", "questionNumber", "questionText", "progressFill", "progressPercent", "resultContainer", "score", "stressLevel", "resultDescription", "adviceButton"];
    const missing = requiredIds.filter(id => !document.getElementById(id));
    const startPage = document.querySelector(".container");
    if (missing.length || !startPage) {
        alert("HTML ขาดส่วนที่จำเป็น: " + [...missing, ...(!startPage ? [".container"] : [])].join(", "));
        return;
    }
    const get = id => document.getElementById(id);
    const startButton = get("startButton");
    const questionContainer = get("questionContainer");
    const nextButton = get("nextButton");
    const questionNumber = get("questionNumber");
    const questionText = get("questionText");
    const progressFill = get("progressFill");
    const progressPercent = get("progressPercent");
    let participantId = null;
    let busy = false;
    let liffReady = false;

    // แยกหน้าความยินยอมออกจากหน้าเตรียมประเมิน
    const style = document.createElement("style");
    style.textContent = `
      .container.research-flow { box-sizing:border-box; width:calc(100% - 32px); max-width:620px; margin:32px auto; padding:36px 28px; border-radius:28px; background:#fff; color:#403750; box-shadow:0 16px 50px #70479912; text-align:left; }
      .research-flow *, .research-flow *::before, .research-flow *::after { box-sizing:border-box; }
      .research-flow [hidden] { display:none !important; }
      .research-flow .flow-steps {display:flex; gap:10px; margin-bottom:30px; font-size:14px; color:#82758f;}
      .research-flow .flow-step {flex:1; border-top:3px solid #eae2f3; padding-top:10px;}
      .research-flow .flow-step.active {border-color:#9663d8;color:#7146aa;font-weight:700;}
      .research-flow .flow-icon {width:56px;height:56px;border-radius:18px;background:#f4ecfc;display:grid;place-items:center;font-size:28px;margin-bottom:18px;}
      .research-flow h1 {font-size:clamp(25px,5vw,32px);line-height:1.4;color:#49325f;margin:0 0 12px;}
      .research-flow p {font-size:16px;line-height:1.8;margin:0 0 16px;color:#665b73;}
      .research-flow .flow-card {background:#faf7fd;border:1px solid #eee4f7;border-radius:18px;padding:20px;margin:22px 0;}
      .research-flow .flow-card h2 {font-size:17px;color:#554062;margin:0 0 10px;}
      .research-flow .flow-card p:last-child {margin-bottom:0;}
      .research-flow .flow-consent {display:flex;align-items:flex-start;gap:12px;padding:16px 0;cursor:pointer;font-size:16px;line-height:1.7;text-align:left;background:none;}
      .research-flow .flow-consent input {appearance:auto;flex:0 0 20px;width:20px;height:20px;margin:5px 0 0;accent-color:#925acb;}
      .research-flow button {display:block;width:100%;margin:16px 0 0;padding:16px 18px;min-height:54px;border:0;border-radius:16px;background:linear-gradient(110deg,#a377e9,#dc55ad);color:#fff;font:inherit;font-size:18px;font-weight:700;cursor:pointer;}
      .research-flow button:disabled {opacity:.45;cursor:not-allowed;}
      .research-flow button:focus-visible,.research-flow input:focus-visible {outline:3px solid #7546af;outline-offset:4px;}
      .research-flow .flow-status {white-space:pre-line;font-size:14px;margin:16px 0 0;overflow-wrap:anywhere;}
      .research-flow .flow-id {font-family:ui-monospace,monospace;font-size:30px;letter-spacing:2px;color:#7546af;margin:6px 0 12px;font-weight:700;}
      .research-flow .flow-tag {display:inline-block;padding:5px 12px;border-radius:99px;background:#f2eafa;color:#7a4db0;font-size:13px;margin-bottom:14px;}
      @media(max-width:480px){.container.research-flow{margin:16px auto;padding:26px 20px;border-radius:22px}.research-flow .flow-steps{font-size:12px;gap:8px}}
    `;
    document.head.append(style);
    startPage.classList.add("research-flow");
    startPage.innerHTML = `
      <nav class="flow-steps" aria-label="ขั้นตอนก่อนทำแบบประเมิน">
        <span class="flow-step active" id="consentStep" aria-current="step">01 · ความยินยอม</span>
        <span class="flow-step" id="readyStep">02 · พร้อมประเมิน</span>
      </nav>
      <section id="consentView" aria-labelledby="consentTitle">
        <div class="flow-icon" aria-hidden="true">♡</div>
        <h1 id="consentTitle">ก่อนเริ่ม มาทำความเข้าใจกัน</h1>
        <p>โปรดอ่านข้อมูลการใช้รหัสผู้เข้าร่วม แล้วเลือกยินยอมเพื่อเข้าสู่แบบประเมินความเครียด</p>
        <div class="flow-card">
          <h2>ระบบจดจำคุณอย่างไร</h2>
          <p>ระบบใช้รหัสบัญชี LINE เพื่อค้นหาหรือสร้างรหัสผู้เข้าร่วม โดยไม่ขอให้คุณกรอกชื่อจริง</p>
          <p>เมื่อคุณตอบครบ 20 ข้อ ระบบจะบันทึกคำตอบ คะแนน ระดับผลการประเมิน และเวลาที่บันทึกไว้กับรหัสผู้เข้าร่วม ระบบยังเชื่อมโยงบัญชี LINE กับรหัสนี้ได้</p>
          <p>เมื่อกดปุ่มไปทำกิจกรรม ระบบจะบันทึกชื่อกิจกรรมและเวลาที่บันทึกการกดเปิด โดยเชื่อมกับรหัสเดียวกัน การกดเปิดไม่ได้หมายความว่าทำกิจกรรมเสร็จ และส่วนบันทึกนี้ไม่เก็บเนื้อหาแชทหรือข้อความที่คุณเขียนในกิจกรรม</p>
        </div>
        <label class="flow-consent"><input id="researchConsent" type="checkbox"><span>ฉันยินยอมให้ระบบใช้รหัสบัญชี LINE เพื่อเชื่อมรหัสผู้เข้าร่วมและบันทึกคำตอบ ผลประเมิน และการกดเปิดกิจกรรมตามที่อธิบายข้างต้น</span></label>
        <button id="connectResearch" type="button">ยินยอมและดำเนินการต่อ</button>
        <p id="connectionStatus" class="flow-status" role="status" aria-live="polite"></p>
      </section>
      <section id="readyView" aria-labelledby="readyTitle" hidden>
        <span class="flow-tag">SPST-20 · 20 ข้อ</span>
        <h1 id="readyTitle" tabindex="-1">พร้อมเช็กความเครียดของคุณ</h1>
        <p>แบบประเมินความเครียดสำหรับนักศึกษาพยาบาล</p>
        <div class="flow-card">
          <h2>รหัสผู้เข้าร่วมของคุณ</h2>
          <p id="participantDisplay" class="flow-id"></p>
          <p>นี่คือรหัสที่ระบบสุ่มให้เพื่อใช้แทนชื่อในข้อมูลวิจัย ช่วยเชื่อมการประเมินแต่ละครั้งของคุณ เมื่อกลับมาด้วยบัญชี LINE เดิม ระบบจะค้นหารหัสเดิมให้</p>
          <p>รหัสนี้ไม่ใช่รหัสผ่าน และไม่ต้องกรอกก่อนทำแบบประเมิน</p>
        </div>
        <div class="flow-card">
          <h2>วิธีตอบแบบประเมิน</h2>
          <p>ให้นึกถึงเหตุการณ์ในช่วง 6 เดือนที่ผ่านมา แล้วเลือกคำตอบที่ตรงกับความรู้สึกของคุณในแต่ละข้อ</p>
        </div>
      </section>
    `;
    const consent = get("researchConsent");
    const connectButton = get("connectResearch");
    const status = get("connectionStatus");
    const participantDisplay = get("participantDisplay");
    const consentView = get("consentView");
    const readyView = get("readyView");
    readyView.append(startButton);
    startButton.textContent = "เริ่มทำแบบประเมิน";
    startButton.type = "button";
    nextButton.type = "button";
    startButton.disabled = true;
    questionContainer.style.display = "none";
    get("resultContainer").style.display = "none";
    get("adviceButton").hidden = true;

    function showReadyPage() {
        participantDisplay.textContent = participantId;
        consentView.hidden = true;
        readyView.hidden = false;
        get("consentStep").classList.remove("active");
        get("consentStep").removeAttribute("aria-current");
        get("readyStep").classList.add("active");
        get("readyStep").setAttribute("aria-current", "step");
        startPage.scrollIntoView({ block: "start" });
        get("readyTitle").focus({ preventScroll: true });
    }

    function updateControls() {
        connectButton.disabled = busy || !consent.checked || !!participantId;
        consent.disabled = busy || !!participantId;
        startButton.disabled = !participantId;
    }
    consent.addEventListener("change", updateControls);

    function isTokenExpired(token) {
        try {
            const part = token.split(".")[1];
            if (!part || token.split(".").length !== 3) return true;
            const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
            const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
            const payload = JSON.parse(new TextDecoder().decode(bytes));
            return typeof payload.exp !== "number" || Date.now() >= payload.exp * 1000 - 30000;
        } catch { return true; }
    }

    async function initializeLIFF() {
        if (!window.liff) throw new Error("โหลด LINE SDK ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วเปิดหน้าใหม่");
        if (!liffReady) {
            status.textContent = "กำลังเชื่อมต่อ LINE…";
            await liff.init({ liffId: LIFF_ID });
            liffReady = true;
        }
        if (!liff.isLoggedIn()) {
            if (liff.isInClient()) throw new Error("ไม่พบการเข้าสู่ระบบ LINE กรุณาปิดแล้วเปิดผ่าน LINE OA ใหม่");
            status.textContent = "กำลังไปหน้าเข้าสู่ระบบ LINE…";
            // เก็บเฉพาะความยินยอมชั่วคราวในแท็บนี้ ไม่เก็บ token
            try { sessionStorage.setItem(PENDING_CONSENT_KEY, String(Date.now())); } catch {}
            liff.login({ redirectUri: REDIRECT_URL });
            return false;
        }
        return true;
    }

    connectButton.addEventListener("click", async () => {
        if (busy || participantId || !consent.checked) return;
        busy = true;
        updateControls();
        try {
            if (!await initializeLIFF()) return;
            const idToken = liff.getIDToken();
            if (!idToken) throw new Error("ไม่พบ LINE ID Token กรุณาตรวจว่า LIFF เปิด scope openid แล้ว จากนั้นปิดและเปิดหน้าใหม่");
            if (isTokenExpired(idToken)) {
                if (!liff.isInClient()) {
                    liff.logout();
                    status.textContent = "การเข้าสู่ระบบหมดอายุ กรุณากดเชื่อมต่ออีกครั้งเพื่อเข้าสู่ระบบใหม่";
                    return;
                }
                throw new Error("การเข้าสู่ระบบหมดอายุ กรุณาปิดหน้านี้แล้วเปิดผ่าน LINE OA ใหม่");
            }
            status.textContent = "กำลังค้นหาหรือสร้างรหัสผู้เข้าร่วม…";
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 25000);
            let response, raw;
            try {
                response = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
                    body: JSON.stringify({ idToken, consented: true, research_consent_version: "research-v2" }),
                    signal: controller.signal
                });
                raw = await response.text();
            } finally { clearTimeout(timeout); }
            let data;
            try { data = JSON.parse(raw); }
            catch { throw new Error("API ตอบกลับไม่ใช่ JSON (HTTP " + response.status + ")"); }
            if (!response.ok) {
                const detail = [data?.error || data?.message || "เชื่อมต่อ API ไม่สำเร็จ", data?.line_error, data?.line_error_description].filter(Boolean).join(" | ");
                throw new Error("HTTP " + response.status + ": " + detail);
            }
            if (typeof data?.participant_id !== "string" || !data.participant_id.trim()) {
                throw new Error("API ไม่ส่ง participant_id ที่ถูกต้องกลับมา");
            }
            participantId = data.participant_id;
            showReadyPage();
            status.textContent = "เชื่อมต่อสำเร็จ สามารถเริ่มทำแบบประเมินได้";
            connectButton.textContent = "เชื่อมต่อแล้ว";
        } catch (error) {
            let message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
            if (error?.name === "AbortError") message = "ระบบตอบกลับช้าเกินไป กรุณาลองเชื่อมต่ออีกครั้ง";
            else if (error instanceof TypeError) message = "เชื่อมต่อไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ต หากยังพบปัญหาให้ตรวจ CORS และการเผยแพร่ research-api";
            status.textContent = "เชื่อมต่อไม่สำเร็จ: " + message;
            connectButton.textContent = "ลองเชื่อมต่ออีกครั้ง";
            console.error("Research connection failed:", message);
        } finally {
            busy = false;
            updateControls();
        }
    });
    updateControls();
    status.textContent = "";

    // กลับจาก LINE: ใช้ความยินยอมที่เพิ่งกดในแท็บเดิมได้ครั้งเดียว ภายใน 10 นาที
    const callbackParams = new URLSearchParams(window.location.search);
    if (callbackParams.has("code") && callbackParams.has("state")) {
        let consentTime = 0;
        try {
            consentTime = Number(sessionStorage.getItem(PENDING_CONSENT_KEY));
            sessionStorage.removeItem(PENDING_CONSENT_KEY);
        } catch {}
        const age = Date.now() - consentTime;
        if (consentTime > 0 && age >= 0 && age < 10 * 60 * 1000) {
            consent.checked = true;
            updateControls();
            connectButton.click();
        } else {
            status.textContent = "กลับจาก LINE แล้ว กรุณายืนยันความยินยอมเพื่อดำเนินการต่อ";
        }
    }

    const saveStatus = document.createElement("p");
    saveStatus.id = "assessmentSaveStatus";
    saveStatus.setAttribute("role", "status");
    saveStatus.style.whiteSpace = "pre-line";
    const retrySave = document.createElement("button");
    retrySave.type = "button";
    retrySave.textContent = "ลองบันทึกอีกครั้ง";
    retrySave.hidden = true;
    get("resultContainer").append(saveStatus, retrySave);
    let savingAssessment = false;
    let assessmentSaved = false;
    let submissionId = null;
    const answers = [];

    function makeSubmissionId() {
        if (crypto.randomUUID) return crypto.randomUUID();
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 15) | 64;
        bytes[8] = (bytes[8] & 63) | 128;
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
        return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");
    }

    async function saveAssessment() {
        if (savingAssessment || assessmentSaved || answers.length !== 20) return;
        savingAssessment = true;
        retrySave.hidden = true;
        saveStatus.textContent = "กำลังบันทึกผลประเมิน กรุณาอย่าเพิ่งปิดหน้านี้…";
        try {
            submissionId ||= makeSubmissionId();
            const idToken = liff.getIDToken();
            if (!idToken || isTokenExpired(idToken)) throw new Error("การเข้าสู่ระบบหมดอายุ ผลครั้งนี้ยังไม่ถูกบันทึก กรุณาเปิดผ่าน LINE ใหม่และทำแบบประเมินอีกครั้ง");
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 25000);
            let response, raw;
            try {
                response = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
                    body: JSON.stringify({ action: "save_assessment", idToken, submission_id: submissionId, answers }),
                    signal: controller.signal
                });
                raw = await response.text();
            } finally { clearTimeout(timeout); }
            let data;
            try { data = JSON.parse(raw); } catch { throw new Error("API ตอบกลับไม่ใช่ JSON (HTTP " + response.status + ")"); }
            if (!response.ok) throw new Error("HTTP " + response.status + ": " + (data?.error || data?.message || "บันทึกไม่สำเร็จ"));
            if (!data.success || !data.assessment_id || data.submission_id !== submissionId || data.participant_id !== participantId || data.total_score !== totalScore) {
                throw new Error("ผลตอบกลับไม่ตรงกับรายการที่ส่ง กรุณาลองบันทึกอีกครั้ง");
            }
            assessmentSaved = true;
            saveStatus.textContent = "บันทึกผลประเมินเรียบร้อยแล้ว";
            get("adviceButton").hidden = false;
        } catch (error) {
            const message = error?.name === "AbortError" ? "ระบบตอบกลับช้า" : error.message;
            saveStatus.textContent = "ยังยืนยันการบันทึกไม่ได้: " + message + "\nหากเป็นปัญหาเครือข่าย โปรดคงหน้านี้ไว้แล้วกดลองบันทึกอีกครั้ง";
            retrySave.hidden = false;
        } finally { savingAssessment = false; }
    }
    retrySave.addEventListener("click", saveAssessment);

let currentQuestion = 1;

let totalScore = 0;
let completed = false;


// =============================
// เริ่มทำแบบประเมิน
// =============================

startButton.addEventListener(
    "click",
    function () {


        // ป้องกันการเริ่มก่อนมี Participant ID
        if (!participantId) {

            alert(
                "กำลังเชื่อมต่อระบบค่ะ\n" +
                "กรุณารอสักครู่นะคะ"
            );

            return;
        }


        startPage.style.display =
            "none";


        questionContainer.style.display =
            "block";


        questionText.textContent =
            questions[0].text;


        questionNumber.textContent =
            "ข้อที่ 1 / 20";


        progressFill.style.width =
            "5%";


        progressPercent.textContent =
            "5%";

    }
);


// =============================
// เปลี่ยนข้อคำถาม
// =============================

nextButton.addEventListener(
    "click",
    function () {


        if (completed || !participantId) return;

        const selectedAnswer =
            document.querySelector(
                'input[name="answer"]:checked'
            );


        // ยังไม่ได้เลือกคำตอบ
        if (!selectedAnswer) {

            alert(
                "กรุณาเลือกคำตอบก่อนค่ะ"
            );

            return;
        }


        // =============================
        // เก็บคะแนน
        // =============================

        const score =
            Number(
                selectedAnswer.value
            );


        if (!Number.isInteger(score) || score < 1 || score > 5) {
            alert("ค่าคำตอบไม่ถูกต้อง กรุณาเลือกใหม่");
            return;
        }
        answers.push(score);
        totalScore += score;


        // =============================
        // ยังไม่ถึงข้อ 20
        // =============================

        if (currentQuestion < 20) {

            currentQuestion++;


            questionNumber.textContent =
                "ข้อที่ " +
                currentQuestion +
                " / 20";


            questionText.textContent =
                questions[
                    currentQuestion - 1
                ].text;


            const progress =
                (currentQuestion / 20) * 100;


            progressFill.style.width =
                progress + "%";


            progressPercent.textContent =
                progress + "%";


            // ล้างคำตอบข้อก่อน
            selectedAnswer.checked =
                false;

        }


        // =============================
        // ครบ 20 ข้อ
        // =============================

        else {

            completed = true;
            nextButton.disabled = true;
            questionContainer.style.display = "none";


            const resultContainer =
                document.getElementById(
                    "resultContainer"
                );


            resultContainer.style.display =
                "block";


            // =============================
            // แสดงคะแนน
            // =============================

            const scoreDisplay =
                document.getElementById(
                    "score"
                );


            scoreDisplay.textContent =
                totalScore +
                " คะแนน";


            // =============================
            // แปลผล
            // =============================

            const stressLevel =
                document.getElementById(
                    "stressLevel"
                );


            const resultDescription =
                document.getElementById(
                    "resultDescription"
                );


            let level;


            // น้อย
            if (totalScore <= 23) {

                level = "น้อย";


                stressLevel.textContent =
                    "ระดับความเครียด: น้อย";


                resultDescription.textContent =
                    "มีความเครียดอยู่ในระดับน้อย สามารถดำเนินชีวิตประจำวันได้ตามปกติ และควรดูแลสุขภาพกายและสุขภาพจิตอย่างสม่ำเสมอ";

            }


            // ปานกลาง
            else if (totalScore <= 41) {

                level = "ปานกลาง";


                stressLevel.textContent =
                    "ระดับความเครียด: ปานกลาง";


                resultDescription.textContent =
                    "มีความเครียดอยู่ในระดับปานกลาง ควรหาวิธีผ่อนคลายและจัดการกับความเครียดอย่างเหมาะสม รวมทั้งดูแลการพักผ่อนและสุขภาพของตนเอง";

            }


            // สูง
            else if (totalScore <= 61) {

                level = "สูง";


                stressLevel.textContent =
                    "ระดับความเครียด: สูง";


                resultDescription.textContent =
                    "มีความเครียดอยู่ในระดับสูง ควรให้ความสำคัญกับการจัดการความเครียด หาสาเหตุของความเครียด และหาเวลาพักผ่อนหรือทำกิจกรรมที่ช่วยผ่อนคลาย";

            }


            // รุนแรง
            else {

                level = "รุนแรง";


                stressLevel.textContent =
                    "ระดับความเครียด: รุนแรง";


                resultDescription.textContent =
                    "มีความเครียดอยู่ในระดับรุนแรง ควรดูแลตนเองอย่างจริงจังและพิจารณาปรึกษาบุคลากรด้านสุขภาพหรือผู้เชี่ยวชาญด้านสุขภาพจิตเพื่อรับคำแนะนำที่เหมาะสม";

            }


            // =============================
            // เก็บคะแนนชั่วคราว
            // =============================

            try {
                localStorage.setItem("stressScore", String(totalScore));
            } catch {
                console.warn("ไม่สามารถเก็บคะแนนชั่วคราวบนอุปกรณ์นี้ได้");
            }


            // =============================
            // แสดงปุ่มคำแนะนำ
            // =============================

            void saveAssessment();

        }

    }
);

}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupAssessment, { once: true });
} else {
    setupAssessment();
}
