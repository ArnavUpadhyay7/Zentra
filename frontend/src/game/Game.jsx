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
  const [nearbyPlayer,     setNearbyPlayer]     = useState(null);
  const nearbyPlayerRef       = useRef(null);
  const activeInteractionRef  = useRef(false);
  const disconnectingUserRef  = useRef(null);  // set by interaction-ended for nearby-left toast
  const [waitingResponse,  setWaitingResponse]  = useState(false);
  const [incomingRequest,  setIncomingRequest]  = useState(null);
  const [connectedToast,   setConnectedToast]   = useState(null); // username string, auto-clears
  const [activeInteraction, setActiveInteraction] = useState(false);
  const [disconnectedToast, setDisconnectedToast] = useState(null);

  // ── E-key: send interaction request ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "e" && e.key !== "E") return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (!nearbyPlayer || waitingResponse || incomingRequest || activeInteraction) return;
      console.log("[E] sending interaction-request to", nearbyPlayer.playerId);
      socket.emit("interaction-request", { toPlayerId: nearbyPlayer.playerId });
      // Show waiting UI immediately — also confirmed by interaction-request-sent
      setWaitingResponse(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nearbyPlayer, waitingResponse, incomingRequest, activeInteraction]);

  // ── interaction-request-received ─────────────────────────────────────────
  useEffect(() => {
    const handler = (data) => {
      console.log("[socket] interaction-request-received:", data);
      // Always overwrite — stale guard was blocking second attempt
      setIncomingRequest(data);
    };
    socket.on("interaction-request-received", handler);
    return () => socket.off("interaction-request-received", handler);
  }, []);

  // ── interaction-request-sent — confirm waiting UI ─────────────────────────
  useEffect(() => {
    const handler = () => {
      console.log("[socket] interaction-request-sent confirmed");
      setWaitingResponse(true);
    };
    socket.on("interaction-request-sent", handler);
    return () => socket.off("interaction-request-sent", handler);
  }, []);

  // ── interaction-started — open nearby chat, show toast ───────────────────
  useEffect(() => {
    const handler = ({ playerA, playerB }) => {
      setWaitingResponse(false);
      setIncomingRequest(null);  // clear any stale incoming request on both sides

      const iAmPlayerA = playerA === socket.id;
      const iAmPlayerB = playerB === socket.id;
      if (!iAmPlayerA && !iAmPlayerB) return;

      const otherUsername = nearbyPlayerRef.current?.username ?? "Player";

      setActiveInteraction(true);
      activeInteractionRef.current = true;
      setNearbyUser(otherUsername);
      setVoiceActive(true);
      setActiveTab("nearby");
      setConnectedToast(otherUsername);
      setTimeout(() => setConnectedToast(null), 2200);
    };
    socket.on("interaction-started", handler);
    return () => socket.off("interaction-started", handler);
  }, []);

  // ── interaction-declined — clear waiting UI ───────────────────────────────
  useEffect(() => {
    const handler = () => setWaitingResponse(false);
    socket.on("interaction-declined", handler);
    return () => socket.off("interaction-declined", handler);
  }, []);

  // ── interaction-ended — close nearby chat, return to group ────────────────
  useEffect(() => {
    const handler = () => {
      const prevUser = nearbyPlayerRef.current?.username ?? null;
      disconnectingUserRef.current = prevUser; // save for nearby-left toast
      setWaitingResponse(false);
      setIncomingRequest(null);
      activeInteractionRef.current = false;
      setActiveInteraction(false);
      setNearbyUser(null);
      setVoiceActive(false);
      setActiveTab("group");
      setNearbyMessages([]);
      if (prevUser) {
        setDisconnectedToast(prevUser);
        setTimeout(() => setDisconnectedToast(null), 2200);
      }
    };
    socket.on("interaction-ended", handler);
    return () => socket.off("interaction-ended", handler);
  }, []);

  // ── Phaser bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    if (socket.disconnected) socket.connect();

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
      if (!state?.charIndex) socket.emit("join-room", { roomId, username });
    });

    socket.on("chat-message", ({ username: from, text, ts }) =>
      setGroupMessages(prev => [...prev, { from, text, ts, self: false }]));

    socket.on("nearby-user", (player) => {
      // Only update the E-prompt target — chat opens only after interaction-accepted
      const np = { playerId: player.socketId, username: player.username };
      nearbyPlayerRef.current = np;
      setNearbyPlayer(np);
    });

    socket.on("nearby-left", () => {
      const wasInteracting = activeInteractionRef.current;
      // Use disconnectingUserRef if interaction-ended already cleared nearbyPlayerRef
      const prevUser = nearbyPlayerRef.current?.username ?? disconnectingUserRef.current ?? null;
      disconnectingUserRef.current = null;
      nearbyPlayerRef.current = null;
      setNearbyPlayer(null);
      setWaitingResponse(false);
      setIncomingRequest(null);

      if (wasInteracting) {
        activeInteractionRef.current = false;
        setActiveInteraction(false);
        setNearbyUser(null);
        setVoiceActive(false);
        setActiveTab("group");
        setNearbyMessages([]);
        if (prevUser) {
          setDisconnectedToast(prevUser);
          setTimeout(() => setDisconnectedToast(null), 2200);
        }
      }
    });

    socket.on("nearby-message", ({ username: from, text, ts }) =>
      setNearbyMessages(prev => [...prev, { from, text, ts, self: false }]));

    return () => {
      socket.off("chat-message");
      socket.off("nearby-user");
      socket.off("nearby-left");
      socket.off("nearby-message");
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

  const leaveRoom = () => { socket.disconnect(); navigate("/"); };

  const sendGroup = () => {
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

  const handleAccept = () => {
    if (!incomingRequest) return;
    socket.emit("interaction-accepted", {
      fromPlayerId: incomingRequest.fromPlayerId,
      toPlayerId:   socket.id,
    });
    setIncomingRequest(null);
  };

  const handleDecline = () => {
    if (!incomingRequest) return;
    socket.emit("interaction-declined", {
      fromPlayerId: incomingRequest.fromPlayerId,
      toPlayerId:   socket.id,
    });
    setIncomingRequest(null);
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
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
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

          {/* ── Connected toast ───────────────────────────────────────── */}
          {connectedToast && (
            <div
              className="absolute top-4 left-1/2 z-50 pointer-events-none"
              style={{ transform: "translateX(-50%)", animation: "fadeUp 0.2s ease both" }}
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-500/25 bg-[#0a1f14]/90 backdrop-blur-md shadow-2xl whitespace-nowrap">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60" style={{ animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite" }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[11px] tracking-[0.04em] text-[#9C9188]">
                  Connected to{" "}
                  <span className="text-emerald-300 font-semibold">{connectedToast}</span>
                </span>
              </div>
            </div>
          )}

          {/* ── Disconnected toast ────────────────────────────────────── */}
          {disconnectedToast && (
            <div
              className="absolute top-4 left-1/2 z-50 pointer-events-none"
              style={{ transform: "translateX(-50%)", animation: "fadeUp 0.2s ease both" }}
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-red-500/20 bg-[#1f0a0a]/90 backdrop-blur-md shadow-2xl whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="font-mono text-[11px] tracking-[0.04em] text-[#9C9188]">
                  Disconnected from{" "}
                  <span className="text-red-300 font-semibold">{disconnectedToast}</span>
                </span>
              </div>
            </div>
          )}

          {/* ── Sender: waiting for response ──────────────────────────── */}
          {waitingResponse && (
            <div
              className="absolute bottom-6 left-1/2 z-40 pointer-events-none"
              style={{ transform: "translateX(-50%)" }}
            >
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-[rgba(139,92,246,0.25)] bg-[#16120E]/90 backdrop-blur-md shadow-2xl whitespace-nowrap">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-violet-400 opacity-60" style={{ animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite" }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
                </span>
                <span className="font-mono text-[11px] tracking-[0.04em] text-[#9C9188]">
                  Invitation sent, waiting for response…
                </span>
              </div>
            </div>
          )}

          {/* ── Receiver: incoming request popup ──────────────────────── */}
          {incomingRequest && (
            <div
              className="absolute bottom-6 left-1/2 z-50"
              style={{ transform: "translateX(-50%)", animation: "fadeUp 0.2s ease both" }}
            >
              <div className="flex flex-col gap-3 px-5 py-4 rounded-2xl border border-[rgba(232,226,218,0.14)] bg-[#1E1A15]/95 backdrop-blur-md shadow-2xl whitespace-nowrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E8632A]/15 border border-[#E8632A]/30 flex items-center justify-center font-mono text-[12px] font-semibold text-[#E8632A] shrink-0">
                    {incomingRequest.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-[12px] font-semibold text-[#FAF7F2]">{incomingRequest.username}</span>
                    <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#5C5550]">wants to talk</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 font-mono text-[10px] font-medium tracking-[0.08em] uppercase text-emerald-400 cursor-pointer transition-all duration-150"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Accept
                  </button>
                  <button
                    onClick={handleDecline}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[rgba(232,226,218,0.05)] hover:bg-[rgba(232,226,218,0.1)] border border-[rgba(232,226,218,0.1)] font-mono text-[10px] font-medium tracking-[0.08em] uppercase text-[#5C5550] hover:text-[#9C9188] cursor-pointer transition-all duration-150"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── E-to-talk prompt (hidden while waiting, popup open, or interacting) */}
          {nearbyPlayer && !waitingResponse && !incomingRequest && !activeInteraction && (
            <div
              className="absolute bottom-6 left-1/2 z-40 pointer-events-none"
              style={{ animation: "fadeUp 0.2s ease both", transform: "translateX(-50%)" }}
            >
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-[rgba(232,226,218,0.14)] bg-[#16120E]/90 backdrop-blur-md shadow-2xl whitespace-nowrap">
                <kbd className="flex items-center justify-center w-6 h-6 rounded-md bg-[rgba(250,247,242,0.1)] border border-[rgba(232,226,218,0.25)] font-mono text-[11px] font-bold text-[#FAF7F2] leading-none">
                  E
                </kbd>
                <span className="font-mono text-[11px] tracking-[0.04em] text-[#9C9188]">
                  Talk to{" "}
                  <span className="text-[#FAF7F2] font-semibold">{nearbyPlayer.username}</span>
                </span>
              </div>
            </div>
          )}

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
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-3 shrink-0 border-b border-[rgba(232,226,218,0.08)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[9px] font-medium tracking-[0.16em] uppercase text-[#5C5550] shrink-0">Room</span>
              <span className="font-mono text-[11px] text-[#E8632A] bg-[#E8632A]/15 border border-[#E8632A]/30 rounded-md px-2 py-0.5 max-w-[100px] truncate">{roomId}</span>
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

          {/* Tabs */}
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

          {/* Messages */}
          <div className="flex-1 overflow-hidden relative">
            <div
              ref={groupMsgRef}
              className={["game-scroll absolute inset-0 flex flex-col gap-1 overflow-y-auto p-3 transition-opacity duration-150", activeTab === "group" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"].join(" ")}
            >
              {groupMessages.length === 0 ? <EmptyState text="No messages yet — say hi 👋" /> : groupMessages.map((m, i) => <Message key={i} m={m} />)}
            </div>
            <div
              ref={nearbyMsgRef}
              className={["game-scroll absolute inset-0 flex flex-col gap-1 overflow-y-auto p-3 transition-opacity duration-150", activeTab === "nearby" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"].join(" ")}
            >
              {!nearbyUser
                ? <EmptyState text="Walk near another player to start a private chat." icon="👤" />
                : nearbyMessages.length === 0
                  ? <EmptyState text={`You're near ${nearbyUser}. Send a message!`} icon="💬" />
                  : nearbyMessages.map((m, i) => <Message key={i} m={m} />)
              }
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[rgba(232,226,218,0.08)] shrink-0">
            {activeTab === "group" ? (
              <ChatInput ref={groupInputRef} value={groupDraft} onChange={e => setGroupDraft(e.target.value)} onKeyDown={onGroupKey} onSend={sendGroup} placeholder="Message everyone…" />
            ) : (
              <ChatInput ref={nearbyInputRef} value={nearbyDraft} onChange={e => setNearbyDraft(e.target.value)} onKeyDown={onNearbyKey} onSend={sendNearby} placeholder={nearbyUser ? `Message ${nearbyUser}…` : "No one nearby…"} disabled={!nearbyUser} />
            )}
          </div>
        </aside>

        {/* ── Bottom bar ────────────────────────────────────────────────── */}
        <footer
          className="flex items-center px-4 gap-3 bg-[#16120E] border-t border-[rgba(232,226,218,0.08)]"
          style={{ gridColumn: "1 / -1" }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={["flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300", voiceActive ? "bg-emerald-400/8 border-emerald-400/20 text-emerald-400" : "bg-[#252018] border-[rgba(232,226,218,0.08)] text-[#E8632A]"].join(" ")}>
              <span className="relative flex h-[7px] w-[7px] shrink-0">
                {voiceActive && <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60" style={{ animation: "voice-ping 1.5s ease-in-out infinite" }} />}
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

          <div className="flex items-center gap-1 bg-[#252018] border border-[rgba(232,226,218,0.08)] rounded-[10px] px-1.5 py-1">
            <ControlBtn active={micMuted} onClick={() => setMicMuted(p => !p)} title={micMuted ? "Unmute mic" : "Mute mic"} danger={micMuted}><MicIcon muted={micMuted} /></ControlBtn>
            <div className="w-px h-[18px] bg-[rgba(232,226,218,0.08)]" />
            <ControlBtn active={deafened} onClick={() => setDeafened(p => !p)} title={deafened ? "Undeafen" : "Deafen"} danger={deafened}><HeadsetIcon muted={deafened} /></ControlBtn>
          </div>

          <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
            <div className="flex items-center gap-2 bg-[#252018] border border-[rgba(232,226,218,0.08)] rounded-full pl-1 pr-3 py-1">
              <div className="w-[26px] h-[26px] rounded-full bg-[#E8632A]/15 border border-[#E8632A]/30 flex items-center justify-center font-mono text-[11px] font-medium text-[#E8632A] shrink-0">{username[0]?.toUpperCase()}</div>
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