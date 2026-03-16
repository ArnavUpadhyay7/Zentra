import { useState, useRef, useEffect, useCallback } from "react";
import { HOW_IT_WORKS, FEATURES, STATS, FAQS } from "../constants/landing_cs";
import ZentraWorld from "../components/ZentraWorld";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        "#FAF7F2",
  bgAlt:     "#F3EFE8",
  ink:       "#1A1814",
  inkMid:    "#6B6359",
  inkLight:  "#A89E94",
  accent:    "#E8632A",
  accentBg:  "#FDF1EB",
  border:    "#E8E2DA",
  borderDark:"#D4C9B8",
};
const F = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'Plus Jakarta Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

// ─── useIsMobile ──────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ─── MobileToast ─────────────────────────────────────────────────────────────
export function MobileToast({ visible, onHide }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onHide, 3800);
    return () => clearTimeout(t);
  }, [visible, onHide]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        zIndex: 300,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        borderRadius: 16,
        padding: "14px 18px",
        background: C.ink,
        border: "1px solid rgba(232,226,218,0.12)",
        boxShadow: "0 8px 40px rgba(26,24,20,0.35)",
        maxWidth: "calc(100vw - 32px)",
        width: 340,
        transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }}>🖥️</div>
      <div>
        <p style={{ fontFamily: F.body, fontWeight: 600, fontSize: 13, color: "#FAF7F2", marginBottom: 3 }}>
          Desktop only
        </p>
        <p style={{ fontFamily: F.body, fontSize: 12, color: "rgba(250,247,242,0.55)", lineHeight: 1.55 }}>
          Zentra needs keyboard controls &amp; WebRTC — open on a desktop browser for the full experience.
        </p>
      </div>
      <button
        onClick={onHide}
        style={{ background: "none", border: "none", color: "rgba(250,247,242,0.35)", fontSize: 16, cursor: "pointer", flexShrink: 0, marginLeft: "auto", lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── useInView ────────────────────────────────────────────────────────────────
function useInView(opts = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px", ...opts }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

// ─── Easing helpers ───────────────────────────────────────────────────────────
const T = (delay = 0, dur = 1300) =>
  `opacity ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`;

const revealUp    = (v, d = 0, dur = 1300) => ({ opacity: v ? 1 : 0, transform: v ? "translateY(0)"  : "translateY(64px)",  transition: T(d, dur) });
const revealLeft  = (v, d = 0, dur = 1300) => ({ opacity: v ? 1 : 0, transform: v ? "translateX(0)"  : "translateX(-72px)", transition: T(d, dur) });
const revealRight = (v, d = 0, dur = 1300) => ({ opacity: v ? 1 : 0, transform: v ? "translateX(0)"  : "translateX(72px)",  transition: T(d, dur) });

// ─── Animated count-up number ─────────────────────────────────────────────────
function CountUp({ target, suffix = "", duration = 1800 }) {
  const [display, setDisplay] = useState("0");
  const [triggered, setTriggered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTriggered(true); io.disconnect(); } },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!triggered) return;
    const numMatch = target.match(/[\d.]+/);
    if (!numMatch) { setDisplay(target); return; }
    const end   = parseFloat(numMatch[0]);
    const start = 0;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = start + (end - start) * eased;
      const formatted = end % 1 === 0 ? Math.floor(current) : current.toFixed(1);
      setDisplay(target.replace(numMatch[0], formatted));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [triggered, target, duration]);

  return <span ref={ref}>{triggered ? display : "0"}{triggered ? "" : suffix}</span>;
}

// ─── Magnetic button wrapper ──────────────────────────────────────────────────
// Added `disabled` prop — buttons are visually/functionally locked while loading
function MagneticBtn({ children, onClick, primary, disabled }) {
  const ref  = useRef(null);
  const [h, setH] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e) => {
    if (disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    setPos({ x: (e.clientX - cx) * 0.25, y: (e.clientY - cy) * 0.25 });
  }, [disabled]);

  const onLeave = () => { setH(false); setPos({ x: 0, y: 0 }); };

  return (
    <button
      ref={ref}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => { if (!disabled) setH(true); }}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
      disabled={disabled}
      style={{
        fontFamily: F.body, fontWeight: 600, fontSize: 15,
        color: primary ? "#FAF7F2" : C.ink,
        padding: "14px 28px", borderRadius: 10,
        border: `1.5px solid ${primary ? C.accent : C.border}`,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 9,
        background: primary ? (h ? "#D4571F" : C.accent) : (h ? C.bgAlt : C.bg),
        opacity: disabled ? 0.5 : 1,
        boxShadow: primary
          ? h ? `0 8px 32px ${C.accent}55` : `0 4px 22px ${C.accent}33`
          : `0 2px 10px rgba(26,24,20,0.07)`,
        transform: disabled ? "none" : `translate(${pos.x}px, ${pos.y}px) translateY(${h ? -2 : 0}px)`,
        transition: h
          ? "background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease"
          : "all 0.45s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
export const PlusIcon  = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5v12M1.5 7.5h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
export const ArrowIcon = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 7.5H13M8.5 3l4.5 4.5L8.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
export const CloseIcon = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
export const CheckIcon = () => <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3L9 1" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
export const ErrIcon   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 4v3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="6.5" cy="9.2" r="0.7" fill="currentColor"/></svg>;

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, hint, value, onChange, onKeyDown, placeholder, maxLength, error, inputRef, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: C.inkMid }}>{label}</label>
        {hint && <span style={{ fontFamily: F.mono, fontSize: 10, color: C.inkLight }}>{hint}</span>}
      </div>
      <div style={{
        borderRadius: 10, border: `1.5px solid ${error ? "#E53935" : focused ? C.accent : C.border}`,
        background: error ? "#FFF5F5" : focused ? "#FEFCFA" : C.bg,
        boxShadow: focused && !error ? `0 0 0 3px ${C.accent}22` : "none",
        transition: "all 0.2s ease",
      }}>
        <input
          ref={inputRef} type={type} value={value} onChange={onChange} onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder} maxLength={maxLength}
          style={{ width: "100%", fontFamily: F.body, fontSize: 14, color: C.ink, background: "transparent", padding: "13px 16px", outline: "none", borderRadius: 10 }}
        />
      </div>
      {error && <p style={{ fontFamily: F.body, fontSize: 12, color: "#E53935", display: "flex", alignItems: "center", gap: 6 }}><ErrIcon />{error}</p>}
    </div>
  );
}

// ─── NameModal ────────────────────────────────────────────────────────────────
export function NameModal({ intent, prefillRoomId = "", serverError, onClose, onCreateSuccess, onJoinSuccess }) {
  const nameRef = useRef(null);
  const isJoin  = intent === "join";
  const [name,    setName]    = useState(() => localStorage.getItem("vs_username") || "");
  const [roomId,  setRoomId]  = useState(prefillRoomId);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); setTimeout(() => nameRef.current?.focus(), 120); }, []);
  useEffect(() => { if (serverError) { setLoading(false); setErrors({ roomId: serverError }); } }, [serverError]);

  const dismiss  = () => { setVisible(false); setTimeout(onClose, 240); };
  const clearErr = (f) => setErrors(p => { const n = { ...p }; delete n[f]; return n; });

  const validate = () => {
    const e = {};
    if (!name.trim())                 e.name   = "Please enter a name.";
    else if (name.trim().length > 24) e.name   = "Keep it under 24 characters.";
    if (isJoin && !roomId.trim())     e.roomId = "Paste the room ID to continue.";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const uname = name.trim();
    const rid   = roomId.trim();
    localStorage.setItem("vs_username", uname);
    if (isJoin) {
      setLoading(true); setVisible(false);
      setTimeout(() => onJoinSuccess({ username: uname, roomId: rid }), 220);
    } else {
      setVisible(false);
      setTimeout(() => onCreateSuccess(uname), 220);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") dismiss(); };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={dismiss} style={{ position: "absolute", inset: 0, background: "rgba(26,24,20,0.6)", backdropFilter: "blur(8px)", opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }} />
      <div style={{
        position: "relative", background: C.bg, borderRadius: 20, width: "100%", maxWidth: 460,
        border: `1px solid ${C.border}`,
        boxShadow: "0 32px 80px rgba(26,24,20,0.22), 0 8px 24px rgba(26,24,20,0.1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
        transition: "opacity 0.3s ease, transform 0.38s cubic-bezier(0.34,1.4,0.64,1)",
      }}>
        <div style={{ padding: "36px 36px 32px" }}>
          <button onClick={dismiss} style={{ position: "absolute", top: 18, right: 18, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: C.bgAlt, border: `1px solid ${C.border}`, color: C.inkLight, cursor: "pointer" }}>
            <CloseIcon />
          </button>
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 100, padding: "4px 12px", display: "inline-block", marginBottom: 16 }}>
              {isJoin ? "↗ Joining a space" : "+ Creating a space"}
            </span>
            <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, color: C.ink, lineHeight: 1.25, marginBottom: 8 }}>
              {isJoin ? "Where are you headed?" : "What should we call you?"}
            </h2>
            <p style={{ fontFamily: F.body, fontSize: 14, color: C.inkMid, lineHeight: 1.65 }}>
              {isJoin ? "Enter your name and the room ID you received." : "This name floats above your character in the world."}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <Field label="Username" hint="Saved locally" value={name} onChange={e => { setName(e.target.value); clearErr("name"); }} onKeyDown={onKey} placeholder="e.g. Alex" maxLength={24} error={errors.name} inputRef={nameRef} />
            {isJoin && <Field label="Room ID" hint="From whoever invited you" value={roomId} onChange={e => { setRoomId(e.target.value); clearErr("roomId"); }} onKeyDown={onKey} placeholder="aB3kP9xG" error={errors.roomId} />}
          </div>
          <button
            onClick={submit} disabled={loading}
            style={{
              width: "100%", fontFamily: F.body, fontWeight: 600, fontSize: 15, color: "#FAF7F2",
              padding: "14px 0", borderRadius: 12, border: "none",
              cursor: loading ? "default" : "pointer",
              background: loading ? C.inkLight : C.accent,
              boxShadow: loading ? "none" : `0 4px 20px ${C.accent}44`,
              transition: "all 0.2s ease", opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${C.accent}55`; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = loading ? "none" : `0 4px 20px ${C.accent}44`; }}
          >
            {loading ? "Joining…" : isJoin ? "Enter the space →" : "Choose a map →"}
          </button>
          <p style={{ fontFamily: F.mono, fontSize: 11, color: C.inkLight, textAlign: "center", marginTop: 14 }}>
            {isJoin ? "No account needed — ever." : "Saved locally, never on our servers."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────
export function Label({ children, light = false }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{ width: 28, height: 1.5, background: C.accent }} />
      <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent }}>
        {children}
      </span>
    </div>
  );
}

// ─── HERO PLAYGROUND — Voice Radius Visualization (back-face canvas) ─────────
function HeroPlayground({ active }) {
  const canvasRef     = useRef(null);
  const rafRef        = useRef(null);
  const stateRef      = useRef(null);
  const keysRef       = useRef({});
  const activeRef     = useRef(active);
  const [showHint,    setShowHint]    = useState(false);
  const hintShownRef  = useRef(false);
  const sceneAlphaRef = useRef(0);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    if (!active) return;
    const t0 = performance.now();
    const fadeIn = (now) => {
      const p = Math.min((now - t0) / 600, 1);
      sceneAlphaRef.current = p;
      if (p < 1) requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);
    if (!hintShownRef.current) {
      hintShownRef.current = true;
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3200);
    }
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const p = canvas.parentElement.getBoundingClientRect();
      if (!p.width || !p.height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = p.width  * dpr;
      canvas.height = p.height * dpr;
      canvas.style.width  = p.width  + "px";
      canvas.style.height = p.height + "px";
      ctx.scale(dpr, dpr);
      build(p.width, p.height);
    };

    const VOICE_R    = 72;
    const TALK_R     = VOICE_R;
    const PLAYER_SPD = 2.4;
    const NPC_COLORS = ["#818CF8", "#4ADE80", "#F0ABFC", "#60A5FA", "#F59E0B"];
    const MSGS       = ["hey 👋", "yo!", "nice", "❤️", "👋", "same"];

    const build = (W, H) => {
      const pad = VOICE_R + 8;
      const player = { id: "player", x: W / 2, y: H * 0.55, vx: 0, vy: 0, radius: 8, color: C.accent, facing: 0, glowT: 0 };
      const npcs = NPC_COLORS.map((color, i) => ({
        id: i, color,
        x: pad + Math.random() * (W - pad * 2),
        y: pad + Math.random() * (H - pad * 2),
        tx: 0, ty: 0, vx: 0, vy: 0, radius: 6,
        wanderTimer: 60 + Math.random() * 180, facing: 0,
        talking: false, showType: false, msg: "", typeTimer: 0, msgTimer: 0, glowT: 0,
      }));
      npcs.forEach(n => { n.tx = n.x; n.ty = n.y; });
      stateRef.current = { W, H, pad, player, npcs, tick: 0 };
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    const onKeyDown = (e) => {
      keysRef.current[e.key] = true;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    };
    const onKeyUp = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);

    const hex2rgba = (hex, a) => {
      const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    };
    const rrect = (x,y,w,h,r) => {
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
      ctx.closePath();
    };

    const drawRadius = (a) => {
      const col = a.color; const t = a.glowT;
      const fillOp = 0.055 + t * 0.085;
      const gFill = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, VOICE_R);
      gFill.addColorStop(0, hex2rgba(col, fillOp * 2.0));
      gFill.addColorStop(0.55, hex2rgba(col, fillOp));
      gFill.addColorStop(1, hex2rgba(col, 0));
      ctx.fillStyle = gFill;
      ctx.beginPath(); ctx.arc(a.x, a.y, VOICE_R, 0, Math.PI*2); ctx.fill();
      const ringOp = 0.18 + t * 0.28;
      ctx.globalAlpha = ringOp;
      ctx.strokeStyle = col; ctx.lineWidth = 1.0; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(a.x, a.y, VOICE_R, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    };

    const drawAvatar = (a, isPlayer) => {
      ctx.shadowColor = a.color + "66"; ctx.shadowBlur = isPlayer ? 14 : 9;
      ctx.fillStyle = a.color;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      const hg = ctx.createRadialGradient(a.x-a.radius*.3, a.y-a.radius*.3, 0, a.x, a.y, a.radius);
      hg.addColorStop(0,"rgba(255,255,255,0.42)"); hg.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.stroke();
      const fx = a.x + Math.cos(a.facing)*a.radius*.55;
      const fy = a.y + Math.sin(a.facing)*a.radius*.55;
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, Math.PI*2); ctx.fill();
      if (isPlayer) {
        ctx.globalAlpha = 0.72;
        ctx.font = "600 8px 'DM Mono',monospace";
        ctx.fillStyle = C.accent; ctx.textAlign="center"; ctx.textBaseline="bottom";
        ctx.fillText("YOU", a.x, a.y - a.radius - 10);
        ctx.globalAlpha = 1;
      }
    };

    const drawBubble = (a) => {
      const text = a.showType ? "···" : a.msg;
      if (!text) return;
      const bx = a.x, by = a.y - a.radius - 24;
      ctx.font = "500 9px 'DM Mono',monospace";
      const tw = ctx.measureText(text).width;
      const pw=tw+14, ph=16, pr=6;
      const op = a.showType ? 0.9 : Math.min(1, a.msgTimer/20) * 0.92;
      ctx.globalAlpha = op;
      ctx.fillStyle = "#1A1814";
      rrect(bx-pw/2, by-ph/2, pw, ph, pr); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx-4,by+ph/2); ctx.lineTo(bx,by+ph/2+5); ctx.lineTo(bx+4,by+ph/2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#FAF7F2"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(text, bx, by);
      ctx.globalAlpha = 1;
    };

    const step = () => {
      const s = stateRef.current; if (!s) return;
      const { W, H, pad, player, npcs } = s; s.tick++;
      const k = keysRef.current;
      let dx=0, dy=0;
      if (k["ArrowLeft"]  || k["a"] || k["A"]) dx -= 1;
      if (k["ArrowRight"] || k["d"] || k["D"]) dx += 1;
      if (k["ArrowUp"]    || k["w"] || k["W"]) dy -= 1;
      if (k["ArrowDown"]  || k["s"] || k["S"]) dy += 1;
      if (dx!==0||dy!==0) { const len=Math.hypot(dx,dy); player.vx+=(dx/len)*PLAYER_SPD*0.36; player.vy+=(dy/len)*PLAYER_SPD*0.36; }
      player.vx*=0.78; player.vy*=0.78;
      const pspd=Math.hypot(player.vx,player.vy);
      if (pspd>PLAYER_SPD) { player.vx=(player.vx/pspd)*PLAYER_SPD; player.vy=(player.vy/pspd)*PLAYER_SPD; }
      player.x=Math.max(pad,Math.min(W-pad,player.x+player.vx));
      player.y=Math.max(pad,Math.min(H-pad,player.y+player.vy));
      if (pspd>0.1) player.facing=Math.atan2(player.vy,player.vx);

      const all = [player, ...npcs];
      for (const n of npcs) {
        n.wanderTimer--;
        if (n.wanderTimer<=0) { n.tx=pad+Math.random()*(W-pad*2); n.ty=pad+Math.random()*(H-pad*2); n.wanderTimer=140+Math.random()*200; }
        const wx=n.tx-n.x, wy=n.ty-n.y, wd=Math.hypot(wx,wy);
        if (wd>4) { n.vx+=(wx/wd)*0.18; n.vy+=(wy/wd)*0.18; }
        for (const b of all) {
          if (b.id===n.id) continue;
          const ex=n.x-b.x, ey=n.y-b.y, ed=Math.hypot(ex,ey);
          if (ed<24&&ed>0) { n.vx+=(ex/ed)*(24-ed)*0.06; n.vy+=(ey/ed)*(24-ed)*0.06; }
        }
        n.vx*=0.82; n.vy*=0.82;
        const spd=Math.hypot(n.vx,n.vy);
        if (spd>0.85) { n.vx=(n.vx/spd)*0.85; n.vy=(n.vy/spd)*0.85; }
        n.x=Math.max(pad,Math.min(W-pad,n.x+n.vx));
        n.y=Math.max(pad,Math.min(H-pad,n.y+n.vy));
        if (spd>0.08) n.facing=Math.atan2(n.vy,n.vx);
        const distP=Math.hypot(n.x-player.x,n.y-player.y);
        if (distP<TALK_R&&distP>0.1) {
          const tf=Math.atan2(player.y-n.y,player.x-n.x);
          let df=tf-n.facing;
          if (df>Math.PI) df-=Math.PI*2; if (df<-Math.PI) df+=Math.PI*2;
          n.facing+=df*0.05;
        }
      }
      const calcOverlap=(a)=>{ for(const b of all){if(b.id===a.id)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<TALK_R*2)return true;}return false;};
      for (const a of all) { const target=calcOverlap(a)?1:0; a.glowT+=(target-a.glowT)*0.06; }
      { let nearest=null,nearestD=Infinity; for(const n of npcs){const d=Math.hypot(n.x-player.x,n.y-player.y);if(d<TALK_R&&d<nearestD){nearest=n;nearestD=d;}}
        if(nearest){const tf=Math.atan2(nearest.y-player.y,nearest.x-player.x);let df=tf-player.facing;if(df>Math.PI)df-=Math.PI*2;if(df<-Math.PI)df+=Math.PI*2;player.facing+=df*0.04;}}
      for (const n of npcs) {
        const distP=Math.hypot(n.x-player.x,n.y-player.y),inRange=distP<TALK_R;
        if(inRange&&!n.talking&&Math.random()<0.004){n.talking=true;n.showType=true;n.typeTimer=55+Math.random()*80;}
        if(n.showType){n.typeTimer--;if(n.typeTimer<=0){n.showType=false;n.msg=MSGS[Math.floor(Math.random()*MSGS.length)];n.msgTimer=80+Math.random()*60;}}
        if(n.msgTimer>0){n.msgTimer--;if(n.msgTimer<=0){n.talking=false;n.msg="";}}
        if(!inRange){n.talking=false;n.showType=false;n.msg="";n.msgTimer=0;}
      }
    };

    const draw = () => {
      const s=stateRef.current; if(!s) return;
      const sa=sceneAlphaRef.current;
      const dpr=window.devicePixelRatio||1;
      const W=canvas.width/dpr, H=canvas.height/dpr;
      const {player,npcs}=s; const all=[player,...npcs];
      ctx.fillStyle="#F0EBE2"; ctx.fillRect(0,0,W,H);
      const gs=36;
      ctx.strokeStyle="#C8BFB0"; ctx.lineWidth=0.5; ctx.globalAlpha=0.20*sa;
      for(let x=gs;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=gs;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      ctx.globalAlpha=sa;
      for(const a of all) drawRadius(a);
      for(let i=0;i<all.length;i++){for(let j=i+1;j<all.length;j++){
        const a=all[i],b=all[j],d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<TALK_R*2){const od=Math.max(0,1-d/(TALK_R*2)),lt=Math.min(a.glowT,b.glowT);
        ctx.globalAlpha=od*lt*0.30;ctx.strokeStyle=a.id==="player"?C.accent:a.color;
        ctx.lineWidth=0.8;ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.setLineDash([]);ctx.globalAlpha=sa;}}}
      for(const n of npcs) drawAvatar(n,false);
      drawAvatar(player,true);
      for(const n of npcs) drawBubble(n);
      ctx.globalAlpha=1;
    };

    const loop=()=>{ if(activeRef.current){step();draw();} rafRef.current=requestAnimationFrame(loop); };
    rafRef.current=requestAnimationFrame(loop);
    return ()=>{ cancelAnimationFrame(rafRef.current); ro.disconnect(); window.removeEventListener("keydown",onKeyDown); window.removeEventListener("keyup",onKeyUp); };
  }, []); // eslint-disable-line

  return (
    <>
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", display:"block", cursor:"none" }} />
      <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", fontFamily:F.mono, fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.inkLight, whiteSpace:"nowrap", pointerEvents:"none", opacity:showHint?1:0, transition:"opacity 0.55s ease" }}>
        Move with WASD or ↑↓←→
      </div>
    </>
  );
}

// ─── HERO FLIP CARD ───────────────────────────────────────────────────────────
function HeroFlipCard() {
  const [flipped,       setFlipped]       = useState(false);
  const [teased,        setTeased]        = useState(false);
  const [teaseAngle,    setTeaseAngle]    = useState(0);
  const [isAnimating,   setIsAnimating]   = useState(false);
  const [showClickHint, setShowClickHint] = useState(false);

  const handleMouseEnter = () => {
    if (teased || flipped) return;
    setTeased(true); setShowClickHint(true); setTeaseAngle(10);
    setTimeout(() => setTeaseAngle(0), 750);
    setTimeout(() => setShowClickHint(false), 2200);
  };

  const handleClick = () => {
    if (isAnimating) return;
    setIsAnimating(true); setShowClickHint(false); setTeaseAngle(0);
    setFlipped(f => !f);
    setTimeout(() => setIsAnimating(false), 720);
  };

  const innerRotate = flipped ? 180 : teaseAngle;
  const shadow = (teaseAngle > 0 || isAnimating)
    ? "0 24px 64px rgba(26,24,20,0.14), 0 4px 16px rgba(26,24,20,0.08)"
    : "0 8px 40px rgba(26,24,20,0.06), 0 2px 12px rgba(26,24,20,0.04)";

  return (
    <div style={{ position:"relative", height:520, perspective:"1100px", perspectiveOrigin:"50% 50%", animation:"heroFadeUp 1s 0.28s ease both", transition:"box-shadow 0.6s ease", boxShadow:shadow, borderRadius:24 }} onMouseEnter={handleMouseEnter}>
      <div onClick={handleClick} style={{ position:"absolute", inset:0, transformStyle:"preserve-3d", transform:`rotateY(${innerRotate}deg)`, transition: flipped||isAnimating?"transform 700ms cubic-bezier(0.45,0.05,0.55,0.95)":teaseAngle!==0?"transform 600ms cubic-bezier(0.45,0.05,0.55,0.95)":"transform 650ms cubic-bezier(0.16,1,0.3,1)", cursor:"pointer", borderRadius:24 }}>
        {/* FRONT */}
        <div style={{ position:"absolute", inset:0, borderRadius:24, overflow:"hidden", backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", border:`1.5px solid ${C.border}`, background:C.bg }}>
          <ZentraWorld active={!flipped} />
          <div style={{ position:"absolute", top:16, left:16, display:"flex", alignItems:"center", gap:7, background:"rgba(250,247,242,0.90)", backdropFilter:"blur(8px)", border:`1px solid ${C.border}`, borderRadius:100, padding:"5px 12px", pointerEvents:"none" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ADE80", display:"block", flexShrink:0 }} />
            <span style={{ fontFamily:F.mono, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", color:C.inkMid }}>Live preview</span>
          </div>
          <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", fontFamily:F.mono, fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.inkLight, pointerEvents:"none", whiteSpace:"nowrap" }}>Move your cursor in ↑</div>
          <div style={{ position:"absolute", bottom:34, left:"50%", transform:"translateX(-50%)", fontFamily:F.mono, fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.inkMid, whiteSpace:"nowrap", pointerEvents:"none", opacity:showClickHint?1:0, transition:"opacity 0.4s ease" }}>Click to explore →</div>
        </div>
        {/* BACK */}
        <div style={{ position:"absolute", inset:0, borderRadius:24, overflow:"hidden", backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", transform:"rotateY(180deg)", border:`1.5px solid ${C.border}`, background:"#F2EDE5" }}>
          <HeroPlayground active={flipped} />
          <div style={{ position:"absolute", top:16, left:16, display:"flex", alignItems:"center", gap:7, background:"rgba(240,235,226,0.92)", backdropFilter:"blur(8px)", border:`1px solid ${C.border}`, borderRadius:100, padding:"5px 12px", pointerEvents:"none" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, display:"block", flexShrink:0 }} />
            <span style={{ fontFamily:F.mono, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", color:C.inkMid }}>Voice radius view</span>
          </div>
          <div style={{ position:"absolute", top:16, right:16, fontFamily:F.mono, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", color:C.inkLight, pointerEvents:"none" }}>Click to flip back</div>
        </div>
      </div>
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
export function Hero({ onCTA, isLoading }) {
  const [rooms, setRooms] = useState(47);
  const [toast, setToast] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const id = setInterval(() => { setRooms(r => r + (Math.random() > 0.6 ? 1 : 0)); }, 3200);
    return () => clearInterval(id);
  }, []);

  const handleCTA = (intent) => {
    if (isLoading) return;
    if (isMobile) { setToast(true); return; }
    onCTA(intent);
  };

  return (
    <section style={{ position:"relative", minHeight:"100vh", display:"flex", flexDirection:"column", paddingTop:64, background:C.bg, overflow:"hidden" }}>
      <style>{`
        @media (max-width: 767px) { .zh-floating-dock { display: none !important; } }
        .zh-hero-grid { flex:1; max-width:1600px; margin:0 auto; padding:80px 40px 60px; width:100%; display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:center; }
        @media (max-width: 960px) { .zh-hero-grid { grid-template-columns:1fr; padding:52px 24px 44px; gap:40px; } .zh-hero-card { display:none !important; } .zh-hero-h1 { font-size:clamp(2.8rem,8vw,5rem) !important; } }
        @media (max-width: 600px) { .zh-hero-grid{padding:40px 20px 36px;} .zh-hero-h1{font-size:clamp(2.6rem,10vw,3.8rem)!important;line-height:1.0!important;} .zh-hero-badge{margin-bottom:28px!important;} .zh-hero-sub{margin-bottom:32px!important;font-size:16px!important;} .zh-hero-ctas{margin-bottom:40px!important;gap:10px!important;flex-wrap:nowrap!important;} .zh-hero-hiw-link{display:none!important;} .zh-hero-stats{grid-template-columns:repeat(2,1fr)!important;gap:0!important;} .zh-hero-stats>div:nth-child(2){border-right:none!important;} .zh-hero-stats>div:nth-child(3){border-right:1px solid ${C.border}!important;padding-left:0!important;} .zh-hero-scroll-cue{display:none!important;} }
        .zh-hiw-header { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:flex-end; margin-bottom:80px; }
        .zh-step-card-inner { display:grid; grid-template-columns:60px 1fr 1fr 48px; gap:36px; align-items:center; }
        @media (max-width: 767px) { .zh-hiw-section{padding:72px 20px!important;} .zh-hiw-header{grid-template-columns:1fr!important;gap:16px!important;margin-bottom:40px!important;} .zh-hiw-subtitle{display:none!important;} .zh-step-indent{margin-left:0!important;} .zh-step-card-inner{grid-template-columns:1fr!important;gap:12px!important;} .zh-step-num-ring{display:none!important;} .zh-step-num-inline{display:flex!important;} .zh-step-desc{display:block!important;} .zh-step-arrow{display:none!important;} .zh-step-pad{padding:22px 20px!important;border-radius:16px!important;} }
        .zh-step-num-inline { display:none; align-items:center; gap:10px; }
        @media (max-width: 600px) { .zh-hiw-section{padding:64px 16px!important;} }
        @media (max-width: 860px) { .zh-feat-header{flex-direction:column!important;align-items:flex-start!important;gap:16px!important;} .zh-feat-subtitle{text-align:left!important;} .zh-feat-row-desc{display:none!important;} }
        @media (max-width: 600px) { .zh-feat-section{padding:72px 20px!important;} }
        @media (max-width: 700px) { .zh-callout-section{padding:72px 20px!important;} .zh-callout-inner{padding:48px 28px!important;border-radius:18px!important;} .zh-callout-quote{font-size:clamp(1.35rem,5.5vw,1.9rem)!important;} }
        .zh-faq-grid { display:grid; grid-template-columns:5fr 7fr; gap:24px; align-items:start; }
        @media (max-width: 800px) { .zh-faq-grid{display:none!important;} .zh-faq-mobile{display:flex!important;} .zh-faq-section{padding:72px 20px!important;} }
        .zh-faq-mobile { display:none; flex-direction:column; gap:10px; }
        .zh-cta-grid { display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
        @media (max-width: 860px) { .zh-cta-grid{grid-template-columns:1fr!important;gap:48px!important;} .zh-cta-section{padding:72px 20px!important;} }
      `}</style>

      <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.025, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:"200px" }} />
      <div style={{ position:"absolute", bottom:"8%", left:"3%", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle, ${C.accent}0F 0%, transparent 70%)`, pointerEvents:"none" }} />

      <div className="zh-hero-grid">
        <div style={{ display:"flex", flexDirection:"column" }}>
          <div className="zh-hero-badge" style={{ display:"inline-flex", alignItems:"center", gap:10, background:C.accentBg, border:`1px solid ${C.accent}33`, borderRadius:100, padding:"8px 18px", width:"fit-content", marginBottom:52, animation:"heroFadeUp 0.9s ease both" }}>
            <span style={{ position:"relative", display:"inline-flex", width:7, height:7 }}>
              <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:C.accent, animation:"pulse-dot 1.8s ease-in-out infinite" }} />
              <span style={{ position:"relative", width:7, height:7, borderRadius:"50%", background:C.accent, display:"block" }} />
            </span>
            <span style={{ fontFamily:F.mono, fontSize:11, color:C.accent, fontWeight:500, letterSpacing:"0.06em" }}>{rooms} rooms active right now</span>
          </div>

          <h1 className="zh-hero-h1" style={{ fontFamily:F.display, fontWeight:900, color:C.ink, fontSize:"clamp(3.2rem, 7vw, 6.2rem)", lineHeight:0.95, letterSpacing:"-0.03em", marginBottom:36, animation:"heroFadeUp 1s 0.1s ease both" }}>
            Meet people<br />the way you do<br />
            <em style={{ fontStyle:"italic", color:C.accent }}>in real life.</em>
          </h1>

          <p className="zh-hero-sub" style={{ fontFamily:F.body, fontSize:"clamp(15px, 1.6vw, 18px)", color:C.inkMid, lineHeight:1.75, maxWidth:480, marginBottom:52, animation:"heroFadeUp 1s 0.22s ease both" }}>
            A shared 2D world where proximity drives conversation. Walk up to someone and you're talking. Step away and you're not.
          </p>

          <div className="zh-hero-ctas" style={{ display:"flex", flexWrap:"nowrap", alignItems:"center", gap:14, marginBottom:72, animation:"heroFadeUp 1s 0.34s ease both" }}>
            <MagneticBtn primary onClick={() => handleCTA("create")} disabled={isLoading}><PlusIcon /> Create a Space</MagneticBtn>
            <MagneticBtn onClick={() => handleCTA("join")} disabled={isLoading}><ArrowIcon /> Join a Space</MagneticBtn>
            <a href="#how-it-works" className="zh-hero-hiw-link" style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:C.inkLight, textDecoration:"none", paddingLeft:8, transition:"color 0.2s", whiteSpace:"nowrap" }} onMouseEnter={e=>e.currentTarget.style.color=C.ink} onMouseLeave={e=>e.currentTarget.style.color=C.inkLight}>
              How it works ↓
            </a>
          </div>

          <div className="zh-hero-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderTop:`1.5px solid ${C.border}`, paddingTop:36, animation:"heroFadeUp 1s 0.46s ease both" }}>
            {STATS.map(({ value, label }, i) => (
              <div key={label} style={{ paddingRight:20, borderRight:i<3?`1px solid ${C.border}`:"none", paddingLeft:i>0?20:0 }}>
                <p style={{ fontFamily:F.display, fontWeight:700, fontSize:26, color:C.ink, marginBottom:4, letterSpacing:"-0.02em" }}><CountUp target={value} duration={1600} /></p>
                <p style={{ fontFamily:F.body, fontSize:12, color:C.inkLight, lineHeight:1.5 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="zh-hero-card"><HeroFlipCard /></div>
      </div>

      <div className="zh-hero-scroll-cue" style={{ maxWidth:1600, margin:"0 auto", width:"100%", padding:"0 40px 32px" }}>
        <div style={{ width:"50%", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:1, height:44, background:`linear-gradient(to bottom, ${C.accent}, transparent)` }} />
          <span style={{ fontFamily:F.mono, fontSize:9, letterSpacing:"0.22em", textTransform:"uppercase", color:C.inkLight }}>Scroll to explore</span>
        </div>
      </div>

      <MobileToast visible={toast} onHide={() => setToast(false)} />
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
export function HowItWorks() {
  const [hRef, hIn] = useInView();
  return (
    <section className="zh-hiw-section" style={{ background:C.bgAlt, padding:"140px 40px" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div ref={hRef} className="zh-hiw-header" style={{ ...revealUp(hIn) }}>
          <div>
            <Label>How it works</Label>
            <h2 style={{ fontFamily:F.display, fontWeight:900, fontSize:"clamp(2.4rem, 4.5vw, 3.8rem)", color:C.ink, lineHeight:1.1, letterSpacing:"-0.025em" }}>
              Three steps.<br /><span style={{ color:C.inkLight, fontStyle:"italic" }}>That's genuinely all.</span>
            </h2>
          </div>
          <p className="zh-hiw-subtitle" style={{ fontFamily:F.body, fontSize:16, color:C.inkMid, lineHeight:1.8, alignSelf:"flex-end" }}>
            Most tools bury you in setup, onboarding, and meeting links. We stripped all of that — you should be talking in under 60 seconds.
          </p>
        </div>
        <div style={{ position:"relative", display:"flex", flexDirection:"column", gap:16 }}>
          {HOW_IT_WORKS.map((step, i) => <StepCard key={step.num} step={step} index={i} total={HOW_IT_WORKS.length} />)}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index, total }) {
  const [ref, inView] = useInView({ threshold:0.2 });
  const [h, setH] = useState(false);
  return (
    <div ref={ref} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} className="zh-step-indent zh-step-pad"
      style={{ opacity:inView?1:0.12, transform:inView?"translateX(0) translateY(0)":"translateX(-40px) translateY(8px)", transition:"opacity 1100ms cubic-bezier(0.16,1,0.3,1), transform 1100ms cubic-bezier(0.16,1,0.3,1), background 0.3s, border-color 0.3s, box-shadow 0.3s", marginLeft:index===1?60:index===2?120:0, padding:"32px 40px", borderRadius:18, background:h?C.bg:"rgba(255,255,255,0.5)", border:`1.5px solid ${h?C.accent+"44":C.border}`, boxShadow:h?"0 12px 40px rgba(26,24,20,0.1)":"0 2px 12px rgba(26,24,20,0.04)", cursor:"default", position:"relative" }}>
      <div className="zh-step-card-inner">
        <div className="zh-step-num-ring" style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%) rotate(-90deg)" }}>
            <circle cx="26" cy="26" r="22" fill="none" stroke={C.border} strokeWidth="1.5"/>
            <circle cx="26" cy="26" r="22" fill="none" stroke={C.accent} strokeWidth="1.5" strokeDasharray={`${2*Math.PI*22}`} strokeDashoffset={inView?0:2*Math.PI*22} style={{ transition:`stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) ${index*200}ms` }}/>
          </svg>
          <span style={{ fontFamily:F.display, fontStyle:"italic", fontWeight:900, fontSize:26, color:h?C.accent:C.inkMid, letterSpacing:"-0.03em", userSelect:"none", zIndex:1, transition:"color 0.3s" }}>{step.num}</span>
        </div>
        <div>
          <div className="zh-step-num-inline" style={{ marginBottom:10 }}>
            <span style={{ fontFamily:F.mono, fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:C.accent, background:C.accentBg, border:`1px solid ${C.accent}33`, borderRadius:100, padding:"3px 10px" }}>Step {step.num}</span>
          </div>
          <span style={{ fontFamily:F.mono, fontSize:10, fontWeight:500, letterSpacing:"0.14em", textTransform:"uppercase", color:h?C.accent:C.inkLight, background:h?C.accentBg:C.bgAlt, border:`1px solid ${h?C.accent+"33":C.border}`, borderRadius:100, padding:"4px 12px", display:"inline-block", marginBottom:12, transition:"all 0.3s" }}>{step.tag}</span>
          <h3 style={{ fontFamily:F.display, fontWeight:700, fontSize:22, color:C.ink, lineHeight:1.3, letterSpacing:"-0.01em" }}>{step.title}</h3>
        </div>
        <p className="zh-step-desc" style={{ fontFamily:F.body, fontSize:15, color:C.inkMid, lineHeight:1.75 }}>{step.desc}</p>
        <div className="zh-step-arrow" style={{ width:40, height:40, borderRadius:"50%", border:`1.5px solid ${h?C.accent:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:h?C.accent:C.inkLight, fontSize:18, flexShrink:0, transition:"all 0.3s", transform:h?"translateX(4px)":"translateX(0)" }}>→</div>
      </div>
    </div>
  );
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
export function Features() {
  const [hRef, hIn] = useInView();
  return (
    <section className="zh-feat-section" id="features" style={{ background:C.ink, padding:"140px 40px", overflow:"hidden", position:"relative" }}>
      <div style={{ position:"absolute", inset:"-32px", backgroundImage:`linear-gradient(rgba(232,226,218,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,226,218,0.04) 1px, transparent 1px)`, backgroundSize:"32px 32px", animation:"grid-drift 8s linear infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${C.accent}22, transparent)`, animation:"scanline 6s linear infinite", pointerEvents:"none" }} />
      <div style={{ maxWidth:1200, margin:"0 auto", position:"relative", zIndex:1 }}>
        <div ref={hRef} className="zh-feat-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:80, ...revealUp(hIn,0,1100) }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:20 }}>
              <div style={{ width:28, height:1.5, background:C.accent }} />
              <span style={{ fontFamily:F.mono, fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.accent }}>Features</span>
            </div>
            <h2 style={{ fontFamily:F.display, fontWeight:900, fontSize:"clamp(2.4rem, 4.5vw, 3.8rem)", color:"#FAF7F2", lineHeight:1.1, letterSpacing:"-0.025em" }}>
              Everything you need.<br /><em style={{ fontStyle:"italic", color:"rgba(250,247,242,0.2)" }}>Nothing you don't.</em>
            </h2>
          </div>
          <p className="zh-feat-subtitle" style={{ fontFamily:F.body, fontSize:15, color:"#6B6359", lineHeight:1.8, maxWidth:320, textAlign:"right" }}>If it doesn't make spatial communication better, it's not here.</p>
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          {FEATURES.map((f, i) => <FeatureRow key={f.title} f={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function FeatureRow({ f, index }) {
  const [ref, inView] = useInView({ threshold:0.35 });
  const [h, setH] = useState(false);
  return (
    <div ref={ref} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ ...revealUp(inView,0,1100), display:"flex", alignItems:"center", gap:32, padding:"28px 0", borderBottom:"1px solid rgba(255,255,255,0.08)", cursor:"default" }}>
      <span style={{ fontFamily:F.mono, fontSize:11, color:h?C.accent:"rgba(255,255,255,0.2)", width:32, flexShrink:0, letterSpacing:"0.06em", transition:"color 0.5s" }}>{String(index+1).padStart(2,"0")}</span>
      <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, background:h?`${C.accent}18`:"rgba(255,255,255,0.05)", border:`1px solid ${h?C.accent+"44":"rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, transition:"all 0.4s", transform:h?"scale(1.12) rotate(-3deg)":"scale(1) rotate(0deg)" }}>{f.icon}</div>
      <h3 style={{ fontFamily:F.display, fontWeight:700, fontSize:"clamp(1.25rem, 2.2vw, 1.75rem)", color:h?"#FAF7F2":"rgba(250,247,242,0.45)", flex:1, lineHeight:1.2, letterSpacing:"-0.01em", transition:"color 0.45s" }}>{f.title}</h3>
      <p className="zh-feat-row-desc" style={{ fontFamily:F.body, fontSize:14, color:h?"#A89E94":"rgba(168,158,148,0.3)", lineHeight:1.7, maxWidth:280, textAlign:"right", transition:"color 0.45s" }}>{f.desc}</p>
      <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, border:`1.5px solid ${h?C.accent:"rgba(255,255,255,0.1)"}`, background:h?`${C.accent}18`:"transparent", display:"flex", alignItems:"center", justifyContent:"center", color:h?C.accent:"rgba(255,255,255,0.2)", fontSize:16, transition:"all 0.35s", transform:h?"translateX(4px)":"translateX(0)" }}>→</div>
    </div>
  );
}

// ─── CALLOUT ──────────────────────────────────────────────────────────────────
function PresenceDots() {
  return (
    <>
      <style>{`
        @keyframes pd-pulse-0{0%,100%{opacity:.3;transform:scale(1) translateX(0)}50%{opacity:.7;transform:scale(1.3) translateX(3px)}}
        @keyframes pd-pulse-1{0%,100%{opacity:.45;transform:scale(1) translateX(0)}50%{opacity:.85;transform:scale(1.4) translateX(0)}}
        @keyframes pd-pulse-2{0%,100%{opacity:.3;transform:scale(1) translateX(0)}50%{opacity:.7;transform:scale(1.3) translateX(-3px)}}
        @keyframes pd-row-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
      `}</style>
      <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginTop:32, animation:"pd-row-float 6s ease-in-out infinite" }}>
        {[0,1,2].map(i=>(
          <span key={i} style={{ display:"block", borderRadius:"50%", width:i===1?8:7, height:i===1?8:7, background:C.accent, animation:`pd-pulse-${i} ${3.8+i*0.7}s ease-in-out infinite`, animationDelay:`${i*0.55}s` }} />
        ))}
        <span style={{ fontFamily:F.mono, fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.inkLight, marginLeft:6 }}>people nearby</span>
      </div>
    </>
  );
}

export function Callout() {
  const [ref, inView] = useInView();
  return (
    <section className="zh-callout-section" style={{ background:C.bgAlt, padding:"140px 40px" }}>
      <style>{`@keyframes callout-idle{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div ref={ref} className="zh-callout-inner" style={{ ...revealUp(inView,0,1300), animation:inView?"callout-idle 7s ease-in-out infinite":undefined, position:"relative", borderRadius:24, overflow:"hidden", padding:"96px 96px", cursor:"default", background:`linear-gradient(150deg, ${C.bg} 0%, #F0ECE4 60%, #EAE4DA 100%)`, border:`1.5px solid ${C.border}`, boxShadow:[`inset 0 1px 0 rgba(255,255,255,0.75)`,`0 1px 0 rgba(255,255,255,0.5)`,`0 24px 64px rgba(26,24,20,0.07)`,`0 6px 20px rgba(26,24,20,0.04)`].join(", ") }}>
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.018, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:"180px" }} />
          <div style={{ position:"absolute", top:0, left:0, width:4, height:"100%", background:`linear-gradient(to bottom, ${C.accent}, ${C.accent}00)`, borderRadius:"24px 0 0 24px" }} />
          <div style={{ position:"absolute", top:-20, left:72, fontFamily:F.display, fontWeight:900, fontSize:280, color:C.accent, opacity:0.05, lineHeight:1, userSelect:"none", pointerEvents:"none" }}>"</div>
          <div style={{ position:"relative", zIndex:1, maxWidth:700 }}>
            <p style={{ fontFamily:F.mono, fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.accent, marginBottom:28 }}>The idea</p>
            <blockquote className="zh-callout-quote" style={{ fontFamily:F.display, fontWeight:700, fontStyle:"italic", fontSize:"clamp(1.7rem, 3.2vw, 2.6rem)", color:C.ink, lineHeight:1.3, letterSpacing:"-0.015em", marginBottom:36 }}>
              "The best remote conversations happen when they don't feel scheduled."
            </blockquote>
            <p style={{ fontFamily:F.body, fontSize:16, color:C.inkMid, lineHeight:1.8, maxWidth:540 }}>Spatial proximity gives conversation back its context. You see who's nearby, who's in a cluster, who's available. No calendar. No link. Just presence.</p>
            <PresenceDots />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_DATA = FAQS;

export function FAQ() {
  const [hRef, hIn]   = useInView();
  const [active, setActive]     = useState(0);
  const [fading, setFading]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(null);

  const handleSelect = (id) => {
    if (id===active) return;
    setFading(true);
    setTimeout(() => { setActive(id); setFading(false); }, 180);
  };

  const current = FAQ_DATA[active] ?? FAQ_DATA[0];

  return (
    <section id="faq" className="zh-faq-section" style={{ background:C.bg, padding:"140px 40px" }}>
      <style>{`@keyframes faq-dot{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.8;transform:scale(1.5)}}`}</style>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div ref={hRef} style={{ marginBottom:64, ...revealUp(hIn,0,1100) }}>
          <Label>FAQ</Label>
          <h2 style={{ fontFamily:F.display, fontWeight:900, fontSize:"clamp(2.4rem, 4.5vw, 3.8rem)", color:C.ink, lineHeight:1.1, letterSpacing:"-0.025em" }}>
            Questions,<br /><em style={{ fontStyle:"italic", color:C.inkLight }}>answered.</em>
          </h2>
        </div>
        <div className="zh-faq-grid" style={{ ...revealUp(hIn,120,1100) }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {FAQ_DATA.map((item, i) => {
              const isActive = i===active;
              return (
                <button key={i} onClick={()=>handleSelect(i)}
                  onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background=C.bgAlt; }}
                  onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}
                  style={{ display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left", cursor:"pointer", padding:"14px 16px", borderRadius:12, background:isActive?C.accentBg:"transparent", border:`1.5px solid ${isActive?C.accent+"55":"transparent"}`, boxShadow:isActive?`0 2px 12px ${C.accent}18`:"none", transition:"background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease" }}>
                  <span style={{ flexShrink:0, display:"block", borderRadius:"50%", width:7, height:7, background:isActive?C.accent:C.borderDark, animation:isActive?`faq-dot 2.6s ease-in-out ${i*0.3}s infinite`:"none", transition:"background 0.2s ease" }} />
                  <span style={{ fontFamily:F.display, fontWeight:700, fontSize:15, color:isActive?C.accent:C.inkMid, lineHeight:1.4, transition:"color 0.2s ease", flex:1 }}>{item.q}</span>
                  <span style={{ fontFamily:F.mono, fontSize:11, color:C.accent, opacity:isActive?1:0, transform:isActive?"translateX(0)":"translateX(-6px)", transition:"opacity 0.25s ease, transform 0.25s ease", flexShrink:0 }}>→</span>
                </button>
              );
            })}
          </div>
          <div style={{ position:"relative", borderRadius:20, border:`1.5px solid ${C.border}`, background:C.bgAlt, padding:"40px 48px", minHeight:260, boxShadow:"0 4px 24px rgba(26,24,20,0.05)", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(to right, ${C.accent}88, transparent)`, borderRadius:"20px 20px 0 0" }} />
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, borderRadius:100, padding:"4px 12px", marginBottom:24, background:C.accentBg, border:`1px solid ${C.accent}33`, fontFamily:F.mono, fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.accent }}>
              <span style={{ display:"block", width:5, height:5, borderRadius:"50%", background:C.accent, animation:"faq-dot 2.2s ease-in-out infinite" }} />
              {String(active+1).padStart(2,"0")} of {FAQ_DATA.length}
            </div>
            <div style={{ opacity:fading?0:1, transform:fading?"translateY(8px)":"translateY(0)", transition:"opacity 0.18s ease, transform 0.22s ease" }}>
              <h3 style={{ fontFamily:F.display, fontWeight:700, fontSize:"clamp(1.1rem, 1.6vw, 1.45rem)", color:C.ink, lineHeight:1.3, letterSpacing:"-0.01em", marginBottom:20 }}>{current.q}</h3>
              <p style={{ fontFamily:F.body, fontSize:15, color:C.inkMid, lineHeight:1.82 }}>{current.a}</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:40, paddingTop:24, borderTop:`1px solid ${C.border}` }}>
              <button onClick={()=>handleSelect(Math.max(0,active-1))} disabled={active===0} style={{ fontFamily:F.mono, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", padding:"6px 12px", borderRadius:8, cursor:active===0?"default":"pointer", background:"transparent", border:`1px solid ${C.border}`, color:active===0?C.inkLight+"66":C.inkLight, opacity:active===0?0.45:1, transition:"all 0.2s ease" }}>← prev</button>
              <button onClick={()=>handleSelect(Math.min(FAQ_DATA.length-1,active+1))} disabled={active===FAQ_DATA.length-1} style={{ fontFamily:F.mono, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", padding:"6px 12px", borderRadius:8, cursor:active===FAQ_DATA.length-1?"default":"pointer", background:"transparent", border:`1px solid ${C.border}`, color:active===FAQ_DATA.length-1?C.inkLight+"66":C.inkLight, opacity:active===FAQ_DATA.length-1?0.45:1, transition:"all 0.2s ease" }}>next →</button>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                {FAQ_DATA.map((_,i)=><button key={i} onClick={()=>handleSelect(i)} style={{ display:"block", border:"none", cursor:"pointer", borderRadius:100, height:6, width:i===active?20:6, background:i===active?C.accent:C.borderDark, transition:"width 0.3s cubic-bezier(0.16,1,0.3,1), background 0.2s ease" }} />)}
              </div>
            </div>
          </div>
        </div>
        <div className="zh-faq-mobile" style={{ marginTop:8, ...revealUp(hIn,120,1100) }}>
          {FAQ_DATA.map((item,i)=>{
            const open=mobileOpen===i;
            return (
              <div key={i} style={{ borderRadius:16, overflow:"hidden", border:`1.5px solid ${open?C.accent+"55":C.border}`, background:open?C.accentBg:C.bg, transition:"border-color 0.3s ease, background 0.3s ease" }}>
                <button onClick={()=>setMobileOpen(open?null:i)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, textAlign:"left", cursor:"pointer", background:"transparent", border:"none", padding:"18px 20px" }}>
                  <span style={{ fontFamily:F.display, fontWeight:700, fontSize:15, color:open?C.accent:C.ink, lineHeight:1.4, transition:"color 0.25s" }}>{item.q}</span>
                  <span style={{ flexShrink:0, width:28, height:28, borderRadius:"50%", border:`1.5px solid ${open?C.accent:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:open?C.accent:C.inkLight, fontSize:18, lineHeight:1, transform:open?"rotate(45deg)":"rotate(0deg)", transition:"all 0.35s" }}>+</span>
                </button>
                <div style={{ maxHeight:open?300:0, overflow:"hidden", transition:"max-height 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
                  <p style={{ fontFamily:F.body, fontSize:14, color:C.inkMid, lineHeight:1.8, padding:"0 20px 20px" }}>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CTA BANNER ───────────────────────────────────────────────────────────────
export function CTABanner({ onCTA, isLoading }) {
  const [lRef, lIn] = useInView();
  const [rRef, rIn] = useInView();
  const [toast, setToast] = useState(false);
  const isMobile = useIsMobile();

  const handleCTA = (intent) => {
    if (isLoading) return;
    if (isMobile) { setToast(true); return; }
    onCTA(intent);
  };

  const items = [
    "Walk up to talk — no scheduling, ever",
    "Voice is peer-to-peer, never on our server",
    "Runs entirely in the browser, nothing to install",
    "Just enter a name — that's the whole onboarding",
    "Custom map support via Tiled editor",
    "Free forever for small teams",
  ];

  return (
    <section className="zh-cta-section" style={{ background:C.bgAlt, padding:"140px 40px", borderTop:`1.5px solid ${C.border}` }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div className="zh-cta-grid">
          <div ref={lRef} style={revealLeft(lIn,0,1200)}>
            <Label>Get started</Label>
            <h2 style={{ fontFamily:F.display, fontWeight:900, fontSize:"clamp(2.4rem, 4.5vw, 3.8rem)", color:C.ink, lineHeight:1.1, letterSpacing:"-0.025em", marginBottom:20 }}>
              Ready to step<br /><em style={{ fontStyle:"italic", color:C.accent }}>inside?</em>
            </h2>
            <p style={{ fontFamily:F.body, fontSize:16, color:C.inkMid, lineHeight:1.8, marginBottom:40, maxWidth:380 }}>No account. No credit card. Pick a name, create or join a room, and be talking in under a minute.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
              <MagneticBtn primary onClick={()=>handleCTA("create")} disabled={isLoading}><PlusIcon /> Create a Space</MagneticBtn>
              <MagneticBtn onClick={()=>handleCTA("join")} disabled={isLoading}><ArrowIcon /> Join a Space</MagneticBtn>
            </div>
          </div>
          <ul ref={rRef} style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:18 }}>
            {items.map((item,i)=>(
              <li key={item} style={{ ...revealRight(rIn,i*120,1000), display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ flexShrink:0, width:24, height:24, borderRadius:"50%", background:C.accentBg, border:`1.5px solid ${C.accent}33`, display:"flex", alignItems:"center", justifyContent:"center" }}><CheckIcon /></div>
                <span style={{ fontFamily:F.body, fontSize:15, color:C.inkMid, lineHeight:1.5 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <MobileToast visible={toast} onHide={()=>setToast(false)} />
    </section>
  );
}