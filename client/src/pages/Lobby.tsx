import { socket } from '../socket';
import type { RoomInfo, GameMode, GameSettings } from 'dokoda-shared';
import {
  MAX_PENALTY_COOLDOWN,
  TOTAL_CARDS,
  MIN_TIME_LIMIT_SEC,
  MAX_TIME_LIMIT_SEC,
  getMinCards,
} from 'dokoda-shared';

interface Props {
  room: RoomInfo;
  myId: string;
}

const MODE_LABELS: Record<GameMode, { name: string; desc: string }> = {
  tower: { name: 'ザ・タワー', desc: '手札を早くなくした人の勝ち' },
  well: { name: 'ザ・ウェル', desc: 'カードを多く集めた人の勝ち' },
  timeAttack: { name: 'タイムアタック', desc: '制限時間内に全員で全クリア！' },
};

export default function Lobby({ room, myId }: Props) {
  const isHost = room.players.find((p) => p.id === myId)?.isHost ?? false;
  const canStart = room.settings.mode === 'timeAttack'
    ? room.players.length >= 1
    : room.players.length >= 2;
  const settings = room.settings;
  const minCards = getMinCards(settings.mode, room.players.length);

  const updateSettings = (partial: Partial<GameSettings>) => {
    const next = { ...settings, ...partial };
    // カード枚数が最小未満なら自動調整
    if (next.cardCount > 0 && next.cardCount < getMinCards(next.mode, room.players.length)) {
      next.cardCount = getMinCards(next.mode, room.players.length);
    }
    socket.emit('room:settings', next);
  };

  const handleStart = () => {
    socket.emit('game:start');
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      padding: 20,
      overflowY: 'auto',
    }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--accent)' }}>
        DOKODA
      </h1>

      {/* ルームコード */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 16,
        padding: '16px 32px',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>
          ルームコード
        </p>
        <p style={{
          fontSize: 44,
          fontWeight: 900,
          letterSpacing: 12,
          color: 'var(--warning)',
        }}>
          {room.code}
        </p>
      </div>

      {/* プレイヤーリスト */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        maxWidth: 400,
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>
          プレイヤー ({room.players.length}/8)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {room.players.map((player) => (
            <div
              key={player.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px', borderRadius: 8,
                background: player.id === myId ? 'rgba(233, 69, 96, 0.15)' : 'transparent',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: player.connected ? 'var(--success)' : '#666',
              }} />
              <span style={{ fontWeight: player.id === myId ? 700 : 400, fontSize: 14 }}>
                {player.name}
              </span>
              {player.isHost && (
                <span style={{
                  fontSize: 11, background: 'var(--warning)', color: '#000',
                  padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                }}>HOST</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ゲーム設定 */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 16,
        padding: 18,
        width: '100%',
        maxWidth: 400,
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
          ゲーム設定 {!isHost && '（ホストが設定中）'}
        </p>

        {/* モード選択 */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            ゲームモード
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['tower', 'well', 'timeAttack'] as GameMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => isHost && updateSettings({ mode })}
                disabled={!isHost}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 8,
                  border: settings.mode === mode ? '2px solid var(--accent)' : '2px solid transparent',
                  background: settings.mode === mode ? 'rgba(233, 69, 96, 0.2)' : 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: isHost ? 'pointer' : 'default',
                  opacity: isHost ? 1 : 0.7,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{MODE_LABELS[mode].name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {MODE_LABELS[mode].desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* お手付きペナルティ */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            お手付きペナルティ: {(settings.penaltyCooldown / 1000).toFixed(1)}秒
          </label>
          <input
            type="range" min={0} max={MAX_PENALTY_COOLDOWN} step={100}
            value={settings.penaltyCooldown}
            onChange={(e) => isHost && updateSettings({ penaltyCooldown: Number(e.target.value) })}
            disabled={!isHost}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: isHost ? 'pointer' : 'default' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
            <span>0秒（なし）</span><span>5.0秒</span>
          </div>
        </div>

        {/* カード枚数 */}
        <div style={{ marginBottom: settings.mode === 'timeAttack' ? 14 : 0 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            使用カード枚数: {settings.cardCount === 0 ? `全て（${TOTAL_CARDS}枚）` : `${settings.cardCount}枚`}
            {settings.cardCount > 0 && settings.cardCount < minCards && ` (最低${minCards}枚)`}
          </label>
          <input
            type="range" min={0} max={TOTAL_CARDS} step={1}
            value={settings.cardCount}
            onChange={(e) => {
              if (!isHost) return;
              let val = Number(e.target.value);
              if (val > 0 && val < minCards) val = minCards;
              updateSettings({ cardCount: val });
            }}
            disabled={!isHost}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: isHost ? 'pointer' : 'default' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
            <span>全カード</span><span>{TOTAL_CARDS}枚（最低{minCards}枚）</span>
          </div>
        </div>

        {/* 制限時間 (タイムアタックのみ) */}
        {settings.mode === 'timeAttack' && (
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              制限時間: {settings.timeLimitSec}秒（{Math.floor(settings.timeLimitSec / 60)}分{settings.timeLimitSec % 60}秒）
            </label>
            <input
              type="range" min={MIN_TIME_LIMIT_SEC} max={MAX_TIME_LIMIT_SEC} step={10}
              value={settings.timeLimitSec}
              onChange={(e) => isHost && updateSettings({ timeLimitSec: Number(e.target.value) })}
              disabled={!isHost}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: isHost ? 'pointer' : 'default' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
              <span>30秒</span><span>5分</span>
            </div>
          </div>
        )}
      </div>

      {/* 開始ボタン */}
      {isHost ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {!canStart && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {settings.mode === 'timeAttack' ? '1人以上で' : '2人以上で'}ゲーム開始できます
            </p>
          )}
          <button
            className="btn-primary"
            disabled={!canStart}
            onClick={handleStart}
            style={{ opacity: canStart ? 1 : 0.5 }}
          >
            ゲーム開始
          </button>
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          ホストがゲーム開始を待っています...
        </p>
      )}
    </div>
  );
}
