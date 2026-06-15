'use strict';

const COLS = 32;
const ROWS = 20;

// ── State ──────────────────────────────────────────────────────────────────
let grid        = createGrid();
let activeTool  = 'card';
let activeColor = '#CC0000';
let isPainting  = false;
let history     = [];
let frame       = 0;

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function cloneGrid(g) {
  return g.map(row => row.map(c => c ? { ...c } : null));
}

// ── Canvas ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('scene');
const ctx    = canvas.getContext('2d');
let GR = {};  // grid rect in canvas pixels

function resize() {
  const wrap = document.getElementById('scene-wrapper');
  const dpr  = devicePixelRatio || 1;
  canvas.width  = wrap.clientWidth  * dpr;
  canvas.height = wrap.clientHeight * dpr;
  canvas.style.width  = wrap.clientWidth  + 'px';
  canvas.style.height = wrap.clientHeight + 'px';
  computeGR();
}

function computeGR() {
  const W = canvas.width, H = canvas.height;
  GR = {
    x: W * 0.07,
    y: H * 0.20,
    w: W * 0.86,
    h: H * 0.72,
  };
}

// ── Cell geometry (mild perspective) ──────────────────────────────────────
function cellRect(col, row) {
  const t        = row / (ROWS - 1);           // 0=top, 1=bottom
  const scale    = 0.82 + 0.18 * t;
  const rowW     = GR.w * scale;
  const rowX     = GR.x + (GR.w - rowW) / 2;
  const cellW    = rowW / COLS;
  const cellH    = GR.h / ROWS;
  return { x: rowX + col * cellW, y: GR.y + row * cellH, w: cellW, h: cellH };
}

function pointToCell(px, py) {
  const row = Math.floor((py - GR.y) / (GR.h / ROWS));
  if (row < 0 || row >= ROWS) return null;
  const t    = row / (ROWS - 1);
  const scale = 0.82 + 0.18 * t;
  const rowW  = GR.w * scale;
  const rowX  = GR.x + (GR.w - rowW) / 2;
  const col   = Math.floor((px - rowX) / (rowW / COLS));
  if (col < 0 || col >= COLS) return null;
  return { col, row };
}

// ── Render ─────────────────────────────────────────────────────────────────
function loop() {
  frame++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStadium();
  drawGrid();
  requestAnimationFrame(loop);
}

// ── Stadium backdrop ───────────────────────────────────────────────────────
function drawStadium() {
  const W = canvas.width, H = canvas.height;

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.2);
  sky.addColorStop(0, '#4fa8d5');
  sky.addColorStop(1, '#87CEEB');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.22);

  // Roof structure
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, H * 0.14, W, H * 0.065);

  // Roof girders
  ctx.strokeStyle = '#555';
  ctx.lineWidth = (W / 400) * 4;
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(W * i / 10, H * 0.14);
    ctx.lineTo(W * i / 10, H * 0.21);
    ctx.stroke();
  }
  // Roof edge highlight
  ctx.fillStyle = '#666';
  ctx.fillRect(0, H * 0.14, W, 3 * devicePixelRatio);
  ctx.fillStyle = '#222';
  ctx.fillRect(0, H * 0.20, W, H * 0.005);

  // Dark block behind the fan grid
  ctx.fillStyle = '#151515';
  ctx.fillRect(GR.x - 2, GR.y - 2, GR.w + 4, GR.h + 4);

  // Side bleachers
  drawBleacher(0,           GR.y, GR.x,           GR.h);
  drawBleacher(GR.x + GR.w, GR.y, W - GR.x - GR.w, GR.h);

  // Pitch strip at bottom
  const pitchY = GR.y + GR.h;
  const pitch = ctx.createLinearGradient(0, pitchY, 0, H);
  pitch.addColorStop(0, '#2d6a1e');
  pitch.addColorStop(1, '#1a4010');
  ctx.fillStyle = pitch;
  ctx.fillRect(0, pitchY, W, H - pitchY);

  // Pitch lines
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = devicePixelRatio;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, pitchY);
  ctx.lineTo(W * 0.5, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W * 0.5, pitchY + (H - pitchY) * 0.55, (H - pitchY) * 0.35, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBleacher(x, y, w, h) {
  const BROWS = 14, BCOLS = Math.max(2, Math.floor(w / (GR.w / COLS / 1.2)));
  const cw = w / BCOLS, ch = h / BROWS;
  const palette = ['#CC6600','#DD7700','#BB5500','#EE8800'];
  for (let r = 0; r < BROWS; r++) {
    for (let c = 0; c < BCOLS; c++) {
      ctx.fillStyle = palette[(r * 3 + c * 2) % palette.length];
      ctx.fillRect(x + c * cw + 1, y + r * ch + 1, cw - 2, ch - 2);
    }
  }
}

// ── Grid cells ─────────────────────────────────────────────────────────────
function drawGrid() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      drawCell(col, row, grid[row][col]);
    }
  }
}

function drawCell(col, row, cell) {
  const { x, y, w, h } = cellRect(col, row);

  if (!cell) {
    // Empty seat – very dark
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
    return;
  }

  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(x, y, w, h);

  const { type, color } = cell;

  if (type === 'card') {
    // Fan body
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + w * 0.15, y + h * 0.52, w * 0.7, h * 0.48);
    // Head
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.46, w * 0.17, 0, Math.PI * 2);
    ctx.fill();
    // Card
    ctx.fillStyle = color;
    ctx.fillRect(x + w * 0.08, y + h * 0.06, w * 0.84, h * 0.37);
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + w * 0.08, y + h * 0.06, w * 0.84, h * 0.1);
  }

  else if (type === 'flag') {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + w * 0.2, y + h * 0.55, w * 0.6, h * 0.45);
    // Arms up
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x + w * 0.04, y + h * 0.30, w * 0.18, h * 0.28);
    ctx.fillRect(x + w * 0.78, y + h * 0.30, w * 0.18, h * 0.28);
    // Pole
    ctx.fillStyle = '#aaa';
    ctx.fillRect(x + w * 0.46, y + h * 0.04, w * 0.08, h * 0.54);
    // Waving flag
    const t = frame * 0.07 + col * 0.5 + row * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.54, y + h * 0.04);
    ctx.quadraticCurveTo(
      x + w * 0.75, y + h * 0.04 + Math.sin(t) * h * 0.06,
      x + w * 0.96, y + h * 0.06 + Math.sin(t + 1) * h * 0.05
    );
    ctx.lineTo(x + w * 0.94, y + h * 0.31 + Math.sin(t + 1.5) * h * 0.05);
    ctx.quadraticCurveTo(
      x + w * 0.73, y + h * 0.29 + Math.sin(t + 0.5) * h * 0.06,
      x + w * 0.54, y + h * 0.31
    );
    ctx.closePath();
    ctx.fill();
  }

  else if (type === 'torch') {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + w * 0.2, y + h * 0.52, w * 0.6, h * 0.48);
    // Arm + torch body
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x + w * 0.43, y + h * 0.28, w * 0.14, h * 0.28);
    ctx.fillStyle = '#888';
    ctx.fillRect(x + w * 0.44, y + h * 0.10, w * 0.12, h * 0.20);
    // Flicker
    const flick = 0.7 + 0.3 * Math.sin(frame * 0.18 + col * 1.1 + row * 0.7);
    ctx.fillStyle = `rgba(255,${Math.floor(60 + flick * 80)},0,0.95)`;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.07, w * 0.14 * flick, h * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,210,0,0.75)`;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.09, w * 0.07 * flick, h * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    // Glow
    const g = ctx.createRadialGradient(x + w * 0.5, y + h * 0.07, 0, x + w * 0.5, y + h * 0.07, w * 1.8);
    g.addColorStop(0, 'rgba(255,120,0,0.22)');
    g.addColorStop(1, 'rgba(255,120,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.07, w * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  else if (type === 'smoke') {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + w * 0.2, y + h * 0.72, w * 0.6, h * 0.28);
    // Puffs rising
    const rise = (frame * 0.8 + col * 13 + row * 7) % (h * 1.6);
    for (let i = 0; i < 4; i++) {
      const py    = y + h * 0.65 - i * h * 0.32 - (rise % (h * 0.32));
      const sz    = w * (0.28 + i * 0.15);
      const alpha = Math.max(0, 0.75 - i * 0.18 - rise / (h * 4));
      if (alpha <= 0) continue;
      ctx.fillStyle = hexRgba(color, alpha);
      ctx.beginPath();
      ctx.arc(x + w * 0.5 + Math.sin(i * 1.3) * w * 0.1, py, sz, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  else if (type === 'balloon') {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + w * 0.25, y + h * 0.62, w * 0.5, h * 0.38);
    const bob = Math.sin(frame * 0.05 + col * 0.4 + row * 0.6) * h * 0.025;
    // String
    ctx.strokeStyle = 'rgba(200,200,200,0.6)';
    ctx.lineWidth = Math.max(0.5, w * 0.04);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.57);
    ctx.lineTo(x + w * 0.5, y + h * 0.22 + bob);
    ctx.stroke();
    // Balloon
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.14 + bob, w * 0.27, h * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
    // Knot
    ctx.fillStyle = darken(color);
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.22 + bob, w * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.41, y + h * 0.10 + bob, w * 0.08, h * 0.05, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  else if (type === 'banner') {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + w * 0.05, y + h * 0.52, w * 0.9, h * 0.48);
    // Arms up holding banner
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x + w * 0.02, y + h * 0.27, w * 0.18, h * 0.28);
    ctx.fillRect(x + w * 0.8, y + h * 0.27, w * 0.18, h * 0.28);
    // Banner cloth
    ctx.fillStyle = color;
    ctx.fillRect(x + w * 0.02, y + h * 0.07, w * 0.96, h * 0.23);
    // Top bar
    ctx.fillStyle = '#aaa';
    ctx.fillRect(x + w * 0.02, y + h * 0.07, w * 0.96, h * 0.03);
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x + w * 0.02, y + h * 0.07, w * 0.96, h * 0.06);
  }
}

function hexRgba(hex, a) {
  const n = parseInt(hex.replace('#',''), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

function darken(hex) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, ((n>>16)&255) - 40);
  const g = Math.max(0, ((n>>8)&255) - 40);
  const b = Math.max(0, (n&255) - 40);
  return `rgb(${r},${g},${b})`;
}

// ── Flood fill ─────────────────────────────────────────────────────────────
function floodFill(col, row, color, type) {
  const target = grid[row][col];
  const sameType  = c => (c ? c.type  : null) === (target ? target.type  : null);
  const sameColor = c => (c ? c.color : null) === (target ? target.color : null);
  if (target && target.color === color && target.type === type) return;
  const queue = [[col, row]];
  const seen  = new Set();
  while (queue.length) {
    const [c, r] = queue.shift();
    const key = `${c},${r}`;
    if (seen.has(key)) continue;
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
    const cell = grid[r][c];
    if (!sameType(cell) || !sameColor(cell)) continue;
    seen.add(key);
    if (type === 'erase') { grid[r][c] = null; }
    else { grid[r][c] = { type, color }; }
    queue.push([c+1,r],[c-1,r],[c,r+1],[c,r-1]);
  }
}

// ── Paint ──────────────────────────────────────────────────────────────────
function paintAt(col, row) {
  if (activeTool === 'fill') {
    pushHistory();
    floodFill(col, row, activeColor, 'card');
  } else if (activeTool === 'erase') {
    grid[row][col] = null;
  } else {
    grid[row][col] = { type: activeTool, color: activeColor };
  }
}

// ── History ────────────────────────────────────────────────────────────────
function pushHistory() {
  history.push(cloneGrid(grid));
  if (history.length > 30) history.shift();
}

function undo() {
  if (!history.length) return;
  grid = history.pop();
}

// ── Input ──────────────────────────────────────────────────────────────────
function canvasXY(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr  = canvas.width / rect.width;
  let cx, cy;
  if (e.touches) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
  else           { cx = e.clientX;             cy = e.clientY; }
  return { x: (cx - rect.left) * dpr, y: (cy - rect.top) * dpr };
}

canvas.addEventListener('pointerdown', e => {
  isPainting = true;
  if (activeTool !== 'fill') pushHistory();
  const { x, y } = canvasXY(e);
  const cell = pointToCell(x, y);
  if (cell) paintAt(cell.col, cell.row);
});

canvas.addEventListener('pointermove', e => {
  if (!isPainting || activeTool === 'fill') return;
  const { x, y } = canvasXY(e);
  const cell = pointToCell(x, y);
  if (cell) paintAt(cell.col, cell.row);
});

canvas.addEventListener('pointerup',     () => { isPainting = false; });
canvas.addEventListener('pointercancel', () => { isPainting = false; });
canvas.addEventListener('contextmenu',   e  => e.preventDefault());

// ── Toolbar ────────────────────────────────────────────────────────────────
document.querySelectorAll('.cswatch').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cswatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeColor = btn.dataset.color;
  });
});

document.querySelectorAll('.tbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTool = btn.dataset.tool;
  });
});

document.getElementById('btn-undo').addEventListener('click', undo);

document.getElementById('btn-clear').addEventListener('click', () => {
  if (!grid.flat().some(Boolean)) return;
  if (confirm('למחוק את כל הטיפו?')) { pushHistory(); grid = createGrid(); }
});

document.getElementById('btn-save').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'tifo-gate5.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => { resize(); computeGR(); });
resize();
loop();
