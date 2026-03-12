import { useState } from "react";

const MAPS = [
  {
    id: "indoor",
    name: "Roguelike Indoor",
    description: "Warm wooden rooms, winding corridors, and cozy meeting spaces. The go-to space for hangouts.",
    image: "/assets/Sample2.png",
    players: "Up to 6",
    tag: "New",
    tagColor: "rgba(99,102,241,0.85)",
    preview: { bg: "#c8915a" },
  },
  {
    id: "tiny-dungeon",
    name: "Tiny Dungeon",
    description: "Stone corridors, candlelit rooms, hidden alcoves. A classic dungeon to explore with others.",
    image: "/assets/Sample.png",
    players: "Up to 6",
    tag: "Classic",
    tagColor: "rgba(0,0,0,0.55)",
    preview: { bg: "#1a1a2e" },
  },
];

const COMING_SOON = [
  { name: "Neon City",      description: "Rain-slicked streets and rooftop gardens.", emoji: "🏙️" },
  { name: "Forest Shrine",  description: "Ancient trees and quiet clearings.",         emoji: "🌲" },
  { name: "Space Station",  description: "Zero-g corridors and observation decks.",    emoji: "🚀" },
];

export default function MapDrawer({ open, onSelect, onClose }) {
  const [selected, setSelected] = useState("indoor");

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.25)", backdropFilter: "blur(2px)",
        zIndex: 40, animation: "fadeIn 0.2s ease",
      }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "460px",
        background: "#ffffff", borderLeft: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.10)", zIndex: 50,
        display: "flex", flexDirection: "column",
        animation: "slideIn 0.3s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{
          padding: "28px 28px 22px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em",
              color: "#6366f1", textTransform: "uppercase", marginBottom: "5px",
            }}>Choose a Map</div>
            <div style={{
              fontSize: "22px", fontWeight: 800, color: "#030712",
              fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.03em",
            }}>Pick your space</div>
          </div>
          <button onClick={onClose} style={{
            background: "#f9fafb", border: "1px solid rgba(0,0,0,0.08)",
            color: "#9ca3af", width: "34px", height: "34px", borderRadius: "8px",
            cursor: "pointer", fontSize: "14px", display: "flex",
            alignItems: "center", justifyContent: "center", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#9ca3af"; }}
          >✕</button>
        </div>

        {/* Map list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0" }}>
          <div style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
            color: "#9ca3af", textTransform: "uppercase", marginBottom: "12px",
          }}>Available</div>

          {MAPS.map(map => {
            const isSelected = selected === map.id;
            return (
              <div key={map.id} onClick={() => setSelected(map.id)} style={{
                borderRadius: "16px",
                border: isSelected ? "2px solid #6366f1" : "2px solid rgba(0,0,0,0.07)",
                background: isSelected ? "rgba(99,102,241,0.04)" : "#fafafa",
                marginBottom: "12px", cursor: "pointer",
                transition: "all 0.18s ease", overflow: "hidden",
                boxShadow: isSelected ? "0 0 0 4px rgba(99,102,241,0.08)" : "none",
              }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.border = "2px solid rgba(0,0,0,0.14)"; e.currentTarget.style.background = "#f3f4f6"; } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.border = "2px solid rgba(0,0,0,0.07)"; e.currentTarget.style.background = "#fafafa"; } }}
              >
                {/* Preview image */}
                <div style={{
                  height: "160px", background: map.preview.bg,
                  overflow: "hidden", position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <img src={map.image} alt={map.name} style={{
                    width: "100%", height: "100%", objectFit: "cover",
                    imageRendering: "pixelated", opacity: 0.9, transform: "scale(1.05)",
                  }} />
                  <div style={{
                    position: "absolute", top: "12px", left: "12px",
                    background: isSelected ? "#6366f1" : map.tagColor,
                    color: "#fff", fontSize: "10px", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    padding: "4px 10px", borderRadius: "6px",
                    backdropFilter: "blur(4px)", transition: "all 0.18s",
                  }}>{map.tag}</div>
                  {isSelected && (
                    <div style={{
                      position: "absolute", top: "12px", right: "12px",
                      background: "#6366f1", borderRadius: "50%",
                      width: "24px", height: "24px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", color: "#fff",
                      boxShadow: "0 2px 8px rgba(99,102,241,0.5)",
                    }}>✓</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{
                      fontSize: "16px", fontWeight: 800, color: "#030712",
                      fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.02em",
                    }}>{map.name}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "#22c55e", fontSize: "8px" }}>●</span> {map.players}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>
                    {map.description}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Coming soon */}
          <div style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
            color: "#9ca3af", textTransform: "uppercase", margin: "24px 0 12px",
          }}>Coming Soon</div>

          {COMING_SOON.map((map, i) => (
            <div key={i} style={{
              borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.06)",
              background: "#fafafa", marginBottom: "10px", padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "10px",
                background: "#f3f4f6", flexShrink: 0, fontSize: "20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(0,0,0,0.06)",
              }}>{map.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "14px", fontWeight: 600, color: "#9ca3af",
                  marginBottom: "3px", fontFamily: "'Bricolage Grotesque', sans-serif",
                }}>{map.name}</div>
                <div style={{ fontSize: "12px", color: "#d1d5db", lineHeight: 1.4 }}>
                  {map.description}
                </div>
              </div>
              <div style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#d1d5db",
                background: "#f3f4f6", border: "1px solid rgba(0,0,0,0.06)",
                padding: "4px 10px", borderRadius: "6px", flexShrink: 0,
              }}>Soon</div>
            </div>
          ))}

          <div style={{ height: "100px" }} />
        </div>

        {/* CTA */}
        <div style={{ padding: "18px 24px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#ffffff" }}>
          <button onClick={() => onSelect(selected)} style={{
            width: "100%", padding: "15px",
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            border: "none", borderRadius: "12px", color: "#fff",
            fontSize: "15px", fontWeight: 700, cursor: "pointer",
            fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.01em",
            transition: "opacity 0.15s, transform 0.15s",
            boxShadow: "0 2px 0 #4338ca, 0 4px 20px rgba(99,102,241,0.35)",
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Enter Space →
          </button>
          <div style={{ textAlign: "center", fontSize: "12px", color: "#d1d5db", marginTop: "10px" }}>
            Select a map to create your room
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}