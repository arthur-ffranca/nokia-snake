const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const CELL = 10;
const COLS = 30;
const ROWS = 22;
const TOP = 40;
const STEP_MS = 125;

const colors = {
  lcd: "#9eb26a",
  dark: "#233012",
  mid: "#4d5f25",
  pale: "#c2ce8a",
};

const state = {
  mode: "title",
  snake: [],
  direction: { x: 1, y: 0 },
  pendingDirection: { x: 1, y: 0 },
  food: { x: 18, y: 10 },
  score: 0,
  best: Number(localStorage.getItem("nokiaSnakeBest") || "0"),
  elapsed: 0,
  tickRemainder: 0,
  startedAt: 0,
  soundEnabled: true,
};

let lastFrame = performance.now();
let rafId = 0;
let audioContext = null;

function ensureAudio() {
  if (!state.soundEnabled) return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function beep(frequency, duration = 0.04, volume = 0.045, type = "square") {
  const audio = ensureAudio();
  if (!audio) return;

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const now = audio.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.012);
}

function playMoveSound() {
  beep(520, 0.025, 0.02);
}

function playEatSound() {
  beep(780, 0.055, 0.05);
  setTimeout(() => beep(980, 0.045, 0.045), 45);
}

function playGameOverSound() {
  beep(260, 0.09, 0.055);
  setTimeout(() => beep(190, 0.12, 0.05), 90);
}

function resetGame(mode = "playing") {
  state.mode = mode;
  state.snake = [
    { x: 8, y: 11 },
    { x: 7, y: 11 },
    { x: 6, y: 11 },
    { x: 5, y: 11 },
  ];
  state.direction = { x: 1, y: 0 };
  state.pendingDirection = { x: 1, y: 0 };
  state.score = 0;
  state.elapsed = 0;
  state.tickRemainder = 0;
  state.startedAt = performance.now();
  placeFood();
  render();
}

function placeFood() {
  for (let tries = 0; tries < 500; tries += 1) {
    const food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    if (!state.snake.some((part) => part.x === food.x && part.y === food.y)) {
      state.food = food;
      return;
    }
  }
}

function setDirection(dir) {
  const next = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  }[dir];

  if (!next) return;
  if (state.mode === "title") state.mode = "playing";
  if (state.mode !== "playing") return;

  const current = state.direction;
  const reversing = next.x + current.x === 0 && next.y + current.y === 0;
  if (!reversing) state.pendingDirection = next;
}

function togglePause() {
  if (state.mode === "playing") state.mode = "paused";
  else if (state.mode === "paused") state.mode = "playing";
  else if (state.mode === "title" || state.mode === "gameover") resetGame("playing");
  render();
}

function tick() {
  if (state.mode !== "playing") return;

  state.direction = state.pendingDirection;
  const head = state.snake[0];
  const next = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  };

  const wallHit = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS;
  const selfHit = state.snake.some((part) => part.x === next.x && part.y === next.y);
  if (wallHit || selfHit) {
    state.mode = "gameover";
    state.best = Math.max(state.best, state.score);
    localStorage.setItem("nokiaSnakeBest", String(state.best));
    playGameOverSound();
    return;
  }

  state.snake.unshift(next);
  if (next.x === state.food.x && next.y === state.food.y) {
    state.score += 10;
    placeFood();
    playEatSound();
  } else {
    state.snake.pop();
    playMoveSound();
  }
}

function update(deltaMs) {
  if (state.mode === "playing") {
    state.elapsed += deltaMs;
    state.tickRemainder += deltaMs;
    while (state.tickRemainder >= STEP_MS) {
      state.tickRemainder -= STEP_MS;
      tick();
    }
  }
}

function drawLcdBackground() {
  ctx.fillStyle = colors.lcd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.13;
  ctx.fillStyle = colors.dark;
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
  for (let x = 0; x < canvas.width; x += 4) {
    ctx.fillRect(x, 0, 1, canvas.height);
  }
  ctx.globalAlpha = 1;
}

function drawPixelText(text, x, y, size = 12, align = "left") {
  ctx.save();
  ctx.font = `700 ${size}px "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillStyle = colors.dark;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawHud() {
  drawPixelText(`SCORE ${state.score}`, 8, 8, 14);
  drawPixelText(`BEST ${state.best}`, canvas.width - 8, 8, 14, "right");
  ctx.fillStyle = colors.dark;
  ctx.fillRect(6, 31, canvas.width - 12, 2);
}

function drawGameArea() {
  ctx.strokeStyle = colors.mid;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, TOP, COLS * CELL, ROWS * CELL);

  ctx.fillStyle = colors.dark;
  for (const part of state.snake) {
    ctx.fillRect(part.x * CELL + 1, TOP + part.y * CELL + 1, CELL - 2, CELL - 2);
  }

  const head = state.snake[0];
  if (head) {
    ctx.fillStyle = colors.lcd;
    ctx.fillRect(head.x * CELL + 4, TOP + head.y * CELL + 4, 2, 2);
  }

  ctx.fillStyle = colors.dark;
  ctx.fillRect(state.food.x * CELL + 2, TOP + state.food.y * CELL + 2, CELL - 4, CELL - 4);
  ctx.fillStyle = colors.lcd;
  ctx.fillRect(state.food.x * CELL + 4, TOP + state.food.y * CELL + 4, 2, 2);
}

function drawOverlay(title, subtitle) {
  ctx.fillStyle = "rgba(158, 178, 106, 0.78)";
  ctx.fillRect(28, 86, canvas.width - 56, 88);
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 86, canvas.width - 56, 88);
  drawPixelText(title, canvas.width / 2, 102, 22, "center");
  drawPixelText(subtitle, canvas.width / 2, 138, 13, "center");
}

function render() {
  drawLcdBackground();
  drawHud();
  drawGameArea();

  if (state.mode === "title") {
    drawOverlay("SNAKE", "PRESS OK OR ARROWS");
  } else if (state.mode === "paused") {
    drawOverlay("PAUSED", "PRESS OK TO RESUME");
  } else if (state.mode === "gameover") {
    drawOverlay("GAME OVER", "PRESS OK TO RESTART");
  }
}

function loop(now) {
  const delta = Math.min(80, now - lastFrame);
  lastFrame = now;
  update(delta);
  render();
  rafId = requestAnimationFrame(loop);
}

function handleKey(event) {
  ensureAudio();
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key]);
    return;
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    if (state.mode === "gameover" || state.mode === "title") resetGame("playing");
    else togglePause();
  }
}

function renderGameToText() {
  const head = state.snake[0] || null;
  return JSON.stringify({
    coordinateSystem: "grid origin at top-left of play area; x right, y down",
    mode: state.mode,
    score: state.score,
    best: state.best,
    snakeLength: state.snake.length,
    head,
    direction: state.direction,
    pendingDirection: state.pendingDirection,
    food: state.food,
    grid: { cols: COLS, rows: ROWS },
  });
}

window.render_game_to_text = renderGameToText;
window.advanceTime = (ms) => {
  update(ms);
  render();
};

document.addEventListener("keydown", handleKey);
document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("restartBtn").addEventListener("click", () => {
  ensureAudio();
  resetGame("playing");
});
document.getElementById("startBtn").addEventListener("click", () => {
  ensureAudio();
  if (state.mode === "gameover" || state.mode === "title") resetGame("playing");
  else togglePause();
});
document.getElementById("soundBtn").addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  const button = document.getElementById("soundBtn");
  button.textContent = state.soundEnabled ? "Sound On" : "Sound Off";
  button.setAttribute("aria-pressed", String(state.soundEnabled));
  if (state.soundEnabled) {
    ensureAudio();
    beep(660, 0.045, 0.035);
  }
});

resetGame("title");
cancelAnimationFrame(rafId);
rafId = requestAnimationFrame(loop);
