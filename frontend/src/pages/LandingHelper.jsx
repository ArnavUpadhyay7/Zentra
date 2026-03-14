import { useState, useRef, useEffect, useCallback } from "react";
import { HOW_IT_WORKS, FEATURES, STATS, FAQS } from "../constants/landing_cs";

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
    // Parse numeric part from target string like "12k", "98%", "< 60s"
    const numMatch = target.match(/[\d.]+/);
    if (!numMatch) { setDisplay(target); return; }
    const end   = parseFloat(numMatch[0]);
    const start = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      const formatted = end % 1 === 0 ? Math.floor(current) : current.toFixed(1);
      setDisplay(target.replace(numMatch[0], formatted));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [triggered, target, duration]);

  return <span ref={ref}>{triggered ? display : "0"}{triggered ? "" : suffix}</span>;
}

// ─── Pixel character sprite (SVG inline) ─────────────────────────────────────
// Tiny 8-bit style characters — each is a unique colour
const SPRITES = [
  { color: "#E8632A", hat: "#1A1814", anim: "float-a", delay: "0s",    x: "78%", y: "18%" },
  { color: "#4ADE80", hat: "#1A1814", anim: "float-b", delay: "0.8s",  x: "85%", y: "42%" },
  { color: "#A78BFA", hat: "#E8632A", anim: "float-c", delay: "0.3s",  x: "72%", y: "62%" },
  { color: "#60A5FA", hat: "#1A1814", anim: "float-a", delay: "1.2s",  x: "90%", y: "28%" },
];

function PixelChar({ color, hat, anim, delay, x, y }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left: x, top: y,
        animation: `${anim} ${3 + Math.random() * 2}s ease-in-out infinite`,
        animationDelay: delay,
        cursor: "pointer",
        transform: hovered ? "scale(1.3)" : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34,1.6,0.64,1)",
        zIndex: 2,
        filter: hovered ? `drop-shadow(0 0 8px ${color}88)` : "none",
      }}
    >
      <svg width="32" height="40" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: "pixelated" }}>
        {/* Hat */}
        <rect x="2" y="0" width="4" height="1" fill={hat}/>
        <rect x="1" y="1" width="6" height="1" fill={hat}/>
        {/* Head */}
        <rect x="2" y="2" width="4" height="3" fill={color}/>
        {/* Eyes */}
        <rect x="3" y="3" width="1" height="1" fill="#1A1814"/>
        <rect x="5" y="3" width="1" height="1" fill="#1A1814"/>
        {/* Body */}
        <rect x="2" y="5" width="4" height="3" fill={color} opacity="0.8"/>
        {/* Legs */}
        <rect x="2" y="8" width="1" height="2" fill={hat}/>
        <rect x="5" y="8" width="1" height="2" fill={hat}/>
      </svg>
      {hovered && (
        <div style={{
          position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)",
          background: "#1A1814", color: "#FAF7F2",
          fontFamily: F.mono, fontSize: 9, letterSpacing: "0.08em",
          padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          👋 Hey!
        </div>
      )}
    </div>
  );
}

// ─── Magnetic button wrapper ──────────────────────────────────────────────────
function MagneticBtn({ children, onClick, primary }) {
  const ref  = useRef(null);
  const [h, setH] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    setPos({ x: (e.clientX - cx) * 0.25, y: (e.clientY - cy) * 0.25 });
  }, []);

  const onLeave = () => { setH(false); setPos({ x: 0, y: 0 }); };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
      style={{
        fontFamily: F.body, fontWeight: 600, fontSize: 15,
        color: primary ? "#FAF7F2" : C.ink,
        padding: "14px 28px", borderRadius: 10,
        border: `1.5px solid ${primary ? C.accent : C.border}`,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9,
        background: primary ? (h ? "#D4571F" : C.accent) : (h ? C.bgAlt : C.bg),
        boxShadow: primary
          ? h ? `0 8px 32px ${C.accent}55` : `0 4px 22px ${C.accent}33`
          : `0 2px 10px rgba(26,24,20,0.07)`,
        transform: `translate(${pos.x}px, ${pos.y}px) translateY(${h ? -2 : 0}px)`,
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

// ─── HERO ─────────────────────────────────────────────────────────────────────
export function Hero({ onCTA }) {
  // Live room count — ticks up randomly to feel alive
  const [rooms, setRooms] = useState(47);
  useEffect(() => {
    const id = setInterval(() => {
      setRooms(r => r + (Math.random() > 0.6 ? 1 : 0));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: 64, background: C.bg, overflow: "hidden" }}>

      {/* Grain texture */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.025, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "200px" }} />

      {/* Floating pixel characters — right side */}
      {SPRITES.map((s, i) => <PixelChar key={i} {...s} />)}

      {/* Orange glow */}
      <div style={{ position: "absolute", bottom: "8%", left: "3%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}0F 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ flex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 40px", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 80, paddingBottom: 60 }}>

        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 100, padding: "8px 18px", width: "fit-content", marginBottom: 52, animation: "heroFadeUp 0.9s ease both" }}>
          <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.accent, animation: "pulse-dot 1.8s ease-in-out infinite" }} />
            <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: C.accent, display: "block" }} />
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: C.accent, fontWeight: 500, letterSpacing: "0.06em" }}>
            {rooms} rooms active right now
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: F.display, fontWeight: 900, color: C.ink, fontSize: "clamp(3.6rem, 9vw, 7.5rem)", lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: 36, animation: "heroFadeUp 1s 0.1s ease both" }}>
          Meet people<br />the way you do<br />
          <em style={{ fontStyle: "italic", color: C.accent }}>in real life.</em>
        </h1>

        {/* Sub */}
        <p style={{ fontFamily: F.body, fontSize: "clamp(16px, 1.8vw, 20px)", color: C.inkMid, lineHeight: 1.75, maxWidth: 540, marginBottom: 52, animation: "heroFadeUp 1s 0.22s ease both" }}>
          A shared 2D world where proximity drives conversation. Walk up to someone and you're talking. Step away and you're not.
        </p>

        {/* CTA — magnetic buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginBottom: 88, animation: "heroFadeUp 1s 0.34s ease both" }}>
          <MagneticBtn primary onClick={() => onCTA("create")}><PlusIcon /> Create a Space</MagneticBtn>
          <MagneticBtn onClick={() => onCTA("join")}><ArrowIcon /> Join a Space</MagneticBtn>
          <a href="#how-it-works" style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkLight, textDecoration: "none", paddingLeft: 8, transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.ink}
            onMouseLeave={e => e.currentTarget.style.color = C.inkLight}>
            How it works ↓
          </a>
        </div>

        {/* Stats with count-up */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: `1.5px solid ${C.border}`, paddingTop: 36, animation: "heroFadeUp 1s 0.46s ease both" }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} style={{ paddingRight: 32, borderRight: i < 3 ? `1px solid ${C.border}` : "none", paddingLeft: i > 0 ? 32 : 0 }}>
              <p style={{ fontFamily: F.display, fontWeight: 700, fontSize: 32, color: C.ink, marginBottom: 6, letterSpacing: "-0.02em" }}>
                <CountUp target={value} duration={1600} />
              </p>
              <p style={{ fontFamily: F.body, fontSize: 13, color: C.inkLight, lineHeight: 1.5 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{ padding: "0 40px 32px", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 1, height: 44, background: `linear-gradient(to bottom, ${C.accent}, transparent)` }} />
        <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: C.inkLight }}>Scroll to explore</span>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS — with a drawn progress line ────────────────────────────────
export function HowItWorks() {
  const [hRef, hIn] = useInView();

  return (
    <section id="how-it-works" style={{ background: C.bgAlt, padding: "140px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div ref={hRef} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "flex-end", marginBottom: 80, ...revealUp(hIn) }}>
          <div>
            <Label>How it works</Label>
            <h2 style={{ fontFamily: F.display, fontWeight: 900, fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", color: C.ink, lineHeight: 1.1, letterSpacing: "-0.025em" }}>
              Three steps.<br /><span style={{ color: C.inkLight, fontStyle: "italic" }}>That's genuinely all.</span>
            </h2>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 16, color: C.inkMid, lineHeight: 1.8, alignSelf: "flex-end" }}>
            Most tools bury you in setup, onboarding, and meeting links. We stripped all of that — you should be talking in under 60 seconds.
          </p>
        </div>

        {/* Step cards with left-side progress line */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
          {HOW_IT_WORKS.map((step, i) => <StepCard key={step.num} step={step} index={i} total={HOW_IT_WORKS.length} />)}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index, total }) {
  const [ref, inView] = useInView({ threshold: 0.3 });
  const [h, setH] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        opacity:   inView ? 1   : 0.12,
        transform: inView ? "translateX(0) translateY(0)" : "translateX(-56px) translateY(10px)",
        transition: "opacity 1100ms cubic-bezier(0.16,1,0.3,1), transform 1100ms cubic-bezier(0.16,1,0.3,1), background 0.3s, border-color 0.3s, box-shadow 0.3s",
        marginLeft: index === 1 ? 60 : index === 2 ? 120 : 0,
        display: "grid", gridTemplateColumns: "60px 1fr 1fr 48px", gap: 36, alignItems: "center",
        padding: "32px 40px", borderRadius: 18,
        background: h ? C.bg : "rgba(255,255,255,0.5)",
        border: `1.5px solid ${h ? C.accent + "44" : C.border}`,
        boxShadow: h ? "0 12px 40px rgba(26,24,20,0.1)" : "0 2px 12px rgba(26,24,20,0.04)",
        cursor: "default", position: "relative",
      }}
    >
      {/* Step number with animated border ring on inView */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-90deg)" }}>
          <circle cx="26" cy="26" r="22" fill="none" stroke={C.border} strokeWidth="1.5"/>
          <circle cx="26" cy="26" r="22" fill="none" stroke={C.accent} strokeWidth="1.5"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={inView ? 0 : 2 * Math.PI * 22}
            style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) ${index * 200}ms` }}
          />
        </svg>
        <span style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 900, fontSize: 26, color: h ? C.accent : C.inkMid, letterSpacing: "-0.03em", userSelect: "none", zIndex: 1, transition: "color 0.3s" }}>
          {step.num}
        </span>
      </div>

      <div>
        <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: h ? C.accent : C.inkLight, background: h ? C.accentBg : C.bgAlt, border: `1px solid ${h ? C.accent + "33" : C.border}`, borderRadius: 100, padding: "4px 12px", display: "inline-block", marginBottom: 12, transition: "all 0.3s" }}>
          {step.tag}
        </span>
        <h3 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: C.ink, lineHeight: 1.3, letterSpacing: "-0.01em" }}>{step.title}</h3>
      </div>

      <p style={{ fontFamily: F.body, fontSize: 15, color: C.inkMid, lineHeight: 1.75 }}>{step.desc}</p>

      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${h ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: h ? C.accent : C.inkLight, fontSize: 18, flexShrink: 0, transition: "all 0.3s", transform: h ? "translateX(4px)" : "translateX(0)" }}>
        →
      </div>
    </div>
  );
}

// ─── FEATURES — dark section with scanline + animated rows ───────────────────
export function Features() {
  const [hRef, hIn] = useInView();

  return (
    <section id="features" style={{ background: C.ink, padding: "140px 40px", overflow: "hidden", position: "relative" }}>

      {/* Animated grid background */}
      <div style={{
        position: "absolute", inset: "-32px",
        backgroundImage: `linear-gradient(rgba(232,226,218,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,226,218,0.04) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        animation: "grid-drift 8s linear infinite",
        pointerEvents: "none",
      }} />

      {/* Scanline sweep */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${C.accent}22, transparent)`,
        animation: "scanline 6s linear infinite",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div ref={hRef} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 80, ...revealUp(hIn, 0, 1100) }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 1.5, background: C.accent }} />
              <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent }}>Features</span>
            </div>
            <h2 style={{ fontFamily: F.display, fontWeight: 900, fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", color: "#FAF7F2", lineHeight: 1.1, letterSpacing: "-0.025em" }}>
              Everything you need.<br />
              <em style={{ fontStyle: "italic", color: "rgba(250,247,242,0.2)" }}>Nothing you don't.</em>
            </h2>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 15, color: "#6B6359", lineHeight: 1.8, maxWidth: 320, textAlign: "right" }}>
            If it doesn't make spatial communication better, it's not here.
          </p>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {FEATURES.map((f, i) => <FeatureRow key={f.title} f={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function FeatureRow({ f, index }) {
  const [ref, inView] = useInView({ threshold: 0.35 });
  const [h, setH] = useState(false);

  return (
    <div ref={ref} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        ...revealUp(inView, 0, 1100),
        display: "flex", alignItems: "center", gap: 32,
        padding: "28px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "default",
      }}>
      <span style={{ fontFamily: F.mono, fontSize: 11, color: h ? C.accent : "rgba(255,255,255,0.2)", width: 32, flexShrink: 0, letterSpacing: "0.06em", transition: "color 0.5s" }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: h ? `${C.accent}18` : "rgba(255,255,255,0.05)", border: `1px solid ${h ? C.accent + "44" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, transition: "all 0.4s", transform: h ? "scale(1.12) rotate(-3deg)" : "scale(1) rotate(0deg)" }}>
        {f.icon}
      </div>
      <h3 style={{ fontFamily: F.display, fontWeight: 700, fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)", color: h ? "#FAF7F2" : "rgba(250,247,242,0.45)", flex: 1, lineHeight: 1.2, letterSpacing: "-0.01em", transition: "color 0.45s" }}>
        {f.title}
      </h3>
      <p style={{ fontFamily: F.body, fontSize: 14, color: h ? "#A89E94" : "rgba(168,158,148,0.3)", lineHeight: 1.7, maxWidth: 280, textAlign: "right", transition: "color 0.45s" }}>
        {f.desc}
      </p>
      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${h ? C.accent : "rgba(255,255,255,0.1)"}`, background: h ? `${C.accent}18` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: h ? C.accent : "rgba(255,255,255,0.2)", fontSize: 16, transition: "all 0.35s", transform: h ? "translateX(4px)" : "translateX(0)" }}>
        →
      </div>
    </div>
  );
}

// ─── CALLOUT — with parallax on mouse move ────────────────────────────────────
export function Callout() {
  const [ref, inView]   = useInView();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width  - 0.5) * 20,
      y: ((e.clientY - rect.top)  / rect.height - 0.5) * 10,
    });
  };

  return (
    <section style={{ background: C.bgAlt, padding: "140px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={() => setMouse({ x: 0, y: 0 })}
          style={{
            ...revealUp(inView, 0, 1300),
            position: "relative", borderRadius: 24, overflow: "hidden",
            background: C.bg, border: `1.5px solid ${C.border}`,
            padding: "96px 96px",
            boxShadow: "0 24px 80px rgba(26,24,20,0.08)",
            cursor: "default",
          }}
        >
          {/* Giant decorative quote */}
          <div style={{
            position: "absolute", top: -20, left: 72,
            fontFamily: F.display, fontWeight: 900, fontSize: 280,
            color: C.accent, opacity: 0.06, lineHeight: 1, userSelect: "none", pointerEvents: "none",
            transform: `translate(${mouse.x * 0.5}px, ${mouse.y * 0.5}px)`,
            transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}>"</div>

          {/* Accent left bar */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: `linear-gradient(to bottom, ${C.accent}, transparent)`, borderRadius: "24px 0 0 24px" }} />

          {/* Content shifts slightly with mouse */}
          <div style={{
            position: "relative", zIndex: 1, maxWidth: 700,
            transform: `translate(${mouse.x * 0.15}px, ${mouse.y * 0.15}px)`,
            transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <p style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent, marginBottom: 28 }}>The idea</p>
            <blockquote style={{ fontFamily: F.display, fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.7rem, 3.2vw, 2.6rem)", color: C.ink, lineHeight: 1.3, letterSpacing: "-0.015em", marginBottom: 36 }}>
              "The best remote conversations happen when they don't feel scheduled."
            </blockquote>
            <p style={{ fontFamily: F.body, fontSize: 16, color: C.inkMid, lineHeight: 1.8, maxWidth: 540 }}>
              Spatial proximity gives conversation back its context. You see who's nearby, who's in a cluster, who's available. No calendar. No link. Just presence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
export function FAQ() {
  const [open, setOpen] = useState(null);
  const [hRef, hIn]     = useInView();

  return (
    <section id="faq" style={{ background: C.bg, padding: "140px 40px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div ref={hRef} style={{ marginBottom: 64, ...revealUp(hIn, 0, 1100) }}>
          <Label>FAQ</Label>
          <h2 style={{ fontFamily: F.display, fontWeight: 900, fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", color: C.ink, lineHeight: 1.1, letterSpacing: "-0.025em" }}>
            Questions,<br /><em style={{ fontStyle: "italic", color: C.inkLight }}>answered.</em>
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((faq, i) => <FaqItem key={i} faq={faq} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />)}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ faq, index, open, onToggle }) {
  const [ref, inView] = useInView({ threshold: 0.5 });

  return (
    <div ref={ref} style={{
      ...revealUp(inView, index * 120, 1000),
      borderRadius: 14, border: `1.5px solid ${open ? C.accent + "55" : C.border}`,
      background: open ? C.accentBg : C.bg, overflow: "hidden",
      transition: "border-color 0.35s ease, background 0.35s ease",
    }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, padding: "22px 28px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: open ? C.accent : C.ink, lineHeight: 1.4, transition: "color 0.25s" }}>{faq.q}</span>
        <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${open ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: open ? C.accent : C.inkLight, transform: open ? "rotate(45deg)" : "rotate(0deg)", transition: "all 0.35s", fontSize: 18 }}>+</span>
      </button>
      <div style={{ maxHeight: open ? 240 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <p style={{ fontFamily: F.body, fontSize: 15, color: C.inkMid, lineHeight: 1.8, padding: "0 28px 24px" }}>{faq.a}</p>
      </div>
    </div>
  );
}

// ─── CTA BANNER ──────────────────────────────────────────────────────────────
export function CTABanner({ onCTA }) {
  const [lRef, lIn] = useInView();
  const [rRef, rIn] = useInView();

  const items = [
    "Walk up to talk — no scheduling, ever",
    "Voice is peer-to-peer, never on our server",
    "Runs entirely in the browser, nothing to install",
    "Just enter a name — that's the whole onboarding",
    "Custom map support via Tiled editor",
    "Free forever for small teams",
  ];

  return (
    <section style={{ background: C.bgAlt, padding: "140px 40px", borderTop: `1.5px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

          <div ref={lRef} style={revealLeft(lIn, 0, 1200)}>
            <Label>Get started</Label>
            <h2 style={{ fontFamily: F.display, fontWeight: 900, fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", color: C.ink, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: 20 }}>
              Ready to step<br /><em style={{ fontStyle: "italic", color: C.accent }}>inside?</em>
            </h2>
            <p style={{ fontFamily: F.body, fontSize: 16, color: C.inkMid, lineHeight: 1.8, marginBottom: 40, maxWidth: 380 }}>
              No account. No credit card. Pick a name, create or join a room, and be talking in under a minute.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <MagneticBtn primary onClick={() => onCTA("create")}><PlusIcon /> Create a Space</MagneticBtn>
              <MagneticBtn onClick={() => onCTA("join")}><ArrowIcon /> Join a Space</MagneticBtn>
            </div>
          </div>

          <ul ref={rRef} style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 18 }}>
            {items.map((item, i) => (
              <li key={item} style={{ ...revealRight(rIn, i * 120, 1000), display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: C.accentBg, border: `1.5px solid ${C.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckIcon />
                </div>
                <span style={{ fontFamily: F.body, fontSize: 15, color: C.inkMid, lineHeight: 1.5 }}>{item}</span>
              </li>
            ))}
          </ul>

        </div>
      </div>
    </section>
  );
}