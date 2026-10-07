import { io, type Socket } from "socket.io-client";
import type { RealtimeMeasurementPayload } from "@/types/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000";

let socket: Socket | undefined;

export const getSocket = () => {
  socket ??= io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"]
  });

  return socket as Socket<{
    "measurement:new": (payload: RealtimeMeasurementPayload) => void;
  }>;
};
