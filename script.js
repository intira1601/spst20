"use strict";

// ใช้ key จากไฟล์แรกที่ให้มา โปรดตรวจให้ตรงกับ Supabase Dashboard
const LIFF_ID = "2011737778-o7ntPvgO";
const API_URL = "https://xbciyctqkwokpxlvxiro.supabase.co/functions/v1/research-api";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mMRYahDfhiPXDcj-Ui-0dg_LK0NR5-q";
const REDIRECT_URL = "https://intira1601.github.io/spst20/";

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

    // สร้างส่วนเชื่อมต่อใน HTML เดิมได้ ไม่จำเป็นต้องเพิ่ม element เอง
    const panel = document.createElement("div");
    const notice = document.createElement("p");
    notice.textContent = "ระบบใช้รหัสบัญชี LINE เพื่อจดจำผู้เข้าร่วมเดิมและเชื่อมข้อมูลแต่ละครั้ง โดยใช้รหัสผู้เข้าร่วมแทนชื่อจริง";
    const label = document.createElement("label");
    const consent = document.createElement("input");
    consent.type = "checkbox";
    label.append(consent, document.createTextNode(" ฉันยินยอมให้ระบบสร้างหรือค้นหารหัสผู้เข้าร่วมโดยใช้บัญชี LINE"));
    const connectButton = document.createElement("button");
    connectButton.type = "button";
    connectButton.textContent = "ยินยอมและเชื่อมต่อระบบ";
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.style.whiteSpace = "pre-line";
    let participantDisplay = get("participantDisplay");
    if (!participantDisplay) {
        participantDisplay = document.createElement("p");
        participantDisplay.id = "participantDisplay";
        panel.append(participantDisplay);
    }
    panel.prepend(notice, label, connectButton, status);
    startButton.before(panel);
    startButton.type = "button";
    nextButton.type = "button";
    startButton.disabled = true;
    questionContainer.style.display = "none";
    get("resultContainer").style.display = "none";
    get("adviceButton").hidden = true;

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
            status.textContent = "กำลังไปหน้าเข้าสู่ระบบ LINE หลังกลับมาโปรดกดยินยอมและเชื่อมต่ออีกครั้ง";
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
                    body: JSON.stringify({ idToken, consented: true }),
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
            participantDisplay.textContent = "รหัสผู้เข้าร่วมของคุณ: " + participantId;
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
    status.textContent = "โปรดยินยอมและเชื่อมต่อระบบเพื่อรับรหัสผู้เข้าร่วมก่อนเริ่มประเมิน";

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
        totalScore += score;


        console.log(
            "ข้อที่:",
            currentQuestion
        );


        console.log(
            "คะแนนข้อนี้:",
            score
        );


        console.log(
            "คะแนนรวม:",
            totalScore
        );


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

            document.getElementById(
                "adviceButton"
            ).hidden = false;


            console.log(
                "Participant ID:",
                participantId
            );


            console.log(
                "คะแนนสุดท้าย:",
                totalScore
            );


            console.log(
                "ระดับ:",
                level
            );

        }

    }
);

}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupAssessment, { once: true });
} else {
    setupAssessment();
}
