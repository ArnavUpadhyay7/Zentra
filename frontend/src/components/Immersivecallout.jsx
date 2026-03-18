import { useRef, useEffect, useState } from "react";
import {
  useScroll,
  useTransform,
  useSpring,
  motion,
  AnimatePresence,
} from "framer-motion";

const C = {
  bg:      "#FAF7F2",
  bgAlt:   "#F3EFE8",
  ink:     "#1A1814",
  inkMid:  "#6B6359",
  inkLight:"#A89E94",
  accent:  "#E8632A",
  accentBg:"#FDF1EB",
  border:  "#E8E2DA",
};
const F = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'Plus Jakarta Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

const ACCENT_RGB = "232,99,42";

const NODES = [
  { id: 0, cx: 50,   cy: 50,  r: 52, isPlayer: true,  label: "you"    },
  { id: 1, cx: -68,  cy: -30, r: 48, isPlayer: false, label: "alex"   },
  { id: 2, cx: 72,   cy: -58, r: 48, isPlayer: false, label: "priya"  },
  { id: 3, cx: -30,  cy: 72,  r: 48, isPlayer: false, label: "daniel" },
  { id: 4, cx: 110,  cy: 32,  r: 44, isPlayer: false, label: "sam"    },
  { id: 5, cx: -148, cy: 18,  r: 40, isPlayer: false, label: "taylor" },
  { id: 6, cx: 8,    cy: 152, r: 40, isPlayer: false, label: "morgan" },
];

const dist = (a, b) => Math.sqrt((a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2);

function ChatBubble({ cx, cy, progress }) {
  return (
    <motion.g
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: progress * 0.9, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <rect x={cx - 16} y={cy - 10} width={32} height={14} rx={7} fill={C.ink} opacity={0.88} />
      {[-6, 0, 6].map((dx, i) => (
        <motion.circle
          key={i}
          cx={cx + dx}
          cy={cy - 3}
          r={1.8}
          fill="#FAF7F2"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
        />
      ))}
    </motion.g>
  );
}

function NodeGroup({ node, player, progress }) {
  const d          = dist(player, node);
  const inRange    = d < player.r + node.r;
  const overlap    = Math.max(0, player.r + node.r - d);
  const activation = inRange ? Math.min(overlap / 60, 1) : 0;

  const connOpacity  = inRange ? activation * 0.55 * progress : 0;
  const ringOpacity  = 0.15 + activation * 0.35 * progress;
  const fillOpacity  = 0.06 + activation * 0.12 * progress;
  const dotColor     = inRange ? "#818CF8" : "#9ca3af";
  const labelOpacity = inRange ? 0.85 * progress : 0.35 * progress;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: node.id * 0.1 }}
    >
      {inRange && (
        <line
          x1={player.cx} y1={player.cy}
          x2={node.cx}   y2={node.cy}
          stroke={C.accent} strokeWidth={0.8} strokeDasharray="4 7"
          opacity={connOpacity}
        />
      )}
      <circle
        cx={node.cx} cy={node.cy} r={node.r}
        fill={`rgba(129,140,248,${fillOpacity})`}
        stroke={inRange ? "#818CF8" : "#9ca3af"}
        strokeWidth={0.8} strokeDasharray="4 8"
        opacity={ringOpacity}
      />
      {inRange && (
        <circle
          cx={node.cx} cy={node.cy} r={node.r * 0.65}
          fill={`rgba(129,140,248,${activation * progress * 0.12})`}
        />
      )}
      <circle cx={node.cx} cy={node.cy} r={5} fill={dotColor} opacity={0.7 + activation * 0.3} />
      <circle cx={node.cx - 1.5} cy={node.cy - 1.5} r={2} fill="rgba(255,255,255,0.45)" />
      <text
        x={node.cx} y={node.cy - node.r - 10}
        textAnchor="middle"
        fill={inRange ? "#FAF7F2" : C.inkMid}
        fontSize="9" fontFamily={F.mono} fontWeight="500" letterSpacing="0.1em"
        opacity={labelOpacity}
      >
        {node.label}
      </text>
      {inRange && activation > 0.7 && (
        <ChatBubble cx={node.cx} cy={node.cy - node.r - 28} progress={progress} />
      )}
    </motion.g>
  );
}

function PlayerNode({ node, progress }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.circle
        cx={node.cx} cy={node.cy} r={node.r + 12}
        fill="none" stroke={C.accent} strokeWidth={0.5}
        opacity={0.2 * progress}
        animate={{ r: [node.r + 8, node.r + 22, node.r + 8] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx={node.cx} cy={node.cy} r={node.r * 0.85}
        fill={`rgba(${ACCENT_RGB},${0.1 * progress})`}
      />
      <circle cx={node.cx} cy={node.cy} r={node.r}
        fill={`rgba(${ACCENT_RGB},0.08)`}
        stroke={C.accent} strokeWidth={1} strokeDasharray="5 8"
        opacity={0.6 + progress * 0.4}
      />
      <circle cx={node.cx} cy={node.cy} r={7} fill={C.accent} />
      <circle cx={node.cx - 2.5} cy={node.cy - 2.5} r={2.5} fill="rgba(255,255,255,0.5)" />
      <text
        x={node.cx} y={node.cy - node.r - 10}
        textAnchor="middle"
        fill={C.accent} fontSize="9" fontFamily={F.mono} fontWeight="600" letterSpacing="0.14em"
        opacity={0.9 * progress}
      >
        you
      </text>
    </motion.g>
  );
}

function ProximityCanvas({ progress }) {
  const player = NODES[0];
  return (
    <svg viewBox="-220 -200 440 400" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <pattern id="pgrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke={`rgba(${ACCENT_RGB},0.07)`} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect x="-220" y="-200" width="440" height="400" fill="url(#pgrid)" />
      {NODES.filter(n => !n.isPlayer).map(node => (
        <NodeGroup key={node.id} node={node} player={player} progress={progress} />
      ))}
      <PlayerNode node={player} progress={progress} />
    </svg>
  );
}

const PHASES = [
  {
    eyebrow:  "The idea",
    headline: "Conversations shouldn't feel scheduled.",
    sub:      "Real connection is spontaneous. Proximity is the only trigger you need.",
  },
  {
    eyebrow:  "Proximity",
    headline: "Walk up.\nYou're talking.",
    sub:      "No invite. No link. Move into someone's radius and your voice carries — naturally.",
  },
  {
    eyebrow:  "Spatial presence",
    headline: "Just move. Talk when it matters.",
    sub:      "Step away and you're gone. The world keeps breathing around you.",
  },
];

function PhaseText({ phase, headlineColor, subColor }) {
  const { eyebrow, headline, sub } = PHASES[Math.min(phase, PHASES.length - 1)];
  // Phase 0 entry: already visible (no fade-in from nothing).
  // Phase 1+ transitions: slide up from below.
  const isEntry = phase === 0;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: isEntry ? 1 : 0, y: isEntry ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: "none" }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 28, height: 1.5, background: C.accent }} />
          <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent }}>
            {eyebrow}
          </span>
        </div>
        {/* headline color cross-fades ink→white as dark bg fades in */}
        <motion.h2 style={{
          fontFamily: F.display, fontWeight: 900, fontStyle: "italic",
          fontSize: "clamp(2rem, 3.8vw, 3.2rem)",
          color: headlineColor, lineHeight: 1.12, letterSpacing: "-0.025em",
          marginBottom: 24, whiteSpace: "pre-line",
        }}>
          {headline}
        </motion.h2>
        <motion.p style={{
          fontFamily: F.body, fontSize: "clamp(14px, 1.3vw, 16px)",
          color: subColor, lineHeight: 1.8, maxWidth: 360,
        }}>
          {sub}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}

function ScrollDots({ phase, darkMode }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {PHASES.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width:      i === phase ? 20 : 6,
            background: i === phase
              ? C.accent
              : darkMode ? "rgba(232,226,218,0.3)" : "rgba(26,24,20,0.2)",
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: 6, borderRadius: 100 }}
        />
      ))}
    </div>
  );
}

export default function ImmersiveCallout() {
  const sectionRef                    = useRef(null);
  const [phase, setPhase]             = useState(0);
  const [progressVal, setProgressVal] = useState(0);

  const { scrollYProgress } = useScroll({
    target:       sectionRef,
    offset:       ["start start", "end end"],
    // REQUIRED for Lenis: prevents Framer from using useLayoutEffect internally,
    // which conflicts with Lenis's custom scroll RAF loop.
    layoutEffect: false,
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 80,
    damping:   25,
    restDelta: 0.0005,
  });

  useEffect(() => {
    return smooth.on("change", (v) => {
      setProgressVal(v);
      if (v < 0.33)      setPhase(0);
      else if (v < 0.66) setPhase(1);
      else               setPhase(2);
    });
  }, [smooth]);

  // Entry: portal + canvas fully visible immediately, dark bg fades in mid-scroll
  const portalScale   = useTransform(smooth, [0,    0.5,  1   ], [0.85, 1.1,  1.6 ]);
  const portalOpacity = useTransform(smooth, [0,    0.08, 0.75, 1], [0.55, 1, 1,   0]);
  const canvasScale   = useTransform(smooth, [0,    0.35, 1   ], [0.88, 1,    1.08]);
  const canvasOpacity = useTransform(smooth, [0,    0.1,  0.85, 1], [0.7, 1,  1,   0.6]);
  // Dark bg starts at 0, fully dark by 35% scroll — gives time to read on light bg first
  const bgDark        = useTransform(smooth, [0,    0.35       ], [0,   1   ]);
  const gridOpacity   = useTransform(smooth, [0,    0.2,  0.8  ], [0,   0.12, 0.06]);
  const scanlineY     = useTransform(smooth, [0,    1          ], ["-8%", "108%"]);
  const textY         = useTransform(smooth, [0,    1          ], ["0%", "-6%"]);
  // Text color: ink on light bg → white on dark bg (tracks bgDark)
  const headlineColor = useTransform(smooth, [0, 0.35], [C.ink, "#FAF7F2"]);
  const subColor      = useTransform(smooth, [0, 0.35], ["rgba(26,24,20,0.6)", "rgba(250,247,242,0.55)"]);

  const canvasProgress = Math.min(progressVal * 2.5, 1);

  return (
    <>
      <style>{`
        /*
          STICKY PIN RULES — do not change these
          ───────────────────────────────────────
          1. .zh-immersive-outer: NO overflow property at all.
             Any overflow value other than 'visible' on a scroll-container
             ancestor breaks position:sticky for all descendants.

          2. .zh-immersive-sticky: overflow:clip (NOT overflow:hidden).
             overflow:hidden creates a new block formatting context AND a new
             scroll container, which prevents position:sticky from working.
             overflow:clip clips visuals without creating a scroll container.

          3. The parent in Landing.jsx that applies filter/opacity/transform
             must NOT wrap the <Callout /> — those CSS properties create a new
             containing block, which also breaks sticky. See Landing.jsx fix.
        */
        .zh-immersive-outer {
          position: relative;
          height: 300vh;
          /* NO overflow here — intentionally omitted */
        }
        .zh-immersive-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: clip; /* clips visually, does NOT break sticky */
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 860px) {
          .zh-immersive-grid   { grid-template-columns: 1fr !important; gap: 0 !important; }
          .zh-immersive-canvas { display: none !important; }
        }
      `}</style>

      {/*
        OUTER SECTION — ref is here, NOT on the sticky child.
        useScroll tracks this element. Its 300vh height is the scroll budget.
        No filter / transform / opacity on this element.
      */}
      <section ref={sectionRef} className="zh-immersive-outer">

        {/*
          STICKY CHILD — pins while outer section scrolls.
          overflow:clip prevents visual bleed without breaking sticky.
        */}
        <div className="zh-immersive-sticky">

          {/* Base bg (light, shown at scroll=0) */}
          <div style={{ position: "absolute", inset: 0, background: C.bgAlt, zIndex: 0 }} />

          {/* Dark bg fades in */}
          <motion.div style={{ position: "absolute", inset: 0, background: C.ink, opacity: bgDark, zIndex: 1 }} />

          {/* Grid overlay */}
          <motion.div style={{
            position: "absolute", inset: "-32px",
            backgroundImage:
              "linear-gradient(rgba(232,226,218,0.12) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(232,226,218,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: gridOpacity, zIndex: 2, pointerEvents: "none",
          }} />

          {/* Scanline */}
          <motion.div style={{
            position: "absolute", left: 0, right: 0, top: scanlineY,
            height: "2px",
            background: `linear-gradient(90deg, transparent, rgba(${ACCENT_RGB},0.18), transparent)`,
            zIndex: 3, pointerEvents: "none",
          }} />

          {/* Outer portal ring */}
          <motion.div style={{
            position: "absolute",
            width: "min(54vw, 54vh)", height: "min(54vw, 54vh)",
            borderRadius: "50%",
            border: `1px solid rgba(${ACCENT_RGB},0.22)`,
            boxShadow: `0 0 80px 4px rgba(${ACCENT_RGB},0.08), inset 0 0 60px rgba(${ACCENT_RGB},0.05)`,
            scale: portalScale, opacity: portalOpacity, zIndex: 2, pointerEvents: "none",
          }} />

          {/* Inner portal ring */}
          <motion.div style={{
            position: "absolute",
            width: "min(40vw, 40vh)", height: "min(40vw, 40vh)",
            borderRadius: "50%",
            border: `0.5px solid rgba(${ACCENT_RGB},0.13)`,
            scale: portalScale, opacity: portalOpacity, zIndex: 2, pointerEvents: "none",
          }} />

          {/* Ambient glow */}
          <motion.div style={{
            position: "absolute", right: "10%", top: "18%",
            width: 440, height: 440, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${ACCENT_RGB},0.07) 0%, transparent 70%)`,
            opacity: portalOpacity, zIndex: 1, pointerEvents: "none",
          }} />

          {/* Two-column content */}
          <div
            className="zh-immersive-grid"
            style={{
              position: "relative", zIndex: 10,
              width: "100%", maxWidth: 1200,
              padding: "0 40px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 80,
              alignItems: "center",
            }}
          >
            <motion.div style={{ y: textY }}>
              <PhaseText phase={phase} headlineColor={headlineColor} subColor={subColor} />
              <div style={{ marginTop: 48 }}>
                <ScrollDots phase={phase} darkMode={progressVal > 0.2} />
                <motion.p style={{
                  fontFamily: F.mono, fontSize: 9, letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: subColor,
                  marginTop: 12,
                }}>
                  Scroll to explore
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              className="zh-immersive-canvas"
              style={{
                scale: canvasScale, opacity: canvasOpacity,
                transformOrigin: "center center",
                width: "100%", aspectRatio: "1 / 1",
                maxWidth: 460, justifySelf: "center",
              }}
            >
              <ProximityCanvas progress={canvasProgress} />
            </motion.div>
          </div>

        </div>
      </section>
    </>
  );
}