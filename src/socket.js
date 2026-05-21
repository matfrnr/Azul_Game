// src/socket.js
import { io } from "socket.io-client";

// Sous Vite, on utilise import.meta.env au lieu de process.env
const isProd = import.meta.env.MODE === "production";
const URL = isProd ? undefined : "http://localhost:3002"; // Pointage vers le port du serveur (3002)

export const socket = io(URL, {
  autoConnect: false, // Recommandé par le guide officiel React de Socket.io
});
