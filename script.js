let current = 0;
let score = 0;

// ตัวแปรควบคุมเวลาในการเลือกคำตอบ (Hover/Cooldown)
let selectTimer = null;
let isSelecting = false;
let currentSelection = null; 

function showQuestion() {
    document.getElementById("progress").value = current;
    document.getElementById("number").innerHTML = "ข้อ " + (current + 1) + " / " + questions.length;
    document.getElementById("question").innerHTML = questions[current].question;
    document.getElementById("btnA").innerHTML = "A : " + questions[current].A;
    document.getElementById("btnB").innerHTML = "B : " + questions[current].B;
    document.getElementById("result").innerHTML = "";
    
    // รีเซ็ตปุ่มให้เป็นสีปกติ
    document.getElementById("btnA").style.background = "#f9f9f9";
    document.getElementById("btnB").style.background = "#f9f9f9";
    isSelecting = false;
    currentSelection = null;
}

function checkAnswer(choice) {
    if (isSelecting) return; // ป้องกันการกดซ้ำซ้อน
    isSelecting = true;

    if (choice == questions[current].answer) {
        score += 10;
        document.getElementById("score").innerHTML = "คะแนน : " + score;
        document.getElementById("result").innerHTML = "✅ ตอบถูก";
    } else {
        document.getElementById("result").innerHTML = "❌ ตอบผิด";
    }
    setTimeout(nextQuestion, 1500);
}

function nextQuestion() {
    current++;
    if (current < questions.length) {
        showQuestion();
    } else {
        finishGame();
    }
}

function finishGame() {
    let text = "";
    if (score >= 80) text = "🏆 เยี่ยมมาก";
    else if (score >= 60) text = "😊 ดีมาก";
    else text = "📚 ลองฝึกอีกนิด";

    document.querySelector(".card").innerHTML = `
        <h1>🎉 จบเกม</h1>
        <h2>คะแนน ${score}</h2>
        <h2>${text}</h2>
        <button onclick="location.reload()">เล่นอีกครั้ง</button>
    `;
}

// ==========================================
//  ระบบ AR & การตรวจจับมือ (MediaPipe)
// ==========================================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// ตั้งค่าตำแหน่งปุ่มจำลองบน Canvas สำหรับให้ "นิ้วชี้" ชี้ไปโดน
// อิงตามสัดส่วนวิดีโอ (สมมุติตากกล้องคือซ้าย-ขวา)
const zones = {
    A: { x: 80, y: 150, width: 140, height: 180, label: "ชี้ตรงนี้ตอบ A" },
    B: { x: 420, y: 150, width: 140, height: 180, label: "ชี้ตรงนี้ตอบ B" }
};

// ฟังก์ชันเริ่มต้นกล้อง
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
        });
        video.srcObject = stream;
    } catch (err) {
        alert("ไม่สามารถเปิดกล้องได้: " + err.message);
    }
}

function syncCanvas() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
}

video.addEventListener("loadedmetadata", syncCanvas);

// ฟังก์ชันที่จะทำงานทุกครั้งที่ MediaPipe ประมวลผลภาพเสร็จ
function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. วาดกรอบสี่เหลี่ยม AR (ปุ่มสมมุติบนจอ)
    drawARZones();

    // 2. ถ้านิ้วมือโผล่เข้ามาในกล้อง
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            
            // ตำแหน่งพิกัดของ "ปลายนิ้วชี้" (Index Finger Tip คือจุดที่ 8 ใน MediaPipe)
            // ทำการกลับด้านแกน X (Mirror) เพื่อให้ตรงกับเงาสะท้อนของเราในกล้อง
            const indexTip = landmarks[8];
            const fingerX = (1 - indexTip.x) * canvas.width; 
            const fingerY = indexTip.y * canvas.height;

            // วาดเป้าวงกลมสีแดงที่ปลายนิ้วชี้
            ctx.beginPath();
            ctx.arc(fingerX, fingerY, 12, 0, 2 * Math.PI);
            ctx.fillStyle = "#ff4757";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.stroke();

            // ตรวจสอบว่านิ้วชี้อยู่ในโซนปุ่ม A หรือ B ไหม
            checkFingerInZone(fingerX, fingerY);
        }
    } else {
        // ถ้านำมือออกจากกล้อง ให้ยกเลิกการนับเวลาถอยหลังเลือกคำตอบ
        resetSelection();
    }
}

// วาดกล่อง AR สองฝั่งซ้าย-ขวาบนจอภาพ
function drawARZones() {
    for (const key in zones) {
        const zone = zones[key];
        ctx.fillStyle = key === currentSelection ? "rgba(46, 213, 115, 0.4)" : "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        ctx.strokeStyle = key === currentSelection ? "#2ed573" : "#ffa500";
        ctx.lineWidth = 4;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText(zone.label, zone.x + 10, zone.y + 40);
    }
}

// เช็คว่านิ้วจิ้มค้างไว้ที่ปุ่มใดปุ่มหนึ่งหรือไม่ (ค้างไว้ 1.5 วินาทีเท่ากับเลือกข้อนั้น)
function checkFingerInZone(x, y) {
    if (isSelecting) return;

    let detectedZone = null;
    for (const key in zones) {
        const zone = zones[key];
        if (x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height) {
            detectedZone = key;
        }
    }

    if (detectedZone) {
        if (currentSelection !== detectedZone) {
            currentSelection = detectedZone;
            
            // ไฮไลต์ปุ่มจริงที่อยู่ด้านล่างด้วยเพื่อความชัดเจน
            document.getElementById(`btn${detectedZone}`).style.background = "#ffa500"; 

            // ค้างไว้ 1.5 วินาที ค่อยส่งคำตอบ
            clearTimeout(selectTimer);
            selectTimer = setTimeout(() => {
                checkAnswer(currentSelection);
            }, 1500);
        }
    } else {
        resetSelection();
    }
}

function resetSelection() {
    if (isSelecting) return;
    clearTimeout(selectTimer);
    currentSelection = null;
    document.getElementById("btnA").style.background = "#f9f9f9";
    document.getElementById("btnB").style.background = "#f9f9f9";
}

// ตั้งค่าเรียกใช้ไลบรารี MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,                  // ตรวจจับมือแค่ข้างเดียวพอ
    modelComplexity: 1,
    minDetectionConfidence: 0.6,     // ความแม่นยำในการเจอตรวจมือ (60%)
    minTrackingConfidence: 0.6
});

hands.onResults(onResults);

// ส่งเฟรมจากวิดีโอเข้าไปให้ AI ประมวลผลอย่างต่อเนื่อง
const cameraUtils = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480
});

// เริ่มต้นระบบทั้งหมดหลังจากเปิดกล้อง
startCamera().then(() => {
    cameraUtils.start();
    showQuestion();
});
