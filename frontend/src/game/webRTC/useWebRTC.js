import { useRef } from "react";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export function useWebRTC(socket) {
  const pcRef          = useRef(null);
  const localStreamRef = useRef(null); // exported so Game.jsx can set track.enabled
  const audioElRef     = useRef(null); // exported so Game.jsx can set volume

  function endCall() {
    console.log("[WebRTC] endCall");
    socket.off("webrtc-offer");
    socket.off("webrtc-answer");
    socket.off("webrtc-ice-candidate");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.onicecandidate          = null;
      pcRef.current.ontrack                 = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.pause();
    }
  }

  function createPC(toSocketId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("webrtc-ice-candidate", { to: toSocketId, candidate });
    };

    pc.ontrack = ({ streams }) => {
      console.log("[WebRTC] received remote track");
      if (!audioElRef.current) audioElRef.current = new Audio();
      audioElRef.current.srcObject = streams[0];
      audioElRef.current.autoplay  = true;
      audioElRef.current.play().catch(err =>
        console.warn("[WebRTC] autoplay blocked:", err)
      );
    };

    pc.onconnectionstatechange = () =>
      console.log("[WebRTC] connection state:", pc.connectionState);

    return pc;
  }

  function registerSignaling(toSocketId) {
    socket.on("webrtc-offer", async ({ from, offer }) => {
      console.log("[WebRTC] received offer from", from);
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer });
        console.log("[WebRTC] sent answer");
      } catch (err) {
        console.error("[WebRTC] offer handling failed:", err);
      }
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      console.log("[WebRTC] received answer");
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("[WebRTC] answer handling failed:", err);
      }
    });

    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      if (!pcRef.current || !candidate) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[WebRTC] ICE error (safe):", err.message);
      }
    });
  }

  async function startCall({ playerA, playerB }) {
    endCall(); // always clean up any previous call first

    const myId = socket.id;
    const iAmA = playerA === myId;
    const iAmB = playerB === myId;
    if (!iAmA && !iAmB) return;

    const toId = iAmA ? playerB : playerA;
    console.log("[WebRTC] startCall — iAmOfferer:", iAmA, "to:", toId);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      console.error("[WebRTC] getUserMedia failed:", err);
      return;
    }
    localStreamRef.current = stream;

    const pc = createPC(toId);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Register signaling BEFORE creating offer
    registerSignaling(toId);

    if (iAmA) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: toId, offer });
        console.log("[WebRTC] sent offer");
      } catch (err) {
        console.error("[WebRTC] createOffer failed:", err);
      }
    }
    // iAmB waits for the offer via the registered signaling listener
  }

  return { startCall, endCall, localStreamRef, audioElRef };
}