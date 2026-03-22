import { useRef } from "react";
import { Room, RoomEvent, Track, createLocalAudioTrack } from "livekit-client";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;
const TOKEN_URL   = import.meta.env.VITE_API_URL || "http://localhost:4001";

export function useLiveKit() {
  const roomRef = useRef(null);

  async function fetchToken(roomId, userId) {
    const url = `${TOKEN_URL}/livekit-token?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}`;
    console.log("[LiveKit] fetching token from:", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error("No token in response");
    return data.token;
  }

  // ── Subscribe to remote participant audio ─────────────────────────────────
  function handleParticipant(participant) {
    // Attach any tracks already published
    participant.trackPublications.forEach(pub => {
      if (pub.track && pub.kind === Track.Kind.Audio) {
        pub.track.attach();
        console.log("[LiveKit] attached existing audio from", participant.identity);
      }
    });
    // Attach tracks published after we subscribed
    participant.on("trackSubscribed", (track) => {
      if (track.kind === Track.Kind.Audio) {
        track.attach();
        console.log("[LiveKit] subscribed to audio from", participant.identity);
      }
    });
  }

  // ── Join LiveKit room and publish mic ─────────────────────────────────────
  async function joinRoom({ roomId, userId }) {
    leaveRoom(); // always clean up first

    console.log("[LiveKit] joining room:", roomId, "as:", userId);

    let token;
    try {
      token = await fetchToken(roomId, userId);
    } catch (err) {
      console.error("[LiveKit] token fetch failed:", err);
      return;
    }

    // Use liveKitRoom to avoid collision with imported Room class
    const liveKitRoom = new Room({
      autoSubscribe: true,
      adaptiveStream: true,
      dynacast: true,
    });

    roomRef.current = liveKitRoom;

    liveKitRoom.on(RoomEvent.Connected, () => {
      console.log("[LiveKit] connected — participants:", liveKitRoom.remoteParticipants.size);
      liveKitRoom.remoteParticipants.forEach(handleParticipant);
    });

    liveKitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log("[LiveKit] participant joined:", participant.identity);
      handleParticipant(participant);
    });

    liveKitRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log("[LiveKit] participant left:", participant.identity);
    });

    liveKitRoom.on(RoomEvent.Disconnected, () => {
      console.log("[LiveKit] disconnected from room");
    });

    try {
      if (!LIVEKIT_URL) throw new Error("VITE_LIVEKIT_URL is not set in your .env file");
      await liveKitRoom.connect(LIVEKIT_URL, token);
      console.log("[LiveKit] connect ok");
    } catch (err) {
      console.error("[LiveKit] connect failed:", err);
      leaveRoom();
      return;
    }

    try {
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
      });
      await liveKitRoom.localParticipant.publishTrack(audioTrack);
      console.log("[LiveKit] mic published");
    } catch (err) {
      console.error("[LiveKit] publish failed:", err);
    }
  }

  // ── Leave and clean up ────────────────────────────────────────────────────
  function leaveRoom() {
    if (roomRef.current) {
      console.log("[LiveKit] leaving room");
      roomRef.current.disconnect();
      roomRef.current = null;
    }
  }

  // ── Mic on/off ────────────────────────────────────────────────────────────
  function setMicEnabled(enabled) {
    const r = roomRef.current;
    if (!r) return;
    r.localParticipant.setMicrophoneEnabled(enabled);
    console.log("[LiveKit] mic", enabled ? "on" : "muted");
  }

  // ── Speaker on/off ────────────────────────────────────────────────────────
  function setSpeakerEnabled(enabled) {
    const r = roomRef.current;
    if (!r) return;
    r.remoteParticipants.forEach(participant => {
      participant.trackPublications.forEach(pub => {
        if (pub.track?.kind === Track.Kind.Audio) {
          pub.track.attachedElements.forEach(el => {
            el.volume = enabled ? 1 : 0;
          });
        }
      });
    });
    console.log("[LiveKit] speaker", enabled ? "on" : "off");
  }

  return { joinRoom, leaveRoom, setMicEnabled, setSpeakerEnabled };
}