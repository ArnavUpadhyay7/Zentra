import { useEffect, useRef } from "react";
import Phaser from "phaser";
import World from "./scene/World";
import socket from "../socket/socket";
import { useLocation, useParams } from "react-router-dom";

export default function Game() {
  const gameRef = useRef(null);
  const { roomId } = useParams();
  const { state } = useLocation();
  const username =
    state?.username || localStorage.getItem("vs_username") || "Player";
  const charIndex = state?.charIndex || 1;

  useEffect(() => {
    console.log("=== Game useEffect running ===");
    console.log("roomId:", roomId);
    console.log("username:", username);
    console.log("charIndex (from state):", state?.charIndex);
    console.log("socket.id:", socket.id);
    console.log("socket.connected:", socket.connected);
    console.log("socket.disconnected:", socket.disconnected);

    if (socket.disconnected) {
      console.log("Connecting socket...");
      socket.connect();
    } else {
      console.log("Socket already connected, skipping connect()");
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: "#1a1a2e",
      physics: { default: "arcade", arcade: { debug: false } },
      scene: [World],
    });

    game.registry.set("socket",    socket);
    game.registry.set("charIndex", charIndex);
    game.registry.set("roomId",    roomId);
    game.registry.set("username",  username);
    game.registry.set("myId",      socket.id);

    console.log("Registry set. myId:", socket.id);

    // Listen for Phaser scene being ready
    game.events.once("ready", () => {
      console.log("=== Phaser ready event fired ===");
      console.log("socket.id at ready:", socket.id);
      console.log("Is creator (has state.charIndex)?", !!state?.charIndex);

      // Update myId now that we're sure socket is connected
      game.registry.set("myId", socket.id);

      if (!state?.charIndex) {
        console.log("Emitting join-room:", { roomId, username });
        socket.emit("join-room", { roomId, username });
      } else {
        console.log("Creator — skipping join-room emit");
      }
    });

    // Debug: log ALL incoming socket events
    socket.onAny((event, ...args) => {
      console.log(`[SOCKET IN] ${event}`, args);
    });

    return () => {
      console.log("=== Game useEffect cleanup ===");
      socket.offAny();
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("player-moved");
      socket.off("room-state");
      game.destroy(true);
    };
  }, [roomId]);

  return <div ref={gameRef} />;
}