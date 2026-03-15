import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MapDrawer from "../components/MapDrawer";
import {
  NameModal, Hero, HowItWorks, Features, Callout, FAQ, CTABanner,
} from "./LandingHelper";

// ── Cursor trail dot ──────────────────────────────────────────────────────────
function CursorTrail() {
  const dotsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const N = 10;
    const trail = [];

    const container = document.createElement("div");
    container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;";
    document.body.appendChild(container);
    containerRef.current = container;

    for (let i = 0; i < N; i++) {
      const dot = document.createElement("div");
      const size = Math.max(3, 8 - i * 0.7);
      dot.style.cssText = `
        position:absolute; width:${size}px; height:${size}px;
        border-radius:50%;
        background:#E8632A;
        opacity:0;
        transform:translate(-50%,-50%);
        transition:opacity 0.1s;
        pointer-events:none;
      `;
      container.appendChild(dot);
      trail.push({ el: dot, x: 0, y: 0 });
    }
    dotsRef.current = trail;

    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    let positions = Array(N).fill({ x: 0, y: 0 });
    const animate = () => {
      positions[0] = { ...mouseRef.current };
      for (let i = 1; i < N; i++) {
        positions[i] = {
          x: positions[i].x + (positions[i - 1].x - positions[i].x) * 0.35,
          y: positions[i].y + (positions[i - 1].y - positions[i].y) * 0.35,
        };
      }
      trail.forEach((dot, i) => {
        dot.el.style.left   = positions[i].x + "px";
        dot.el.style.top    = positions[i].y + "px";
        dot.el.style.opacity = (1 - i / N) * 0.55;
      });
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frameRef.current);
      container.remove();
    };
  }, []);

  return null;
}

// ── Floating action dock ──────────────────────────────────────────────────────
function FloatingDock({ onCTA }) {
  const [visible, setVisible] = useState(false);
  const [hCreate, setHCreate] = useState(false);
  const [hJoin,   setHJoin]   = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      transition: "opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)",
      zIndex: 80,
      display: "flex", alignItems: "center", gap: 8,
      background: "#1A1814",
      border: "1px solid rgba(232,226,218,0.15)",
      borderRadius: 100,
      padding: "8px 10px 8px 16px",
      boxShadow: "0 8px 40px rgba(26,24,20,0.35), 0 2px 8px rgba(26,24,20,0.2)",
    }}>
      {/* Live pulse */}
      <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7, marginRight: 4 }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#E8632A", animation: "dock-ping 2s ease-in-out infinite", opacity: 0.6 }} />
        <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#E8632A", display: "block" }} />
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(245,240,232,0.55)", letterSpacing: "0.06em", marginRight: 8, whiteSpace: "nowrap" }}>
        Jump in now
      </span>

      <button
        onClick={() => onCTA("create")}
        onMouseEnter={() => setHCreate(true)}
        onMouseLeave={() => setHCreate(false)}
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13,
          color: "#16120E",
          background: hCreate ? "#D4571F" : "#E8632A",
          border: "none", borderRadius: 100,
          padding: "9px 18px", cursor: "pointer",
          transition: "all 0.18s ease",
          transform: hCreate ? "scale(1.03)" : "scale(1)",
        }}
      >
        + Create
      </button>

      <button
        onClick={() => onCTA("join")}
        onMouseEnter={() => setHJoin(true)}
        onMouseLeave={() => setHJoin(false)}
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13,
          color: hJoin ? "#F5F0E8" : "rgba(245,240,232,0.6)",
          background: hJoin ? "rgba(245,240,232,0.1)" : "transparent",
          border: "1px solid rgba(232,226,218,0.15)",
          borderRadius: 100,
          padding: "9px 18px", cursor: "pointer",
          transition: "all 0.18s ease",
        }}
      >
        ↗ Join
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate              = useNavigate();
  const { roomId: urlRoomId } = useParams();
  const lenisRef              = useRef(null);

  const [modal,           setModal]           = useState(null);
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");

  // ── Lenis smooth scroll ────────────────────────────────────────────────────
  useEffect(() => {
    // Dynamically import Lenis so it's a soft dep
    import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
      });
      lenisRef.current = lenis;

      // Sync with RAF
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);

      // Anchor links
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const target = document.querySelector(a.getAttribute("href"));
          if (target) lenis.scrollTo(target, { offset: -80 });
        });
      });
    }).catch(() => {
      // Lenis not installed — graceful fallback, page works fine
    });

    return () => { lenisRef.current?.destroy(); };
  }, []);

  useEffect(() => {
    if (urlRoomId) setModal({ intent: "join", prefillRoomId: urlRoomId });
  }, [urlRoomId]);

  const handleCTA = (intent) => setModal({ intent, prefillRoomId: "" });

  const handleCreateSuccess = (username) => {
    setPendingUsername(username); setModal(null); setDrawerOpen(true);
  };

  const handleMapSelect = (mapId) => {
    setDrawerOpen(false);
    import("../socket/socket").then(({ default: socket }) => {
      if (socket.disconnected) socket.connect();
      socket.once("room-created", ({ roomId, charIndex }) => {
        navigate(`/game/${roomId}`, { state: { username: pendingUsername, mapId, roomId, charIndex } });
      });
      socket.emit("create-room", { username: pendingUsername, mapId });
    });
  };

  // ── Join flow ─────────────────────────────────────────────────────────────
  // Uses join-success (not player-joined) so we receive charIndex from the
  // server — each player gets a unique character (1-6) and spawn position.
  const handleJoinSuccess = ({ username, roomId }) => {
    setModal(null);
    import("../socket/socket").then(({ default: socket }) => {
      if (socket.disconnected) socket.connect();

      socket.once("join-success", ({ charIndex, mapId }) => {
        navigate(`/game/${roomId}`, {
          state: { username, roomId, charIndex, mapId },
        });
      });

      socket.once("join-error", ({ message }) => {
        setModal({ intent: "join", prefillRoomId: roomId, error: message });
      });

      // Wait for connection before emitting — socket.connect() is async
      const emitJoin = () => socket.emit("join-room", { roomId, username });
      if (socket.connected) {
        emitJoin();
      } else {
        socket.once("connect", emitJoin);
      }
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: #FAF7F2; }
        body { background: #FAF7F2; -webkit-font-smoothing: antialiased; }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.6); opacity: 0; }
        }
        @keyframes dock-ping {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(2.2); opacity: 0; }
        }
        @keyframes float-a {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%       { transform: translateY(-14px) translateX(6px); }
          66%       { transform: translateY(-6px) translateX(-8px); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          40%       { transform: translateY(-10px) translateX(-5px); }
          70%       { transform: translateY(-18px) translateX(4px); }
        }
        @keyframes float-c {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50%       { transform: translateY(-8px) translateX(10px); }
        }
        @keyframes count-up-shimmer {
          from { background-position: -200% center; }
          to   { background-position: 200% center; }
        }
        @keyframes step-line-grow {
          from { height: 0; }
          to   { height: 100%; }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes grid-drift {
          0%   { transform: translateX(0) translateY(0); }
          100% { transform: translateX(32px) translateY(32px); }
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #FAF7F2; }
        ::-webkit-scrollbar-thumb { background: #D4C9B8; border-radius: 10px; }
        input::placeholder  { color: #C4B8A8 !important; }
        textarea::placeholder { color: #C4B8A8 !important; }

        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
      `}</style>

      <CursorTrail />

      <div style={{ background: "#FAF7F2", color: "#1A1814", overflowX: "hidden" }}>
        <Navbar />
        <main>
          <Hero       onCTA={handleCTA} />
          <HowItWorks />
          <Features />
          <Callout />
          <FAQ />
          <CTABanner  onCTA={handleCTA} />
        </main>
        <Footer />
      </div>

      <FloatingDock onCTA={handleCTA} />

      {modal && (
        <NameModal
          intent={modal.intent}
          prefillRoomId={modal.prefillRoomId}
          serverError={modal.error}
          onClose={() => setModal(null)}
          onCreateSuccess={handleCreateSuccess}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
      <MapDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSelect={handleMapSelect} />
    </>
  );
}