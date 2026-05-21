// src/socket.js
import { io } from "socket.io-client";

// Sous Vite, on utilise import.meta.env au lieu de process.env
const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3002"; // Pointage vers le port du serveur local

export const socket = io(URL, {
  autoConnect: false, // Recommandé par le guide officiel React de Socket.io
});
