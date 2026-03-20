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
  const pcRef           = useRef(null);
  const localStreamRef  = useRef(null);
  const audioElRef      = useRef(null);
  // Buffer ICE candidates that arrive before setRemoteDescription completes
  const iceCandidateBuffer = useRef([]);
  const remoteDescSet      = useRef(false);

  // Named handlers so we can remove exactly these — not ALL listeners for the event
  const handlersRef = useRef({ offer: null, answer: null, ice: null });

  // ── Apply buffered ICE candidates after remote description is set ────────
  async function flushIceCandidates() {
    const pc = pcRef.current;
    if (!pc) return;
    console.log(`[WebRTC] flushing ${iceCandidateBuffer.current.length} buffered ICE candidates`);
    for (const candidate of iceCandidateBuffer.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[WebRTC] buffered ICE candidate error:", err.message);
      }
    }
    iceCandidateBuffer.current = [];
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  function endCall() {
    console.log("[WebRTC] endCall — cleaning up");

    // Remove exactly the handlers we registered — not all listeners
    const h = handlersRef.current;
    if (h.offer) { socket.off("webrtc-offer",         h.offer);  h.offer  = null; }
    if (h.answer){ socket.off("webrtc-answer",        h.answer); h.answer = null; }
    if (h.ice)   { socket.off("webrtc-ice-candidate", h.ice);    h.ice    = null; }

    // Reset ICE buffer state
    iceCandidateBuffer.current = [];
    remoteDescSet.current = false;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.onicecandidate           = null;
      pcRef.current.ontrack                  = null;
      pcRef.current.onconnectionstatechange  = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
      console.log("[WebRTC] peer connection closed");
    }

    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.pause();
    }
  }

  // ── Create RTCPeerConnection with full logging ────────────────────────────
  function createPC(toSocketId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log("[WebRTC] generated ICE candidate, sending to", toSocketId);
        socket.emit("webrtc-ice-candidate", { to: toSocketId, candidate });
      } else {
        console.log("[WebRTC] ICE gathering complete");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE failed — attempting restart");
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] connection state:", pc.connectionState);
    };

    pc.ontrack = ({ streams }) => {
      console.log("[WebRTC] ontrack fired — remote stream received");
      if (!streams || streams.length === 0) {
        console.warn("[WebRTC] ontrack fired but no streams");
        return;
      }
      if (!audioElRef.current) audioElRef.current = new Audio();
      audioElRef.current.srcObject = streams[0];
      audioElRef.current.autoplay  = true;
      audioElRef.current.play()
        .then(() => console.log("[WebRTC] remote audio playing"))
        .catch(err => console.warn("[WebRTC] autoplay blocked (user gesture may be needed):", err));
    };

    return pc;
  }

  // ── Register signaling listeners using named functions ────────────────────
  function registerSignaling(toSocketId) {
    // Answerer: receives offer → creates answer
    const onOffer = async ({ from, offer }) => {
      console.log("[WebRTC] received offer from", from);
      const pc = pcRef.current;
      if (!pc) { console.warn("[WebRTC] no pc when offer arrived"); return; }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("[WebRTC] setRemoteDescription (offer) done");
        remoteDescSet.current = true;
        await flushIceCandidates();       // apply any candidates that arrived early

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer });
        console.log("[WebRTC] sent answer to", from);
      } catch (err) {
        console.error("[WebRTC] offer handling failed:", err);
      }
    };

    // Offerer: receives answer
    const onAnswer = async ({ answer }) => {
      console.log("[WebRTC] received answer");
      const pc = pcRef.current;
      if (!pc) { console.warn("[WebRTC] no pc when answer arrived"); return; }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("[WebRTC] setRemoteDescription (answer) done");
        remoteDescSet.current = true;
        await flushIceCandidates();       // apply any candidates that arrived early
      } catch (err) {
        console.error("[WebRTC] answer handling failed:", err);
      }
    };

    // Both sides: receive ICE candidates
    const onIce = async ({ candidate }) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (!pc) return;

      if (!remoteDescSet.current) {
        // Remote description not set yet — buffer the candidate
        console.log("[WebRTC] buffering ICE candidate (remote desc not set yet)");
        iceCandidateBuffer.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("[WebRTC] addIceCandidate ok");
      } catch (err) {
        console.warn("[WebRTC] addIceCandidate error:", err.message);
      }
    };

    // Store references so endCall can remove exactly these
    handlersRef.current = { offer: onOffer, answer: onAnswer, ice: onIce };

    socket.on("webrtc-offer",         onOffer);
    socket.on("webrtc-answer",        onAnswer);
    socket.on("webrtc-ice-candidate", onIce);
  }

  // ── Start a call ──────────────────────────────────────────────────────────
  async function startCall({ playerA, playerB }) {
    const myId = socket.id;
    const iAmA = playerA === myId;
    const iAmB = playerB === myId;
    if (!iAmA && !iAmB) return;

    const toId = iAmA ? playerB : playerA;
    console.log("[WebRTC] startCall — iAmOfferer:", iAmA, "myId:", myId, "toId:", toId);

    // Always clean up any previous call before starting a new one
    endCall();

    // Get mic access
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log("[WebRTC] getUserMedia ok — tracks:", stream.getTracks().map(t => t.kind));
    } catch (err) {
      console.error("[WebRTC] getUserMedia failed:", err);
      return;
    }
    localStreamRef.current = stream;

    // Create PC and add tracks
    const pc = createPC(toId);
    pcRef.current = pc;
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log("[WebRTC] added local track:", track.kind, "enabled:", track.enabled);
    });

    // Register signaling handlers BEFORE sending offer
    registerSignaling(toId);

    // Only playerA (offerer) creates and sends the offer
    if (iAmA) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: toId, offer });
        console.log("[WebRTC] offer sent to", toId);
      } catch (err) {
        console.error("[WebRTC] createOffer failed:", err);
      }
    } else {
      console.log("[WebRTC] answerer ready — waiting for offer from", toId);
    }
  }

  return { startCall, endCall, localStreamRef, audioElRef };
}