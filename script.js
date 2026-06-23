let current = 0;
let score = 0;
let timeLeft = 10;
let timerInterval = null;
let isSelecting = false;
let currentSelection = null; 
let selectTimer = null;
let particles = [];
let gameState = "MENU"; // สถานะเกม: MENU หรือ PLAYING

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'tick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(); osc.stop(audioCtx.currentTime + 0.06);
    } else if (type === 'win') {
        [392, 523, 659, 784].forEach((f, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination);
            g.gain.setValueAtTime(0.2, audioCtx.currentTime + i*0.1);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i*0.1 + 0.5);
            o.start(audioCtx.currentTime + i*0.1); o.stop(audioCtx.currentTime + i*0.1 + 0.5);
        });
    }
}

// ฟังก์ชันเลือกหมวดหมู่คำถาม
function selectCategory(key) {
    questions = questionSets[key].data;
    document.getElementById("set-title").innerHTML = questionSets[key].title;
    
    // สลับหน้าจอ
    document.getElementById("menu-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    
    gameState = "PLAYING";
    current = 0;
    score = 0;
    document.getElementById("score").innerHTML = "คะแนน : 0";
    
    playSound('correct');
    showQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 10;
    const timerBar = document.getElementById("timer-bar");
    timerBar.style.width = "100%";
    timerBar.style.background = "linear-gradient(90deg, #00ff88, #00f0ff)";
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerBar.style.width = (timeLeft * 10) + "%";
        if(timeLeft <= 3) {
            timerBar.style.background = "#ff416c";
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
        createExplosion();
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
    if (score >= 40) text = "🏆 ระดับ: ปรมาจารย์ศิลปะ ม.1!";
    else if (score >= 30) text = "😊 ระดับ: ศิลปินฝึกหัดฝีมือดี";
    else text = "📚 ระดับ: ต้องเติมพลังความรู้เพิ่มด่วน!";

    document.getElementById("game-screen").innerHTML = `
        <h1 style="font-size:4rem;">🎉 จบการแข่งขัน 🎉</h1>
        <h2 style="font-size:3rem; color:#00f0ff;">คะแนนรวมของคุณคือ ${score} คะแนน</h2>
        <h2 style="font-size:2.5rem; color:#ffb300;">${text}</h2>
        <br>
        <button onclick="location.reload()" style="max-width:300px; height:70px; background:linear-gradient(135deg, #00ff88, #00f0ff); color:#111; font-size:1.8rem; font-weight:bold; border-radius:15px; border:none; cursor:pointer;">
 🔄 กลับหน้าหลัก
        </button>
    `;
}

// ==========================================
//  ระบบ AR & แอนิเมชันวาดเอฟเฟกต์ลง Canvas
// ==========================================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// โซนจับคำตอบ A และ B ตอนเล่นเกม
const playZones = {
    A: { x: 50, y: 150, width: 150, height: 200, label: "ชี้ค้างตอบ A" },
    B: { x: 440, y: 150, width: 150, height: 200, label: "ชี้ค้างตอบ B" }
};

// โซนจับเมนูสำหรับหน้าแรก (เรียง 3 ปุ่มแนวตั้งเสมือนบนจอ)
const menuZones = {
    elements: { x: 170, y: 80, width: 300, height: 80, label: "ชี้ค้างเลือกชุดที่ 1" },
    colors:   { x: 170, y: 200, width: 300, height: 80, label: "ชี้ค้างเลือกชุดที่ 2" },
    culture:  { x: 170, y: 320, width: 300, height: 80, label: "ชี้ค้างเลือกชุดที่ 3" }
};

// ... (โค้ดส่วนบนคงเดิมไว้จนถึงฟังก์ชัน startCamera) ...

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }, audio: false
        });
        video.srcObject = stream;
        
        // เมื่อกล้องเริ่มสตรีมสำเร็จ ให้เริ่มระบบค้นหามือทันที
        video.addEventListener("playing", () => {
            syncCanvas();
            cameraUtils.start();
        });
    } catch (err) {
        alert("ไม่สามารถเข้าถึงกล้องได้: " + err.message + "\nกรุณากดยอมรับสิทธิ์เปิดกล้องของบราวเซอร์");
    }
}

function syncCanvas() {
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
}
video.addEventListener("loadedmetadata", syncCanvas);

function createExplosion() {
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: canvas.width / 2, y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 6 + 4,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`, alpha: 1
        });
    }
}

function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // เลือกใช้โซนตรวจจับตามสถานะปัจจุบันของเกม
    const activeZones = (gameState === "MENU") ? menuZones : playZones;

    // วาดกล่อง AR ไกด์ไลน์บนจอทีวี
    for (const key in activeZones) {
        const zone = activeZones[key];
        let isHovered = (key === currentSelection);
        
        ctx.fillStyle = isHovered ? "rgba(0, 255, 136, 0.25)" : "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.strokeStyle = isHovered ? "#00ff88" : "#00f0ff";
        ctx.lineWidth = isHovered ? 5 : 2;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";
        ctx.fillText(zone.label, zone.x + 15, zone.y + 45);
    }

    // ตรวจจับมือ
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            const indexTip = landmarks[8];
            const fingerX = (1 - indexTip.x) * canvas.width; 
            const fingerY = indexTip.y * canvas.height;

            ctx.beginPath();
            ctx.arc(fingerX, fingerY, 15, 0, 2 * Math.PI);
            ctx.fillStyle = "#ff007f";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.stroke();

            checkFingerInZone(fingerX, fingerY, activeZones);
        }
    } else {
        resetSelection();
    }

    // วาดเอฟเฟกต์พลุเฉลิมฉลอง
    particles.forEach((p, index) => {
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
        if (p.alpha <= 0) { particles.splice(index, 1); } 
        else {
            ctx.save(); ctx.globalAlpha = p.alpha; ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
            ctx.restore();
        }
    });
}

function checkFingerInZone(x, y, activeZones) {
    if (isSelecting && gameState === "PLAYING") return;
    let detectedZone = null;
    for (const key in activeZones) {
        const zone = activeZones[key];
        if (x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height) {
            detectedZone = key;
        }
    }

    if (detectedZone) {
        if (currentSelection !== detectedZone) {
            currentSelection = detectedZone;
            
            clearTimeout(selectTimer);
            selectTimer = setTimeout(() => {
                if (gameState === "MENU") {
                    selectCategory(currentSelection);
                } else {
                    checkAnswer(currentSelection);
                }
            }, 1200); 
        }
    } else {
        resetSelection();
    }
}

function resetSelection() {
    clearTimeout(selectTimer);
    currentSelection = null;
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6
});
hands.onResults(onResults);

const cameraUtils = new Camera(video, {
    onFrame: async () => { await hands.send({ image: video }); },
    width: 640, height: 480
});

// เรียกเริ่มเปิดกล้องทันทีที่เปิดหน้าเว็บ
startCamera();
