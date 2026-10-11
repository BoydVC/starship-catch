/* Chopsticks Mission Control — offline SIM desk. All flight scenes are simulations/examples. */
(function () {
  "use strict";

  const DURATION = 28; // seconds of SIM timeline
  const PHASES = [
    { id: "approach", label: "APPROACH", t0: 0, t1: 0.28 },
    { id: "burn", label: "LANDING BURN", t0: 0.28, t1: 0.55 },
    { id: "align", label: "ALIGN", t0: 0.55, t1: 0.72 },
    { id: "catch", label: "CATCH", t0: 0.72, t1: 0.84 },
    { id: "hold", label: "HOLD", t0: 0.84, t1: 1.0 },
  ];

  const HOTSPOTS = [
    {
      id: "tower",
      title: "Mechazilla tower",
      body: "Public nickname for Starbase’s orbital launch / catch tower. Tall steel structure beside the mount that hosts the catch arms and service hardware. Fan schematic only — not an official drawing.",
      x: 0.28, y: 0.42, r: 18,
    },
    {
      id: "chopsticks",
      title: "Chopsticks (catch arms)",
      body: "A pair of large pivoting arms designed to close around a returning Super Heavy booster’s catch pins. Concept discussed publicly as a soft mechanical catch instead of landing legs.",
      x: 0.52, y: 0.38, r: 20,
    },
    {
      id: "qd",
      title: "Quick Disconnect (QD) arm",
      body: "Service arm concept that mates propellant / utilities umbilicals to the vehicle on the mount. Often shown swinging clear before liftoff in public footage.",
      x: 0.38, y: 0.62, r: 16,
    },
    {
      id: "pins",
      title: "Catch pins / hardpoints",
      body: "Structural hardpoints near the top of the booster that the chopsticks are intended to grip. Exact geometry is proprietary; this desk shows a simple silhouette only.",
      x: 0.62, y: 0.28, r: 14,
    },
    {
      id: "fins",
      title: "Grid fins",
      body: "Four grid fins provide aerodynamic control during atmospheric descent. Public flight tests have shown them deploying for steering toward the tower.",
      x: 0.68, y: 0.48, r: 15,
    },
    {
      id: "mount",
      title: "Orbital launch mount",
      body: "The pad structure under the vehicle. After a catch, the booster is held on the arms rather than touching down on legs (Super Heavy has no landing legs in the catch architecture).",
      x: 0.48, y: 0.82, r: 18,
    },
  ];

  const FLIGHT_LOG = [
    { id: "EX-01", label: "EXAMPLE · High approach drill", scenario: "SIM approach from Gulf side", focus: "Approach", outcome: "EXAMPLE · Nominal scrub path", notes: "Placeholder training row" },
    { id: "EX-02", label: "EXAMPLE · Burn timing practice", scenario: "Late landing burn cue", focus: "Burn", outcome: "EXAMPLE · Overshoot then recover", notes: "Not a real flight" },
    { id: "EX-03", label: "EXAMPLE · Chopstick align", scenario: "Offset correction near arms", focus: "Align", outcome: "EXAMPLE · Catch window entered", notes: "Demo only" },
    { id: "EX-04", label: "EXAMPLE · Soft contact", scenario: "Arms close on pins", focus: "Catch", outcome: "EXAMPLE · Soft catch", notes: "SIM narrative" },
    { id: "EX-05", label: "EXAMPLE · Tower hold", scenario: "Post-catch settle", focus: "Hold", outcome: "EXAMPLE · Held on arms", notes: "No live telemetry" },
    { id: "EX-06", label: "EXAMPLE · Gust day", scenario: "Crosswind swell", focus: "Align", outcome: "EXAMPLE · Marginal offset", notes: "Weather SIM" },
    { id: "EX-07", label: "EXAMPLE · Grid-fin heavy", scenario: "Aero steering emphasis", focus: "Approach", outcome: "EXAMPLE · Lineup OK", notes: "Fan desk" },
    { id: "EX-08", label: "EXAMPLE · Abort-to-water path", scenario: "Tower avoid trajectory", focus: "Burn", outcome: "EXAMPLE · Divert narrative", notes: "Not an official claim" },
  ];

  const WATCH_ITEMS = [
    "Chopsticks pre-position / open state before booster return",
    "Grid-fin deployment and steering toward the tower",
    "Landing burn start cue (engine plume lighting)",
    "Booster orientation vs chopsticks gap",
    "Arm close timing relative to catch pins",
    "Sonic boom timing on descent (if audible on stream)",
    "Ship splashdown / divert cues if booster path is scrubbed",
    "Pad / tower camera angles worth bookmarking for next webcast",
  ];

  // ---------- state ----------
  const state = {
    t: 0, // 0..1 timeline
    playing: true,
    speed: 1,
    slowMo: false,
    wall: false,
    activeTab: "control",
    hotId: "tower",
    lastTs: 0,
  };

  // ---------- helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function phaseAt(u) {
    for (const p of PHASES) if (u >= p.t0 && u < p.t1) return p;
    return PHASES[PHASES.length - 1];
  }

  /** Deterministic SIM trajectory: altitude, offset, arm open, thrust 0..1 */
  function sampleSim(u) {
    const uu = clamp(u, 0, 1);
    // altitude: start high, descend, settle at catch height
    let alt;
    if (uu < 0.72) alt = lerp(3200, 120, easeInOut(uu / 0.72));
    else if (uu < 0.84) alt = lerp(120, 100, (uu - 0.72) / 0.12);
    else alt = 100 + Math.sin((uu - 0.84) * 20) * 0.4;

    let offset;
    if (uu < 0.55) offset = lerp(180, 40, easeInOut(uu / 0.55));
    else if (uu < 0.72) offset = lerp(40, 4, easeInOut((uu - 0.55) / 0.17));
    else if (uu < 0.84) offset = lerp(4, 0.5, (uu - 0.72) / 0.12);
    else offset = 0.3 * Math.sin(uu * 30);

    const vel = uu < 0.28 ? lerp(210, 160, uu / 0.28)
      : uu < 0.55 ? lerp(160, 45, (uu - 0.28) / 0.27)
      : uu < 0.72 ? lerp(45, 8, (uu - 0.55) / 0.17)
      : uu < 0.84 ? lerp(8, 1.5, (uu - 0.72) / 0.12)
      : 0.2;

    const thrust = uu >= 0.28 && uu < 0.84 ? (uu < 0.35 ? (uu - 0.28) / 0.07 : uu < 0.75 ? 0.85 : lerp(0.85, 0.15, (uu - 0.75) / 0.09)) : 0;
    const arms = uu < 0.72 ? 1 : uu < 0.8 ? lerp(1, 0.15, (uu - 0.72) / 0.08) : 0.12;
    const tilt = uu < 0.72 ? Math.sin(uu * 12) * 4 * (1 - uu) : Math.sin(uu * 8) * 0.6;
    return { alt, offset, vel, thrust, arms, tilt, phase: phaseAt(uu) };
  }

  // ---------- starfield background ----------
  function initStars() {
    const c = $("#bgStars");
    if (!c) return;
    const ctx = c.getContext("2d");
    let stars = [];
    function resize() {
      c.width = window.innerWidth * devicePixelRatio;
      c.height = window.innerHeight * devicePixelRatio;
      c.style.width = window.innerWidth + "px";
      c.style.height = window.innerHeight + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.6 + 0.2,
        tw: Math.random() * Math.PI * 2,
      }));
    }
    resize();
    window.addEventListener("resize", resize);
    function draw(t) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const g = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
      g.addColorStop(0, "#05070c");
      g.addColorStop(1, "#0a1528");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * 0.001 + s.tw);
        ctx.beginPath();
        ctx.fillStyle = `rgba(200,220,255,${s.a * tw})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ---------- particles ----------
  function makeExhaust(n) {
    return Array.from({ length: n }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 0, r: 0,
    }));
  }
  function spawnExhaust(pool, x, y, thrust) {
    if (thrust < 0.05) return;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (p.life > 0) continue;
      p.x = x + (Math.random() - 0.5) * 10;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 40 * thrust;
      p.vy = 40 + Math.random() * 90 * thrust;
      p.life = p.max = 0.35 + Math.random() * 0.45;
      p.r = 2 + Math.random() * 5 * thrust;
      break;
    }
  }
  function stepExhaust(pool, dt) {
    for (const p of pool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy += 20 * dt;
    }
  }
  function drawExhaust(ctx, pool) {
    for (const p of pool) {
      if (p.life <= 0) continue;
      const a = clamp(p.life / p.max, 0, 1);
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2);
      grd.addColorStop(0, `rgba(255,220,140,${0.85 * a})`);
      grd.addColorStop(0.45, `rgba(255,100,40,${0.45 * a})`);
      grd.addColorStop(1, `rgba(40,20,10,0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- draw scene (tower + chopsticks + booster) ----------
  function drawCatchScene(ctx, W, H, sim, opts) {
    opts = opts || {};
    const groundY = H * 0.88;
    const towerX = W * 0.38;
    const catchY = groundY - H * 0.42;
    const armSpan = W * 0.16 * sim.arms + W * 0.02;

    // sky haze
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#07101c");
    sky.addColorStop(0.55, "#0b1a30");
    sky.addColorStop(1, "#152238");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // water / pad glow
    ctx.fillStyle = "#0a1620";
    ctx.fillRect(0, groundY, W, H - groundY);
    const padG = ctx.createRadialGradient(towerX + W * 0.08, groundY, 10, towerX + W * 0.08, groundY, W * 0.35);
    padG.addColorStop(0, "rgba(126,200,255,0.12)");
    padG.addColorStop(1, "transparent");
    ctx.fillStyle = padG;
    ctx.fillRect(0, groundY - 40, W, 80);

    // altitude scale -> booster Y
    const altNorm = clamp(1 - sim.alt / 3200, 0, 1);
    const boostY = lerp(H * 0.08, catchY - 30, Math.pow(altNorm, 0.85));
    const boostX = towerX + W * 0.12 + sim.offset * (W / 900);

    // tower body
    ctx.save();
    ctx.fillStyle = "#1a2438";
    ctx.strokeStyle = "rgba(126,200,255,0.35)";
    ctx.lineWidth = 2;
    const tw = W * 0.055;
    ctx.fillRect(towerX - tw / 2, catchY - H * 0.08, tw, groundY - (catchY - H * 0.08));
    ctx.strokeRect(towerX - tw / 2, catchY - H * 0.08, tw, groundY - (catchY - H * 0.08));
    // lattice hints
    ctx.strokeStyle = "rgba(126,200,255,0.15)";
    for (let i = 0; i < 8; i++) {
      const y = catchY - H * 0.05 + i * ((groundY - catchY) / 7);
      ctx.beginPath();
      ctx.moveTo(towerX - tw / 2, y);
      ctx.lineTo(towerX + tw / 2, y);
      ctx.stroke();
    }

    // chopsticks
    const armY = catchY;
    const open = sim.arms;
    const leftLen = W * 0.14;
    const rightLen = W * 0.14;
    const gap = lerp(W * 0.02, W * 0.12, open);
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#7ec8ff";
    ctx.shadowColor = "rgba(126,200,255,0.65)";
    ctx.shadowBlur = 16;
    // left arm
    ctx.beginPath();
    ctx.moveTo(towerX + tw / 2, armY);
    ctx.lineTo(towerX + tw / 2 + leftLen, armY - 4 + open * 8);
    ctx.stroke();
    // right arm (from imaginary right rail — simplified single-tower view with mirrored tips)
    ctx.beginPath();
    ctx.moveTo(towerX + tw / 2 + leftLen + gap, armY - 4 + open * 8);
    ctx.lineTo(towerX + tw / 2 + leftLen + gap + rightLen * 0.55, armY + 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // arm tips glow when closing
    if (open < 0.5) {
      ctx.fillStyle = `rgba(61,255,168,${0.35 + (0.5 - open)})`;
      ctx.beginPath();
      ctx.arc(towerX + tw / 2 + leftLen, armY, 6, 0, Math.PI * 2);
      ctx.arc(towerX + tw / 2 + leftLen + gap, armY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // mount
    ctx.fillStyle = "#243044";
    ctx.fillRect(towerX - tw, groundY - 18, tw * 4.5, 18);
    ctx.fillStyle = "rgba(255,107,61,0.25)";
    ctx.fillRect(towerX + tw * 0.5, groundY - 22, tw * 2.2, 6);

    // exhaust particles under booster
    if (opts.exhaust) {
      spawnExhaust(opts.exhaust, boostX, boostY + 55, sim.thrust);
      stepExhaust(opts.exhaust, opts.dt || 1 / 60);
      drawExhaust(ctx, opts.exhaust);
    }

    // booster silhouette
    ctx.save();
    ctx.translate(boostX, boostY);
    ctx.rotate((sim.tilt * Math.PI) / 180);
    const bw = 18, bh = 70;
    // body
    const bodyG = ctx.createLinearGradient(-bw, 0, bw, 0);
    bodyG.addColorStop(0, "#6a7488");
    bodyG.addColorStop(0.5, "#d8dee8");
    bodyG.addColorStop(1, "#5a6478");
    ctx.fillStyle = bodyG;
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 4);
    ctx.fill();
    // catch pins
    ctx.fillStyle = "#ffb020";
    ctx.fillRect(-bw / 2 - 4, -bh / 2 + 8, 5, 6);
    ctx.fillRect(bw / 2 - 1, -bh / 2 + 8, 5, 6);
    // grid fins
    ctx.strokeStyle = "#9ab0c8";
    ctx.lineWidth = 2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      ctx.strokeRect(sx * (bw / 2 + 2), sy * 8 - 6, sx * 10, 12);
    });
    // engine glow
    if (sim.thrust > 0.05) {
      const eg = ctx.createRadialGradient(0, bh / 2 + 8, 0, 0, bh / 2 + 20, 28 * sim.thrust);
      eg.addColorStop(0, `rgba(255,240,180,${0.9 * sim.thrust})`);
      eg.addColorStop(0.4, `rgba(255,120,40,${0.5 * sim.thrust})`);
      eg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(0, bh / 2 + 12, 28 * sim.thrust, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // catch flash
    if (sim.phase.id === "catch") {
      ctx.fillStyle = `rgba(61,255,168,${0.08 + 0.1 * Math.sin(Date.now() / 80)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // ground label
    ctx.fillStyle = "rgba(139,155,184,0.7)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("STARBASE · SIM VIEW · NOT LIVE TELEMETRY", 16, H - 14);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- Mission Control canvas ----------
  const mcExhaust = makeExhaust(48);
  function paintMC(dt) {
    const canvas = $("#mcCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const sim = sampleSim(state.t);
    drawCatchScene(ctx, canvas.width, canvas.height, sim, { exhaust: mcExhaust, dt });
    // HUD
    $("#hudAlt").textContent = `ALT ${sim.alt.toFixed(0)} m`;
    $("#hudVel").textContent = `VEL ${sim.vel.toFixed(1)} m/s ↓`;
    $("#hudOffset").textContent = `OFFSET ${sim.offset.toFixed(1)} m`;
    $("#hudArms").textContent = `ARMS ${(sim.arms * 100).toFixed(0)}% open`;
    $("#phasePill").textContent = sim.phase.label;
    updatePhaseList(sim.phase.id);
  }

  // ---------- Replay canvas ----------
  const rpExhaust = makeExhaust(64);
  function paintReplay(dt) {
    const canvas = $("#replayCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const sim = sampleSim(state.t);
    drawCatchScene(ctx, canvas.width, canvas.height, sim, { exhaust: rpExhaust, dt });
    $("#replayPhase").textContent = sim.phase.label;
    $$("#phaseChips span").forEach((el) => el.classList.toggle("on", el.dataset.ph === sim.phase.id));
    const secs = state.t * DURATION;
    $("#replayTime").textContent = `${secs.toFixed(1)}s / ${DURATION.toFixed(1)}s`;
  }

  // ---------- Tower diagram ----------
  function paintTower(activeId) {
    const canvas = $("#towerCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#081020");
    bg.addColorStop(1, "#101c30");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.42, ground = H * 0.9;
    // tower
    ctx.fillStyle = "#1c2a42";
    ctx.fillRect(cx - 28, H * 0.12, 56, ground - H * 0.12);
    ctx.strokeStyle = "rgba(126,200,255,0.4)";
    ctx.strokeRect(cx - 28, H * 0.12, 56, ground - H * 0.12);
    // chopsticks schematic
    ctx.strokeStyle = "#7ec8ff";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + 28, H * 0.36);
    ctx.lineTo(cx + 160, H * 0.34);
    ctx.moveTo(cx + 28, H * 0.40);
    ctx.lineTo(cx + 160, H * 0.42);
    ctx.stroke();
    // QD arm
    ctx.strokeStyle = "#ff6b3d";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx + 28, H * 0.62);
    ctx.quadraticCurveTo(cx + 90, H * 0.55, cx + 110, H * 0.68);
    ctx.stroke();
    // booster ghost
    ctx.fillStyle = "rgba(200,210,230,0.35)";
    roundRect(ctx, cx + 95, H * 0.22, 36, 150, 6);
    ctx.fill();
    // pins
    ctx.fillStyle = "#ffb020";
    ctx.fillRect(cx + 88, H * 0.28, 8, 10);
    ctx.fillRect(cx + 130, H * 0.28, 8, 10);
    // fins
    ctx.strokeStyle = "#9ab0c8";
    ctx.lineWidth = 3;
    ctx.strokeRect(cx + 78, H * 0.48, 14, 18);
    ctx.strokeRect(cx + 134, H * 0.48, 14, 18);
    // mount
    ctx.fillStyle = "#2a384e";
    ctx.fillRect(cx - 50, ground - 20, 220, 20);

    ctx.fillStyle = "rgba(139,155,184,0.8)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText("PUBLIC CONCEPT SCHEMATIC · FAN DESK", 20, H - 16);

    for (const h of HOTSPOTS) {
      const x = h.x * W, y = h.y * H;
      const on = h.id === activeId;
      ctx.beginPath();
      ctx.arc(x, y, h.r, 0, Math.PI * 2);
      ctx.fillStyle = on ? "rgba(126,200,255,0.35)" : "rgba(126,200,255,0.12)";
      ctx.fill();
      ctx.strokeStyle = on ? "#7ec8ff" : "rgba(126,200,255,0.45)";
      ctx.lineWidth = on ? 3 : 1.5;
      ctx.stroke();
      ctx.fillStyle = on ? "#fff" : "#7ec8ff";
      ctx.font = "bold 11px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(h.title.split(" ")[0], x, y + 4);
      ctx.textAlign = "left";
    }
  }

  function setHotspot(id) {
    state.hotId = id;
    const h = HOTSPOTS.find((x) => x.id === id) || HOTSPOTS[0];
    $("#hotTitle").textContent = h.title;
    $("#hotBody").textContent = h.body;
    $$("#hotList li").forEach((li) => li.classList.toggle("on", li.dataset.id === id));
    paintTower(id);
  }

  // ---------- UI wiring ----------
  function updatePhaseList(id) {
    $$("#phaseList li").forEach((li) => li.classList.toggle("on", li.dataset.p === id));
  }

  function setPlaying(on) {
    state.playing = on;
    const label = on ? "⏸ Pause" : "▶ Play";
    const bp = $("#btnPlay");
    const br = $("#btnReplayPlay");
    if (bp) bp.textContent = label;
    if (br) br.textContent = label;
  }

  function setTab(name) {
    state.activeTab = name;
    $$(".tab").forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".panel").forEach((p) => {
      const on = p.id === "panel-" + name;
      p.classList.toggle("on", on);
      if (on) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
  }

  function syncScrubbers() {
    const v = Math.round(state.t * 1000);
    const a = $("#timeline"), b = $("#replayScrub");
    if (a && document.activeElement !== a) a.value = String(v);
    if (b && document.activeElement !== b) b.value = String(v);
  }

  function updateClock() {
    const secs = state.t * DURATION;
    const m = Math.floor(secs / 60);
    const s = secs - m * 60;
    $("#simClock").textContent = `T+${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
  }

  function tick(ts) {
    const dt = state.lastTs ? Math.min(0.05, (ts - state.lastTs) / 1000) : 0.016;
    state.lastTs = ts;
    if (state.playing) {
      const spd = state.speed * (state.slowMo ? 0.35 : 1);
      state.t += (dt * spd) / DURATION;
      if (state.t >= 1) state.t = 0;
      syncScrubbers();
    }
    updateClock();
    if (state.activeTab === "control" || state.activeTab === "replay") {
      paintMC(dt);
      paintReplay(dt);
    } else if (state.activeTab === "tower") {
      paintTower(state.hotId);
    }
    // decorative SIM countdown (looping fictional T- window)
    const loop = 45 * 60; // 45 min fake window
    const left = loop - ((Date.now() / 1000) % loop);
    const hh = Math.floor(left / 3600);
    const mm = Math.floor((left % 3600) / 60);
    const ss = Math.floor(left % 60);
    const pad = (n) => String(n).padStart(2, "0");
    if ($("#cdH")) { $("#cdH").textContent = pad(hh); $("#cdM").textContent = pad(mm); $("#cdS").textContent = pad(ss); }
    requestAnimationFrame(tick);
  }

  function buildLog() {
    const tb = $("#flightLog tbody");
    if (!tb) return;
    tb.innerHTML = FLIGHT_LOG.map((r) => `<tr>
      <td><span class="badge-ex">${r.id}</span></td>
      <td>${r.label}</td>
      <td>${r.scenario}</td>
      <td>${r.focus}</td>
      <td>${r.outcome}</td>
      <td>${r.notes}</td>
    </tr>`).join("");
  }

  function buildChecklist() {
    const ul = $("#watchList");
    if (!ul) return;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem("sc-watch") || "{}"); } catch (e) {}
    ul.innerHTML = WATCH_ITEMS.map((label, i) => {
      const checked = saved[i] ? "checked" : "";
      return `<li><label><input type="checkbox" data-i="${i}" ${checked}> ${label}</label></li>`;
    }).join("");
    ul.addEventListener("change", (e) => {
      const t = e.target;
      if (t.matches("input[type=checkbox]")) {
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem("sc-watch") || "{}"); } catch (err) {}
        cur[t.dataset.i] = t.checked;
        localStorage.setItem("sc-watch", JSON.stringify(cur));
      }
    });
  }

  function loadNotes() {
    const ta = $("#deskNotes");
    if (!ta) return;
    ta.value = localStorage.getItem("sc-notes") || "";
  }

  function bind() {
    $$(".tab").forEach((btn) => btn.addEventListener("click", () => setTab(btn.dataset.tab)));
    $("#btnPlay")?.addEventListener("click", () => setPlaying(!state.playing));
    $("#btnReplayPlay")?.addEventListener("click", () => setPlaying(!state.playing));
    $("#btnReset")?.addEventListener("click", () => { state.t = 0; syncScrubbers(); });
    $("#speedSel")?.addEventListener("change", (e) => { state.speed = parseFloat(e.target.value) || 1; });
    $("#timeline")?.addEventListener("input", (e) => { state.t = (+e.target.value) / 1000; state.playing = false; setPlaying(false); });
    $("#replayScrub")?.addEventListener("input", (e) => { state.t = (+e.target.value) / 1000; state.playing = false; setPlaying(false); });
    $("#btnSlowMo")?.addEventListener("click", () => {
      state.slowMo = !state.slowMo;
      $("#btnSlowMo").textContent = state.slowMo ? "Slow-mo ON" : "Slow-mo";
    });
    $("#btnWall")?.addEventListener("click", () => {
      state.wall = !state.wall;
      document.body.classList.toggle("wall", state.wall);
    });
    $("#btnHelp")?.addEventListener("click", () => $("#helpDlg")?.showModal());
    $("#btnSaveNotes")?.addEventListener("click", () => {
      localStorage.setItem("sc-notes", $("#deskNotes").value);
      $("#notesStatus").textContent = "Saved locally · " + new Date().toLocaleTimeString();
    });
    $("#btnResetChecks")?.addEventListener("click", () => {
      localStorage.removeItem("sc-watch");
      buildChecklist();
    });

    const hotUl = $("#hotList");
    if (hotUl) {
      hotUl.innerHTML = HOTSPOTS.map((h) => `<li data-id="${h.id}">${h.title}</li>`).join("");
      hotUl.addEventListener("click", (e) => {
        const li = e.target.closest("li");
        if (li) setHotspot(li.dataset.id);
      });
    }
    $("#towerCanvas")?.addEventListener("click", (e) => {
      const canvas = e.target;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      let best = null, bestD = 1e9;
      for (const h of HOTSPOTS) {
        const dx = x - h.x, dy = y - h.y;
        const d = Math.hypot(dx, dy);
        const thr = (h.r + 8) / canvas.width;
        if (d < thr && d < bestD) { best = h; bestD = d; }
      }
      if (best) setHotspot(best.id);
    });

    window.addEventListener("keydown", (e) => {
      if (e.target.matches("textarea, input, select")) return;
      if (e.code === "Space") { e.preventDefault(); setPlaying(!state.playing); }
      else if (e.key === "r" || e.key === "R") { state.t = 0; syncScrubbers(); }
      else if (e.key === "w" || e.key === "W") { $("#btnWall")?.click(); }
      else if (e.key === "?" || e.key === "/") { $("#helpDlg")?.showModal(); }
      else if (e.key >= "1" && e.key <= "5") {
        const tabs = ["control", "replay", "tower", "log", "desk"];
        setTab(tabs[+e.key - 1]);
      }
    });
  }

  function init() {
    initStars();
    buildLog();
    buildChecklist();
    loadNotes();
    bind();
    setHotspot("tower");
    setPlaying(true);
    setTab("control");
    requestAnimationFrame(tick);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
