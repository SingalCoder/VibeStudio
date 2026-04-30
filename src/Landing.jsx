import { useState, useRef, useEffect } from "react";

// ─── CSS ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes floatA {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(40px,-30px) scale(1.06); }
  }
  @keyframes floatB {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(-30px,40px) scale(0.94); }
  }
  @keyframes floatC {
    0%,100% { transform: translate(0,0); }
    33%     { transform: translate(20px,25px); }
    66%     { transform: translate(-20px,-15px); }
  }
  @keyframes glowPulse {
    0%,100% { box-shadow: 0 0 24px rgba(0,180,204,0.45), 0 4px 32px rgba(0,180,204,0.2); }
    50%     { box-shadow: 0 0 52px rgba(0,180,204,0.9), 0 4px 64px rgba(0,180,204,0.45); }
  }
  @keyframes rippleAnim {
    from { transform:scale(0); opacity:0.5; }
    to   { transform:scale(5); opacity:0; }
  }
  @keyframes ping {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:0.45; transform:scale(0.8); }
  }
  @keyframes gradientFlow {
    0%,100% { background-position: 0% 50%; }
    50%     { background-position: 100% 50%; }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes fadeScaleIn {
    from { opacity:0; transform:scale(0.96) translateY(16px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes charWave {
    0%,100% { transform: translateY(0) rotate(0deg) scale(1); }
    33%     { transform: translateY(-11px) rotate(-2.5deg) scale(1.08); }
    66%     { transform: translateY(5px) rotate(1.5deg) scale(0.95); }
  }
  @keyframes heroFlicker {
    0%,87%,100% { opacity:1; }
    88% { opacity:0.72; }
    89% { opacity:1; }
    91% { opacity:0.82; }
    92% { opacity:1; }
  }

  /* Scroll reveal */
  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* Ripple */
  .ripple-btn { position: relative; overflow: hidden; }
  .ripple-effect {
    position: absolute; width: 16px; height: 16px;
    background: rgba(255,255,255,0.35); border-radius: 50%;
    transform: scale(0); animation: rippleAnim 0.55s ease-out forwards;
    margin-left: -8px; margin-top: -8px; pointer-events: none;
  }

  /* Cards */
  .mode-card { transition: transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease; }
  .mode-card:hover { transform: translateY(-8px); }
  .card-active:hover {
    box-shadow: 0 28px 72px rgba(0,180,204,0.32),
                0 0 0 1px rgba(0,180,204,0.6),
                inset 0 1px 0 rgba(0,220,240,0.15) !important;
  }
  .card-inactive:hover {
    box-shadow: 0 16px 48px rgba(0,0,0,0.4) !important;
    background: rgba(255,255,255,0.06) !important;
  }

  /* Steps */
  .step-card { transition: transform 0.28s ease, background 0.28s ease, box-shadow 0.28s ease; }
  .step-card:hover { transform: translateY(-6px); background: rgba(255,255,255,0.07) !important; box-shadow: 0 20px 56px rgba(0,0,0,0.35); }
  .step-detail { max-height: 0; overflow: hidden; opacity: 0; transition: max-height 0.35s ease, opacity 0.3s ease, margin-top 0.3s ease; margin-top: 0; }
  .step-card:hover .step-detail { max-height: 100px; opacity: 1; margin-top: 10px; }

  /* Hero CTA */
  .hero-cta { animation: glowPulse 2.8s ease-in-out infinite; }
  .hero-cta:hover { transform: translateY(-2px) scale(1.03) !important; }
  .hero-cta:active { transform: scale(0.97) !important; }

  /* Nav btn hover */
  .nav-cta:hover { background: rgba(0,180,204,0.22) !important; border-color: rgba(0,180,204,0.55) !important; }

  /* Marquee */
  .marquee-track { display: flex; gap: 12px; animation: marquee 30s linear infinite; width: max-content; }
  .marquee-track:hover { animation-play-state: paused; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,180,204,0.2); border-radius: 4px; }
`;

// ─── DATA ────────────────────────────────────────────────────────────────────
const MODES = [
  {
    id: "2d", title: "2D Games", badge: "Available Now", active: true,
    accent: "#00b4cc", border: "rgba(0,180,204,0.45)", bg: "rgba(0,180,204,0.07)",
    icon: "◈", desc: "Canvas-powered arcade games with real physics, scoring systems, and instant sandboxed preview.",
    examples: ["Flappy Bird", "Snake", "Pinball", "Platformer"],
  },
  {
    id: "3d", title: "3D Games", badge: "Coming Soon", active: false,
    accent: "#a855f7", border: "rgba(168,85,247,0.22)", bg: "rgba(168,85,247,0.05)",
    icon: "◇", desc: "Full 3D environments with WebGL rendering, spatial mechanics, and immersive first-person worlds.",
    examples: ["Racing", "FPS", "Adventure", "Puzzle"],
  },
  {
    id: "multi", title: "Multiplayer", badge: "Coming Soon", active: false,
    accent: "#f59e0b", border: "rgba(245,158,11,0.22)", bg: "rgba(245,158,11,0.05)",
    icon: "◉", desc: "Real-time multiplayer rooms, WebSocket-powered state sync, leaderboards, and party modes.",
    examples: ["Battle Royale", "Co-op", "PvP Arena", "Party Games"],
  },
  {
    id: "npcs", title: "AI NPCs", badge: "Coming Soon", active: false,
    accent: "#10b981", border: "rgba(16,185,129,0.22)", bg: "rgba(16,185,129,0.05)",
    icon: "◎", desc: "Live AI characters that react to player actions — no scripted dialogue trees, ever.",
    examples: ["RPG", "Dialogue Trees", "Strategy", "Simulation"],
  },
];

const STEPS = [
  {
    num: "01", icon: "✦", title: "Describe",
    desc: "Type what you want in plain English — vague or detailed.",
    detail: "Our AI understands game mechanics, visual styles, difficulty levels, and genre conventions from natural language alone.",
  },
  {
    num: "02", icon: "✺", title: "Generate",
    desc: "A full playable game appears in seconds — HTML, CSS & JS.",
    detail: "Every game is self-contained, sandboxed, and immediately playable. No build step, no dependencies, no friction.",
  },
  {
    num: "03", icon: "▶", title: "Play & Edit",
    desc: "Play live in preview. Edit the code or chat to refine.",
    detail: "The built-in editor with syntax highlighting lets you tweak anything — or just ask for changes in plain English.",
  },
];

const STATS = [
  { value: "< 10s", label: "generation time" },
  { value: "4 K", label: "tokens per game" },
  { value: "100%", label: "runs in-browser" },
  { value: "Free", label: "no signup needed" },
];

const PROMPTS = [
  "a flappy bird clone but with fire balls ✦",
  "snake in space with asteroid obstacles ✦",
  "neon pinball with gravity shifts ✦",
  "side-scrolling samurai platformer ✦",
  "brick breaker with explosive power-ups ✦",
  "top-down zombie survival with upgrades ✦",
  "retro space invaders with boss fights ✦",
  "endless runner with parallax jungle ✦",
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function Landing({ onEnterStudio }) {
  const cursorRef         = useRef(null);
  const canvasRef         = useRef(null);
  const animRef           = useRef(null);
  const rafRef            = useRef(null);
  const orb1Ref           = useRef(null);
  const orb2Ref           = useRef(null);
  const orb3Ref           = useRef(null);
  const onEnterStudioRef  = useRef(onEnterStudio);
  useEffect(() => { onEnterStudioRef.current = onEnterStudio; }, [onEnterStudio]);

  const heroParticleCanvasRef = useRef(null);
  const heroParticleAnimRef   = useRef(null);

  const [hoveredCard, setHoveredCard]       = useState(null);
  const [ripples, setRipples]               = useState([]);
  const [heroHovered, setHeroHovered]       = useState(false);
  const [heroHoveredChar, setHeroHoveredChar] = useState(null);

  // Cursor glow + parallax — throttled via RAF
  useEffect(() => {
    const onMove = (e) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (cursorRef.current) {
          cursorRef.current.style.left = e.clientX + "px";
          cursorRef.current.style.top  = e.clientY + "px";
        }
        const rx = e.clientX / window.innerWidth  - 0.5;
        const ry = e.clientY / window.innerHeight - 0.5;
        if (orb1Ref.current) orb1Ref.current.style.transform = `translate(${rx * 44}px,${ry * 32}px)`;
        if (orb2Ref.current) orb2Ref.current.style.transform = `translate(${-rx * 28}px,${-ry * 38}px)`;
        if (orb3Ref.current) orb3Ref.current.style.transform = `translate(${rx * 18}px,${ry * 24}px)`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Hero title particle burst
  useEffect(() => {
    const canvas = heroParticleCanvasRef.current;
    cancelAnimationFrame(heroParticleAnimRef.current);
    if (!canvas || !heroHovered) {
      if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    canvas.width  = canvas.offsetWidth  || 800;
    canvas.height = canvas.offsetHeight || 300;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const SYM  = ["◈","⚔","▶","⬡","✦","✺","♦","◆","⊛","⬢","✵","⊕","⬠","◉","⬟","✧"];
    const COLS = ["#00e5ff","#00b4cc","#4dd9e8","#00ffc8","#a78bfa","#f472b6","#34d399","#60a5fa","#fbbf24","#00d4cc"];
    let particles = [], frame = 0;
    const spawn = () => particles.push({
      x: Math.random() * W, y: H * 0.5 + (Math.random() - 0.3) * H,
      vx: (Math.random() - 0.5) * 3, vy: -(Math.random() * 3.2 + 0.8),
      alpha: 0, maxAlpha: 0.5 + Math.random() * 0.5,
      size: 11 + Math.random() * 20,
      sym: SYM[~~(Math.random() * SYM.length)],
      col: COLS[~~(Math.random() * COLS.length)],
      life: 0, maxLife: 48 + ~~(Math.random() * 68),
      angle: 0, spin: (Math.random() - 0.5) * 0.09,
    });
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      if (frame++ % 2 === 0) spawn();
      particles = particles.filter(p => p.life < p.maxLife);
      particles.forEach(p => {
        p.life++; p.x += p.vx; p.y += p.vy; p.angle += p.spin;
        const fi = 10, fo = 16;
        p.alpha = p.life < fi
          ? (p.life / fi) * p.maxAlpha
          : p.life > p.maxLife - fo
            ? ((p.maxLife - p.life) / fo) * p.maxAlpha
            : p.maxAlpha;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = p.col; ctx.shadowColor = p.col; ctx.shadowBlur = 20;
        ctx.fillText(p.sym, 0, 0);
        ctx.restore();
      });
      heroParticleAnimRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(heroParticleAnimRef.current);
  }, [heroHovered]);

  // Mini breakout canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = canvas.offsetWidth  || 400;
    canvas.height = canvas.offsetHeight || 220;

    const W = canvas.width, H = canvas.height;

    const cols = 11, rows = 5;
    const gap  = 3;
    const bw   = (W - (cols + 1) * gap) / cols;
    const bh   = 7;
    const blockAreaTop = 10;
    const blockAreaH   = rows * (bh + gap);
    const playAreaTop  = blockAreaTop + blockAreaH + 28;
    const COLORS = ["#00b4cc","#00e5ff","#4dd9e8","#00c8b4","#0090a8","#26d0e0","#00aabb","#00d4cc","#00c8e0","#0080a0","#00b0c8"];

    const makeBlocks = () => Array.from({ length: cols * rows }, (_, k) => {
      const c = k % cols, r = Math.floor(k / cols);
      return {
        x: gap + c * (bw + gap), y: blockAreaTop + r * (bh + gap),
        w: bw, h: bh,
        color: COLORS[(r * 3 + c) % COLORS.length],
        alive: true,
      };
    });

    const PW = Math.round(W * 0.22);
    const PSPEED = 5;

    const makeState = () => ({
      blocks: makeBlocks(),
      ball: { x: W / 2, y: H - 36, vx: 2.6, vy: -3.2, r: 5 },
      paddle: { x: W / 2 - PW / 2, y: H - 14, w: PW, h: 7 },
      score: 0,
    });

    let state   = makeState();
    let playing = false;
    let gameOver = false;
    const keys  = { left: false, right: false };

    const drawBlocks = () => {
      state.blocks.forEach(b => {
        if (!b.alive) return;
        const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
        g.addColorStop(0, b.color + "cc"); g.addColorStop(1, b.color + "44");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 2); ctx.fill();
      });
    };

    const drawPlayScreen = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(0,180,204,0.04)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 18) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 18) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      drawBlocks();
      ctx.fillStyle = "rgba(0,0,0,0.52)";
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2 + 10;
      const pr = 22;
      ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,180,204,0.18)"; ctx.fill();
      ctx.strokeStyle = "#00b4cc"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 14;
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 10); ctx.lineTo(cx + 13, cy); ctx.lineTo(cx - 7, cy + 10);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,180,204,0.3)";
      ctx.font = `${Math.round(W * 0.024)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "center";
      ctx.fillText("← → or mouse to control", cx, cy + pr + 14);
      ctx.textAlign = "left";
    };

    const drawGameOver = () => {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.shadowColor = "#00b4cc"; ctx.shadowBlur = 16;
      ctx.fillStyle = "#00e5ff";
      ctx.font = `bold ${Math.round(W * 0.045)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 12);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,180,204,0.7)";
      ctx.font = `${Math.round(W * 0.032)}px 'JetBrains Mono', monospace`;
      ctx.fillText(`Score: ${state.score}`, W / 2, H / 2 + 10);
      ctx.fillStyle = "rgba(0,180,204,0.4)";
      ctx.font = `${Math.round(W * 0.027)}px 'JetBrains Mono', monospace`;
      ctx.fillText("click to restart", W / 2, H / 2 + 28);
      ctx.textAlign = "left";
    };

    const tick = () => {
      if (!playing) return;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(0,180,204,0.04)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 18) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 18) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      drawBlocks();

      if (keys.left)  state.paddle.x = Math.max(0, state.paddle.x - PSPEED);
      if (keys.right) state.paddle.x = Math.min(W - state.paddle.w, state.paddle.x + PSPEED);

      const pg = ctx.createLinearGradient(state.paddle.x, 0, state.paddle.x + state.paddle.w, 0);
      pg.addColorStop(0, "#00b4cc"); pg.addColorStop(1, "#00e5ff");
      ctx.fillStyle = pg; ctx.shadowColor = "#00b4cc"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.roundRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h, 3); ctx.fill(); ctx.shadowBlur = 0;

      const bg2 = ctx.createRadialGradient(state.ball.x, state.ball.y, 0, state.ball.x, state.ball.y, state.ball.r * 3);
      bg2.addColorStop(0, "rgba(0,229,255,0.7)"); bg2.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.r * 3, 0, Math.PI * 2); ctx.fillStyle = bg2; ctx.fill();
      ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2); ctx.fillStyle = "#00e5ff"; ctx.fill(); ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(0,220,240,0.7)";
      ctx.font = `bold ${Math.round(W * 0.038)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`${state.score}`, 8, H - 6);
      ctx.textAlign = "left";

      state.ball.x += state.ball.vx; state.ball.y += state.ball.vy;
      if (state.ball.x - state.ball.r < 0 || state.ball.x + state.ball.r > W) state.ball.vx *= -1;
      if (state.ball.y - state.ball.r < 0) state.ball.vy *= -1;

      if (state.ball.y + state.ball.r >= H) {
        playing = false; gameOver = true;
        drawGameOver(); return;
      }

      if (state.ball.y + state.ball.r >= state.paddle.y &&
          state.ball.y + state.ball.r <= state.paddle.y + state.paddle.h &&
          state.ball.x >= state.paddle.x && state.ball.x <= state.paddle.x + state.paddle.w) {
        const hit = (state.ball.x - (state.paddle.x + state.paddle.w / 2)) / (state.paddle.w / 2);
        state.ball.vx = hit * 4;
        state.ball.vy = -Math.abs(state.ball.vy);
      }

      state.blocks.forEach(b => {
        if (!b.alive) return;
        if (state.ball.x + state.ball.r > b.x && state.ball.x - state.ball.r < b.x + b.w &&
            state.ball.y + state.ball.r > b.y && state.ball.y - state.ball.r < b.y + b.h) {
          b.alive = false; state.ball.vy *= -1; state.score++;
        }
      });
      if (state.blocks.every(b => !b.alive)) {
        state.blocks = makeBlocks(); state.score += 10;
        state.ball.vx *= 1.05; state.ball.vy *= 1.05;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    const onMouseMove = (e) => {
      state.paddle.x = Math.max(0, Math.min(e.offsetX - state.paddle.w / 2, W - state.paddle.w));
    };

    const onClick = (e) => {
      if (gameOver) {
        e.stopPropagation();
        gameOver = false; playing = true;
        state = makeState();
        cancelAnimationFrame(animRef.current);
        tick();
      } else if (!playing) {
        playing = true;
        cancelAnimationFrame(animRef.current);
        tick();
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft")  { keys.left  = true; if (playing) e.preventDefault(); }
      if (e.key === "ArrowRight") { keys.right = true; if (playing) e.preventDefault(); }
    };
    const onKeyUp = (e) => {
      if (e.key === "ArrowLeft")  keys.left  = false;
      if (e.key === "ArrowRight") keys.right = false;
    };

    canvas.style.cursor = "pointer";
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);
    drawPlayScreen();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
    };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 600);
  };

  const doubled = [...PROMPTS, ...PROMPTS];

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* Cursor glow */}
      <div ref={cursorRef} style={s.cursor} />

      {/* Background */}
      <div style={s.bg} />
      <div ref={orb1Ref} style={s.orb1} />
      <div ref={orb2Ref} style={s.orb2} />
      <div ref={orb3Ref} style={s.orb3} />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navIcon}>◈</span>
          <div>
            <span style={s.navName}>VibeStudio</span>
            <span style={s.navTagline}>Build Games With Words</span>
          </div>
        </div>
        <button className="ripple-btn nav-cta" style={s.navBtn} onClick={(e) => { addRipple(e); onEnterStudio(); }}>
          {ripples.map(r => <span key={r.id} className="ripple-effect" style={{ left: r.x, top: r.y }} />)}
          Open Studio →
        </button>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div className="reveal" style={s.heroBadge}>
          <span style={s.badgeDot} />
          <span style={s.badgeText}>Powered by Gemini 2.0 Flash · Groq · Llama 3.3</span>
        </div>

        <div
          className="reveal"
          style={{ position: "relative", transitionDelay: "0.07s", display: "inline-block" }}
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={(e) => {
            setHeroHovered(false);
            setHeroHoveredChar(null);
            const el = e.currentTarget;
            el.style.transition = "transform 0.7s cubic-bezier(0.23,1,0.32,1)";
            el.style.transform = "";
          }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const cx = (e.clientX - r.left) / r.width  - 0.5;
            const cy = (e.clientY - r.top)  / r.height - 0.5;
            e.currentTarget.style.transition = "transform 0.08s linear";
            e.currentTarget.style.transform  = `perspective(800px) rotateX(${-cy * 14}deg) rotateY(${cx * 14}deg) scale(1.04)`;
          }}
        >
          <canvas ref={heroParticleCanvasRef} style={{
            position: "absolute", left: -80, top: -60,
            width: "calc(100% + 160px)", height: "calc(100% + 120px)",
            pointerEvents: "none", zIndex: 0,
            opacity: heroHovered ? 1 : 0, transition: "opacity 0.35s ease",
          }} />
          <h1 style={{ ...s.heroTitle, position: "relative", zIndex: 1 }}>
            {"Build Any Game.".split("").map((ch, i) => (
              <span key={i}
                onMouseEnter={() => setHeroHoveredChar(i)}
                onMouseLeave={() => setHeroHoveredChar(null)}
                style={{
                  display: "inline-block", cursor: "default",
                  animation: heroHoveredChar === i ? "charWave 0.55s ease-in-out infinite" : "none",
                  textShadow: heroHoveredChar === i
                    ? "-2px 0 rgba(255,20,80,0.6), 2px 0 rgba(0,220,255,0.6), 0 0 30px rgba(0,200,255,0.5)"
                    : "none",
                  filter: heroHoveredChar === i ? "drop-shadow(0 0 10px rgba(0,228,255,0.7))" : "none",
                  transition: "text-shadow 0.2s ease, filter 0.2s ease",
                }}>{ch === " " ? " " : ch}</span>
            ))}
            <br />
            <span style={s.heroAccent}>
              {"Just Describe It.".split("").map((ch, i) => {
                const gi = i + 16;
                return (
                  <span key={i}
                    onMouseEnter={() => setHeroHoveredChar(gi)}
                    onMouseLeave={() => setHeroHoveredChar(null)}
                    style={{
                      display: "inline-block", cursor: "default",
                      animation: heroHoveredChar === gi ? "charWave 0.55s ease-in-out infinite" : "none",
                      textShadow: heroHoveredChar === gi
                        ? "-2px 0 rgba(255,20,80,0.45), 2px 0 rgba(0,228,255,0.45), 0 0 40px rgba(0,228,255,0.85)"
                        : "none",
                      filter: heroHoveredChar === gi ? "drop-shadow(0 0 12px rgba(0,228,255,0.8))" : "none",
                      transition: "text-shadow 0.2s ease, filter 0.2s ease",
                    }}>{ch === " " ? " " : ch}</span>
                );
              })}
            </span>
          </h1>
        </div>

        <p className="reveal" style={{ ...s.heroSub, transitionDelay: "0.14s" }}>
          VibeStudio turns plain words into fully playable browser games instantly.<br />
          No code required. No engine to learn. No setup.
        </p>

        <button
          className="ripple-btn hero-cta reveal"
          style={{ ...s.heroCta, transitionDelay: "0.21s" }}
          onClick={(e) => { addRipple(e); onEnterStudio(); }}
        >
          {ripples.map(r => <span key={r.id} className="ripple-effect" style={{ left: r.x, top: r.y }} />)}
          Start Building →
        </button>

        <p className="reveal" style={{ ...s.heroHint, transitionDelay: "0.28s" }}>
          Free · No signup · Runs entirely in your browser
        </p>

        {/* Stats strip */}
        <div className="reveal" style={{ ...s.statsRow, transitionDelay: "0.35s" }}>
          {STATS.map((st, i) => (
            <div key={i} style={s.statItem}>
              <span style={s.statValue}>{st.value}</span>
              <span style={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROMPT MARQUEE ─────────────────────────────────────────────── */}
      <div style={s.marqueeWrap}>
        <span style={s.marqueeFade} />
        <span style={{ ...s.marqueeFade, left: "auto", right: 0, transform: "scaleX(-1)" }} />
        <div style={{ overflow: "hidden" }}>
          <div className="marquee-track">
            {doubled.map((p, i) => (
              <span key={i} style={s.marqueeItem}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── GAME MODES ──────────────────────────────────────────────────── */}
      <section style={s.section}>
        <div className="reveal" style={s.sectionHead}>
          <span style={s.eyebrow}>Game Modes</span>
          <h2 style={s.secTitle}>Choose Your Dimension</h2>
          <p style={s.secSub}>Four worlds to build in. One is ready right now.</p>
        </div>

        <div style={s.grid}>
          {MODES.map((m, i) => (
            <div
              key={m.id}
              className={`reveal mode-card ${m.active ? "card-active" : "card-inactive"}`}
              style={{
                ...s.card,
                background: m.bg,
                border: `1px solid ${m.border}`,
                cursor: "default",
                transitionDelay: `${i * 0.07}s`,
                boxShadow: m.active
                  ? `0 0 0 1px ${m.border}, 0 8px 40px rgba(0,180,204,0.1), inset 0 1px 0 rgba(0,220,240,0.07)`
                  : "0 4px 24px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={() => setHoveredCard(m.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 28, color: m.active ? m.accent : "rgba(255,255,255,0.15)", lineHeight: 1 }}>{m.icon}</span>
                <span style={{
                  ...s.pill,
                  color: m.active ? m.accent : "rgba(255,255,255,0.2)",
                  background: m.active ? `${m.accent}1a` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${m.active ? m.border : "rgba(255,255,255,0.07)"}`,
                  animation: m.active ? "ping 2.5s ease-in-out infinite" : "none",
                }}>{m.badge}</span>
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: m.active ? "#e0f7fa" : "rgba(255,255,255,0.25)" }}>{m.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: m.active ? "rgba(180,235,245,0.6)" : "rgba(255,255,255,0.16)" }}>{m.desc}</p>

              {m.id === "2d"
                ? <canvas ref={canvasRef} style={s.miniCanvas} />
                : <div style={{ height: 95, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 40, opacity: 0.07 }}>{m.icon}</span>
                  </div>
              }

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {m.examples.map(ex => (
                  <span key={ex} style={{
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                    padding: "4px 10px", borderRadius: 20, border: "1px solid",
                    color: m.active ? m.accent : "rgba(255,255,255,0.18)",
                    borderColor: m.active ? m.border : "rgba(255,255,255,0.06)",
                    background: m.active ? `${m.accent}10` : "rgba(255,255,255,0.02)",
                  }}>{ex}</span>
                ))}
              </div>

              {m.active && (
                <div
                  onClick={(e) => { e.stopPropagation(); onEnterStudio(); }}
                  style={{ fontSize: 13, fontWeight: 600, color: "#00b4cc", display: "flex", alignItems: "center", marginTop: 4, cursor: "pointer", userSelect: "none", width: "fit-content" }}
                >
                  Open Studio →
                </div>
              )}
              {!m.active && hoveredCard === m.id && (
                <div style={s.tooltip}>Coming Soon</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section style={{ ...s.section, paddingTop: 40 }}>
        <div className="reveal" style={s.sectionHead}>
          <span style={s.eyebrow}>Process</span>
          <h2 style={s.secTitle}>How It Works</h2>
          <p style={s.secSub}>From idea to playable game in under 10 seconds.</p>
        </div>

        <div style={s.stepsRow}>
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ flex: 1, display: "flex", alignItems: "stretch", gap: 0 }}>
              <div className="reveal step-card" style={{ ...s.stepCard, transitionDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#00b4cc", opacity: 0.55, letterSpacing: "1px" }}>{step.num}</div>
                <div style={{ fontSize: 28, color: "#00b4cc", lineHeight: 1 }}>{step.icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: "#e0f7fa", letterSpacing: "-0.4px" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(160,220,230,0.55)", lineHeight: 1.65 }}>{step.desc}</p>
                <p className="step-detail" style={{ fontSize: 12, color: "rgba(140,210,225,0.45)", lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>{step.detail}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div style={s.stepGap}>
                  <span style={s.stepArrow}>→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────── */}
      <section style={{ ...s.section, paddingTop: 24, paddingBottom: 96 }}>
        <div className="reveal" style={s.ctaPanel}>
          <div style={s.ctaGlow} />
          <span style={{ ...s.eyebrow, marginBottom: 20 }}>Ready?</span>
          <h2 style={{ fontSize: "clamp(28px,4vw,50px)", fontWeight: 800, color: "#e0f7fa", letterSpacing: "-1.5px", marginBottom: 16, lineHeight: 1.1 }}>
            Build Your First Game<br />
            <span style={s.heroAccent}>Right Now.</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(160,220,235,0.5)", lineHeight: 1.7, maxWidth: 420, marginBottom: 36 }}>
            No account. No credit card. No setup.<br />Just open the studio and start describing.
          </p>
          <button
            className="ripple-btn hero-cta"
            style={{ ...s.heroCta, fontSize: 15, padding: "14px 44px" }}
            onClick={(e) => { addRipple(e); onEnterStudio(); }}
          >
            {ripples.map(r => <span key={r.id} className="ripple-effect" style={{ left: r.x, top: r.y }} />)}
            Open VibeStudio →
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ ...s.footer, justifyContent: "center" }}>
        <span style={s.footerLogo}>◈ VibeStudio</span>
      </footer>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  root: { minHeight: "100vh", width: "100vw", background: "#020d10", fontFamily: "'DM Sans', sans-serif", color: "#e0f7fa", overflowX: "hidden", position: "relative" },
  cursor: { position: "fixed", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,180,204,0.12) 0%, transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 0, transition: "left 0.06s linear, top 0.06s linear", mixBlendMode: "screen" },
  bg:   { position: "fixed", inset: 0, zIndex: 0, background: "linear-gradient(135deg,#020d10 0%,#041520 45%,#030f1a 75%,#020a0d 100%)" },
  orb1: { position: "fixed", top: "-160px", left: "-120px", width: "620px", height: "620px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,180,204,0.18) 0%,transparent 68%)", zIndex: 0, pointerEvents: "none", animation: "floatA 9s ease-in-out infinite", transition: "transform 0.12s ease" },
  orb2: { position: "fixed", bottom: "-180px", right: "-140px", width: "720px", height: "720px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,150,180,0.12) 0%,transparent 68%)", zIndex: 0, pointerEvents: "none", animation: "floatB 12s ease-in-out infinite", transition: "transform 0.12s ease" },
  orb3: { position: "fixed", top: "35%", left: "40%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,220,0.06) 0%,transparent 68%)", zIndex: 0, pointerEvents: "none", animation: "floatC 16s ease-in-out infinite", transition: "transform 0.12s ease" },

  nav: { position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 60, background: "rgba(2,13,16,0.8)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(0,180,204,0.1)" },
  navBrand: { display: "flex", alignItems: "center", gap: 10 },
  navIcon:  { fontSize: 20, color: "#00b4cc" },
  navName:  { fontSize: 16, fontWeight: 700, color: "#e0f7fa", letterSpacing: "-0.4px", display: "block", lineHeight: 1.2 },
  navTagline: { fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(0,180,204,0.4)", letterSpacing: "0.3px", display: "block" },
  navBtn: { fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", background: "rgba(0,180,204,0.1)", border: "1px solid rgba(0,180,204,0.28)", color: "#00d4ee", padding: "8px 20px", borderRadius: 8, cursor: "pointer", transition: "all 0.2s" },

  hero: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "110px 24px 60px" },
  heroBadge: { display: "flex", alignItems: "center", gap: 8, background: "rgba(0,180,204,0.08)", border: "1px solid rgba(0,180,204,0.2)", borderRadius: 30, padding: "6px 16px", marginBottom: 36 },
  badgeDot:  { width: 7, height: 7, borderRadius: "50%", background: "#00c8a0", display: "inline-block", animation: "ping 2s ease-in-out infinite" },
  badgeText: { fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "#00b4cc", letterSpacing: "0.4px" },
  heroTitle: { fontSize: "clamp(44px,7vw,86px)", fontWeight: 800, lineHeight: 1.06, marginBottom: 26, color: "#e0f7fa", letterSpacing: "-2.5px" },
  heroAccent: { background: "linear-gradient(135deg,#00b4cc,#00e5ff,#4dd9e8,#00b4cc)", backgroundSize: "300% 300%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "gradientFlow 4s ease infinite" },
  heroSub:   { fontSize: 17, lineHeight: 1.75, color: "rgba(180,230,240,0.55)", maxWidth: 500, marginBottom: 40 },
  heroCta:   { fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", background: "linear-gradient(135deg,#00b4cc,#0090a8)", border: "none", color: "#fff", padding: "15px 42px", borderRadius: 12, cursor: "pointer", marginBottom: 16, letterSpacing: "-0.2px" },
  heroHint:  { fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "rgba(0,180,204,0.28)", letterSpacing: "0.5px", marginBottom: 48 },

  statsRow:  { display: "flex", gap: 0, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,180,204,0.1)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)" },
  statItem:  { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 24px", borderRight: "1px solid rgba(0,180,204,0.08)" },
  statValue: { fontSize: 22, fontWeight: 800, color: "#00b4cc", letterSpacing: "-0.5px", lineHeight: 1 },
  statLabel: { fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(0,180,204,0.35)", marginTop: 5, letterSpacing: "0.3px" },

  marqueeWrap: { position: "relative", zIndex: 1, padding: "28px 0", borderTop: "1px solid rgba(0,180,204,0.06)", borderBottom: "1px solid rgba(0,180,204,0.06)", background: "rgba(0,180,204,0.025)", overflow: "hidden" },
  marqueeFade: { position: "absolute", top: 0, left: 0, width: 120, height: "100%", background: "linear-gradient(90deg,#020d10,transparent)", zIndex: 2, pointerEvents: "none" },
  marqueeItem: { fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "rgba(0,180,204,0.35)", padding: "6px 20px", borderRadius: 20, border: "1px solid rgba(0,180,204,0.1)", background: "rgba(0,180,204,0.04)", whiteSpace: "nowrap", flexShrink: 0 },

  section:    { position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "80px 24px" },
  sectionHead:{ textAlign: "center", marginBottom: 52 },
  eyebrow:    { fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "#00b4cc", letterSpacing: "2.5px", textTransform: "uppercase", display: "block", marginBottom: 14 },
  secTitle:   { fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: "#e0f7fa", letterSpacing: "-1px", marginBottom: 12 },
  secSub:     { fontSize: 15, color: "rgba(160,220,235,0.45)", lineHeight: 1.65 },

  grid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 },
  card: { borderRadius: 18, padding: "26px 24px", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" },
  pill: { fontSize: 10, fontFamily: "'JetBrains Mono',monospace", padding: "4px 10px", borderRadius: 20, letterSpacing: "0.5px" },
  miniCanvas: { width: "100%", height: 220, borderRadius: 8, background: "rgba(0,0,0,0.3)" },
  tooltip: { position: "absolute", bottom: 14, right: 14, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", background: "rgba(0,0,0,0.65)", color: "rgba(255,255,255,0.4)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" },

  stepsRow: { display: "flex", alignItems: "flex-start" },
  stepCard: { flex: 1, borderRadius: 16, padding: "30px 26px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,180,204,0.09)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: 10 },
  stepGap:  { width: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, paddingTop: 60 },
  stepArrow:{ fontSize: 18, color: "rgba(0,180,204,0.25)" },

  ctaPanel: { position: "relative", borderRadius: 24, padding: "64px 48px", background: "rgba(0,180,204,0.05)", border: "1px solid rgba(0,180,204,0.15)", backdropFilter: "blur(20px)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" },
  ctaGlow:  { position: "absolute", top: "-60%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "200%", background: "radial-gradient(ellipse,rgba(0,180,204,0.08) 0%,transparent 70%)", pointerEvents: "none" },

  footer:     { position: "relative", zIndex: 1, borderTop: "1px solid rgba(0,180,204,0.07)", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 10 },
  footerLogo: { fontSize: 14, fontWeight: 700, color: "rgba(0,180,204,0.5)", letterSpacing: "-0.3px" },
};
