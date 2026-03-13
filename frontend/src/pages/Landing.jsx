import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MapDrawer from "../components/MapDrawer";
import { HOW_IT_WORKS, FEATURES, STATS, FAQS } from "../constants/landing_cs";

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 1V12M1 6.5H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M1 6.5H11M7 2.5L11 6.5L7 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
    <path d="M1 3.5L3 5.5L7 1" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ErrIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M6 4V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="6" cy="8.5" r="0.6" fill="currentColor"/>
  </svg>
);

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({ label, hint, value, onChange, onKeyDown, placeholder, maxLength, error, inputRef, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-body text-xs font-semibold text-gray-700 uppercase tracking-wider">{label}</label>
        {hint && <span className="font-body text-xs text-gray-400">{hint}</span>}
      </div>
      <div className={[
        "relative rounded-xl border transition-all duration-150",
        error     ? "border-red-300 bg-red-50"
        : focused  ? "border-indigo-400 bg-white shadow-[0_0_0_3px_rgba(99,102,241,0.10)]"
                   : "border-black/10 bg-gray-50 hover:border-black/20",
      ].join(" ")}>
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full font-body text-sm text-gray-900 placeholder-gray-300 bg-transparent px-4 py-3 outline-none rounded-xl"
        />
      </div>
      {error && (
        <p className="font-body text-xs text-red-500 mt-2 flex items-center gap-1.5">
          <ErrIcon/> {error}
        </p>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function NameModal({ intent, prefillRoomId = "", onClose, onCreateSuccess }) {
  const navigate  = useNavigate();
  const nameRef   = useRef(null);
  const isJoin    = intent === "join";

  const [name,    setName]    = useState(() => localStorage.getItem("vs_username") || "");
  const [roomUrl, setRoomUrl] = useState(prefillRoomId);
  const [errors,  setErrors]  = useState({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  const dismiss = () => { setVisible(false); setTimeout(onClose, 220); };
  const clearErr = (f) => setErrors(p => { const n = {...p}; delete n[f]; return n; });

  const validate = () => {
    const e = {};
    if (!name.trim())                  e.name    = "Please enter a name.";
    else if (name.trim().length > 24)  e.name    = "Keep it under 24 characters.";
    if (isJoin && !roomUrl.trim())     e.roomUrl = "Paste the room ID to continue.";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    localStorage.setItem("vs_username", name.trim());

    if (isJoin) {
      // Join flow — go straight to game with roomId
      const roomId = roomUrl.trim();
      setVisible(false);
      setTimeout(() => navigate(`/game/${roomId}`, { state: { username: name.trim(), roomId } }), 200);
    } else {
      // Create flow — close modal, open map drawer
      setVisible(false);
      setTimeout(() => onCreateSuccess(name.trim()), 200);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") dismiss(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={dismiss}
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.22s ease" }}
      />
      <div
        className="relative bg-white rounded-2xl w-full max-w-md border border-black/10 shadow-2xl"
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? "translateY(0) scale(1)" : "translateY(14px) scale(0.96)",
          transition: "opacity 0.22s ease, transform 0.28s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        {/* Colour strip */}
        <div className={[
          "h-1 w-full rounded-t-2xl",
          isJoin ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                 : "bg-gradient-to-r from-indigo-500 to-violet-500",
        ].join(" ")} />

        <div className="p-8">
          <button
            onClick={dismiss}
            className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
          >
            <CloseIcon/>
          </button>

          <div className="mb-7">
            <div className={[
              "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4",
              isJoin ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                     : "bg-indigo-50  text-indigo-600  border border-indigo-100",
            ].join(" ")}>
              {isJoin ? <ArrowIcon/> : <PlusIcon/>}
              {isJoin ? "Joining a space" : "Creating a space"}
            </div>
            <h2 className="font-display font-extrabold text-gray-950 text-2xl tracking-tight mb-1.5">
              {isJoin ? "Where are you headed?" : "What should we call you?"}
            </h2>
            <p className="font-body text-sm text-gray-400 leading-relaxed">
              {isJoin
                ? "Enter your name and the room ID you received."
                : "This appears above your character."}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <Field
              label="Username" hint="Saved locally"
              value={name} onChange={e => { setName(e.target.value); clearErr("name"); }}
              onKeyDown={onKey} placeholder="e.g. Alex" maxLength={24}
              error={errors.name} inputRef={nameRef}
            />
            {isJoin && (
              <Field
                label="Room ID" hint="From whoever invited you"
                value={roomUrl} onChange={e => { setRoomUrl(e.target.value); clearErr("roomUrl"); }}
                onKeyDown={onKey} placeholder="aB3kP9xG"
                error={errors.roomUrl} type="text"
              />
            )}
          </div>

          <button
            onClick={submit}
            className={[
              "group w-full font-display font-bold text-sm text-white py-3.5 rounded-xl",
              "flex items-center justify-center gap-2 transition-all duration-200",
              "hover:-translate-y-px active:translate-y-0",
              isJoin
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-[0_4px_14px_rgba(99,102,241,0.35)]",
            ].join(" ")}
          >
            {isJoin ? "Join the space" : "Choose a map →"}
            {!isJoin && <span className="group-hover:translate-x-0.5 transition-transform duration-150"><ArrowIcon/></span>}
          </button>

          <p className="font-body text-xs text-gray-400 text-center mt-4">
            {isJoin ? "No account needed — ever." : "Saved locally, never on our servers."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div className="inline-flex items-center gap-2 mb-5">
      <span className="w-4 h-px bg-indigo-400"/>
      <span className="font-body text-xs font-semibold text-indigo-500 uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onCTA }) {
  return (
    <section className="relative min-h-screen flex flex-col justify-between pt-16 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{ backgroundImage:"radial-gradient(circle,#c7d2fe 1px,transparent 1px)", backgroundSize:"28px 28px" }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-white/60 to-white"/>
      <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-sky-100/40 blur-3xl pointer-events-none"/>
      <div className="absolute top-16 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"/>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full flex flex-col justify-center flex-1 py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2.5 bg-white/90 border border-black/10 rounded-full px-4 py-2 mb-10 shadow-sm"
               style={{ animation:"fadeUp 0.5s ease both" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
            </span>
            <span className="font-body text-xs text-gray-600 font-medium">
              No account needed — just pick a name and go
            </span>
          </div>

          <h1
            className="font-display font-extrabold text-gray-950 leading-none tracking-tight mb-7"
            style={{ fontSize:"clamp(3rem,7.5vw,5.6rem)", animation:"fadeUp 0.55s 0.07s ease both" }}
          >
            Meet people the way<br/>
            you do <span className="text-indigo-600">in real life.</span>
          </h1>

          <p className="font-body text-lg text-gray-500 leading-relaxed max-w-lg mb-12"
             style={{ animation:"fadeUp 0.55s 0.14s ease both" }}>
            A shared 2D world where proximity drives conversation. Walk up to someone
            and you're talking. Walk away and you're not.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-20"
               style={{ animation:"fadeUp 0.55s 0.21s ease both" }}>
            <button
              onClick={() => onCTA("create")}
              className="group font-display font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-xl transition-all duration-200 shadow-[0_2px_0_#4338ca,0_4px_14px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <PlusIcon/> Create a Space
            </button>
            <button
              onClick={() => onCTA("join")}
              className="group font-display font-bold text-sm bg-white hover:bg-gray-50 text-gray-800 px-7 py-3.5 rounded-xl border border-black/10 hover:border-black/20 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 flex items-center gap-2"
            >
              <ArrowIcon/> Join a Space
            </button>
            <a href="#how-it-works"
               className="font-body text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors duration-150 pl-1">
              How does it work?
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-black/5"
               style={{ animation:"fadeUp 0.55s 0.28s ease both" }}>
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="font-display font-extrabold text-gray-950 text-2xl tracking-tight mb-1.5">{value}</p>
                <p className="font-body text-xs text-gray-400 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full pb-8 flex items-center gap-3">
        <div className="w-px h-9 bg-gradient-to-b from-gray-300 to-transparent"/>
        <span className="font-body text-xs text-gray-300 uppercase tracking-widest">Scroll</span>
      </div>
    </section>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────
const ROW_1 = ["Proximity chat","Spatial voice","Real-time sync","Zero setup","P2P audio","Custom maps","Private rooms","Browser-native","No downloads","WASD movement","60fps sync","Instant join","No installs","Link-only access"];
const ROW_2 = ["Walk up & talk","No meeting links","WebRTC audio","Live positions","Shareable rooms","Open source","Free forever","Tiled map support","Auto voice","Spatial awareness","No account","Always free","Sub-second join"];

function MarqueeTrack({ items, reverse = false, speed = 40 }) {
  const doubled = [...items, ...items];
  return (
    <div className="flex overflow-hidden">
      <div
        className="flex shrink-0"
        style={{ animation:`${reverse ? "marqueeR" : "marquee"} ${speed}s linear infinite` }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-4 px-7">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/40 shrink-0"/>
            <span className="font-body text-sm font-medium text-indigo-200/75 whitespace-nowrap tracking-wide">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarqueeBar() {
  return (
    <div
      className="relative overflow-hidden border-y border-white/5 select-none"
      style={{ background:"linear-gradient(135deg,#1e1b4b 0%,#2d2a6e 50%,#1e1b4b 100%)" }}
    >
      <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[#1e1b4b] to-transparent z-10 pointer-events-none"/>
      <div className="absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-[#1e1b4b] to-transparent z-10 pointer-events-none"/>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"/>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/15 to-transparent"/>
      <div className="py-6 space-y-4">
        <MarqueeTrack items={ROW_1} speed={44}/>
        <MarqueeTrack items={ROW_2} reverse speed={38}/>
      </div>
    </div>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-end mb-20">
          <div>
            <Label>How it works</Label>
            <h2 className="font-display font-extrabold text-gray-950 text-4xl md:text-5xl leading-tight tracking-tight">
              Three steps.<br/>
              <span className="text-gray-300">That's genuinely all.</span>
            </h2>
          </div>
          <p className="font-body text-sm text-gray-500 leading-relaxed md:mb-2">
            Most tools bury you in setup, onboarding, and meeting links. We stripped all of
            that. You should be talking to your team in under 60 seconds.
          </p>
        </div>
        <div className="space-y-4">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.num} className={[
              "group grid md:grid-cols-12 gap-6 items-center p-8 md:p-10 rounded-2xl border",
              "border-black/5 bg-white hover:border-indigo-200",
              "hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-white",
              "transition-all duration-300 cursor-default",
              i === 1 ? "md:ml-10" : i === 2 ? "md:ml-20" : "",
            ].join(" ")}>
              <div className="md:col-span-2 flex md:justify-center">
                <span className="font-display font-black text-7xl leading-none tracking-tight text-gray-100 group-hover:text-indigo-100 transition-colors duration-300 select-none">
                  {step.num}
                </span>
              </div>
              <div className="md:col-span-4">
                <span className="inline-block font-body text-xs font-semibold uppercase tracking-widest text-indigo-500 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full mb-3 group-hover:bg-indigo-100 transition-colors">
                  {step.tag}
                </span>
                <h3 className="font-display font-bold text-gray-950 text-xl tracking-tight leading-snug">{step.title}</h3>
              </div>
              <div className="md:col-span-5">
                <p className="font-body text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
              <div className="hidden md:flex md:col-span-1 justify-end">
                <span className="w-9 h-9 rounded-full border border-gray-200 group-hover:border-indigo-300 group-hover:bg-indigo-50 flex items-center justify-center text-gray-300 group-hover:text-indigo-500 transition-all duration-200">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-end mb-20">
          <div>
            <Label>Features</Label>
            <h2 className="font-display font-extrabold text-gray-950 text-4xl md:text-5xl leading-tight tracking-tight">
              Everything you need.<br/>
              <span className="text-gray-300">Nothing you don't.</span>
            </h2>
          </div>
          <p className="font-body text-sm text-gray-500 leading-relaxed md:mb-2">
            Every capability here earns its place. If it doesn't make spatial
            communication genuinely better, it's not here.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-black/5 border border-black/5 rounded-2xl overflow-hidden shadow-sm">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white hover:bg-indigo-50/40 transition-all duration-200 p-8 group cursor-default">
              <div className="text-3xl mb-5 grayscale group-hover:grayscale-0 group-hover:scale-110 origin-left transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-gray-900 text-base tracking-tight mb-2.5 group-hover:text-indigo-700 transition-colors duration-200">
                {f.title}
              </h3>
              <p className="font-body text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Callout ──────────────────────────────────────────────────────────────────
function Callout() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl bg-gray-950 px-10 md:px-20 py-20 overflow-hidden">
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage:"radial-gradient(circle,#818cf8 1px,transparent 1px)", backgroundSize:"22px 22px" }}
          />
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none"/>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-violet-900/20 blur-3xl pointer-events-none"/>
          <div className="relative z-10 max-w-3xl">
            <p className="font-body text-xs font-semibold text-indigo-400/80 uppercase tracking-widest mb-6">The idea</p>
            <blockquote className="font-display font-extrabold text-white text-3xl md:text-4xl leading-tight tracking-tight mb-8">
              "The best remote conversations happen when they don't feel scheduled."
            </blockquote>
            <p className="font-body text-sm text-gray-400 leading-relaxed max-w-xl">
              Spatial proximity gives conversation back its context. You see who's nearby,
              who's in a cluster, who's available. No calendar. No link. Just presence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" className="py-32 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-16">
          <Label>FAQ</Label>
          <h2 className="font-display font-extrabold text-gray-950 text-4xl md:text-5xl leading-tight tracking-tight">
            Questions, answered.
          </h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className={[
              "rounded-2xl border overflow-hidden transition-all duration-200",
              open === i ? "border-indigo-200 bg-white shadow-sm" : "border-black/5 bg-white hover:border-black/10",
            ].join(" ")}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left group"
              >
                <span className={[
                  "font-display font-semibold text-sm tracking-tight transition-colors duration-150",
                  open === i ? "text-indigo-700" : "text-gray-900 group-hover:text-indigo-700",
                ].join(" ")}>
                  {faq.q}
                </span>
                <span className={[
                  "shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
                  open === i ? "border-indigo-300 bg-indigo-100 text-indigo-600 rotate-45" : "border-gray-200 text-gray-400 group-hover:border-indigo-300 group-hover:text-indigo-500",
                ].join(" ")}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>
              <div className={["overflow-hidden transition-all duration-200", open === i ? "max-h-48" : "max-h-0"].join(" ")}>
                <p className="font-body text-sm text-gray-500 leading-relaxed px-6 pb-5">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CTABanner({ onCTA }) {
  return (
    <section className="py-32 px-6 bg-white border-t border-black/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Label>Get started</Label>
            <h2 className="font-display font-extrabold text-gray-950 text-4xl md:text-5xl leading-tight tracking-tight mb-6">
              Ready to step<br/>inside?
            </h2>
            <p className="font-body text-sm text-gray-500 leading-relaxed mb-8 max-w-sm">
              No account. No credit card. Pick a name, create or join a room,
              and be talking in under a minute.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onCTA("create")}
                className="group font-display font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-xl transition-all duration-200 shadow-[0_2px_0_#4338ca,0_4px_14px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 flex items-center gap-2"
              >
                <PlusIcon/> Create a Space
              </button>
              <button
                onClick={() => onCTA("join")}
                className="font-display font-bold text-sm bg-white hover:bg-gray-50 text-gray-800 px-7 py-3.5 rounded-xl border border-black/10 hover:border-black/20 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-px flex items-center gap-2"
              >
                <ArrowIcon/> Join a Space
              </button>
            </div>
          </div>
          <ul className="space-y-4">
            {[
              "Walk up to talk — no scheduling, ever",
              "Voice is peer-to-peer, never on our server",
              "Runs entirely in the browser, nothing to install",
              "Just enter a name — that's the whole onboarding",
              "Custom map support via Tiled editor",
              "Free forever for small teams",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3.5 group">
                <div className="shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <CheckIcon/>
                </div>
                <p className="font-body text-sm text-gray-600 leading-snug">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();   // set when route is /join/:roomId

  const [modal, setModal]                     = useState(null);
  const [drawerOpen, setDrawerOpen]           = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");

  // If someone opened a /join/:roomId link, pop the join modal immediately
  useEffect(() => {
    if (urlRoomId) setModal({ intent: "join", prefillRoomId: urlRoomId });
  }, [urlRoomId]);

  const handleCTA = (intent) => setModal({ intent, prefillRoomId: "" });

  // Called when name is submitted in "create" flow
  const handleCreateSuccess = (username) => {
    setPendingUsername(username);
    setModal(null);
    setDrawerOpen(true);
  };

  // Called when map is selected in drawer — connect socket, emit create-room, wait for response
  const handleMapSelect = (mapId) => {
    setDrawerOpen(false);
    import("../socket/socket").then(({ default: socket }) => {
      if (socket.disconnected) socket.connect();
      socket.once("room-created", ({ roomId, charIndex }) => {
        navigate(`/game/${roomId}`, {
          state: { username: pendingUsername, mapId, roomId, charIndex },
        });
      });
      socket.emit("create-room", { username: pendingUsername, mapId });
    });
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes marquee  { from { transform:translateX(0);    } to { transform:translateX(-50%); } }
        @keyframes marqueeR { from { transform:translateX(-50%); } to { transform:translateX(0);    } }
        .font-display { font-family:'Bricolage Grotesque',sans-serif; }
        .font-body    { font-family:'DM Sans',sans-serif; }
        html          { scroll-behavior:smooth; }
      `}</style>

      <div className="bg-white text-gray-900 antialiased overflow-x-hidden">
        <Navbar/>
        <main>
          <Hero       onCTA={handleCTA}/>
          <MarqueeBar/>
          <HowItWorks/>
          <Features/>
          <Callout/>
          <FAQ/>
          <CTABanner  onCTA={handleCTA}/>
        </main>
        <Footer/>
      </div>

      {modal && (
        <NameModal
          intent={modal.intent}
          prefillRoomId={modal.prefillRoomId}
          onClose={() => setModal(null)}
          onCreateSuccess={handleCreateSuccess}
        />
      )}

      <MapDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleMapSelect}
      />
    </>
  );
}