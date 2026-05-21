import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stone } from '../../components/Stones';
import { STONE_TYPES } from '../../constants';
import styles from './Game.module.scss';
import { Button } from '../../components/Button';
import { socket } from '../../socket';

const Game = () => {
    const navigate = useNavigate();
    const [showBag, setShowBag] = useState(false);
    const { factories, center, players, currentPlayerId, heldStones, gameState, bag, localPlayerId, playerCount, roomSize, hostPlayerId } = useSelector(state => state.game);

    const roomId = localStorage.getItem('roomId') || '------';
    const bagStats = (bag || []).reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    const isMyTurn = gameState === 'PLAYING' && localPlayerId === currentPlayerId;
    const expectedPlayers = roomSize || 4;
    const isRoomCreator = localPlayerId && localPlayerId === hostPlayerId;
    const canStartGame = isRoomCreator && playerCount === expectedPlayers;

    if (gameState === 'LOBBY') {
        return (
            <div className={styles.waitingRoom}>
                <h2>En attente des joueurs...</h2>
                <p>Code room : <strong>{roomId}</strong></p>
                <p>Joueurs connectés : <strong>{playerCount || 1}/{expectedPlayers}</strong></p>
                <p>Vous êtes le joueur {localPlayerId || '?'}</p>
                {isRoomCreator ? (
                    <div className={styles.hostControls}>
                        <Button
                            variant="primary"
                            size="medium"
                            disabled={!canStartGame}
                            onClick={() => {
                                console.log('Joueur 1 clique sur Démarrer', { isRoomCreator, canStartGame, playerCount, expectedPlayers, hostPlayerId, localPlayerId });
                                socket.emit('start_game');
                            }}
                        >
                            {canStartGame ? 'Démarrer la partie' : 'En attente des joueurs...'}
                        </Button>
                    </div>
                ) : (
                    <p>En attente du créateur pour démarrer la partie.</p>
                )}
                <Button variant="ghost" size="small" onClick={() => navigate('/')}>Retour à l'accueil</Button>
            </div>
        );
    }

    if (players.length === 0) return null;

    const WALL_ORDER = [
        [STONE_TYPES.SPACE, STONE_TYPES.MIND, STONE_TYPES.REALITY, STONE_TYPES.POWER, STONE_TYPES.TIME],
        [STONE_TYPES.TIME, STONE_TYPES.SPACE, STONE_TYPES.MIND, STONE_TYPES.REALITY, STONE_TYPES.POWER],
        [STONE_TYPES.POWER, STONE_TYPES.TIME, STONE_TYPES.SPACE, STONE_TYPES.MIND, STONE_TYPES.REALITY],
        [STONE_TYPES.REALITY, STONE_TYPES.POWER, STONE_TYPES.TIME, STONE_TYPES.SPACE, STONE_TYPES.MIND],
        [STONE_TYPES.MIND, STONE_TYPES.REALITY, STONE_TYPES.POWER, STONE_TYPES.TIME, STONE_TYPES.SPACE],
    ];

    if (gameState === "GAME_OVER") {
        const sorted = [...players].sort((a, b) => b.score - a.score);
        return (
            <div className={styles.gameOverOverlay}>
                <div className={styles.finalModal}>
                    <h2>🏆 VICTOIRE DU JOUEUR {sorted[0].id} 🏆</h2>
                    <div className={styles.resultsContainer}>
                        {sorted.map(p => (
                            <div key={p.id} className={styles.playerResultCard}>
                                <h3>Joueur {p.id}</h3>
                                <div className={styles.finalWallPreview}>
                                    {p.wall.map((row, i) => (
                                        <div key={i} className={styles.row}>
                                            {row.map((cell, j) => (
                                                <div key={j} className={`${styles.cell} ${cell ? styles.filled : ''}`}>
                                                    {cell ? <Stone stoneType={cell} size="small" /> : <div className={styles.ghost}><Stone stoneType={WALL_ORDER[i][j]} size="small" /></div>}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <p>Score final : {p.score}</p>
                            </div>
                        ))}
                    </div>
                    <Button variant="primary" size="large" onClick={() => navigate('/')}>
                        Menu Principal
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.gameContainer}>
            <header className={styles.header}>
                <h1>TOUR : JOUEUR {currentPlayerId} {isMyTurn ? " (C'est vous ! ⚡)" : " (Attente de l'adversaire... ⏳)"}</h1>
                <h3>Vous êtes le : Joueur {localPlayerId}</h3>                <Button size="small" onClick={() => setShowBag(true)}>
                    👜 Voir le Sac ({bag?.length || 0})
                </Button>
                {heldStones && <div className={styles.hand}>Main: {heldStones.count}x <Stone stoneType={heldStones.type} size="small" /></div>}
            </header>

            {showBag && (
                <div className={styles.modalOverlay} onClick={() => setShowBag(false)}>
                    <div className={styles.bagModal} onClick={e => e.stopPropagation()}>
                        <h2>Contenu du Sac</h2>
                        <div className={styles.bagGrid}>
                            {Object.entries(bagStats).map(([type, count]) => (
                                <div key={type} className={styles.bagItem}>
                                    <Stone stoneType={type} size="medium" />
                                    <span>x{count}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="secondary" size="small" onClick={() => setShowBag(false)} className={styles.closeBagBtn}>
                            Fermer
                        </Button>
                    </div>
                </div>
            )}

            <main className={styles.mainLayout}>
                <section className={styles.commonArea}>
                    <div className={styles.factories}>
                        {factories.map((stones, i) => (
                            <div key={i} className={styles.factory}>
                                {stones.map((s, j) => <div key={j} onClick={() => {
                                    if (!heldStones && isMyTurn) {
                                        socket.emit('player_pick_factory', { factoryIndex: i, stoneType: s });
                                    }
                                }}><Stone stoneType={s} size="medium" /></div>)}
                            </div>
                        ))}
                    </div>
                    <div className={styles.center}>
                        {center.map((s, i) => <div key={i} onClick={() => {
                            if (!heldStones && isMyTurn) {
                                socket.emit('player_pick_center', { stoneType: s });
                            }
                        }}><Stone stoneType={s} size="small" /></div>)}
                    </div>
                </section>

                <section className={styles.playersContainer}>
                    {players.map(p => (
                        <div key={p.id} className={`${styles.playerBoard} ${currentPlayerId === p.id ? styles.active : ''}`}>
                            <h3>Joueur {p.id} | Score: {p.score}</h3>
                            <div className={styles.boardGrid}>
                                <div className={styles.patterns}>
                                    {p.patternLines.map((line, i) => {
                                        const colIndex = heldStones ? WALL_ORDER[i].indexOf(heldStones.type) : -1;
                                        const isInvalid = heldStones && (
                                            p.wall[i][colIndex] !== null ||
                                            line.some(s => s !== null && s !== heldStones.type)
                                        );
                                        return (
                                            <div key={i}
                                                className={`${styles.line} ${isInvalid ? styles.invalid : ''}`}
                                                onClick={() => {
                                                    if (heldStones && isMyTurn && currentPlayerId === p.id) {
                                                        socket.emit('player_place_stones', { lineIndex: i });
                                                    }
                                                }}
                                            >
                                                <div className={styles.lineSlots}>
                                                    {line.map((s, j) => <div key={j} className={styles.slot}>{s && <Stone stoneType={s} size="small" />}</div>)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className={styles.wall}>
                                    {p.wall.map((row, i) => (
                                        <div key={i} className={styles.row}>
                                            {row.map((cell, j) => (
                                                <div key={j} className={`${styles.cell} ${cell ? styles.filled : ''}`}>
                                                    {cell ? <Stone stoneType={cell} size="small" /> : <div className={styles.ghost}><Stone stoneType={WALL_ORDER[i][j]} size="small" /></div>}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.floor}>
                                {Array(7).fill(null).map((_, i) => (
                                    <div key={i} className={styles.floorSlot}>
                                        <span className={styles.penalty}>{-1 * (i < 2 ? 1 : i < 5 ? 2 : 3)}</span>
                                        {p.floorLine[i] === "FIRST_PLAYER" ? <div className={styles.firstMarker}>1st</div> : p.floorLine[i] && <Stone stoneType={p.floorLine[i]} size="small" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default Game;