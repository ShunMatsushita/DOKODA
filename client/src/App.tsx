import { useState, useEffect, useCallback } from 'react';
import { socket } from './socket';
import type { RoomInfo, GameState, Player } from 'dokoda-shared';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Result from './pages/Result';
import Countdown from './pages/Countdown';
import Rules from './components/Rules';

type Page = 'home' | 'lobby' | 'countdown' | 'game' | 'result';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [finalPlayers, setFinalPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);
  const [showRules, setShowRules] = useState(false);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on('room:updated', (roomInfo: RoomInfo) => {
      setRoom(roomInfo);
      if (roomInfo.phase === 'lobby') {
        setPage('lobby');
      } else if (roomInfo.phase === 'countdown') {
        setPage('countdown');
      }
    });

    socket.on('game:countdown', (count: number) => {
      setCountdownNum(count);
      setPage('countdown');
    });

    socket.on('game:state', (state: GameState) => {
      setGameState(state);
      if (state.phase === 'playing') {
        setPage('game');
      }
    });

    socket.on('game:finished', (players: Player[]) => {
      setFinalPlayers(players);
      setPage('result');
    });

    socket.on('error', (message: string) => {
      showError(message);
    });

    return () => {
      socket.off('room:updated');
      socket.off('game:state');
      socket.off('game:countdown');
      socket.off('game:finished');
      socket.off('error');
    };
  }, [showError]);

  const handleCreate = useCallback((playerName: string) => {
    socket.emit('room:create', playerName, (res) => {
      if (!res.ok) showError(res.error || '部屋の作成に失敗しました');
    });
  }, [showError]);

  const handleJoin = useCallback((code: string, playerName: string) => {
    socket.emit('room:join', code, playerName, (res) => {
      if (!res.ok) showError(res.error || '部屋への参加に失敗しました');
    });
  }, [showError]);

  const handleBackToLobby = useCallback(() => {
    socket.emit('game:backToLobby');
  }, []);

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {/* エラー表示 */}
      {error && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(233, 69, 96, 0.95)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 12,
          zIndex: 1000,
          fontWeight: 700,
          animation: 'fadeIn 0.3s ease',
        }}>
          {error}
        </div>
      )}

      {/* ルールボタン (常に表示) */}
      <button
        onClick={() => setShowRules(true)}
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 900,
          background: 'var(--bg-secondary)',
          border: '2px solid var(--accent)',
          color: 'var(--text-primary)',
          width: 40,
          height: 40,
          borderRadius: '50%',
          fontSize: 18,
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="ルール"
      >
        ?
      </button>

      {/* ルールモーダル */}
      {showRules && <Rules onClose={() => setShowRules(false)} />}

      {/* ページ */}
      {page === 'home' && (
        <Home onCreateRoom={handleCreate} onJoinRoom={handleJoin} />
      )}
      {page === 'lobby' && room && (
        <Lobby room={room} myId={socket.id || ''} />
      )}
      {page === 'countdown' && (
        <Countdown count={countdownNum} />
      )}
      {page === 'game' && gameState && (
        <Game gameState={gameState} myId={socket.id || ''} customSymbols={room?.customSymbols} />
      )}
      {page === 'result' && (
        <Result
          players={finalPlayers}
          myId={socket.id || ''}
          isHost={room?.players.find(p => p.id === (socket.id || ''))?.isHost ?? false}
          gameState={gameState}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}
