const colors = [
  "#6f1d1b",
  "#bb9457",
  "#432818",
  "#99582a",
  "#ffe6a7"
];

const balloonCount = 10;
const balloons = [];
const particles = [];
const shockwaves = [];

let audioContext = null;
let soundEnabled = true;
let soundButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  soundButton = createButton("音效：開");
  soundButton.position(20, 20);
  soundButton.style("font-size", "16px");
  soundButton.style("padding", "10px 16px");
  soundButton.style("border", "none");
  soundButton.style("border-radius", "8px");
  soundButton.style("background", "#6f1d1b");
  soundButton.style("color", "#ffffff");
  soundButton.style("cursor", "pointer");
  soundButton.mousePressed(toggleSound);

  for (let i = 0; i < balloonCount; i++) {
    balloons.push(new Balloon(true));
  }
}

function draw() {
  background("#f4f7fb");

  for (const balloon of balloons) {
    balloon.update();
    balloon.display();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();

    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }

  for (let i = shockwaves.length - 1; i >= 0; i--) {
    shockwaves[i].update();
    shockwaves[i].display();

    if (shockwaves[i].isFinished()) {
      shockwaves.splice(i, 1);
    }
  }
}

class Balloon {
  constructor(initial = false) {
    this.reset(initial);
  }

  reset(initial = false) {
    this.size = random(150, 250);
    this.x = random(this.size / 2, width - this.size / 2);
    this.y = initial
      ? random(height * 0.2, height)
      : height + this.size;

    this.speed = random(3, 8);
    this.balloonColor = color(random(colors));
    this.balloonColor.setAlpha(random(40, 70) * 2.55);

    // 1～4 秒後爆破
    this.explodeAfter = random(60, 240);
    this.appearFrame = frameCount;
    this.exploded = false;
  }

  update() {
    if (this.exploded) return;

    this.y -= this.speed;

    if (frameCount - this.appearFrame >= this.explodeAfter) {
      this.explode();
    }

    if (this.y < -this.size) {
      this.explode();
    }
  }

  display() {
    if (this.exploded) return;

    noStroke();
    fill(this.balloonColor);
    ellipse(this.x, this.y, this.size, this.size);

    // 氣球右上方的星星
    fill("#ffffff");
    stroke("#432818");
    strokeWeight(2);
    textSize(56);

    text(
      "★",
      this.x + this.size * 0.32,
      this.y - this.size * 0.16
    );
  }

  explode() {
    if (this.exploded) return;

    this.exploded = true;

    if (soundEnabled) {
      playPopSound();
    }

    const particleCount = floor(random(18, 30));

    for (let i = 0; i < particleCount; i++) {
      particles.push(
        new Particle(this.x, this.y, this.balloonColor)
      );
    }

    shockwaves.push(
      new Shockwave(this.x, this.y)
    );

    setTimeout(() => {
      this.reset();
    }, 180);
  }
}

class Particle {
  constructor(x, y, particleColor) {
    this.x = x;
    this.y = y;

    const angle = random(TWO_PI);
    const force = random(3, 10);

    this.velocityX = cos(angle) * force;
    this.velocityY = sin(angle) * force - random(1, 4);

    this.size = random(4, 12);
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.15, 0.15);
    this.gravity = 0.18;
    this.life = 255;
    this.particleColor = color(particleColor);
  }

  update() {
    this.velocityY += this.gravity;
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.rotation += this.rotationSpeed;
    this.life -= 5;
  }

  display() {
    push();

    translate(this.x, this.y);
    rotate(this.rotation);

    this.particleColor.setAlpha(max(this.life, 0));
    fill(this.particleColor);
    noStroke();

    beginShape();
    vertex(-this.size, -this.size * 0.4);
    vertex(this.size * 0.6, -this.size);
    vertex(this.size, this.size * 0.5);
    vertex(-this.size * 0.5, this.size);
    endShape(CLOSE);

    pop();
  }

  isFinished() {
    return this.life <= 0;
  }
}

class Shockwave {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.life = 220;
  }

  update() {
    this.radius += 8;
    this.life -= 7;
  }

  display() {
    noFill();
    stroke(111, 29, 27, max(this.life, 0));
    strokeWeight(5);

    ellipse(
      this.x,
      this.y,
      this.radius * 2,
      this.radius * 2
    );
  }

  isFinished() {
    return this.life <= 0;
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;

  soundButton.html(
    soundEnabled ? "音效：開" : "音效：關"
  );

  soundButton.style(
    "background",
    soundEnabled ? "#6f1d1b" : "#777777"
  );

  if (soundEnabled) {
    enableAudio();
  }
}

function playPopSound() {
  enableAudio();

  const now = audioContext.currentTime;

  // 清脆主要爆破聲
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(780, now);
  oscillator.frequency.exponentialRampToValueAtTime(
    1450,
    now + 0.035
  );

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(
    0.32,
    now + 0.006
  );
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.14
  );

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.15);

  // 高頻亮音
  const sparkle = audioContext.createOscillator();
  const sparkleGain = audioContext.createGain();

  sparkle.type = "sine";
  sparkle.frequency.setValueAtTime(1900, now);
  sparkle.frequency.exponentialRampToValueAtTime(
    900,
    now + 0.08
  );

  sparkleGain.gain.setValueAtTime(0.0001, now);
  sparkleGain.gain.exponentialRampToValueAtTime(
    0.12,
    now + 0.004
  );
  sparkleGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.09
  );

  sparkle.connect(sparkleGain);
  sparkleGain.connect(audioContext.destination);

  sparkle.start(now);
  sparkle.stop(now + 0.1);
}

function enableAudio() {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function mousePressed() {
  enableAudio();
}

function touchStarted() {
  enableAudio();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}