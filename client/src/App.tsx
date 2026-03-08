import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from './socket';
import type { RoomInfo, GameState, Player } from 'dokoda-shared';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Result from './pages/Result';
import Countdown from './pages/Countdown';
import Rules from './components/Rules';
import { playCountdown, playStart, playFinish, isMuted, setMuted } from './sounds';
import { vibrateCountdown, vibrateStart, vibrateFinish } from './haptics';
import { useTheme } from './useTheme';

const THEME_ICONS: Record<string, string> = {
  dark: '🌙',
  light: '☀️',
  ocean: '🌊',
  sakura: '🌸',
};

const SESSION_KEY = 'dokoda_session';

interface SessionData {
  roomCode: string;
  token: string;
}

function saveSession(roomCode: string, token: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, token }));
}

function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.roomCode && data.token) return data;
    return null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

type Page = 'home' | 'lobby' | 'countdown' | 'game' | 'result';

export default function App() {
  const { theme, cycleTheme } = useTheme();
  const [page, setPage] = useState<Page>('home');
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [finalPlayers, setFinalPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);
  const [showRules, setShowRules] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isMuted);
  const [disconnected, setDisconnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const rejoinAttempted = useRef(false);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  }, []);

  // セッション復帰を試みる
  const tryRejoin = useCallback(() => {
    const session = loadSession();
    if (!session || rejoinAttempted.current) return;
    rejoinAttempted.current = true;
    setReconnecting(true);

    socket.emit('room:rejoin', session.roomCode, session.token, (res) => {
      setReconnecting(false);
      if (!res.ok) {
        clearSession();
        rejoinAttempted.current = false;
      }
      // 成功時は room:updated / game:state が届いてページ遷移する
    });
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setDisconnected(false);
      // ページがhome以外（=ルームにいた）なら再接続を試みる
      // または初回接続時にセッションがあれば復帰を試みる
      const session = loadSession();
      if (session) {
        rejoinAttempted.current = false;
        tryRejoin();
      }
    });

    socket.on('disconnect', () => {
      // ルームにいる場合のみ切断オーバーレイを表示
      const session = loadSession();
      if (session) {
        setDisconnected(true);
      }
    });

    socket.on('room:updated', (roomInfo: RoomInfo) => {
      setRoom(roomInfo);
      setDisconnected(false);
      setReconnecting(false);
      if (roomInfo.phase === 'lobby') {
        setPage('lobby');
      } else if (roomInfo.phase === 'countdown') {
        setPage('countdown');
      }
    });

    socket.on('game:countdown', (count: number) => {
      setCountdownNum(count);
      setPage('countdown');
      if (count > 0) { playCountdown(); vibrateCountdown(); }
      if (count === 0) { playStart(); vibrateStart(); }
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
      vibrateFinish();
    });

    socket.on('error', (message: string) => {
      showError(message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:updated');
      socket.off('game:state');
      socket.off('game:countdown');
      socket.off('game:finished');
      socket.off('error');
    };
  }, [showError, tryRejoin]);

  const handleCreate = useCallback((playerName: string, password: string) => {
    socket.emit('room:create', playerName, password, (res) => {
      if (!res.ok) {
        showError(res.error || '部屋の作成に失敗しました');
      } else if (res.code && res.token) {
        saveSession(res.code, res.token);
      }
    });
  }, [showError]);

  const handleJoin = useCallback((code: string, playerName: string, password: string) => {
    socket.emit('room:join', code, playerName, password, (res) => {
      if (!res.ok) {
        if (res.needPassword) {
          showError('パスワードが必要です');
        } else {
          showError(res.error || '部屋への参加に失敗しました');
        }
      } else if (res.token) {
        saveSession(code.trim().toUpperCase(), res.token);
      }
    });
  }, [showError]);

  const handleBackToLobby = useCallback(() => {
    socket.emit('game:backToLobby');
  }, []);

  // ホームに戻る時はセッションをクリア
  const handleGoHome = useCallback(() => {
    clearSession();
    setRoom(null);
    setGameState(null);
    setFinalPlayers([]);
    setPage('home');
  }, []);

  // ホーム画面での復帰ボタン
  const handleRejoinFromHome = useCallback(() => {
    const session = loadSession();
    if (!session) return;
    setReconnecting(true);
    rejoinAttempted.current = false;
    tryRejoin();
  }, [tryRejoin]);

  const savedSession = page === 'home' ? loadSession() : null;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {/* 切断オーバーレイ */}
      {disconnected && page !== 'home' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 40, height: 40,
            border: '4px solid var(--accent)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>
            再接続中...
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            接続が切れました。自動的に再接続を試みています
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: 16, fontSize: 14 }}
            onClick={handleGoHome}
          >
            ホームに戻る
          </button>
        </div>
      )}

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
          onClick={cycleTheme}
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent)',
            color: 'var(--text-primary)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={`テーマ: ${theme}`}
        >
          {THEME_ICONS[theme]}
        </button>
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
        <>
          <Home onCreateRoom={handleCreate} onJoinRoom={handleJoin} />
          {savedSession && !reconnecting && (
            <div style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 800,
            }}>
              <button
                className="btn-primary"
                onClick={handleRejoinFromHome}
                style={{ fontSize: 14, padding: '10px 24px' }}
              >
                ルームに戻る ({savedSession.roomCode})
              </button>
            </div>
          )}
          {reconnecting && (
            <div style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 800,
              color: 'var(--text-secondary)',
              fontSize: 14,
            }}>
              再接続中...
            </div>
          )}
        </>
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
