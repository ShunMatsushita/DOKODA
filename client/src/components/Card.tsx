import { useMemo } from 'react';
import type { Card } from 'dokoda-shared';
import { SYMBOLS, SYMBOL_NAMES } from '../symbols';

interface Props {
  card: Card;
  onSymbolClick?: (symbolId: number) => void;
  disabled?: boolean;
  size?: number;
}

/** カード上のシンボル配置を計算 (8個を円形に配置) */
function getSymbolLayout(count: number): Array<{ x: number; y: number; scale: number }> {
  if (count <= 0) return [];

  const positions: Array<{ x: number; y: number; scale: number }> = [];

  // 中央に1つ
  positions.push({ x: 50, y: 50, scale: 1.1 });

  // 残りを外周に配置
  const remaining = count - 1;
  const radius = 30;
  for (let i = 0; i < remaining; i++) {
    const angle = (i / remaining) * Math.PI * 2 - Math.PI / 2;
    positions.push({
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      scale: 0.8,
    });
  }

  return positions;
}

/** シンボルIDから決定的な回転角度を生成 */
function getRotation(symbolId: number, cardId: number): number {
  // 簡易ハッシュで決定的な回転
  return ((symbolId * 137 + cardId * 31) % 360);
}

export default function Card({ card, onSymbolClick, disabled, size }: Props) {
  const defaultSize = Math.min(280, typeof window !== 'undefined' ? window.innerWidth * 0.42 : 280);
  const actualCardSize = size ?? defaultSize;
  const layout = useMemo(() => getSymbolLayout(card.symbols.length), [card.symbols.length]);

  const symbolSize = actualCardSize * 0.22;

  return (
    <div
      style={{
        width: actualCardSize,
        height: actualCardSize,
        borderRadius: '50%',
        background: 'var(--card-bg)',
        border: '4px solid var(--card-border)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        userSelect: 'none',
      }}
    >
      {card.symbols.map((symbolId, index) => {
        const pos = layout[index];
        if (!pos) return null;

        const SymbolComponent = SYMBOLS[symbolId];
        if (!SymbolComponent) return null;

        const rotation = getRotation(symbolId, card.id);
        const actualScale = pos.scale;
        const actualSize = symbolSize * actualScale;

        return (
          <button
            key={symbolId}
            onClick={() => onSymbolClick?.(symbolId)}
            disabled={disabled}
            title={SYMBOL_NAMES[symbolId]}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              width: actualSize,
              height: actualSize,
              background: 'transparent',
              border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s',
              zIndex: index === 0 ? 1 : 0,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1.2)`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            }}
          >
            <SymbolComponent size={actualSize} />
          </button>
        );
      })}
    </div>
  );
}
