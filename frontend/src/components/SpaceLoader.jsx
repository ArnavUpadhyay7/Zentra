import { useEffect, useRef, useState } from "react";

const LOADER_DOTS = [
  { id: 0, color: "#818CF8", label: "Alex",   orbitR: 78, speed: 0.52, angle: 0.4,  size: 10 },
  { id: 1, color: "#4ADE80", label: "Sam",    orbitR: 58, speed: 0.74, angle: 2.2,  size: 8  },
  { id: 2, color: "#E8632A", label: "You",    orbitR: 70, speed: 0.46, angle: 3.9,  size: 11 },
  { id: 3, color: "#60A5FA", label: "Jordan", orbitR: 63, speed: 0.61, angle: 5.1,  size: 9  },
  { id: 4, color: "#F59E0B", label: "Maya",   orbitR: 82, speed: 0.38, angle: 1.2,  size: 7  },
];

const TIMED_MESSAGES = [
  { after: 0,  text: "Connecting to the space",                                           urgent: false },
  { after: 4,  text: "Hmm... this might take a moment",                                   urgent: false },
  { after: 8,  text: "Waking up the server",                                              urgent: false },
  { after: 12, text: "Server might be sleeping. Please wait or try again in ~30 seconds", urgent: true  },
];

export default function SpaceLoader({ visible, onExit, onRetry }) {
  const canvasRef     = useRef(null);
  const rafRef        = useRef(null);
  const startRef      = useRef(performance.now());
  const retryCountRef = useRef(0);

  const [mounted,        setMounted]        = useState(false);
  const [msgIndex,       setMsgIndex]       = useState(0);
  const [dots,           setDots]           = useState(0);
  const [fadeIn,         setFadeIn]         = useState(false);
  const [textFade,       setTextFade]       = useState(true);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [exitHover,      setExitHover]      = useState(false);
  const [retryHover,     setRetryHover]     = useState(false);

  useEffect(() => {
    if (visible) {
      startRef.current = performance.now();
      setMsgIndex(0);
      setTextFade(true);
      setActionsVisible(false);
      setMounted(true);
      requestAnimationFrame(() => setFadeIn(true));
    } else {
      setFadeIn(false);
      const t = setTimeout(() => {
        setMounted(false);
        setMsgIndex(0);
        setActionsVisible(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // retryCountRef.current is used as a dependency to re-run timers on retry
  // without needing visible to toggle, so we read it via a stable ref
  const [retryTick, setRetryTick] = useState(0);

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
          if (i === TIMED_MESSAGES.length - 1) {
            setActionsVisible(true);
          }
        }, 180);
      }, msg.after * 1000));
    });
    return () => timers.forEach(clearTimeout);
  }, [mounted, retryTick]);

  useEffect(() => {
    if (!mounted) return;
    let d = 0;
    const id = setInterval(() => { d = (d + 1) % 4; setDots(d); }, 420);
    return () => clearInterval(id);
  }, [mounted]);

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
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const lerp  = (a, b, t) => a + (b - a) * t;
    const ease  = (t) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    const hex2r = (hex, a) => {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    };

    const CX = () => W / 2;
    const CY = () => H / 2;

    const loop = (now) => {
      const elapsed = (now - startRef.current) * 0.001;
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(26,24,20,0.045)";
      ctx.lineWidth = 0.5;
      const step = 28;
      for (let x = step; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = step; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const scanY = ((elapsed * 0.4) % 1) * H;
      const sg = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      sg.addColorStop(0,   "rgba(232,99,42,0)");
      sg.addColorStop(0.5, "rgba(232,99,42,0.04)");
      sg.addColorStop(1,   "rgba(232,99,42,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(0, scanY - 30, W, 60);

      [55, 75, 95].forEach((r, ri) => {
        const scaledR = r * (Math.min(W, H) / 220);
        ctx.strokeStyle = `rgba(232,226,218,${0.35 - ri * 0.08})`;
        ctx.lineWidth = 0.6;
        ctx.setLineDash([3, 7]);
        ctx.beginPath();
        ctx.ellipse(CX(), CY(), scaledR, scaledR * 0.44, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      const dotPositions = LOADER_DOTS.map((d) => {
        const cycle    = (elapsed % 4) / 4;
        const progress = cycle < 0.5 ? ease(cycle * 2) : ease((1 - cycle) * 2);
        const scale    = Math.min(W, H) / 220;
        const orbitX = CX() + Math.cos(elapsed * d.speed + d.angle) * d.orbitR * scale;
        const orbitY = CY() + Math.sin(elapsed * d.speed + d.angle) * d.orbitR * scale * 0.44;
        return { x: lerp(orbitX, CX(), progress * 0.72), y: lerp(orbitY, CY(), progress * 0.72), progress, color: d.color, size: d.size };
      });

      dotPositions.forEach((a, i) => {
        dotPositions.forEach((b, j) => {
          if (j <= i) return;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 80) {
            const op = (1 - dist / 80) * Math.min(a.progress, b.progress) * 0.22;
            ctx.strokeStyle = hex2r(a.color, op);
            ctx.lineWidth = 0.7;
            ctx.setLineDash([2, 5]);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      });

      dotPositions.forEach(({ x, y, progress, color }) => {
        ctx.strokeStyle = hex2r(color, progress * 0.35);
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 6]);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(CX(), CY()); ctx.stroke();
        ctx.setLineDash([]);
      });

      dotPositions.forEach(({ x, y, progress, color, size }) => {
        const s  = (size / 2) * (1 + progress * 0.18);
        const op = 0.65 + progress * 0.35;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, s * 2.8);
        grd.addColorStop(0, hex2r(color, 0.22 * op));
        grd.addColorStop(1, hex2r(color, 0));
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(x, y, s * 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = op;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.3, s * 0.38, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      const pulse = 0.5 + Math.sin(elapsed * 3.2) * 0.5;
      const cr    = 18 + pulse * 2.5;

      [1.8, 2.5, 3.4].forEach((mult, ri) => {
        ctx.strokeStyle = hex2r("#E8632A", (1 - ri / 3) * pulse * 0.18);
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(CX(), CY(), cr * mult, 0, Math.PI * 2); ctx.stroke();
      });

      const cg = ctx.createRadialGradient(CX(), CY(), 0, CX(), CY(), cr);
      cg.addColorStop(0, "#FDF1EB");
      cg.addColorStop(1, "#F3EFE8");
      ctx.fillStyle = cg;
      ctx.strokeStyle = "#E8632A";
      ctx.lineWidth = 1.5;
      const rx = 6;
      const x0 = CX() - cr, y0 = CY() - cr;
      ctx.beginPath();
      ctx.moveTo(x0 + rx, y0);
      ctx.lineTo(x0 + cr*2 - rx, y0);
      ctx.quadraticCurveTo(x0 + cr*2, y0, x0 + cr*2, y0 + rx);
      ctx.lineTo(x0 + cr*2, y0 + cr*2 - rx);
      ctx.quadraticCurveTo(x0 + cr*2, y0 + cr*2, x0 + cr*2 - rx, y0 + cr*2);
      ctx.lineTo(x0 + rx, y0 + cr*2);
      ctx.quadraticCurveTo(x0, y0 + cr*2, x0, y0 + cr*2 - rx);
      ctx.lineTo(x0, y0 + rx);
      ctx.quadraticCurveTo(x0, y0, x0 + rx, y0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#E8632A";
      ctx.lineWidth = 1.1;
      const ic = 5.5;
      const ix = CX() - ic * 0.6, iy = CY() - ic;
      ctx.beginPath();
      ctx.roundRect(ix, iy, ic * 1.2, ic * 2, 1.5);
      ctx.stroke();
      ctx.fillStyle = "#E8632A";
      ctx.beginPath(); ctx.arc(ix + ic * 0.9, CY(), 1, 0, Math.PI * 2); ctx.fill();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mounted]);

  const handleRetry = () => {
    startRef.current = performance.now();
    setMsgIndex(0);
    setTextFade(true);
    setActionsVisible(false);
    setDots(0);
    setRetryTick(t => t + 1);
    onRetry?.();
  };

  if (!mounted) return null;

  const dotStr   = "●".repeat(dots) + "○".repeat(3 - dots);
  const isUrgent = TIMED_MESSAGES[msgIndex].urgent;

  return (
    <>
      <style>{`
        @keyframes sl-overlay-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes sl-overlay-out { from { opacity:1 } to { opacity:0 } }
        @keyframes sl-card-in  {
          from { opacity:0; transform:scale(0.88) translateY(16px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes sl-card-out {
          from { opacity:1; transform:scale(1) translateY(0); }
          to   { opacity:0; transform:scale(0.94) translateY(8px); }
        }
        @keyframes sl-bar {
          0%   { transform: translateX(-100%) scaleX(0.3); }
          50%  { transform: translateX(30%)   scaleX(0.7); }
          100% { transform: translateX(200%)  scaleX(0.3); }
        }
        @keyframes sl-ticker {
          0%,100% { opacity:0.4; }
          50%     { opacity:1; }
        }
        .sl-overlay {
          animation: ${fadeIn ? "sl-overlay-in 0.35s ease both" : "sl-overlay-out 0.45s ease both"};
        }
        .sl-card {
          animation: ${fadeIn ? "sl-card-in 0.48s cubic-bezier(0.34,1.3,0.64,1) both" : "sl-card-out 0.38s ease both"};
        }
      `}</style>

      <div
        className="sl-overlay"
        style={{
          position: "fixed", inset: 0, zIndex: 250,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(250,247,242,0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          className="sl-card"
          style={{
            position: "relative",
            width: 340,
            borderRadius: 28,
            background: "#FAF7F2",
            border: "1.5px solid #E8E2DA",
            boxShadow: [
              "0 0 0 1px rgba(255,255,255,0.8) inset",
              "0 40px 100px rgba(26,24,20,0.16)",
              "0 12px 32px rgba(26,24,20,0.09)",
              "0 0 80px rgba(232,99,42,0.08)",
            ].join(", "),
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent 0%, #E8632A 30%, #E8632A 70%, transparent 100%)",
            opacity: 0.7,
          }} />

          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: 260, borderRadius: "26px 26px 0 0" }}
          />

          <div style={{ padding: "20px 28px 24px", borderTop: "1px solid #E8E2DA", background: "#F8F4EE" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{
                  display: "inline-block", flexShrink: 0, width: 6, height: 6, borderRadius: "50%",
                  background: isUrgent ? "#F59E0B" : "#E8632A",
                  animation: "sl-ticker 1.1s ease-in-out infinite",
                  transition: "background 0.4s ease",
                }} />
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: isUrgent ? 9 : 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: isUrgent ? "#B45309" : "#6B6359",
                  opacity: textFade ? 1 : 0,
                  transition: "opacity 0.18s ease, color 0.3s ease, font-size 0.2s ease",
                  lineHeight: 1.4,
                }}>
                  {TIMED_MESSAGES[msgIndex].text}
                </span>
              </div>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, color: "#A89E94",
                letterSpacing: "0.1em", flexShrink: 0, marginLeft: 8,
              }}>
                {dotStr}
              </span>
            </div>

            <div style={{ position: "relative", height: 3, background: "#E8E2DA", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, transparent, #E8632A, #F0A87A, #E8632A, transparent)",
                backgroundSize: "200% 100%",
                borderRadius: 999,
                animation: "sl-bar 1.8s cubic-bezier(0.4,0,0.2,1) infinite",
                transformOrigin: "left",
              }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, justifyContent: "center" }}>
              {LOADER_DOTS.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "block", width: 5, height: 5, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#A89E94", letterSpacing: "0.06em" }}>{d.label}</span>
                </div>
              ))}
            </div>

            <div style={{
              overflow: "hidden",
              maxHeight: actionsVisible ? 80 : 0,
              opacity: actionsVisible ? 1 : 0,
              marginTop: actionsVisible ? 14 : 0,
              transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease, margin-top 0.4s ease",
            }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => onExit?.()}
                  onMouseEnter={() => setExitHover(true)}
                  onMouseLeave={() => setExitHover(false)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 10,
                    border: `1.5px solid ${exitHover ? "#D4C9B8" : "#E8E2DA"}`,
                    background: exitHover ? "#F3EFE8" : "transparent",
                    color: exitHover ? "#1A1814" : "#6B6359",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
                  }}
                >
                  ← Exit
                </button>
                <button
                  onClick={handleRetry}
                  onMouseEnter={() => setRetryHover(true)}
                  onMouseLeave={() => setRetryHover(false)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 10,
                    border: `1.5px solid ${retryHover ? "#E8632A" : "#E8E2DA"}`,
                    background: retryHover ? "#E8632A" : "transparent",
                    color: retryHover ? "#FAF7F2" : "#E8632A",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
                  }}
                >
                  ↺ Retry
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}