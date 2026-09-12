// -----------------------------
// คำถาม SPST-20
// -----------------------------

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

// -----------------------------
// เชื่อมต่อกับหน้า HTML
// -----------------------------

const startButton = document.getElementById("startButton");
const startPage = document.querySelector(".container");
const questionContainer = document.getElementById("questionContainer");
const nextButton = document.getElementById("nextButton");
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");

// -----------------------------
// เริ่มทำแบบประเมิน
// -----------------------------

startButton.addEventListener("click", function() {
    startPage.style.display = "none";
    questionContainer.style.display = "block";

    // แสดงคำถามข้อที่ 1
    questionText.textContent = questions[0].text;
    progressFill.style.width = "5%";
    progressPercent.textContent = "5%";
});

// -----------------------------
// ระบบคะแนน
// -----------------------------

let currentQuestion = 1;
let totalScore = 0;

// -----------------------------
// ระบบเปลี่ยนข้อคำถาม
// -----------------------------

nextButton.addEventListener("click", function() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');

    // ตรวจว่าผู้ใช้เลือกคำตอบหรือยัง
    if (!selectedAnswer) {
        alert("กรุณาเลือกคำตอบก่อนค่ะ");
        return;
    }

    // เก็บคะแนนของข้อนี้
    const score = Number(selectedAnswer.value);
    totalScore = totalScore + score;

    console.log("ข้อที่:", currentQuestion);
    console.log("คะแนนข้อนี้:", score);
    console.log("คะแนนรวม:", totalScore);

    // ถ้ายังไม่ถึงข้อ 20
    if (currentQuestion < 20) {
        currentQuestion++;

        questionNumber.textContent = "ข้อที่ " + currentQuestion + " / 20";
        questionText.textContent = questions[currentQuestion - 1].text;

        // อัปเดต Progress Bar
        const progress = (currentQuestion / 20) * 100;
        progressFill.style.width = progress + "%";
        progressPercent.textContent = progress + "%";
        
        // ล้างคำตอบข้อก่อน
        selectedAnswer.checked = false;
    }
    // ถ้าเป็นข้อที่ 20
    else {
        // ซ่อนหน้าคำถาม
        questionContainer.style.display = "none";
function updateProgress(currentQuestion, totalQuestions) {
    // คำนวณหาเปอร์เซ็นต์
    const percentage = Math.round((currentQuestion / totalQuestions) * 100);
    
    // อัปเดตความกว้างหลอด
    const progressBar = document.getElementById("progressBar");
    progressBar.style.width = percentage + "%";
    
    // อัปเดตตำแหน่งตัวการ์ตูนพยาบาลให้วิ่งตามเปอร์เซ็นต์
    const runnerAvatar = document.getElementById("runnerAvatar");
    runnerAvatar.style.left = percentage + "%";
    
    // อัปเดตข้อความเปอร์เซ็นต์
    const progressText = document.getElementById("progressText");
    progressText.innerHTML = `ตอบไปแล้ว ${percentage}% (${currentQuestion}/${totalQuestions})`;
}
        // แสดงหน้าผลการประเมิน
        const resultContainer = document.getElementById("resultContainer");
        resultContainer.style.display = "block";

        // แสดงคะแนนรวม
        const scoreDisplay = document.getElementById("score"); // เปลี่ยนชื่อตัวแปรกันซ้ำซ้อนกับ score ด้านบน
        scoreDisplay.textContent = totalScore + " คะแนน";

        // -----------------------------
        // แปลผลระดับความเครียด
        // -----------------------------
        const stressLevel = document.getElementById("stressLevel");
        const resultDescription = document.getElementById("resultDescription");

        // 1. บันทึกคะแนนลงในระบบ เพื่อให้หน้าคำแนะนำ (advice.html) ดึงไปใช้ต่อได้
        localStorage.setItem("stressScore", totalScore);

        // 2. แสดงปุ่มคำแนะนำเสมอ (ลบเงื่อนไข hidden ทิ้ง)
        document.getElementById("adviceButton").hidden = false; 

        if (totalScore <= 23) {
            stressLevel.textContent = "ระดับความเครียด: น้อย";
            resultDescription.textContent = "มีความเครียดอยู่ในระดับน้อย สามารถดำเนินชีวิตประจำวันได้ตามปกติ และควรดูแลสุขภาพกายและสุขภาพจิตอย่างสม่ำเสมอ";
        }
        else if (totalScore <= 41) {
            stressLevel.textContent = "ระดับความเครียด: ปานกลาง";
            resultDescription.textContent = "มีความเครียดอยู่ในระดับปานกลาง ควรหาวิธีผ่อนคลายและจัดการกับความเครียดอย่างเหมาะสม รวมทั้งดูแลการพักผ่อนและสุขภาพของตนเอง";
        }
        else if (totalScore <= 61) {
            stressLevel.textContent = "ระดับความเครียด: สูง";
            resultDescription.textContent = "มีความเครียดอยู่ในระดับสูง ควรให้ความสำคัญกับการจัดการความเครียด หาสาเหตุของความเครียด และหาเวลาพักผ่อนหรือทำกิจกรรมที่ช่วยผ่อนคลาย";
        }
        else {
            stressLevel.textContent = "ระดับความเครียด: รุนแรง";
            resultDescription.textContent = "มีความเครียดอยู่ในระดับรุนแรง ควรดูแลตนเองอย่างจริงจังและพิจารณาปรึกษาบุคลากรด้านสุขภาพหรือผู้เชี่ยวชาญด้านสุขภาพจิตเพื่อรับคำแนะนำที่เหมาะสม";
        }
    }
}); // <--- ตรงนี้คือจุดที่แก้ไข เติม }); ปิดฟังก์ชันให้กับ nextButton.addEventListener