// ZentraWorld.jsx — ambient proximity simulation
// Props:
//   night  {boolean}  — switch to night palette (no re-init needed)
//   active {boolean}  — pause the loop when card is flipped away

import { useRef, useEffect, useCallback } from "react";

// ─── Palettes ─────────────────────────────────────────────────────────────────
export const DAY = {
  bg:     "#FAF7F2",
  grid:   "#D4C9B8",
  gridOp: 0.18,
  ink:    "#1A1814",
  accent: "#E8632A",
  bubbleText: "#FAF7F2",
  bubbleBg:   "#1A1814",
  avatarColors: ["#E8632A","#4ADE80","#A78BFA","#60A5FA","#F59E0B","#F472B6","#34D399","#FB923C"],
  glowBase: 0.10,
  lineOp:   0.18,
};

export const NIGHT = {
  bg:     "#13111E",
  grid:   "#29264A",
  gridOp: 0.30,
  ink:    "#EDE9FF",
  accent: "#C084FC",
  bubbleText: "#13111E",
  bubbleBg:   "#EDE9FF",
  avatarColors: ["#C084FC","#67E8F9","#818CF8","#F0ABFC","#38BDF8","#86EFAC","#A5F3FC","#FCA5A5"],
  glowBase: 0.16,
  lineOp:   0.28,
};

export const TALK_RADIUS  = 72;
const WANDER_SPEED = 0.38;
const CURSOR_SEEK  = 0.70;
const MESSAGES     = ["hey 👋","yo!","nice","haha","same","true","lol","omg","❤️","🎉"];

// ─── Avatar class (exported so Playground can reuse) ─────────────────────────
export class Avatar {
  constructor(id, x, y, color, isVisitor = false) {
    this.id          = id;
    this.x  = x; this.y  = y;
    this.tx = x; this.ty = y;
    this.vx = 0; this.vy = 0;
    this.color       = color;
    this.isVisitor   = isVisitor;
    this.radius      = isVisitor ? 9 : 7;
    this.alpha       = isVisitor ? 0 : 1;
    this.talking     = false;
    this.msg         = "";
    this.msgTimer    = 0;
    this.wanderTimer = Math.random() * 180;
    this.facing      = 0;
    this.entering    = !isVisitor && Math.random() < 0.15;
    this.leaving     = false;
    this.typeTimer   = 0;
    this.showType    = false;
  }
  setNewWander(W, H, pad) {
    this.tx = pad + Math.random() * (W - pad * 2);
    this.ty = pad + Math.random() * (H - pad * 2);
    this.wanderTimer = 120 + Math.random() * 240;
  }
}

// ─── Shared draw helpers ──────────────────────────────────────────────────────
export function drawAvatar(ctx, a) {
  const { x, y, radius: r, color, facing } = a;
  ctx.shadowColor = color + "55"; ctx.shadowBlur = 9;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  const hg = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, r);
  hg.addColorStop(0, "rgba(255,255,255,0.38)"); hg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  const fx = x + Math.cos(facing) * r * 0.55, fy = y + Math.sin(facing) * r * 0.55;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, Math.PI * 2); ctx.fill();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

export function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ZentraWorld({ night = false, active = true }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const rafRef    = useRef(null);
  const nightRef  = useRef(night);
  useEffect(() => { nightRef.current = night; }, [night]);

  const pal = () => nightRef.current ? NIGHT : DAY;

  const initSim = useCallback((W, H) => {
    const p = pal();
    const COUNT = 8, pad = 60;
    const avatars = [];
    for (let i = 0; i < COUNT; i++) {
      const color = p.avatarColors[i % p.avatarColors.length];
      const x = pad + Math.random() * (W - pad * 2);
      const y = pad + Math.random() * (H - pad * 2);
      const a = new Avatar(i, x, y, color);
      if (a.entering) { a.alpha = 0; a.x = -20; a.y = pad + Math.random() * (H - pad * 2); }
      avatars.push(a);
    }
    stateRef.current = {
      avatars, visitor: null,
      mouseInCanvas: false, mouseX: W/2, mouseY: H/2,
      W, H, pad, tick: 0,
      nextJoinTick: 600 + Math.random() * 600,
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const onResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width  = rect.width  + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(dpr, dpr);
      initSim(rect.width, rect.height);
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement);

    const onMouseEnter = (e) => {
      const s = stateRef.current; if (!s) return;
      s.mouseInCanvas = true;
      const rect = canvas.getBoundingClientRect();
      s.mouseX = e.clientX - rect.left; s.mouseY = e.clientY - rect.top;
      if (!s.visitor) {
        s.visitor = new Avatar(999, s.mouseX, s.mouseY, pal().accent, true);
        s.visitor.alpha = 0;
      }
    };
    const onMouseMove = (e) => {
      const s = stateRef.current; if (!s || !s.mouseInCanvas) return;
      const rect = canvas.getBoundingClientRect();
      s.mouseX = e.clientX - rect.left; s.mouseY = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      const s = stateRef.current; if (!s) return;
      s.mouseInCanvas = false;
      if (s.visitor) s.visitor.leaving = true;
    };
    canvas.addEventListener("mouseenter", onMouseEnter);
    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const step = () => {
      const s = stateRef.current; if (!s) return;
      const { avatars, W, H, pad } = s;
      s.tick++;
      const all = s.visitor ? [...avatars, s.visitor] : avatars;

      if (s.visitor) {
        const v = s.visitor;
        if (v.leaving) { v.alpha = Math.max(0, v.alpha - 0.04); if (v.alpha <= 0) s.visitor = null; }
        else {
          v.alpha = Math.min(1, v.alpha + 0.06);
          const dx = s.mouseX - v.x, dy = s.mouseY - v.y;
          v.x += dx * 0.18; v.y += dy * 0.18;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) v.facing = Math.atan2(dy, dx);
        }
      }

      if (s.tick >= s.nextJoinTick && avatars.length < 10) {
        const p = pal();
        const color = p.avatarColors[Math.floor(Math.random() * p.avatarColors.length)];
        const edge = Math.floor(Math.random() * 4);
        let nx, ny;
        if      (edge === 0) { nx = -20;    ny = pad + Math.random() * (H - pad * 2); }
        else if (edge === 1) { nx = W + 20; ny = pad + Math.random() * (H - pad * 2); }
        else if (edge === 2) { nx = pad + Math.random() * (W - pad * 2); ny = -20; }
        else                 { nx = pad + Math.random() * (W - pad * 2); ny = H + 20; }
        const na = new Avatar(Date.now(), nx, ny, color);
        na.alpha = 0; na.entering = false; na.setNewWander(W, H, pad);
        avatars.push(na);
        s.nextJoinTick = s.tick + 700 + Math.random() * 900;
        if (avatars.length >= 9) {
          const li = Math.floor(Math.random() * (avatars.length - 1));
          setTimeout(() => { const c = stateRef.current; if (c && c.avatars[li]) c.avatars[li].leaving = true; }, 3000 + Math.random() * 2000);
        }
      }

      for (let i = avatars.length - 1; i >= 0; i--) {
        const a = avatars[i];
        if (!a.leaving) a.alpha = Math.min(1, a.alpha + 0.025);
        if (a.leaving) { a.alpha -= 0.025; if (a.alpha <= 0) { avatars.splice(i, 1); continue; } }

        let seekX = 0, seekY = 0, seekW = 0;
        a.wanderTimer--; if (a.wanderTimer <= 0) a.setNewWander(W, H, pad);

        if (s.visitor && !s.visitor.leaving) {
          const dx = s.visitor.x - a.x, dy = s.visitor.y - a.y, dist = Math.hypot(dx, dy);
          if (dist < TALK_RADIUS * 2.5 && dist > 10) { seekX += (dx/dist)*CURSOR_SEEK*0.4; seekY += (dy/dist)*CURSOR_SEEK*0.4; seekW += 0.6; }
        }
        { const dx = a.tx-a.x, dy = a.ty-a.y, d = Math.hypot(dx,dy); if (d>4) { seekX += (dx/d)*WANDER_SPEED; seekY += (dy/d)*WANDER_SPEED; seekW += 1; } }
        for (const b of all) { if (b.id===a.id) continue; const dx=a.x-b.x, dy=a.y-b.y, d=Math.hypot(dx,dy); if (d<28&&d>0) { const push=(28-d)/28; a.vx+=(dx/d)*push*0.6; a.vy+=(dy/d)*push*0.6; } }
        if (seekW>0) { a.vx += seekX/seekW; a.vy += seekY/seekW; }
        a.vx *= 0.82; a.vy *= 0.82;
        const spd = Math.hypot(a.vx, a.vy);
        if (spd > 1.8) { a.vx = (a.vx/spd)*1.8; a.vy = (a.vy/spd)*1.8; }
        a.x += a.vx; a.y += a.vy;
        if (spd > 0.1) a.facing = Math.atan2(a.vy, a.vx);
        a.x = Math.max(20, Math.min(W-20, a.x)); a.y = Math.max(20, Math.min(H-20, a.y));

        let inZone = false;
        for (const b of all) { if (b.id!==a.id && Math.hypot(a.x-b.x,a.y-b.y)<TALK_RADIUS) { inZone=true; break; } }
        a.glowAlpha += ((inZone ? 0.28 : 0) - a.glowAlpha) * 0.06;
        if (inZone && !a.isVisitor) {
          if (!a.talking && Math.random() < 0.003) { a.talking=true; a.showType=true; a.typeTimer=60+Math.random()*90; }
          if (a.showType) { a.typeTimer--; if (a.typeTimer<=0) { a.showType=false; a.msg=MESSAGES[Math.floor(Math.random()*MESSAGES.length)]; a.msgTimer=90+Math.random()*60; } }
        }
        if (a.msgTimer>0) { a.msgTimer--; if (a.msgTimer<=0) { a.talking=false; a.msg=""; } }
        if (!inZone) { a.talking=false; a.showType=false; a.msg=""; a.msgTimer=0; }
      }
    };

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const p = pal();
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width/dpr, H = canvas.height/dpr;
      const all = s.visitor ? [...s.avatars, s.visitor] : s.avatars;

      ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);

      const gs = 36;
      ctx.strokeStyle = p.grid; ctx.lineWidth = 0.5; ctx.globalAlpha = p.gridOp;
      for (let x = gs; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = gs; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      ctx.globalAlpha = 1;

      for (const a of all) {
        if (a.alpha < 0.05) continue;
        let ov = false;
        for (const b of all) { if (b.id!==a.id && Math.hypot(a.x-b.x,a.y-b.y)<TALK_RADIUS) { ov=true; break; } }
        const baseOp = ov ? p.glowBase : p.glowBase * 0.5;
        const col = a.isVisitor ? p.accent : a.color;
        const grad = ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,TALK_RADIUS);
        grad.addColorStop(0,   hexToRGBA(col, baseOp*a.alpha*2.2));
        grad.addColorStop(0.6, hexToRGBA(col, baseOp*a.alpha));
        grad.addColorStop(1,   hexToRGBA(col, 0));
        ctx.globalAlpha = a.alpha; ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(a.x,a.y,TALK_RADIUS,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < all.length; i++) for (let j = i+1; j < all.length; j++) {
        const a = all[i], b = all[j], dist = Math.hypot(a.x-b.x,a.y-b.y);
        if (dist < TALK_RADIUS && a.alpha>0.1 && b.alpha>0.1) {
          ctx.globalAlpha = (1-dist/TALK_RADIUS)*p.lineOp*Math.min(a.alpha,b.alpha);
          ctx.strokeStyle = p.accent; ctx.lineWidth = 0.8; ctx.setLineDash([3,5]);
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
      }

      for (const a of all) {
        if (a.alpha < 0.02) continue;
        ctx.globalAlpha = a.alpha; drawAvatar(ctx, a); ctx.globalAlpha = 1;
        if ((a.msg || a.showType) && a.alpha > 0.5) {
          const text = a.showType ? "···" : a.msg;
          const bx = a.x, by = a.y - a.radius - 24;
          ctx.font = "500 9px 'DM Mono', monospace";
          const tw = ctx.measureText(text).width;
          const pw = tw+14, ph = 16, pr = 6;
          const fadeOp = a.showType ? 0.85 : Math.min(1, a.msgTimer/20)*0.9;
          ctx.globalAlpha = a.alpha * fadeOp;
          ctx.fillStyle = p.bubbleBg;
          roundRect(ctx, bx-pw/2, by-ph/2, pw, ph, pr); ctx.fill();
          ctx.beginPath(); ctx.moveTo(bx-4,by+ph/2); ctx.lineTo(bx,by+ph/2+5); ctx.lineTo(bx+4,by+ph/2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = p.bubbleText;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(text, bx, by); ctx.globalAlpha = 1;
        }
      }

      if (s.visitor && s.visitor.alpha > 0.3) {
        const v = s.visitor;
        ctx.globalAlpha = v.alpha * 0.6;
        ctx.font = "500 8px 'DM Mono', monospace";
        ctx.fillStyle = p.accent; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText("YOU", v.x, v.y - v.radius - 14); ctx.globalAlpha = 1;
      }
    };

    const loop = () => {
      if (active) { step(); draw(); }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current); ro.disconnect();
      canvas.removeEventListener("mouseenter", onMouseEnter);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [initSim, active]); // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
      style={{ cursor: "crosshair" }}
    />
  );
}