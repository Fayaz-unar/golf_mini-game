/**
 * Greenroom — Mini Golf Engine
 * Complete interactive golf game with realistic hazard physics,
 * per-hole procedural course designs, particle effects, and audio synthesis.
 */
(() => {
  'use strict';
  window.__scriptStarted = true;
  try {
  // --- CANVAS & DISPLAY SETUP ---
  const canvas = document.getElementById('course');
  const ctx = canvas.getContext('2d');
  const V_WIDTH = 960;
  const V_HEIGHT = 600;
  let dpr = window.devicePixelRatio || 1;

  function initCanvasDPR() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(V_WIDTH * dpr);
    canvas.height = Math.round(V_HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  initCanvasDPR();
  window.addEventListener('resize', () => {
    initCanvasDPR();
    draw();
  });

  // --- AUDIO SYNTHESIS ENGINE (Web Audio API) ---
  let soundOn = false;
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!soundOn) return;
    const ac = getAudioContext();
    if (!ac) return;

    const now = ac.currentTime;

    if (type === 'shot') {
      // Wood/iron club strike: low punch + high click
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.13);

      // Noise transient click
      const bufferSize = ac.sampleRate * 0.04;
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = ac.createBufferSource();
      const noiseFilter = ac.createBiquadFilter();
      const noiseGain = ac.createGain();
      noise.buffer = buffer;
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1800;
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ac.destination);
      noise.start(now);
    } else if (type === 'bounce_tree') {
      // Hollow wood knock
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (type === 'bounce_wall') {
      // Turf bumper bounce
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'sand') {
      // Sand crunch swoosh
      const bufferSize = ac.sampleRate * 0.18;
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
      }
      const noise = ac.createBufferSource();
      const filter = ac.createBiquadFilter();
      const gain = ac.createGain();
      noise.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      noise.start(now);
    } else if (type === 'water') {
      // Water splash: noise + downward bubble tone
      const osc = ac.createOscillator();
      const oscGain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(oscGain);
      oscGain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.36);

      const bufferSize = ac.sampleRate * 0.28;
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = ac.createBufferSource();
      const filter = ac.createBiquadFilter();
      const noiseGain = ac.createGain();
      noise.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.28);
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ac.destination);
      noise.start(now);
    } else if (type === 'cup') {
      // Metallic pin clink + ball rattle drop
      [1400, 1850, 2200].forEach((freq, idx) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const start = now + idx * 0.05;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    } else if (type === 'fanfare') {
      // 4-note celebration arpeggio
      [523.25, 659.25, 783.99, 1046.5].forEach((hz, idx) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const start = now + idx * 0.11;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(hz, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(start);
        osc.stop(start + 0.46);
      });
    }
  }

  // --- PARTICLE SYSTEM ---
  const particles = [];

  function spawnSplashParticles(x, y) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#a6d9e8' : '#eaf7fb',
        alpha: 0.9,
        decay: 0.025 + Math.random() * 0.02,
        type: 'dot'
      });
    }
    // Concentric ripple rings
    particles.push({
      x,
      y,
      radius: 6,
      maxRadius: 36,
      grow: 1.2,
      color: '#89c6d6',
      alpha: 0.8,
      decay: 0.025,
      type: 'ring'
    });
    particles.push({
      x,
      y,
      radius: 2,
      maxRadius: 24,
      grow: 0.9,
      color: '#bde3ee',
      alpha: 0.9,
      decay: 0.03,
      type: 'ring'
    });
  }

  function spawnSandParticles(x, y) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.2;
      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5,
        color: '#dfcaa0',
        alpha: 0.7,
        decay: 0.04,
        type: 'dot'
      });
    }
  }

  function spawnTreeParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#73955d' : '#496b3f',
        alpha: 0.9,
        decay: 0.03,
        type: 'dot'
      });
    }
  }

  function spawnConfettiParticles(x, y) {
    const colors = ['#d4ef7a', '#f6f8ee', '#f7d354', '#55b376', '#e06f53'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 5.2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.016 + Math.random() * 0.015,
        type: 'sparkle'
      });
    }
  }

  function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'ring') {
        p.radius += p.grow;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'sparkle') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- COURSE & HOLES DEFINITION ---
  const holes = [
    {
      name: 'The First Light',
      par: 3,
      start: [150, 410],
      cup: [790, 185],
      angle: -0.36,
      obstacles: [
        { type: 'pond', x: 486, y: 333, rx: 110, ry: 67, rot: -0.2 },
        { type: 'bunker', x: 674, y: 400, rx: 91, ry: 38, rot: -0.16 },
        { type: 'tree', x: 346, y: 218, r: 34 },
        { type: 'tree', x: 557, y: 153, r: 30 }
      ],
      tip: 'A gentle touch goes a long way on this green.',
      wind: '2 MPH',
      wx: 0.013,
      wy: -0.006,
      drawFairway: (ctx) => {
        // Broad sweeping green path from bottom-left to top-right
        ctx.beginPath();
        ctx.moveTo(-20, 390);
        ctx.bezierCurveTo(125, 336, 205, 361, 331, 302);
        ctx.bezierCurveTo(486, 230, 539, 197, 680, 234);
        ctx.bezierCurveTo(771, 256, 851, 163, 980, 122);
        ctx.lineTo(980, 472);
        ctx.bezierCurveTo(829, 485, 746, 488, 630, 458);
        ctx.bezierCurveTo(490, 421, 430, 468, 311, 478);
        ctx.bezierCurveTo(180, 493, 67, 471, -20, 509);
        ctx.closePath();
      }
    },
    {
      name: 'Fern Gully',
      par: 4,
      start: [132, 450],
      cup: [823, 150],
      angle: -0.43,
      obstacles: [
        { type: 'pond', x: 325, y: 345, rx: 116, ry: 55, rot: -0.2 },
        { type: 'pond', x: 660, y: 242, rx: 118, ry: 62, rot: 0.15 },
        { type: 'bunker', x: 490, y: 447, rx: 100, ry: 36, rot: -0.16 },
        { type: 'tree', x: 411, y: 190, r: 37 },
        { type: 'tree', x: 753, y: 386, r: 31 }
      ],
      tip: 'Thread the gap between the two ponds.',
      wind: '4 MPH',
      wx: -0.019,
      wy: -0.012,
      drawFairway: (ctx) => {
        // Channel passing between the two ponds
        ctx.beginPath();
        ctx.moveTo(-20, 420);
        ctx.bezierCurveTo(120, 390, 210, 470, 350, 460);
        ctx.bezierCurveTo(460, 450, 470, 300, 520, 250);
        ctx.bezierCurveTo(580, 180, 720, 120, 980, 90);
        ctx.lineTo(980, 360);
        ctx.bezierCurveTo(850, 380, 770, 280, 680, 320);
        ctx.bezierCurveTo(580, 380, 540, 530, 400, 550);
        ctx.bezierCurveTo(250, 560, 90, 540, -20, 530);
        ctx.closePath();
      }
    },
    {
      name: 'The Long Way',
      par: 4,
      start: [140, 170],
      cup: [810, 427],
      angle: 0.39,
      obstacles: [
        { type: 'pond', x: 499, y: 281, rx: 110, ry: 93, rot: 0 },
        { type: 'bunker', x: 306, y: 377, rx: 89, ry: 36, rot: 0.2 },
        { type: 'bunker', x: 722, y: 165, rx: 85, ry: 34, rot: -0.1 },
        { type: 'tree', x: 380, y: 167, r: 34 },
        { type: 'tree', x: 644, y: 422, r: 34 }
      ],
      tip: 'The long route around the water is the safe one.',
      wind: '1 MPH',
      wx: 0.007,
      wy: 0.003,
      drawFairway: (ctx) => {
        // Fairway connects top-left tee (140, 170) around central water down to bottom-right cup (810, 427)
        ctx.beginPath();
        ctx.moveTo(-20, 120);
        ctx.bezierCurveTo(140, 100, 230, 110, 320, 130);
        ctx.bezierCurveTo(470, 100, 680, 90, 850, 110);
        ctx.bezierCurveTo(940, 130, 980, 240, 980, 480);
        ctx.lineTo(980, 560);
        ctx.bezierCurveTo(820, 580, 650, 530, 540, 470);
        ctx.bezierCurveTo(430, 420, 360, 460, 260, 480);
        ctx.bezierCurveTo(140, 500, 70, 430, -20, 390);
        ctx.lineTo(-20, 260);
        ctx.bezierCurveTo(60, 250, 130, 240, 170, 230);
        ctx.bezierCurveTo(150, 190, 90, 170, -20, 170);
        ctx.closePath();
      }
    }
  ];

  // --- STATE VARIABLES ---
  let holeIndex = 0;
  let strokes = [null, null, null];
  let ball = { x: 150, y: 410, vx: 0, vy: 0, radius: 8, rotation: 0, scale: 1 };
  let lastSafePos = { x: 150, y: 410 };
  let aim = -0.36;
  let power = 50;
  let moving = false;
  let completed = false;
  let isHazardRespawning = false;
  let isSinking = false;
  let drag = false;
  let charging = false;
  let chargeStart = 0;
  let chargeFrame = 0;
  let spaceDown = false;
  let trail = [];
  let bestRound = null;

  try {
    const saved = localStorage.getItem('greenroom-best-round');
    if (saved) bestRound = Number(saved) || null;
  } catch {}

  const $ = (id) => document.getElementById(id);
  const currentHole = () => holes[holeIndex];

  // --- ELLIPSE POINT CONTAINMENT HELPER ---
  function isInsideRotatedEllipse(px, py, ox, oy, rx, ry, rot) {
    const cos = Math.cos(rot || 0);
    const sin = Math.sin(rot || 0);
    const dx = px - ox;
    const dy = py - oy;
    const nx = (dx * cos + dy * sin) / rx;
    const ny = (-dx * sin + dy * cos) / ry;
    return nx * nx + ny * ny <= 1;
  }

  // --- RESET & SETUP ---
  function resetBall() {
    const h = currentHole();
    if (charging) {
      charging = false;
      cancelAnimationFrame(chargeFrame);
    }
    $('shoot').classList.remove('charging');
    $('shootLabel').textContent = 'TAKE THE SHOT';
    $('shootArrow').textContent = '↗';
    $('chargeProgress').style.width = '0%';

    ball = {
      x: h.start[0],
      y: h.start[1],
      vx: 0,
      vy: 0,
      radius: 8,
      rotation: 0,
      scale: 1
    };
    lastSafePos = { x: ball.x, y: ball.y };
    trail = [];
    aim = h.angle;
    moving = false;
    completed = false;
    isHazardRespawning = false;
    isSinking = false;

    $('shoot').disabled = false;
    $('hint').textContent = 'CLICK & DRAG TO AIM';
    $('toast').classList.remove('show', 'hazard');
    draw();
  }

  // --- DRAWING THE COURSE ---
  function draw() {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    // 1. Lawn Base (Softly mottled lawn)
    ctx.fillStyle = '#c9d5ad';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    for (let i = 0; i < 145; i++) {
      const x = (i * 173 + 31) % V_WIDTH;
      const y = (i * 97 + 41) % V_HEIGHT;
      ctx.fillStyle = i % 2 ? '#dce3c4' : '#bccb9f';
      ctx.globalAlpha = 0.17;
      ctx.beginPath();
      ctx.ellipse(x, y, 18 + (i % 21), 5 + (i % 8), -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 2. Custom Fairway per hole
    const h = currentHole();
    ctx.save();
    h.drawFairway(ctx);
    ctx.fillStyle = '#83a66a';
    ctx.fill();

    // Subtle mower stripes clipped to fairway
    ctx.clip();
    for (let y = 80; y < 560; y += 38) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.055;
      ctx.fillRect(0, y, V_WIDTH, 18);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // 3. Putting Green Apron around the cup
    ctx.fillStyle = '#94b878';
    ctx.beginPath();
    ctx.ellipse(h.cup[0], h.cup[1], 46, 32, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // 4. Tee Box Marker
    ctx.fillStyle = '#658852';
    ctx.beginPath();
    ctx.arc(h.start[0], h.start[1], 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2ebd5';
    ctx.beginPath();
    ctx.arc(h.start[0], h.start[1], 3, 0, Math.PI * 2);
    ctx.fill();

    // 5. Obstacles: Ponds, Bunkers, Trees
    for (const o of h.obstacles) {
      if (o.type === 'pond') {
        const rot = o.rot || 0;
        // Water Body
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(rot);
        ctx.fillStyle = '#779f9b';
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b2c9aa';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Water ripple/highlight
        ctx.fillStyle = '#a6c4b5';
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.ellipse(-o.rx * 0.25, -o.ry * 0.35, o.rx * 0.27, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (o.type === 'bunker') {
        const rot = o.rot || 0;
        // Sand trap
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(rot);
        ctx.fillStyle = '#d6c28f';
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e3d5ac';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Sand highlight
        ctx.fillStyle = '#eee2bb';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.ellipse(-o.rx * 0.26, -o.ry * 0.36, o.rx * 0.27, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (o.type === 'tree') {
        // Shadow
        ctx.fillStyle = '#2d452b44';
        ctx.beginPath();
        ctx.arc(o.x + 4, o.y + 6, o.r, 0, Math.PI * 2);
        ctx.fill();

        // Foliage layers
        ctx.fillStyle = '#466e4d';
        ctx.beginPath();
        ctx.arc(o.x, o.y + 4, o.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#648751';
        ctx.beginPath();
        ctx.arc(o.x - 5, o.y - 4, o.r * 0.73, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#849a5c';
        ctx.beginPath();
        ctx.arc(o.x - 9, o.y - 9, o.r * 0.34, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#506d47';
        ctx.beginPath();
        ctx.arc(o.x + 5, o.y + 7, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Boundary Course Edges (Subtle Wood Rails)
    ctx.strokeStyle = '#85785a';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, V_WIDTH - 20, V_HEIGHT - 20);

    // 7. Cup and Flag
    ctx.fillStyle = '#243b2c';
    ctx.beginPath();
    ctx.ellipse(h.cup[0], h.cup[1] + 2, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flagpole
    ctx.strokeStyle = '#e8ebd7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(h.cup[0], h.cup[1]);
    ctx.lineTo(h.cup[0], h.cup[1] - 50);
    ctx.stroke();

    // Flag pennant
    ctx.fillStyle = '#d35639';
    ctx.beginPath();
    ctx.moveTo(h.cup[0] + 1, h.cup[1] - 49);
    ctx.lineTo(h.cup[0] + 32, h.cup[1] - 40);
    ctx.lineTo(h.cup[0] + 1, h.cup[1] - 31);
    ctx.closePath();
    ctx.fill();

    // Cup center pin
    ctx.fillStyle = '#42613d';
    ctx.beginPath();
    ctx.arc(h.cup[0], h.cup[1], 3, 0, Math.PI * 2);
    ctx.fill();

    // 8. Aim Guide with Trajectory Preview
    if (!moving && !completed && !isHazardRespawning) {
      const lineLen = 35 + (power / 100) * 110;
      const targetX = ball.x + Math.cos(aim) * lineLen;
      const targetY = ball.y + Math.sin(aim) * lineLen;

      // Dashed aim line
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#fafae6';
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      ctx.restore();

      // Aim target circle
      ctx.fillStyle = '#fafae6';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Trajectory prediction dots (with gentle wind drift)
      ctx.save();
      ctx.fillStyle = '#fffce0';
      const steps = 6;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const px = ball.x + Math.cos(aim) * lineLen * t + h.wx * (t * t * 150);
        const py = ball.y + Math.sin(aim) * lineLen * t + h.wy * (t * t * 150);
        ctx.globalAlpha = 0.2 + t * 0.45;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 9. Shot Trail
    trail.forEach((point, i) => {
      const fade = (i + 1) / trail.length;
      ctx.globalAlpha = fade * 0.35;
      ctx.fillStyle = '#f5f4dc';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.5 + fade * 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 10. Active Particles
    updateAndDrawParticles();

    // 11. Golf Ball with rolling rotation & scale (sinking)
    if (!isHazardRespawning) {
      const currentRadius = ball.radius * ball.scale;

      // Ball shadow
      ctx.fillStyle = '#31472b44';
      ctx.beginPath();
      ctx.ellipse(ball.x + 3, ball.y + 4, currentRadius * 1.1, currentRadius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball core
      ctx.fillStyle = '#fbfaf1';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d7d7c6';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rolling seam / dimples (shows rotation)
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.rotation);
      ctx.fillStyle = '#c5c5b2';
      ctx.beginPath();
      ctx.arc(-currentRadius * 0.35, -currentRadius * 0.3, 1.3, 0, Math.PI * 2);
      ctx.arc(currentRadius * 0.3, currentRadius * 0.35, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Gloss highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x - currentRadius * 0.3, ball.y - currentRadius * 0.35, currentRadius * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update Aim Angle Readouts
    const angleText = String(Math.round(((aim * 180) / Math.PI + 360) % 360)).padStart(3, '0') + '°';
    $('angleReadout').textContent = angleText;
    $('mobileAimValue').textContent = angleText;
  }

  // --- COLLISION & HAZARD ENGINE ---
  let lastBounceAt = 0;

  function collide() {
    const h = currentHole();

    // 1. Water Hazard Collision
    for (const o of h.obstacles) {
      if (o.type === 'pond') {
        if (isInsideRotatedEllipse(ball.x, ball.y, o.x, o.y, o.rx, o.ry, o.rot)) {
          triggerWaterHazard();
          return;
        }
      }
    }

    // 2. Sand Bunker Drag
    for (const o of h.obstacles) {
      if (o.type === 'bunker') {
        if (isInsideRotatedEllipse(ball.x, ball.y, o.x, o.y, o.rx, o.ry, o.rot)) {
          // Strong deceleration in sand
          ball.vx *= 0.88;
          ball.vy *= 0.88;
          if (Math.hypot(ball.vx, ball.vy) > 0.4 && Math.random() < 0.45) {
            spawnSandParticles(ball.x, ball.y);
            playSound('sand');
          }
        }
      }
    }

    // 3. Tree Collision (Circle to Circle)
    for (const o of h.obstacles) {
      if (o.type === 'tree') {
        const dx = ball.x - o.x;
        const dy = ball.y - o.y;
        const dist = Math.hypot(dx, dy);
        const minDist = o.r + ball.radius;

        if (dist < minDist) {
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          // Push ball outside tree boundary
          ball.x = o.x + nx * minDist;
          ball.y = o.y + ny * minDist;

          // Elastic bounce reflection
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 1.65 * dot * nx;
          ball.vy -= 1.65 * dot * ny;
          ball.vx *= 0.82;
          ball.vy *= 0.82;

          spawnTreeParticles(ball.x, ball.y);

          if (performance.now() - lastBounceAt > 150) {
            playSound('bounce_tree');
            lastBounceAt = performance.now();
          }
        }
      }
    }

    // 4. Course Border Reflection (Proper Axis Separation)
    const PADDING = 18;
    let bounced = false;

    if (ball.x - ball.radius <= PADDING) {
      ball.x = PADDING + ball.radius;
      ball.vx = -ball.vx * 0.75;
      bounced = true;
    } else if (ball.x + ball.radius >= V_WIDTH - PADDING) {
      ball.x = V_WIDTH - PADDING - ball.radius;
      ball.vx = -ball.vx * 0.75;
      bounced = true;
    }

    if (ball.y - ball.radius <= PADDING) {
      ball.y = PADDING + ball.radius;
      ball.vy = -ball.vy * 0.75;
      bounced = true;
    } else if (ball.y + ball.radius >= V_HEIGHT - PADDING) {
      ball.y = V_HEIGHT - PADDING - ball.radius;
      ball.vy = -ball.vy * 0.75;
      bounced = true;
    }

    if (bounced && performance.now() - lastBounceAt > 140) {
      playSound('bounce_wall');
      lastBounceAt = performance.now();
    }
  }

  // --- WATER HAZARD HANDLER ---
  function triggerWaterHazard() {
    isHazardRespawning = true;
    moving = false;
    ball.vx = 0;
    ball.vy = 0;

    spawnSplashParticles(ball.x, ball.y);
    playSound('water');

    // Add +1 penalty stroke
    strokes[holeIndex] = (strokes[holeIndex] || 1) + 1;
    updateScore();

    // Show Hazard Toast
    $('toast').textContent = 'WATER HAZARD (+1 PENALTY)';
    $('toast').classList.add('show', 'hazard');
    $('hint').textContent = 'WATER HAZARD — DROPPING BALL';

    // Animate sinking
    let sinkProgress = 0;
    function animateSink() {
      sinkProgress += 0.08;
      ball.scale = Math.max(0.1, 1 - sinkProgress);
      draw();
      if (sinkProgress < 1) {
        requestAnimationFrame(animateSink);
      } else {
        // Reset ball to safe spot after delay
        setTimeout(() => {
          ball.x = lastSafePos.x;
          ball.y = lastSafePos.y;
          ball.vx = 0;
          ball.vy = 0;
          ball.scale = 1;
          trail = [];
          isHazardRespawning = false;
          $('toast').classList.remove('show', 'hazard');
          $('hint').textContent = 'BALL RETRIEVED · LINE UP YOUR SHOT';
          $('shoot').disabled = false;
          draw();
        }, 650);
      }
    }
    requestAnimationFrame(animateSink);
  }

  // --- PHYSICS SIMULATION TICK ---
  function tick() {
    if (!moving || isHazardRespawning || isSinking) return;

    const h = currentHole();

    // Apply gentle wind drift
    ball.vx += h.wx * 0.08;
    ball.vy += h.wy * 0.08;

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Track rotation and speed
    const speed = Math.hypot(ball.vx, ball.vy);
    ball.rotation += speed * 0.12;

    // Add to shot trail
    trail.push({ x: ball.x, y: ball.y });
    if (trail.length > 28) trail.shift();

    // Normal turf friction
    ball.vx *= 0.986;
    ball.vy *= 0.986;

    // Check collisions with hazards, obstacles, and walls
    collide();
    if (isHazardRespawning) return;

    // Cup Funnel & Sink Detection
    const distToCup = Math.hypot(ball.x - h.cup[0], ball.y - h.cup[1]);

    // Gravitational pull towards cup center when close and rolling softly
    if (distToCup < 22 && speed < 3.8) {
      ball.vx += (h.cup[0] - ball.x) * 0.05;
      ball.vy += (h.cup[1] - ball.y) * 0.05;
    }

    // Cup Drop Condition
    if (distToCup < 12 && speed < 2.9) {
      triggerCupSink();
      return;
    }

    // Ball comes to rest
    if (speed < 0.22) {
      ball.vx = 0;
      ball.vy = 0;
      moving = false;
      lastSafePos = { x: ball.x, y: ball.y };
      $('hint').textContent = 'YOUR SHOT — LINE IT UP';
      $('shoot').disabled = false;
    }

    draw();

    if (moving) {
      requestAnimationFrame(tick);
    }
  }

  // --- CUP SINK ANIMATION & COMPLETE ---
  function triggerCupSink() {
    const h = currentHole();
    isSinking = true;
    moving = false;
    ball.vx = 0;
    ball.vy = 0;

    playSound('cup');
    spawnConfettiParticles(h.cup[0], h.cup[1]);

    // Animate ball dropping smoothly into cup
    let sinkT = 0;
    function animateDrop() {
      sinkT += 0.12;
      ball.x += (h.cup[0] - ball.x) * 0.35;
      ball.y += (h.cup[1] - ball.y) * 0.35;
      ball.scale = Math.max(0.1, 1 - sinkT);
      draw();
      if (sinkT < 1) {
        requestAnimationFrame(animateDrop);
      } else {
        ball.x = h.cup[0];
        ball.y = h.cup[1];
        finishHole();
      }
    }
    requestAnimationFrame(animateDrop);
  }

  // --- SHOOTING MECHANICS ---
  function shoot() {
    if (moving || completed || isHazardRespawning || isSinking) return;

    trail = [];
    lastSafePos = { x: ball.x, y: ball.y };

    strokes[holeIndex] = (strokes[holeIndex] || 0) + 1;
    updateScore();

    playSound('shot');

    // Force scale: 0.9 min to 8.4 max
    const force = 0.9 + (power / 100) * 7.5;
    ball.vx = Math.cos(aim) * force;
    ball.vy = Math.sin(aim) * force;

    moving = true;
    $('shoot').disabled = true;
    $('hint').textContent = 'BALL IN PLAY';

    requestAnimationFrame(tick);
  }

  // --- POWER SLIDER & CHARGING ---
  function paintPower() {
    power = Math.max(10, Math.min(100, Math.round(power)));
    $('powerValue').textContent = power;
    $('power').value = power;
    $('power').style.background = `linear-gradient(to right, #78964e 0 ${power}%, #e6eadf ${power}% 100%)`;
    if (!moving && !completed) draw();
  }

  // Oscillating Ping-Pong Charge Loop
  function chargeLoop(now) {
    if (!charging) return;
    const elapsed = now - chargeStart;
    const period = 1400; // 1.4s per full back-and-forth cycle
    const cycle = (elapsed % period) / period;
    const factor = cycle < 0.5 ? cycle * 2 : (1 - cycle) * 2;

    power = 10 + factor * 90;
    paintPower();

    $('chargeProgress').style.width = factor * 100 + '%';
    chargeFrame = requestAnimationFrame(chargeLoop);
  }

  function beginCharge() {
    if (charging || moving || completed || isHazardRespawning) return;
    charging = true;
    chargeStart = performance.now();
    $('shoot').classList.add('charging');
    $('shootLabel').textContent = 'CHARGING · RELEASE TO SHOOT';
    $('shootArrow').textContent = '●';
    $('hint').textContent = 'HOLD TO BUILD POWER';
    chargeFrame = requestAnimationFrame(chargeLoop);
  }

  function releaseCharge() {
    if (!charging) return;
    charging = false;
    cancelAnimationFrame(chargeFrame);
    $('shoot').classList.remove('charging');
    $('shootLabel').textContent = 'TAKE THE SHOT';
    $('shootArrow').textContent = '↗';
    $('chargeProgress').style.width = '0%';
    if (!moving && !completed && !isHazardRespawning) {
      shoot();
    }
  }

  // --- HOLE COMPLETION & SCORECARD ---
  function finishHole() {
    completed = true;
    strokes[holeIndex] ??= 1;
    updateScore();

    const n = strokes[holeIndex];
    const par = currentHole().par;
    const diff = n - par;

    let msg = 'IN THE CUP!';
    if (n === 1) msg = 'HOLE IN ONE!';
    else if (diff <= -2) msg = 'EAGLE!';
    else if (diff === -1) msg = 'BIRDIE!';
    else if (diff === 0) msg = 'PAR';
    else if (diff === 1) msg = 'BOGEY';
    else msg = `+${diff} BOGEY`;

    $('toast').textContent = msg;
    $('toast').classList.add('show');
    $('hint').textContent = 'HOLE COMPLETE';
    $('shoot').disabled = true;

    if (holeIndex < 2) {
      setTimeout(() => {
        holeIndex++;
        updateHole();
        resetBall();
      }, 1600);
    } else {
      // Round Complete!
      const total = strokes.reduce((sum, val) => sum + (val || 0), 0);
      const coursePar = holes.reduce((sum, h) => sum + h.par, 0); // 11
      const totalDiff = total - coursePar;

      if (!bestRound || total < bestRound) {
        bestRound = total;
        try {
          localStorage.setItem('greenroom-best-round', String(bestRound));
        } catch {}
      }

      playSound('fanfare');

      setTimeout(() => {
        showScorecardModal(total, totalDiff, coursePar);
      }, 1300);
    }
  }

  function showScorecardModal(total, totalDiff, coursePar) {
    $('modalTotalStrokes').textContent = total;

    let diffText = 'E';
    if (totalDiff < 0) diffText = `${totalDiff} UNDER`;
    else if (totalDiff > 0) diffText = `+${totalDiff} OVER`;
    $('modalScoreToPar').textContent = diffText;
    $('modalBestRound').textContent = bestRound || total;

    // Populate modal table rows
    for (let i = 0; i < 3; i++) {
      const s = strokes[i] || 0;
      const p = holes[i].par;
      const d = s - p;
      $(`mStrokes${i}`).textContent = s;

      const badge = $(`mBadge${i}`);
      badge.className = 'badge';

      if (s === 1) {
        badge.textContent = 'Ace!';
        badge.classList.add('ace');
      } else if (d <= -1) {
        badge.textContent = d === -1 ? 'Birdie' : 'Eagle';
        badge.classList.add('birdie');
      } else if (d === 0) {
        badge.textContent = 'Par';
        badge.classList.add('par');
      } else {
        badge.textContent = d === 1 ? 'Bogey' : `+${d}`;
        badge.classList.add('bogey');
      }
    }

    $('scorecardModal').classList.add('show');
    $('scorecardModal').setAttribute('aria-hidden', 'false');
  }

  function restartFullRound() {
    $('scorecardModal').classList.remove('show');
    $('scorecardModal').setAttribute('aria-hidden', 'true');
    holeIndex = 0;
    strokes = [null, null, null];
    updateHole();
    resetBall();
  }

  // --- SCORE & UI UPDATES ---
  function updateScore() {
    const total = strokes.some((s) => s !== null) ? strokes.reduce((a, s) => a + (s || 0), 0) : '—';
    $('totalScore').textContent = total;

    for (let i = 0; i < 3; i++) {
      $('strokes' + i).textContent = strokes[i] === null ? '—' : strokes[i];
      $('row' + i).classList.toggle('active-row', i === holeIndex);
    }
  }

  function updateHole() {
    const h = currentHole();
    $('holeLabel').innerHTML = `HOLE ${String(holeIndex + 1).padStart(2, '0')} <span>—</span> PAR ${h.par}`;
    $('holeName').textContent = h.name;
    $('holeNumber').textContent = String(holeIndex + 1).padStart(2, '0');
    $('windValue').textContent = h.wind;

    // Wind direction arrow (↑ is base 0deg, pointing right requires +90deg)
    const windAngleDeg = (Math.atan2(h.wy, h.wx) * 180) / Math.PI + 90;
    $('windArrow').style.transform = `rotate(${windAngleDeg}deg)`;

    $('tipText').textContent = h.tip;
    $('scoreNote').textContent = bestRound
      ? `Best round: ${bestRound} · Course par is 11.`
      : 'Course par is 11 · Can you finish under par?';

    updateScore();
  }

  // --- INPUT & EVENT LISTENERS ---
  function setAimFromPointer(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) * V_WIDTH) / r.width;
    const y = ((e.clientY - r.top) * V_HEIGHT) / r.height;
    aim = Math.atan2(y - ball.y, x - ball.x);
    draw();
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (moving || completed || isHazardRespawning) return;
    drag = true;
    canvas.setPointerCapture?.(e.pointerId);
    setAimFromPointer(e);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (drag) setAimFromPointer(e);
  });

  canvas.addEventListener('pointerup', () => {
    drag = false;
  });

  canvas.addEventListener('pointercancel', () => {
    drag = false;
  });

  $('power').addEventListener('input', (e) => {
    power = +e.target.value;
    paintPower();
  });

  $('shoot').addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    $('shoot').setPointerCapture?.(e.pointerId);
    beginCharge();
  });

  $('shoot').addEventListener('pointerup', releaseCharge);
  $('shoot').addEventListener('pointercancel', releaseCharge);
  $('shoot').addEventListener('lostpointercapture', releaseCharge);

  $('shoot').addEventListener('click', () => {
    if (!moving && !completed && !isHazardRespawning && !charging) {
      shoot();
    }
  });

  $('reset').addEventListener('click', () => {
    if (charging) {
      charging = false;
      cancelAnimationFrame(chargeFrame);
      $('shoot').classList.remove('charging');
      $('shootLabel').textContent = 'TAKE THE SHOT';
    }
    strokes[holeIndex] = null;
    updateScore();
    resetBall();
  });

  $('playAgainBtn').addEventListener('click', restartFullRound);

  $('soundBtn').addEventListener('click', () => {
    soundOn = !soundOn;
    $('soundIcon').textContent = soundOn ? '♫' : '♪';
    $('soundBtn').style.background = soundOn ? '#eff2e7' : 'transparent';
    $('soundBtn').setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
    if (soundOn) {
      getAudioContext();
      playSound('bounce_wall');
    }
  });

  const nudgeAim = (direction) => {
    if (!moving && !completed && !isHazardRespawning) {
      aim += (direction * Math.PI) / 36;
      draw();
    }
  };

  $('aimLeft').addEventListener('click', () => nudgeAim(-1));
  $('aimRight').addEventListener('click', () => nudgeAim(1));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (!moving && !completed && !isHazardRespawning) {
        aim += e.key === 'ArrowLeft' ? -Math.PI / 90 : Math.PI / 90;
        draw();
      }
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!spaceDown) {
        spaceDown = true;
        beginCharge();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      spaceDown = false;
      releaseCharge();
    }
  });

  window.addEventListener('blur', () => {
    spaceDown = false;
    releaseCharge();
  });

  // --- INITIALIZATION ---
  paintPower();
  resetBall();
  updateHole();

  // Test & debug interface
  window.__golf = {
    getBall: () => ball,
    setBall: (x, y) => { ball.x = x; ball.y = y; draw(); },
    getStrokes: () => [...strokes],
    getHoleIndex: () => holeIndex,
    setPower: (p) => { power = p; paintPower(); },
    shoot,
    resetBall,
    finishHole,
    restartFullRound,
    testPhysicsStep: (x, y, vx, vy) => {
      ball.x = x;
      ball.y = y;
      ball.vx = vx;
      ball.vy = vy;
      moving = true;
      tick();
    },
    draw
  };
  } catch (err) {
    window.__gameError = err.message + '\n' + (err.stack || '');
    console.error('Golf Engine Error:', err);
  }
})();
