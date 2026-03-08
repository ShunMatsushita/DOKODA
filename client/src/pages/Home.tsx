import { useState } from 'react';

interface Props {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
}

export default function Home({ onCreateRoom, onJoinRoom }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');

  const isNameValid = name.trim().length > 0;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'clamp(20px, 5vh, 40px)',
      padding: 20,
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(48px, 12vw, 72px)',
          fontWeight: 900,
          letterSpacing: 8,
          color: 'var(--accent)',
          textShadow: '0 0 40px rgba(233, 69, 96, 0.5)',
        }}>
          DOKODA
        </h1>
        <p style={{
          fontSize: 'clamp(18px, 5vw, 24px)',
          color: 'var(--text-secondary)',
          marginTop: 8,
        }}>
          どこだ？
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        width: '100%',
        maxWidth: 360,
      }}>
        <input
          type="text"
          placeholder="名前を入力"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          style={{ width: '100%' }}
        />

        {mode === 'select' && (
          <div style={{ display: 'flex', gap: 16, width: '100%' }}>
            <button
              className="btn-primary"
              style={{ flex: 1 }}
              disabled={!isNameValid}
              onClick={() => setMode('create')}
            >
              部屋を作る
            </button>
            <button
              className="btn-secondary"
              style={{ flex: 1 }}
              disabled={!isNameValid}
              onClick={() => setMode('join')}
            >
              参加する
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', alignItems: 'center' }}>
            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => onCreateRoom(name.trim())}
            >
              部屋を作成
            </button>
            <button
              className="btn-secondary"
              style={{ width: '100%', fontSize: 14, padding: '8px 16px' }}
              onClick={() => setMode('select')}
            >
              戻る
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="ルームコード"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              style={{ width: '100%', letterSpacing: 8, fontSize: 'clamp(18px, 5vw, 24px)' }}
            />
            <button
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={code.length !== 4}
              onClick={() => onJoinRoom(code, name.trim())}
            >
              参加
            </button>
            <button
              className="btn-secondary"
              style={{ width: '100%', fontSize: 14, padding: '8px 16px' }}
              onClick={() => setMode('select')}
            >
              戻る
            </button>
          </div>
        )}
      </div>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: 14,
        position: 'absolute',
        bottom: 20,
      }}>
        2〜8人で遊べるパーティーゲーム
      </p>
    </div>
  );
}
