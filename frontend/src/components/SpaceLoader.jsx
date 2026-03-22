import { useEffect, useRef, useState, useCallback } from "react";

// ─── Timed status messages ────────────────────────────────────────────────────
const TIMED_MESSAGES = [
  { after: 0,  text: "Entering the space",                                                urgent: false },
  { after: 4,  text: "Hmm... this might take a moment",                                   urgent: false },
  { after: 8,  text: "Waking up the server",                                              urgent: false },
  { after: 12, text: "Server might be sleeping. Please wait or try again in ~30 seconds", urgent: true  },
];

// ─── Cold-start toast (design preserved) ─────────────────────────────────────
const TOAST_KF = `
  @keyframes csb-in  {
    from { opacity:0; transform:translateY(-18px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes csb-out {
    from { opacity:1; transform:translateY(0) scale(1); }
    to   { opacity:0; transform:translateY(-12px) scale(0.97); }
  }
  @keyframes csb-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.35; transform:scale(1.8); }
  }
  @keyframes csb-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(232,99,42,0.4); }
    60%     { box-shadow: 0 0 0 8px rgba(232,99,42,0); }
  }
  .csb-in        { animation: csb-in  0.48s cubic-bezier(0.16,1,0.3,1) both; }
  .csb-out       { animation: csb-out 0.28s ease both; }
  .csb-dot       { animation: csb-dot 2.4s ease-in-out infinite; }
  .csb-icon-pulse { animation: csb-pulse 2.8s ease-out infinite; }
`;

function ColdStartBanner({ visible }) {
  const [show,      setShow]      = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [whyHover,  setWhyHover]  = useState(false);
  const [xHover,    setXHover]    = useState(false);

  useEffect(() => {
    if (visible) {
      setDismissed(false);
      setExpanded(false);
      const t = setTimeout(() => setShow(true), 650);
      return () => clearTimeout(t);
    } else {
      setShow(false);
    }
  }, [visible]);

  const active = show && !dismissed;

  return (
    <>
      <style>{TOAST_KF}</style>
      <div
        className={active ? "csb-in" : "csb-out"}
        style={{
          position: "fixed", top: 20, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 410,
          width: "min(520px, calc(100vw - 32px))",
          pointerEvents: active ? "auto" : "none",
        }}
      >
        <div style={{
          position: "absolute", inset: -1, borderRadius: 24, pointerEvents: "none",
          boxShadow: "0 0 0 1px rgba(232,99,42,0.18), 0 0 40px rgba(232,99,42,0.10)",
        }} />
        <div style={{
          position: "relative", borderRadius: 22, overflow: "hidden",
          background: "linear-gradient(150deg,#242018 0%,#1A1814 55%,#1E1B16 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset,0 24px 64px rgba(26,24,20,0.6),0 8px 24px rgba(26,24,20,0.4)",
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent 0%,rgba(232,99,42,0.45) 20%,rgba(240,168,122,1) 50%,rgba(232,99,42,0.45) 80%,transparent 100%)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 20px 20px 22px" }}>
            <div className="csb-icon-pulse" style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              background: "linear-gradient(135deg,rgba(232,99,42,0.2) 0%,rgba(232,99,42,0.08) 100%)",
              border: "1px solid rgba(232,99,42,0.25)",
            }}>🌙</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
                  <span style={{
                    position: "absolute", inset: 0, borderRadius: "50%", background: "#E8632A",
                    animation: "csb-dot 2s ease-out infinite", opacity: 0.4,
                  }} />
                  <span className="csb-dot" style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#E8632A", display: "block" }} />
                </span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(232,99,42,0.85)" }}>
                  Heads up
                </span>
              </div>
              <p style={{ margin: 0, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.4, color: "rgba(245,240,232,0.95)" }}>
                First connection may take ~30 seconds
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 4 }}>
              <button
                onClick={() => setExpanded(e => !e)}
                onMouseEnter={() => setWhyHover(true)}
                onMouseLeave={() => setWhyHover(false)}
                style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "8px 14px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  border: expanded ? "1px solid rgba(232,99,42,0.4)" : whyHover ? "1px solid rgba(232,99,42,0.35)" : "1px solid rgba(232,99,42,0.2)",
                  background: expanded ? "rgba(232,99,42,0.15)" : whyHover ? "rgba(232,99,42,0.14)" : "rgba(232,99,42,0.07)",
                  color: expanded ? "rgba(240,168,122,1)" : "rgba(232,99,42,0.9)",
                }}
              >{expanded ? "Close ↑" : "Why? ↓"}</button>
              <button
                onClick={() => setDismissed(true)}
                onMouseEnter={() => setXHover(true)}
                onMouseLeave={() => setXHover(false)}
                style={{
                  width: 36, height: 36, borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, lineHeight: 1, transition: "all 0.15s ease",
                  border: xHover ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.1)",
                  background: xHover ? "rgba(255,255,255,0.07)" : "transparent",
                  color: xHover ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)",
                }}
              >✕</button>
            </div>
          </div>
          <div style={{ overflow: "hidden", maxHeight: expanded ? 200 : 0, transition: "max-height 0.42s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ margin: "0 20px", height: 1, background: "rgba(255,255,255,0.07)" }} />
            <div style={{ padding: "18px 22px 22px" }}>
              <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "16px 18px" }}>
                <p style={{ margin: 0, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, lineHeight: 1.8, color: "rgba(245,240,232,0.55)" }}>
                  This app runs on Render's{" "}
                  <span style={{ color: "rgba(245,240,232,0.85)", fontWeight: 600 }}>free tier</span>
                  {" "}— the server sleeps after{" "}
                  <span style={{ color: "rgba(245,240,232,0.85)", fontWeight: 600 }}>15 min</span>
                  {" "}of inactivity. The first connection wakes it up, which usually takes{" "}
                  <span style={{ color: "#E8632A", fontWeight: 600 }}>20–30 seconds</span>
                  . Just hang tight, or hit Retry if it times out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Warp tunnel canvas ───────────────────────────────────────────────────────
function WarpCanvas({ mounted, startTime }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const hex2r = (hex, a) => {
      const r = parseInt(hex.slice(1,3),16),
            g = parseInt(hex.slice(3,5),16),
            b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    };

    // ── Stars: 3-D z-buffer particles ──────────────────────────────────────
    const STAR_N = 200;
    const stars  = Array.from({ length: STAR_N }, () => ({
      x:     (Math.random() - 0.5) * 2,
      y:     (Math.random() - 0.5) * 2,
      z:     Math.random(),
      size:  0.6 + Math.random() * 1.6,
      warm:  Math.random() > 0.82,
    }));

    // ── Floating text glyphs: hyphens, dots, dashes ─────────────────────────
    const CHARS    = ["—", "–", "·", "•", "-", "−"];
    const DASH_N   = 70;
    const dashes   = Array.from({ length: DASH_N }, () => ({
      angle:   Math.random() * Math.PI * 2,
      radius:  0.01 + Math.random() * 0.55,
      z:       0.1 + Math.random() * 0.9,
      speed:   0.008 + Math.random() * 0.018,
      char:    CHARS[Math.floor(Math.random() * CHARS.length)],
      opacity: 0.25 + Math.random() * 0.55,
      size:    9 + Math.random() * 14,
      vz:      0.04 + Math.random() * 0.12,
    }));

    // ── Avatar dots ──────────────────────────────────────────────────────────
    const AVATARS = [
      { label: "Alex",   color: "#818CF8", orbitR: 0.20, speed: 0.40, angle: 0.4  },
      { label: "Sam",    color: "#4ADE80", orbitR: 0.15, speed: 0.60, angle: 2.1  },
      { label: "Jordan", color: "#60A5FA", orbitR: 0.18, speed: 0.50, angle: 3.8  },
      { label: "Maya",   color: "#F59E0B", orbitR: 0.23, speed: 0.33, angle: 5.5  },
      { label: "You",    color: "#E8632A", orbitR: 0.11, speed: 0.75, angle: 1.2  },
    ];

    // project 3D → screen.  nz: 0=near, 1=far (we see from z=0 toward z=∞)
    const project = (nx, ny, nz) => {
      const depth = Math.max(0.001, 0.04 + (1 - nz) * 0.96);
      const fov   = 1.15;
      const sc    = fov / depth;
      return { sx: W/2 + nx * sc * W * 0.5, sy: H/2 + ny * sc * H * 0.5, sc };
    };

    const WARP_SPEED = 0.65;   // z-units / second (how fast we fly forward)
    let   prevNow    = performance.now();

    const draw = (now) => {
      const dt      = Math.min((now - prevNow) * 0.001, 0.05);
      prevNow       = now;
      const elapsed = (now - startTime) * 0.001;

      ctx.clearRect(0, 0, W, H);

      // 1 ── Deep space bg ────────────────────────────────────────────────────
      const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H) * 0.75);
      bg.addColorStop(0,   "#141008");
      bg.addColorStop(0.55,"#0D0B07");
      bg.addColorStop(1,   "#070503");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 2 ── Perspective grid ────────────────────────────────────────────────
      // We animate a z-scroll offset so lines stream toward the camera.
      const gridOff = (elapsed * WARP_SPEED * 0.5) % 1;
      const ROWS    = 12;
      const COLS    = 16;
      const GRID_ALPHA = 0.18;

      // Floor and ceiling halves
      for (let half = 0; half < 2; half++) {
        const ySign = half === 0 ? -1 : 1; // -1 ceiling, +1 floor

        // Horizontal rows streaming forward
        for (let i = 0; i < ROWS; i++) {
          const rawZ = 1 - ((i / ROWS + gridOff) % 1);   // 0=near → 1=far; invert so near=fast
          const nz   = rawZ;
          const ny   = ySign * 0.92;
          const { sy } = project(0, ny, nz);
          if (sy < 0 || sy > H) continue;
          const fade  = Math.pow(1 - nz, 0.7) * GRID_ALPHA;
          ctx.strokeStyle = `rgba(232,99,42,${fade})`;
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(0, sy);
          ctx.lineTo(W, sy);
          ctx.stroke();
        }

        // Vertical converging columns
        for (let c = -COLS/2; c <= COLS/2; c++) {
          const nx     = c / (COLS / 2);
          const near   = project(nx, ySign * 0.92, 0.01);
          const fade   = (1 - Math.abs(nx) * 0.7) * GRID_ALPHA * 0.9;
          ctx.strokeStyle = `rgba(232,99,42,${fade})`;
          ctx.lineWidth   = 0.4;
          ctx.beginPath();
          ctx.moveTo(W/2, H/2);        // vanishing point
          ctx.lineTo(near.sx, near.sy);
          ctx.stroke();
        }
      }

      // 3 ── Star streaks ────────────────────────────────────────────────────
      for (let i = 0; i < stars.length; i++) {
        const s   = stars[i];
        const pz  = s.z;
        s.z      -= WARP_SPEED * dt;
        if (s.z <= 0.01) {
          // Respawn far away
          s.z  = 0.92 + Math.random() * 0.08;
          s.x  = (Math.random() - 0.5) * 2;
          s.y  = (Math.random() - 0.5) * 2;
          continue;
        }
        const cur  = project(s.x, s.y, s.z);
        const prev = project(s.x, s.y, pz);
        if (cur.sx < -10 || cur.sx > W+10 || cur.sy < -10 || cur.sy > H+10) continue;

        const nearness  = 1 - s.z;
        const alpha     = Math.min(1, nearness * 1.6) * 0.9;
        const colorStr  = s.warm ? `rgba(255,200,140,${alpha})` : `rgba(200,215,240,${alpha})`;

        ctx.strokeStyle = colorStr;
        ctx.lineWidth   = Math.max(0.3, s.size * cur.sc * 0.12);
        ctx.beginPath();
        ctx.moveTo(prev.sx, prev.sy);
        ctx.lineTo(cur.sx, cur.sy);
        ctx.stroke();
      }

      // 4 ── Floating dashes / hyphens ──────────────────────────────────────
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < dashes.length; i++) {
        const d   = dashes[i];
        d.radius += d.speed * dt;
        d.z      -= d.vz * dt;
        if (d.radius > 0.9 || d.z < 0.05) {
          d.radius = 0.01 + Math.random() * 0.06;
          d.angle  = Math.random() * Math.PI * 2;
          d.z      = 0.55 + Math.random() * 0.35;
          d.char   = CHARS[Math.floor(Math.random() * CHARS.length)];
          continue;
        }
        const nx  = Math.cos(d.angle) * d.radius;
        const ny  = Math.sin(d.angle) * d.radius * 0.55;
        const { sx, sy, sc } = project(nx, ny, d.z);
        if (sx < -50 || sx > W+50 || sy < -50 || sy > H+50) continue;

        const nearness = 1 - d.z;
        const alpha    = d.opacity * Math.min(1, nearness * 2.2);
        if (alpha < 0.03) continue;

        ctx.font      = `${Math.max(7, d.size * sc * 0.45)}px 'DM Mono',monospace`;
        ctx.fillStyle = `rgba(232,99,42,${alpha * 0.75})`;
        ctx.fillText(d.char, sx, sy);
      }

      // 5 ── Portal glow (vanishing point) ───────────────────────────────────
      const pulse  = 0.5 + Math.sin(elapsed * 2.6) * 0.5;
      const gR     = Math.min(W, H) * (0.14 + pulse * 0.05);

      const portal = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, gR);
      portal.addColorStop(0,   `rgba(255,160,80,${0.22 + pulse * 0.12})`);
      portal.addColorStop(0.3, `rgba(232,99,42,${0.10 + pulse * 0.06})`);
      portal.addColorStop(1,    "rgba(232,99,42,0)");
      ctx.fillStyle = portal;
      ctx.fillRect(W/2 - gR, H/2 - gR, gR*2, gR*2);

      // Core flare
      const cr    = 18 + pulse * 10;
      const core  = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, cr);
      core.addColorStop(0,   `rgba(255,230,190,${0.7 + pulse * 0.3})`);
      core.addColorStop(0.45, `rgba(232,99,42,${0.25 + pulse * 0.15})`);
      core.addColorStop(1,    "rgba(232,99,42,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(W/2, H/2, cr, 0, Math.PI * 2);
      ctx.fill();

      // 6 ── Orbiting avatar dots ─────────────────────────────────────────────
      AVATARS.forEach((av) => {
        const ang   = av.angle + elapsed * av.speed;
        const nx    = Math.cos(ang) * av.orbitR;
        const ny    = Math.sin(ang) * av.orbitR * 0.42;
        const nz    = 0.36 + Math.sin(elapsed * 0.28 + av.angle) * 0.07;
        const { sx, sy, sc } = project(nx, ny, nz);
        if (sx < -80 || sx > W+80 || sy < -80 || sy > H+80) return;

        const r = Math.max(2.5, 5.5 * sc * 0.55);

        // Glow halo
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
        halo.addColorStop(0, hex2r(av.color, 0.28));
        halo.addColorStop(1, hex2r(av.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = av.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath();
        ctx.arc(sx - r * 0.28, sy - r * 0.28, r * 0.33, 0, Math.PI * 2);
        ctx.fill();

        // Label
        const lAlpha = 0.5 + Math.sin(elapsed * 1.1 + av.angle) * 0.22;
        const fs     = Math.max(8, 10 * sc * 0.5);
        ctx.font         = `500 ${fs}px 'DM Mono',monospace`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle    = hex2r(av.color, lAlpha);
        ctx.fillText(av.label, sx, sy - r - 4);
      });

      // 7 ── Vignette ────────────────────────────────────────────────────────
      const vig = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.28, W/2, H/2, Math.max(W,H)*0.78);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.76)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [mounted, startTime]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}

// ── Animated warp-speed readout ───────────────────────────────────────────────
function WarpSpeedCounter() {
  const [val, setVal] = useState("9.2c");
  useEffect(() => {
    const vals = ["9.2c","9.4c","9.1c","9.7c","9.3c","9.6c","9.5c","9.8c"];
    let i = 0;
    const tick = () => {
      i = (i + 1) % vals.length;
      setVal(vals[i]);
    };
    let id;
    const schedule = () => { id = setTimeout(() => { tick(); schedule(); }, 700 + Math.random() * 800); };
    schedule();
    return () => clearTimeout(id);
  }, []);
  return <>{val}</>;
}

// ─── Main SpaceLoader ─────────────────────────────────────────────────────────
export default function SpaceLoader({ visible, onExit, onRetry }) {
  const startRef = useRef(performance.now());

  const [mounted,        setMounted]        = useState(false);
  const [fadeIn,         setFadeIn]         = useState(false);
  const [msgIndex,       setMsgIndex]       = useState(0);
  const [textFade,       setTextFade]       = useState(true);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [dots,           setDots]           = useState(0);
  const [retryTick,      setRetryTick]      = useState(0);
  const [exitHover,      setExitHover]      = useState(false);
  const [retryHover,     setRetryHover]     = useState(false);

  // Mount / unmount lifecycle
  useEffect(() => {
    if (visible) {
      startRef.current = performance.now();
      setMsgIndex(0); setTextFade(true); setActionsVisible(false); setDots(0);
      setMounted(true);
      requestAnimationFrame(() => setFadeIn(true));
    } else {
      setFadeIn(false);
      const t = setTimeout(() => { setMounted(false); setMsgIndex(0); setActionsVisible(false); }, 550);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Timed messages
  useEffect(() => {
    if (!mounted) return;
    const timers = [];
    TIMED_MESSAGES.forEach((msg, i) => {
      if (i === 0) return;
      timers.push(setTimeout(() => {
        setTextFade(false);
        setTimeout(() => {
          setMsgIndex(i);
          setTextFade(true);
          if (i === TIMED_MESSAGES.length - 1) setActionsVisible(true);
        }, 200);
      }, msg.after * 1000));
    });
    return () => timers.forEach(clearTimeout);
  }, [mounted, retryTick]);

  // Dot animation
  useEffect(() => {
    if (!mounted) return;
    let d = 0;
    const id = setInterval(() => { d = (d + 1) % 4; setDots(d); }, 420);
    return () => clearInterval(id);
  }, [mounted]);

  const handleRetry = useCallback(() => {
    startRef.current = performance.now();
    setMsgIndex(0); setTextFade(true); setActionsVisible(false); setDots(0);
    setRetryTick(t => t + 1);
    onRetry?.();
  }, [onRetry]);

  if (!mounted) return null;

  const dotStr   = "●".repeat(dots) + "○".repeat(3 - dots);
  const isUrgent = TIMED_MESSAGES[msgIndex].urgent;

  return (
    <>
      <style>{`
        @keyframes warp-fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes warp-fade-out { from { opacity:1 } to { opacity:0 } }
        @keyframes hud-rise {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes hud-rise-top {
          from { opacity:0; transform:translateY(-14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes bar-warp {
          0%   { transform:translateX(-100%) scaleX(0.3); }
          50%  { transform:translateX(35%)   scaleX(0.75); }
          100% { transform:translateX(210%)  scaleX(0.3); }
        }
        @keyframes blink-dot {
          0%,100% { opacity:0.5; }
          50%     { opacity:1; }
        }
        .warp-overlay {
          animation: ${fadeIn ? "warp-fade-in 0.5s ease both" : "warp-fade-out 0.55s ease both"};
        }
        .hud-bottom { animation: hud-rise     0.65s 0.1s  cubic-bezier(0.16,1,0.3,1) both; }
        .hud-top-l  { animation: hud-rise-top 0.65s 0.05s cubic-bezier(0.16,1,0.3,1) both; }
        .hud-top-r  { animation: hud-rise-top 0.65s 0.12s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Cold-start banner */}
      <ColdStartBanner visible={visible} />

      {/* Full-screen warp */}
      <div
        className="warp-overlay"
        style={{ position:"fixed", inset:0, zIndex:250, overflow:"hidden" }}
      >
        <WarpCanvas mounted={mounted} startTime={startRef.current} />

        {/* ── TOP LEFT: destination ── */}
        <div className="hud-top-l" style={{
          position:"absolute", top:28, left:32,
          display:"flex", alignItems:"center", gap:11,
        }}>
          <div style={{
            width:38, height:38, borderRadius:11,
            background:"rgba(232,99,42,0.13)",
            border:"1px solid rgba(232,99,42,0.3)",
            backdropFilter:"blur(10px)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
          }}>🚀</div>
          <div>
            <p style={{ margin:0, fontFamily:"'DM Mono',monospace", fontSize:9,
              letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(232,99,42,0.65)" }}>
              Destination
            </p>
            <p style={{ margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14,
              fontWeight:600, letterSpacing:"-0.01em", color:"rgba(245,240,232,0.9)" }}>
              Your Space
            </p>
          </div>
        </div>

        {/* ── TOP RIGHT: warp speed ── */}
        <div className="hud-top-r" style={{ position:"absolute", top:28, right:32, textAlign:"right" }}>
          <p style={{ margin:0, fontFamily:"'DM Mono',monospace", fontSize:9,
            letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(232,99,42,0.65)" }}>
            Warp speed
          </p>
          <p style={{ margin:0, fontFamily:"'DM Mono',monospace", fontSize:22,
            fontWeight:500, letterSpacing:"-0.02em", color:"rgba(245,240,232,0.88)" }}>
            <WarpSpeedCounter />
          </p>
        </div>

        {/* ── BOTTOM CENTER: status HUD ── */}
        <div className="hud-bottom" style={{
          position:"absolute", bottom:36, left:"50%",
          transform:"translateX(-50%)",
          width:"min(400px, calc(100vw - 40px))",
          display:"flex", flexDirection:"column", gap:10,
        }}>

          {/* Status card */}
          <div style={{
            borderRadius:16,
            background:"rgba(10,8,6,0.7)",
            border:"1px solid rgba(232,99,42,0.25)",
            backdropFilter:"blur(18px)",
            WebkitBackdropFilter:"blur(18px)",
            boxShadow:"0 0 0 1px rgba(255,255,255,0.04) inset,0 12px 48px rgba(0,0,0,0.6)",
            overflow:"hidden",
          }}>
            <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(232,99,42,0.55) 40%,rgba(240,168,122,0.95) 50%,rgba(232,99,42,0.55) 60%,transparent)" }} />
            <div style={{ padding:"14px 18px 16px" }}>
              {/* Message */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
                  <span style={{
                    display:"block", flexShrink:0, width:6, height:6, borderRadius:"50%",
                    background: isUrgent ? "#F59E0B" : "#E8632A",
                    animation:"blink-dot 1.1s ease-in-out infinite",
                    transition:"background 0.4s ease",
                  }} />
                  <span style={{
                    fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:"0.09em",
                    textTransform:"uppercase",
                    color: isUrgent ? "#F59E0B" : "rgba(232,99,42,0.88)",
                    opacity: textFade ? 1 : 0,
                    transition:"opacity 0.2s ease, color 0.3s ease",
                    lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>
                    {TIMED_MESSAGES[msgIndex].text}
                  </span>
                </div>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
                  color:"rgba(245,240,232,0.25)", letterSpacing:"0.08em", flexShrink:0 }}>
                  {dotStr}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ position:"relative", height:2, background:"rgba(255,255,255,0.08)", borderRadius:999, overflow:"hidden" }}>
                <div style={{
                  position:"absolute", inset:0,
                  background:"linear-gradient(90deg,transparent,#E8632A,#F0A87A,#E8632A,transparent)",
                  backgroundSize:"200% 100%", borderRadius:999,
                  animation:"bar-warp 2s cubic-bezier(0.4,0,0.2,1) infinite",
                  transformOrigin:"left",
                }} />
              </div>
            </div>
          </div>

          {/* Exit / Retry — appear after timeout */}
          <div style={{
            overflow:"hidden",
            maxHeight: actionsVisible ? 56 : 0,
            opacity:   actionsVisible ? 1 : 0,
            transition:"max-height 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease",
          }}>
            <div style={{ display:"flex", gap:10, paddingTop:2 }}>
              <button
                onClick={() => onExit?.()}
                onMouseEnter={() => setExitHover(true)}
                onMouseLeave={() => setExitHover(false)}
                style={{
                  flex:1, padding:"11px 0", borderRadius:12, cursor:"pointer",
                  fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:500,
                  letterSpacing:"0.15em", textTransform:"uppercase",
                  transition:"all 0.18s ease",
                  border:      exitHover ? "1px solid rgba(245,240,232,0.22)" : "1px solid rgba(245,240,232,0.1)",
                  background:  exitHover ? "rgba(245,240,232,0.1)" : "rgba(10,8,6,0.55)",
                  backdropFilter:"blur(12px)",
                  color:       exitHover ? "rgba(245,240,232,0.85)" : "rgba(245,240,232,0.4)",
                }}
              >← Exit</button>
              <button
                onClick={handleRetry}
                onMouseEnter={() => setRetryHover(true)}
                onMouseLeave={() => setRetryHover(false)}
                style={{
                  flex:1, padding:"11px 0", borderRadius:12, cursor:"pointer",
                  fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:500,
                  letterSpacing:"0.15em", textTransform:"uppercase",
                  transition:"all 0.18s ease",
                  border:     retryHover ? "1px solid #E8632A" : "1px solid rgba(232,99,42,0.35)",
                  background: retryHover ? "#E8632A" : "rgba(232,99,42,0.1)",
                  backdropFilter:"blur(12px)",
                  color:      retryHover ? "#FAF7F2" : "#E8632A",
                }}
              >↺ Retry</button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}