import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import World from "./scene/World";
import socket from "../socket/socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  TabBtn, Message, EmptyState, ChatInput, ControlBtn,
  ChevronIcon, ShareIcon, CheckIcon, DoorIcon, MicIcon, HeadsetIcon,
} from "./GameHelper";

export default function Game() {
  const gameRef        = useRef(null);
  const groupInputRef  = useRef(null);
  const nearbyInputRef = useRef(null);
  const groupMsgRef    = useRef(null);
  const nearbyMsgRef   = useRef(null);
  const { roomId }     = useParams();
  const { state }      = useLocation();
  const navigate       = useNavigate();

  const username  = state?.username  || localStorage.getItem("vs_username") || "Player";
  const charIndex = state?.charIndex || 1;
  const mapId     = state?.mapId     || "indoor";
  const isAdmin   = !!state?.charIndex;

  const [activeTab,      setActiveTab]      = useState("group");
  const [groupMessages,  setGroupMessages]  = useState([]);
  const [nearbyMessages, setNearbyMessages] = useState([]);
  const [groupDraft,     setGroupDraft]     = useState("");
  const [nearbyDraft,    setNearbyDraft]    = useState("");
  const [nearbyUser,     setNearbyUser]     = useState(null);
  const [copied,         setCopied]         = useState(false);
  const [micMuted,       setMicMuted]       = useState(false);
  const [deafened,       setDeafened]       = useState(false);
  const [voiceActive,    setVoiceActive]    = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);

  // ── Phaser bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    if (socket.disconnected) socket.connect();

    // Spawn position mirrors the server's SPAWNS table — must be set
    // BEFORE new Phaser.Game() so World.create() reads it on first tick.
    const SPAWNS = {
      "indoor":       [[416,240],[316,240],[516,240],[416,160],[316,320],[516,320]],
      "tiny-dungeon": [[416,320],[316,320],[516,320],[416,220],[316,420],[516,420]],
    };
    const spawnList = SPAWNS[mapId] || SPAWNS["indoor"];
    const spawn     = spawnList[(charIndex - 1) % spawnList.length];

    window.__vsGameData = {
      socket, charIndex, roomId, username, mapId, myId: socket.id,
      spawnX: spawn[0], spawnY: spawn[1],
    };

    const game = new Phaser.Game({
      type:            Phaser.AUTO,
      width:           window.innerWidth,
      height:          window.innerHeight,
      parent:          gameRef.current,
      backgroundColor: "#16120E",
      physics:         { default: "arcade", arcade: { debug: false } },
      scene:           [World],
    });

    window.__phaserGame = game;
    game.registry.set("socket",    socket);
    game.registry.set("charIndex", charIndex);
    game.registry.set("roomId",    roomId);
    game.registry.set("username",  username);
    game.registry.set("myId",      socket.id);
    game.registry.set("mapId",     mapId);
    game.registry.set("spawnX",    spawn[0]);
    game.registry.set("spawnY",    spawn[1]);

    game.events.once("ready", () => {
      game.registry.set("myId", socket.id);
      window.__vsGameData.myId = socket.id;
      // Safety net for direct URL access — Landing already handles normal join flow
      if (!state?.charIndex) socket.emit("join-room", { roomId, username });
    });

    socket.on("chat-message", ({ username: from, text, ts }) =>
      setGroupMessages(prev => [...prev, { from, text, ts, self: false }]));

    // nearby-user: server sends full player object {username, x, y, charIndex}
    // Clear history if it's a new person, auto-switch to nearby tab
    socket.on("nearby-user", (player) => {
      setNearbyUser(prev => {
        if (prev !== player.username) setNearbyMessages([]);
        return player.username;
      });
      setVoiceActive(true);
      setActiveTab("nearby");
    });

    // nearby-left: partner walked away — reset and go back to group tab
    socket.on("nearby-left", () => {
      setNearbyUser(null);
      setVoiceActive(false);
      setActiveTab("group");
    });

    socket.on("nearby-message", ({ username: from, text, ts }) =>
      setNearbyMessages(prev => [...prev, { from, text, ts, self: false }]));

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
      window.__vsGameData = null;
    };
  }, [roomId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (groupMsgRef.current)
      groupMsgRef.current.scrollTop = groupMsgRef.current.scrollHeight;
  }, [groupMessages]);

  useEffect(() => {
    if (nearbyMsgRef.current)
      nearbyMsgRef.current.scrollTop = nearbyMsgRef.current.scrollHeight;
  }, [nearbyMessages]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const shareRoom = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const leaveRoom  = () => { socket.disconnect(); navigate("/"); };

  const sendGroup  = () => {
    const text = groupDraft.trim();
    if (!text) return;
    socket.emit("chat-message", { roomId, username, text });
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .game-scroll::-webkit-scrollbar       { width: 3px; }
        .game-scroll::-webkit-scrollbar-track { background: transparent; }
        .game-scroll::-webkit-scrollbar-thumb { background: rgba(232,226,218,0.10); border-radius: 3px; }
        @keyframes voice-ping {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <div
        className="w-screen h-screen overflow-hidden bg-[#16120E]"
        style={{
          display: "grid",
          gridTemplateColumns: sidebarOpen ? "1fr 340px" : "1fr 0px",
          gridTemplateRows: "1fr 64px",
          transition: "grid-template-columns 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}
      >

        {/* ── Game Canvas ───────────────────────────────────────────────── */}
        <div ref={gameRef} className="overflow-hidden bg-[#16120E] relative">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            title={sidebarOpen ? "Close chat" : "Open chat"}
            className={[
              "absolute top-1/2 right-0 -translate-y-1/2 z-50",
              "w-[18px] h-[52px] flex items-center justify-center",
              "bg-[#1E1A15] border border-[rgba(232,226,218,0.08)] border-r-0",
              "rounded-l-[6px] text-[#5C5550] cursor-pointer",
              "hover:bg-[#252018] hover:text-[#F5F0E8]",
              "transition-all duration-150",
            ].join(" ")}
          >
            <ChevronIcon open={sidebarOpen} />
          </button>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────── */}
        <aside
          className="flex flex-col bg-[#1E1A15] border-l border-[rgba(232,226,218,0.08)] overflow-hidden"
          style={{
            width:         sidebarOpen ? 340 : 0,
            minWidth:      0,
            opacity:       sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? "auto" : "none",
            transition:    "width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease",
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-3 shrink-0 border-b border-[rgba(232,226,218,0.08)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[9px] font-medium tracking-[0.16em] uppercase text-[#5C5550] shrink-0">Room</span>
              <span className="font-mono text-[11px] text-[#E8632A] bg-[#E8632A]/15 border border-[#E8632A]/30 rounded-md px-2 py-0.5 max-w-[100px] truncate">
                {roomId}
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={shareRoom}
                className={[
                  "ml-auto shrink-0 flex items-center gap-1.5 cursor-pointer",
                  "font-mono text-[10px] font-medium tracking-[0.08em] uppercase",
                  "px-2.5 py-1.5 rounded-[7px] border transition-all duration-150",
                  copied
                    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                    : "text-[#E8632A] bg-[#E8632A]/15 border-[#E8632A]/30 hover:bg-[#E8632A]/25",
                ].join(" ")}
              >
                {copied ? <CheckIcon /> : <ShareIcon />}
                {copied ? "Copied!" : "Invite"}
              </button>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-end px-3 gap-0.5 shrink-0 border-b border-[rgba(232,226,218,0.08)]">
            <TabBtn
              active={activeTab === "group"}
              onClick={() => setActiveTab("group")}
              label="Group"
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

          {/* ── Messages ── */}
          <div className="flex-1 overflow-hidden relative">
            <div
              ref={groupMsgRef}
              className={[
                "game-scroll absolute inset-0 flex flex-col gap-1 overflow-y-auto p-3",
                "transition-opacity duration-150",
                activeTab === "group" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
              ].join(" ")}
            >
              {groupMessages.length === 0
                ? <EmptyState text="No messages yet — say hi 👋" />
                : groupMessages.map((m, i) => <Message key={i} m={m} />)
              }
            </div>
            <div
              ref={nearbyMsgRef}
              className={[
                "game-scroll absolute inset-0 flex flex-col gap-1 overflow-y-auto p-3",
                "transition-opacity duration-150",
                activeTab === "nearby" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
              ].join(" ")}
            >
              {!nearbyUser
                ? <EmptyState text="Walk near another player to start a private chat." icon="👤" />
                : nearbyMessages.length === 0
                  ? <EmptyState text={`You're near ${nearbyUser}. Send a message!`} icon="💬" />
                  : nearbyMessages.map((m, i) => <Message key={i} m={m} />)
              }
            </div>
          </div>

          {/* ── Input ── */}
          <div className="p-3 border-t border-[rgba(232,226,218,0.08)] shrink-0">
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

        {/* ── Bottom bar ────────────────────────────────────────────────── */}
        <footer
          className="flex items-center px-4 gap-3 bg-[#16120E] border-t border-[rgba(232,226,218,0.08)]"
          style={{ gridColumn: "1 / -1" }}
        >
          {/* Voice status */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={[
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
              voiceActive
                ? "bg-emerald-400/8 border-emerald-400/20 text-emerald-400"
                : "bg-[#252018] border-[rgba(232,226,218,0.08)] text-[#E8632A]",
            ].join(" ")}>
              <span className="relative flex h-[7px] w-[7px] shrink-0">
                {voiceActive && (
                  <span
                    className="absolute inset-0 rounded-full bg-emerald-400 opacity-60"
                    style={{ animation: "voice-ping 1.5s ease-in-out infinite" }}
                  />
                )}
                <span className={`relative inline-flex h-[7px] w-[7px] rounded-full ${voiceActive ? "bg-emerald-400" : "bg-[#E8632A]"}`} />
              </span>
              <span className="font-mono text-[10px] font-medium tracking-[0.08em] uppercase whitespace-nowrap">
                {voiceActive ? "Voice Active" : "Proximity Voice"}
              </span>
            </div>
            <span className="font-body text-[11px] text-[#E8632A]/60 hidden md:block truncate">
              {voiceActive ? `Talking with ${nearbyUser ?? "…"}` : "Walk near players to connect"}
            </span>
          </div>

          {/* Mic + headset */}
          <div className="flex items-center gap-1 bg-[#252018] border border-[rgba(232,226,218,0.08)] rounded-[10px] px-1.5 py-1">
            <ControlBtn active={micMuted} onClick={() => setMicMuted(p => !p)} title={micMuted ? "Unmute mic" : "Mute mic"} danger={micMuted}>
              <MicIcon muted={micMuted} />
            </ControlBtn>
            <div className="w-px h-[18px] bg-[rgba(232,226,218,0.08)]" />
            <ControlBtn active={deafened} onClick={() => setDeafened(p => !p)} title={deafened ? "Undeafen" : "Deafen"} danger={deafened}>
              <HeadsetIcon muted={deafened} />
            </ControlBtn>
          </div>

          {/* User chip + leave */}
          <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
            <div className="flex items-center gap-2 bg-[#252018] border border-[rgba(232,226,218,0.08)] rounded-full pl-1 pr-3 py-1">
              <div className="w-[26px] h-[26px] rounded-full bg-[#E8632A]/15 border border-[#E8632A]/30 flex items-center justify-center font-mono text-[11px] font-medium text-[#E8632A] shrink-0">
                {username[0]?.toUpperCase()}
              </div>
              <span className="font-body text-[12px] font-medium text-[#9C9188] max-w-[100px] truncate">{username}</span>
            </div>
            <button
              onClick={leaveRoom}
              className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-[#7A4444] hover:text-[#E05252] bg-[rgba(224,82,82,0.06)] hover:bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.12)] hover:border-[rgba(224,82,82,0.3)] rounded-lg px-3 py-[7px] cursor-pointer shrink-0 transition-all duration-150"
            >
              <DoorIcon />
              Leave
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}