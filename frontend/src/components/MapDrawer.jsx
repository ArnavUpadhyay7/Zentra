import { useState } from "react";

const C = {
  bg:       "#FAF7F2",
  bgAlt:    "#F3EFE8",
  ink:      "#1A1814",
  inkMid:   "#6B6359",
  inkLight: "#A89E94",
  accent:   "#E8632A",
  accentBg: "#FDF1EB",
  border:   "#E8E2DA",
  borderDark: "#D4C9B8",
};

const FONTS = {
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
    preview: { bg: "#c8915a" },
  },
  {
    id: "tiny-dungeon",
    name: "Tiny Dungeon",
    description: "Stone corridors, candlelit rooms, hidden alcoves. A classic dungeon to explore with others.",
    image: "/assets/Sample.png",
    players: "Up to 6",
    tag: "Classic",
    preview: { bg: "#2a1f14" },
  },
];

const COMING_SOON = [
  { name: "Neon City",     description: "Rain-slicked streets and rooftop gardens.", emoji: "🏙️" },
  { name: "Forest Shrine", description: "Ancient trees and quiet clearings.",         emoji: "🌲" },
  { name: "Space Station", description: "Zero-g corridors and observation decks.",    emoji: "🚀" },
];

export default function MapDrawer({ open, onSelect, onClose }) {
  const [selected, setSelected] = useState("indoor");
  const [btnHover, setBtnHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes drawerFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes drawerSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .map-drawer-scroll::-webkit-scrollbar { width: 4px; }
        .map-drawer-scroll::-webkit-scrollbar-track { background: transparent; }
        .map-drawer-scroll::-webkit-scrollbar-thumb { background: ${C.borderDark}; border-radius: 4px; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 140,
          background: "rgba(26,24,20,0.35)",
          backdropFilter: "blur(4px)",
          animation: "drawerFadeIn 0.25s ease",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 480,
        background: C.bg,
        borderLeft: `1.5px solid ${C.border}`,
        boxShadow: "-12px 0 60px rgba(26,24,20,0.12)",
        zIndex: 150,
        display: "flex", flexDirection: "column",
        animation: "drawerSlideIn 0.38s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: FONTS.body,
      }}>

        {/* Header */}
        <div style={{
          padding: "28px 32px 24px",
          borderBottom: `1.5px solid ${C.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 10, fontWeight: 500,
              letterSpacing: "0.16em", textTransform: "uppercase",
              color: C.accent, marginBottom: 6,
            }}>
              Choose a Map
            </div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 26,
              color: C.ink, letterSpacing: "-0.025em", lineHeight: 1.1,
            }}>
              Pick your space
            </div>
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
              cursor: "pointer", fontSize: 14, transition: "all 0.18s ease",
              marginTop: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="map-drawer-scroll" style={{ flex: 1, overflowY: "auto", padding: "28px 32px 0" }}>

          {/* Section label */}
          <SectionLabel>Available</SectionLabel>

          {MAPS.map((map) => {
            const isSel = selected === map.id;
            return <MapCard key={map.id} map={map} selected={isSel} onClick={() => setSelected(map.id)} />;
          })}

          {/* Coming soon */}
          <div style={{ marginTop: 32 }}>
            <SectionLabel>Coming Soon</SectionLabel>
            {COMING_SOON.map((map, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 18px", borderRadius: 12,
                border: `1.5px solid ${C.border}`,
                background: C.bgAlt,
                marginBottom: 10,
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                  background: C.bg, border: `1.5px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {map.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 15, color: C.inkLight, marginBottom: 3, letterSpacing: "-0.01em" }}>
                    {map.name}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 13, color: C.borderDark, lineHeight: 1.5 }}>
                    {map.description}
                  </div>
                </div>
                <div style={{
                  fontFamily: FONTS.mono, fontSize: 9, fontWeight: 500,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: C.inkLight, background: C.bg,
                  border: `1px solid ${C.border}`,
                  padding: "4px 10px", borderRadius: 6, flexShrink: 0,
                }}>
                  Soon
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 120 }} />
        </div>

        {/* CTA footer */}
        <div style={{
          padding: "20px 32px",
          borderTop: `1.5px solid ${C.border}`,
          background: C.bg,
        }}>
          <button
            onClick={() => onSelect(selected)}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              width: "100%", padding: "15px 0",
              background: btnHover ? "#D4571F" : C.accent,
              border: "none", borderRadius: 12, color: C.bg,
              fontFamily: FONTS.body, fontWeight: 700, fontSize: 15,
              cursor: "pointer", letterSpacing: "-0.01em",
              boxShadow: `0 4px 20px ${C.accent}44`,
              transform: btnHover ? "translateY(-2px)" : "translateY(0)",
              transition: "all 0.2s ease",
            }}
          >
            Enter Space →
          </button>
          <p style={{
            textAlign: "center", fontFamily: FONTS.mono, fontSize: 10,
            color: C.inkLight, marginTop: 10, letterSpacing: "0.06em",
          }}>
            Select a map to create your room
          </p>
        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 20, height: 1.5, background: C.accent }} />
      <span style={{
        fontFamily: FONTS.mono, fontSize: 9, fontWeight: 500,
        letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent,
      }}>
        {children}
      </span>
    </div>
  );
}

function MapCard({ map, selected, onClick }) {
  const [h, setH] = useState(false);
  const active = selected || h;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        borderRadius: 16, overflow: "hidden", marginBottom: 14, cursor: "pointer",
        border: `1.5px solid ${selected ? C.accent : h ? C.borderDark : C.border}`,
        background: selected ? C.accentBg : h ? C.bgAlt : C.bg,
        boxShadow: selected
          ? `0 0 0 3px ${C.accent}22, 0 4px 20px rgba(26,24,20,0.08)`
          : h ? "0 4px 16px rgba(26,24,20,0.06)" : "none",
        transition: "all 0.22s ease",
      }}
    >
      {/* Preview image */}
      <div style={{ height: 168, background: map.preview.bg, position: "relative", overflow: "hidden" }}>
        <img
          src={map.image} alt={map.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            imageRendering: "pixelated",
            transform: h ? "scale(1.06)" : "scale(1.02)",
            transition: "transform 0.5s ease",
            opacity: 0.9,
          }}
        />

        {/* Tag badge */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          fontFamily: FONTS.mono, fontSize: 9, fontWeight: 500,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: selected ? C.bg : C.ink,
          background: selected ? C.accent : "rgba(250,247,242,0.88)",
          border: `1px solid ${selected ? "transparent" : C.border}`,
          backdropFilter: "blur(6px)",
          padding: "4px 10px", borderRadius: 6,
          transition: "all 0.2s ease",
        }}>
          {map.tag}
        </div>

        {/* Checkmark when selected */}
        {selected && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            width: 26, height: 26, borderRadius: "50%",
            background: C.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.bg, fontSize: 13,
            boxShadow: `0 2px 10px ${C.accent}66`,
          }}>
            ✓
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{
            fontFamily: FONTS.display, fontWeight: 700, fontSize: 17,
            color: C.ink, letterSpacing: "-0.02em",
          }}>
            {map.name}
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.inkLight, display: "flex", alignItems: "center", gap: 5, letterSpacing: "0.04em" }}>
            <span style={{ color: "#4ade80", fontSize: 8 }}>●</span> {map.players}
          </span>
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 13, color: C.inkMid, lineHeight: 1.65 }}>
          {map.description}
        </p>
      </div>
    </div>
  );
}