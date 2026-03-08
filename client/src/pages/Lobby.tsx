import { useState, useEffect, useRef, useCallback } from 'react';
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

function RoomCode({ code }: { code: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const maskedCode = '*'.repeat(code.length);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 16,
      padding: '16px clamp(16px, 5vw, 32px)',
      textAlign: 'center',
      width: '100%',
      maxWidth: 400,
    }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>
        ルームコード
      </p>
      <p style={{
        fontSize: 'clamp(32px, 10vw, 44px)',
        fontWeight: 900,
        letterSpacing: 'clamp(6px, 3vw, 12px)',
        color: 'var(--warning)',
      }}>
        {visible ? code : maskedCode}
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
        <button
          onClick={() => setVisible(!visible)}
          title={visible ? '隠す' : '表示'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            padding: '4px 8px',
            lineHeight: 1,
          }}
        >
          {visible ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>
        <button
          onClick={handleCopy}
          title={copied ? 'コピーしました' : 'コピー'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            padding: '4px 8px',
            lineHeight: 1,
          }}
        >
          {copied ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/** デバウンス付きスライダーフック: ローカル即時反映 + サーバー遅延送信 */
function useDebouncedSlider(serverValue: number, isHost: boolean, delay = 150) {
  const [local, setLocal] = useState(serverValue);
  const dragging = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // サーバー値が変わったら、ドラッグ中でなければ同期
  useEffect(() => {
    if (!dragging.current) {
      setLocal(serverValue);
    }
  }, [serverValue]);

  const onChange = useCallback((value: number, emitFn: (v: number) => void) => {
    if (!isHost) return;
    dragging.current = true;
    setLocal(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      emitFn(value);
      dragging.current = false;
    }, delay);
  }, [isHost, delay]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { value: local, onChange };
}

export default function Lobby({ room, myId }: Props) {
  const isHost = room.players.find((p) => p.id === myId)?.isHost ?? false;
  const canStart = room.settings.mode === 'timeAttack'
    ? room.players.length >= 1
    : room.players.length >= 2;
  const settings = room.settings;
  const minCards = getMinCards(settings.mode, room.players.length);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    const next = { ...settings, ...partial };
    if (next.cardCount > 0 && next.cardCount < getMinCards(next.mode, room.players.length)) {
      next.cardCount = getMinCards(next.mode, room.players.length);
    }
    socket.emit('room:settings', next);
  }, [settings, room.players.length]);

  const penaltySlider = useDebouncedSlider(settings.penaltyCooldown, isHost);
  const cardCountSlider = useDebouncedSlider(settings.cardCount, isHost);
  const timeLimitSlider = useDebouncedSlider(settings.timeLimitSec, isHost);

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
      <RoomCode code={room.code} />

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
            お手付きペナルティ: {(penaltySlider.value / 1000).toFixed(1)}秒
          </label>
          <input
            type="range" min={0} max={MAX_PENALTY_COOLDOWN} step={100}
            value={penaltySlider.value}
            onChange={(e) => penaltySlider.onChange(Number(e.target.value), (v) => updateSettings({ penaltyCooldown: v }))}
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
            使用カード枚数: {cardCountSlider.value === 0 ? `全て（${TOTAL_CARDS}枚）` : `${cardCountSlider.value}枚`}
            {cardCountSlider.value > 0 && cardCountSlider.value < minCards && ` (最低${minCards}枚)`}
          </label>
          <input
            type="range" min={0} max={TOTAL_CARDS} step={1}
            value={cardCountSlider.value}
            onChange={(e) => {
              let val = Number(e.target.value);
              if (val > 0 && val < minCards) val = minCards;
              cardCountSlider.onChange(val, (v) => updateSettings({ cardCount: v }));
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
              制限時間: {timeLimitSlider.value}秒（{Math.floor(timeLimitSlider.value / 60)}分{timeLimitSlider.value % 60}秒）
            </label>
            <input
              type="range" min={MIN_TIME_LIMIT_SEC} max={MAX_TIME_LIMIT_SEC} step={10}
              value={timeLimitSlider.value}
              onChange={(e) => timeLimitSlider.onChange(Number(e.target.value), (v) => updateSettings({ timeLimitSec: v }))}
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
