// ====================== GLOBAL & THEME ======================
let totalScore = Number(localStorage.getItem('totalScore')) || 0;
let highScore = Number(localStorage.getItem('highScore')) || 0;

document.getElementById('total-score').textContent = totalScore;
document.getElementById('high-score').textContent = highScore;

const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  themeBtn.textContent = document.body.classList.contains('light-mode') ? '🌙 Tungi rejim' : '☀️ Tongi rejim';
  playAudio('hit');
});

document.querySelectorAll('.game-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.game').forEach(g => g.classList.remove('active'));
    document.getElementById(btn.dataset.game).classList.add('active');
    playAudio('hit');
  });
});

// ====================== AUDIO GENERATOR (WEB AUDIO API) ======================
function playAudio(type) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'hit') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(450, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'score') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(580, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'over') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(280, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch(e) { console.log("Audio xatoligi:", e); }
}

// ==================== SNAKE (O'YNALMAYOTGANDA KATTA RASM TURADIGAN) ====================
const snakeCanvas = document.getElementById('snake-canvas');
const sCtx = snakeCanvas.getContext('2d');
let snake = [], dx = 1, dy = 0, food = {}, snakeScore = 0;
let snakeInterval = null;
let currentSpeed = 120;

// O'yin o'ynalmayotgan paytdagi KATTA NEON ILONCHA RASMI
function drawSnakeWelcomeImage() {
  sCtx.clearRect(0, 0, 640, 640);
  
  // Orqa fon effekti (Grid)
  sCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if ((i + j) % 2 === 0) sCtx.fillRect(i * 32, j * 32, 32, 32);
    }
  }

  // Katta ilon rasmi mantiqan piksellarda (Yashil neon porlashi bilan)
  sCtx.fillStyle = '#00ff88';
  sCtx.shadowBlur = 20;
  sCtx.shadowColor = '#00ff88';
  
  const bodyParts = [
    {x: 4, y: 12}, {x: 5, y: 12}, {x: 6, y: 12}, {x: 7, y: 12}, {x: 8, y: 12},
    {x: 8, y: 11}, {x: 8, y: 10}, {x: 9, y: 10}, {x: 10, y: 10}, {x: 11, y: 10},
    {x: 11, y: 11}, {x: 11, y: 12}, {x: 11, y: 13}, {x: 12, y: 13}, {x: 13, y: 13},
    {x: 14, y: 13}, {x: 14, y: 12}, {x: 14, y: 11}, {x: 15, y: 11}
  ];
  bodyParts.forEach(p => sCtx.fillRect(p.x * 32, p.y * 32, 28, 28));

  // Ko'z va qizil til
  sCtx.fillStyle = '#fff'; sCtx.fillRect(15 * 32 + 16, 11 * 32 + 6, 6, 6);
  sCtx.fillStyle = '#ff0055'; sCtx.fillRect(15 * 32 + 28, 11 * 32 + 12, 12, 4);

  // Bonus mevalar (Pushti)
  sCtx.fillStyle = '#ff0088'; sCtx.shadowColor = '#ff0088';
  sCtx.fillRect(4 * 32, 5 * 32, 26, 26); sCtx.fillRect(15 * 32, 16 * 32, 26, 26);
  
  sCtx.shadowBlur = 0; // Matn uchun soyani tozalash

  // "SNAKE GAME" Sarlavhasi
  sCtx.fillStyle = '#ffffff'; sCtx.font = 'bold 42px sans-serif'; sCtx.textAlign = 'center';
  sCtx.fillText('🐍 SNAKE GAME', 320, 240);

  // Yo'riqnoma matni
  sCtx.fillStyle = '#00ffcc'; sCtx.font = '18px sans-serif';
  sCtx.fillText('O\'yinni boshlash uchun "Boshlash" tugmasini bosing', 320, 300);
}

function initSnake() {
  snake = [{x: 10, y: 10}];
  dx = 1; dy = 0; snakeScore = 0; food = {x: 15, y: 15};
  document.getElementById('snake-score').textContent = 0;
}

function drawSnake() {
  sCtx.clearRect(0, 0, 640, 640);
  sCtx.fillStyle = '#00ff88'; snake.forEach(p => sCtx.fillRect(p.x * 32, p.y * 32, 30, 30));
  sCtx.fillStyle = '#ff0088'; sCtx.fillRect(food.x * 32, food.y * 32, 30, 30);
}

function updateSnake() {
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};
  if (head.x < 0 || head.x > 19 || head.y < 0 || head.y > 19 || snake.some(s => s.x === head.x && s.y === head.y)) {
    clearInterval(snakeInterval); snakeInterval = null;
    if (snakeScore > highScore) { highScore = snakeScore; localStorage.setItem('highScore', highScore); document.getElementById('high-score').textContent = highScore; }
    playAudio('over'); alert(`Game Over! Ball: ${snakeScore}`);
    drawSnakeWelcomeImage(); // Yutqazganda rasm yana qaytadi
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    snakeScore += 20; totalScore += 20;
    document.getElementById('snake-score').textContent = snakeScore;
    document.getElementById('total-score').textContent = totalScore;
    localStorage.setItem('totalScore', totalScore); playAudio('score');
    food = {x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20)};
  } else { snake.pop(); }
  drawSnake();
}

function setDifficulty(level) {
  if (snakeInterval) clearInterval(snakeInterval);
  currentSpeed = level === 'easy' ? 180 : level === 'normal' ? 120 : 60;
  initSnake(); snakeInterval = setInterval(updateSnake, currentSpeed); // Rasm ketib o'yin boshlanadi
}

document.getElementById('snake-start').addEventListener('click', () => {
  if (snakeInterval) { clearInterval(snakeInterval); snakeInterval = null; drawSnakeWelcomeImage(); return; }
  setDifficulty('normal');
});
document.getElementById('snake-restart').addEventListener('click', () => setDifficulty('normal'));
document.getElementById('easy').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('normal').addEventListener('click', () => setDifficulty('normal'));
document.getElementById('hard').addEventListener('click', () => setDifficulty('hard'));

document.addEventListener('keydown', e => {
  if (!document.getElementById('snake').classList.contains('active') || !snakeInterval) return;
  switch(e.key) {
    case 'ArrowUp': if(dy !== 1){dx=0; dy=-1;} break;
    case 'ArrowDown': if(dy !== -1){dx=0; dy=1;} break;
    case 'ArrowLeft': if(dx !== 1){dx=-1; dy=0;} break;
    case 'ArrowRight': if(dx !== -1){dx=1; dy=0;} break;
  }
});

// Sahifa yuklanganda KATTA ILON RASMI chiqib turadi
drawSnakeWelcomeImage();

// ==================== TIC-TAC-TOE ====================
let tttBoard = Array(9).fill(null), tttPlayer = 'X';
const cells = [], boardEl = document.getElementById('board');
for (let i = 0; i < 9; i++) {
  const cell = document.createElement('div'); cell.classList.add('cell');
  cell.addEventListener('click', () => tttMove(i)); boardEl.appendChild(cell); cells.push(cell);
}
function tttMove(i) {
  if (tttBoard[i] || tttPlayer === 'O') return;
  tttBoard[i] = 'X'; cells[i].textContent = 'X'; cells[i].style.color = '#00ffcc'; playAudio('hit');
  if (checkWin('X')) { playAudio('score'); setTimeout(() => { alert("🎉 Siz yutdingiz!"); resetTTT(); }, 50); return; }
  if (!tttBoard.includes(null)) { playAudio('hit'); setTimeout(() => { alert("Durrang!"); resetTTT(); }, 50); return; }
  tttPlayer = 'O'; setTimeout(aiMove, 300);
}
function aiMove() {
  let bestScore = -Infinity, bestMove = null;
  for (let i = 0; i < 9; i++) {
    if (!tttBoard[i]) { tttBoard[i] = 'O'; let score = minimax(tttBoard, 0, false); tttBoard[i] = null; if (score > bestScore) { bestScore = score; bestMove = i; } }
  }
  if (bestMove !== null) {
    tttBoard[bestMove] = 'O'; cells[bestMove].textContent = 'O'; cells[bestMove].style.color = '#ff00aa'; playAudio('hit');
    if (checkWin('O')) { playAudio('over'); setTimeout(() => { alert("🤖 AI yutdi!"); resetTTT(); }, 50); }
    else if (!tttBoard.includes(null)) { playAudio('hit'); setTimeout(() => { alert("Durrang!"); resetTTT(); }, 50); }
  }
  tttPlayer = 'X';
}
function minimax(board, depth, isMax) {
  if (checkWin('O')) return 10 - depth; if (checkWin('X')) return depth - 10; if (!board.includes(null)) return 0;
  if (isMax) {
    let best = -Infinity; for (let i = 0; i < 9; i++) if (!board[i]) { board[i] = 'O'; best = Math.max(best, minimax(board, depth+1, false)); board[i] = null; } return best;
  } else {
    let best = Infinity; for (let i = 0; i < 9; i++) if (!board[i]) { board[i] = 'X'; best = Math.min(best, minimax(board, depth+1, true)); board[i] = null; } return best;
  }
}
function checkWin(p) { const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; return wins.some(combo => combo.every(i => tttBoard[i] === p)); }
function resetTTT() { tttBoard = Array(9).fill(null); cells.forEach(c => { c.textContent = ''; c.style.color = ''; }); tttPlayer = 'X'; }
document.getElementById('ttt-reset').addEventListener('click', resetTTT);

// ==================== PONG ====================
const pongCanvas = document.getElementById('pong-canvas'); const pCtx = pongCanvas.getContext('2d');
let playerY = 200, aiY = 200, ballX = 400, ballY = 250, ballDX = 6, ballDY = 3, aiSpeed = 6.5, playerScore = 0, aiScore = 0, pongInterval, pongRunning = false;
function drawPong() {
  pCtx.clearRect(0, 0, 800, 500); pCtx.fillStyle = '#00ffcc'; pCtx.fillRect(20, playerY, 15, 100);
  pCtx.fillStyle = '#ff00aa'; pCtx.fillRect(765, aiY, 15, 100); pCtx.fillStyle = '#fff'; pCtx.beginPath(); pCtx.arc(ballX, ballY, 10, 0, Math.PI*2); pCtx.fill();
}
function updatePong() {
  ballX += ballDX; ballY += ballDY; if (ballY <= 10 || ballY >= 490) { ballDY *= -1; playAudio('hit'); }
  if (ballX <= 45 && ballY >= playerY && ballY <= playerY + 100) { ballDX = Math.abs(ballDX) * 1.05; playAudio('hit'); }
  if (ballX >= 755 && ballY >= aiY && ballY <= aiY + 100) { ballDX = -Math.abs(ballDX) * 1.05; playAudio('hit'); }
  if (ballX < 0) { aiScore++; document.getElementById('ai-score').textContent = aiScore; playAudio('over'); resetBall(); }
  if (ballX > 800) { playerScore++; document.getElementById('player-score').textContent = playerScore; playAudio('score'); resetBall(); }
  if (aiY + 50 < ballY) aiY += aiSpeed; else if (aiY + 50 > ballY) aiY -= aiSpeed; drawPong();
}
function resetBall() { ballX = 400; ballY = 250; ballDX = (Math.random() > 0.5 ? 6 : -6); ballDY = (Math.random() * 8 - 4); }
function setPongDiff(level, btnId) {
  document.querySelectorAll("[id^='pong-']").forEach(b => b.classList.remove('active-diff')); document.getElementById(btnId).classList.add('active-diff');
  aiSpeed = level === 'easy' ? 4.5 : level === 'normal' ? 6.5 : 8.8; playAudio('hit');
}
document.getElementById('pong-easy').addEventListener('click', () => setPongDiff('easy', 'pong-easy'));
document.getElementById('pong-normal').addEventListener('click', () => setPongDiff('normal', 'pong-normal'));
document.getElementById('pong-hard').addEventListener('click', () => setPongDiff('hard', 'pong-hard'));
document.getElementById('pong-start').addEventListener('click', () => { if (pongRunning) { clearInterval(pongInterval); pongRunning = false; return; } pongRunning = true; resetBall(); pongInterval = setInterval(updatePong, 16); });
document.getElementById('pong-restart').addEventListener('click', () => { if (pongInterval) clearInterval(pongInterval); playerScore = aiScore = 0; document.getElementById('player-score').textContent = 0; document.getElementById('ai-score').textContent = 0; pongRunning = false; resetBall(); playerY = aiY = 200; drawPong(); });
document.addEventListener('keydown', e => { if (!document.getElementById('pong').classList.contains('active')) return; if (e.key === 'ArrowUp') playerY = Math.max(0, playerY - 40); if (e.key === 'ArrowDown') playerY = Math.min(400, playerY + 40); });
drawPong();

// ==================== BREAKOUT ====================
const breakoutCanvas = document.getElementById('breakout-canvas'); const bCtx = breakoutCanvas.getContext('2d');
let paddleX = 290, ballXb = 350, ballYb = 400, ballDXb = 5, ballDYb = -5, speedMult = 1, bricks = [], breakoutInterval = null;
function createBricks() { bricks = []; for (let r = 0; r < 5; r++) { for (let c = 0; c < 8; c++) bricks.push({x: c*80 + 35, y: r*35 + 60, width: 70, height: 25, hit: false}); } }
function drawBreakout() {
  bCtx.clearRect(0, 0, 700, 500); bCtx.fillStyle = '#00ffcc'; bCtx.fillRect(paddleX, 460, 120, 18); bCtx.fillStyle = '#ff00aa'; bCtx.beginPath(); bCtx.arc(ballXb, ballYb, 11, 0, Math.PI*2); bCtx.fill();
  bricks.forEach(brick => { if (!brick.hit) { bCtx.fillStyle = '#ffff00'; bCtx.fillRect(brick.x, brick.y, brick.width, brick.height); } });
}
function updateBreakout() {
  ballXb += ballDXb; ballYb += ballDYb; if (ballXb <= 10 || ballXb >= 690) { ballDXb *= -1; playAudio('hit'); } if (ballYb <= 10) { ballDYb *= -1; playAudio('hit'); }
  if (ballYb >= 450 && ballXb >= paddleX && ballXb <= paddleX + 120) { ballDYb = -Math.abs(ballDYb); playAudio('hit'); }
  for (let b of bricks) { if (!b.hit && ballXb > b.x && ballXb < b.x + b.width && ballYb > b.y && ballYb < b.y + b.height) { b.hit = true; ballDYb *= -1; playAudio('hit'); break; } }
  if (bricks.every(b => b.hit)) { playAudio('score'); alert("🎉 G'alaba!"); createBricks(); clearInterval(breakoutInterval); breakoutInterval=null; }
  if (ballYb > 490) { playAudio('over'); alert("Game Over!"); createBricks(); ballXb=350; ballYb=400; ballDXb = 5 * speedMult; ballDYb = -5 * speedMult; } drawBreakout();
}
function setBreakoutDiff(level, btnId) {
  document.querySelectorAll("[id^='breakout-']").forEach(b => b.classList.remove('active-diff')); document.getElementById(btnId).classList.add('active-diff');
  speedMult = level === 'easy' ? 0.7 : level === 'normal' ? 1 : 1.5; ballDXb = (ballDXb > 0 ? 5 : -5) * speedMult; ballDYb = (ballDYb > 0 ? 5 : -5) * speedMult; playAudio('hit');
}
document.getElementById('breakout-easy').addEventListener('click', () => setBreakoutDiff('easy', 'breakout-easy'));
document.getElementById('breakout-normal').addEventListener('click', () => setBreakoutDiff('normal', 'breakout-normal'));
document.getElementById('breakout-hard').addEventListener('click', () => setBreakoutDiff('hard', 'breakout-hard'));
document.getElementById('breakout-start').addEventListener('click', () => { if (breakoutInterval) return; createBricks(); breakoutInterval = setInterval(updateBreakout, 16); });
document.getElementById('breakout-restart').addEventListener('click', () => { if (breakoutInterval) clearInterval(breakoutInterval); breakoutInterval = null; createBricks(); ballXb = 350; ballYb = 400; drawBreakout(); });
breakoutCanvas.addEventListener('mousemove', e => { const rect = breakoutCanvas.getBoundingClientRect(); paddleX = e.clientX - rect.left - 60; if (paddleX < 0) paddleX = 0; if (paddleX > 580) paddleX = 580; });
createBricks(); drawBreakout();

// ==================== 2048 (TO'LIQ VA ISHLAYDIGAN VERSUYA) ====================
let grid2048 = Array(16).fill(0);
let score2048 = 0;

function init2048() {
  grid2048 = Array(16).fill(0);
  score2048 = 0;
  addTile();
  addTile();
  render2048();
}

function addTile() {
  let empty = grid2048.map((v, i) => v === 0 ? i : null).filter(v => v !== null);
  if (empty.length) {
    grid2048[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
  }
}

function render2048() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  grid2048.forEach(val => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (val) {
      tile.textContent = val;
      // Har xil sonlar uchun chiroyli ranglar
      tile.style.background = val >= 2048 ? '#ff0066' : val >= 512 ? '#ff8800' : val >= 128 ? '#ffcc00' : val >= 16 ? '#00ccff' : '#44337a';
      tile.style.color = '#fff';
      tile.style.display = 'flex';
      tile.style.alignItems = 'center';
      tile.style.justifyContent = 'center';
    } else {
      tile.style.background = 'rgba(255,255,255,0.05)';
    }
    gridEl.appendChild(tile);
  });
  document.getElementById('2048-score').textContent = score2048;
}

// Bloklarni surish va birlashtirish mantiqi
function move2048(direction) {
  let moved = false;
  // 1D arrayni 2D matritsaga o'tkazamiz (4x4)
  let matrix = [];
  for (let i = 0; i < 4; i++) matrix.push(grid2048.slice(i * 4, i * 4 + 4));

  function slide(row) {
    let arr = row.filter(val => val);
    let missing = 4 - arr.length;
    return arr.concat(Array(missing).fill(0));
  }

  function merge(row) {
    for (let i = 0; i < 3; i++) {
      if (row[i] === row[i + 1] && row[i] !== 0) {
        row[i] *= 2;
        score2048 += row[i];
        totalScore += row[i];
        document.getElementById('total-score').textContent = totalScore;
        localStorage.setItem('totalScore', totalScore);
        row[i + 1] = 0;
        playAudio('score');
      }
    }
    return row;
  }

  // 4 ta yo'nalish bo'yicha surish
  if (direction === 'left') {
    for (let i = 0; i < 4; i++) {
      let oldRow = [...matrix[i]];
      let row = slide(matrix[i]);
      row = merge(row);
      row = slide(row);
      matrix[i] = row;
      if (JSON.stringify(oldRow) !== JSON.stringify(row)) moved = true;
    }
  } else if (direction === 'right') {
    for (let i = 0; i < 4; i++) {
      let oldRow = [...matrix[i]];
      let row = [...matrix[i]].reverse();
      row = slide(row);
      row = merge(row);
      row = slide(row);
      row.reverse();
      matrix[i] = row;
      if (JSON.stringify(oldRow) !== JSON.stringify(row)) moved = true;
    }
  } else if (direction === 'up') {
    for (let j = 0; j < 4; j++) {
      let oldCol = [matrix[0][j], matrix[1][j], matrix[2][j], matrix[3][j]];
      let col = slide(oldCol);
      col = merge(col);
      col = slide(col);
      for (let i = 0; i < 4; i++) matrix[i][j] = col[i];
      if (JSON.stringify(oldCol) !== JSON.stringify(col)) moved = true;
    }
  } else if (direction === 'down') {
    for (let j = 0; j < 4; j++) {
      let oldCol = [matrix[0][j], matrix[1][j], matrix[2][j], matrix[3][j]];
      let col = [...oldCol].reverse();
      col = slide(col);
      col = merge(col);
      col = slide(col);
      col.reverse();
      for (let i = 0; i < 4; i++) matrix[i][j] = col[i];
      if (JSON.stringify(oldCol) !== JSON.stringify(col)) moved = true;
    }
  }

  if (moved) {
    grid2048 = matrix.flat();
    addTile();
    render2048();
    playAudio('hit');
    checkGameOver2048();
  }
}

// Haqiqiy Game Over tekshiruvi
function checkGameOver2048() {
  if (grid2048.includes(0)) return; // Bo'sh joy bo'lsa o'yin davom etadi

  // Yonma-yon yoki ustma-ust bir xil son bormi?
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let current = grid2048[i * 4 + j];
      if (j < 3 && current === grid2048[i * 4 + j + 1]) return; // O'ng tomoni bir xil
      if (i < 3 && current === grid2048[(i + 1) * 4 + j]) return; // Pastki tomoni bir xil
    }
  }

  // Agar na bo'sh joy, na qo'shish imkoni bo'lsa - Game Over
  playAudio('over');
  alert(`Game Over! 2048 o'yinidagi balingiz: ${score2048}`);
}

// 2048 uchun klaviatura tinglovchisi (Arrow keys va WASD)
document.addEventListener('keydown', e => {
  if (!document.getElementById('2048').classList.contains('active')) return;
  
  const key = e.key.toLowerCase();
  if (e.key === 'ArrowLeft' || key === 'a') move2048('left');
  if (e.key === 'ArrowRight' || key === 'd') move2048('right');
  if (e.key === 'ArrowUp' || key === 'w') move2048('up');
  if (e.key === 'ArrowDown' || key === 's') move2048('down');
});

document.getElementById('reset2048').addEventListener('click', () => {
  init2048();
  playAudio('hit');
});

// O'yinni ilk bor yoqish
init2048();