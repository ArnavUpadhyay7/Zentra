import { useState } from "react";

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

const MAPS = [
  {
    id: "indoor",
    name: "Roguelike Indoor",
    description: "Warm wooden rooms, winding corridors, and cozy meeting spaces. The go-to space for hangouts.",
    image: "/assets/Sample2.png",
    players: "Up to 6",
    tag: "New",
    tagColor: "#4ADE80",
    preview: { bg: "#c8915a" },
  },
  {
    id: "tiny-dungeon",
    name: "Tiny Dungeon",
    description: "Stone corridors, candlelit rooms, hidden alcoves. A classic dungeon to explore with others.",
    image: "/assets/Sample.png",
    players: "Up to 6",
    tag: "Classic",
    tagColor: "#818CF8",
    preview: { bg: "#2a1f14" },
  },
];

const COMING_SOON = [
  { name: "Neon City",     description: "Rain-slicked streets and rooftop gardens.", emoji: "🏙️", color: "#60A5FA" },
  { name: "Forest Shrine", description: "Ancient trees and quiet clearings.",         emoji: "🌲", color: "#4ADE80" },
  { name: "Space Station", description: "Zero-g corridors and observation decks.",    emoji: "🚀", color: "#F0ABFC" },
];

export default function MapDrawer({ open, onSelect, onClose }) {
  const [selected,   setSelected]   = useState("indoor");
  const [btnHover,   setBtnHover]   = useState(false);
  const [closeHover, setCloseHover] = useState(false);
  const [entering,   setEntering]   = useState(false);

  if (!open) return null;

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    // brief visual feedback before handing off
    setTimeout(() => {
      setEntering(false);
      onSelect(selected);
    }, 180);
  };

  const selectedMap = MAPS.find(m => m.id === selected);

  return (
    <>
      <style>{`
        @keyframes drawerFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes drawerSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes drawerPulse   {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,99,42,0); }
          50%     { box-shadow: 0 0 0 6px rgba(232,99,42,0.12); }
        }
        .map-drawer-scroll::-webkit-scrollbar { width: 4px; }
        .map-drawer-scroll::-webkit-scrollbar-track { background: transparent; }
        .map-drawer-scroll::-webkit-scrollbar-thumb { background: ${C.borderDark}; border-radius: 4px; }
        .map-card-hover:hover { transform: translateY(-1px); }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 140,
          background: "rgba(26,24,20,0.38)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          animation: "drawerFadeIn 0.25s ease",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 500,
        background: C.bg,
        borderLeft: `1.5px solid ${C.border}`,
        boxShadow: "-16px 0 80px rgba(26,24,20,0.14)",
        zIndex: 150,
        display: "flex", flexDirection: "column",
        animation: "drawerSlideIn 0.42s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: F.body,
      }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          padding: "28px 32px 22px",
          borderBottom: `1.5px solid ${C.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          background: C.bg,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 20, height: 1.5, background: C.accent }} />
              <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent }}>
                Choose a Map
              </span>
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: C.ink, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              Pick your space
            </div>
            <p style={{ fontFamily: F.body, fontSize: 13, color: C.inkLight, marginTop: 6, lineHeight: 1.5 }}>
              Each map has its own vibe. You can switch later.
            </p>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`,
              background: closeHover ? C.bgAlt : C.bg,
              color: closeHover ? C.ink : C.inkLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 13, transition: "all 0.18s ease",
              flexShrink: 0, marginTop: 2,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable content ──────────────────────────────── */}
        <div className="map-drawer-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 32px 0" }}>

          <SectionLabel>Available now</SectionLabel>

          {MAPS.map((map) => (
            <MapCard
              key={map.id}
              map={map}
              selected={selected === map.id}
              onClick={() => setSelected(map.id)}
            />
          ))}

          {/* Coming soon */}
          <div style={{ marginTop: 28 }}>
            <SectionLabel>Coming soon</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {COMING_SOON.map((map, i) => (
                <ComingSoonCard key={i} map={map} />
              ))}
            </div>
          </div>

          <div style={{ height: 120 }} />
        </div>

        {/* ── CTA footer ──────────────────────────────────────── */}
        <div style={{
          padding: "18px 32px 22px",
          borderTop: `1.5px solid ${C.border}`,
          background: "#F8F4EE",
        }}>
          {/* Selected map reminder */}
          {selectedMap && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginBottom: 14, padding: "10px 14px",
              background: C.accentBg, borderRadius: 10,
              border: `1px solid ${C.accent}22`,
            }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent }}>Selected</span>
              <span style={{ width: 1, height: 12, background: `${C.accent}33`, flexShrink: 0 }} />
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: C.ink, letterSpacing: "-0.01em" }}>{selectedMap.name}</span>
              <span style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 9, color: C.inkLight, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
                {selectedMap.players}
              </span>
            </div>
          )}

          <button
            onClick={handleEnter}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            disabled={entering}
            style={{
              width: "100%", padding: "15px 0",
              background: entering ? "#D4571F" : btnHover ? "#D4571F" : C.accent,
              border: "none", borderRadius: 12, color: "#FAF7F2",
              fontFamily: F.body, fontWeight: 700, fontSize: 15,
              cursor: entering ? "default" : "pointer",
              letterSpacing: "-0.01em",
              boxShadow: entering
                ? `0 2px 12px ${C.accent}33`
                : `0 4px 20px ${C.accent}44`,
              transform: btnHover && !entering ? "translateY(-2px)" : "translateY(0)",
              transition: "all 0.2s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {entering ? (
              <>
                <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                Creating room…
              </>
            ) : (
              "Enter Space →"
            )}
          </button>
          <p style={{ textAlign: "center", fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginTop: 10, letterSpacing: "0.06em" }}>
            You'll be loading in just a moment
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 20, height: 1.5, background: C.accent }} />
      <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent }}>
        {children}
      </span>
    </div>
  );
}

function MapCard({ map, selected, onClick }) {
  const [h, setH] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="map-card-hover"
      style={{
        borderRadius: 16, overflow: "hidden", marginBottom: 12, cursor: "pointer",
        border: `1.5px solid ${selected ? C.accent : h ? C.borderDark : C.border}`,
        background: selected ? C.accentBg : h ? C.bgAlt : C.bg,
        boxShadow: selected
          ? `0 0 0 3px ${C.accent}1A, 0 6px 24px rgba(26,24,20,0.1)`
          : h ? "0 4px 16px rgba(26,24,20,0.06)" : "none",
        transition: "all 0.24s cubic-bezier(0.16,1,0.3,1)",
        position: "relative",
      }}
    >
      {/* Preview image */}
      <div style={{ height: 156, background: map.preview.bg, position: "relative", overflow: "hidden" }}>
        <img
          src={map.image}
          alt={map.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            imageRendering: "pixelated",
            transform: h || selected ? "scale(1.06)" : "scale(1.02)",
            transition: "transform 0.55s ease",
            opacity: 0.88,
          }}
        />

        {/* Gradient overlay at bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
          background: "linear-gradient(to top, rgba(26,24,20,0.35), transparent)",
          pointerEvents: "none",
        }} />

        {/* Tag badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          fontFamily: F.mono, fontSize: 9, fontWeight: 500,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: selected ? "#FAF7F2" : C.ink,
          background: selected ? C.accent : "rgba(250,247,242,0.92)",
          border: `1px solid ${selected ? "transparent" : C.border}`,
          backdropFilter: "blur(8px)",
          padding: "4px 10px", borderRadius: 6,
          transition: "all 0.2s ease",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: selected ? "rgba(255,255,255,0.7)" : map.tagColor, display: "inline-block" }} />
          {map.tag}
        </div>

        {/* Player count bottom-right */}
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          fontFamily: F.mono, fontSize: 9, color: "rgba(250,247,242,0.85)",
          display: "flex", alignItems: "center", gap: 4,
          letterSpacing: "0.06em",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", display: "block" }} />
          {map.players}
        </div>

        {/* Selected checkmark */}
        {selected && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            width: 24, height: 24, borderRadius: "50%",
            background: C.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 2px 10px ${C.accent}66`,
          }}>
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3L9 1" stroke="#FAF7F2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 18px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {map.name}
          </span>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.inkMid, lineHeight: 1.65, margin: 0 }}>
          {map.description}
        </p>
      </div>
    </div>
  );
}

function ComingSoonCard({ map }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px", borderRadius: 12,
      border: `1.5px solid ${C.border}`,
      background: C.bgAlt,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: C.bg, border: `1.5px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>
        {map.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: C.inkLight, marginBottom: 2, letterSpacing: "-0.01em" }}>
          {map.name}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12, color: C.borderDark, lineHeight: 1.5 }}>
          {map.description}
        </div>
      </div>
      <div style={{
        fontFamily: F.mono, fontSize: 8, fontWeight: 500,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: C.inkLight, background: C.bg,
        border: `1px solid ${C.border}`,
        padding: "4px 9px", borderRadius: 6, flexShrink: 0,
        whiteSpace: "nowrap",
      }}>
        Soon
      </div>
    </div>
  );
}