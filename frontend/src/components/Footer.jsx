import { useState } from "react";

const C = {
  bg:       "#FAF7F2",
  bgAlt:    "#F3EFE8",
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

const COLS = [
  { heading: "Product",   links: ["Features", "How it works", "FAQ", "Changelog"] },
  { heading: "Resources", links: ["Docs", "GitHub", "Support", "Status"] },
  { heading: "Legal",     links: ["Privacy", "Terms", "Cookies"] },
];

function FooterLink({ children, small }) {
  const [h, setH] = useState(false);
  return (
    <a
      href="#"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontFamily: small ? FONTS.mono : FONTS.body,
        fontSize: small ? 11 : 14,
        letterSpacing: small ? "0.04em" : 0,
        color: h ? C.ink : C.inkMid,
        textDecoration: "none",
        transition: "color 0.18s ease",
      }}
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer style={{ background: C.bgAlt, borderTop: `1.5px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px 40px" }}>

        {/* Top grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 64, marginBottom: 72,
          paddingBottom: 64, borderBottom: `1.5px solid ${C.border}`,
        }}>

          {/* Brand col */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: C.ink,
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, padding: 7,
              }}>
                <div style={{ borderRadius: 2, background: C.bg }} />
                <div style={{ borderRadius: 2, background: `${C.bg}55` }} />
                <div style={{ borderRadius: 2, background: `${C.bg}55` }} />
                <div style={{ borderRadius: 2, background: C.accent }} />
              </div>
              <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, color: C.ink, letterSpacing: "-0.025em" }}>
                Zentra
              </span>
            </div>

            <p style={{ fontFamily: FONTS.body, fontSize: 14, color: C.inkMid, lineHeight: 1.75, maxWidth: 220, marginBottom: 28 }}>
              A simpler, more human way to connect with people remotely.
            </p>

            <div style={{
              display: "inline-flex", alignItems: "center",
              fontFamily: FONTS.mono, fontSize: 10, color: C.inkLight,
              letterSpacing: "0.08em", textTransform: "uppercase",
              background: C.bg, border: `1px solid ${C.border}`,
              padding: "6px 14px", borderRadius: 100,
            }}>
              React · Phaser · Socket.io · WebRTC
            </div>
          </div>

          {/* Link cols */}
          {COLS.map((col) => (
            <div key={col.heading}>
              <p style={{
                fontFamily: FONTS.mono, fontSize: 10, fontWeight: 500,
                color: C.inkLight, textTransform: "uppercase", letterSpacing: "0.16em",
                marginBottom: 20,
              }}>
                {col.heading}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map((link) => (
                  <li key={link}><FooterLink>{link}</FooterLink></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <p style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.inkLight, letterSpacing: "0.04em" }}>
            © 2025 VirtualSpace. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 28 }}>
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <FooterLink key={l} small>{l}</FooterLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}