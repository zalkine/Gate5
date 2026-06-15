'use strict';

// ─── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('scene');
const ctx    = canvas.getContext('2d');

function resize() {
  const wrapper = document.getElementById('scene-wrapper');
  canvas.width  = wrapper.clientWidth  * devicePixelRatio;
  canvas.height = wrapper.clientHeight * devicePixelRatio;
  canvas.style.width  = wrapper.clientWidth  + 'px';
  canvas.style.height = wrapper.clientHeight + 'px';
  render();
}
window.addEventListener('resize', resize);

// ─── State ───────────────────────────────────────────────────────────────────
let items = [];          // placed items
let activeTool = null;   // currently selected tool type
let activeSize = 1.0;    // current size multiplier

// ─── Tool definitions ────────────────────────────────────────────────────────
const TOOLS = {
  fan:       { emoji: '🧑', baseSize: 38, label: 'אוהד' },
  flag:      { emoji: '🚩', baseSize: 44, label: 'דגל' },
  torch:     { emoji: '🔥', baseSize: 40, label: 'אבוקה' },
  smoke:     { emoji: '💨', baseSize: 50, label: 'עשן' },
  flaglet:   { emoji: '🏳️', baseSize: 34, label: 'דגלון' },
  balloon:   { emoji: '🎈', baseSize: 40, label: 'בלון' },
  placard:   { emoji: '📋', baseSize: 44, label: 'פלקט' },
  fenceflag: { emoji: '🏴', baseSize: 44, label: 'דגל גדר' },
};

// ─── Draw Gate 5 background ──────────────────────────────────────────────────
function drawGate() {
  const W = canvas.width;
  const H = canvas.height;

  // Sky gradient – night atmosphere
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  sky.addColorStop(0, '#0a0a1a');
  sky.addColorStop(1, '#1a1a3e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const stars = [[0.1,0.04],[0.25,0.02],[0.4,0.07],[0.6,0.03],[0.75,0.05],[0.88,0.02],[0.95,0.08]];
  for (const [sx, sy] of stars) {
    ctx.beginPath();
    ctx.arc(sx * W, sy * H, 1.5 * (W / 400), 0, Math.PI * 2);
    ctx.fill();
  }

  // Floodlights (top corners)
  drawFloodlight(ctx, 0.03 * W, 0.04 * H, W);
  drawFloodlight(ctx, 0.97 * W, 0.04 * H, W);

  // Ground / terrace floor
  const groundY = H * 0.72;
  const ground = ctx.createLinearGradient(0, groundY, 0, H);
  ground.addColorStop(0, '#2d2d2d');
  ground.addColorStop(1, '#111');
  ctx.fillStyle = ground;
  ctx.fillRect(0, groundY, W, H - groundY);

  // Concrete terrace tiers
  drawTiers(ctx, W, H, groundY);

  // Main gate arch structure
  drawGateStructure(ctx, W, H);

  // Fence at bottom
  drawFence(ctx, W, H);

  // Red & white banners draped on fence
  drawBanners(ctx, W, H);

  // Gate label
  ctx.save();
  ctx.font = `bold ${W * 0.045}px Arial`;
  ctx.fillStyle = '#e63946';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 8;
  ctx.fillText('שער 5', W * 0.5, H * 0.18);
  ctx.restore();
}

function drawFloodlight(ctx, x, y, W) {
  const scale = W / 400;
  // Pole
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 60 * scale);
  ctx.stroke();
  // Light head
  ctx.fillStyle = '#ccc';
  ctx.fillRect(x - 12 * scale, y - 5 * scale, 24 * scale, 8 * scale);
  // Glow
  const glow = ctx.createRadialGradient(x, y, 2 * scale, x, y, 80 * scale);
  glow.addColorStop(0, 'rgba(255,255,200,0.18)');
  glow.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 80 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawTiers(ctx, W, H, groundY) {
  const tierCount = 5;
  const tierH = (groundY - H * 0.28) / tierCount;
  for (let i = 0; i < tierCount; i++) {
    const y = H * 0.28 + i * tierH;
    const darkness = 0.15 + i * 0.04;
    ctx.fillStyle = `rgba(60,60,80,${darkness})`;
    ctx.fillRect(0, y, W, tierH);
    // tier edge line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawGateStructure(ctx, W, H) {
  const scale = W / 400;
  const cx = W / 2;

  // Outer arch pillars
  const pillarW = 18 * scale;
  const pillarH = H * 0.48;
  const pillarY = H * 0.22;
  const leftX  = cx - W * 0.38;
  const rightX = cx + W * 0.38 - pillarW;

  const pillarGrad = ctx.createLinearGradient(leftX, 0, leftX + pillarW, 0);
  pillarGrad.addColorStop(0, '#555');
  pillarGrad.addColorStop(0.5, '#888');
  pillarGrad.addColorStop(1, '#444');
  ctx.fillStyle = pillarGrad;
  ctx.fillRect(leftX, pillarY, pillarW, pillarH);
  ctx.fillRect(rightX, pillarY, pillarW, pillarH);

  // Arch top
  ctx.strokeStyle = '#777';
  ctx.lineWidth = pillarW;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(leftX + pillarW / 2, pillarY + pillarH * 0.1);
  ctx.quadraticCurveTo(cx, pillarY - H * 0.06, rightX + pillarW / 2, pillarY + pillarH * 0.1);
  ctx.stroke();

  // Inner gate opening (dark)
  ctx.fillStyle = '#050510';
  const gateL = leftX + pillarW + 10 * scale;
  const gateR = rightX - 10 * scale;
  const gateW = gateR - gateL;
  const gateY = pillarY + pillarH * 0.15;
  const gateH = pillarH * 0.75;
  ctx.fillRect(gateL, gateY, gateW, gateH);

  // Gate horizontal beam
  ctx.fillStyle = '#666';
  ctx.fillRect(leftX + pillarW, pillarY + pillarH * 0.12, gateW, 10 * scale);

  // Hapoel star / crest placeholder inside gate
  drawCrest(ctx, cx, gateY + gateH * 0.35, 28 * scale);

  // Brick texture on pillars (subtle)
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.5;
  for (let row = 0; row < 20; row++) {
    const y = pillarY + row * 12 * scale;
    if (y > pillarY + pillarH) break;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(leftX + pillarW, y);
    ctx.moveTo(rightX, y);
    ctx.lineTo(rightX + pillarW, y);
    ctx.stroke();
  }
}

function drawCrest(ctx, cx, cy, r) {
  // Simple Star of David / Hapoel crest
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#e63946';
  ctx.lineWidth = r * 0.12;
  // Triangle up
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.stroke();
  // Triangle down
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / 3;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawFence(ctx, W, H) {
  const scale = W / 400;
  const fenceY = H * 0.68;
  const fenceH = 28 * scale;

  // Fence rail
  ctx.fillStyle = '#555';
  ctx.fillRect(0, fenceY, W, 4 * scale);
  ctx.fillRect(0, fenceY + fenceH * 0.5, W, 4 * scale);
  ctx.fillRect(0, fenceY + fenceH, W, 4 * scale);

  // Vertical bars
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2.5 * scale;
  const barSpacing = 14 * scale;
  for (let x = 0; x < W; x += barSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, fenceY);
    ctx.lineTo(x, fenceY + fenceH);
    ctx.stroke();
  }
}

function drawBanners(ctx, W, H) {
  const bannerY = H * 0.685;
  const bannerH  = H * 0.035;
  const colors = ['#e63946','#ffffff','#e63946','#ffffff','#e63946'];
  const segW = W / colors.length;
  for (let i = 0; i < colors.length; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(i * segW, bannerY, segW, bannerH);
  }
}

// ─── Render placed items ──────────────────────────────────────────────────────
function drawItems() {
  const W = canvas.width;
  const H = canvas.height;
  for (const item of items) {
    const tool = TOOLS[item.type];
    const fontSize = tool.baseSize * item.size * (W / 400);
    ctx.save();
    ctx.font = `${fontSize}px serif`;
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'bottom';

    // Smoke gets opacity
    if (item.type === 'smoke') {
      ctx.globalAlpha = 0.75;
    }

    ctx.fillText(tool.emoji, item.x * W, item.y * H);
    ctx.restore();
  }
}

// ─── Main render ─────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGate();
  drawItems();
}

// ─── Toolbar interaction ──────────────────────────────────────────────────────
const sizePicker = document.getElementById('size-picker');

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    if (activeTool === type) {
      // Deselect
      activeTool = null;
      btn.classList.remove('active');
      sizePicker.classList.add('hidden');
    } else {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTool = type;
      sizePicker.classList.remove('hidden');
    }
  });
});

document.querySelectorAll('.size-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeSize = parseFloat(btn.dataset.size);
  });
});

// Set default size button active
document.querySelector('.size-opt[data-size="1.0"]').classList.add('active');

// ─── Place item on tap / click ────────────────────────────────────────────────
function getCanvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top)  / rect.height,
  };
}

let touchMoved = false;

canvas.addEventListener('touchstart', e => {
  touchMoved = false;
}, { passive: true });

canvas.addEventListener('touchmove', () => {
  touchMoved = true;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (touchMoved || !activeTool) return;
  e.preventDefault();
  const pt = getCanvasPoint({ touches: e.changedTouches });
  placeItem(pt.x, pt.y);
});

canvas.addEventListener('click', e => {
  if (!activeTool) return;
  const pt = getCanvasPoint(e);
  placeItem(pt.x, pt.y);
});

function placeItem(x, y) {
  items.push({ type: activeTool, x, y, size: activeSize });
  render();
}

// ─── Long press to remove nearest item ───────────────────────────────────────
let pressTimer = null;

canvas.addEventListener('touchstart', e => {
  pressTimer = setTimeout(() => {
    const pt = getCanvasPoint({ touches: e.touches });
    removeNearest(pt.x, pt.y);
  }, 600);
}, { passive: true });

canvas.addEventListener('touchend',  () => clearTimeout(pressTimer), { passive: true });
canvas.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const pt = getCanvasPoint(e);
  removeNearest(pt.x, pt.y);
});

function removeNearest(nx, ny) {
  if (!items.length) return;
  const W = canvas.width;
  const H = canvas.height;
  let best = -1, bestD = Infinity;
  items.forEach((item, i) => {
    const dx = (item.x - nx) * W;
    const dy = (item.y - ny) * H;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < bestD) { bestD = d; best = i; }
  });
  const threshold = 60 * (W / 400);
  if (best >= 0 && bestD < threshold) {
    items.splice(best, 1);
    render();
  }
}

// ─── Clear ────────────────────────────────────────────────────────────────────
document.getElementById('btn-clear').addEventListener('click', () => {
  if (!items.length) return;
  if (confirm('למחוק את כל הפריטים?')) {
    items = [];
    render();
  }
});

// ─── Save image ───────────────────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'gate5.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
resize();
