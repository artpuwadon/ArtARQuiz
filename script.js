let current = 0;
let score = 0;
let timeLeft = 10;
let timerInterval = null;
let isSelecting = false;
let currentSelection = null; 
let selectTimer = null;
let particles = [];
let gameState = "MENU"; // "MENU" หรือ "PLAYING"

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);

        if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'tick') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(750, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.start(); osc.stop(audioCtx.currentTime + 0.06);
        } else if (type === 'win') {
            [392, 523, 659, 784].forEach((f, i) => {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination);
                g.gain.setValueAtTime(0.15, audioCtx.currentTime + i*0.1);
                g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i*0.1 + 0.5);
                o.start(audioCtx.currentTime + i*0.1); o.stop(audioCtx.currentTime + i*0.1 + 0.5);
            });
        }
    } catch(e) { console.log("Audio Error"); }
}

// ฟังก์ชันเลือกหมวดหมู่ (เมาส์กด หรือ คีย์บอร์ดกด)
function selectCategory(key) {
    if (gameState !== "MENU") return;
    
    questions = questionSets[key].data;
    document.getElementById("set-title").innerHTML = questionSets[key].title;
    
    // เปลี่ยนหน้าแสดงผล
    document.getElementById("menu-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    
    gameState = "PLAYING";
    current = 0;
    score = 0;
    
    playSound('correct');
    
    // เริ่มเปิดกล้องและเครื่องมือตรวจจับมือเมื่อเข้าสู่หน้าเล่นเกม
    startCamera().then(() => {
        showQuestion();
    });
}

// ตรวจจับปุ่มบนคีย์บอร์ดเลข 1-0 เพื่อความสะดวกเวลาครูคุมผ่านโน้ตบุ๊ก
window.addEventListener("keydown", (e) => {
    if (gameState === "MENU") {
        if (e.key === "1") selectCategory("elements");
        if (e.key === "2") selectCategory("colors");
        if (e.key === "3") selectCategory("culture");
        if (e.key === "4") selectCategory("lines_shapes");
        if (e.key === "5") selectCategory("thai_art");
        if (e.key === "6") selectCategory("light_shadow");
        if (e.key === "7") selectCategory("composition");
        if (e.key === "8") selectCategory("modern_art");
        if (e.key === "9") selectCategory("design_app");
        if (e.key === "0") selectCategory("criticism"); // ชุดที่ 10 กดเลข 0
    }
});

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
        <h1 style="font-size:3.5rem;">🎉 จบการแข่งขัน 🎉</h1>
        <h2 style="font-size:2.8rem; color:#00f0ff; margin: 20px 0;">คะแนนรวมของคุณคือ ${score} คะแนน</h2>
        <h2 style="font-size:2.2rem; color:#ffb300;">${text}</h2>
        <br><br>
        <button onclick="location.reload()" style="width:250px; height:70px; background:linear-gradient(135deg, #00ff88, #00f0ff); color:#111; font-size:1.6rem; font-weight:bold; border-radius:15px; border:none; cursor:pointer;">
 🔄 กลับหน้าหลัก
        </button>
    `;
}

// ==========================================
//  ระบบ AR (MediaPipe) ทำงานเฉพาะหน้าเล่นเกม
// ==========================================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// กล่องรับคำตอบ AR ซ้าย-ขวาบนภาพวิดีโอ
const playZones = {
    A: { x: 30, y: 130, width: 140, height: 220, label: "ชี้ค้างตอบ A" },
    B: { x: 470, y: 130, width: 140, height: 220, label: "ชี้ค้างตอบ B" }
};

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }, audio: false
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                cameraUtils.start();
                resolve();
            };
        });
    } catch (err) {
        alert("กรุณาอนุญาตสิทธิ์เข้าถึงกล้องถ่ายภาพบนบราวเซอร์ก่อนเล่นเกมครับ!");
    }
}

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
    if (gameState !== "PLAYING") return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // วาดกล่องโต้ตอบ AR ลอยบนวิดีโอ
    for (const key in playZones) {
        const zone = playZones[key];
        let isHovered = (key === currentSelection);
        
        ctx.fillStyle = isHovered ? "rgba(0, 255, 136, 0.3)" : "rgba(255, 255, 255, 0.15)";
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.strokeStyle = isHovered ? "#00ff88" : "#00f0ff";
        ctx.lineWidth = isHovered ? 6 : 2;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";
        ctx.fillText(zone.label, zone.x + 12, zone.y + 45);
    }

    // ตรวจจับนิ้วชี้
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

            checkFingerInZone(fingerX, fingerY);
        }
    } else {
        resetSelection();
    }

    // อนิเมชันพาร์ทิเคิลพลุระเบิด
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

function checkFingerInZone(x, y) {
    if (isSelecting) return;
    let detectedZone = null;
    for (const key in playZones) {
        const zone = playZones[key];
        if (x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height) {
            detectedZone = key;
        }
    }

    if (detectedZone) {
        if (currentSelection !== detectedZone) {
            currentSelection = detectedZone;
            clearTimeout(selectTimer);
            selectTimer = setTimeout(() => {
                checkAnswer(currentSelection);
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
    onFrame: async () => { 
        if(gameState === "PLAYING") await hands.send({ image: video }); 
    },
    width: 640, height: 480
});
