import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "https://zentra-tx0d.onrender.com", {
  autoConnect:  false,
  reconnection: false,
});

export default socket;