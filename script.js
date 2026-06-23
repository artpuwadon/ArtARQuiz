let current = 0;
let score = 0;

function showQuestion() {
    document.getElementById("progress").value = current;
    document.getElementById("number").innerHTML = "ข้อ " + (current + 1) + " / " + questions.length;
    document.getElementById("question").innerHTML = questions[current].question;
    document.getElementById("btnA").innerHTML = "A : " + questions[current].A;
    document.getElementById("btnB").innerHTML = "B : " + questions[current].B;
    document.getElementById("result").innerHTML = "";
}

function checkAnswer(choice) {
    if (choice == questions[current].answer) {
        score += 10;
        document.getElementById("score").innerHTML = "คะแนน : " + score;
        document.getElementById("result").innerHTML = "✅ ตอบถูก";
    } else {
        document.getElementById("result").innerHTML = "❌ ตอบผิด";
    }
    setTimeout(nextQuestion, 1000);
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
    if (score >= 80) {
        text = "🏆 เยี่ยมมาก";
    } else if (score >= 60) {
        text = "😊 ดีมาก";
    } else {
        text = "📚 ลองฝึกอีกนิด";
    }
    document.querySelector(".card").innerHTML = `
        <h1>🎉 จบเกม</h1>
        <h2>คะแนน ${score}</h2>
        <h2>${text}</h2>
        <button onclick="location.reload()">เล่นอีกครั้ง</button>
    `;
}

// กล้องและการจัดการ Canvas
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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

// อัปเดตเฟรมของ Canvas ให้โปร่งใสตามวิดีโอตลอดเวลา
function drawFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ตรงนี้เอาไว้ใส่โค้ดสำหรับวาดเส้น MediaPipe Hands ต่อไป
    }
    requestAnimationFrame(drawFrame);
}

video.addEventListener("loadedmetadata", syncCanvas);
video.addEventListener("play", () => {
    syncCanvas();
    drawFrame();
});

// เริ่มต้นระบบ
startCamera();
showQuestion();
