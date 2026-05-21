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
  const [roomError, setRoomError] = useState(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      const savedRoomId = localStorage.getItem('roomId');
      if (savedRoomId) {
        socket.emit('join_room', { roomId: savedRoomId });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onGameUpdate(serverState) {
      dispatch(updateGameState(serverState));
    }

    function onPlayerAssigned({ playerId }) {
      dispatch(setLocalPlayerId(playerId));
    }

    function onRoomFull() {
      setRoomError('Cette room est pleine ou impossible à rejoindre.');
      localStorage.removeItem('roomId');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_updated', onGameUpdate);
    socket.on('player_assigned', onPlayerAssigned);
    socket.on('room_full', onRoomFull);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_updated', onGameUpdate);
      socket.off('player_assigned', onPlayerAssigned);
      socket.off('room_full', onRoomFull);
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
      {roomError && (
        <div
          style={{
            background: '#ffcccc',
            color: '#660000',
            padding: '8px',
            textAlign: 'center',
            fontSize: '13px',
          }}
        >
          {roomError}
        </div>
      )}

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