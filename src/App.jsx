// src/App.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { socket } from './socket';
import { updateGameState, setLocalPlayerId } from './store/gameSlice';

// Importation de vos pages et styles
import Home from './pages/Home/Home';
import Game from './pages/Game/Game';
import Rules from './pages/Rules/Rules';
import './styles/main.scss';

function App() {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      // 👈 REJOINDRE LE SALON DÈS LA CONNEXION
      socket.emit("join_room", { roomId: "room1" });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onGameUpdate(serverState) {
      dispatch(updateGameState(serverState));
    }

    // 👈 CAPTURER LE RÔLE ATTRIBUÉ PAR LE SERVEUR
    function onPlayerAssigned({ playerId }) {
      dispatch(setLocalPlayerId(playerId));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_updated', onGameUpdate);
    socket.on('player_assigned', onPlayerAssigned); // 👈 Ajouter l'écouteur

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_updated', onGameUpdate);
      socket.off('player_assigned', onPlayerAssigned); // 👈 Nettoyer
      socket.disconnect();
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      {/* Petit bandeau indicateur de l'état de la connexion en temps réel */}
      <div
        style={{
          background: isConnected ? '#4CAF50' : '#F44336',
          color: 'white',
          padding: '6px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 'bold',
          transition: 'background 0.3s ease'
        }}
      >
        {isConnected ? "🟢 Session de jeu en ligne connectée" : "🔴 Déconnecté du serveur de jeu"}
      </div>

      {/* Configuration de vos routes de navigation */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/rules" element={<Rules />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;