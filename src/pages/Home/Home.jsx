import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Stone } from "../../components/Stones";
import { STONE_TYPES } from "../../constants";
import styles from "./Home.module.scss";
import { socket } from "../../socket";

const Home = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState(null);

  const generateRoomId = () =>
    Math.random().toString(36).slice(2, 8).toUpperCase();

  const joinRoom = (roomId) => {
    localStorage.setItem('roomId', roomId);
    socket.emit('join_room', { roomId });
    navigate('/game');
  };

  const handleCreateRoom = () => {
    const roomId = generateRoomId();
    joinRoom(roomId);
  };

  const handleJoinRoom = () => {
    const trimmedRoom = roomName.trim().toUpperCase();
    if (!trimmedRoom) {
      setError('Veuillez entrer un code de room valide.');
      return;
    }
    setError(null);
    joinRoom(trimmedRoom);
  };

  const handleViewRules = () => {
    navigate("/rules");
  };

  return (
    <div className={styles.home}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleMain}>AZUL</span>
            <span className={styles.titleSub}>Infinity Stones</span>
          </h1>

          <p className={styles.subtitle}>
            Collect the legendary Infinity Stones and build your perfect pattern
          </p>
        </header>

        <div className={styles.stonesPreview}>
          {Object.values(STONE_TYPES).map((stone) => (
            <Stone key={stone} stoneType={stone} size="large" />
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="primary" size="large" onClick={handleCreateRoom}>
            Créer une room
          </Button>
          <Button variant="ghost" size="large" onClick={handleViewRules}>
            Voir les règles
          </Button>
        </div>

        <div className={styles.joinRoom}>
          <p>Rejoindre une room existante</p>
          <div className={styles.joinActions}>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Code room"
              className={styles.roomInput}
            />
            <Button variant="secondary" size="medium" onClick={handleJoinRoom}>
              Rejoindre
            </Button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <footer className={styles.footer}>
          <p>
            A Marvel-themed reimagining of the award-winning board game Azul
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
