import { useState, useEffect, useCallback } from 'react';
import { socket } from './socket';
import type { RoomInfo, GameState, Player } from 'dokoda-shared';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Result from './pages/Result';
import Countdown from './pages/Countdown';
import Rules from './components/Rules';
import { playCountdown, playStart, playFinish, isMuted, setMuted } from './sounds';

type Page = 'home' | 'lobby' | 'countdown' | 'game' | 'result';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [finalPlayers, setFinalPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);
  const [showRules, setShowRules] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isMuted);

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
      if (count > 0) playCountdown();
      if (count === 0) playStart();
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
      playFinish();
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
  }, []);

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

      {/* ヘッダーボタン (常に表示) */}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 900, display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            const next = !soundMuted;
            setSoundMuted(next);
            setMuted(next);
          }}
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent)',
            color: 'var(--text-primary)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={soundMuted ? 'サウンドON' : 'サウンドOFF'}
        >
          {soundMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          )}
        </button>
        <button
          onClick={() => setShowRules(true)}
          style={{
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
      </div>

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
        <Game gameState={gameState} myId={socket.id || ''} />
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
