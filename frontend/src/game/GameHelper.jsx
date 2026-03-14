import { useRef } from "react";

// ── TabBtn ────────────────────────────────────────────────────────────────────

export function TabBtn({ active, onClick, label, disabled, isNearby, badge }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative flex items-center gap-1.5 px-3.5 pt-2.5 pb-2.5 -mb-px",
        "font-mono text-[10px] font-medium tracking-[0.06em] uppercase",
        "bg-transparent border-b-2 cursor-pointer transition-colors duration-150",
        active
          ? "border-[#E8632A] text-[#F5F0E8]"
          : disabled
            ? "border-transparent text-[#5C5550] cursor-not-allowed"
            : "border-transparent text-[#9C9188] hover:text-[#F5F0E8]",
      ].join(" ")}
    >
      {isNearby && (
        <span className={[
          "w-1.5 h-1.5 rounded-full shrink-0",
          disabled ? "bg-[#5C5550]" : "bg-emerald-400 shadow-[0_0_6px_#4ade80]",
        ].join(" ")} />
      )}
      <span className="max-w-[90px] truncate">{label}</span>
      {badge && (
        <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#E8632A] text-[#16120E] font-mono text-[9px] font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

// ── Message ───────────────────────────────────────────────────────────────────

export function Message({ m }) {
  return (
    <div className={`flex gap-2 px-1 py-1 rounded-xl ${m.self ? "flex-row-reverse" : ""}`}>
      <div className={[
        "w-7 h-7 rounded-full shrink-0 mt-0.5 flex items-center justify-center",
        "font-mono text-[11px] font-medium",
        m.self
          ? "bg-[#E8632A]/15 border border-[#E8632A]/30 text-[#E8632A]"
          : "bg-[#252018] border border-[rgba(232,226,218,0.08)] text-[#9C9188]",
      ].join(" ")}>
        {m.from[0]?.toUpperCase()}
      </div>
      <div className={`flex flex-col gap-1 min-w-0 ${m.self ? "items-end" : "items-start"}`}>
        <span className={[
          "font-mono text-[9px] font-medium tracking-[0.08em] uppercase",
          m.self ? "text-[#E8632A]" : "text-[#5C5550]",
        ].join(" ")}>
          {m.self ? "You" : m.from}
        </span>
        <div className={[
          "px-3 py-2 text-[13px] leading-relaxed break-words max-w-[190px] font-body",
          "text-[#F5F0E8]",
          m.self
            ? "bg-[#E8632A]/15 border border-[#E8632A]/30 rounded-xl rounded-tr-sm"
            : "bg-[#252018] border border-[rgba(232,226,218,0.08)] rounded-xl rounded-tl-sm",
        ].join(" ")}>
          {m.text}
        </div>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({ text, icon = "💬" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 h-full py-10 text-center">
      <span className="text-2xl opacity-20">{icon}</span>
      <p className="font-body text-[12px] text-[#5C5550] leading-relaxed max-w-[160px]">{text}</p>
    </div>
  );
}

// ── ChatInput ─────────────────────────────────────────────────────────────────

export function ChatInput({ value, onChange, onKeyDown, onSend, placeholder, disabled }) {
  const ref = useRef(null);

  const disableGameKeys = () => { if (window.__phaserGame?.input?.keyboard) window.__phaserGame.input.keyboard.enabled = false; };
  const enableGameKeys  = () => { if (window.__phaserGame?.input?.keyboard) window.__phaserGame.input.keyboard.enabled = true;  };

  return (
    <div className={`flex gap-2 items-end ${disabled ? "opacity-35 pointer-events-none" : ""}`}>
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={disableGameKeys}
        onBlur={enableGameKeys}
        placeholder={placeholder}
        maxLength={300}
        rows={1}
        className={[
          "flex-1 font-body text-[13px] text-[#F5F0E8] leading-relaxed",
          "bg-[#252018] border border-[rgba(232,226,218,0.13)] rounded-[10px]",
          "px-3 py-2 outline-none resize-none",
          "placeholder:text-[#5C5550]",
          "focus:border-[#E8632A]/40 transition-colors duration-150",
          "[scrollbar-width:none]",
        ].join(" ")}
      />
      <button
        onClick={onSend}
        className="w-9 h-9 shrink-0 bg-[#E8632A] hover:bg-[#D4571F] active:scale-95 rounded-[10px] text-[#16120E] flex items-center justify-center cursor-pointer transition-all duration-150"
      >
        <SendIcon />
      </button>
    </div>
  );
}

// ── ControlBtn ────────────────────────────────────────────────────────────────

export function ControlBtn({ children, active, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        "w-9 h-9 rounded-[9px] flex items-center justify-center cursor-pointer",
        "border-none transition-all duration-150",
        danger && active
          ? "bg-red-500/15 text-[#E05252]"
          : active
            ? "bg-violet-500/18 text-violet-400"
            : "bg-transparent text-[#9C9188] hover:bg-[#252018] hover:text-[#F5F0E8]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

export const ChevronIcon = ({ open }) => (
  <svg
    width="10" height="10" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="transition-transform duration-300"
    style={{ transform: open ? "rotate(0deg)" : "rotate(180deg)" }}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ShareIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

export const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export const DoorIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/>
    <polyline points="17 8 21 12 17 16"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export const MicIcon = ({ muted }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
    {muted && <line x1="2" y1="2" x2="22" y2="22"/>}
  </svg>
);

export const HeadsetIcon = ({ muted }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    {muted && <line x1="2" y1="2" x2="22" y2="22"/>}
  </svg>
);