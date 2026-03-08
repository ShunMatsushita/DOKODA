import { useState, useCallback, useEffect, useRef } from 'react';
import { socket } from '../socket';
import type { GameState, MatchResult } from 'dokoda-shared';
import CardView from '../components/Card';

interface Props {
  gameState: GameState;
  myId: string;
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function Game({ gameState, myId }: Props) {
  const [lastMatch, setLastMatch] = useState<MatchResult | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 経過時間タイマー
  useEffect(() => {
    if (gameState.startedAt > 0 && gameState.phase === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - gameState.startedAt);
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.startedAt, gameState.phase]);

  useEffect(() => {
    const handleMatch = (result: MatchResult) => {
      setLastMatch(result);
      setTimeout(() => setLastMatch(null), 1500);
    };

    const handleWrong = (data: { cooldownMs: number }) => {
      setCooldown(true);
      setTimeout(() => setCooldown(false), Math.max(0, data.cooldownMs));
    };

    const handleTimeUp = () => {
      setTimeUp(true);
    };

    socket.on('game:match', handleMatch);
    socket.on('game:wrong', handleWrong);
    socket.on('game:timeUp', handleTimeUp);

    return () => {
      socket.off('game:match', handleMatch);
      socket.off('game:wrong', handleWrong);
      socket.off('game:timeUp', handleTimeUp);
    };
  }, []);

  const handleSymbolClick = useCallback((symbolId: number) => {
    if (cooldown) return;
    socket.emit('game:claim', symbolId);
  }, [cooldown]);

  const isTimeAttack = gameState.mode === 'timeAttack';
  const remaining = isTimeAttack && gameState.timeLimitSec > 0
    ? Math.max(0, gameState.timeLimitSec * 1000 - elapsed)
    : 0;
  const isUrgent = isTimeAttack && remaining > 0 && remaining < 10000;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 10,
      gap: 6,
      overflow: 'hidden',
    }}>
      {/* タイマーバー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        width: '100%',
        padding: '4px 0',
        flexShrink: 0,
      }}>
        {/* 経過時間 */}
        <div style={{
          fontSize: 18,
          fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          color: isTimeAttack
            ? (isUrgent ? 'var(--accent)' : 'var(--warning)')
            : 'var(--text-primary)',
          animation: isUrgent ? 'pulse 0.5s infinite' : undefined,
        }}>
          {isTimeAttack ? formatTime(remaining) : formatTime(elapsed)}
        </div>

        {/* 進捗 (タイムアタック) */}
        {isTimeAttack && (
          <div style={{
            fontSize: 13,
            color: 'var(--success)',
            fontWeight: 700,
          }}>
            {gameState.clearedCards}/{gameState.totalCards - 1} クリア
          </div>
        )}
      </div>

      {/* スコアバー */}
      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        flexShrink: 0,
      }}>
        {gameState.players.map((p) => (
          <div
            key={p.id}
            style={{
              background: p.id === myId ? 'rgba(233, 69, 96, 0.3)' : 'var(--bg-secondary)',
              padding: '3px 10px',
              borderRadius: 6,
              fontSize: 12,
              display: 'flex',
              gap: 5,
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700 }}>{p.name}</span>
            <span style={{ color: 'var(--warning)' }}>{p.score}pt</span>
            {!isTimeAttack && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>残{p.cardCount}</span>
            )}
          </div>
        ))}
      </div>

      {/* カードエリア */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
      }}>
        {/* 中央カード */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 3 }}>
            中央カード {gameState.drawPileCount > 0 && `(山札 ${gameState.drawPileCount})`}
          </p>
          {gameState.centerCard && (
            <CardView
              card={gameState.centerCard}
              onSymbolClick={handleSymbolClick}
              disabled={cooldown}
              size={250}
            />
          )}
        </div>

        {/* 自分のカード */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 3 }}>
            あなたのカード {!isTimeAttack && gameState.myCardCount > 1 && `(残り ${gameState.myCardCount})`}
          </p>
          {gameState.myCard ? (
            <CardView
              card={gameState.myCard}
              onSymbolClick={handleSymbolClick}
              disabled={cooldown}
              size={250}
            />
          ) : (
            <div style={{
              width: 250, height: 250, borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', fontSize: 14,
            }}>
              {isTimeAttack ? '補充待ち...' : 'カードなし'}
            </div>
          )}
        </div>
      </div>

      {/* メッセージエリア (下部固定) */}
      <div style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexShrink: 0,
      }}>
        {timeUp && (
          <div style={{
            background: 'rgba(233, 69, 96, 0.9)',
            color: 'white',
            padding: '6px 20px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 15,
          }}>
            タイムアップ！
          </div>
        )}
        {lastMatch && !timeUp && (
          <div style={{
            background: 'rgba(0, 210, 211, 0.9)',
            color: '#000',
            padding: '6px 20px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 15,
            animation: 'fadeIn 0.15s ease',
          }}>
            {lastMatch.playerId === myId ? 'あなた' : lastMatch.playerName} が見つけた！
          </div>
        )}
        {cooldown && !lastMatch && !timeUp && (
          <div style={{
            background: 'rgba(233, 69, 96, 0.9)',
            color: 'white',
            padding: '6px 20px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 15,
          }}>
            はずれ！
          </div>
        )}
      </div>
    </div>
  );
}
