let current = 0;
let score = 0;

// ตัวแปรจับเวลา
let timeLeft = 10; // ให้เวลาข้อละ 10 วินาที
let timerInterval = null;

// ตัวแปรการตรวจจับ AR
let selectTimer = null;
let isSelecting = false;
let currentSelection = null; 

// ตัวแปรสำหรับเอฟเฟกต์พลุ
let particles = [];

// ระบบเสียง Web Audio API (สร้างเสียงโดยไม่ต้องใช้ไฟล์)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'correct') { // เสียงปิ๊งป่อง (ถูก)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'wrong') { // เสียงแอ๊ดดด (ผิด)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'tick') { // เสียงต๊อก (นับถอยหลัง)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(); osc.stop(audioCtx.currentTime + 0.06);
    } else if (type === 'win') { // เสียงทาดาาา! (จบเกม)
        osc.type = 'triangle';
        [392, 523, 659, 784].forEach((f, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'triangle'; o.frequency.value = f;
            o.connect(g); g.connect(audioCtx.destination);
            g.gain.setValueAtTime(0.2, audioCtx.currentTime + i*0.1);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i*0.1 + 0.5);
            o.start(audioCtx.currentTime + i*0.1); o.stop(audioCtx.currentTime + i*0.1 + 0.5);
        });
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 10;
    const timerBar = document.getElementById("timer-bar");
    timerBar.style.background = "linear-gradient(90deg, #00ff88, #00f0ff)";
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerBar.style.width = (timeLeft * 10) + "%";
        
        if(timeLeft <= 3) {
            timerBar.style.background = "#ff416c"; // เปลี่ยนเป็นสีแดงเมื่อเหลือ 3 วิ
            playSound('tick');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeOut();
        }
    }, 1000);
}

function timeOut() {
    if (isSelecting) return;
    isSelecting = true;
    playSound('wrong');
    document.getElementById("result").innerHTML = "⏰ หมดเวลา!";
    document.getElementById("result").style.color = "#ff416c";
    setTimeout(nextQuestion, 2000);
}

function showQuestion() {
    startTimer();
    document.getElementById("number").innerHTML = "ข้อที่ " + (current + 1) + " / " + questions.length;
    document.getElementById("question").innerHTML = questions[current].question;
    document.getElementById("btnA").innerHTML = "A: " + questions[current].A;
    document.getElementById("btnB").innerHTML = "B: " + questions[current].B;
    document.getElementById("result").innerHTML = "";
    
    document.getElementById("btnA").style.transform = "scale(1)";
    document.getElementById("btnB").style.transform = "scale(1)";
    isSelecting = false;
    currentSelection = null;
}

function checkAnswer(choice) {
    if (isSelecting) return;
    isSelecting = true;
    clearInterval(timerInterval);

    if (choice == questions[current].answer) {
        score += 10;
        document.getElementById("score").innerHTML = "คะแนน : " + score;
        document.getElementById("result").innerHTML = "🌟 ถูกต้องนะคร้าบบบ! 🌟";
        document.getElementById("result").style.color = "#00ff88";
        playSound('correct');
        createExplosion(); // จุดพลุฉลอง
    } else {
        document.getElementById("result").innerHTML = "💥 ผิดพลาดน่าเสียดาย! 💥";
        document.getElementById("result").style.color = "#ff416c";
        playSound('wrong');
    }
    setTimeout(nextQuestion, 2000);
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
    clearInterval(timerInterval);
    playSound('win');
    let text = "";
    if (score >= 80) text = "🏆 ระดับ: ปรมาจารย์ศิลปะ ม.1!";
    else if (score >= 60) text = "😊 ระดับ: ศิลปินฝึกหัดฝีมือดี";
    else text = "📚 ระดับ: ต้องเติมพลังความรู้เพิ่มด่วน!";

    document.querySelector(".card").innerHTML = `
        <h1 style="font-size:4rem;">🎉 จบการแข่งขัน 🎉</h1>
        <h2 style="font-size:3rem; color:#00f0ff;">คะแนนรวมของคุณคือ ${score} คะแนน</h2>
        <h2 style="font-size:2.5rem; color:#ffb300;">${text}</h2>
        <br>
        <button onclick="location.reload()" style="max-width:300px; height:70px; background:linear-gradient(135deg, #00ff88, #00f0ff); color:#111;">
 🔄 เริ่มท้าทายใหม่
        </button>
    `;
}

// ==========================================
//  ระบบ AR & แอนิเมชันวาดเอฟเฟกต์ลง Canvas
// ==========================================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const zones = {
    A: { x: 50, y: 150, width: 150, height: 200, label: "ชี้ค้างตอบ A" },
    B: { x: 440, y: 150, width: 150, height: 200, label: "ชี้ค้างตอบ B" }
};

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }, audio: false
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

// เอฟเฟกต์จุดระเบิดเมื่อตอบถูก
function createExplosion() {
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 6 + 4,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            alpha: 1
        });
    }
}

function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // วาดกล่อง AR สองฝั่ง
    for (const key in zones) {
        const zone = zones[key];
        let isHovered = (key === currentSelection);
        
        ctx.fillStyle = isHovered ? "rgba(0, 255, 136, 0.3)" : "rgba(255, 255, 255, 0.15)";
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.strokeStyle = isHovered ? "#00ff88" : "#00f0ff";
        ctx.lineWidth = isHovered ? 6 : 3;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

        ctx.fillStyle = "white";
        ctx.font = "bold 22px Arial";
        ctx.fillText(zone.label, zone.x + 15, zone.y + 40);
    }

    // ตรวจจับมือ
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            const indexTip = landmarks[8];
            // ทำงานบนภาพ Mirror กลับด้านเพื่อให้เด็กไม่งงเวลาส่องทีวี
            const fingerX = (1 - indexTip.x) * canvas.width; 
            const fingerY = indexTip.y * canvas.height;

            // วาดเอฟเฟกต์เป้าเล็งวงกลมวิบวับที่ปลายนิ้ว
            ctx.beginPath();
            ctx.arc(fingerX, fingerY, 15, 0, 2 * Math.PI);
            ctx.fillStyle = "#ff007f";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 4;
            ctx.stroke();

            checkFingerInZone(fingerX, fingerY);
        }
    } else {
        resetSelection();
    }

    // อัปเดตและวาดพาร์ทิเคิลพลุระเบิด
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        }
    });
}

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
            document.getElementById(`btn${detectedZone}`).style.transform = "scale(1.1)";
            
            clearTimeout(selectTimer);
            selectTimer = setTimeout(() => {
                checkAnswer(currentSelection);
            }, 1200); // ลดเวลาชี้ค้างเหลือ 1.2 วินาทีเพื่อให้เกมไวขึ้น เร้าใจขึ้น
        }
    } else {
        resetSelection();
    }
}

function resetSelection() {
    if (isSelecting) return;
    clearTimeout(selectTimer);
    currentSelection = null;
    document.getElementById("btnA").style.transform = "scale(1)";
    document.getElementById("btnB").style.transform = "scale(1)";
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});
hands.onResults(onResults);

const cameraUtils = new Camera(video, {
    onFrame: async () => { await hands.send({ image: video }); },
    width: 640, height: 480
});

startCamera().then(() => {
    cameraUtils.start();
    showQuestion();
});
