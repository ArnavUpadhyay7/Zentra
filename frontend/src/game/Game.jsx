import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import World from "./scene/World";
import socket from "../socket/socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function Game() {
  const gameRef         = useRef(null);
  const groupInputRef   = useRef(null);
  const nearbyInputRef  = useRef(null);
  const groupMsgRef     = useRef(null);
  const nearbyMsgRef    = useRef(null);
  const { roomId }      = useParams();
  const { state }       = useLocation();
  const navigate        = useNavigate();

  const username  = state?.username  || localStorage.getItem("vs_username") || "Player";
  const charIndex = state?.charIndex || 1;
  const mapId     = state?.mapId     || "indoor";
  const isAdmin   = !!state?.charIndex;

  const [activeTab,     setActiveTab]     = useState("group");   // "group" | "nearby"
  const [groupMessages, setGroupMessages] = useState([]);
  const [nearbyMessages,setNearbyMessages]= useState([]);
  const [groupDraft,    setGroupDraft]    = useState("");
  const [nearbyDraft,   setNearbyDraft]   = useState("");
  const [nearbyUser,    setNearbyUser]    = useState(null);      // name of closest player
  const [copied,        setCopied]        = useState(false);
  const [micMuted,      setMicMuted]      = useState(false);
  const [deafened,      setDeafened]      = useState(false);
  const [voiceActive,   setVoiceActive]   = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);

  // ── Phaser bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    if (socket.disconnected) socket.connect();

    // ── FIX: pre-load data BEFORE new Phaser.Game() ──────────────────────
    // Phaser calls scene.create() synchronously during construction,
    // so registry.set() calls AFTER new Phaser.Game() arrive too late.
    // World.js reads window.__vsGameData as the primary source.
    window.__vsGameData = {
      socket, charIndex, roomId, username, mapId,
      myId: socket.id,
    };

    const game = new Phaser.Game({
      type:            Phaser.AUTO,
      width:           window.innerWidth,
      height:          window.innerHeight,
      parent:          gameRef.current,
      backgroundColor: "#1a1a2e",
      physics:         { default: "arcade", arcade: { debug: false } },
      scene:           [World],
    });

    window.__phaserGame = game; // expose for chat keyboard toggle

    // Also set registry as fallback
    game.registry.set("socket",    socket);
    game.registry.set("charIndex", charIndex);
    game.registry.set("roomId",    roomId);
    game.registry.set("username",  username);
    game.registry.set("myId",      socket.id);
    game.registry.set("mapId",     mapId);

    game.events.once("ready", () => {
      game.registry.set("myId", socket.id);
      window.__vsGameData.myId = socket.id;
      if (!state?.charIndex) socket.emit("join-room", { roomId, username });
    });

    socket.on("chat-message", ({ username: from, text, ts }) => {
      setGroupMessages(prev => [...prev, { from, text, ts, self: false }]);
    });

    // proximity-user event from Phaser world (to be wired later)
    socket.on("nearby-user", ({ username: name }) => setNearbyUser(name));
    socket.on("nearby-left",  ()                  => setNearbyUser(null));
    socket.on("nearby-message",({ username: from, text, ts }) => {
      setNearbyMessages(prev => [...prev, { from, text, ts, self: false }]);
    });

    return () => {
      socket.off("chat-message");
      socket.off("nearby-user");
      socket.off("nearby-left");
      socket.off("nearby-message");
      socket.offAny();
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("player-moved");
      socket.off("room-state");
      game.destroy(true);
      window.__phaserGame = null;
    };
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    if (groupMsgRef.current)
      groupMsgRef.current.scrollTop = groupMsgRef.current.scrollHeight;
  }, [groupMessages]);
  useEffect(() => {
    if (nearbyMsgRef.current)
      nearbyMsgRef.current.scrollTop = nearbyMsgRef.current.scrollHeight;
  }, [nearbyMessages]);

  const shareRoom = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const leaveRoom = () => { socket.disconnect(); navigate("/"); };

  const sendGroup = () => {
    const text = groupDraft.trim();
    if (!text) return;
    socket.emit("chat-message", { roomId, username, text }); // BE receives {roomId,username,text}
    setGroupMessages(prev => [...prev, { from: username, text, ts: Date.now(), self: true }]);
    setGroupDraft("");
    groupInputRef.current?.focus();
  };

  const sendNearby = () => {
    const text = nearbyDraft.trim();
    if (!text || !nearbyUser) return;
    socket.emit("nearby-message", { roomId, username, text });
    setNearbyMessages(prev => [...prev, { from: username, text, ts: Date.now(), self: true }]);
    setNearbyDraft("");
    nearbyInputRef.current?.focus();
  };

  const onGroupKey  = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendGroup();  } };
  const onNearbyKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendNearby(); } };

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-[#0b0b10] grid"
      style={{
        gridTemplateColumns: sidebarOpen ? "1fr 340px" : "1fr 0px",
        gridTemplateRows: "1fr 68px",
        transition: "grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >

      {/* ── 2D Game Canvas ─────────────────────────────────────────────── */}
      <div ref={gameRef} className="overflow-hidden bg-[#1a1a2e] relative">
        {/* Sidebar toggle button — floats on the right edge of the canvas */}
        <button
          onClick={() => setSidebarOpen(p => !p)}
          title={sidebarOpen ? "Close chat" : "Open chat"}
          className="absolute top-1/2 right-0 -translate-y-1/2 z-50
            w-5 h-12 flex items-center justify-center
            bg-[#111118] border border-white/[0.08] border-r-0
            rounded-l-lg text-white/40 hover:text-white/80
            hover:bg-white/[0.06] cursor-pointer transition-all duration-150
            shadow-lg"
          style={{ transform: "translateY(-50%)" }}
        >
          <ChevronIcon open={sidebarOpen} />
        </button>
      </div>

      {/* ── Right Sidebar ───────────────────────────────────────────────── */}
      <aside
        className="flex flex-col bg-[#111118] border-l border-white/[0.06] overflow-hidden"
        style={{
          width: sidebarOpen ? "340px" : "0px",
          minWidth: 0,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? "auto" : "none",
          transitionProperty: "width, opacity",
          transitionDuration: "0.3s, 0.15s",
        }}
      >

        {/* ── Sidebar header: room badge + invite ── */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold text-white/30 tracking-[0.15em] uppercase shrink-0">Room</span>
            <span className="font-mono text-[11px] text-violet-300/80 bg-violet-500/10 border border-violet-500/15 rounded-md px-2 py-0.5 truncate max-w-[90px]">
              {roomId}
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={shareRoom}
              className={`ml-auto shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-all duration-150
                ${copied
                  ? "text-emerald-400 bg-emerald-400/10 border-emerald-500/20"
                  : "text-violet-300/70 bg-violet-500/8 border-violet-500/15 hover:bg-violet-500/15 hover:text-violet-200"}`}
            >
              {copied ? <CheckIcon /> : <ShareIcon />}
              <span>{copied ? "Copied!" : "Invite"}</span>
            </button>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-end px-3 gap-1 shrink-0 border-b border-white/[0.06]">
          <TabBtn
            active={activeTab === "group"}
            onClick={() => setActiveTab("group")}
            label="Group Chat"
            badge={groupMessages.length > 0 && activeTab !== "group" ? groupMessages.length : null}
          />
          <TabBtn
            active={activeTab === "nearby"}
            onClick={() => nearbyUser && setActiveTab("nearby")}
            label={nearbyUser ?? "Nearby"}
            disabled={!nearbyUser}
            isNearby
            badge={nearbyMessages.length > 0 && activeTab !== "nearby" ? nearbyMessages.length : null}
          />
        </div>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-hidden relative">
          {/* Group messages */}
          <div
            ref={groupMsgRef}
            className={`absolute inset-0 flex flex-col gap-1 overflow-y-auto p-3 transition-opacity duration-150
              ${activeTab === "group" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            style={{ scrollbarWidth: "thin", scrollbarColor: "#1e1e2a transparent" }}
          >
            {groupMessages.length === 0
              ? <EmptyState text="No messages yet — say hi 👋" />
              : groupMessages.map((m, i) => <Message key={i} m={m} />)
            }
          </div>

          {/* Nearby messages */}
          <div
            ref={nearbyMsgRef}
            className={`absolute inset-0 flex flex-col gap-1 overflow-y-auto p-3 transition-opacity duration-150
              ${activeTab === "nearby" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            style={{ scrollbarWidth: "thin", scrollbarColor: "#1e1e2a transparent" }}
          >
            {!nearbyUser
              ? <EmptyState text="Walk near another player to start a private chat." icon="👤" />
              : nearbyMessages.length === 0
                ? <EmptyState text={`You're near ${nearbyUser}. Send a message!`} icon="💬" />
                : nearbyMessages.map((m, i) => <Message key={i} m={m} />)
            }
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="p-3 border-t border-white/[0.06] shrink-0">
          {activeTab === "group" ? (
            <ChatInput
              ref={groupInputRef}
              value={groupDraft}
              onChange={e => setGroupDraft(e.target.value)}
              onKeyDown={onGroupKey}
              onSend={sendGroup}
              placeholder="Message everyone…"
            />
          ) : (
            <ChatInput
              ref={nearbyInputRef}
              value={nearbyDraft}
              onChange={e => setNearbyDraft(e.target.value)}
              onKeyDown={onNearbyKey}
              onSend={sendNearby}
              placeholder={nearbyUser ? `Message ${nearbyUser}…` : "No one nearby…"}
              disabled={!nearbyUser}
            />
          )}
        </div>
      </aside>

      {/* ── Bottom control bar ──────────────────────────────────────────── */}
      <footer className="col-span-2 flex items-center px-4 gap-3 bg-[#0e0e14] border-t border-white/[0.06]" style={{ gridColumn: "1 / -1" }}>

        {/* Left — voice status */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300
            ${voiceActive
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : "bg-white/[0.03] border-white/[0.06] text-white/40"}`}>
            <span className="relative flex h-2 w-2 shrink-0">
              {voiceActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${voiceActive ? "bg-emerald-400" : "bg-white/20"}`} />
            </span>
            <span className="text-[12px] font-semibold tracking-wide whitespace-nowrap">
              {voiceActive ? "Voice Active" : "Proximity Voice"}
            </span>
          </div>
          <span className="text-[11px] text-white/20 hidden md:block truncate">
            {voiceActive ? `Talking with ${nearbyUser ?? "…"}` : "Walk near players to connect"}
          </span>
        </div>

        {/* Centre — controls */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-xl px-2 py-1.5">
          <ControlBtn
            active={micMuted}
            onClick={() => setMicMuted(p => !p)}
            title={micMuted ? "Unmute mic" : "Mute mic"}
            danger={micMuted}
          >
            <MicIcon muted={micMuted} />
          </ControlBtn>
          <div className="w-px h-5 bg-white/[0.08]" />
          <ControlBtn
            active={deafened}
            onClick={() => setDeafened(p => !p)}
            title={deafened ? "Undeafen" : "Deafen"}
            danger={deafened}
          >
            <HeadsetIcon muted={deafened} />
          </ControlBtn>
        </div>

        {/* Right — user chip + leave */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-full pl-1.5 pr-3 py-1">
            <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {username[0]?.toUpperCase()}
            </div>
            <span className="text-[12px] text-white/60 font-medium max-w-[100px] truncate">{username}</span>
          </div>
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-red-400/80 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 hover:text-red-400 rounded-lg px-3 py-2 cursor-pointer transition-all shrink-0"
          >
            <DoorIcon />
            <span>Leave</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TabBtn({ active, onClick, label, disabled, isNearby, badge }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center gap-1.5 px-3 pt-2 pb-2.5 text-[12px] font-semibold tracking-wide
        border-b-2 transition-all duration-150 cursor-pointer rounded-t-md -mb-px
        ${active
          ? "border-violet-500 text-white"
          : disabled
            ? "border-transparent text-white/20 cursor-not-allowed"
            : "border-transparent text-white/40 hover:text-white/70 hover:border-white/20"}`}
    >
      {isNearby && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${disabled ? "bg-white/15" : "bg-emerald-400"}`} />
      )}
      <span className="truncate max-w-[90px]">{label}</span>
      {badge && (
        <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function Message({ m }) {
  return (
    <div className={`flex gap-2 px-1 py-1 rounded-lg hover:bg-white/[0.03] transition-colors group ${m.self ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5
        ${m.self ? "bg-violet-700 text-violet-200" : "bg-white/10 text-white/60"}`}>
        {m.from[0]?.toUpperCase()}
      </div>
      <div className={`flex flex-col gap-0.5 min-w-0 ${m.self ? "items-end" : "items-start"}`}>
        <span className={`text-[10px] font-semibold tracking-wide ${m.self ? "text-violet-400/70" : "text-white/40"}`}>
          {m.self ? "You" : m.from}
        </span>
        <div className={`px-3 py-1.5 rounded-2xl text-[13px] leading-relaxed break-words max-w-[180px]
          ${m.self
            ? "bg-violet-600/30 text-white/90 rounded-tr-sm"
            : "bg-white/[0.07] text-white/80 rounded-tl-sm"}`}>
          {m.text}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text, icon = "💬" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full py-10 text-center">
      <span className="text-2xl opacity-30">{icon}</span>
      <p className="text-[12px] text-white/25 leading-relaxed max-w-[160px]">{text}</p>
    </div>
  );
}

const ChatInput = ({ value, onChange, onKeyDown, onSend, placeholder, disabled, ref: _ , ...props }) => {
  const ref = useRef(null);

  const disableGameKeys = () => {
    // Tell Phaser to stop consuming keyboard events while user is typing
    if (window.__phaserGame?.input?.keyboard) {
      window.__phaserGame.input.keyboard.enabled = false;
    }
  };
  const enableGameKeys = () => {
    if (window.__phaserGame?.input?.keyboard) {
      window.__phaserGame.input.keyboard.enabled = true;
    }
  };

  return (
    <div className={`flex gap-2 items-end ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
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
        className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl text-white/90 text-[13px] px-3 py-2 outline-none placeholder-white/20 focus:border-violet-500/40 transition-colors resize-none leading-relaxed"
        style={{ scrollbarWidth: "none" }}
      />
      <button
        onClick={onSend}
        className="w-9 h-9 shrink-0 bg-violet-600 hover:bg-violet-500 active:scale-95 rounded-xl text-white flex items-center justify-center cursor-pointer transition-all"
      >
        <SendIcon />
      </button>
    </div>
  );
};

function ControlBtn({ children, active, onClick, title, danger }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150
        ${danger && active
          ? "text-red-400 bg-red-500/15"
          : active
            ? "text-violet-300 bg-violet-500/20"
            : "text-white/40 hover:text-white/70 hover:bg-white/8"}`}
    >
      {children}
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
const ChevronIcon = ({ open }) => (
  <svg
    width="10" height="10" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.3s", transform: open ? "rotate(0deg)" : "rotate(180deg)" }}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ShareIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const DoorIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/>
    <polyline points="17 8 21 12 17 16"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const MicIcon = ({ muted }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
    {muted && <line x1="2" y1="2" x2="22" y2="22"/>}
  </svg>
);
const HeadsetIcon = ({ muted }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    {muted && <line x1="2" y1="2" x2="22" y2="22"/>}
  </svg>
);