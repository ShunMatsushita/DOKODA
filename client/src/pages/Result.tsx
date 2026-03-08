import type { Player, GameState } from 'dokoda-shared';

interface Props {
  players: Player[];
  myId: string;
  isHost: boolean;
  gameState: GameState | null;
  onBackToLobby: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function Result({ players, myId, isHost, gameState, onBackToLobby }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const totalScore = sorted.reduce((sum, p) => sum + p.score, 0);
  const isTimeAttack = gameState?.mode === 'timeAttack';
  const isCleared = isTimeAttack && gameState
    ? gameState.clearedCards >= gameState.totalCards - 1
    : false;
  const elapsedMs = gameState && gameState.startedAt > 0 ? Date.now() - gameState.startedAt : 0;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
      padding: 20,
    }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--warning)' }}>
        ゲーム終了！
      </h1>

      {isTimeAttack ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 40,
            fontWeight: 900,
            color: isCleared ? 'var(--success)' : 'var(--accent)',
          }}>
            {isCleared ? '全クリア！' : 'タイムアップ...'}
          </div>
          <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8 }}>
            {gameState && `${gameState.clearedCards}/${gameState.totalCards - 1} カードクリア`}
          </div>
          <div style={{ fontSize: 20, color: 'var(--warning)', fontWeight: 700, marginTop: 4 }}>
            タイム: {formatTime(isCleared ? elapsedMs : (gameState?.timeLimitSec ?? 0) * 1000)}
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: 44,
          fontWeight: 900,
          color: 'var(--accent)',
          textAlign: 'center',
        }}>
          {sorted[0]?.name} の勝ち！
        </div>
      )}

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
          {isTimeAttack ? 'チームスコア' : '最終スコア'}
        </p>

        {isTimeAttack && (
          <div style={{
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 900,
            color: 'var(--warning)',
            marginBottom: 16,
          }}>
            合計 {totalScore} pt
          </div>
        )}

        {sorted.map((player, i) => (
          <div
            key={player.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: player.id === myId ? 'rgba(233, 69, 96, 0.15)' : 'transparent',
              marginBottom: 4,
            }}
          >
            {!isTimeAttack && (
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 14,
                background: i === 0 ? 'var(--warning)' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--bg-card)',
                color: i < 3 ? '#000' : 'var(--text-primary)',
              }}>
                {i + 1}
              </span>
            )}
            <span style={{ flex: 1, fontWeight: 700 }}>{player.name}</span>
            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>
              {player.score} pt
            </span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button className="btn-primary" onClick={onBackToLobby}>
          部屋に戻る
        </button>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          ホストが次のゲームを準備中...
        </p>
      )}
    </div>
  );
}
