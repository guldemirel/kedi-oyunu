// === Canvas ve Context ===
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// === Arka plan ===
const backgroundImage = new Image();
backgroundImage.src = "assets/background.png";

// === Zaman ve Game Over ===
let gameOver = false;
let startTime = null;
let elapsedTime = 0;

let gameStarted = false;
let worldOffsetX = 0;


// === Kedi ===
let kediX = 100, kediy = 500;
const groundY = 500;
let hızY = 0;
const gravity = 0.8, jumpPower = -15;
let isJumping = false, frameIndex = 0;
let yon = "right", solaBasıldıMı = false, sagaBasıldıMı = false;

// === Sesler ===
const glassSound = document.getElementById("glassSound");
const scratchSound = document.getElementById("scratchSound");
const ripSound = document.getElementById("ripSound");
const barkSound = document.getElementById("barkSound");
const thudSound = document.getElementById("thudSound");
const bgm = document.getElementById("bgm");



// === Kedi Sprite'ları ===
const jumpFrames = [], idleImage = new Image();
idleImage.src = "assets/IdleCatt.png";
for (let i = 1; i <= 13; i++) {
    const img = new Image();
    img.src = `assets/JumpCattt${i}.png`;
    jumpFrames.push(img);
}

// === Köpek ===
const dogFrames = [];
let dogFramesLoaded = 0, totalDogFrames = 9;
let kopekX = canvas.width + 100, kopekY = groundY;
let kopekHareketEdiyor = false, kopekFrameIndex = 0, dogAnimationSpeed = 0;
for (let i = 1; i <= totalDogFrames; i++) {
    const img = new Image();
    img.onload = () => dogFramesLoaded++;
    img.src = `assets/köpek${i}.png`;
    dogFrames.push(img);
}

// === Yaramazlık ===
let muzDüşüyorMu = false, muzhızY = 0;
let vazoDüşüyorMu = false, vazohızY = 0;

// === Objeler ===
const mapObjects = [
    { name: "sofa", src: "assets/koltuk.png", x: 90, y: 440, w: 144, h: 72, type: "static" },
    { name: "window", src: "assets/pencere.png", x: 600, y: 400, w: 120, h: 80, type: "interactive", scratched: false },
    { name: "table", src: "assets/masa.png", x: 230, y: 457, w: 144, h: 72, type: "static" },
    { name: "muz", src: "assets/muz.png", x: 246, y: 425, w: 32, h: 32, type: "item", falling: false },
    { name: "vazo", src: "assets/vazo.png", x: 300, y: 425, w: 32, h: 32, type: "item", falling: false },
    // { name: "oyuncak", src: "assets/kedioyuncağı.png", x: 420, y: 445, w: 64, h: 72, type: "static" },
    { name: "yatak", src: "assets/yatak.png", x: 1000, y: 400, w: 200, h: 100, type: "interactive", scratched: false },
    { name: "sepet", src: "assets/sepet.png", x: 910, y: 450, w: 70, h: 70, type: "static" },
    { name: "pcdesk", src: "assets/bilgisayarmasası.png", x: 725, y: 420, w: 180, h: 105, type: "interactive", scratched: false },
    { name: "lamba", src: "assets/lamba.png", x: 400, y: 350, w: 48, h: 48, type: "interactive", scratched: false },

];
const loadedImages = {};
mapObjects.forEach(obj => {
    const img = new Image();
    img.src = obj.src;
    loadedImages[obj.src] = img;
});

// === Klavye Kontrol ===
document.addEventListener("keydown", (e) => {
    if (!gameStarted && e.key.toLowerCase() === "enter") {
        bgm.volume = 0.3; // ses seviyesi (0.0 - 1.0)
        bgm.play();
    }
    const key = e.key.toLowerCase();
    if (key === "a") solaBasıldıMı = true, yon = "left";
    else if (key === "d") sagaBasıldıMı = true, yon = "right";
    else if ((key === "w" || e.code === "Space") && !isJumping && !gameOver) {
        isJumping = true;
        hızY = jumpPower;
        frameIndex = 0;
    } // F tuşu basıldığında yatak etkileşimi için geliştirilmiş kod
    else if (key === "f" && !gameOver) {
        let hareketeGec = false;
        const etkilesimli = ["window", "yatak", "pcdesk", "lamba"];

        etkilesimli.forEach(name => {
            const obj = mapObjects.find(o => o.name === name);
            if (obj && !obj.scratched) {

                const objEkranX = obj.x + worldOffsetX;
                const yakın = kediX < objEkranX + obj.w + 20 &&
                    kediX + 32 > objEkranX - 20 &&
                    kediy < obj.y + obj.h + 30 &&
                    kediy + 32 > obj.y - 10;


                if (yakın) {
                    console.log(`${name} ile etkileşim!`); // Debug için
                    obj.scratched = true;
                    const eski = obj.src;

                    if (name === "window") {
                        obj.src = "assets/yırtıkperde.png";
                        scratchSound.currentTime = 0;
                        scratchSound.play();
                    }
                    else if (name === "yatak") {
                        obj.src = "assets/yırtıkyatak.png";
                        ripSound.currentTime = 0;
                        ripSound.play();
                    }


                    else if (name === "pcdesk") {
                        obj.src = "assets/kırıkbilgisayarmasası.png";
                        obj.type = "static";
                        glassSound.currentTime = 0;
                        glassSound.play();

                    }
                    else if (name === "lamba") obj.src = "assets/kırıklamba.png";


                    const yeniImg = new Image();
                    yeniImg.src = obj.src;
                    loadedImages[obj.src] = yeniImg;

                    yeniImg.src = obj.src;

                    hareketeGec = true;
                }
            }
        });
        mapObjects.forEach(obj => {
            if (obj.name === "muz" || obj.name === "vazo") {
                const ekranX = obj.x + worldOffsetX;
                const yakın = !obj.falling &&
                    kediX < ekranX + obj.w &&
                    kediX + 32 > ekranX &&
                    kediy < obj.y + obj.h + 20 &&
                    kediy + 32 > obj.y;

                if (yakın) {
                    obj.falling = true;
                    if (obj.name === "muz") muzhızY = 0;
                    else if (obj.name === "vazo") vazohızY = 0;
                    hareketeGec = true;
                }
            }
        });


        for (const obj of mapObjects) {
            if (obj.name === "muz" && obj.falling) {
                muzhızY += gravity;
                obj.y += muzhızY;
                if (obj.y + obj.h >= groundY) {
                    obj.y = groundY - obj.h;
                    obj.falling = false;
                }
            }

            if (obj.name === "vazo" && obj.falling) {
                vazohızY += gravity;
                obj.y += vazohızY;
                if (obj.y + obj.h >= groundY) {
                    obj.y = groundY - obj.h;
                    obj.falling = false;
                }
            }
        }



        if (hareketeGec && !kopekHareketEdiyor) {
            kopekX = canvas.width + 20;
            kopekHareketEdiyor = true;
            kopekFrameIndex = 0;
            dogAnimationSpeed = 0;
            barkSound.currentTime = 0;
            barkSound.play();
        }

    }
    else if (key === "enter" && !gameStarted) {
        gameStarted = true;
        startTime = Date.now();
        requestAnimationFrame(draw);
    }

});

document.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === "a") solaBasıldıMı = false;
    if (e.key.toLowerCase() === "d") sagaBasıldıMı = false;
});

function drawBackground() {
    const bgWidth = canvas.width;
    const repeatCount = 5; // arka plan 2 kez tekrar etsin

    for (let i = 0; i < repeatCount; i++) {
        const offsetX = (i * bgWidth + (worldOffsetX % bgWidth));
        ctx.drawImage(backgroundImage, offsetX, 0, bgWidth, canvas.height);
    }
}

function drawMap() {
    const roomWidth = 1200; // odadaki objelerin kapsadığı genişlik
    const repeatCount = 5;  // ekranda kaç tekrar gözüksün

    for (let i = -1; i < repeatCount; i++) {
        const offsetX = worldOffsetX + i * roomWidth;
        for (const obj of mapObjects) {
            // Eğer objenin güncel sprite'ı loadedImages içinde yoksa ve yüklenmediyse:
            if (!loadedImages[obj.src]) {
                const yeniImg = new Image();
                yeniImg.onload = () => {
                    loadedImages[obj.src] = yeniImg;
                };
                yeniImg.src = obj.src;
                loadedImages[obj.src] = yeniImg; // hemen referansı ver
            }

            const img = loadedImages[obj.src];
            if (img?.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, obj.x + offsetX, obj.y, obj.w, obj.h);
            } else {
                // Yüklenmemişse geçici kutu çiz (geliştirme aşaması için)
                ctx.fillStyle = "red";
                ctx.fillRect(obj.x + offsetX, obj.y, obj.w, obj.h);
            }
        }
    }
}




function drawCat() {
    const sprite = isJumping ? jumpFrames[frameIndex] : idleImage;
    const sw = 48, sh = 48;
    const screenX = kediX; // Ekrandaki sabit pozisyon
    ctx.save();
    if (yon === "left") {
        ctx.translate(screenX + sw, kediy - sh);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, 0, sw, sh);
    } else {
        ctx.translate(screenX, kediy - sh);
        ctx.drawImage(sprite, 0, 0, sw, sh);
    }
    ctx.restore();
    if (isJumping && frameIndex < jumpFrames.length - 1) frameIndex++;
}


function drawDog() {
    if (!kopekHareketEdiyor) return;
    const dw = 64, dh = 64;
    const sprite = dogFrames[kopekFrameIndex];
    const kopekEkranX = kopekX + worldOffsetX;

    if (sprite?.complete) ctx.drawImage(sprite, kopekX + worldOffsetX, kopekY - dh, dw, dh);
    else ctx.fillRect(kopekX, kopekY - dh, dw, dh);


    kopekX -= 2;

    if (dogFramesLoaded === totalDogFrames) {
        dogAnimationSpeed++;
        if (dogAnimationSpeed >= 5) {
            kopekFrameIndex = (kopekFrameIndex + 1) % dogFrames.length;
            dogAnimationSpeed = 0;
        }
    }
    if (kopekEkranX < kediX + 32 && kopekEkranX + dw > kediX && kopekY < kediy + 48 && kopekY + dh > kediy) {
        kopekHareketEdiyor = false;
        kopekX = canvas.width + 100;
        gameOver = true;
        elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    }
    if (kopekX < -100) {
        kopekHareketEdiyor = false;
        kopekX = canvas.width + 100;
    }
}

function updatePhysics() {
    if (gameOver) return;
    const scrollSpeed = 4;

    if (sagaBasıldıMı) {
        if (kediX < canvas.width / 2) {
            kediX += scrollSpeed;
        } else {
            worldOffsetX -= scrollSpeed;
        }
    }

    if (solaBasıldıMı) {
        if (kediX > canvas.width / 2 || worldOffsetX >= 0) {
            kediX -= scrollSpeed;
        } else {
            worldOffsetX += scrollSpeed;
            if (worldOffsetX > 0) worldOffsetX = 0; // Pozitif olmamalı
        }
    }


    const muzlar = mapObjects.filter(o => o.name === "muz");
    for (const muz of muzlar) {
        const ekranX = muz.x + worldOffsetX;
        const yakın = !muzDüşüyorMu &&
            kediX < ekranX + muz.w &&
            kediX + 32 > ekranX &&
            kediy < muz.y + muz.h + 20 &&
            kediy + 32 > muz.y;

        if (yakın) {
            muzDüşüyorMu = true;
            muzhızY = 0;
            hareketeGec = true;
            break;
        }
    }

    const vazolar = mapObjects.filter(o => o.name === "vazo");
    for (const vazo of vazolar) {
        const ekranX = vazo.x + worldOffsetX;
        const yakın = !vazoDüşüyorMu &&
            kediX < ekranX + vazo.w &&
            kediX + 32 > ekranX &&
            kediy < vazo.y + vazo.h + 20 &&
            kediy + 32 > vazo.y;

        if (yakın) {
            vazoDüşüyorMu = true;
            vazohızY = 0;
            hareketeGec = true;
            break; // sadece bir tanesine etki et
        }
    }


    hızY += gravity;
    kediy += hızY;

    let onPlatform = false;
    for (const obj of mapObjects) {
        if (obj.type === "static" || (obj.name === "lamba" && obj.scratched === false)) {

            const withinX = kediX + 16 > obj.x && kediX + 16 < obj.x + obj.w;
            const fallingOnto = kediy + hızY >= obj.y && kediy <= obj.y + 10;
            if (withinX && fallingOnto) {
                kediy = obj.y;
                hızY = 0;
                isJumping = false;
                frameIndex = 0;
                onPlatform = true;
                break;
            }
        }
    }

    if (!onPlatform && kediy >= groundY) {
        kediy = groundY;
        hızY = 0;
        isJumping = false;
        frameIndex = 0;
    }

    if (!onPlatform && kediy < groundY) {
        isJumping = true;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawMap();
    updatePhysics();
    drawCat();
    drawDog();
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "48px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2 - 20);
        ctx.font = "32px Arial";
        ctx.fillText(`Hayatta Kalma Süresi: ${elapsedTime} saniye`, canvas.width / 2 - 200, canvas.height / 2 + 30);
        ctx.font = "20px Arial";
        ctx.fillText("Yeniden başlamak için R tuşuna bas", canvas.width / 2 - 160, canvas.height / 2 + 70);
        return;
    }
    requestAnimationFrame(draw);
}

function startGame() {
    const assetsLoaded = backgroundImage.complete && idleImage.complete && jumpFrames.every(img => img.complete);
    if (assetsLoaded) {
        drawStartScreen(); // Artık doğrudan oyunu değil, başlangıç ekranını gösteriyoruz
    } else {
        setTimeout(startGame, 100);
    }
}

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawMap();
    drawCat();

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.fillText("Kedi Oyunu", canvas.width / 2 - 130, canvas.height / 2 - 40);
    ctx.font = "24px Arial";
    ctx.fillText("Başlamak için Enter tuşuna bas", canvas.width / 2 - 180, canvas.height / 2 + 10);

    requestAnimationFrame(drawStartScreen);
}

startGame();
