// =============================
// LIFF CONFIG
// =============================

const LIFF_ID = "2011737778-o7ntPvgO";
const API_URL =
    "https://xbciyctqkwokpxlvxiro.supabase.co/functions/v1/research-api";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mMRYahDfhiPXDcj-Ui-0dg_LK0NR5-q";
// เก็บ Participant ID ที่ได้จากระบบ
let participantId = null;


// =============================
// คำถาม SPST-20
// =============================

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


// =============================
// เชื่อมต่อ HTML
// =============================

const startButton = document.getElementById("startButton");
const startPage = document.querySelector(".container");
const questionContainer = document.getElementById("questionContainer");
const nextButton = document.getElementById("nextButton");
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");


// =============================
// เริ่มต้น LIFF
// =============================

async function initializeLIFF() {
    try {
        console.log("เริ่ม LIFF...");

        await liff.init({
            liffId: LIFF_ID
        });

        console.log("LIFF initialized");
        console.log("อยู่ใน LINE:", liff.isInClient());
        console.log("Login:", liff.isLoggedIn());

        // ถ้าเปิดจาก LINE อยู่ ไม่ควรเรียก liff.login() ซ้ำ
        if (!liff.isInClient() && !liff.isLoggedIn()) {
            console.log("กำลัง Login LINE...");
            liff.login();
            return;
        }

        // ตรวจว่า Login สำเร็จ
        if (!liff.isLoggedIn()) {
            throw new Error("LINE ยังไม่ได้ Login");
        }

        console.log("LINE Login สำเร็จ");

        // ขอ ID Token
       let idToken = liff.getIDToken();

if (!idToken) {
    console.log("ยังไม่มี ID Token กำลัง Login ใหม่...");

    if (!liff.isInClient()) {
        liff.login();
        return;
    }

    throw new Error("LINE ไม่ได้ส่ง ID Token มาให้");
}

        // ส่ง ID Token ไป Supabase
        console.log("กำลังส่งข้อมูลไป Supabase...");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify({
                idToken: idToken,
                consented: true
            })
        });

        console.log("Supabase status:", response.status);

        const data = await response.json();

        console.log("Supabase response:", data);

      if (!response.ok) {
    throw new Error(
        data.error +
        "\n" +
        (data.line_error || "") +
        "\n" +
        (data.line_error_description || "")
    );
}

        participantId = data.participant_id;

        console.log(
            "Participant ID:",
            participantId
        );

    } catch (error) {

        console.error("LIFF Error:", error);

        alert(
            "เกิดข้อผิดพลาด\n\n" +
            error.message
        );
    }
}


// =============================
// เรียก LIFF เมื่อเปิดเว็บ
// =============================

window.addEventListener("load", function () {

    initializeLIFF();

});


// =============================
// ระบบ SPST-20
// =============================

let currentQuestion = 1;
let totalScore = 0;


// =============================
// เริ่มทำแบบประเมิน
// =============================

startButton.addEventListener("click", function () {

    // ป้องกันการเริ่มก่อนระบบรู้จัก Participant
    if (!participantId) {

        alert(
            "กำลังเชื่อมต่อระบบค่ะ\n" +
            "กรุณารอสักครู่นะคะ"
        );

        return;
    }

    startPage.style.display = "none";

    questionContainer.style.display = "block";

    // แสดงข้อที่ 1
    questionText.textContent =
        questions[0].text;

    questionNumber.textContent =
        "ข้อที่ 1 / 20";

    progressFill.style.width = "5%";

    progressPercent.textContent =
        "5%";

});


// =============================
// เปลี่ยนข้อคำถาม
// =============================

nextButton.addEventListener("click", function () {

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

    // เก็บคะแนน
    const score =
        Number(selectedAnswer.value);

    totalScore =
        totalScore + score;

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
            questions[currentQuestion - 1].text;

        const progress =
            (currentQuestion / 20) * 100;

        progressFill.style.width =
            progress + "%";

        progressPercent.textContent =
            progress + "%";

        // ล้างคำตอบข้อก่อน
        selectedAnswer.checked = false;

    }


    // =============================
    // ครบ 20 ข้อ
    // =============================

    else {

        questionContainer.style.display =
            "none";

        const resultContainer =
            document.getElementById(
                "resultContainer"
            );

        resultContainer.style.display =
            "block";


        // แสดงคะแนน
        const scoreDisplay =
            document.getElementById("score");

        scoreDisplay.textContent =
            totalScore + " คะแนน";


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


        if (totalScore <= 23) {

            level = "น้อย";

            stressLevel.textContent =
                "ระดับความเครียด: น้อย";

            resultDescription.textContent =
                "มีความเครียดอยู่ในระดับน้อย สามารถดำเนินชีวิตประจำวันได้ตามปกติ และควรดูแลสุขภาพกายและสุขภาพจิตอย่างสม่ำเสมอ";

        }

        else if (totalScore <= 41) {

            level = "ปานกลาง";

            stressLevel.textContent =
                "ระดับความเครียด: ปานกลาง";

            resultDescription.textContent =
                "มีความเครียดอยู่ในระดับปานกลาง ควรหาวิธีผ่อนคลายและจัดการกับความเครียดอย่างเหมาะสม รวมทั้งดูแลการพักผ่อนและสุขภาพของตนเอง";

        }

        else if (totalScore <= 61) {

            level = "สูง";

            stressLevel.textContent =
                "ระดับความเครียด: สูง";

            resultDescription.textContent =
                "มีความเครียดอยู่ในระดับสูง ควรให้ความสำคัญกับการจัดการความเครียด หาสาเหตุของความเครียด และหาเวลาพักผ่อนหรือทำกิจกรรมที่ช่วยผ่อนคลาย";

        }

        else {

            level = "รุนแรง";

            stressLevel.textContent =
                "ระดับความเครียด: รุนแรง";

            resultDescription.textContent =
                "มีความเครียดอยู่ในระดับรุนแรง ควรดูแลตนเองอย่างจริงจังและพิจารณาปรึกษาบุคลากรด้านสุขภาพหรือผู้เชี่ยวชาญด้านสุขภาพจิตเพื่อรับคำแนะนำที่เหมาะสม";

        }


        // เก็บคะแนนไว้ชั่วคราว
        // recommendation.html เดิมยังใช้ข้อมูลนี้
        localStorage.setItem(
            "stressScore",
            totalScore
        );

        // แสดงปุ่มคำแนะนำ
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

});
