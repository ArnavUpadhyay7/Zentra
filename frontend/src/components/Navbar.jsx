import { useState } from "react";
import { NAV_LINKS } from "../constants/landing_cs";

const C = {
  bg:       "#FAF7F2",
  ink:      "#1A1814",
  inkMid:   "#6B6359",
  inkLight: "#A89E94",
  accent:   "#E8632A",
  border:   "#E8E2DA",
};

const FONTS = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'Plus Jakarta Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

export default function Navbar() {
  const [hovered, setHovered] = useState(null);
  const [ghHover, setGhHover] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
      `}</style>

      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(250,247,242,0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 40px",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>

          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            {/* Logo mark — warm square grid */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: C.ink,
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 3, padding: 7,
            }}>
              <div style={{ borderRadius: 2, background: C.bg }} />
              <div style={{ borderRadius: 2, background: `${C.bg}55` }} />
              <div style={{ borderRadius: 2, background: `${C.bg}55` }} />
              <div style={{ borderRadius: 2, background: C.accent }} />
            </div>
            <span style={{
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 17,
              color: C.ink, letterSpacing: "-0.025em",
            }}>
              Zentra
            </span>
          </a>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onMouseEnter={() => setHovered(label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  fontFamily: FONTS.body, fontSize: 14, fontWeight: 500,
                  color: hovered === label ? C.ink : C.inkMid,
                  textDecoration: "none",
                  padding: "7px 14px", borderRadius: 8,
                  background: hovered === label ? C.border : "transparent",
                  transition: "all 0.18s ease",
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* GitHub */}
          <a
            href="https://github.com/ArnavUpadhyay7/Zentra/"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setGhHover(true)}
            onMouseLeave={() => setGhHover(false)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: FONTS.body, fontSize: 13, fontWeight: 600,
              color: ghHover ? C.ink : C.inkMid,
              textDecoration: "none",
              padding: "8px 16px", borderRadius: 9,
              border: `1.5px solid ${ghHover ? C.ink : C.border}`,
              background: ghHover ? C.border : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.031 1.531 1.031.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>
    </>
  );
}