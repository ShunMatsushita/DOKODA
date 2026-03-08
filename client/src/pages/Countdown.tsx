interface Props {
  count: number;
}

export default function Countdown({ count }: Props) {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}>
      <p style={{
        fontSize: 20,
        color: 'var(--text-secondary)',
        fontWeight: 700,
      }}>
        ゲーム開始まで
      </p>
      <div
        key={count}
        style={{
          fontSize: 'clamp(80px, 25vw, 120px)',
          fontWeight: 900,
          color: 'var(--accent)',
          textShadow: '0 0 60px rgba(233, 69, 96, 0.6)',
          animation: 'countPop 0.5s ease',
        }}
      >
        {count}
      </div>
      <style>{`
        @keyframes countPop {
          0% { transform: scale(2); opacity: 0; }
          50% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
