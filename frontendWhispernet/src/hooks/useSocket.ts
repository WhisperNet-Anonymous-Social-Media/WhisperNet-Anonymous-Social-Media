import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001"; // Ensure this matches your backend PORT
let sharedSocket: Socket | null = null;
let subscribers = 0;

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!sharedSocket) {
      sharedSocket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 30000,
      });
    }

    const emitJoin = () => {
      try {
        const token = localStorage.getItem("whispernet_token");
        if (!token) return;
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.pseudonym) {
          sharedSocket?.emit("join_chat", payload.pseudonym);
        }
      } catch (_) {}
    };

    subscribers += 1;
    setSocket(sharedSocket);
    if (sharedSocket?.connected) emitJoin();
    sharedSocket?.on("connect", emitJoin);

    return () => {
      sharedSocket?.off("connect", emitJoin);
      subscribers -= 1;
      if (subscribers <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, []);

  return socket;
};
